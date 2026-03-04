---
title: HIPAA Security and Vendor Management
impact: high
tags: [hipaa, security, baa, vendors, breach-notification]
---

## Why

- Every vendor that touches PHI (cloud providers, monitoring tools, AI APIs) requires a signed Business Associate Agreement — "we're on a private network" does not exempt vendors from the requirement
- Test environments containing production PHI are a breach waiting to happen — they are accessed by more people with less security controls than production
- PHI in error messages is logged and often visible to third-party integrations (error tracking tools) — no error message should ever contain PHI

## Pattern

**Bad** — no BAA with vendors, production PHI in staging, PHI in error messages:

```php
// ❌ Using OpenAI API to process patient medical notes without a BAA
$summary = OpenAI::chat([
    'messages' => [
        ['role' => 'user', 'content' => "Summarise this patient's medical history: {$patient->medical_notes}"]
    ]
]);

// ❌ Production database cloned to staging — real patient data accessible to all developers
// pg_dump prod | psql staging  — HIPAA violation

// ❌ PHI in error message sent to Sentry
try {
    $this->chargeInsurance($patient->id, $amount);
} catch (PaymentException $e) {
    throw new Exception("Failed to charge insurance for patient {$patient->name}: {$e->getMessage()}");
}
```

**Good** — BAA required, synthetic staging data, no PHI in errors:

```php
// ✅ BAA signed with OpenAI before processing PHI
// Documented in: project agreement, vendor list, Data Processing Register
// OpenAI's standard BAA covers HIPAA as of 2023-04

// Only process de-identified summaries through the API
$deidentified = [
    'age'      => $patient->age,  // year of birth — no exact date
    'symptoms' => $patient->symptoms,
    // No name, no medical record number, no health plan ID
];
$summary = OpenAI::chat([
    'messages' => [['role' => 'user', 'content' => json_encode($deidentified) . "\nSummarise this patient record."]]
]);

// ✅ Staging uses Faker-generated synthetic data — no production PHI
// DatabaseSeeder.php
Patient::factory(50)->create();  // generates fake names, fake SSNs, fake diagnoses

// ✅ Error messages never contain PHI
try {
    $this->chargeInsurance($patient->id, $amount);
} catch (PaymentException $e) {
    Log::error('Insurance charge failed', ['patient_id' => $patient->id]);  // ID only
    throw new PaymentFailureException('Unable to process payment. Please contact support.');
}
```

## Rules

1. Obtain a signed Business Associate Agreement (BAA) with every vendor that processes, stores, or transmits PHI — cloud providers, monitoring tools, AI APIs, and analytics services.
2. Never store production PHI in staging, development, or test environments — use Faker-generated synthetic data exclusively in non-production.
3. Never include PHI in error messages, logs, or exception stack traces — log only non-identifying transaction IDs.
4. Configure error tracking tools (Sentry, Rollbar) to scrub PHI from error reports — or do not send HIPAA-regulated errors to third-party tools at all.
5. Build a breach detection and notification workflow before launch — the 60-day notification timeline begins when a breach is discovered, not when it is formally disclosed.
