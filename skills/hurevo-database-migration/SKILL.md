---
name: hurevo-database-migration
description: Safe migration patterns, zero-downtime deployment, and rollback strategy for schema changes on Hurevo projects.
---

# Hurevo Database Migration

Apply this skill when writing or reviewing database schema migrations, planning zero-downtime deployments, or designing rollback strategies for schema changes.

## When to Apply

- Writing a Laravel migration or Alembic revision
- Planning a column rename, type change, or index addition on a live production table
- Reviewing a PR that includes schema changes
- Documenting the database steps in a deployment runbook

## Migration Rules

- **@rules/safe-migration-patterns.md** — one logical change per migration, always write a working `down()`, separate schema and data migrations
- **@rules/zero-downtime.md** — additive-first patterns: add nullable, backfill, constrain across separate releases
- **@rules/rollback-strategy.md** — snapshot before migration, test `down()` against production-volume data, 30-day data retention post-destructive migration
- **@rules/migration-security.md** — no PII in migration files, no credentials in version control, co-ordinate encrypted column changes with security

Never rename a column in a single migration on a live table. Add the new column, dual-write, backfill, then drop the old one across three separate releases.

Never run `php artisan migrate` directly in production without a pre-migration snapshot and a tested `down()` path.

Never combine a schema change and a data backfill in the same migration — schema changes are transactional, data backfills are not.

## Security Non-Negotiables

- Never include PII (names, emails, NIK, health data) in seed files or migration comments committed to version control.
- Never hardcode credentials, connection strings, or encryption keys in migration files.
- Encrypted column changes must be co-ordinated with the security team — re-encryption of existing rows is a separate, audited step.
- All destructive operations (DROP COLUMN, DROP TABLE, TRUNCATE) require a DBA sign-off and a 30-day data retention window before execution.
- Migrations that touch payment, health, or identity data require a second reviewer before merging.

## When Running a Zero-Downtime Schema Change

1. **Release 1 — Add only.** Add new nullable column or new table. Deploy application code that writes to both old and new columns simultaneously.
2. **Release 2 — Backfill.** Run a background job or batched `UPDATE` to populate the new column for existing rows. Do not lock the table; use chunked updates of ≤ 1000 rows with a small delay.
3. **Release 3 — Constrain.** Add `NOT NULL`, `UNIQUE`, or foreign key constraints once backfill is confirmed complete. Deploy application code that reads only from the new column.
4. **Release 4 — Clean up.** Drop the old column. Deploy only after Release 3 has been stable for at least one full business day.

For index creation on large tables: use `CREATE INDEX CONCURRENTLY` (PostgreSQL) or the equivalent non-locking syntax. Never create an index inside a transaction on a table with live traffic.

## Common Mistakes to Avoid

- **Writing `down()` that does nothing.** Every migration must have a tested, working rollback. A migration with an empty `down()` is unmergeable.
- **Schema + data in one migration.** If the migration fails mid-data-backfill, you cannot roll back the schema change cleanly.
- **Adding a NOT NULL column without a default.** Locks the entire table during migration on PostgreSQL < 11 and causes downtime.
- **Running migrations without a snapshot.** If `down()` fails due to data integrity issues, you have no recovery path.
- **Forgetting to update Eloquent casts.** After adding an encrypted or cast column, the model must be updated in the same PR as the migration.
- **Mixing migration concerns.** One migration = one concern. Don't add a column and remove another in the same file.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
