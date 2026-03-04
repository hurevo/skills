---
title: Data Localisation
impact: high
tags: [uu-pdp, data-localisation, cloud, indonesia]
---

## Why

- Personal data of Indonesian citizens stored on servers outside Indonesia without a legal basis is a direct UU PDP violation — not a grey area
- Provisioning in the wrong AWS/GCP region during initial setup is a mistake that is expensive to remediate post-launch
- Sending personal data to offshore AI APIs (OpenAI, Anthropic) without documented legal basis is a common oversight on AI-assisted features

## Pattern

**Bad** — wrong region, offshore AI with no legal basis, undocumented:

```php
// ❌ AWS Singapore — not Indonesia
$bucket = new S3Client(['region' => 'ap-southeast-1']);

// ❌ Sending patient name and NIK to OpenAI without legal basis
$response = $openai->chat([
    'messages' => [['role' => 'user', 'content' => "Summarise health record for {$patient->name}, NIK: {$patient->nik}"]],
]);
// OpenAI servers are in the US — this transmits personal data offshore without basis
```

**Good** — Jakarta region confirmed, AI calls with anonymised data or documented basis:

```php
// ✅ AWS Jakarta — ap-southeast-3 for Indonesian citizen data
$bucket = new S3Client(['region' => 'ap-southeast-3']);

// ✅ GCP Jakarta — asia-southeast2
$storage = new StorageClient(['projectId' => $project, 'keyFilePath' => $keyFile]);
// Region set in bucket creation: 'asia-southeast2'

// ✅ AI API — send anonymised/pseudonymised data only
$anonymisedRecord = [
    'record_id'   => $record->id,          // internal ID — not a UU PDP identifier
    'symptoms'    => $record->symptoms,    // health data without identity linkage
    // name, NIK, email stripped — not sent to offshore API
];
$response = $openai->chat([...anonymised content...]);

// ✅ If personal data must be sent offshore — document legal basis in project agreement
// Legal basis: standard contractual clauses signed with OpenAI on [date]
// Recorded in: Data Processing Register, entry #47
// Approved by: DPO on [date]
```

## Rules

1. Personal data of Indonesian citizens must be stored on servers physically located in Indonesia — use `ap-southeast-3` (AWS Jakarta) or `asia-southeast2` (GCP Jakarta).
2. Confirm the storage region before provisioning any cloud resource that will hold personal data — region mismatches are not easily corrected post-launch.
3. Do not send personal data to offshore AI APIs (OpenAI, Anthropic, etc.) without a documented legal basis — either strip/pseudonymise the data first, or obtain standard contractual clauses and document them.
4. Any offshore data transfer must be recorded in the project's Data Processing Register with the legal basis, destination country, and approval from the DPO.
5. Azure Southeast Asia (Singapore) requires additional legal basis — it is not automatically compliant; confirm with the client's compliance officer before use.
