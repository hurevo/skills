---
title: Parallel Run
impact: HIGH
tags: [parallel-run, migration, validation, cutover]
---

# Parallel Run

Every migrated slice runs old and new systems simultaneously for a minimum of 2 weeks before cutover. Compare outputs automatically. Log all discrepancies — including harmless ones.

## Why

- **Correctness validation**: Parallel run exposes behavioural differences under real production load and data — not synthetic fixtures.
- **Confidence**: Two weeks of zero discrepancies is the evidence needed to justify cutting over.
- **Reversibility**: The feature flag stays in place until the parallel run window closes — rollback is instant.

## Pattern

```php
// Parallel run service — runs both, compares, logs discrepancies
class ParallelRunService
{
    public function calculateTotal(int $orderId): int|float
    {
        $legacyResult = app(LegacyOrderCalculator::class)->calculateTotal($orderId);
        $newResult    = app(OrderCalculator::class)->calculateTotal($orderId);

        if ($legacyResult !== $newResult) {
            Log::warning('Parallel run discrepancy: order total', [
                'order_id' => $orderId,
                'legacy'   => $legacyResult,
                'new'      => $newResult,
                'delta'    => $newResult - $legacyResult,
            ]);
            // Track in metrics for dashboard
            Metrics::increment('parallel_run.discrepancy', tags: ['slice' => 'order-total']);
        }

        // Legacy is always authoritative during parallel run
        return $legacyResult;
    }
}

// Controller — uses feature flag to route to parallel run or legacy only
class OrderController extends Controller
{
    public function show(Order $order): OrderResource
    {
        $total = match (true) {
            Feature::active('order-total-parallel-run') => app(ParallelRunService::class)->calculateTotal($order->id),
            Feature::active('order-total-new')          => app(OrderCalculator::class)->calculateTotal($order->id),
            default                                     => app(LegacyOrderCalculator::class)->calculateTotal($order->id),
        };

        return new OrderResource($order->setRelation('computed_total', $total));
    }
}
```

```php
// Discrepancy dashboard query — run daily to track parallel run health
SELECT
    DATE(created_at)  AS day,
    COUNT(*)          AS total_calls,
    SUM(CASE WHEN legacy_result != new_result THEN 1 ELSE 0 END) AS discrepancies,
    ROUND(
        SUM(CASE WHEN legacy_result != new_result THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2
    ) AS discrepancy_rate_pct
FROM parallel_run_logs
WHERE slice = 'order-total'
  AND created_at >= NOW() - INTERVAL 14 DAY
GROUP BY DATE(created_at)
ORDER BY day DESC;
```

## Rules

1. Every migrated vertical slice must run in parallel for a minimum of 2 weeks before cutover — no exceptions for "trivial" slices.
2. The legacy result is always returned to the user during parallel run — the new result is computed in the background for comparison only.
3. Log every discrepancy with: slice name, input identifiers, legacy value, new value — not the full input payload (PII risk).
4. Build a daily discrepancy report. The cutover gate is: zero discrepancies in the last 7 consecutive days.
5. Log _all_ discrepancies, even ones that appear harmless (e.g. formatting differences) — harmless today can be a data bug tomorrow.
6. Keep the feature flag active for 4 weeks after cutover — this is the rollback window. Only remove the legacy code path after the flag has been inactive for 4 weeks.
