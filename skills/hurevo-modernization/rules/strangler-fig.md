---
title: Strangler Fig
impact: HIGH
tags: [modernization, strangler-fig, migration, architecture]
---

# Strangler Fig

No big-bang rewrites. Migrate one vertical slice at a time — a complete business capability end-to-end. The legacy system is the source of truth until each slice's cutover is formally signed off.

## Why

- **Risk**: A big-bang rewrite delivers zero value until completion — typically 12–18 months of risk with no fallback.
- **Validation**: Vertical slices can be validated against the legacy system in production (parallel run) before cutover, catching discrepancies early.
- **Continuity**: The business keeps operating on the legacy system while each slice is being built and tested.

## Pattern

```
# Bad — horizontal migration (big-bang layers)
Sprint 1: migrate all database tables
Sprint 2: rewrite all service classes
Sprint 3: rewrite all API controllers
Sprint 4: rewrite all UI screens
→ Nothing is usable until Sprint 4 is complete
→ Any delay pushes the entire delivery
→ No production validation until go-live

# Good — vertical slices (Strangler Fig)
Sprint 1: Invoice → Create (new DB schema + new service + new endpoint + new UI screen)
          → Legacy still serves all other invoice operations
Sprint 2: Invoice → List + Paginate
Sprint 3: Invoice → PDF Export
Sprint 4: Invoice → Mark Paid
Sprint 5: Invoice → cutover (feature flag flips, legacy invoice module decommissioned)
→ Each sprint delivers independently testable, deployable value
→ Parallel run validates correctness before cutover
→ Rollback is a single feature flag toggle
```

```php
// Feature flag routing — legacy vs new system
class InvoiceController extends Controller
{
    public function store(StoreInvoiceRequest $request): InvoiceResource
    {
        if (Feature::active('new-invoice-create')) {
            return new InvoiceResource(
                app(InvoiceService::class)->create($request->validated())
            );
        }
        // Falls through to legacy code path
        return $this->legacyCreate($request);
    }
}
```

## Rules

1. Define the vertical slice boundaries before the project starts — each slice is a complete business capability (data + logic + endpoint + UI).
2. Never horizontally split by layer (all DB, then all services, then all APIs) — always migrate end-to-end one capability at a time.
3. The legacy system is the source of truth until the parallel run period ends and the cutover is signed off by the client.
4. Use feature flags to route between legacy and new code paths — never delete legacy code before the flag has been live for ≥2 weeks.
5. Each vertical slice must have its own characterization tests before work begins (see `characterization-testing.md`).
6. Maintain a migration map: table per slice with columns: slice name, status (building / parallel-run / cutover / decommissioned), cutover date.
