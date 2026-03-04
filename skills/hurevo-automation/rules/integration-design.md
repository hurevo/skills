---
title: Integration Design
impact: HIGH
tags: [integration, idempotency, error-handling, automation]
---

# Integration Design

Define the trigger, success state, and failure state before building any integration. Design every write operation for partial failure. Idempotency is required on all operations that mutate external systems.

## Why

- **Reliability**: Automations run unattended. Without idempotency, a single retry creates duplicate records in your CRM, duplicate charges, or duplicate emails.
- **Debuggability**: Knowing the exact trigger and expected success/failure states makes post-mortem analysis straightforward.
- **Resilience**: External APIs fail. Designing for partial failure means one step's failure doesn't corrupt the entire workflow state.

## Pattern

```js
// Bad — no idempotency key, no failure handling
async function syncContact(user) {
  await crm.createContact({
    email: user.email,
    name: user.name,
  })
  // If this is retried, a duplicate contact is created
}

// Good — idempotency key, structured error handling
async function syncContact(user) {
  try {
    await crm.createContact(
      { email: user.email, name: user.name },
      { idempotencyKey: `contact-${user.id}` }
    )
  } catch (err) {
    if (err.status === 409) {
      // Already exists — update instead
      await crm.updateContact(user.crmId, { name: user.name })
      return
    }
    throw err // re-throw unexpected errors for retry
  }
}
```

```php
// Laravel integration service — define contract before building
class CrmSyncService
{
    /**
     * Trigger: User completes registration.
     * Success: Contact exists in CRM with user_id tag.
     * Failure: Log error, mark user.crm_sync_failed = true, alert on-call.
     */
    public function syncUser(User $user): void
    {
        $payload = [
            'email'            => $user->email,
            'name'             => $user->name,
            'tags'             => ['user_id:' . $user->id],
            'idempotency_key'  => 'user-' . $user->id,
        ];

        try {
            $this->crm->upsertContact($payload);
            $user->update(['crm_synced_at' => now()]);
        } catch (CrmException $e) {
            $user->update(['crm_sync_failed' => true]);
            Log::error('CRM sync failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }
}
```

## Rules

1. Write a trigger/success/failure contract (3 sentences) before writing any workflow code.
2. Every write to an external system must use an idempotency key derived from your internal ID — never trust the external system's deduplication.
3. Handle partial failure: if step 3 of 5 fails, steps 1–2 must not leave the external system in a corrupt state. Use compensating actions or a saga pattern.
4. Never swallow errors silently — log with enough context to reproduce the failure.
5. Use exponential backoff on transient failures; do not retry immediately.
6. Track sync state in your own database (`synced_at`, `sync_failed`, `last_sync_error`) so you can audit and re-run selectively.
