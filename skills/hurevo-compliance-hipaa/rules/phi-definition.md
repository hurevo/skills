---
title: What Is PHI
impact: high
tags: [hipaa, phi, classification, de-identification]
---

## Why

- Engineers routinely underestimate what counts as PHI — a patient name alone is not PHI, but a patient name combined with a clinic visit date is
- Assuming data is de-identified without applying the Safe Harbor method creates false confidence and leaves PHI unprotected
- PHI in error messages and API responses is the most common HIPAA technical violation — it is invisible until an audit

## Pattern

**Bad** — treating health data without identifiers as non-PHI, returning PHI in errors:

```php
// ❌ Assuming diagnosis codes without names are not PHI
// A diagnosis code + appointment date + zip code can re-identify a patient
$analytics = DB::table('appointments')
    ->select('diagnosis_code', 'appointment_date', 'zip_code')
    ->get();
// This is likely PHI — not safe to send to analytics tools without Safe Harbor de-identification

// ❌ PHI in API error response
return response()->json([
    'error' => "Patient John Smith (MRN: 12345) has a conflicting appointment on 2026-03-15"
], 422);
```

**Good** — Safe Harbor applied, PHI classification checklist, no PHI in errors:

```php
/**
 * HIPAA Safe Harbor De-identification — 18 identifiers to remove:
 * 1. Names               10. Account numbers
 * 2. Geographic data     11. Certificate/license numbers
 *    (sub-state level)   12. Vehicle identifiers
 * 3. Dates (except year) 13. Device identifiers
 * 4. Phone numbers       14. URLs
 * 5. Fax numbers         15. IP addresses
 * 6. Email addresses     16. Biometric identifiers
 * 7. SSN                 17. Full-face photographs
 * 8. Medical record #    18. Any other unique identifier
 * 9. Health plan #
 *
 * Data is PHI if it contains health/treatment information AND any of the 18 identifiers.
 * De-identified = all 18 removed + no reasonable basis to re-identify.
 */

// ✅ PHI-safe error — no patient details
return response()->json(['error' => 'Scheduling conflict detected. Please choose a different time.'], 422);

// ✅ De-identified analytics export — year only, no sub-state geography
$analytics = DB::table('appointments')
    ->selectRaw('diagnosis_code, EXTRACT(YEAR FROM appointment_date) as year, LEFT(zip_code, 3) as zip_prefix')
    ->get();
// Still verify with compliance officer before treating as fully de-identified
```

## Rules

1. Data is PHI when it contains any health, treatment, or payment-for-healthcare information combined with any of the 18 HIPAA identifiers — evaluate both parts.
2. Dates associated with health events must be reduced to year only for de-identification — full dates (month, day) are one of the 18 identifiers.
3. Apply the Safe Harbor method explicitly to verify de-identification — do not assume aggregation or partial removal is sufficient.
4. Never include PHI in API error messages, validation errors, log entries, or URL query parameters.
5. When uncertain whether data is PHI, treat it as PHI and apply all technical safeguards — the burden of proof for de-identification is on the controller.
