---
title: FastAPI Application Architecture
impact: high
tags: [fastapi, python, architecture, routing]
---

## Why

- Flat single-file APIs become impossible to navigate once the endpoint count exceeds a handful
- Putting business logic directly in route handlers makes it untestable and tightly coupled to HTTP
- Shared mutable state in module-level globals causes subtle bugs in concurrent async workers

## Pattern

**Bad** — flat file, logic in route handlers, module-level database state:

```python
# main.py — everything in one file
from fastapi import FastAPI
import psycopg2

app = FastAPI()
conn = psycopg2.connect(DATABASE_URL)  # module-level connection — not safe under async

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row:
        return {"error": "not found"}  # wrong — should raise HTTPException
    return {"id": row[0], "name": row[1]}

@app.post("/users/{user_id}/deactivate")
async def deactivate_user(user_id: int):
    cur = conn.cursor()
    cur.execute("UPDATE users SET active = false WHERE id = %s", (user_id,))
    conn.commit()
    return {"ok": True}
```

**Good** — layered structure with dependency injection:

```python
# app/routers/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session
from app.services.user_service import UserService
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: int, session: AsyncSession = Depends(get_session)):
    service = UserService(session)
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

# app/services/user_service.py — business logic separate from HTTP
class UserService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id(self, user_id: int) -> User | None:
        return await self.session.get(User, user_id)

    async def deactivate(self, user_id: int) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        user.active = False
        await self.session.commit()
        await self.session.refresh(user)
        return user

# app/main.py
from fastapi import FastAPI
from app.routers import users, auth

app = FastAPI(title="Hurevo API")
app.include_router(users.router)
app.include_router(auth.router)
```

## Rules

1. Structure as `app/routers/`, `app/services/`, `app/models/`, `app/schemas/` — one layer per responsibility.
2. Keep route handlers thin: validate input, call a service, return a response. No SQL or business logic in routers.
3. Use FastAPI's `Depends()` for all shared resources (database sessions, current user, settings).
4. Raise `HTTPException` in routers; raise plain `ValueError` or domain exceptions in services.
5. Register all routers via `app.include_router()` in `main.py` — never import route functions directly.
