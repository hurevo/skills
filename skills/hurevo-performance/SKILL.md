---
name: hurevo-performance
description: Profiling-first performance methodology, N+1 detection, caching strategy, and frontend optimisation for Hurevo projects.
---

# Hurevo Performance

Apply this skill when diagnosing slow endpoints, optimising database queries, designing a caching layer, or improving Core Web Vitals.

## When to Apply

- Investigating a slow API endpoint or page load complaint
- Adding caching to an expensive read path
- Reviewing a PR for N+1 queries or missing indexes
- Setting up frontend performance monitoring or meeting CWV targets

## Performance Rules

- **@rules/profiling-first.md** — measure before you optimise; establish a baseline; use the right tool per stack (Debugbar, py-spy, Lighthouse)
- **@rules/database-optimisation.md** — eager load with `with()`, index every WHERE column, use `exists()` not `count()`, chunk large datasets
- **@rules/caching-strategy.md** — cache expensive infrequent data, namespaced keys with TTLs, event-driven invalidation, Redis only in production
- **@rules/frontend-performance.md** — lazy-load routes, serve WebP images, defer third-party scripts, CWV targets: LCP < 2.5s, CLS < 0.1, INP < 200ms

Never optimise without a measured baseline. Guessing at bottlenecks without profiling data produces work that moves numbers by accident, not by design.

Never cache a result without defining: key structure, TTL, and invalidation event. An undocumented cache is a future stale-data bug.

## Security Non-Negotiables

- Never expose profiling endpoints (`/_debugbar`, `/_telescope`) in production without authentication — they reveal query plans and application internals.
- Never cache user-specific data in a shared cache key — always scope the key to the user ID or session identifier to prevent data leakage between users.
- Rate-limit expensive compute endpoints (AI inference, PDF generation, bulk export) — unthrottled endpoints are a denial-of-service vector.
- Cache entries that include access-controlled data must be invalidated immediately on permission change, not on TTL expiry.

## When Investigating a Performance Problem

1. **Establish a baseline.** Record current response time, query count, memory, and error rate. Use Laravel Telescope, Debugbar, or py-spy to capture the real numbers.
2. **Identify the bottleneck layer.** Is it N+1 queries? A missing index on a large table? A slow external API call? Heavy CPU computation? Large response payload? Frontend render blocking?
3. **Fix the dominant bottleneck first.** Do not optimise a 5ms PHP loop while a 2000ms unindexed query is in the same request.
4. **For N+1 queries:** add `with('relation')` eager loading. Confirm query count drops with Debugbar before and after.
5. **For slow queries:** run `EXPLAIN ANALYZE`. Add an index only if the plan shows a sequential scan on a large table. Index columns used in `WHERE`, `JOIN ON`, `ORDER BY` on tables > 10,000 rows.
6. **For caching:** define TTL, cache key namespace, and invalidation event. Implement, then verify cache hit rate in Redis.
7. **Re-measure against the baseline.** Document the before/after result in the PR description.

## Common Mistakes to Avoid

- **Caching over N+1.** Wrapping a slow response in Redis does not eliminate 50 queries — it defers them until cache expiry. Fix the query, then cache if justified.
- **Adding indexes without EXPLAIN.** Indexes consume write performance. Only add after `EXPLAIN ANALYZE` confirms a sequential scan is the cause.
- **Ignoring payload size.** A fast 50ms query that returns 10MB of JSON is still a performance problem. Paginate, select only needed columns, use API Resources.
- **Long-TTL caching of frequently-changing data.** A 1-hour TTL on product inventory or order status serves stale data to users making purchasing decisions.
- **Measuring in a development environment.** Query times and cache metrics are meaningless locally. Profile on staging with production-volume data.
- **Blocking async event loops.** Synchronous disk I/O or CPU-heavy work in a Node.js or Python async handler blocks all other requests — offload to a queue.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
