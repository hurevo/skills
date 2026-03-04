---
title: Pipeline Structure
impact: high
tags: [ci-cd, github-actions, pipelines, workflows]
---

## Why

- Running lint and test sequentially doubles CI time for no benefit — they have no dependencies on each other
- Pinning actions to `@latest` or a tag means a compromised upstream action automatically runs in your pipeline with write access to your repository
- Caching `node_modules` and `vendor/` keyed to lockfile hash saves 60–120 seconds per CI run and prevents stale dependency bugs

## Pattern

**Bad** — sequential jobs, mutable action versions, no caching, `npm install`:

```yaml
# .github/workflows/ci.yml
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main          # ❌ mutable ref
      - uses: actions/setup-node@latest      # ❌ mutable ref
        with: { node-version: 20 }
      - run: npm install                     # ❌ use npm ci in CI
      - run: npm run lint                    # ❌ sequential — waits for previous step
      - run: npm run test
      - run: npm run build
```

**Good** — parallel jobs, pinned SHA versions, lockfile cache, `npm ci`:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af  # v4.1.0
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683  # v4.2.2
      - uses: actions/setup-node@39370e3970a6d050c480ffad4ff0ed4d3fdee5af  # v4.1.0
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage
      - run: npm run build

  # lint and test run in parallel — build only needed in test job
```

**Required workflows per project:**

```
ci.yml              — on push + PR to main: lint, test, build
deploy-staging.yml  — on merge to main: deploy to staging automatically
deploy-production.yml — on version tag v*.*.*: manual approval + deploy
security.yml        — weekly schedule + on dep changes: audit + container scan
```

## Rules

1. Run lint and test as parallel jobs in CI — they have no dependencies on each other.
2. Pin all GitHub Actions to a full commit SHA, not a tag or branch — add the version as a comment.
3. Use `npm ci` (never `npm install`) and `composer install --no-dev` in CI workflows.
4. Cache `node_modules` and `vendor/` keyed to the lockfile hash using the built-in `cache` key in `setup-node` / `setup-php`.
5. Every Hurevo project must have all four required workflows: `ci.yml`, `deploy-staging.yml`, `deploy-production.yml`, `security.yml`.
