/**
 * Master registry of all available Hurevo skills.
 * category: core | service | quality | compliance | workflow | branding
 * service: (optional) which Hurevo service line this belongs to
 */
export const SKILLS = {
  // ── Core ──────────────────────────────────────────────────────────────────
  'hurevo-project-rules': {
    description: 'Core Hurevo engineering standards — load in every session',
    category: 'core',
  },

  // ── Service ───────────────────────────────────────────────────────────────
  'hurevo-laravel': {
    description: 'Laravel 11 + PHP 8.3 development standards',
    category: 'service',
    service: 'laravel',
  },
  'hurevo-automation': {
    description: 'n8n, Make, Zapier and custom Laravel job automation',
    category: 'service',
    service: 'automation',
  },
  'hurevo-ai-solution': {
    description: 'RAG chatbots, document intelligence, pgvector, LangChain',
    category: 'service',
    service: 'ai',
  },
  'hurevo-modernization': {
    description: 'Strangler Fig pattern, characterization tests, legacy migration',
    category: 'service',
    service: 'modernization',
  },
  'hurevo-react': {
    description: 'React + Vite component standards and patterns',
    category: 'service',
    service: 'laravel',
  },
  'hurevo-nextjs': {
    description: 'Next.js App Router, SSR/SSG, deployment rules',
    category: 'service',
  },
  'hurevo-python-fastapi': {
    description: 'FastAPI, Pydantic v2, async patterns for AI services',
    category: 'service',
    service: 'ai',
  },
  'hurevo-docker': {
    description: 'Dockerfile standards, Compose setup, production hardening',
    category: 'service',
  },
  'hurevo-database-migration': {
    description: 'Safe migration rules, rollback strategy, zero-downtime deploys',
    category: 'service',
  },

  // ── Quality ───────────────────────────────────────────────────────────────
  'hurevo-security': {
    description: 'OWASP rules, auth, PII handling, file uploads, payments',
    category: 'quality',
  },
  'hurevo-testing': {
    description: 'TDD workflow, PHPUnit/Pest, coverage requirements',
    category: 'quality',
  },
  'hurevo-api-docs': {
    description: 'OpenAPI 3.0 documentation generation standards',
    category: 'quality',
  },
  'hurevo-code-review': {
    description: 'Code review checklist, PR standards, what to block',
    category: 'quality',
  },
  'hurevo-performance': {
    description: 'Profiling, N+1 detection, caching and query optimisation',
    category: 'quality',
  },
  'hurevo-accessibility': {
    description: 'WCAG 2.1 AA, ARIA rules for client-facing UIs',
    category: 'quality',
  },
  'hurevo-ci-cd': {
    description: 'GitHub Actions pipelines, deployment gates, rollback',
    category: 'quality',
  },

  // ── Compliance ────────────────────────────────────────────────────────────
  'hurevo-compliance-uu-pdp': {
    description: 'Indonesian Personal Data Protection Law (UU PDP) obligations',
    category: 'compliance',
  },
  'hurevo-compliance-ojk': {
    description: 'OJK financial services regulator technical requirements',
    category: 'compliance',
  },
  'hurevo-compliance-hipaa': {
    description: 'HIPAA audit logging, PHI handling, breach notification',
    category: 'compliance',
  },
  'hurevo-compliance-pci-dss': {
    description: 'PCI DSS card data standards, scope reduction, tokenisation',
    category: 'compliance',
  },

  // ── Workflow ──────────────────────────────────────────────────────────────
  'hurevo-sprint-planning': {
    description: 'Sprint ceremonies, story sizing, definition of done',
    category: 'workflow',
  },
  'hurevo-deployment-runbook': {
    description: 'Pre/post deploy checklist, smoke tests, rollback steps',
    category: 'workflow',
  },
  'hurevo-incident-response': {
    description: 'Severity classification, escalation path, postmortem template',
    category: 'workflow',
  },

  // ── Branding ──────────────────────────────────────────────────────────────
  'hurevo-branding': {
    description: 'Brand colours, typography, logo usage, tone of voice',
    category: 'branding',
  },
}

export const SKILL_NAMES = Object.keys(SKILLS)

/**
 * Recommended skill sets per Hurevo service type.
 * Used by the `init` command.
 */
export const SERVICE_SKILL_SETS = {
  laravel: [
    'hurevo-project-rules',
    'hurevo-laravel',
    'hurevo-react',
    'hurevo-docker',
    'hurevo-database-migration',
    'hurevo-security',
    'hurevo-testing',
    'hurevo-api-docs',
    'hurevo-compliance-uu-pdp',
    'hurevo-compliance-pci-dss',
  ],
  automation: [
    'hurevo-project-rules',
    'hurevo-automation',
    'hurevo-security',
    'hurevo-testing',
  ],
  ai: [
    'hurevo-project-rules',
    'hurevo-ai-solution',
    'hurevo-python-fastapi',
    'hurevo-docker',
    'hurevo-security',
    'hurevo-testing',
    'hurevo-api-docs',
    'hurevo-compliance-uu-pdp',
    'hurevo-compliance-hipaa',
  ],
  modernization: [
    'hurevo-project-rules',
    'hurevo-modernization',
    'hurevo-laravel',
    'hurevo-docker',
    'hurevo-database-migration',
    'hurevo-security',
    'hurevo-testing',
  ],
}

export const SERVICE_NAMES = Object.keys(SERVICE_SKILL_SETS)
