---
title: Next.js Component Patterns
impact: high
tags: [nextjs, components, server-components, client-components]
---

## Why

- Using `'use client'` at the wrong level pushes too much JavaScript to the browser, defeating the purpose of Server Components
- Mixing server-only data access into client components causes build errors and leaks server secrets
- Not co-locating the `'use client'` directive at the leaf level forces parent trees to be client-rendered unnecessarily

## Pattern

**Bad** — `'use client'` too high in the tree, server data in a client component:

```tsx
// app/dashboard/page.tsx
'use client' // ❌ entire page is now client-rendered

import { db } from '@/lib/db' // ❌ will fail — cannot import server-only modules in client components

export default function DashboardPage() {
  const [data, setData] = useState(null)
  useEffect(() => { /* fetch workaround */ }, [])
  return <DashboardShell data={data} />
}
```

**Good** — server component fetches, client component handles interaction:

```tsx
// app/dashboard/page.tsx — Server Component (no directive needed)
import { db } from '@/lib/db'
import { DashboardShell } from './DashboardShell'
import { MetricsChart } from './MetricsChart'

export default async function DashboardPage() {
  const metrics = await db.query.metrics.findMany({ limit: 30 })
  return (
    <DashboardShell>
      <MetricsChart initialData={metrics} /> {/* client component at leaf */}
    </DashboardShell>
  )
}

// app/dashboard/MetricsChart.tsx — Client Component at the leaf
'use client'

import { useState } from 'react'
import type { Metric } from '@/types'

interface Props {
  initialData: Metric[]
}

export function MetricsChart({ initialData }: Props) {
  const [data, setData] = useState(initialData)
  // interactive chart logic here
  return <canvas />
}
```

## Rules

1. Default to Server Components; only add `'use client'` when you need interactivity (hooks, event handlers, browser APIs).
2. Push `'use client'` as far down the component tree as possible — keep parent layouts as Server Components.
3. Never import server-only modules (`db`, `fs`, server env vars) into client components.
4. Pass serialisable data from Server Components to Client Components via props — no function props across the boundary.
5. Use `server-only` package to enforce module boundaries at build time: `import 'server-only'` at the top of server-only files.
