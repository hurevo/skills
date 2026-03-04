---
title: Caching Strategy
impact: high
tags: [performance, caching, redis, invalidation]
---

## Why

- Caching without a TTL creates indefinitely stale data — the only fix becomes a full cache flush which causes a thundering herd
- Cache keys without namespacing collide across tenants or features, serving one user's data to another
- Caching inside a loop trades N database queries for N cache reads — still N+1, just faster

## Pattern

**Bad** — no TTL, unnamespaced key, cached inside a loop:

```php
// No TTL — cached forever
Cache::forever('user_permissions', $permissions);  // ❌

// Unnamespaced — will collide across tenants
Cache::remember('invoice_summary', 3600, fn() => $this->buildSummary());  // ❌

// Cache inside a loop — still N reads
foreach ($userIds as $userId) {
    $user = Cache::remember('user', 60, fn() => User::find($userId));  // ❌ wrong key, wrong pattern
}
```

**Good** — TTL always set, namespaced keys, cache the collection not each item:

```php
// Namespaced key with explicit TTL
$summary = Cache::remember(
    "invoice:{$invoiceId}:summary",  // namespaced, deterministic
    now()->addMinutes(30),           // explicit TTL
    fn() => $this->buildSummary($invoiceId)
);

// Cache the full collection outside the loop
$userMap = Cache::remember(
    'users:active:map',
    now()->addMinutes(5),
    fn() => User::where('active', true)->get()->keyBy('id')
);

foreach ($userIds as $userId) {
    $user = $userMap->get($userId);  // in-memory lookup — zero cache reads in the loop
}

// Event-driven invalidation — clear on write, not on a timer
class InvoiceObserver
{
    public function updated(Invoice $invoice): void
    {
        Cache::forget("invoice:{$invoice->id}:summary");
    }
}

// Multi-tenant: include tenant ID in key
$key = "tenant:{$tenantId}:user:{$userId}:permissions";
```

## Rules

1. Every `Cache::put()` or `Cache::remember()` call must have an explicit TTL — never use `Cache::forever()` for application data.
2. Cache keys must be namespaced with the entity type and ID: `invoice:{id}:summary`, `tenant:{id}:config`.
3. Cache the collection or aggregation outside the loop — never call `Cache::remember()` inside a `foreach`.
4. Invalidate cache entries in model observers or event listeners when the underlying data changes — don't rely solely on TTL expiry.
5. Use Redis for all caching in production — never file or array drivers; configure Redis with `allkeys-lru` eviction policy.
