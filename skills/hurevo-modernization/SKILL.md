---
name: hurevo-modernization
description: Load for Legacy System Modernization projects. Covers Strangler Fig pattern, characterization testing, parallel run, and cutover procedures.
---

# Hurevo Modernization

Strangler Fig pattern and safe legacy migration standards for Hurevo Legacy System Modernization projects. Contains 4 rules covering approach, characterization testing, parallel run, and security.

## When to Apply

- Any legacy system migration or rewrite engagement
- Before touching any legacy code for the first time
- When planning a feature flag cutover or decommission

## Rules Summary

### Approach (HIGH)

#### strangler-fig - @rules/strangler-fig.md

No big-bang rewrites. Migrate one vertical slice at a time — business capability end-to-end. Legacy system is the source of truth until cutover is signed off.

```
# Bad — horizontal migration
Sprint 1: migrate all DB tables
Sprint 2: rewrite all services
Sprint 3: rewrite all endpoints
→ Nothing works until Sprint 3 ends

# Good — vertical slices (Strangler Fig)
Sprint 1: migrate Invoice → Create slice (DB + service + endpoint)
Sprint 2: migrate Invoice → List slice
Sprint 3: migrate Invoice → PDF Export slice
→ Each slice is testable and deployable independently
```

### Characterization Testing (HIGH)

#### characterization-testing - @rules/characterization-testing.md

Write characterization tests before touching any legacy code. Capture real production behaviour — including bugs. These tests define the contract for the new system.

```php
// Characterization test — documents current behaviour, warts and all
it('returns zero totals for orders with NULL item prices (legacy bug)', function () {
    $order = Order::factory()->withNullPriceItems()->create();
    $result = $legacyOrderService->calculateTotal($order->id);
    // Bug: legacy returns 0 instead of throwing — we must match this
    expect($result)->toBe(0);
});
```

### Parallel Run (HIGH)

#### parallel-run - @rules/parallel-run.md

Every migrated slice runs in parallel — old and new — for minimum 2 weeks before cutover. Compare outputs automatically. Log all discrepancies, even harmless ones.

```php
// Parallel run comparison
$legacyResult = $legacyService->calculate($input);
$newResult = $newService->calculate($input);

if ($legacyResult !== $newResult) {
    Log::warning('Parallel run discrepancy', [
        'input' => $input,
        'legacy' => $legacyResult,
        'new' => $newResult,
    ]);
}

return $useNewSystem ? $newResult : $legacyResult;
```

### Security (HIGH)

#### modernization-security - @rules/modernization-security.md

Replace legacy auth schemes — never port MD5 passwords or custom session tokens. Rotate all credentials before parallel run begins. Audit data access patterns for UU PDP compliance before migration.

```php
// Bad — porting legacy auth as-is
$hash = md5($password); // legacy scheme carried forward

// Good — new system uses modern hashing
$hash = Hash::make($password); // bcrypt cost ≥ 12
// Legacy users migrated on next login with password re-hash
```
