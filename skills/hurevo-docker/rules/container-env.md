---
title: Container Environment Configuration
impact: medium
tags: [docker, environment, secrets, config]
---

## Why

- Baking secrets into images means they are visible in layer history to anyone with image pull access
- Applications that don't handle `SIGTERM` ignore Docker's graceful shutdown signal and are killed forcibly, dropping in-flight requests
- Relying on environment variable names without documentation forces engineers to guess configuration keys

## Pattern

**Bad** — secrets in image, no graceful shutdown, undocumented config:

```dockerfile
ENV DATABASE_URL=postgres://admin:secret@prod-db:5432/app  # ❌ baked into image layer
ENV API_KEY=sk-abc123  # ❌ visible in docker inspect and image history

CMD ["node", "server.js"]
# ❌ process doesn't handle SIGTERM — Docker will SIGKILL after 10s
```

**Good** — runtime secrets, SIGTERM handling, `.env.example` as documentation:

```dockerfile
# No secrets in the image — passed at runtime via --env-file or secrets manager
CMD ["node", "server.js"]
```

```js
// server.js — graceful shutdown
const server = app.listen(3000)

process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully')
  server.close(async () => {
    await db.end()        // close connection pool
    await redis.quit()    // close cache connections
    process.exit(0)
  })
  // Force exit after 30s if connections don't drain
  setTimeout(() => process.exit(1), 30_000)
})
```

```bash
# .env.example — committed to repo; documents all required variables
DATABASE_URL=postgres://user:password@host:5432/dbname
REDIS_URL=redis://localhost:6379
API_KEY=your-api-key-here
JWT_SECRET=at-least-32-characters-long
LOG_LEVEL=info
PORT=3000
```

```bash
# .env — never committed; gitignored
DATABASE_URL=postgres://admin:realpassword@prod-db:5432/myapp
```

## Rules

1. Never set secrets in `ENV` Dockerfile instructions — pass them at runtime via `--env-file`, Docker Secrets, or a secrets manager.
2. Implement `SIGTERM` handling for graceful shutdown — drain in-flight requests, close DB/cache connections, then exit.
3. Commit a `.env.example` with placeholder values; add `.env*` to `.gitignore`.
4. Use `HEALTHCHECK` in the Dockerfile to allow orchestrators to detect unhealthy containers and restart them.
5. Set `NODE_ENV=production` (or equivalent) at runtime — never in the image — so the same image can be used across environments.
