---
title: OJK Availability and Resilience
impact: high
tags: [ojk, availability, sla, disaster-recovery, resilience]
---

## Why

- OJK requires 99.5% availability for core banking and payment systems — this must be committed to contractually, not assumed from infrastructure defaults
- A DR plan that has never been tested is not a DR plan — it is documentation that will fail under incident pressure
- RTO and RPO targets without implemented failover mechanisms are compliance theatre that will surface during an OJK audit

## Pattern

**Bad** — no SLA tracking, untested DR, no RTO/RPO targets defined:

```
# Project setup
- Infrastructure: single availability zone
- DR: "we have daily backups"
- SLA: not defined in the project agreement
- DR drill: never scheduled
```

**Good** — multi-AZ architecture, tested DR, SLA monitoring, documented targets:

```terraform
# Multi-AZ deployment for 99.5% availability
resource "aws_db_instance" "primary" {
  instance_class        = "db.r6g.large"
  multi_az              = true           # automatic failover to standby AZ
  backup_retention_period = 7
  deletion_protection   = true
}

# Read replica in separate AZ for read offload + failover
resource "aws_db_instance" "replica" {
  instance_class      = "db.r6g.large"
  replicate_source_db = aws_db_instance.primary.id
  availability_zone   = "ap-southeast-3b"  # different AZ from primary
}
```

```yaml
# SLA monitoring — alert when availability drops below threshold
# CloudWatch alarm: 5xx error rate > 0.5% for 5 minutes
# On-call runbook linked from alert

# DR targets documented in project agreement:
# Tier 1 (core payment processing): RTO ≤ 4h, RPO ≤ 1h
# Tier 2 (reporting, analytics):    RTO ≤ 24h, RPO ≤ 4h

# DR drill schedule:
# - Annual full failover test (required by SE OJK No. 29)
# - Quarterly backup restoration test
# - Results documented with: date, participants, outcome, remediation actions
```

## Rules

1. Core banking and payment systems must meet 99.5% availability (≈44 hours downtime/year) — document this SLA in the project agreement before go-live.
2. Define Tier 1 DR targets: RTO ≤ 4 hours, RPO ≤ 1 hour — implement and document the technical failover mechanism that achieves them.
3. Conduct a full DR drill at minimum annually; document the results including what failed and what remediation was taken.
4. Deploy core systems across multiple availability zones — single-AZ deployments cannot meet the OJK availability SLA.
5. Implement SLA monitoring with alerting — availability must be tracked in real time, not reconstructed from logs after an OJK audit.
