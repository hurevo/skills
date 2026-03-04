---
name: hurevo-python-fastapi
description: Load for Python FastAPI services. Covers async patterns, Pydantic v2, dependency injection, and security requirements.
---

# Hurevo Python FastAPI

FastAPI, Pydantic v2, and async Python standards for Hurevo AI Solutions and integration services. Contains 4 rules covering architecture, Pydantic, async/database, and security.

## When to Apply

- Any Python HTTP service using FastAPI
- Building AI pipelines or integration microservices in Python
- Reviewing a PR for FastAPI-specific patterns

## Rules Summary

### Architecture (HIGH)

#### fastapi-architecture - @rules/fastapi-architecture.md

`app/routers/` for routes, `app/services/` for business logic, `app/models/` for Pydantic schemas. All route functions are `async`. Never put business logic in route handlers.

```python
# Bad — logic in route handler
@router.post("/invoices")
async def create_invoice(data: dict, db: AsyncSession = Depends(get_db)):
    # 50 lines of business logic here
    invoice = Invoice(**data)
    db.add(invoice)
    await db.commit()
    return invoice

# Good — delegates to service
@router.post("/invoices", response_model=InvoiceResponse, status_code=201)
async def create_invoice(data: CreateInvoiceRequest, svc: InvoiceService = Depends()):
    return await svc.create(data)
```

### Pydantic v2 (HIGH)

#### pydantic-v2 - @rules/pydantic-v2.md

Use `model_config = ConfigDict(...)` — not the deprecated `class Config`. Separate Request and Response models. `SecretStr` for sensitive fields. `from_attributes=True` when mapping from ORM objects.

```python
# Bad — deprecated Config class, same model for request and response
class Invoice(BaseModel):
    class Config:
        orm_mode = True
    id: int | None  # id shouldn't be in request model

# Good — ConfigDict, separate models
class CreateInvoiceRequest(BaseModel):
    client_id: int
    amount: int

class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    amount: int
```

### Async and Database (HIGH)

#### fastapi-async - @rules/fastapi-async.md

Never `time.sleep()` — use `asyncio.sleep()`. Never block the event loop with CPU-intensive work — use `run_in_executor`. One DB session per request via `Depends(get_db)`. Never share sessions across requests.

```python
# Bad — sync sleep, CPU work in event loop, shared session
time.sleep(1)  # blocks the event loop
heavy_computation()  # blocks the event loop

# Good — async sleep, executor for CPU work
await asyncio.sleep(1)
result = await asyncio.get_event_loop().run_in_executor(None, heavy_computation)
```

### Security (HIGH)

#### fastapi-security - @rules/fastapi-security.md

`OAuth2PasswordBearer` or API key headers — no custom auth. Explicit CORS `allow_origins` list — never `["*"]` in production. Never log request bodies containing tokens or PII. Pin all dependencies.

```python
# Bad — wildcard CORS, raw dict return (bypasses validation)
app.add_middleware(CORSMiddleware, allow_origins=["*"])

@router.get("/users/{id}")
async def get_user(id: int, db = Depends(get_db)):
    return dict(user.__dict__)  # may expose internal fields

# Good — explicit origins, Pydantic response model
app.add_middleware(CORSMiddleware, allow_origins=settings.ALLOWED_ORIGINS)

@router.get("/users/{id}", response_model=UserResponse)
async def get_user(id: int, db = Depends(get_db)):
    return await UserService(db).get(id)
```
