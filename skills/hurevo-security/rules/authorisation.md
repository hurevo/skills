---
title: Authorisation
impact: HIGH
tags: [authorisation, policies, gates, ownership, rbac]
---

# Authorisation

Deny by default. Use Policies for all resource access. Never use client-supplied IDs to access resources without ownership verification. Log all authorisation denials.

## Why

- **Broken object-level auth (IDOR)**: The most common API vulnerability. Without ownership checks, knowing another user's invoice ID gives full access to it.
- **Deny by default**: Explicit allowlist means new endpoints start locked, not open. Forgetting to add an auth check is a significant risk if the default is open.
- **Audit trail**: Logged denials reveal probing attempts and misconfigured client applications before they become incidents.

## Pattern

```php
// Bad — no ownership check (IDOR vulnerability)
class InvoiceController extends Controller
{
    public function show(Request $request, int $invoiceId): InvoiceResource
    {
        // Any authenticated user can access any invoice by ID
        return new InvoiceResource(Invoice::findOrFail($invoiceId));
    }

    public function destroy(Request $request, int $invoiceId): Response
    {
        Invoice::findOrFail($invoiceId)->delete(); // any user can delete any invoice
        return response()->noContent();
    }
}

// Good — route model binding + Policy enforcement
class InvoiceController extends Controller
{
    public function show(Request $request, Invoice $invoice): InvoiceResource
    {
        $this->authorize('view', $invoice); // InvoicePolicy::view checks ownership
        return new InvoiceResource($invoice);
    }

    public function destroy(Request $request, Invoice $invoice): Response
    {
        $this->authorize('delete', $invoice);
        $invoice->delete();
        return response()->noContent();
    }
}

// app/Policies/InvoicePolicy.php
class InvoicePolicy
{
    public function view(User $user, Invoice $invoice): bool
    {
        return $user->id === $invoice->user_id
            || $user->hasRole('admin');
    }

    public function delete(User $user, Invoice $invoice): bool
    {
        return $user->id === $invoice->user_id
            && $invoice->status === 'draft'; // business rule: only drafts deletable
    }
}
```

```php
// Log authorisation denials — register in AuthServiceProvider
Gate::after(function (User $user, string $ability, bool|null $result, mixed $arguments) {
    if ($result === false) {
        Log::warning('Authorisation denied', [
            'user_id' => $user->id,
            'ability' => $ability,
            'model'   => class_basename($arguments[0] ?? null),
        ]);
    }
});
```

## Rules

1. Every controller action that touches a resource must call `$this->authorize()` — route middleware `auth:sanctum` is not enough.
2. Write a Policy class for every Eloquent model — never inline ownership checks in controllers.
3. Never use route parameters like `?user_id=123` to scope queries — use `auth()->id()` to get the authenticated user's ID.
4. Use route model binding (`Invoice $invoice`) — Laravel's model binding scopes to the authenticated user when combined with a Policy.
5. Deny by default in Policy methods — return `false` unless the condition is explicitly met, not `null` (which falls through to the Gate).
6. Log every authorisation denial with user ID, ability, and resource type — do not log resource content.
7. Review `php artisan route:list` before every PR — confirm every route has at least one auth middleware and a corresponding Policy check.
