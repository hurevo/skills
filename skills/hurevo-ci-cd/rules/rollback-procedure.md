---
title: Rollback Procedure
impact: high
tags: [ci-cd, rollback, deployment, recovery]
---

## Why

- A rollback procedure that has never been tested will fail when it is needed most — under production incident pressure
- Re-running the prior workflow tag is safer than a hotfix deploy because it uses code that has already passed all checks
- Database rollbacks are not symmetrical with application rollbacks — dropping a column added in the current release while the old app version is running will crash the old app too

## Pattern

**Bad** — no tested rollback, hotfix under pressure, rollback breaks DB:

```bash
# Incident at 14:30 — engineer attempts hotfix instead of rollback
git revert HEAD
git push origin main
# Triggers a new deploy... which takes 8 minutes... and fails because the revert has a conflict

# Or: rolls back the app but not the migration
# Old app version starts, tries to use dropped column — immediate 500 errors
```

**Good** — documented procedure, tested in staging quarterly, app-first rollback:

```bash
# Application rollback — re-run the prior successful production workflow

# 1. Find the last successful production run and its tag
gh run list --workflow=deploy-production.yml --status=success --limit=5

# 2. Re-run that workflow (uses the prior tag's code — already tested)
gh run rerun <run-id>

# Or via GitHub UI:
# Actions → Deploy Production → [prior successful run] → Re-run all jobs
```

```bash
# Database rollback — coordinate with DBA, run BEFORE application rollback if needed

# Check what migrations were applied in this release
php artisan migrate:status

# Roll back only the migrations from this release
php artisan migrate:rollback --step=2  # number = migrations applied in this release

# For destructive migrations: restore from pre-migration backup
# Backup location: s3://backups/pre-deploy-[date]-[tag].sql
pg_restore -d myapp backups/pre-deploy-2026-03-15-v1.4.2.sql
```

```yaml
# deploy-production.yml — rollback-friendly structure
jobs:
  deploy:
    steps:
      - name: Record deployment
        run: |
          echo "DEPLOYED_TAG=${{ github.ref_name }}" >> $GITHUB_STEP_SUMMARY
          echo "DEPLOYED_AT=$(date -u)" >> $GITHUB_STEP_SUMMARY
          echo "PREVIOUS_TAG=$(git describe --abbrev=0 HEAD^)" >> $GITHUB_STEP_SUMMARY
```

## Rules

1. Roll back by re-running the prior successful production deploy workflow — never push a hotfix as the first response to an incident.
2. Roll back the application before the database if both need rolling back — old app + new schema is usually safer than new app + old schema.
3. Database rollbacks require DBA involvement for any migration that dropped columns, dropped tables, or modified data.
4. Document the rollback procedure and estimated time in the deployment runbook before every production deploy.
5. Test the full rollback procedure in staging at least once per quarter — untested rollback procedures fail under incident pressure.
