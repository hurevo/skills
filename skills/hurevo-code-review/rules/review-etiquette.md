---
title: Review Etiquette
impact: medium
tags: [code-review, communication, feedback, team]
---

## Why

- Reviewers who conflate personal style preferences with blocking issues cause friction and slow down delivery without improving quality
- Vague negative comments ("this is wrong", "this is bad") don't help the author fix anything — they just create defensive responses
- Holding approval hostage to non-blocking nits discourages engineers from submitting PRs and creates unnecessary bottlenecks

## Pattern

**Bad** — personal, vague, blocking on style:

```
# Comment on variable naming
"This is terrible code. Why would you name it 'data'?
 You clearly didn't think about maintainability."

# Blocking on preference
"I don't like this approach. I would have used a Repository pattern instead.
 Won't approve until this is refactored."

# Assuming bad intent
"This is obviously going to fail when X is null. 
 Didn't you test this?"
```

**Good** — labelled, specific, actionable, asking questions:

```
# Labelled as blocker with reason
[blocker] This endpoint has no authentication middleware. An unauthenticated 
request can list all user accounts. Add `auth:sanctum` to this route group 
before merging.

# Labelled as nit — non-blocking
[nit] `$data` is a bit vague here — `$userMetrics` would make the intent 
clearer. Feel free to take or leave this.

# Question before assuming
What happens if `$order->customer` is null here? Is that possible in the 
current data model, or is it always guaranteed to be set? Just want to 
confirm the happy path is the only path.

# Approving with outstanding nits
Approving — the auth and validation look correct. The two [nit] comments 
above are suggestions only; no need to hold this for them.
```

## Rules

1. Prefix every review comment with `[blocker]` or `[nit]` — the author must know which comments must be addressed before merge.
2. Ask questions before asserting something is wrong — the author may have context the reviewer is missing.
3. Approve the PR when the blockers are resolved — do not hold approval for style nits or alternative design preferences.
4. If a PR is too large to review thoroughly (>500 lines), decline to review it fully and request it be split.
5. Follow up within one business day after the author responds to your blocking comments — stalled reviews are a team problem.
