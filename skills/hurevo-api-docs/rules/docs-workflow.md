---
title: Docs Workflow
impact: MEDIUM
tags: [workflow, swagger, l5-swagger, ci, review]
---

# Docs Workflow

Define request and response schemas before writing the endpoint. Run `l5-swagger:generate` and verify in Swagger UI. Commit the generated spec alongside the implementation in the same PR.

## Why

- **Schema-first**: Defining the schema before writing code clarifies the API contract with the team and the client — misunderstandings surface in a 5-minute review, not after a 3-day implementation.
- **Generated spec in repo**: The committed `openapi.json` makes spec changes visible in PR diffs — reviewers can see exactly what changed in the API contract without reading PHP annotations.
- **Swagger UI verification**: The generated spec is not always what you intended. Reviewing in Swagger UI catches annotation mistakes before they reach clients.

## Pattern

```bash
# Step 1 — Before writing the endpoint, define schemas in app/Virtual/
# (create placeholder controller with just the annotation, no implementation)

# Step 2 — Generate and preview
php artisan l5-swagger:generate
# Opens at: http://localhost/api/documentation

# Step 3 — Verify in Swagger UI:
# - All request fields visible with correct types
# - All response shapes correct
# - All example values populated
# - Auth (padlock icon) works

# Step 4 — Write the implementation
# (annotation is already in place from Step 1)

# Step 5 — Regenerate and verify the final spec matches implementation
php artisan l5-swagger:generate

# Step 6 — Commit generated spec with implementation
git add storage/api-docs/api-docs.json
git add app/Http/Controllers/Api/V1/InvoiceController.php
git commit -m "add invoice create endpoint with OpenAPI spec"
```

```php
// app/Virtual/Schemas/Requests/CreateInvoiceRequest.php
// Written BEFORE the real FormRequest — defines the contract

/**
 * @OA\Schema(
 *   schema="CreateInvoiceRequest",
 *   required={"client_id", "line_items"},
 *   @OA\Property(property="client_id",   type="integer", example=12),
 *   @OA\Property(
 *     property="line_items",
 *     type="array",
 *     @OA\Items(ref="#/components/schemas/LineItemInput")
 *   ),
 *   @OA\Property(property="due_date", type="string", format="date", example="2024-04-30"),
 *   @OA\Property(property="notes",    type="string", nullable=true, maxLength=500)
 * )
 */
class CreateInvoiceRequest {}
```

```yaml
# PR checklist for any endpoint change
# - [ ] Schema defined in app/Virtual/ before implementation
# - [ ] php artisan l5-swagger:generate runs without errors
# - [ ] Spec verified in Swagger UI (all fields, all responses)
# - [ ] storage/api-docs/api-docs.json committed in this PR
# - [ ] Any breaking change noted in PR description
```

## Rules

1. Define request and response schemas in `app/Virtual/` before writing the endpoint implementation.
2. Run `php artisan l5-swagger:generate` and open Swagger UI to verify before writing any implementation code.
3. Commit `storage/api-docs/api-docs.json` in the same PR as the endpoint — reviewers must be able to see spec changes in the diff.
4. Run `php artisan l5-swagger:generate` in CI — fail the build if it exits non-zero.
5. If an endpoint change breaks the existing spec (changes a required field, removes a field, changes a type), mark the PR as "breaking change" and notify affected consumers before merging.
6. Keep Virtual schema classes in `app/Virtual/Schemas/Requests/` and `app/Virtual/Schemas/Resources/` — don't mix them into the controller file.
7. Review the full Swagger UI for the affected tag after every PR that changes endpoint annotations — not just the individual endpoint.
