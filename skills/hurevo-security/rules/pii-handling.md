---
title: PII Handling
impact: HIGH
tags: [pii, encryption, logging, gdpr, uu-pdp, data-protection]
---

# PII Handling

Encrypt PII columns at rest. Never log PII. Mask in UI by default. Define a data retention policy at project start. Cross-border transfers require documented legal basis under UU PDP.

## Why

- **Breach impact reduction**: Encrypted columns are useless to an attacker who obtains a database dump without the application key.
- **Compliance**: UU PDP (Indonesia's data protection law) and GDPR require PII to be protected, minimised, and not transferred cross-border without a legal basis.
- **Accidental exposure**: Logs are often shipped to third-party services (Datadog, Logtail). PII in logs means PII in third-party systems without consent.

## Pattern

```php
// Bad — plain text PII, logged, fully displayed
class User extends Model
{
    // nik, phone_number stored as plain text in DB
}

public function register(Request $request): JsonResponse
{
    $user = User::create($request->validated());
    Log::info("User registered: {$user->email} | NIK: {$user->nik}"); // PII in log
    return response()->json(['id' => $user->id]);
}

// UI — full display
echo $user->phone_number; // "081234567890"

// Good — encrypted at rest, safe logging, masked display
class User extends Model
{
    protected $casts = [
        'nik'          => 'encrypted', // Laravel's built-in column encryption
        'phone_number' => 'encrypted',
        'address'      => 'encrypted',
    ];

    // Mask for display
    public function getMaskedPhoneAttribute(): string
    {
        $phone = $this->phone_number;
        return substr($phone, 0, 4) . str_repeat('*', strlen($phone) - 7) . substr($phone, -3);
        // "0812*****890"
    }
}

public function register(RegisterRequest $request): JsonResponse
{
    $user = User::create($request->validated());
    Log::info('User registered', ['user_id' => $user->id]); // ID only, never PII
    return response()->json(['id' => $user->id]);
}
```

```php
// Data retention — artisan command, run via scheduler
class PruneExpiredPersonalData extends Command
{
    protected $signature = 'data:prune';

    public function handle(): void
    {
        // Retention policy: anonymise after 5 years of inactivity
        User::where('last_active_at', '<', now()->subYears(5))
            ->each(function (User $user) {
                $user->update([
                    'nik'          => null,
                    'phone_number' => null,
                    'address'      => null,
                    'anonymised_at' => now(),
                ]);
            });
    }
}

// In Console/Kernel.php
$schedule->command('data:prune')->monthly();
```

## Rules

1. Encrypt all PII columns at rest using Laravel's `'encrypted'` cast — this covers: NIK, phone number, address, date of birth, health data, financial data.
2. Email addresses are PII — store them unencrypted only if they are used as a login identifier and are indexed; otherwise encrypt.
3. Never log PII — log user IDs, not names, emails, phone numbers, or any direct identifier.
4. Mask PII in UI by default — only reveal full values on explicit user action (e.g. tap-to-reveal).
5. Define a data retention period at project start and implement an automated pruning command.
6. Document every cross-border data transfer in the project's privacy register: what data, to which country, on which legal basis under UU PDP Article 56.
7. Respond to erasure requests within 30 days — implement a `User::anonymise()` method that nulls PII fields and marks the record as anonymised.
