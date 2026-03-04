---
title: Profiling First
impact: high
tags: [performance, profiling, measurement, tooling]
---

## Why

- Optimising without measuring leads to fixing the wrong bottleneck — perceived slowness and actual slowness rarely match
- Without a baseline measurement you cannot prove an optimisation worked, or quantify its impact for stakeholders
- Pre-optimising code that runs once in a background job wastes time that should go to user-facing hot paths

## Pattern

**Bad** — guessing, no baseline, optimising the wrong thing:

```php
// Engineer assumes the loop is slow and rewrites it in raw SQL
// Actual bottleneck was a missing index on a different table
// No before/after measurement — impossible to know if anything improved

public function getDashboardStats(): array
{
    // Rewrote this to be "more efficient" — no profiling done
    return DB::select('SELECT COUNT(*) FROM orders WHERE ...');
}
```

**Good** — instrument first, establish baseline, confirm improvement:

```php
// Step 1: instrument the slow endpoint in local/staging with Debugbar
// Laravel Debugbar shows: 47 queries, 1,240ms total
// Telescope shows the slowest query: SELECT * FROM order_items WHERE order_id = ?  (called 43 times)

// Step 2: identify root cause — N+1 on order_items
// Step 3: add eager loading
public function index(): JsonResponse
{
    $orders = Order::with('items', 'customer')->paginate(20);
    return OrderResource::collection($orders)->response();
}
// After: 4 queries, 85ms — confirmed improvement with Debugbar

// FastAPI equivalent — use py-spy for CPU profiling
// py-spy record -o profile.svg --pid $(pgrep -f uvicorn)
// Then open profile.svg in browser to see flame graph

// Frontend — run Lighthouse before and after
// Before: LCP 4.2s, CLS 0.18
// After optimisation: LCP 1.8s, CLS 0.03
// Screenshot both reports and attach to the PR
```

## Rules

1. Measure before optimising — identify the actual bottleneck with a profiling tool, not intuition.
2. Establish a numeric baseline (query count, response time, Lighthouse score) before making any change.
3. Confirm the improvement with the same tool after the change — attach before/after numbers to the PR.
4. Optimise the slowest measured path first; ignore micro-optimisations until hot paths are resolved.
5. Use the right tool per stack: Laravel Debugbar/Telescope, `py-spy`/OpenTelemetry for FastAPI, Chrome DevTools/Lighthouse for frontend.
