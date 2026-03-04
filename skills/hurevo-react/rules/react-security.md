---
title: React Security Practices
impact: high
tags: [react, security, xss, auth]
---

## Why

- React's JSX escapes strings by default, but `dangerouslySetInnerHTML` bypasses this entirely — XSS is one bad prop away
- Storing tokens in `localStorage` exposes them to any XSS payload; `httpOnly` cookies are not readable by JavaScript
- Rendering user-controlled URLs without validation enables javascript: protocol injection

## Pattern

**Bad** — raw HTML injection and unsafe token storage:

```tsx
// XSS via dangerouslySetInnerHTML
function Comment({ content }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />
}

// Token in localStorage — readable by any script on the page
function login(token) {
  localStorage.setItem('auth_token', token)
}

// Unvalidated href — allows javascript: links
function UserLink({ user }) {
  return <a href={user.website}>{user.name}</a>
}
```

**Good** — sanitised HTML, httpOnly cookies, validated URLs:

```tsx
import DOMPurify from 'dompurify'

// Sanitise before injecting — only when raw HTML is genuinely required
function Comment({ content }: { content: string }) {
  const clean = DOMPurify.sanitize(content, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong'] })
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}

// Prefer httpOnly cookies (set by the server); use memory state as fallback
function useAuth() {
  // Token lives in httpOnly cookie — not accessible here
  // Only store non-sensitive session metadata in state
  const [user, setUser] = useState<User | null>(null)
  return { user, setUser }
}

// Validate URL scheme before rendering
const SAFE_PROTOCOLS = ['http:', 'https:', 'mailto:']

function SafeLink({ href, children }: { href: string; children: ReactNode }) {
  const url = new URL(href, window.location.origin)
  if (!SAFE_PROTOCOLS.includes(url.protocol)) return <span>{children}</span>
  return <a href={href} rel="noopener noreferrer" target="_blank">{children}</a>
}
```

## Rules

1. Never use `dangerouslySetInnerHTML` without sanitising first with DOMPurify; prefer plain text rendering.
2. Do not store auth tokens or session secrets in `localStorage` or `sessionStorage`.
3. Validate URL scheme before rendering user-supplied `href` or `src` values.
4. Add `rel="noopener noreferrer"` to all `target="_blank"` links.
5. Use Content Security Policy headers (configured server-side) as a defence-in-depth layer; CSP alone is not a substitute for sanitisation.
