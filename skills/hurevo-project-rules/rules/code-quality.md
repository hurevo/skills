---
title: Code Quality
impact: HIGH
tags: [quality, error-handling, readability, logging]
---

# Code Quality

Code that is easy to read, modify, and debug by any mid-level engineer on the team — without the original author present.

## Why

- **Maintainability**: Self-documenting code reduces the bus-factor risk on every feature.
- **Debuggability**: Actionable error messages turn a 2-hour investigation into a 5-minute fix.
- **Review speed**: Clean, focused functions are faster to review and less likely to harbour hidden bugs.

## Pattern

```php
// Bad — silent failure, no context
public function syncTocrm(User $user): void
{
    try {
        $this->crm->push($user);
    } catch (Exception $e) {
        // will handle later
    }
}

// Bad — function doing too many things
public function processOrder(Request $request): JsonResponse
{
    // validate + create order + charge + send email + log analytics
    // 80 lines...
}

// Good — propagated with context, single responsibility
public function syncToCrm(User $user): void
{
    try {
        $this->crm->push($user);
    } catch (CrmApiException $e) {
        throw new SyncFailedException(
            "CRM sync failed for user {$user->id}: {$e->getMessage()}",
            previous: $e
        );
    }
}

public function processOrder(ValidatedOrderData $data): Order
{
    $order = $this->orderRepo->create($data);
    $this->paymentService->charge($order);
    $this->notifier->orderConfirmed($order);
    return $order;
}
```

```php
// Bad — commented-out code in PR, unlinked TODO
// $result = $this->oldMethod($id);
$result = $this->newMethod($id);
// TODO: remove this after testing

// Good — dead code deleted, TODO linked
// TODO(PROJ-219): remove $legacyFlag after migration completes
$result = $this->newMethod($id);
```

## Rules

1. No commented-out code in merged PRs — delete it.
2. No `TODO` without a linked ticket number.
3. Functions do one thing — if it needs more than one sentence to describe, split it.
4. Error messages are actionable: state what failed and what the engineer should check.
5. Log at the correct level: `debug` for trace, `info` for state changes, `error` for failures requiring action.
6. Never catch an exception and return `null` silently — propagate with context.
