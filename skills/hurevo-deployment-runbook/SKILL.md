---
name: hurevo-deployment-runbook
description: Pre-deploy checklist, smoke tests, rollback procedures, and post-deploy monitoring for Hurevo production deployments.
---

# Hurevo Deployment Runbook

Apply this skill when preparing a production deployment, during the deployment window, or when a rollback is needed.

## When to Apply

- Creating a release tag and preparing for a production deploy
- Running the deployment workflow and monitoring it
- Executing smoke tests immediately after a deploy
- Rolling back to a previous version in response to an incident
- Documenting deployment-specific procedures in a runbook

## Deployment Rules

- **@rules/pre-deploy-checklist.md** — CI green, staged tested, migrations reviewed, backup confirmed, rollback documented, on-call assigned, not Friday/eve-of-holiday
- **@rules/deployment-steps.md** — tag and push, approve the manual gate, migrations first, monitor deploy, smoke tests within 5 minutes
- **@rules/smoke-tests.md** — health check, auth test, core flow, background jobs, integrations, error rate spike
- **@rules/rollback-procedure.md** — app-only rollback via re-run prior tag, migration rollback includes down() step, escalate if rollback fails

Never deploy to production on Friday afternoon or on the eve of a public holiday. The support capacity needed to handle an incident does not exist at those times.

Never run database migrations after deploying the application code. Migrations must run first. A new application version deployed before its required schema exists will produce runtime errors immediately.

## Security Non-Negotiables

- Never deploy directly to production by pushing code or running commands on the production server. All production changes must go through the CI/CD pipeline with the documented approval gate.
- Credentials and secrets for production must never appear in deployment scripts, commit messages, Slack messages, or runbook documents. Reference secret names; never include values.
- Every production deployment must have an assigned on-call engineer who can respond to an incident within 15 minutes of the deploy completing.
- Post-deploy: monitor error rate and response time for at least 30 minutes before the deployment is considered stable. Do not mark the deploy as done and log off immediately.

## When Executing a Production Deployment

1. **Pre-deploy gate (day before).** Confirm: CI is green on the release branch, the build has been tested on staging within the last 24 hours, migrations have been reviewed and tested on a staging snapshot, database backup is confirmed current, and the rollback procedure is documented in the release ticket.
2. **Confirm deployment window.** Not Friday, not eve of holiday, not during a client's peak business hours. If the team is not available to monitor for 2 hours post-deploy, defer.
3. **Create and push the release tag.** Tag follows `vMAJOR.MINOR.PATCH`. The tag push triggers the production deployment workflow in CI/CD.
4. **Approve the manual deployment gate.** Review the deployment summary in the CI/CD system. Confirm the correct tag and confirm migrations are listed. Approve.
5. **Monitor migrations.** Watch the migration step in the workflow. If a migration fails, the deployment must stop and the database must be assessed before the rollback decision is made.
6. **Monitor the application deploy.** Watch container health checks pass. Confirm new containers are receiving traffic. Monitor error rate in the APM/logging system.
7. **Run smoke tests within 5 minutes.** Execute the smoke test checklist: health endpoint, auth flow, one core business flow, background job visibility, integration endpoint response, error rate in monitoring. If any smoke test fails, initiate rollback immediately.
8. **Declare stable after 30 minutes.** If error rate is nominal and no incidents have been raised, close the deployment window and note the stable time in the release ticket.

## Common Mistakes to Avoid

- **Skipping staging validation before production.** "It works on my machine" is not staging validation. The build that deploys to production must have been run end-to-end on staging with production-like data.
- **Deploying without a documented rollback path.** Every deployment must have a written rollback procedure before it executes. If rollback requires manual database intervention, that procedure must be ready before deploy starts.
- **No on-call assigned post-deploy.** A deployment with no one monitoring it for the first 30 minutes means a critical error may not be detected until users start reporting it.
- **Running migrations after the app deploy.** New application code that requires schema changes will throw errors from the moment it starts until the migration runs. Migrations always go first.
- **Approving the deploy gate without reading the migration diff.** The manual gate exists to catch problems before they reach production. A rubber-stamp approval defeats its purpose.
- **Deploying to production on a Friday.** A deployment that causes an incident at 4pm Friday will require weekend emergency response. The risk is never worth it.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
