---
title: Docker Compose Standards
impact: medium
tags: [docker, compose, networking, services]
---

## Why

- Exposing every service port to the host network makes them reachable from outside — only the public-facing service should be exposed
- Hardcoding credentials in compose files leaks secrets into version control
- Starting services without health checks causes dependent services to crash on boot before dependencies are ready

## Pattern

**Bad** — all ports exposed, credentials hardcoded, no health checks:

```yaml
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://admin:password123@db:5432/myapp  # ❌ hardcoded

  db:
    image: postgres:16
    ports:
      - "5432:5432"  # ❌ database port exposed to host
    environment:
      POSTGRES_PASSWORD: password123  # ❌ hardcoded

  redis:
    image: redis:7
    ports:
      - "6379:6379"  # ❌ redis port exposed to host
```

**Good** — env files, no unnecessary host ports, health checks, named volumes:

```yaml
services:
  app:
    build:
      context: .
      target: runner
    ports:
      - "3000:3000"  # only the app is accessible from the host
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    # No ports — only reachable within the Docker network
    env_file: .env.db
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    # No ports exposed to host
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

volumes:
  db_data:
```

## Rules

1. Only expose ports to the host for services that external clients need to reach — keep databases and caches internal.
2. Use `env_file` to load secrets rather than inline `environment` values — never commit `.env` files.
3. Add `healthcheck` to stateful services and use `depends_on: condition: service_healthy` for dependent apps.
4. Use named volumes for persistent data — anonymous volumes are dropped on `docker compose down -v`.
5. Set `restart: unless-stopped` on production services; omit it in development to avoid masking crash loops.
