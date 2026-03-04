---
title: React Styling Standards
impact: medium
tags: [react, css, tailwind, styling]
---

## Why

- Global CSS creates unpredictable cascade conflicts as the app grows
- Inline styles bypass the design system and make responsive/dark-mode work duplicated
- Mixing styling approaches in one codebase makes maintenance inconsistent

## Pattern

**Bad** — inline styles and hardcoded values:

```tsx
function Card({ title, body }) {
  return (
    <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#111' }}>{title}</h2>
      <p style={{ fontSize: '14px', color: '#666', marginTop: '8px' }}>{body}</p>
    </div>
  )
}
```

**Good** — Tailwind utility classes referencing design tokens:

```tsx
// components/Card.tsx
interface CardProps {
  title: string
  body: string
  variant?: 'default' | 'highlighted'
}

export function Card({ title, body, variant = 'default' }: CardProps) {
  return (
    <div className={cn(
      'rounded-lg p-4 shadow-sm',
      variant === 'default' ? 'bg-white' : 'bg-brand-50 border border-brand-200'
    )}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{body}</p>
    </div>
  )
}

// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Good** — CSS Modules when scoped styles are preferred:

```tsx
// components/Card.module.css
.card { @apply rounded-lg p-4 shadow-sm bg-white; }
.title { @apply text-lg font-semibold text-gray-900; }
.body  { @apply mt-2 text-sm text-gray-600; }

// components/Card.tsx
import styles from './Card.module.css'

export function Card({ title, body }: CardProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.body}>{body}</p>
    </div>
  )
}
```

## Rules

1. Pick one styling approach per project (Tailwind or CSS Modules) and use it consistently throughout.
2. Never use inline `style` props except for truly dynamic values (e.g. calculated widths from JS).
3. Use `cn()` (clsx + tailwind-merge) for conditional class composition — no string interpolation.
4. Extend Tailwind's theme for brand colours and spacing rather than using arbitrary values like `text-[#abc]`.
5. Ensure all interactive states (hover, focus, active, disabled) are styled — keyboard users depend on visible focus rings.
