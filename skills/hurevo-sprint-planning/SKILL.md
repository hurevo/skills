---
name: hurevo-sprint-planning
description: Sprint ceremony standards, story sizing, definition of done, and backlog grooming for Hurevo engineering teams.
---

# Hurevo Sprint Planning

Apply this skill when planning a sprint, writing user stories with acceptance criteria, estimating work, or running ceremonies.

## When to Apply

- At sprint planning — reviewing and committing to the backlog
- Writing a user story or breaking down a feature ticket
- Defining what "done" means for a feature or bug
- Running daily standups, sprint reviews, or retrospectives
- Evaluating whether a story is ready to start

## Process Rules

- **@rules/sprint-structure.md** — 2-week sprints, timeboxed ceremonies, Sprint Planning max 2h, standup 15m, Review 1h, Retro 1h
- **@rules/story-standards.md** — user story sentence, Given/When/Then acceptance criteria, Fibonacci sizing, stories > 8 must split before sprint entry
- **@rules/definition-of-done.md** — code merged to main, tests passing, reviewed, staged tested, API spec updated, zero new lint errors, acceptance criteria verified
- **@rules/planning-ceremony.md** — groomed backlog required, team commits to a sprint goal not just tickets, capacity confirmed with leave accounted for

A story is only ready to start if it has: clear acceptance criteria, a size estimate, and no unresolved blockers or open questions. Do not allow stories without acceptance criteria into the sprint.

A sprint commitment is a team commitment to a goal, not a contract on individual tickets. Unplanned work that arrives mid-sprint must be weighed against the sprint goal, not silently absorbed.

## Security Non-Negotiables

- Stories that touch authentication, payments, PII, or file upload must be flagged in the backlog and assigned to an engineer with security review capability. Do not assign security-sensitive stories to the most junior engineer by default.
- Security hardening, dependency updates, and vulnerability remediation are valid sprint backlog items. Do not defer security work indefinitely into a "security sprint" that never arrives.
- Any story that introduces a new external integration, API endpoint, or data store must include a security review as part of the definition of done.

## When Running Sprint Planning

1. **Confirm the groomed backlog is ready.** The top stories must be written (user story format), sized, and have acceptance criteria. If the backlog is not groomed, run a grooming session before planning, not during it.
2. **Set a sprint goal.** The team should commit to one or two sentences that describe the value delivered by the sprint. Individual tickets support the goal; the goal is not just a list of tickets.
3. **Confirm capacity.** Count working days per engineer accounting for leave, public holidays, and recurring ceremony time. Do not plan to 100% capacity — leave 20% for unplanned work and review time.
4. **Size stories as a team.** Use Fibonacci (1, 2, 3, 5, 8). Discuss briefly on divergent estimates. Stories estimated at 13 or more must be split. A story that cannot be split into smaller deliverable slices is an epic, not a story.
5. **Identify blockers before committing.** If a story depends on an external decision, a missing API key, or another team's output, flag it. Blocked stories should not enter the sprint unless the block will be resolved in the first two days.
6. **Capture the sprint goal and committed stories.** Write the goal in the sprint description. The committed backlog is the team's shared contract for the two weeks.

## Common Mistakes to Avoid

- **Stories without acceptance criteria entering the sprint.** "Implement user profile" with no AC is unfinishable — the definition of done cannot be verified. Block these at planning.
- **Committing to 100% capacity.** Real engineering work always includes unplanned interruptions, review cycles, and context switching. Overcommitting produces incomplete sprints and demoralising carry-overs.
- **Definition of done not checked before marking as done.** "Done" means: merged, tested, staged, reviewed, and spec updated — not "I finished coding it."
- **Giant stories that span the entire sprint.** A story that takes one engineer the full two weeks cannot be reviewed, staged, or demoed incrementally. Split into vertical slices.
- **Skipping the retrospective.** The retrospective is the team's primary mechanism for improving process. Skipping it when the team is behind sends the signal that process never improves.
- **Sprint goal as a ticket list.** "Implement stories 42, 43, 44" is not a sprint goal. A sprint goal describes the value: "Users can complete onboarding without contacting support."

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
