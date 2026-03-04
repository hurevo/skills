---
title: Modernization Security
impact: HIGH
tags: [security, migration, authentication, credentials, compliance]
---

# Modernization Security

Replace legacy auth schemes — never port MD5 passwords or custom session tokens. Rotate all credentials before the parallel run begins. Audit data access patterns for UU PDP compliance before migration.

## Why

- **Password security**: Legacy systems often use MD5 or SHA1 for password hashing. Porting these hashes to a new system carries the weakness forward. The migration is the opportunity to upgrade.
- **Credential hygiene**: Legacy systems accumulate long-lived API keys and database passwords. Starting the new system with fresh credentials limits blast radius from any legacy credential compromise.
- **Compliance**: Migrating data is a processing activity under UU PDP. The migration itself requires a legal basis and must not create new cross-border transfers without consent.

## Pattern

```php
// Bad — porting legacy MD5 hashes as-is
class User extends Authenticatable
{
    // Carries the insecure hash forward into the new system
    public function validatePassword(string $input): bool
    {
        return md5($input) === $this->password; // legacy MD5
    }
}

// Good — on-login migration strategy
class AuthService
{
    public function authenticate(string $email, string $password): ?User
    {
        $user = User::where('email', $email)->first();
        if (! $user) return null;

        // Check if this user still has a legacy hash
        if ($user->password_scheme === 'md5_legacy') {
            if (md5($password) !== $user->legacy_password_hash) return null;

            // Silently upgrade to bcrypt on successful login
            $user->update([
                'password'        => Hash::make($password),
                'password_scheme' => 'bcrypt',
            ]);
            return $user;
        }

        // Standard bcrypt path for already-migrated users
        return Hash::check($password, $user->password) ? $user : null;
    }
}
```

```php
// Credential rotation checklist — run before parallel run begins
// 1. Generate new database password
//    ALTER USER app_user WITH PASSWORD 'new-strong-random-password';

// 2. Generate new application encryption key
//    php artisan key:generate --force  (on new system only)

// 3. Rotate all third-party API keys (Stripe, Midtrans, SendGrid, etc.)
//    - Log into each provider
//    - Generate new key
//    - Update .env on new system
//    - Revoke old key only after new system is confirmed working

// 4. Generate fresh JWT/Sanctum secrets
//    php artisan sanctum:prune-expired
```

```php
// UU PDP compliance check before migration
// Ask these questions for every data table being migrated:
// 1. Is there a legal basis for processing this data? (consent / contract / legal obligation)
// 2. Is this data used across borders? (requires documented legal basis)
// 3. Does the retention period change in the new system? (notify data subjects if so)
// 4. Are there deletion requests (right to erasure) pending on this data?
//    If yes — honour them before migrating, not after.
```

## Rules

1. Never port MD5, SHA1, or custom session token schemes to the new system — use bcrypt (cost ≥12) and implement an on-login upgrade path.
2. Rotate all database passwords, API keys, and encryption keys before the parallel run begins — use fresh credentials on the new system.
3. Audit every data table being migrated against UU PDP requirements: legal basis, retention period, cross-border transfer, pending erasure requests.
4. Remove legacy admin backdoors, hardcoded test credentials, and debug routes before the new system accepts any production traffic.
5. Document the auth migration strategy in the project wiki: which users have been migrated, which are on the upgrade path, and when legacy hashes will be force-expired.
6. Force-expire all legacy password hashes 90 days after the new system goes live — users who haven't logged in will reset via email.
