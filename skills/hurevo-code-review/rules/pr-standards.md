---
title: PR Standards
impact: medium
tags: [code-review, pull-requests, ci, description]
---

## Why

- PRs with no description force every reviewer to reverse-engineer the intent from the diff — this wastes time and misses context
- Large PRs (>400 lines) are reviewed superficially because reviewers can't hold the full context in mind — small PRs get better reviews
- Requesting review before CI passes signals that the author hasn't validated their own change — it disrespects the reviewer's time

## Pattern

**Bad** — no description, CI skipped, too large:

```
# PR title: "fix stuff"
# PR body: (empty)
# CI: 3 failing checks
# Files changed: 47 files, +1,204 / -389 lines
# Reviewer assigned: yes
```

**Good** — clear description, CI green, scoped:

```markdown
## What changed
Adds email verification step to the registration flow. Users now receive a 
verification email on signup and must click the link before their account 
is activated.

Closes #412

## Why
Previously users could register with any email without verification, allowing 
spam accounts. This blocks activation until ownership is confirmed.

## How to test
1. Register a new account at /register
2. Check that account status is `pending_verification`
3. Click the link in the verification email (use Mailpit in local dev)
4. Confirm account status changes to `active`
5. Confirm login is blocked until verification completes

## Notes
- The verification token expires after 24 hours
- Resend link is on the login page if the token expires
```

```
# CI: all checks passing ✅
# Files changed: 8 files, +143 / -12 lines
# Self-reviewed: debug logs removed, no commented code
```

## Rules

1. Every PR must have a description: what changed, why, and how to test it — no empty descriptions.
2. Target ≤ 400 lines changed per PR; PRs over 400 lines require a written justification in the description.
3. All CI checks must pass before requesting review — never request review on a failing build.
4. Self-review your own diff before assigning a reviewer: remove debug logs, commented-out code, and console statements.
5. PRs open for more than 5 business days without activity are flagged to the tech lead — do not let reviews stall silently.
