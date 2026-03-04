---
title: Container Security
impact: high
tags: [docker, security, containers, capabilities]
---

## Why

- Containers running as root with all Linux capabilities can escape the container on vulnerable kernels
- Writable filesystems allow an attacker who gains code execution to modify application files and persist malware
- Images with known CVEs in their base layer are the most common source of container security findings

## Pattern

**Bad** — root user, no capability restrictions, writable filesystem:

```dockerfile
FROM ubuntu:latest  # ❌ bloated base with many attack surface packages
# No USER instruction — runs as root by default
CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml — no security constraints
services:
  app:
    image: myapp
    # ❌ no security_opt, no read_only, full capabilities
```

**Good** — non-root, minimal capabilities, read-only filesystem:

```dockerfile
FROM node:20-alpine

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --chown=appuser:appgroup . .

USER appuser

# Declare the port but don't bind to privileged (<1024) ports
EXPOSE 3000
CMD ["node", "server.js"]
```

```yaml
services:
  app:
    image: myapp:latest
    user: "1001:1001"
    read_only: true  # filesystem is read-only
    tmpfs:
      - /tmp           # writable temp dir if needed
      - /app/cache     # writable cache dir if needed
    security_opt:
      - no-new-privileges:true  # prevents privilege escalation via setuid binaries
    cap_drop:
      - ALL            # drop all Linux capabilities
    cap_add:
      - NET_BIND_SERVICE  # add back only what is needed
    restart: unless-stopped
```

## Rules

1. Never run application containers as root — create a dedicated non-root user in the Dockerfile.
2. Drop all Linux capabilities with `cap_drop: [ALL]` and add back only what the app genuinely requires.
3. Set `read_only: true` on the container filesystem; use `tmpfs` mounts for directories that need writes.
4. Add `security_opt: [no-new-privileges:true]` to prevent privilege escalation via setuid binaries.
5. Scan images in CI with `docker scout` or `trivy` and fail the pipeline on CRITICAL or HIGH CVEs.
