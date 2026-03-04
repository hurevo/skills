---
name: hurevo-compliance-ojk
description: OJK (Otoritas Jasa Keuangan) technical compliance requirements for Hurevo projects serving Indonesian financial services clients.
---

# Hurevo Compliance — OJK

Apply this skill when building systems for OJK-regulated entities: banks, multifinance, insurance, fintech (P2P lending, e-money, payment gateways), and securities firms.

## When to Apply

- Starting any project for an OJK-regulated financial services client
- Designing audit trail, transaction logging, or immutable event storage
- Planning disaster recovery architecture, RTO/RPO targets, or DR drills
- Implementing fraud prevention, velocity controls, or MFA for financial transactions

## Compliance Rules

- **@rules/availability-resilience.md** — 99.5% uptime SLA for core systems, RTO ≤ 4h / RPO ≤ 1h, annual DR drills with documented results
- **@rules/audit-trail.md** — immutable append-only logs with actor/action/timestamp/before-after state, 5-year retention, independent from operational data
- **@rules/fraud-prevention.md** — velocity controls, MFA on transaction-initiating actions, device binding, 15-minute session expiry
- **@rules/ojk-security.md** — AES-256 at rest, TLS 1.2+ in transit, mTLS for OJK system integrations, annual pen test, 24h critical vulnerability disclosure

Audit logs must be immutable and separate from the operational database. An application that can modify its own audit trail is non-compliant, regardless of technical intent.

Transaction logs must capture before and after state. A log that only records "updated" without recording what changed is insufficient for regulatory examination.

## Security Non-Negotiables

- AES-256 encryption at rest for all financial data, customer PII, and transaction records. Key management must be separated from the encrypted data store.
- TLS 1.2 minimum for all connections. TLS 1.3 preferred. mTLS required for any direct integration with OJK reporting systems or inter-bank networks.
- MFA is mandatory for all transaction-initiating user actions and all admin access. SMS OTP is the minimum; TOTP or hardware token preferred for high-value transactions.
- Security vulnerabilities rated CRITICAL must be disclosed to OJK within 24 hours of discovery and remediated within a defined SLA. Maintain a vulnerability disclosure policy.
- Annual penetration test conducted by an OJK-recognised independent security firm. Remediation of findings must be documented and signed off.
- Session expiry: 15-minute inactivity timeout for all authenticated financial service sessions.

## When Designing for OJK Compliance

1. **Define the regulatory scope.** Confirm which OJK regulation applies (POJK 12/2021 for IT governance, POJK 11/2022 for cyber resilience, etc.). Read the applicable regulation, not a summary of it.
2. **Design the audit trail as a separate system.** Use an append-only event log (database table with no UPDATE/DELETE privileges on the audit schema, or a dedicated log store). Log actor, action, timestamp, IP, and before/after state for every financial record mutation.
3. **Plan availability and DR architecture.** Define RTO (≤ 4h) and RPO (≤ 1h) targets. Design the infrastructure to meet them: multi-AZ deployment, automated failover, regular backup tests.
4. **Implement velocity controls.** Define thresholds per transaction type (daily limit, per-transaction limit, frequency cap). Implement server-side enforcement — not just client-side UI limits.
5. **Integrate MFA for transaction-initiating flows.** Every action that moves money or changes financial account details must require MFA re-authentication. Do not rely on session-level auth.
6. **Schedule and document DR drills.** Plan annual DR drills before project go-live. Drills must be documented with results, gaps found, and remediation actions assigned.

## Common Mistakes to Avoid

- **Audit logs in the operational database with no write protection.** Application code that can `UPDATE` or `DELETE` audit records means the audit trail is not reliable for regulatory purposes.
- **Relying on session-level MFA for financial transactions.** Logging in with MFA does not satisfy the requirement. High-value or sensitive transactions require MFA at point of transaction.
- **No before/after state in logs.** "Record updated" without capturing what changed is insufficient. Regulators require the ability to reconstruct the state of any record at any point in time.
- **RTO/RPO targets not tested.** Documenting targets without a DR drill result does not demonstrate compliance. The drill must be performed and documented annually.
- **Missing device binding for mobile transactions.** P2P lending and e-money applications that allow transactions from any device without device binding are a fraud risk and a likely compliance gap.
- **Undocumented OJK system integrations.** Every integration with an OJK-mandated reporting system must be documented, secured with mTLS, and included in the security architecture diagram.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
