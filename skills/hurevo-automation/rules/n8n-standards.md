---
title: n8n Standards
impact: HIGH
tags: [n8n, workflow, credentials, versioning]
---

# n8n Standards

Pin the n8n version in Docker Compose. Store all credentials in n8n's credential vault — never in node parameters. One workflow per business event. Every production workflow has an Error Trigger.

## Why

- **Stability**: Unpinned images silently upgrade on container restart, breaking workflows when n8n changes node behaviour.
- **Security**: Credentials embedded in node parameters appear in workflow exports and logs. The vault encrypts them and keeps them out of version control.
- **Maintainability**: One-workflow-per-event keeps flows short enough to audit. Monolithic workflows become unmaintainable after 20+ nodes.

## Pattern

```yaml
# Bad — latest tag, no resource limits
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_BASIC_AUTH_PASSWORD=admin  # hardcoded, weak
    volumes:
      - ./n8n:/home/node/.n8n

# Good — pinned version, environment-sourced secrets, resource limits
services:
  n8n:
    image: n8nio/n8n:1.48.0
    restart: unless-stopped
    environment:
      - N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=${POSTGRES_DB}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
    deploy:
      resources:
        limits:
          memory: 1G
```

```
# Bad — one workflow for everything (order placed)
[Webhook] → [CRM sync] → [Email] → [Slack] → [Inventory update] → [Invoice create] → [PDF upload] → [Accounting sync]
# 40 nodes, impossible to test individual paths

# Good — one workflow per business event
[Webhook: order.placed] → [HTTP: POST /internal/crm-sync]
[Webhook: order.placed] → [HTTP: POST /internal/send-confirmation]
[Webhook: order.placed] → [HTTP: POST /internal/update-inventory]
# Each workflow is independently testable and retryable
```

```
# Every production workflow — add Error Trigger node
[Error Trigger] → [Set: format_error_message] → [Slack: #ops-alerts]
```

## Rules

1. Pin the n8n Docker image to a specific version tag — never `latest`. Update versions deliberately after testing.
2. Store all API keys, passwords, and tokens in n8n's Credentials vault — never paste them into node parameters.
3. One workflow per business event — split at logical event boundaries, not at technical ones.
4. Every production workflow must have an Error Trigger connected to a Slack or PagerDuty alert.
5. Use n8n's built-in `Wait` node for polling instead of `Sleep` — it releases the worker thread.
6. Export all production workflows as JSON and commit to version control after each change.
7. Test workflows with n8n's manual trigger before enabling the production trigger.
