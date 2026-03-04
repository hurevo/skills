---
name: hurevo-compliance-hipaa
description: HIPAA technical safeguard requirements for Hurevo projects handling Protected Health Information (PHI) for healthcare clients.
---

# Hurevo Compliance — HIPAA

Apply this skill when building or reviewing any feature that handles Protected Health Information (PHI) for US healthcare clients or any system subject to a Business Associate Agreement.

## When to Apply

- Building any feature that stores, displays, or transmits health data combined with patient identifiers
- Confirming BAA coverage for a cloud provider, AI API, or monitoring tool
- Implementing access controls, audit logging, or break-glass access for clinical systems
- Building the tooling needed to generate a breach report from audit logs

## Compliance Rules

- **@rules/phi-definition.md** — the 18 HIPAA identifiers, Safe Harbor de-identification, PHI in combinations, when to treat data as PHI
- **@rules/technical-safeguards.md** — unique user IDs, automatic 15-min logoff, exportable 6-year audit logs, AES-256 at rest, TLS 1.2+ in transit
- **@rules/application-controls.md** — minimum necessary display, role-based data access enforced at the application layer, break-glass logging, patient consent tracking
- **@rules/hipaa-security.md** — no PHI in logs/errors/URLs, synthetic PHI in non-production, BAA required for every PHI-processing vendor

PHI includes any health information that can be linked to a specific individual via the 18 HIPAA identifiers. When in doubt about whether data constitutes PHI, treat it as PHI and apply full safeguards.

Every vendor (cloud provider, AI API, monitoring tool, analytics platform) that may process PHI must have a signed Business Associate Agreement before PHI flows to their systems.

## Security Non-Negotiables

- AES-256 encryption at rest and TLS 1.2+ in transit for all PHI. Unencrypted PHI at rest is a direct HIPAA Security Rule violation.
- No PHI in application logs, error messages, URLs, or query strings. A stack trace containing a patient name or medical record number is a reportable breach.
- No PHI in non-production environments. Use synthetic patient data in staging and development. Real PHI in a dev environment is a breach even if not accessed maliciously.
- Automatic session logoff after 15 minutes of inactivity for any session with access to PHI.
- Break-glass access (emergency override of access controls) must be logged with actor, timestamp, reason, and records accessed. Audit the break-glass log monthly.
- Breach notification to HHS within 60 days. The system must be able to generate a breach report from audit logs identifying which PHI was accessed, by whom, and when.

## When Implementing a Feature That Accesses PHI

1. **Identify PHI scope.** List every data field the feature reads or writes. Apply the 18-identifier test. If any combination of fields can identify a patient, the entire dataset is PHI.
2. **Confirm BAA coverage.** For every system the feature touches (database, cache, storage, AI API, logging service), confirm a signed BAA is in place. Block development until BAAs are confirmed for AI services.
3. **Enforce minimum necessary access.** Display only the PHI fields required for the specific task. A claims processing screen should not show a patient's full medical history. Enforce at the API response layer, not just the UI.
4. **Implement role-based access at the application layer.** Database-level permissions are insufficient. Every PHI endpoint must check the authenticated user's role against an access policy before returning data.
5. **Log every access.** Record: user ID, action (read/write/export), timestamp, patient/record identifier, and IP address. The audit log must be exportable to meet 6-year retention requirements.
6. **Test with synthetic PHI.** Create a synthetic patient dataset that mirrors the structure of real PHI. Never use real patient data in testing, demo, or local development environments.

## Common Mistakes to Avoid

- **Logging PHI in error handlers.** Exception handlers that log the full request body, model attributes, or database query results will capture PHI. Sanitise log output for any PHI fields.
- **Sending PHI to an AI API without a BAA.** OpenAI, Anthropic, and similar providers have specific HIPAA BAA programs — the standard terms of service do not cover PHI. Confirm BAA before sending any health data.
- **PHI in URLs.** Patient IDs, record numbers, or any PHI in URL paths or query parameters appear in web server logs, browser history, and referrer headers. Use POST bodies or encrypted tokens.
- **Missing break-glass logging.** Emergency access overrides that are not logged in a separate, protected audit trail undermine the audit capability required by HIPAA.
- **De-identification by removing names only.** Removing a patient's name while retaining zip code, age, and diagnosis dates is often insufficient for Safe Harbor de-identification. Apply all 18 identifier rules.
- **Assuming cloud provider encryption satisfies HIPAA.** Server-side encryption by AWS or GCP covers storage-layer encryption. Application-level access controls and audit logging are still the covered entity's responsibility.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
