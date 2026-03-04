---
title: Pydantic v2 Schema Design
impact: high
tags: [fastapi, pydantic, validation, schemas]
---

## Why

- Pydantic v2 has breaking changes from v1; mixing v1 patterns causes runtime warnings and subtle validation failures
- Using one schema for both input and output exposes internal fields (e.g. password hashes) to API responses
- Skipping validation on incoming data trusts user input — the primary source of injection and logic bugs

## Pattern

**Bad** — single ORM model exposed directly, v1 patterns:

```python
# v1 style — broken in Pydantic v2
from pydantic import BaseModel

class User(BaseModel):
    id: int
    email: str
    password_hash: str  # ❌ exposed in API response
    is_admin: bool

    class Config:
        orm_mode = True  # ❌ v1 — deprecated in v2
```

**Good** — separate request/response schemas, v2 syntax:

```python
from pydantic import BaseModel, EmailStr, Field, model_validator
from pydantic import ConfigDict
from typing import Annotated

# Input schema — validated on create
class UserCreate(BaseModel):
    email: EmailStr
    password: Annotated[str, Field(min_length=8, max_length=128)]
    name: Annotated[str, Field(min_length=1, max_length=100)]

    @model_validator(mode='after')
    def name_must_not_be_blank(self) -> 'UserCreate':
        if not self.name.strip():
            raise ValueError('name cannot be blank or whitespace only')
        return self

# Response schema — never includes password_hash or internal fields
class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # v2 equivalent of orm_mode

    id: int
    email: EmailStr
    name: str
    is_active: bool

# Update schema — all fields optional (PATCH semantics)
class UserUpdate(BaseModel):
    email: EmailStr | None = None
    name: Annotated[str, Field(min_length=1, max_length=100)] | None = None

# Paginated list wrapper
class PaginatedResponse[T](BaseModel):
    items: list[T]
    total: int
    page: int
    page_size: int
```

## Rules

1. Use `ConfigDict(from_attributes=True)` in v2 — never `class Config: orm_mode = True`.
2. Define separate schemas for create (strict), update (partial), and response (filtered) — never reuse the ORM model.
3. Use `Annotated` with `Field` for constraints rather than keyword arguments directly on the field type.
4. Use `EmailStr`, `AnyHttpUrl`, and other Pydantic-provided types for format validation rather than regex strings.
5. Validate business rules in `@model_validator(mode='after')` — keep format constraints in `Field` and semantic checks in validators.
