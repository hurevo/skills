---
title: Data Controller Obligations
impact: high
tags: [uu-pdp, consent, data-subject-rights, breach-notification]
---

## Why

- Collecting more data than needed for the stated purpose is a UU PDP violation regardless of how well it is secured
- Consent that is pre-ticked, buried in terms, or non-revocable does not meet UU PDP's explicit informed consent requirement
- Failing to notify within 14 calendar days of a breach is a separate statutory violation from the breach itself

## Pattern

**Bad** — collecting excess data, pre-ticked consent, no data subject rights:

```php
// ❌ Collecting full birthdate, gender, address, marital status for a newsletter signup
$request->validate([
    'name'           => 'required|string',
    'email'          => 'required|email',
    'birthdate'      => 'required|date',      // ❌ not needed for newsletter
    'gender'         => 'required|in:M,F',    // ❌ not needed
    'marital_status' => 'required|string',    // ❌ not needed
]);

// ❌ Consent checkbox checked by default
<input type="checkbox" name="consent" checked />
```

**Good** — minimised collection, explicit timestamped consent, rights endpoints:

```php
// ✅ Collect only what is necessary
$request->validate([
    'name'  => 'required|string|max:100',
    'email' => 'required|email',
]);

// ✅ Consent recorded with timestamp, version, and revocability
ConsentRecord::create([
    'user_id'         => $user->id,
    'purpose'         => 'marketing_newsletter',
    'consent_text_version' => 'v2.1',
    'consented_at'    => now(),
    'ip_address'      => $request->ip(),
    'revoked_at'      => null,
]);

// ✅ Data subject rights endpoints
Route::middleware('auth')->group(function () {
    Route::get('/privacy/my-data', [PrivacyController::class, 'export']);      // access
    Route::patch('/privacy/my-data', [PrivacyController::class, 'correct']);   // correction
    Route::delete('/privacy/consent/{purpose}', [PrivacyController::class, 'revokeConsent']); // withdrawal
    Route::post('/privacy/deletion-request', [PrivacyController::class, 'requestDeletion']);  // deletion
});

// ✅ Breach notification timer triggered on detection
BreachDetected::dispatch($breach);
// Listener: notify BSSN/Kominfo and affected users within 14 calendar days
```

## Rules

1. Collect only the personal data fields necessary for the stated purpose — remove any field that is "nice to have" but not required.
2. Consent must be explicit, informed, and unticked by default — record consent with a timestamp, the consent text version, and the user's IP.
3. Provide data subject rights endpoints: access (export), correction, consent withdrawal, and deletion request — these are statutory rights, not optional features.
4. Build breach detection and notification tooling before launch — the 14-day notification window starts from the moment a breach is detected, not when it is investigated.
5. Never repurpose collected personal data for a different use without obtaining new consent for that purpose.
