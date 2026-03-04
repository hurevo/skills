---
title: Engineering Principles
impact: HIGH
tags: [principles, architecture, configuration]
---

# Engineering Principles

Hurevo's brand promise is Fast, Stable, Secure. Every technical decision is evaluated against all three — none can be sacrificed for another.

## Why

- **Consistency**: Following existing patterns reduces cognitive load and onboarding time.
- **Security**: Validating at the boundary prevents entire classes of injection and data corruption bugs.
- **Stability**: Externalising config means the same binary runs in every environment without code changes.

## Pattern

```php
// Bad — business logic in controller, hardcoded config
class OrderController extends Controller
{
    public function store(Request $request)
    {
        $key = 'sk-live-abc123'; // hardcoded secret
        // validation mixed with logic
        if ($request->amount > 0) {
            $this->charge($key, $request->amount);
        }
    }
}

// Good — thin controller, config from environment, logic in service
class OrderController extends Controller
{
    public function store(StoreOrderRequest $request, OrderService $orders)
    {
        $order = $orders->create($request->validated());
        return new OrderResource($order);
    }
}

// config/services.php
'stripe' => ['key' => env('STRIPE_SECRET')],
```

## Rules

1. Weigh every decision against Fast, Stable, Secure — document trade-offs when they conflict.
2. Follow the existing codebase pattern before introducing a new abstraction.
3. Validate all input at the system boundary; never trust external data.
4. Keep functions and methods doing one thing — if it needs a paragraph to explain, split it.
5. Hard-code nothing: credentials, URLs, thresholds belong in environment config.
6. Every external integration must have a documented failure mode and fallback.
