---
name: hurevo-ci-cd
description: GitHub Actions pipeline structure, deployment gates, environment secrets, and rollback procedures for Hurevo projects.
---

# Hurevo CI/CD

Apply this skill when setting up GitHub Actions workflows, configuring deployment gates, managing environment secrets, or running a production rollback.

## When to Apply

- Creating or updating a CI/CD workflow for a Hurevo project
- Reviewing a PR that modifies `.github/workflows/`
- Planning a production deployment including database migrations
- Running or testing a rollback procedure

## Pipeline Rules

- **@rules/pipeline-structure.md** — four required workflows: `ci.yml`, `deploy-staging.yml`, `deploy-production.yml`, `security.yml`; parallelise lint and test; pin action versions to SHA
- **@rules/deployment-gates.md** — staging auto-deploys on merge to main; production requires version tag + manual approval + staging green in last 24h; migrations run before app deploy
- **@rules/ci-security.md** — pin third-party actions to commit SHA; never echo secrets; no `.env` in artifacts; run container CVE scan; restrict `GITHUB_TOKEN` permissions
- **@rules/rollback-procedure.md** — rollback by re-running prior successful workflow tag; database rollback requires DBA involvement; test rollback in staging once per quarter

Every workflow must define explicit `permissions:` at the top level. Default to `contents: read`. Grant additional permissions only where required — never `write-all`.

Pin every third-party action to a full commit SHA, not a tag. Tags are mutable; a compromised tag can execute arbitrary code in your pipeline.

## Security Non-Negotiables

- Never print secrets in workflow steps. `echo ${{ secrets.FOO }}` exposes the value to the runner log.
- Never commit `.env` files or export them as artifacts. Use GitHub Encrypted Secrets or a secrets manager.
- All production deployments require at least one manual approval gate in the `environment:` protection rules.
- Run `trivy` or `docker scout` CVE scan on every image build. Fail the pipeline on `CRITICAL` severity findings.
- Restrict `GITHUB_TOKEN` permissions explicitly — do not rely on the repository-level default setting.
- Secrets must never be passed as plain environment variables to container steps — use `--env-file` or mounted secrets.

## When Setting Up a New Project Pipeline

1. Create `ci.yml` — triggers on `push` and `pull_request` to any branch. Jobs: `lint` and `test` in parallel, `build` (if applicable) after both pass.
2. Create `deploy-staging.yml` — triggers on merge to `main`. Requires `ci` workflow to pass. Runs `php artisan migrate --force` before deploying the new image.
3. Create `deploy-production.yml` — triggers on `v*` tag push. Requires manual approval in the `production` environment. Requires `deploy-staging` green within last 24 hours. Runs migrations before deploying.
4. Create `security.yml` — triggers on schedule (weekly) and on PRs touching `Dockerfile` or `composer.json`/`package.json`. Jobs: dependency audit (`composer audit`, `npm audit`), container CVE scan.
5. Configure GitHub environment protection rules: `production` environment requires named reviewers, wait timer of 5 minutes, and branch restriction to `v*` tags only.
6. Pin all `uses:` references to commit SHA. Use `@` notation with a comment noting the pinned version for readability.

## Common Mistakes to Avoid

- **Using `latest` tags for actions.** `actions/checkout@v4` is mutable. Use the full SHA with a comment: `actions/checkout@abc123 # v4.1.0`.
- **Running migrations after app deploy.** Always run migrations first. Deploying a new app version before the schema is ready causes runtime errors.
- **Skipping manual approval for production.** Automated production deploys with no human gate are not acceptable on client projects.
- **Caching secrets in job outputs.** Never use `set-output` or `GITHUB_OUTPUT` to pass secret values between jobs — they appear in the workflow log.
- **Broad `GITHUB_TOKEN` permissions.** If a workflow only reads code and pushes a Docker image, it should not have `write` permission to issues or pull requests.
- **Ignoring CVE scan failures.** Container CVE scan findings on `CRITICAL` must block the build, not just warn.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
