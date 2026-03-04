---
title: Migration Security
impact: high
tags: [database, migrations, security, pii, secrets]
---

## Why

- Migration files are committed to version control — any credential or PII embedded in them is visible to every developer with repo access and in git history forever
- Test seeders using real PII create compliance exposure under UU PDP, GDPR, and HIPAA
- Encrypted column changes that aren't co-ordinated with the security engineer can silently break encryption, leaving data stored in plaintext

## Pattern

**Bad** — credentials in migration, real data in seeder:

```php
// migration — hardcoded connection string
public function up(): void
{
    // ❌ credential in migration file — goes into git history
    DB::connection('legacy')->statement(
        "INSERT INTO config VALUES ('db_password', 'supersecret123')"
    );
}

// DatabaseSeeder.php — real PII in test data
public function run(): void
{
    User::factory()->create([
        'email' => 'john.doe@realclient.com',  // ❌ real email
        'phone' => '+62812345678',              // ❌ real phone
        'name'  => 'John Doe',                 // ❌ real name
    ]);
}
```

**Good** — env-only secrets, anonymised test data:

```php
// Migration references env — never hardcodes
public function up(): void
{
    // Config values set via environment variables at deploy time — not in migration
    DB::table('config')->insert([
        'key'   => 'feature_flag_v2_enabled',
        'value' => '0',
    ]);
}

// DatabaseSeeder.php — faker data only
public function run(): void
{
    User::factory(50)->create();
    // Factory uses Faker — generated data, no real PII
}

// UserFactory.php
public function definition(): array
{
    return [
        'name'  => fake()->name(),
        'email' => fake()->unique()->safeEmail(),
        'phone' => fake()->e164PhoneNumber(),
    ];
}
```

## Rules

1. Migration files must never contain credentials, connection strings, API keys, or passwords — use environment variables.
2. Seeders must use `fake()` data only — no real names, emails, phone numbers, or payment details from any source.
3. Migration files are version-controlled — treat them as public; they must contain no PII from any client or environment.
4. Encrypted column changes (adding, removing, or changing the cipher) require review and sign-off from the security engineer before merging.
5. Verify migration files in code review specifically for embedded secrets before approving — automated secret scanning in CI is not a substitute for human review on migrations.
