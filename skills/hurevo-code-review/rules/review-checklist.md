---
title: Review Checklist
impact: high
tags: [code-review, checklist, quality, security]
---

## Why

- Checking only whether the code compiles misses the most common sources of production bugs: edge cases, missing error handling, and auth gaps
- Reviewing without reading the ticket means approving code that may be technically correct but solves the wrong problem
- Skipping security checks on "small" PRs is how vulnerabilities enter production — breaches exploit overlooked changes

## Pattern

**Bad** — approving based on surface appearance only:

```
# PR comment
"Looks good to me! LGTM 👍"

# Reviewer has not:
# - Read the linked ticket
# - Checked whether tests cover the new code path
# - Looked for auth on the new endpoint
# - Verified the API spec was updated
```

**Good** — systematic eight-point check:

```
# Reviewer checklist (mentally or as PR comments):

1. Correctness:   Read the ticket. Does this diff implement what was asked?
                  Are edge cases covered (null, empty, max values)?

2. Tests:         Are there new tests? Do they assert behaviour or just exercise code?
                  Would they catch a regression if the implementation changed?

3. Security:      New endpoint — is auth applied? Input validated? Output sanitised?
                  File upload? Payment flow? PII handled?

4. Performance:   Any new queries inside a loop? Missing WHERE clause indexes?
                  Anything blocking the event loop or holding a transaction open?

5. Error handling: Are errors caught and re-thrown with context?
                   Any catch blocks that swallow exceptions silently?

6. Config/secrets: Any hardcoded IPs, tokens, passwords, or env-specific values?

7. API contracts:  If a public/partner endpoint changed — is it backwards compatible?
                   Is the OpenAPI spec updated?

8. Documentation:  Does any README, wiki page, or runbook need updating?
```

## Rules

1. Read the linked ticket before reviewing the diff — correctness cannot be assessed without knowing the requirement.
2. Check all eight categories on every PR, not just the ones that seem relevant at first glance.
3. Verify that new tests would actually catch a regression — tests that always pass regardless of implementation are worse than no tests.
4. Check the diff for auth and validation on every new route or endpoint, regardless of how small the PR is.
5. If you cannot review thoroughly because the PR is too large, say so and ask for it to be split — do not approve a PR you have not fully reviewed.
