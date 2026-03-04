---
title: Sprint Structure
impact: high
tags: [sprint-planning, ceremonies, timeboxing, scrum]
---

## Why

- Varying sprint length mid-project breaks momentum and makes velocity forecasting impossible for capacity planning
- Ceremonies that run over their timebox consume engineer time without producing decisions — defer unresolved items to async followup
- Skipping retrospectives removes the team's only mechanism to improve its own process

## Pattern

**Bad** — variable sprint length, overrunning ceremonies, no retro:

```
# Sprint planning runs 3.5 hours — overruns the 2-hour timebox
# Standups drift to 45 minutes discussing design — should be 15m

# Retrospective skipped — "we'll do it next sprint when we have time"
```

**Good** — consistent 2-week sprints, timeboxed ceremonies, retro action items:

```
# Sprint 45: April 1-14
# Sprint Planning (Day 1): 2h timebox — ends at 2h regardless
#   Unresolved design questions → async Slack thread, resolved before sprint starts
# Daily Standup (9:30am): 15m timebox — what blocked, what will I do, what depends on me
# Sprint Review (Day 10): 1h timebox — demo only — discussion deferred to async feedback
# Retrospective (Day 10): 1h timebox — one action item agreed, owner assigned, deadline = Day 1 of next sprint
```

## Rules

1. Sprint length is fixed at 2 weeks — do not change sprint length without a team retrospective decision documented.
2. All ceremonies are timeboxed and end at the timebox, not when the discussion finishes — defer unresolved items to async.
3. Daily standup is 15 minutes — answer three questions: what I did, what I will do, what blocks me. Status reporting is async in the backlog.
4. Sprint Planning: max 2 hours. Sprint Review: max 1 hour. Retrospective: max 1 hour — all four are required per sprint.
5. Retrospectives produce one concrete action item per sprint with an assigned owner and deadline — track completion in the next sprint.
