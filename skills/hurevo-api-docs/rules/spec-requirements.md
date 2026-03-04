---
title: Spec Requirements
impact: HIGH
tags: [openapi, swagger, l5-swagger, annotations, documentation]
---

# Spec Requirements

Every public endpoint has `operationId`, `tags`, `security`, `parameters`, `requestBody`, and all possible `responses` documented. Use `l5-swagger` — don't hand-write YAML.

## Why

- **Completeness**: Incomplete specs mislead API consumers. A missing 422 response means clients don't handle validation errors correctly.
- **Annotation-driven**: Hand-written YAML drifts from the implementation. l5-swagger annotations live next to the code they document — they drift together.
- **Consumer trust**: A complete, accurate spec is the first thing a partner developer looks at. Missing or wrong docs cost days of debugging on their end.

## Pattern

```php
// Bad — undocumented endpoint
Route::post('/api/v1/invoices', [InvoiceController::class, 'store']);

// controller has no annotations
public function store(StoreInvoiceRequest $request): InvoiceResource
{
    return new InvoiceResource(app(InvoiceService::class)->create($request->validated()));
}

// Good — fully annotated with all responses documented
/**
 * @OA\Post(
 *   path="/api/v1/invoices",
 *   operationId="createInvoice",
 *   summary="Create a new invoice",
 *   tags={"Invoices"},
 *   security={{"sanctum": {}}},
 *   @OA\RequestBody(
 *     required=true,
 *     @OA\JsonContent(ref="#/components/schemas/CreateInvoiceRequest")
 *   ),
 *   @OA\Response(
 *     response=201,
 *     description="Invoice created successfully",
 *     @OA\JsonContent(ref="#/components/schemas/InvoiceResource")
 *   ),
 *   @OA\Response(response=401, ref="#/components/responses/Unauthenticated"),
 *   @OA\Response(response=403, ref="#/components/responses/Forbidden"),
 *   @OA\Response(response=422, ref="#/components/responses/ValidationError"),
 *   @OA\Response(response=500, ref="#/components/responses/ServerError")
 * )
 */
public function store(StoreInvoiceRequest $request): InvoiceResource
{
    return new InvoiceResource(app(InvoiceService::class)->create($request->validated()));
}
```

```php
// Shared responses — define in app/Virtual/Responses/ and reference everywhere
/**
 * @OA\Response(
 *   response="ValidationError",
 *   description="Validation failed",
 *   @OA\JsonContent(
 *     @OA\Property(property="error",   type="string", example="validation_error"),
 *     @OA\Property(property="message", type="string", example="The given data was invalid."),
 *     @OA\Property(property="errors",  type="object")
 *   )
 * )
 */
class ValidationErrorResponse {}
```

## Rules

1. Every public-facing endpoint must have a `@OA\` annotation before the PR is merged — undocumented endpoints are blocked at code review.
2. Required fields: `operationId` (unique), `summary`, `tags`, `security`, and every possible `response` code.
3. Document all 5 standard responses: 2xx success, 401 unauthenticated, 403 forbidden, 422 validation, 500 server error.
4. Use l5-swagger annotations in PHP docblocks — never maintain a separate `openapi.yaml` file by hand.
5. `operationId` must be globally unique and camelCase: `createInvoice`, `listInvoices`, `showInvoice`, `updateInvoice`, `deleteInvoice`.
6. Define shared error responses as reusable components in `#/components/responses/` and reference them with `ref=` — don't inline the same error schema 40 times.
7. Run `php artisan l5-swagger:generate` in CI and fail the build if it exits non-zero.
