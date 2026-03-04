---
title: OJK Audit Trail Requirements
impact: high
tags: [ojk, audit-trail, logging, immutable, retention]
---

## Why

- OJK requires financial transaction logs to be immutable and independently retrievable — logs in the same operational database can be modified or deleted alongside the data they record
- 5-year retention is a statutory requirement; logs deleted earlier than that expose the client to regulatory sanctions
- Audit logs that record only success events — not failures and access attempts — are insufficient for OJK compliance

## Pattern

**Bad** — mutable log table, same DB as operational data, short retention:

```php
// ❌ Audit log in the same database as transactional data — can be altered or deleted
Schema::create('transaction_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('transaction_id');
    $table->string('action');
    $table->timestamps();  // ❌ updatable — not immutable
});

// ❌ Cleaning up logs after 90 days
TransactionLog::where('created_at', '<', now()->subDays(90))->delete();
```

**Good** — append-only table, separate storage, 5-year retention, tamper-evident:

```php
// ✅ Append-only audit log — no UPDATE or DELETE granted on this table
// SQL: REVOKE UPDATE, DELETE ON financial_audit_log FROM app_user;

Schema::create('financial_audit_log', function (Blueprint $table) {
    $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));
    $table->string('actor_id');          // user or system ID performing the action
    $table->string('action');            // TRANSFER_INITIATED, TRANSFER_APPROVED, etc.
    $table->string('entity_type');       // Transaction, Account, etc.
    $table->string('entity_id');
    $table->jsonb('before_state');       // snapshot before change
    $table->jsonb('after_state');        // snapshot after change
    $table->decimal('amount', 15, 2)->nullable();
    $table->string('currency', 3)->nullable();
    $table->timestampTz('occurred_at');  // UTC timestamp — never updated
    $table->string('checksum');          // SHA-256 of the row content for tamper detection
    // No updated_at — this table is write-once
});

// ✅ Log every financial event — success, failure, and access
class TransactionAuditLogger
{
    public function log(string $action, Model $entity, array $before, array $after): void
    {
        $payload = compact('action', 'before', 'after') + ['entity_id' => $entity->id];
        FinancialAuditLog::create([
            ...$payload,
            'actor_id'    => auth()->id() ?? 'system',
            'occurred_at' => now()->utc(),
            'checksum'    => hash('sha256', json_encode($payload)),
        ]);
    }
}
```

## Rules

1. Financial transaction audit logs must be immutable — revoke UPDATE and DELETE permissions on the audit log table from the application database user.
2. Store audit logs separately from operational data — a separate database, append-only S3 bucket, or dedicated logging service.
3. Retain financial transaction logs for a minimum of 5 years — implement a retention policy that archives rather than deletes.
4. Log every financial event including failures and access attempts — not just successful transactions.
5. Include actor, action, entity, timestamp (UTC), and before/after state in every audit log entry; add a checksum for tamper detection.
