---
title: FastAPI Security
impact: high
tags: [fastapi, security, auth, jwt, rate-limiting]
---

## Why

- JWT tokens without expiry or rotation can be stolen and used indefinitely
- Missing rate limiting on auth endpoints enables credential stuffing attacks
- Returning verbose error messages from auth failures reveals whether a username exists (user enumeration)

## Pattern

**Bad** — no expiry, returning specific error messages, hardcoded secrets:

```python
SECRET_KEY = "mysecret"  # ❌ hardcoded

@app.post("/login")
async def login(email: str, password: str):
    user = await get_user_by_email(email)
    if not user:
        return {"error": "User not found"}  # ❌ reveals whether email is registered
    if not verify_password(password, user.password_hash):
        return {"error": "Wrong password"}  # ❌ confirms user exists

    # ❌ token never expires
    token = jwt.encode({"sub": str(user.id)}, SECRET_KEY)
    return {"token": token}
```

**Good** — short-lived tokens, generic errors, env-sourced secrets, rate limiting:

```python
from datetime import datetime, timedelta, timezone
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from slowapi import Limiter
from slowapi.util import get_remote_address
import jwt

limiter = Limiter(key_func=get_remote_address)
bearer = HTTPBearer()

def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")

@app.post("/login")
@limiter.limit("5/minute")  # rate limit per IP
async def login(credentials: LoginRequest, request: Request):
    user = await get_user_by_email(credentials.email)
    # Generic error — same message whether user doesn't exist or password is wrong
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    return {"access_token": create_access_token(str(user.id)), "token_type": "bearer"}

async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
) -> User:
    try:
        payload = jwt.decode(creds.credentials, settings.jwt_secret, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("missing sub")
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = await User.get(user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user
```

## Rules

1. Set short expiry on access tokens (15 minutes); use refresh tokens with rotation for long-lived sessions.
2. Return identical error messages for "user not found" and "wrong password" — never reveal which is true.
3. Rate-limit all authentication endpoints with `slowapi` or equivalent; block after 5 failed attempts per IP per minute.
4. Load `SECRET_KEY` and `DATABASE_URL` from environment variables validated at startup — never hardcode secrets.
5. Validate token expiry, signature, and the presence of `sub` claim explicitly; catch all JWT exceptions and return 401.
