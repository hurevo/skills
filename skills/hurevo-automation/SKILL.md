---
name: hurevo-automation
description: Load for n8n, Make, Zapier, or custom Laravel queue automation projects. Covers integration design, idempotency, and webhook security.
---

# Hurevo Automation

n8n, Make, Zapier, and Laravel job automation standards for Hurevo Automation & Integrations projects. Contains 4 rules covering integration design, n8n-specific practices, Laravel queues, and security.

## When to Apply

- Building or modifying automation workflows in n8n, Make, or Zapier
- Implementing custom Laravel Jobs connecting external systems
- Designing webhook ingress or egress integrations

## Rules Summary

### Integration Design (HIGH)

#### integration-design - @rules/integration-design.md

Define trigger, success state, and failure state before building. Design for partial failure. Idempotency required for all write operations.

```js
// Bad — no idempotency key on CRM write
await crm.createContact({ email, name });

// Good — idempotency key prevents duplicates on retry
await crm.createContact({ email, name }, { idempotencyKey: `contact-${userId}` });
```

### n8n Standards (HIGH)

#### n8n-standards - @rules/n8n-standards.md

Pin n8n version. Use Credentials — never hardcode keys in node parameters. One workflow per business event. Error Trigger on every production workflow.

```yaml
# Bad — latest tag, keys in node params
image: n8nio/n8n:latest

# Good — pinned version, credentials via n8n vault
image: n8nio/n8n:1.48.0
```

### Laravel Queues (HIGH)

#### laravel-queues - @rules/laravel-queues.md

Explicit `$tries`, `$backoff`, `$timeout` on every Job. `failed()` method on jobs touching external APIs. Queue names routed by concern.

```php
// Bad — no retry config, no failure handler
class SyncToCrm implements ShouldQueue {}

// Good — explicit config, failure handler
class SyncToCrm implements ShouldQueue {
    public int $tries = 3;
    public array $backoff = [30, 120, 600];
    public int $timeout = 30;

    public function failed(Throwable $e): void {
        Log::error("CRM sync failed for user {$this->userId}", ['error' => $e->getMessage()]);
    }
}
```

### Security (HIGH)

#### automation-security - @rules/automation-security.md

Validate webhook signatures before processing. Schema-validate all incoming payloads. Never log full payloads containing PII.

```php
// Bad — processes webhook without signature check
public function handle(Request $request) {
    $this->process($request->all());
}

// Good — validates signature first
public function handle(Request $request) {
    $this->verifySignature($request);
    $payload = $this->validateSchema($request->validated());
    $this->process($payload);
}
```
