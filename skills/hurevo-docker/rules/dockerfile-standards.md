---
title: Dockerfile Standards
impact: high
tags: [docker, dockerfile, build, image-size]
---

## Why

- Images built without layer caching strategy re-download dependencies on every code change, slowing CI by minutes
- Running as root inside containers means any container escape immediately grants host root privileges
- Including development tools and test dependencies in production images bloats size and widens the attack surface

## Pattern

**Bad** — single stage, root user, no cache optimisation:

```dockerfile
FROM node:20

WORKDIR /app

# ❌ Copies everything first — invalidates cache on any file change, reinstalling all deps each time
COPY . .
RUN npm install

# ❌ Runs as root
EXPOSE 3000
CMD ["node", "server.js"]
```

**Good** — multi-stage build, non-root user, cache-optimised layer order:

```dockerfile
# Stage 1: install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
# Copy only package files first — cache this layer until deps change
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Stage 2: build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: production image — only runtime artefacts
FROM node:20-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER appuser
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## Rules

1. Use multi-stage builds to separate build-time dependencies from the production image.
2. Copy `package.json` and lock files before source code to maximise layer cache reuse.
3. Use `-alpine` or `-slim` base images; avoid `latest` — pin to a specific version (e.g. `node:20-alpine`).
4. Create and switch to a non-root user before the `CMD` instruction.
5. Add a `.dockerignore` that excludes `node_modules`, `.git`, `dist`, `.env*`, and test files.
