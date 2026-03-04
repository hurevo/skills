---
title: Zero-Downtime Migration Patterns
impact: high
tags: [database, migrations, zero-downtime, postgresql]
---

## Why

- `ALTER TABLE ADD COLUMN NOT NULL` without a default acquires an exclusive lock on PostgreSQL, blocking all reads and writes until it completes
- Renaming a column in a single deploy breaks the currently-running application version that still references the old name
- `CREATE INDEX` on a large table acquires a ShareLock, blocking writes for the entire duration of the index build

## Pattern

**Bad** — rename in one step, NOT NULL without default, blocking index:

```php
// Breaks the running app version immediately on deploy
Schema::table('orders', function (Blueprint $table) {
    $table->renameColumn('type', 'order_type');          // ❌ running code still uses 'type'
    $table->string('reference')->nullable(false);        // ❌ exclusive lock, existing rows fail
});

// Blocks writes on large table for minutes
DB::statement('CREATE INDEX idx_orders_status ON orders (status)');  // ❌ not concurrent
```

**Good** — additive-first, expand/contract for renames, concurrent indexes:

```php
// Phase 1: add new column alongside old (nullable)
Schema::table('orders', function (Blueprint $table) {
    $table->string('order_type')->nullable()->after('type');
});

// Phase 2: deploy code that writes both columns, reads new column
// (this deploy ships before the backfill)

// Phase 3: backfill Job — copies old column to new
Order::chunkById(500, fn($orders) => $orders->each(
    fn($o) => $o->update(['order_type' => $o->type])
));

// Phase 4 (next release): drop old column after code no longer references it
Schema::table('orders', function (Blueprint $table) {
    $table->dropColumn('type');
});

// Adding NOT NULL — safe pattern
Schema::table('orders', function (Blueprint $table) {
    // Step 1: nullable with default
    $table->string('reference')->nullable()->default('LEGACY')->after('id');
});
// Backfill reference values...
// Step 2 (next release): add NOT NULL constraint — no lock held on already-populated column
DB::statement('ALTER TABLE orders ALTER COLUMN reference SET NOT NULL');

// Safe index creation
DB::statement('CREATE INDEX CONCURRENTLY idx_orders_status ON orders (status)');
```

## Rules

1. Add columns as nullable first; add NOT NULL constraints in a follow-up migration after backfilling.
2. Rename columns using expand/contract: add new name → deploy dual-write code → backfill → drop old name across at least two releases.
3. Drop columns only after all code references have been removed and deployed.
4. Use `CREATE INDEX CONCURRENTLY` for new indexes on PostgreSQL production tables; never `CREATE INDEX` on a live table.
5. Never run a migration and a code deploy simultaneously on a table under active write load — stagger them.
