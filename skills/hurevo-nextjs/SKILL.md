---
name: hurevo-nextjs
description: Load for Next.js App Router projects. Covers Server vs Client Component rules, data fetching, performance, and security headers.
---

# Hurevo Next.js

Next.js App Router standards for Hurevo frontend projects. Contains 4 rules covering component model, data fetching, performance, and security.

## When to Apply

- Any project using Next.js with the App Router (`app/` directory)
- Adding new routes, layouts, or Server Actions
- Reviewing a PR for Next.js-specific patterns

## Rules Summary

### Component Model (HIGH)

#### nextjs-components - @rules/nextjs-components.md

Server Components by default — add `'use client'` only for browser APIs, event handlers, or client hooks. Keep Client Components as leaf nodes. Never mark entire layouts as `'use client'`.

```tsx
// Bad — entire layout is a client component, loses all SSR benefits
'use client'
export default function Layout({ children }) { return <div>{children}</div> }

// Good — layout stays a Server Component; only interactive parts are client
// app/layout.tsx — no 'use client'
export default function Layout({ children }) {
  return <html><body><Nav />{children}</body></html>
}
// components/Nav.tsx — only the dropdown needs 'use client'
'use client'
export function NavDropdown() { ... }
```

### Data Fetching (HIGH)

#### nextjs-data-fetching - @rules/nextjs-data-fetching.md

Server Components fetch directly with `fetch` and Next.js caching. Server Actions for mutations. Use `export const dynamic = 'force-dynamic'` explicitly for dynamic routes. Never fetch from the DB in Client Components.

```tsx
// Bad — data fetch in Client Component, useEffect pattern
'use client'
export default function Page() {
  useEffect(() => { fetch('/api/invoices').then(...) }, [])
}

// Good — Server Component fetches directly
export default async function Page() {
  const invoices = await db.invoice.findMany()
  return <InvoiceList invoices={invoices} />
}
```

### Performance (HIGH)

#### nextjs-performance - @rules/nextjs-performance.md

`next/image` for all content images. `next/font` for all fonts — never `<link>` to Google Fonts. `<Script strategy="lazyOnload">` for non-critical scripts. No single JS chunk over 250 KB.

```tsx
// Bad — raw <img>, <link> for font, <script> tag
<img src="/hero.jpg" />
<link href="https://fonts.googleapis.com/..." rel="stylesheet" />

// Good — optimised primitives
import Image from 'next/image'
import { Inter } from 'next/font/google'
<Image src="/hero.jpg" width={1200} height={600} alt="Hero" />
```

### Security (HIGH)

#### nextjs-security - @rules/nextjs-security.md

Never prefix secrets with `NEXT_PUBLIC_`. Validate all Server Action input with Zod. Set security headers in `next.config.js`. Use NextAuth.js — never custom session handling.

```tsx
// Bad — secret exposed to browser, unvalidated action input
const key = process.env.NEXT_PUBLIC_STRIPE_SECRET // exposed!

async function createInvoice(data: FormData) {
  'use server'
  await db.invoice.create({ data: Object.fromEntries(data) }) // unvalidated
}

// Good — server-only secret, Zod validation
const key = process.env.STRIPE_SECRET // server only

async function createInvoice(data: FormData) {
  'use server'
  const parsed = CreateInvoiceSchema.parse(Object.fromEntries(data))
  await db.invoice.create({ data: parsed })
}
```
