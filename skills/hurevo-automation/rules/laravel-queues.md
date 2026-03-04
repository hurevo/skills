---
title: Laravel Queues
impact: HIGH
tags: [queues, jobs, retry, backoff, laravel]
---

# Laravel Queues

Every Job touching an external API must declare `$tries`, `$backoff`, and `$timeout`. Implement `failed()` for cleanup and alerting. Route jobs to named queues by concern.

## Why

- **Reliability**: Without retry limits, a misbehaving external API can cause infinite queue growth. Without backoff, retries amplify the problem.
- **Visibility**: The `failed()` method is the last chance to record what went wrong before the job is moved to the failed_jobs table.
- **Prioritisation**: Named queues (e.g. `critical`, `default`, `bulk`) allow you to run separate workers and ensure high-priority work isn't starved by bulk jobs.

## Pattern

```php
// Bad — no retry config, no failure handler, no queue name
class SyncUserToCrm implements ShouldQueue
{
    public function __construct(private int $userId) {}

    public function handle(CrmService $crm): void
    {
        $crm->sync(User::findOrFail($this->userId));
    }
}

// Good — explicit config, failure handler, named queue
class SyncUserToCrm implements ShouldQueue
{
    public string  $queue   = 'integrations';
    public int     $tries   = 3;
    public array   $backoff = [30, 120, 600]; // seconds: 30s, 2min, 10min
    public int     $timeout = 30;             // seconds before SIGTERM

    public function __construct(private int $userId) {}

    public function handle(CrmService $crm): void
    {
        $user = User::findOrFail($this->userId);
        $crm->sync($user);
        $user->update(['crm_synced_at' => now()]);
    }

    public function failed(Throwable $e): void
    {
        User::where('id', $this->userId)->update(['crm_sync_failed' => true]);
        Log::error('CRM sync permanently failed', [
            'user_id' => $this->userId,
            'error'   => $e->getMessage(),
        ]);
    }
}
```

```php
// Horizon queue configuration (config/horizon.php)
'environments' => [
    'production' => [
        'supervisor-critical'     => ['queue' => ['critical'], 'processes' => 5],
        'supervisor-integrations' => ['queue' => ['integrations'], 'processes' => 3],
        'supervisor-bulk'         => ['queue' => ['bulk'], 'processes' => 1],
    ],
],

// Dispatching with explicit connection
SyncUserToCrm::dispatch($user->id)->onQueue('integrations');

// For truly time-critical work
ProcessPayment::dispatch($orderId)->onQueue('critical');
```

## Rules

1. Every Job must declare `$tries` (max 3–5 for external APIs), `$backoff` array (exponential), and `$timeout`.
2. Every Job touching an external API must implement `failed(Throwable $e)` — at minimum log the failure and update a status column.
3. Route jobs to named queues by concern: `critical` for payments/auth, `integrations` for CRM/email/webhooks, `bulk` for reports/exports.
4. Use model IDs in the Job constructor — never pass Eloquent models directly (they serialise poorly and go stale).
5. Set `$deleteWhenMissingModels = true` on Jobs that operate on records that can be deleted between dispatch and execution.
6. Run Laravel Horizon in production — it provides visibility, metrics, and automatic worker balancing.
7. Monitor the `failed_jobs` table — alert if it grows beyond a project-specific threshold.
