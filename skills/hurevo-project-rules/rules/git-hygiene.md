---
title: Git Hygiene
impact: HIGH
tags: [git, commits, pull-requests, branching]
---

# Git Hygiene

Small, focused commits and well-described PRs make code review faster and rollbacks precise.

## Why

- **Reviewability**: A single-concern commit is easy to review; a 2000-line mixed commit is not.
- **Rollback precision**: `git revert` on a focused commit is safe; reverting a mixed commit breaks unrelated work.
- **Traceability**: Ticket references in commits make it possible to reconstruct why a change was made months later.

## Pattern

```bash
# Bad — vague message, mixed concerns
git commit -m "fixes and updates"

# Bad — mixing schema change with business logic
git commit -m "add invoices table and implement billing service and fix user login bug"

# Good — one concern, imperative mood, lowercase
git commit -m "add invoices migration with status enum"
git commit -m "implement InvoiceService::create with stripe charge"
git commit -m "fix user session not persisting after password reset"

# Branch naming
# Bad
git checkout -b my-feature
git checkout -b johns-work

# Good
git checkout -b feat/invoice-pdf-export
git checkout -b fix/session-persistence-after-reset
git checkout -b chore/upgrade-laravel-11
```

```markdown
# PR description — minimum required content

## What
Adds PDF export for invoices using Snappy (wkhtmltopdf wrapper).

## Why
Client requires downloadable invoices for their accounting workflow. Ticket: PROJ-142.

## How to test
1. Create an invoice in staging
2. Click "Download PDF" — confirm file downloads and renders correctly
3. Confirm job is dispatched to the `reports` queue
```

## Rules

1. One logical concern per commit — schema, logic, and bug fixes are separate commits.
2. Commit messages: imperative mood, lowercase, no trailing period. Max 72 characters.
3. Branch prefixes: `feat/`, `fix/`, `chore/`, `hotfix/`.
4. PRs must pass all CI checks before requesting review.
5. PRs must include: what changed, why, and how to test it.
6. Reference the ticket number in the PR description.
7. Never force-push to `main` or `production`.
