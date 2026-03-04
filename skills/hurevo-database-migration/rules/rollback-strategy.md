---
title: Migration Rollback Strategy
impact: high
tags: [database, migrations, rollback, backups]
---

## Why

- A migration with a broken `down()` method turns a bad deploy into a data incident — you can't roll back the app without rolling back the schema
- Running a migration against production-size data for the first time during a release window is how multi-hour outages happen
- Destructive migrations (DROP COLUMN, DROP TABLE) without retained backups become unrecoverable if a bug surfaces days later

## Pattern

**Bad** — no backup check, untested down(), no runtime estimate, immediate destruction:

```php
public function up(): void
{
    Schema::dropIfExists('legacy_tokens');  // ❌ no backup taken, no grace period
}

public function down(): void
{
    // ❌ can't restore dropped table — rollback is impossible
}
```

**Good** — testable down(), runtime documented, data retained before destruction:

```php
// Migration with reversible down()
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropColumn('legacy_api_key');
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->string('legacy_api_key')->nullable();
    });
    // Note: data is not restored here — restore from the pre-migration snapshot if needed.
    // Snapshot was taken on: [date]. Stored in S3 at: backups/users_legacy_api_key_[date].csv
}
```

```bash
# Deployment runbook entry for this migration
# Migration: 2024_03_15_drop_legacy_api_key_from_users
# Estimated runtime: ~30s on production (tested on staging with 2.1M rows)
# Backup: pg_dump -t users run at 02:00 UTC, stored in S3 backup bucket
# Rollback command: php artisan migrate:rollback --step=1
# Retention: users.legacy_api_key column backup retained until 2024-04-15
```

## Rules

1. Before every production migration, confirm the automated backup ran successfully or take a manual snapshot.
2. Test `down()` against a copy of production data — not just against a dev database — before the release window.
3. Document the rollback command and estimated runtime in the deployment runbook for every migration.
4. For destructive migrations (DROP TABLE, DROP COLUMN): retain a backup of the affected data for a minimum of 30 days.
5. If a migration's `down()` cannot restore data (e.g. dropped table), explicitly document that in the migration file comment.
