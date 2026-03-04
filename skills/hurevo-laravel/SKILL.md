---
name: hurevo-laravel
description: Load for any Laravel 11 + PHP 8.3 project. Covers architecture, database, API standards, and security controls.
---

# Hurevo Laravel

Laravel 11 + PHP 8.3 development standards for Hurevo Custom Software Development projects. Contains 4 rules covering architecture, database, API design, and security.

## When to Apply

- Any project using Laravel 11 as the primary backend framework
- Adding new features, reviewing PRs, or debugging Laravel applications
- Paired with `hurevo-project-rules` in every session

## Rules Summary

### Architecture (HIGH)

#### laravel-architecture - @rules/laravel-architecture.md

Controllers are thin. Logic lives in Services. Use Form Requests for validation, Policies for authorisation, Jobs for deferrable work.

```php
// Bad — fat controller
public function store(Request $request) {
    $this->validate($request, [...]);
    $order = Order::create([...]);
    $this->stripe->charge($order);
    Mail::send(...);
    return response()->json($order);
}

// Good — thin controller
public function store(StoreOrderRequest $request, OrderService $orders) {
    return new OrderResource($orders->create($request->validated()));
}
```

### Database (HIGH)

#### laravel-database - @rules/laravel-database.md

Every migration has a working `down()`. Foreign keys always indexed. Never raw SQL — use Eloquent or Query Builder.

```php
// Bad — no index, nullable without reason, raw SQL
DB::select("SELECT * FROM orders WHERE user_id = {$id}");

// Good — parameterised, eager-loaded
Order::with('items')->where('user_id', $id)->get();
```

### API Design (HIGH)

#### laravel-api - @rules/laravel-api.md

API Resources for all responses, consistent error shape, versioned routes, paginated lists.

```php
// Bad — raw model array
return response()->json($order->toArray());

// Good — Resource with consistent shape
return new OrderResource($order);
```

### Security (HIGH)

#### laravel-security - @rules/laravel-security.md

Sanctum/Passport for auth, mass assignment protection on every model, file uploads stored outside public/, rate-limited auth endpoints.

```php
// Bad — no $fillable, stores in public/
$user = User::create($request->all());
$file->store('public/uploads');

// Good — explicit fillable, private storage, random filename
$user = User::create($request->only(['name', 'email', 'password']));
$path = $file->storeAs('uploads', Str::uuid(), 'private');
```
