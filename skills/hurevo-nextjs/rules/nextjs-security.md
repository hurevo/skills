---
title: Next.js Security
impact: high
tags: [nextjs, security, headers, auth, middleware]
---

## Why

- Missing HTTP security headers leave apps vulnerable to clickjacking, MIME sniffing, and XSS via reflected scripts
- Unprotected API routes expose server-side logic to unauthenticated requests
- Trusting environment variables without validation leaks secrets and causes silent production failures

## Pattern

**Bad** — no security headers, unprotected routes, missing env validation:

```tsx
// next.config.js — no headers configured
module.exports = { }

// app/api/admin/users/route.ts — no auth check
export async function GET() {
  const users = await db.user.findMany()
  return Response.json(users) // ❌ anyone can call this
}

// lib/config.ts — unvalidated env access
export const config = {
  apiKey: process.env.API_KEY, // could be undefined; no one notices until runtime
}
```

**Good** — security headers, middleware auth, validated env:

```tsx
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'nonce-{NONCE}'; style-src 'self' 'unsafe-inline'",
  },
]

export default { async headers() { return [{ source: '/(.*)', headers: securityHeaders }] } }

// middleware.ts — protect all /dashboard routes
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.next()
}

export const config = { matcher: ['/dashboard/:path*', '/api/admin/:path*'] }

// lib/env.ts — validated at startup with zod
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  API_KEY: z.string().min(1),
})

export const env = envSchema.parse(process.env)
```

## Rules

1. Configure security headers in `next.config.ts` for all routes — at minimum X-Frame-Options, X-Content-Type-Options, and CSP.
2. Protect API routes and pages using Middleware — don't rely on client-side redirects alone.
3. Validate all `process.env` values at startup with Zod; fail fast with a clear error rather than undefined at runtime.
4. Never expose `NEXT_PUBLIC_` prefixed variables for secrets — those are bundled into client JavaScript.
5. Use `next-auth` or an equivalent server-side session library; never roll your own JWT verification.
