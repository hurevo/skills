---
name: hurevo-incident-response
description: Severity classification, response procedures, escalation path, and blameless postmortem for Hurevo production incidents.
---

# Hurevo Incident Response

Apply this skill when a production incident is detected, during active incident response, or when a postmortem is required.

## When to Apply

- A production service is down or degraded and needs immediate response
- Determining the severity level and escalation path for an incident
- Communicating status updates during an active incident
- Triaging and handling a security incident or data breach
- Running a postmortem within 5 business days of a P1 or P2

## Incident Rules

- **@rules/severity-levels.md** — P1 (15-min response, site down/data breach), P2 (30-min, major feature broken), P3 (2-hour, degraded), P4 (next-day, minor)
- **@rules/response-steps.md** — declare an incident channel, assign IC, investigate (timeline/recent-changes/logs), resolve and confirm with monitoring, notify client
- **@rules/security-incidents.md** — data breach escalates immediately to CTO, preserve evidence, UU PDP 14-day notification, HIPAA 60-day, PCI 24-hour
- **@rules/postmortem.md** — blameless postmortem within 5 days for P1/P2, includes summary/timeline/root-cause/contributing-factors/action-items, assigned owners

Declare an incident when in doubt. It is easier to de-escalate an unnecessary incident channel than to discover that an unacknowledged P1 has been running for an hour.

The Incident Commander (IC) coordinates the response — they do not necessarily fix the issue. The IC's job is to delegate, track, communicate, and make decisions. Engineers investigate; the IC orchestrates.

## Security Non-Negotiables

- A suspected data breach is always P1 regardless of scope. Escalate to CTO immediately. Do not attempt to assess the full scope before escalating — escalate first, assess second.
- Preserve all evidence before remediating a security incident: capture logs, freeze affected instances, take snapshots. Remediation that overwrites evidence may destroy the ability to understand the breach.
- Regulatory breach notification timelines are non-negotiable: UU PDP 14 days, HIPAA 60 days, PCI DSS 24 hours. These clocks start when you first suspect a breach, not when it is confirmed.
- Never communicate breach details or incident specifics in public channels, personal email, or group chat — use a private incident channel or secure call. Breach details disclosed via insecure communication become an additional incident.

## When Responding to an Incident

1. **Detect and classify.** Determine severity: is the service completely down (P1), major feature broken (P2), degraded (P3), or minor (P4)? When uncertain, classify higher and de-escalate if warranted.
2. **Declare the incident.** Open a dedicated incident channel (e.g., `#inc-2026-03-04-api-down`). Assign an Incident Commander. Post the initial status: what is affected, when it started, current impact.
3. **Investigate.** IC assigns engineers to: review recent deploys and changes in the last 24 hours, check monitoring dashboards (error rate, response time, resource utilisation), examine application logs around the incident start time.
4. **Communicate at regular intervals.** Post a status update every 15 minutes during a P1, every 30 minutes during P2. Update the status page if the incident is client-visible.
5. **Resolve and confirm.** Apply the fix, confirm with monitoring that error rate has returned to baseline. Watch for at least 10 minutes before declaring resolved.
6. **Notify the client.** For P1/P2 that affected the client's service, send a brief, factual summary: what happened, when, how long, what was done. Avoid blame language.
7. **Schedule the postmortem.** For P1 and P2: schedule the blameless postmortem within 5 business days. Assign the postmortem author. Collect the timeline and logs before they age.

## Common Mistakes to Avoid

- **Failing to declare.** An engineer troubleshooting a production issue alone for 45 minutes without declaring an incident means the IC, stakeholders, and on-call are all uninformed. Declare early.
- **IC trying to fix the problem themselves.** An IC who is heads-down debugging cannot also track, communicate, and co-ordinate. Separate the IC from the engineers doing the technical investigation.
- **Delaying client notification.** Clients who discover their service was down from their own users, before hearing from Hurevo, lose trust. Notify the client proactively, even with incomplete information.
- **Remediating a security breach before preserving evidence.** Rebooting a compromised instance destroys the evidence needed to understand how the breach occurred and what data was accessed.
- **Blame in the postmortem.** A postmortem that concludes "it was X's fault" produces no systemic improvement. The postmortem finds process failures, monitoring gaps, and system weaknesses — not individuals to blame.
- **No action items with owners.** A postmortem without assigned, trackable action items produces no change. Every identified contributing factor must have a corresponding action item with an owner and due date.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
