---
name: hurevo-compliance-uu-pdp
description: Indonesian Personal Data Protection Law (UU No. 27/2022) obligations for Hurevo projects handling Indonesian personal data.
---

# Hurevo Compliance — UU PDP

Apply this skill when building features that collect, store, or process personal data belonging to Indonesian citizens, or when reviewing whether a system meets UU PDP obligations.

## When to Apply

- Building any form, API, or data store that collects Indonesian personal data (name, NIK, email, phone, health data, financial data)
- Confirming data residency for a new cloud region or AI API integration
- Implementing consent capture, data subject rights endpoints, or a breach notification flow
- Reviewing a vendor or sub-processor agreement for data protection obligations

## Compliance Rules

- **@rules/what-is-personal-data.md** — specific vs general categories, NIK handling, combination re-identification risk, when in doubt treat as personal
- **@rules/controller-obligations.md** — data minimisation, explicit timestamped consent, purpose limitation, data subject rights endpoints, 14-day breach notification
- **@rules/data-localisation.md** — Indonesian citizen data stored in Indonesia, approved cloud regions, legal basis for offshore AI API calls
- **@rules/uu-pdp-security.md** — encrypt at rest and in transit, role-based access with audit logs, pseudonymise in non-production, automated retention purging

Specific personal data categories (health, financial, biometric, genetic, child data) require explicit consent separate from general terms. Bundled consent is not valid.

Any data transfer offshore (including API calls to OpenAI, Anthropic, or cloud AI services) requires a legal basis and must be documented. The vendor must meet equivalent protection standards.

## Security Non-Negotiables

- Encrypt all personal data at rest (AES-256) and in transit (TLS 1.2+). Unencrypted personal data at rest is a direct UU PDP violation.
- Pseudonymise personal data in non-production environments. Production PII in staging or dev databases is a compliance violation regardless of intent.
- Maintain audit logs of all access to personal data: who accessed it, when, and for what purpose. Logs must be retained for the data retention period.
- Automated retention purging is required. Define a retention period at data collection time; implement a scheduled job to delete or anonymise data when it expires.
- Data subject rights (access, rectification, erasure, portability) must be implementable within 30 days. The technical capability must exist before launch, not after a request arrives.

## When Implementing a Feature That Processes Personal Data

1. **Classify the data.** Determine if it is general personal data (name, email) or specific personal data (health, financial, biometric). Specific categories require explicit, separate consent.
2. **Apply data minimisation.** Collect only the fields genuinely needed for the stated purpose. Do not collect data speculatively for future use cases.
3. **Implement consent capture.** Consent must be: explicit (not pre-ticked), timestamped, purpose-specific, and stored as an audit record. Record the consent version and text shown.
4. **Confirm data residency.** Indonesian citizen data must be stored in an Indonesian data centre or a cloud region within Indonesia (e.g., AWS `ap-southeast-3`). Document the storage region.
5. **Check offshore transfers.** If any personal data leaves Indonesia (AI API calls, analytics, monitoring), document the legal basis. Use data processing agreements with the vendor.
6. **Implement data subject rights endpoints.** Before launch, confirm the system can: export a user's data, correct inaccurate data, delete/anonymise a user's data, and restrict processing on request.
7. **Set retention periods.** Define how long each data category is kept and implement a scheduled purge. Document the retention policy in the system design doc.

## Common Mistakes to Avoid

- **Treating consent as a single checkbox.** Bundling consent for multiple purposes in one tick is not valid under UU PDP. Each processing purpose needs its own consent record.
- **Storing raw personal data in non-production environments.** Production data should never appear in staging or development. Use anonymised or synthetic data.
- **No data subject rights implementation.** "We'll build it when someone asks" is not compliant. The capability must exist at launch.
- **Ignoring re-identification risk.** A dataset with age + city + occupation may uniquely identify a person even without a name. Treat combination data as personal.
- **Offshore AI API calls without documentation.** Passing personal data to OpenAI, Anthropic, or Google AI without a documented legal basis and DPA is a UU PDP violation.
- **14-day breach notification as an afterthought.** The notification process (who to notify, what to include, how to generate a breach report from logs) must be designed before a breach occurs.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
