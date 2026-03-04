---
title: HIPAA Application Controls
impact: high
tags: [hipaa, application, minimum-necessary, rbac, break-glass]
---

## Why

- Displaying all PHI fields to every user violates the "minimum necessary" standard — a billing clerk does not need to see diagnosis codes
- Role-based access enforced only at the UI layer is trivially bypassed by calling the API directly — enforcement must be at the service layer
- Break-glass access without logging and alerting is indistinguishable from unauthorised access during a breach investigation

## Pattern

**Bad** — all PHI to all roles, UI-only enforcement, unlogged break-glass:

```php
// ❌ Same endpoint returns all PHI to all authenticated users
public function show(Patient $patient): JsonResponse
{
    return response()->json($patient);  // includes diagnosis, medication, SSN, billing data
}

// ❌ Access control only in the Blade template — not in the controller
// resources/views/patient.blade.php
@if(auth()->user()->role === 'clinical')
    <p>Diagnosis: {{ $patient->diagnosis }}</p>
@endif
// But GET /api/patients/{id} still returns diagnosis for billing staff
```

**Good** — role-filtered resources, service-layer enforcement, audited break-glass:

```php
// ✅ Role-aware resource — returns only what each role needs
class PatientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        return array_filter([
            'id'             => $this->id,
            'name'           => $this->name,
            // Clinical data — only for clinical and admin roles
            'diagnosis'      => $user->can('view-clinical-data') ? $this->diagnosis : null,
            'medications'    => $user->can('view-clinical-data') ? $this->medications : null,
            // Billing data — only for billing and admin roles
            'insurance_id'   => $user->can('view-billing-data') ? $this->insurance_id : null,
            'balance_due'    => $user->can('view-billing-data') ? $this->balance_due : null,
        ]);
    }
}

// ✅ Service-layer enforcement — not just UI
class PatientService
{
    public function getClinicalRecord(int $patientId, User $user): ClinicalRecord
    {
        Gate::authorize('view-clinical-data');  // throws 403 if unauthorised
        PhiAuditLog::record($user, 'VIEW_CLINICAL_RECORD', $patientId);
        return ClinicalRecord::findOrFail($patientId);
    }
}

// ✅ Break-glass access — logged and alerted
class EmergencyAccessService
{
    public function grantBreakGlass(User $user, int $patientId, string $reason): void
    {
        PhiAuditLog::record($user, 'BREAK_GLASS_ACCESS', $patientId, ['reason' => $reason]);
        $this->notifications->alertPrivacyOfficer($user, $patientId, $reason);
        // Grant temporary 30-minute access
        $user->grantTemporaryPermission('view-clinical-data', now()->addMinutes(30));
    }
}
```

## Rules

1. Display and transmit only the minimum PHI fields required for the role performing the action — filter at the resource/serialiser layer.
2. Enforce access controls at the service layer, not just the UI — API calls from any client must be authorised at the application logic level.
3. Implement break-glass access for emergencies — log every break-glass event with the reason, alert the privacy officer, and grant time-limited access only.
4. Record patient consent for data sharing with the consent text version, date, and specific sharing purpose — consent is not a one-time checkbox.
5. Build tooling to identify which PHI records were exposed in a breach before launch — HIPAA breach notification requires this information within 60 days.
