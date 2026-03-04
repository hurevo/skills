---
title: Laravel API Design
impact: HIGH
tags: [api, resources, versioning, pagination, errors]
---

# Laravel API Design

API Resources for all responses, consistent error shapes, versioned routes, and paginated collection endpoints.

## Why

- **Stability**: Resources decouple your database schema from the API contract — you can rename a column without breaking clients.
- **Predictability**: A consistent error shape lets consumers handle errors generically.
- **Evolvability**: Route versioning (`/api/v1/`) allows breaking changes without disrupting existing integrations.

## Pattern

```php
// Bad — raw model, inconsistent error, unversioned route
Route::post('/invoices', [InvoiceController::class, 'store']);

public function store(Request $request): JsonResponse
{
    $invoice = Invoice::create($request->all());
    return response()->json($invoice->toArray()); // exposes DB columns directly
}

// Error — inconsistent shape
return response()->json(['msg' => 'not found'], 404);

// Good — versioned route, Resource, consistent error handler
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::apiResource('invoices', InvoiceController::class);
});

// InvoiceController
public function store(StoreInvoiceRequest $request, InvoiceService $invoices): InvoiceResource
{
    return new InvoiceResource($invoices->create($request->validated()));
}

public function index(): AnonymousResourceCollection
{
    return InvoiceResource::collection(
        Invoice::with('client')->paginate(20)
    );
}

// app/Http/Resources/InvoiceResource.php
class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'status'     => $this->status,
            'amount_idr' => $this->amount,
            'client'     => new ClientResource($this->whenLoaded('client')),
            'created_at' => $this->created_at->toIso8601String(),
        ];
    }
}
```

```php
// Consistent error shape — register in app/Exceptions/Handler.php
$this->renderable(function (ModelNotFoundException $e) {
    return response()->json([
        'error'   => 'not_found',
        'message' => 'The requested resource does not exist.',
    ], 404);
});
```

## Rules

1. All API routes live under `/api/v1/` — never unversioned.
2. Use `Route::apiResource()` for CRUD — it generates the 5 standard routes.
3. Every response goes through an API Resource — never `->toArray()` or raw `response()->json($model)`.
4. Collection endpoints must be paginated — `paginate(20)` default, never `->get()` on unbounded queries.
5. Error responses use a consistent shape: `{ "error": "snake_case_code", "message": "Human readable." }`.
6. Return the correct HTTP status: 201 for creates, 204 for deletes, 422 for validation, 404 for not found, 401 for unauthenticated, 403 for unauthorised.
7. Document every endpoint with l5-swagger annotations before the PR is merged (see `hurevo-api-docs`).
