# @hurevo/skills

Hurevo AI coding skills manager. Installs reusable instruction sets for OpenCode, Claude Code, Cursor, and Windsurf.

## Quick Start

```bash
# Initialize a new project with the right skills
npx @hurevo/skills init --service laravel

# Add a specific skill
npx @hurevo/skills add hurevo-security

# See all available skills
npx @hurevo/skills list

# Sync skills across all agent formats after git pull
npx @hurevo/skills sync

# Update skills to latest version
npx @hurevo/skills update
```

## All Commands

| Command | Description |
|---|---|
| `add <skill...>` | Install skills to current project (or globally with `-g`) |
| `remove <skill...>` | Remove installed skills |
| `list` | List available skills and installation status |
| `init` | Install the recommended skill set for a Hurevo service type |
| `sync` | Sync installed skills across all agent formats |
| `update [skill...]` | Update skills to latest bundled version |

## Available Skills

| Skill | When to Use |
|---|---|
| `hurevo-project-rules` | **Every session, every project** — core engineering rules |
| `hurevo-laravel` | Custom Software Development (Laravel 11) projects |
| `hurevo-automation` | Automation & Integration (n8n, Make, Zapier) projects |
| `hurevo-ai-solution` | AI Solutions (RAG, chatbots, document intelligence) projects |
| `hurevo-modernization` | Legacy System Modernization projects |
| `hurevo-security` | Any session touching auth, PII, file uploads, payments |
| `hurevo-testing` | TDD workflow and coverage requirements |
| `hurevo-api-docs` | OpenAPI 3.0 documentation generation |

## Agent Install Paths

| Agent | Path (project) | Path (global with -g) |
|---|---|---|
| OpenCode | `.opencode/skills/<name>/SKILL.md` | `~/.config/opencode/skills/<name>/SKILL.md` |
| Claude Code | `.claude/skills/<name>/SKILL.md` | — |
| Cursor | `.cursor/skills/<name>/SKILL.md` | — |
| Windsurf | `.windsurf/skills/<name>/SKILL.md` | — |

## Options

```bash
# Install globally (available in all projects)
hurevo-skills add hurevo-project-rules --global

# Target a specific agent only
hurevo-skills add hurevo-laravel --agent claude
hurevo-skills add hurevo-security --agent opencode

# Install for a specific Hurevo service type
hurevo-skills init --service laravel
hurevo-skills init --service automation
hurevo-skills init --service ai
hurevo-skills init --service modernization
```

## Publishing (Hurevo Internal)

```bash
# Bump version and publish to private npm registry
npm version patch   # or minor / major
npm publish --registry https://npm.hurevo.cloud
```

## Adding a New Skill

1. Create `skills/<your-skill-name>/SKILL.md` with the instruction content.
2. Add an entry to `src/registry.js` under `SKILLS`.
3. If it should be part of an `init` skill set, add it to `SERVICE_SKILL_SETS` in `src/registry.js`.
4. Bump the package version and publish.
