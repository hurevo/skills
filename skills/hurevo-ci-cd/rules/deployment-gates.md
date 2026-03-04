---
title: Deployment Gates
impact: high
tags: [ci-cd, deployment, gates, approval, migrations]
---

## Why

- Deploying to production without a manual approval gate means a bad merge to main can auto-ship to customers before anyone notices
- Running database migrations as part of application startup causes the new app version to start before the schema is ready, or leaves the schema migrated while the old app version is still running
- Deploying on Friday afternoon or before public holidays leaves no one available to respond when (not if) something goes wrong

## Pattern

**Bad** — auto-deploy to production, migrations in app start, no staging check:

```yaml
# deploy-production.yml
on:
  push:
    branches: [main]  # ❌ auto-deploys every merge to production

jobs:
  deploy:
    steps:
      - run: ./deploy.sh  # ❌ runs migrations inside the deploy script with the app
```

**Good** — version tag trigger, manual approval, migrations as a separate pre-deploy step:

```yaml
# deploy-production.yml
name: Deploy Production

on:
  push:
    tags: ['v*.*.*']  # only deploys on explicit version tags

jobs:
  approve:
    runs-on: ubuntu-latest
    environment: production  # environment has required reviewers configured in GitHub
    steps:
      - run: echo "Approval granted — proceeding with deployment"

  migrate:
    needs: approve
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683
      - name: Run database migrations
        run: php artisan migrate --force
        env:
          DB_CONNECTION: ${{ secrets.PROD_DB_CONNECTION }}

  deploy:
    needs: migrate           # app deploy only runs after migrations succeed
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy application
        run: ./scripts/deploy-app.sh
```

```yaml
# deploy-staging.yml — auto-deploys on merge to main (no approval needed)
on:
  push:
    branches: [main]
```

**Deployment schedule rules (enforced by convention):**

```
✅ Monday–Thursday before 15:00 local time
❌ Friday from 12:00 onwards
❌ The business day before a public holiday
❌ During peak traffic hours (check analytics for your client)
```

## Rules

1. Production deploys require a version tag created by the tech lead — never auto-deploy to production on every merge.
2. Require manual approval in the GitHub Actions environment before the production deploy job runs.
3. Run database migrations as a separate `migrate` job that must succeed before the `deploy` job starts.
4. Staging auto-deploys on merge to `main`; all staging checks must be green within the last 24 hours before a production deploy proceeds.
5. Never deploy to production on Friday afternoon or the day before a public holiday — schedule deploys when engineers are available to respond.
