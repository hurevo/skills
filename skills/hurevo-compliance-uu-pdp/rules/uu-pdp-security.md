---
title: UU PDP Security Controls
impact: high
tags: [uu-pdp, security, encryption, access-control, retention]
---

## Why

- Personal data in plaintext in a database is a UU PDP violation regardless of how well the perimeter is protected — encryption at rest is a baseline requirement
- Application logs that include email addresses, phone numbers, or NIKs create a secondary personal data store that is usually unprotected and never purged
- Non-production environments with copies of production personal data expose that data to developers, CI systems, and third-party tooling with no legal basis

## Pattern

**Bad** — plaintext PII, PII in logs, production data in staging:

```php
// ❌ Personal data stored unencrypted
Schema::create('patients', function (Blueprint $table) {
    $table->string('nik');          // unencrypted national ID
    $table->string('phone');        // unencrypted phone
    $table->string('medical_notes'); // health data in plaintext
});

// ❌ PII in application log
Log::info('User registered', [
    'email' => $user->email,    // ❌ PII in log
    'phone' => $user->phone,    // ❌ PII in log
    'nik'   => $user->nik,      // ❌ specific personal data in log
]);

// ❌ Production database dump used in staging
// pg_dump prod | psql staging  — real NIK, real emails, real health data in staging
```

**Good** — encrypted columns, anonymised logs, pseudonymised non-production:

```php
// ✅ Encrypted personal data columns using castable encryption
class Patient extends Model
{
    protected $casts = [
        'nik'           => EncryptedCast::class,  // AES-256 via Laravel encryption
        'phone'         => EncryptedCast::class,
        'medical_notes' => EncryptedCast::class,
    ];
}

// ✅ Log only non-personal identifiers
Log::info('User registered', ['user_id' => $user->id]);  // internal ID only

// ✅ Non-production uses Faker-generated data
// Seeder uses fake()->nik() equivalent — never copies production data to staging

// ✅ Automated retention enforcement
// RetentionPolicy job runs nightly — anonymises or deletes records past retention period
class EnforceRetentionPolicy implements ShouldQueue
{
    public function handle(): void
    {
        Patient::where('created_at', '<', now()->subYears(7))
            ->whereNull('active_treatment')
            ->each(function (Patient $p) {
                $p->update(['nik' => null, 'phone' => null, 'name' => 'ANONYMISED']);
            });
    }
}
```

## Rules

1. Encrypt personal data columns at rest using AES-256 — use Laravel's `Encrypted` cast or equivalent; never store NIK, health data, or financial data as plaintext.
2. Never include personal data fields (name, email, phone, NIK, health data) in application log entries — log internal IDs only.
3. Non-production environments (staging, dev, CI) must use Faker-generated data — never copy production personal data.
4. Define a data retention schedule for every personal data category; implement an automated job that anonymises or deletes records at end of retention period.
5. Access to personal data must be role-based, least-privilege, and logged — audit logs must record who accessed what personal data and when.
