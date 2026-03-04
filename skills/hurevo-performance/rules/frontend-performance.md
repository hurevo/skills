---
title: Frontend Performance
impact: high
tags: [performance, frontend, web-vitals, images, bundles]
---

## Why

- Shipping the full JavaScript bundle upfront increases Time to Interactive even for users who never visit most routes
- Rendering a list of 10,000 items forces the browser to create 10,000 DOM nodes — the page becomes unresponsive and scroll performance collapses
- Third-party scripts loaded synchronously block HTML parsing and inflate LCP by hundreds of milliseconds

## Pattern

**Bad** — eager imports, unvirtualised list, synchronous third-party scripts:

```tsx
// ❌ All route components loaded upfront — one giant bundle
import { Dashboard } from './pages/Dashboard'
import { Reports } from './pages/Reports'
import { Analytics } from './pages/Analytics'

// ❌ Renders 10,000 DOM nodes at once
function UserList({ users }: { users: User[] }) {
  return (
    <ul>
      {users.map(u => <UserRow key={u.id} user={u} />)}
    </ul>
  )
}

// ❌ In index.html — blocks parsing
<script src="https://cdn.analytics.com/tracker.js"></script>
```

**Good** — dynamic imports, virtualised list, deferred scripts:

```tsx
// ✅ Route-level code splitting — each page is a separate chunk
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Reports   = lazy(() => import('./pages/Reports'))
const Analytics = lazy(() => import('./pages/Analytics'))

function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reports"   element={<Reports />} />
      </Routes>
    </Suspense>
  )
}

// ✅ Virtualised list — only visible rows in the DOM
import { useVirtualizer } from '@tanstack/react-virtual'

function UserList({ users }: { users: User[] }) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
  })

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => (
          <UserRow key={item.key} user={users[item.index]} style={{ transform: `translateY(${item.start}px)` }} />
        ))}
      </div>
    </div>
  )
}
```

```html
<!-- ✅ Deferred third-party scripts — do not block parsing -->
<script src="https://cdn.analytics.com/tracker.js" defer></script>
```

## Rules

1. Use `React.lazy()` + `Suspense` for route-level code splitting — every route is a separate chunk with a skeleton fallback.
2. Virtualise lists longer than 100 items with `@tanstack/react-virtual` or `react-window`.
3. Load all third-party scripts with `defer` or `async` unless render-blocking is explicitly required.
4. Serve images in WebP format, set explicit `width` and `height`, and add `loading="lazy"` on below-the-fold images.
5. Target Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms — measure with Lighthouse CI on every deploy.
