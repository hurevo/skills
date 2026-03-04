---
name: hurevo-project-rules
description: Load in every session on every Hurevo project. Core engineering standards that apply regardless of stack or service type.
---

# Hurevo Project Rules

Core engineering standards for all Hurevo projects. Contains 4 rules covering principles, git hygiene, code quality, and security baselines.

## When to Apply

- Every session, every project, without exception
- Before starting any task to orient to Hurevo standards
- When onboarding to a new Hurevo codebase

## Rules Summary

### Principles (HIGH)

#### engineering-principles - @rules/engineering-principles.md

Fast, Stable, Secure — every decision is weighed against all three. Follow existing patterns, validate at boundaries, never hardcode config.

```php
// Bad — hardcoded secret
$apiKey = 'sk-live-abc123';

// Good — loaded from environment
$apiKey = config('services.stripe.key');
```

### Git (HIGH)

#### git-hygiene - @rules/git-hygiene.md

One logical concern per commit. Branch naming conventions enforced. PRs require CI pass + description + ticket reference.

```bash
# Bad
git commit -m "stuff"

# Good
git commit -m "add invoice PDF export via Snappy"
```

### Code Quality (HIGH)

#### code-quality - @rules/code-quality.md

No commented-out code, no unlinked TODOs, functions do one thing, error messages are actionable.

```php
// Bad — swallowed exception
} catch (Exception $e) { /* ignore */ }

// Good — propagated with context
throw new SyncFailedException("CRM sync failed for user {$userId}", previous: $e);
```

### Security (HIGH)

#### security-baseline - @rules/security-baseline.md

No PII in logs, secrets in environment only, parameterised queries always, auth on every user-data endpoint.

```php
// Bad — PII in log
Log::info("Login: {$user->email} / {$user->password}");

// Good — identity only
Log::info("User authenticated", ['user_id' => $user->id]);
```
