---
title: Automation Security
impact: HIGH
tags: [security, webhooks, signatures, pii, automation]
---

# Automation Security

Validate webhook signatures before processing payloads. Schema-validate all incoming data. Never log full payloads that may contain PII. Store credentials in environment variables, never in workflow exports.

## Why

- **Integrity**: Without signature validation, any actor can POST to your webhook endpoint and trigger automation with fabricated data.
- **Correctness**: An unvalidated payload from a third party can have unexpected shapes that cause downstream data corruption.
- **Compliance**: Logging raw payloads from CRMs or payment providers often captures PII — a UU PDP and GDPR violation.

## Pattern

```php
// Bad — processes without signature check, logs raw payload
class StripeWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        Log::info('Stripe webhook', $request->all()); // may contain card data
        $this->process($request->all());
        return response()->json(['ok' => true]);
    }
}

// Good — signature verified, schema validated, PII-safe logging
class StripeWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        // 1. Verify signature
        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature'),
                config('services.stripe.webhook_secret')
            );
        } catch (SignatureVerificationException $e) {
            Log::warning('Invalid Stripe webhook signature', [
                'ip' => $request->ip(),
            ]);
            return response()->json(['error' => 'invalid_signature'], 401);
        }

        // 2. Schema-validate the event type we care about
        if ($event->type !== 'payment_intent.succeeded') {
            return response()->json(['ok' => true]); // silently ignore unknown types
        }

        // 3. Log only safe identifiers — never the full payload
        Log::info('Payment intent succeeded', [
            'payment_intent_id' => $event->data->object->id,
        ]);

        // 4. Dispatch to a Job for async processing
        ProcessStripePayment::dispatch($event->data->object->id);

        return response()->json(['ok' => true]);
    }
}
```

```php
// n8n webhook — validate signature in Function node before processing
const crypto = require('crypto')

const sig = $input.first().headers['x-hub-signature-256']
const secret = $env.WEBHOOK_SECRET
const body = JSON.stringify($input.first().body)
const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex')

if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
  throw new Error('Invalid webhook signature')
}

return $input.all()
```

## Rules

1. Verify webhook signatures before any payload inspection. Use constant-time comparison (`hash_equals` in PHP, `crypto.timingSafeEqual` in Node).
2. Schema-validate incoming payloads against a known structure before passing data to downstream steps.
3. Log only safe identifiers (IDs, event types, timestamps) — never log raw payloads that may contain names, emails, card data, or NIK.
4. Store all webhook secrets and API credentials in environment variables. Never commit them to workflow exports or `.env` files in version control.
5. Return HTTP 401 for invalid signatures, HTTP 200 for unknown-but-valid events (prevents retry storms from the sender).
6. Respond to webhook endpoints within 5 seconds — dispatch to a Job for any processing that takes longer.
7. Rotate webhook secrets after any team member departure and after any suspected compromise.
