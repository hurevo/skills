---
name: hurevo-api-docs
description: Load when generating or reviewing API documentation. OpenAPI 3.0 standards for all Hurevo public and partner-facing APIs.
---

# Hurevo API Docs

OpenAPI 3.0 documentation standards for Hurevo projects. Contains 3 rules covering spec requirements, schema design, and workflow.

## When to Apply

- Adding a new API endpoint
- Modifying an existing endpoint contract
- Reviewing a PR that changes request or response shapes

## Rules Summary

### Spec Requirements (HIGH)

#### spec-requirements - @rules/spec-requirements.md

Every public endpoint has `operationId`, `tags`, `security`, `parameters`, `requestBody`, and all possible `responses`. Use `l5-swagger` — don't write YAML by hand.

```php
// Bad — undocumented endpoint
Route::post('/invoices', [InvoiceController::class, 'store']);

// Good — fully annotated
/**
 * @OA\Post(
 *   path="/api/v1/invoices",
 *   operationId="createInvoice",
 *   tags={"Invoices"},
 *   security={{"sanctum": {}}},
 *   @OA\RequestBody(required=true, @OA\JsonContent(ref="#/components/schemas/CreateInvoiceRequest")),
 *   @OA\Response(response=201, description="Created", @OA\JsonContent(ref="#/components/schemas/InvoiceResource")),
 *   @OA\Response(response=422, ref="#/components/responses/ValidationError")
 * )
 */
```

### Schema Design (HIGH)

#### schema-design - @rules/schema-design.md

Named components under `#/components/schemas` — never inline. Document all nullable fields with why. Use string enums, never undocumented integer codes. Paginated lists document meta and links.

```yaml
# Bad — inline schema, integer enum codes, no pagination meta
responses:
  '200':
    content:
      application/json:
        schema:
          type: object
          properties:
            status: { type: integer }  # what does 2 mean?

# Good — named component, string enum, pagination documented
components:
  schemas:
    InvoiceResource:
      properties:
        status:
          type: string
          enum: [draft, sent, paid, overdue]
        paid_at:
          type: string
          format: date-time
          nullable: true
          description: "Null until payment is confirmed"
```

### Workflow (MEDIUM)

#### docs-workflow - @rules/docs-workflow.md

Define request and response schemas before writing the endpoint. Run `l5-swagger:generate` and verify in Swagger UI. Commit the spec alongside the implementation PR.

```bash
# After adding annotations
php artisan l5-swagger:generate

# Verify spec matches implementation
curl -X POST http://localhost/api/v1/invoices \
  -H "Authorization: Bearer {token}" \
  -d '{"client_id": 1, "amount": 5000000}'
# Confirm response matches documented schema
```
