---
title: Database Optimisation
impact: high
tags: [performance, database, n+1, indexes, queries]
---

## Why

- N+1 queries are the most common cause of slow Laravel APIs — a list of 100 orders with a relationship loop fires 101 queries instead of 2
- `SELECT *` sends unused columns over the wire on every request and prevents the database from using covering indexes
- Calling `count() > 0` forces a full aggregation scan; `exists()` short-circuits as soon as one row is found

## Pattern

**Bad** — N+1 query, SELECT *, count() > 0, loading 100k rows:

```php
// N+1: fires one query per order to load the customer
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->customer->name;  // ❌ SELECT * FROM customers WHERE id = ? (×N)
}

// SELECT * — loads all columns including blobs
$users = User::all();  // ❌ includes avatar_blob, settings_json, etc.

// count() > 0 — full aggregation
if (Order::where('user_id', $userId)->count() > 0) { ... }  // ❌

// Loading entire dataset into memory
$allOrders = Order::all();  // ❌ 500k rows → PHP OOM
foreach ($allOrders as $order) { /* ... */ }
```

**Good** — eager loading, column selection, exists(), chunking:

```php
// Eager load — 2 queries regardless of collection size
$orders = Order::with('customer:id,name')->paginate(20);

// Select only what you need
$users = User::select('id', 'name', 'email')->get();

// exists() short-circuits on first row
if (Order::where('user_id', $userId)->exists()) { ... }

// Chunk to avoid memory exhaustion
Order::where('status', 'pending')
    ->chunkById(500, function (Collection $orders) {
        $orders->each->update(['status' => 'processing']);
    });

// loadCount() for counts on loaded collections
$users = User::withCount('orders')->paginate(20);
// Each $user->orders_count is already populated — no extra queries in the loop
```

**Also** — index verification:

```sql
-- Confirm index exists on the WHERE column before deploying
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 42 AND status = 'pending';

-- If Seq Scan appears on a large table — add the index
CREATE INDEX CONCURRENTLY idx_orders_user_status ON orders (user_id, status);
```

## Rules

1. Always eager-load relationships accessed inside loops using `with()` — treat any Seq Scan on a relationship join as a bug.
2. Select only the columns the feature needs; avoid `SELECT *` in application queries.
3. Use `exists()` for existence checks and `loadCount()` for counts — never `count() > 0` in a loop.
4. Chunk large dataset operations with `chunkById(500)` — never call `all()` on a table that can grow beyond a few thousand rows.
5. Run `EXPLAIN ANALYZE` on any new query touching a table over 10k rows — add an index if a sequential scan appears.
