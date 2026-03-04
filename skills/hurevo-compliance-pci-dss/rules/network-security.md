---
title: PCI DSS Network and Transmission Security
impact: high
tags: [pci-dss, tls, webhook, network, egress]
---

## Why

- Payment webhooks without signature validation allow an attacker to forge a successful payment notification — the application will credit the customer without the processor actually capturing the payment
- TLS 1.0 and 1.1 are cryptographically broken — PCI explicitly requires TLS 1.2+ for all cardholder data transmission
- Allowing outbound connections from the Cardholder Data Environment to arbitrary destinations allows exfiltration of card data — an egress allowlist prevents this

## Pattern

**Bad** — no webhook signature validation, TLS 1.0 allowed, unrestricted egress:

```php
// ❌ Webhook endpoint accepts any POST without signature validation
Route::post('/webhooks/payment', function (Request $request) {
    $data = $request->json();
    if ($data['event'] === 'charge.success') {
        Order::find($data['order_id'])->markPaid();  // ❌ trusts webhook without verification
    }
});

// ❌ TLS configuration allows old protocols
// nginx.conf
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;  // v1.0 and v1.1 are prohibited by PCI
```

**Good** — validated webhooks, TLS 1.2+ enforced, egress allowlist:

```php
// ✅ Webhook signature validation using HMAC
Route::post('/webhooks/payment', function (Request $request) {
    $payload = $request->getContent();
    $signature = $request->header('X-Stripe-Signature');

    try {
        $event = Stripe\Webhook::constructEvent(
            $payload,
            $signature,
            config('services.stripe.webhook_secret')
        );
    } catch (\UnexpectedValueException $e) {
        return response()->json(['error' => 'Invalid signature'], 403);
    } catch (\Stripe\Exception\SignatureVerificationException $e) {
        return response()->json(['error' => 'Signature verification failed'], 403);
    }

    // Only process events with valid signature
    if ($event->type === 'charge.succeeded') {
        Order::find($event->data->object->metadata->order_id)->markPaid();
    }

    return response()->json(['status' => 'received']);
});

// ✅ TLS 1.2 minimum enforced
// nginx.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

// ✅ Egress allowlist for CDE outbound connections
# Security group for payment processing servers
resource "aws_security_group" "payment_cde" {
  name = "payment-cde"

  # Outbound: only to payment processors
  egress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [
      "52.84.0.0/15",        # Stripe IP range — document all approved destinations
      "103.10.200.0/22",     # Midtrans IP range
    ]
  }

  # All other egress denied
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []  # Explicitly empty — deny all by default
  }
}
```

## Rules

1. Validate webhook signatures using HMAC-SHA256 (or the processor's equivalent) before processing any event — never trust a webhook without signature verification.
2. Require TLS 1.2 or higher for all cardholder data transmission — disable TLS 1.0, 1.1, and all weak cipher suites.
3. Implement an egress allowlist for the Cardholder Data Environment — restrict outbound connections to known, documented payment processor IPs only.
4. Test webhook signature validation — attempt to replay or forge a webhook and confirm it is rejected.
5. Log all webhook events including failures and validation errors — but never log the webhook payload content (it may contain PANs or other sensitive data).
