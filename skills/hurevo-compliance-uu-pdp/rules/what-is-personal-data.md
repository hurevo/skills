---
title: What Is Personal Data Under UU PDP
impact: high
tags: [uu-pdp, personal-data, classification, indonesia]
---

## Why

- Misclassifying personal data as non-personal means applying no protections — and UU PDP penalties apply to the controller, not just the processor
- General personal data that appears harmless in isolation can constitute specific personal data when combined (NIK + medical appointment = health data linked to identity)
- The NIK (national ID number) receives elevated protection — treating it as a generic string field is a compliance failure

## Pattern

**Bad** — treating NIK as a plain string, no classification, assuming combination data is safe:

```php
// ❌ NIK stored as unencrypted plain string with no access control
Schema::table('users', function (Blueprint $table) {
    $table->string('nik', 16);  // no encryption, no audit
});

// ❌ Assuming a list of names and appointment dates is non-personal
// names + appointment dates + clinic name = health-related personal data
$export = Appointment::select('patient_name', 'appointment_date', 'clinic')->get();
// This is personal data — cannot be exported without consent and protection
```

**Good** — encrypted NIK, classified data inventory, conservative treatment:

```php
// ✅ NIK stored encrypted; access controlled and audited
Schema::table('users', function (Blueprint $table) {
    $table->text('nik_encrypted');   // AES-256 encrypted
    $table->string('nik_hash', 64);  // bcrypt/SHA-256 for lookup without decryption
});

// ✅ Data map documents classification before building the feature
/**
 * Data collected: name (general), NIK (general — elevated), appointment_date (general),
 * diagnosis_code (specific — health data)
 *
 * Combined classification: SPECIFIC personal data (health + identity)
 * Legal basis: explicit consent (consent record ID stored per row)
 * Residency: ap-southeast-3 (Jakarta)
 */

// ✅ When uncertain — treat as personal and apply full protections
// "Could this data re-identify a person if combined with other available data?"
// If yes → personal data. If unsure → personal data.
```

## Rules

1. Specific personal data (biometrics, health, financial, genetic, criminal, children's, correspondence) requires elevated protection — encrypt, strictly control access, and log all access.
2. General personal data (name, NIK, email, phone, address, DOB, IP address) requires baseline protections — encryption at rest, purpose limitation, consent.
3. NIK (national identity number) is general personal data but receives elevated handling — always encrypt at rest, never log, mask in any display.
4. Any combination of general data that can re-identify an individual must be treated as personal data — do not assume aggregation makes it safe.
5. When in doubt whether data is personal, classify it as personal and apply full UU PDP protections — the cost of over-protecting is zero; the cost of under-protecting is statutory liability.
