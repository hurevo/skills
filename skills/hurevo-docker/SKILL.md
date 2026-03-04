---
name: hurevo-docker
description: Load when writing Dockerfiles, Docker Compose configs, or containerising applications. Covers multi-stage builds, security hardening, and Compose standards.
---

# Hurevo Docker

Dockerfile and Docker Compose standards for Hurevo projects. Contains 4 rules covering Dockerfile structure, Compose standards, security hardening, and runtime configuration.

## When to Apply

- Writing or reviewing a Dockerfile for any service
- Setting up Docker Compose for a new project
- Hardening an existing container configuration

## Rules Summary

### Dockerfile (HIGH)

#### dockerfile-standards - @rules/dockerfile-standards.md

Pinned versioned base images — never `:latest`. Multi-stage builds: `builder` for deps, `runtime` for the final image. Non-root user. Exec form `CMD`. Strict `.dockerignore`.

```dockerfile
# Bad — latest tag, no multi-stage, root user
FROM php:latest
COPY . .
RUN composer install
CMD "php artisan serve"

# Good — pinned, multi-stage, non-root, exec form
FROM php:8.3-fpm-alpine AS builder
WORKDIR /app
COPY composer.* ./
RUN composer install --no-dev --optimize-autoloader

FROM php:8.3-fpm-alpine AS runtime
RUN adduser -D appuser
WORKDIR /app
COPY --from=builder /app/vendor ./vendor
COPY . .
USER appuser
CMD ["php-fpm"]
```

### Docker Compose (HIGH)

#### compose-standards - @rules/compose-standards.md

Use `compose.yml` (Compose V2). `healthcheck` on every long-running service. `depends_on.condition: service_healthy`. Named volumes for persistent data. Separate `compose.override.yml` for dev.

```yaml
# Bad — no healthcheck, depends_on without condition, bind-mount for DB
services:
  db:
    image: postgres:16
    volumes:
      - ./data:/var/lib/postgresql/data  # bind-mount in production
  app:
    depends_on: [db]  # no health condition

# Good — healthcheck, named volume, healthy condition
services:
  db:
    image: postgres:16-alpine
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $POSTGRES_USER"]
      interval: 10s
      retries: 5
  app:
    depends_on:
      db:
        condition: service_healthy
volumes:
  db_data:
```

### Security (HIGH)

#### container-security - @rules/container-security.md

Never bake `.env` or secrets into image layers. Scan with `trivy` or `docker scout` in CI — block on critical CVEs. `read_only: true` filesystem with tmpfs for writable dirs. Resource limits on every service.

```yaml
# Bad — no resource limits, writable filesystem, ports exposed in production
services:
  app:
    ports:
      - "5432:5432"  # DB port exposed to host in production!

# Good — resource limits, read-only fs, no external DB port
services:
  app:
    read_only: true
    tmpfs: [/tmp, /var/run]
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
  db:
    # No ports: section — internal network only
```

### Environment Config (HIGH)

#### container-env - @rules/container-env.md

Load env from `.env` via `env_file` — never hardcode values in `compose.yml`. `ARG` for build-time values, `ENV` for runtime values. Explicit named network. Document each `ENV` variable with a comment.

```yaml
# Bad — hardcoded values, default bridge network
services:
  app:
    environment:
      - DB_PASSWORD=secret123
      - APP_KEY=base64:abc...

# Good — env_file, named network
services:
  app:
    env_file: .env
    networks:
      - internal
networks:
  internal:
    driver: bridge
```
