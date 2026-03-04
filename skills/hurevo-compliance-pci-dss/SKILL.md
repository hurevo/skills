---
name: hurevo-compliance-pci-dss
description: PCI DSS v4.0 technical requirements for Hurevo projects that handle, store, or transmit payment card data.
---

# Hurevo Compliance — PCI DSS

Apply this skill when adding payment functionality to any system, evaluating whether a system is in PCI scope, or implementing controls for a Cardholder Data Environment (CDE).

## When to Apply

- Integrating a payment processor (Stripe, Midtrans, Xendit) into any application
- Determining whether raw card data flows through the application
- Implementing webhook signature validation for payment events
- Building audit logging for payment transactions or access to cardholder data

## Compliance Rules

- **@rules/scope-reduction.md** — use hosted/tokenised flows to keep raw PANs out of the application, document the CDE boundary, confirm scope with a QSA before writing CDE code
- **@rules/cardholder-data.md** — never store CVV/CVC, mask PAN to last 4, no card data in logs/errors/URLs/browser storage, AES-256 + separated key if storing PANs
- **@rules/network-security.md** — TLS 1.2 minimum, validate webhook signatures, egress allowlist for CDE outbound connections
- **@rules/pci-access-control.md** — unique user IDs, MFA on CDE admin access, least privilege, remove access within 24h on role change, 12-month log retention

The correct default for any Hurevo payment integration is a hosted or tokenised flow (Stripe Elements, Midtrans Snap, Xendit hosted checkout). Raw PANs must never enter your server. Verify this before any payment integration begins.

CVV/CVC must never be stored — not in a database, not in a log, not in a temporary cache, not even transiently. Storing CVV after authorisation is a direct PCI DSS violation.

## Security Non-Negotiables

- Never store CVV/CVC under any circumstances — not temporarily, not encrypted, not in a queue message. After authorisation, CVV must not persist anywhere.
- Mask PANs to the last 4 digits in all displays, logs, error messages, and API responses. Never log, display, or transmit a full PAN outside of a PCI-certified system.
- Validate webhook signatures on every inbound payment event. An unvalidated webhook endpoint is a fraud vector — an attacker can forge payment success events.
- TLS 1.2 minimum for all connections in the payment flow. Downgrade attacks must be rejected.
- MFA required for all administrative access to the CDE and payment management interfaces.
- Remove access to payment systems within 24 hours of a role change or staff departure. Do not wait for the next quarterly access review.

## When Integrating a Payment Processor

1. **Confirm scope.** Determine whether raw card data (PANs, CVV) will ever transit your server. If using Stripe Elements or a hosted checkout, it should not. If it might, engage a QSA before proceeding.
2. **Use the hosted/tokenised integration path.** Integrate Stripe Elements, Midtrans Snap, or Xendit hosted checkout so that card data is entered in the processor's iframe or page — not your HTML form.
3. **Document the CDE boundary.** Draw and document which systems are in-scope for PCI (payment processing server, webhook receiver, logging system). Out-of-scope systems must not receive cardholder data.
4. **Implement webhook signature validation.** For every payment webhook endpoint, validate the signature using the processor's provided HMAC method before processing the event body. Reject unsigned or invalid webhooks with HTTP 400.
5. **Mask PANs in API responses and logs.** Any code path that returns or logs transaction details must mask the PAN to `**** **** **** 1234`. Audit all log lines in the payment flow before go-live.
6. **Set up 12-month audit log retention.** Log all payment events with timestamp, user/actor, transaction ID, action, and result. Confirm the log store is protected from modification.

## Common Mistakes to Avoid

- **Logging card data during debugging.** Adding `Log::debug($request->all())` on a payment endpoint will capture CVV and PAN in application logs. Never log the full request body on payment endpoints.
- **No webhook signature validation.** An unsigned webhook can be replayed by any attacker to forge payment success events and deliver orders without payment.
- **Storing tokens in localStorage or sessionStorage.** Browser storage is accessible to JavaScript on the same origin. Payment tokens in browser storage are vulnerable to XSS exfiltration.
- **Treating scope reduction as optional.** "We'll only store tokens, not PANs" requires verification — check with your QSA. Assumptions about PCI scope that turn out to be wrong are discovered during audits, not before.
- **Delayed access removal after role change.** A developer who leaves the team still having CDE access is a direct control failure. Access removal on same day as departure is required.
- **Mixed CDE and non-CDE systems.** Running payment processing logic on the same server as your general application inflates PCI scope to include your entire application. Isolate payment processing.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
