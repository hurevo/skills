---
title: FastAPI Async Patterns
impact: high
tags: [fastapi, async, concurrency, background-tasks]
---

## Why

- Mixing sync blocking code (e.g. `requests`, synchronous SQLAlchemy) with async route handlers blocks the event loop and kills concurrency
- Running CPU-bound work directly in async handlers starves all other requests during processing
- Not using connection pools means every request opens a new database connection, exhausting resources under load

## Pattern

**Bad** — sync DB driver in async route, blocking HTTP call, no pooling:

```python
import requests  # ❌ blocking HTTP library
import psycopg2  # ❌ sync driver in async context

@app.get("/reports/{report_id}")
async def get_report(report_id: int):
    # Blocks the event loop — all other requests stall here
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    cur.execute("SELECT * FROM reports WHERE id = %s", (report_id,))
    row = cur.fetchone()

    # Also blocks — synchronous HTTP call inside async handler
    external = requests.get(f"https://analytics.example.com/report/{report_id}")
    return {"report": row, "analytics": external.json()}
```

**Good** — async drivers, httpx, background tasks for heavy work:

```python
import httpx
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from fastapi import BackgroundTasks

# Async engine with connection pool
engine = create_async_engine(DATABASE_URL, pool_size=10, max_overflow=20)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_session() -> AsyncSession:
    async with SessionLocal() as session:
        yield session

# Shared async HTTP client — reuse across requests
http_client = httpx.AsyncClient(timeout=10.0)

@app.get("/reports/{report_id}")
async def get_report(
    report_id: int,
    session: AsyncSession = Depends(get_session),
):
    # Async DB query — does not block event loop
    report = await session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Async HTTP call — does not block event loop
    analytics = await http_client.get(f"https://analytics.example.com/report/{report_id}")
    analytics.raise_for_status()

    return ReportResponse.model_validate(report)

# CPU-bound work: offload to thread pool
import asyncio
from functools import partial

async def process_csv(data: bytes) -> dict:
    loop = asyncio.get_event_loop()
    # run_in_executor offloads to a thread, freeing the event loop
    return await loop.run_in_executor(None, partial(_parse_csv_sync, data))

def _parse_csv_sync(data: bytes) -> dict:
    # Heavy pandas or csv processing here
    ...
```

## Rules

1. Use async database drivers: `asyncpg` for PostgreSQL, `aiomysql` for MySQL, `motor` for MongoDB.
2. Never call blocking I/O (requests, psycopg2, time.sleep) inside `async def` route handlers.
3. Use `httpx.AsyncClient` with a shared instance for outbound HTTP — never `requests` in async context.
4. Offload CPU-bound tasks to `asyncio.run_in_executor` or a Celery worker — never block the event loop.
5. Configure `pool_size` and `max_overflow` on the async engine to match your expected concurrency.
