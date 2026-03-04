---
title: HIPAA Technical Safeguards
impact: high
tags: [hipaa, technical-safeguards, encryption, audit-logging, access-control]
---

## Why

- Shared login accounts make it impossible to identify which individual accessed PHI — a direct HIPAA violation that voids the audit trail
- HIPAA audit logs must be exportable and retained for 6 years — logs that are only viewable in a dashboard and can't be exported fail the requirement
- PHI transmitted over HTTP even on an "internal" network is a HIPAA violation — TLS is required for all PHI transmission

## Pattern

**Bad** — shared accounts, non-exportable logs, plaintext PHI storage:

```php
// ❌ Shared service account used for clinical access
Auth::loginUsingId(1);  // "admin" shared account — no individual accountability

// ❌ Audit logging that only writes to a dashboard — not exportable
Log::channel('dashboard')->info('PHI accessed');  // not retained, not exportable

// ❌ PHI transmitted without TLS
// API endpoint configured over HTTP: http://ehr.example.com/api/patients
```

**Good** — individual user IDs, exportable 6-year logs, encrypted storage and transit:

```php
// ✅ Unique user ID for every clinical staff member
// No shared accounts — each login creates an individual audit trail
$user = User::create([
    'email'        => $request->email,
    'role'         => 'clinical_staff',
    'npi_number'   => $request->npi,  // individual clinician identifier
]);

// ✅ Exportable audit log with 6-year retention
class PhiAuditLog extends Model
{
    protected $table = 'phi_audit_log';
    // No updated_at — append only
    // Exported via: GET /api/admin/audit-export?from=2020-01-01&to=2026-01-01
}

// ✅ AES-256 encryption for PHI at rest
class PatientRecord extends Model
{
    protected $casts = [
        'ssn'            => EncryptedCast::class,
        'diagnosis'      => EncryptedCast::class,
        'medication_list' => EncryptedCast::class,
    ];
}

// ✅ Automatic logoff after 15 minutes of inactivity
// config/session.php
'lifetime' => 15,
'secure'   => true,
'http_only' => true,
```

```nginx
# ✅ TLS 1.2+ enforced — no HTTP
server {
    listen 443 ssl;
    ssl_protocols TLSv1.2 TLSv1.3;
    # HTTP redirects to HTTPS
}
server {
    listen 80;
    return 301 https://$host$request_uri;
}
```

## Rules

1. Assign unique user IDs to every person accessing PHI — never use shared or generic accounts for clinical access.
2. Implement automatic session logoff after 15 minutes of inactivity for all PHI-accessing systems.
3. Build audit logs that are exportable (CSV or JSON via API) and retained for 6 years — a dashboard-only view does not satisfy HIPAA.
4. Encrypt all PHI at rest using AES-256 — use encrypted database columns or full-disk encryption, documented in the system security design.
5. Transmit PHI exclusively over TLS 1.2+ — no HTTP endpoints, no unencrypted internal API calls, even on private networks.
