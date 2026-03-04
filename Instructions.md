Two parts here — a quick package.json fix for public npm, then the full OpenCode prompt.

***

## Publishing to Public npm

Scoped packages (`@hurevo/skills`) default to private on npm. You need two changes:

### 1. Update `package.json`

```json
{
  "name": "@hurevo/skills",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  }
}
```

### 2. Create npm Organization

Go to [npmjs.com](https://npmjs.com) → Create Account → Create Organization → name it `hurevo`. This reserves the `@hurevo` scope publicly.

```bash
# Login to public npm
npm login
# Enter your npm username, password, OTP

# Verify login
npm whoami

# Publish (first time needs --access public explicitly)
npm publish --access public

# All subsequent releases — just:
npm publish
```

Your package is now installable by anyone:
```bash
npx @hurevo/skills init --service laravel
```

***

## The Comprehensive OpenCode Prompt

This is a **master session prompt** — paste it at the start of your OpenCode session, then issue individual generation commands per skill. It gives OpenCode the full Hurevo domain context so every SKILL.md it generates is precise, opinionated, and production-ready.

```
You are helping build the @hurevo/skills npm package — a collection of reusable
instruction files (SKILL.md) for AI coding agents (OpenCode, Claude Code, Cursor,
Windsurf). Each SKILL.md is loaded by an engineer at the start of a coding session
to give the AI agent the standards, rules, and domain knowledge for that specific
type of work.

══════════════════════════════════════════════════════════
COMPANY CONTEXT: HUREVO
══════════════════════════════════════════════════════════

Hurevo is a Jakarta-based tech and IT services consultancy targeting SMB to
mid-market clients. Brand promise: Fast, Stable, Secure.

Hurevo has four service lines:
1. Custom Software Development — web apps, backend APIs, mobile apps.
   Primary stack: Laravel 11, PHP 8.3+, PostgreSQL, Redis, Docker, React/Vue.
2. Automation & Integrations — n8n (self-hosted), Make, Zapier, custom Laravel
   jobs. Connects CRMs, ERPs, accounting tools, and bespoke systems.
3. AI Solutions & Intelligent Assistants — RAG chatbots, document intelligence,
   AI readiness assessments. Stack: Python (FastAPI/LangChain) or Laravel +
   OpenAI/Anthropic SDK. Vector store: pgvector on PostgreSQL.
4. Legacy System Modernization — Strangler Fig pattern. Characterization tests
   first, behavioral equivalence validation, parallel run before cutover.

Clients span: professional services, healthcare, retail/e-commerce, with
compliance obligations including UU PDP (Indonesian Personal Data Protection Law),
OJK (financial services regulator), HIPAA, PCI DSS depending on client.

Hurevo's engagement workflow has five phases:
  Discovery & Qualification → Proposal & Agreement → Project Execution
  → Launch & Stabilization → Ongoing Relationship

AI agents (CrewAI + LangGraph) handle business workflows (Discovery Researcher,
Context Synthesizer, Risk Critic, Proposal Drafter, Status Reporter, etc.).
Engineering agents (OpenCode, Claude Code) assist engineers during development.

══════════════════════════════════════════════════════════
WHAT A SKILL.md IS
══════════════════════════════════════════════════════════

A SKILL.md is a plain Markdown instruction file loaded into an AI coding agent's
context. It encodes:
  - Standards the agent must follow without exception
  - Domain knowledge the agent needs for this type of project
  - Workflow steps the agent should follow (ordered)
  - Security rules and non-negotiables
  - Common mistakes the agent should actively avoid
  - Reminders about engineer accountability

A SKILL.md is NOT:
  - A tutorial or educational document
  - Code implementation (no code blocks with actual business logic)
  - Marketing language or fluffy descriptions
  - Excessively long — it must load fast and be scannable mid-session

Target length per SKILL.md: 60–120 lines. Dense, directive, opinionated.
Tone: direct, imperative, specific. Not "you should consider" — say "do this".

══════════════════════════════════════════════════════════
SKILL.md FORMAT TEMPLATE
══════════════════════════════════════════════════════════

Every SKILL.md must follow this structure:

```
# <Skill Name>

<One sentence: what this skill covers and when to load it.>

## [Primary Domain Section — e.g., Architecture, Integration Rules, Process Rules]
<Numbered or bulleted rules. Imperative voice. Specific, not generic.>

## Security Non-Negotiables
<Rules that are NEVER optional. Things the agent must check regardless of task.>

## [Workflow Section — e.g., "When Creating a New Feature", "When Designing a Workflow"]
<Ordered numbered steps the agent follows for the primary recurring task.>

## Common Mistakes to Avoid
<Specific failure patterns this type of agent/task produces. Name them.>
```

══════════════════════════════════════════════════════════
ENGINEER ACCOUNTABILITY RULE (include in every skill)
══════════════════════════════════════════════════════════

Every SKILL.md must end with or embed this principle:

  You are a tool. The engineer owns every line of code you produce.
  Present output as "ready for your review", not "done".
  Flag uncertainty rather than guessing silently.

══════════════════════════════════════════════════════════
EXISTING SKILLS (already written — do not regenerate)
══════════════════════════════════════════════════════════

These skills already exist in the package. Use them as reference quality:
  - hurevo-project-rules  (core rules, every session)
  - hurevo-laravel        (Laravel 11 + PHP 8.3)
  - hurevo-automation     (n8n, Make, Zapier)
  - hurevo-ai-solution    (RAG, chatbots, document intelligence)
  - hurevo-modernization  (Strangler Fig, legacy analysis)
  - hurevo-security       (OWASP, AI agent security mistakes)
  - hurevo-testing        (TDD, PHPUnit/Pest, coverage)
  - hurevo-api-docs       (OpenAPI 3.0 generation)

══════════════════════════════════════════════════════════
HOW TO GENERATE A NEW SKILL
══════════════════════════════════════════════════════════

When I say "generate skill: <name>", you will:

1. Create the file at: skills/<name>/SKILL.md
2. Follow the FORMAT TEMPLATE above exactly.
3. Content must be:
   - Grounded in Hurevo's actual stack and service context above.
   - Opinionated — make real decisions, not hedged suggestions.
   - Security-aware — every skill touches security somewhere.
   - Engineer-accountability-aware — agent knows it is a tool.
4. After generating, list the rules you encoded and ask:
   "Are there any Hurevo-specific constraints I should add?"
5. Register the skill in src/registry.js under SKILLS with:
   name, description, category (core|service|quality), service (if applicable).
6. If the skill belongs in a SERVICE_SKILL_SETS entry, add it there too.

══════════════════════════════════════════════════════════
GENERATE COMMANDS — USE THESE TO CREATE SKILLS
══════════════════════════════════════════════════════════

After loading this context, I will issue commands like:
  "generate skill: hurevo-docker"
  "generate skill: hurevo-react"
  "generate skill: hurevo-database-migration"
  "generate skill: hurevo-compliance-uu-pdp"

Wait for my command. Do not generate anything yet.
```

***

## Using the Prompt in OpenCode

```bash
# Start session scoped to the skills package
opencode --session "feat/new-skills"

# Paste the full master prompt above as your first message
# OpenCode will confirm it has loaded the context

# Then generate skills one by one:
> "generate skill: hurevo-docker"
> "generate skill: hurevo-react"
> "generate skill: hurevo-compliance-uu-pdp"
> "generate skill: hurevo-database-migration"
> "generate skill: hurevo-code-review"
```

***

## Suggested New Skills to Generate

Once the prompt is loaded, here's what to build next for the `@hurevo/skills` package organized by category:

**Service Skills**
```
generate skill: hurevo-react
generate skill: hurevo-nextjs
generate skill: hurevo-python-fastapi
generate skill: hurevo-docker
generate skill: hurevo-database-migration
```

**Quality Skills**
```
generate skill: hurevo-code-review
generate skill: hurevo-performance
generate skill: hurevo-accessibility
generate skill: hurevo-ci-cd
```

**Compliance Skills** (highest value for Indonesian clients)
```
generate skill: hurevo-compliance-uu-pdp
generate skill: hurevo-compliance-ojk
generate skill: hurevo-compliance-hipaa
generate skill: hurevo-compliance-pci-dss
```

**Workflow Skills**
```
generate skill: hurevo-sprint-planning
generate skill: hurevo-deployment-runbook
generate skill: hurevo-incident-response
```

The compliance skills are the most unique to Hurevo — they encode UU PDP data localization obligations, OJK reporting requirements, and HIPAA audit logging standards directly into the agent's context, which no public skills package covers for Indonesian clients.
