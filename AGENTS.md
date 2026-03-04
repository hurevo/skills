# AGENTS.md — @hurevo/skills Development Guide

For AI coding agents (OpenCode, Claude Code, Cursor, Windsurf) working on this repository.

## Build, Lint, Test Commands

### Running All Tests
```bash
npm test
# Runs: node --test src/**/*.test.js
```

### Running a Single Test
```bash
node --test src/path/to/file.test.js
# Example: node --test src/commands/add.test.js
```

### Running Lint Check
```bash
npm run lint
# Runs: eslint src/ cli.js
```

### Running Lint with Auto-Fix
```bash
npx eslint src/ cli.js --fix
```

## Code Style Guidelines

### Module System
- **Use ES6 modules only** (`import`/`export`)
- Shebang required in CLI entry points: `#!/usr/bin/env node`
- Lazy-load modules in CLI commands for fast `--help` performance

### Imports and Organization
- Group imports: Node built-ins first, then third-party, then local modules
- Use absolute imports from project root where clarity demands it
- Import only what you need; avoid default imports unless necessary

### Formatting
- **No linter config file needed** — ESLint uses default flat config
- **2-space indentation** (standard Node.js convention)
- **Single quotes** for strings (ESLint default)
- **No semicolons** (configured in ESLint)
- **Line length:** Keep under 100 characters where practical; 120 max

### Types and Validation
- No TypeScript — plain JavaScript with JSDoc type hints where helpful
- Document function signatures with JSDoc blocks for complex functions
- Use descriptive parameter names; avoid single letters except for loop counters

### Naming Conventions
- **Constants:** UPPER_CASE only for truly constant values
- **Functions/variables:** camelCase
- **Files:** kebab-case for multi-word filenames (e.g., `add-skill.js`)
- **Classes/constructors:** PascalCase (if used)

### Error Handling
- Always propagate errors up with context; don't swallow silently
- Use descriptive error messages that guide the user toward a fix
- Check return values from async operations before proceeding
- Validate command-line options and inputs early, fail fast

### Comments
- Keep comments sparse; write self-documenting code instead
- Use comments to explain **why**, not what the code does
- Mark important edge cases and non-obvious logic blocks

### Async/Await
- Prefer `async`/`await` over `.then()` chains
- Always `await` promises; use `Promise.all()` for parallel operations where safe
- Handle rejections with try/catch in async functions

### CLI Module Pattern
- Commands are lazily imported in `cli.js` for fast startup
- Each command lives in `src/commands/<name>.js`
- Export an async function matching the command name: `export const add = async (skills, opts) => { }`

## Testing Standards

- Test files: `src/**/*.test.js`
- Use Node.js built-in `test` module (no external test runner)
- One test file per source module being tested
- Clear test names describing the behavior being validated
- Use `assert` from the `assert` module for assertions

## Git and Commits

- Keep commits small and focused on a single concern
- Commit messages: imperative mood ("add", "fix", "refactor"), lowercase, no period
- Example: `add command to remove installed skills`

## Package Publishing

- Scoped package: `@hurevo/skills`
- Publishes to private Hurevo registry: `npm publish --registry https://npm.hurevo.cloud`
- Version bumping: `npm version patch|minor|major`
- Do not change `publishConfig` — it is configured for restricted access

## Project Structure

```
skills/
├── cli.js              # Entry point; command registration
├── package.json        # Package metadata and scripts
├── README.md           # User-facing documentation
├── Instructions.md     # OpenCode session prompt template
├── AGENTS.md           # This file
└── skills/             # Skill definitions directory
    └── <skill-name>/
        └── SKILL.md    # Skill content (Markdown)
```

## Key Rules for Agents

1. **Read the Instructions.md first** — it contains Hurevo company context, SKILL.md format rules, and registration steps required when adding new skills.
2. **Never modify publishConfig** in package.json.
3. **Always validate inputs** before processing in commands.
4. **Lazy-load commands** — do not import command modules at the top level of `cli.js`.
5. **Preserve skill registry consistency** — if you add or remove a skill, update `src/registry.js` (see README.md step 3).
