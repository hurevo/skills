---
name: hurevo-code-review
description: Code review standards, what to block, PR size limits, and review etiquette for Hurevo engineering teams.
---

# Hurevo Code Review

Apply this skill when reviewing a pull request, setting up branch protection rules, or coaching an engineer on review standards.

## When to Apply

- Reviewing any pull request on a Hurevo project
- Assessing whether a PR meets the definition of mergeable
- Handling a security-sensitive PR (auth, payments, PII, file uploads)
- Setting repository branch protection and CI requirements

## Review Rules

- **@rules/review-checklist.md** — correctness, tests, security, performance, error handling, secrets, API contracts, documentation — check all eight on every PR
- **@rules/what-to-block.md** — hardcoded credentials, SQL injection, missing auth, silent catch blocks, PII in logs, always-passing tests — block and request changes immediately
- **@rules/review-etiquette.md** — prefix blockers vs nits, ask questions before assuming, approve with outstanding nits noted, split large PRs
- **@rules/pr-standards.md** — ≤ 400 lines, description required, CI must pass before review, self-review your own diff first

Every PR touching auth, payments, or PII requires a second reviewer. One approval is not sufficient for these paths.

Never approve a PR with an open blocker comment, even if the rest of the code is correct.

## Security Non-Negotiables

- Block immediately and request changes on: hardcoded credentials, API keys, or secrets of any kind committed to source.
- Block immediately: SQL or NoSQL injection vectors — string-interpolated queries, unparameterised inputs.
- Block immediately: missing authentication or authorisation checks on any endpoint that accesses user-owned data.
- Block immediately: PII (email, name, phone, NIK, health data) written to application logs or error messages.
- Block immediately: silent `catch {}` blocks or `catch (e) {}` with no handling — these hide runtime errors in production.
- Block immediately: tests that always pass regardless of implementation (no assertions, assertion on a constant, mocked return value tested against itself).

## When Reviewing a Pull Request

1. **Read the description first.** If there is no description, ask the author to add context before you start the review. A PR without a description cannot be reviewed efficiently.
2. **Self-check scope.** If the PR is > 400 lines of meaningful logic change, ask the author to split it before reviewing. Review depth drops sharply above this threshold.
3. **Run CI locally if it is failing.** Do not review a PR with a failing CI pipeline — fix the pipeline failure first or ask the author to fix it.
4. **Apply the checklist in order:** correctness → tests → security → performance → error handling → secrets → API contracts → documentation.
5. **Prefix every comment:** `BLOCKER:` for must-fix before merge, `NIT:` for style or preference, `QUESTION:` for clarification needed before you can assess.
6. **For security-sensitive paths** (auth, payments, PII, file uploads): explicitly check authentication, authorisation, input validation, output encoding, and audit logging.
7. **Approve only when all BLOCKERs are resolved.** Outstanding NITs may remain open — note them in the approval comment.

## Common Mistakes to Avoid

- **Approving to unblock.** Approving a PR with unresolved BLOCKERs to keep the team moving is a false economy — it creates tech debt and security risk.
- **Reviewing without running the code.** At minimum, read the test output. For auth and payment changes, run the code locally.
- **Giving vague feedback.** "This could be better" is not actionable. Name the specific problem: "This query is not parameterised — use query bindings to prevent SQL injection."
- **Ignoring test quality.** A PR that adds a feature without corresponding tests is incomplete. A PR that adds tests that always pass is worse than no tests.
- **Reviewing giant PRs.** A 2000-line PR reviewed in 20 minutes is not reviewed — it is approved. Enforce the 400-line limit before you start.
- **Missing auth checks on internal endpoints.** Internal endpoints that assume the caller is trusted are one misconfiguration away from being exploitable.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
