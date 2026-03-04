---
title: Laravel Database
impact: HIGH
tags: [database, migrations, eloquent, performance]
---

# Laravel Database

Every migration is reversible. Foreign keys are always indexed. Queries use Eloquent or Query Builder — never raw string interpolation.

## Why

- **Safety**: A working `down()` lets you roll back a bad deploy in seconds.
- **Performance**: Unindexed foreign keys cause full-table scans on joins and deletes.
- **Security**: Parameterised queries prevent SQL injection by construction.

## Pattern

```php
// Bad — no index, raw SQL with interpolation, no down()
public function up(): void
{
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('user_id'); // no ->index() or ->foreign()
        $table->timestamps();
    });
}

public function down(): void {} // empty — can't roll back

// Raw SQL with interpolation — SQL injection risk
$userId = $request->user_id;
$orders = DB::select("SELECT * FROM orders WHERE user_id = {$userId}");

// Good — indexed FK, reversible, parameterised
public function up(): void
{
    Schema::create('orders', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('orders');
}

// Good — Eloquent with eager loading
$orders = Order::with('items', 'user')
    ->where('user_id', $userId)
    ->latest()
    ->paginate(20);
```

```php
// N+1 — Bad
$orders = Order::all();
foreach ($orders as $order) {
    echo $order->user->name; // query per iteration
}

// Good — eager load
$orders = Order::with('user')->get();
foreach ($orders as $order) {
    echo $order->user->name; // no extra queries
}
```

## Rules

1. Every migration has a working `down()` that fully reverses `up()`.
2. Every `unsignedBigInteger` foreign key column must have `->foreign()` or use `->foreignId()->constrained()`.
3. Never write raw SQL — use Eloquent or Query Builder. If raw SQL is unavoidable, use `DB::select()` with bound parameters: `DB::select('SELECT * FROM orders WHERE id = ?', [$id])`.
4. Eager-load relationships with `with()` whenever iterating — prevent N+1 queries.
5. Add database indices for every column used in `WHERE`, `ORDER BY`, or `JOIN` conditions beyond the PK.
6. Never modify an existing migration that has been deployed — create a new migration instead.
7. Use `$table->softDeletes()` on any entity the client may want to recover (orders, invoices, users).
