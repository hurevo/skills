---
title: Safe Migration Patterns
impact: high
tags: [database, migrations, laravel, alembic]
---

## Why

- Bundling multiple unrelated schema changes in one migration makes rollback all-or-nothing and impossible to bisect
- Modifying a merged migration rewrites history — developers on other branches end up with conflicting schema states
- Mixing data backfill with schema changes means a failed backfill rolls back the schema too, often leaving the table in an inconsistent state

## Pattern

**Bad** — multiple concerns in one migration, data logic mixed in:

```php
// 2024_03_01_add_status_rename_type_backfill_orders.php
public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->string('status')->default('pending');  // schema change
        $table->renameColumn('type', 'order_type');    // unrelated schema change
    });

    // ❌ data backfill in schema migration
    DB::table('orders')->whereNull('status')->update(['status' => 'legacy']);
}
```

**Good** — one change per migration, data backfill in a separate Job:

```php
// 2024_03_01_add_status_to_orders.php — schema only
public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->string('status')->nullable()->after('id');
    });
}

public function down(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->dropColumn('status');
    });
}

// app/Jobs/BackfillOrderStatus.php — data migration, dispatched separately
class BackfillOrderStatus implements ShouldQueue
{
    public function handle(): void
    {
        Order::whereNull('status')
            ->chunkById(500, function ($orders) {
                $orders->each->update(['status' => 'legacy']);
            });
    }
}

// 2024_03_02_rename_type_to_order_type.php — separate migration
public function up(): void
{
    Schema::table('orders', function (Blueprint $table) {
        $table->renameColumn('type', 'order_type');
    });
}
```

## Rules

1. One logical schema change per migration — never bundle unrelated column or table changes.
2. Every migration must have a working `down()` method; if the operation is irreversible, document it and require DBA sign-off.
3. Separate data migrations from schema migrations — run backfills as queued Jobs after the schema migration.
4. Name migrations descriptively: `create_invoices_table`, `add_status_to_orders`, not `update_orders`.
5. Never modify a migration that has already been merged to `main` — create a new corrective migration instead.
