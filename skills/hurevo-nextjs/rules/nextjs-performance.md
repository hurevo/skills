---
title: Next.js Performance
impact: high
tags: [nextjs, performance, images, fonts, bundles]
---

## Why

- Unoptimised images are the single largest contributor to poor Core Web Vitals scores
- Loading all JavaScript upfront increases Time to Interactive; dynamic imports defer non-critical code
- Third-party scripts block parsing and inflate bundle size when loaded naively

## Pattern

**Bad** — native `<img>` tag, eager imports, unoptimised fonts:

```tsx
// Raw img tag — no lazy loading, no size optimisation, no blur placeholder
<img src="/hero.jpg" alt="Hero" style={{ width: '100%' }} />

// Entire charting library loaded upfront even on pages that don't show charts
import { HeavyChart } from 'heavy-chart-lib'

// Google Fonts loaded via <link> in _document — blocks render
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter" />
```

**Good** — Next.js Image, dynamic import, next/font:

```tsx
// Optimised image — WebP conversion, lazy load, blur placeholder, prevents CLS
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero banner showing the dashboard interface"
  width={1200}
  height={600}
  priority  // only for above-the-fold images
  placeholder="blur"
  blurDataURL={heroBlurDataUrl}
/>

// Dynamic import — chart only loads when the tab that needs it is active
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // chart uses browser APIs
})

// next/font — self-hosted, zero layout shift
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export default function RootLayout({ children }) {
  return <html lang="en" className={inter.className}>{children}</html>
}
```

## Rules

1. Always use `next/image` instead of `<img>` — set explicit `width` and `height` to prevent layout shift.
2. Add `priority` only to images that are above the fold; lazy-load everything else.
3. Dynamically import heavy client-side libraries with `next/dynamic` and provide a skeleton `loading` state.
4. Use `next/font` for web fonts — it self-hosts and inlines the critical CSS, eliminating render-blocking requests.
5. Audit bundle size with `ANALYZE=true next build` when adding large dependencies; budget 200 kB gzipped per route.
