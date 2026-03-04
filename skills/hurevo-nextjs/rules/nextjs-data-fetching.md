---
title: Next.js Data Fetching
impact: high
tags: [nextjs, data-fetching, caching, server-components]
---

## Why

- Fetching data in `useEffect` on every render wastes bandwidth and introduces loading flicker that Server Components eliminate
- Not configuring cache revalidation leads to stale data or unnecessary full re-renders
- Waterfall fetches (sequential awaits) compound latency — parallel fetches are almost always possible

## Pattern

**Bad** — client-side fetch with useEffect, sequential waterfalls:

```tsx
'use client'

export default function ProductPage({ params }) {
  const [product, setProduct] = useState(null)
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    // Sequential — reviews wait for product
    fetch(`/api/products/${params.id}`)
      .then(r => r.json())
      .then(p => {
        setProduct(p)
        return fetch(`/api/products/${params.id}/reviews`)
      })
      .then(r => r.json())
      .then(setReviews)
  }, [params.id])

  if (!product) return <Spinner />
  return <div>{product.name}</div>
}
```

**Good** — Server Component with parallel fetch:

```tsx
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation'

async function getProduct(id: string) {
  const res = await fetch(`${process.env.API_URL}/products/${id}`, {
    next: { revalidate: 60 }, // ISR — revalidate every 60s
  })
  if (res.status === 404) notFound()
  return res.json()
}

async function getReviews(id: string) {
  const res = await fetch(`${process.env.API_URL}/products/${id}/reviews`, {
    next: { revalidate: 300 },
  })
  return res.json()
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  // Parallel — both fetches start simultaneously
  const [product, reviews] = await Promise.all([
    getProduct(params.id),
    getReviews(params.id),
  ])

  return <ProductDetail product={product} reviews={reviews} />
}
```

**Good** — Server Action for mutations:

```tsx
// app/products/[id]/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function submitReview(productId: string, formData: FormData) {
  const rating = Number(formData.get('rating'))
  const body = String(formData.get('body'))

  await db.review.create({ data: { productId, rating, body } })
  revalidatePath(`/products/${productId}`)
}
```

## Rules

1. Fetch data in Server Components using `async/await` — avoid `useEffect` for initial data loading.
2. Use `Promise.all` for independent parallel fetches; never chain sequential awaits unless data depends on prior results.
3. Set `next: { revalidate: N }` on fetch calls to control ISR — never leave all routes as static if data changes.
4. Use Server Actions for form submissions and mutations; call `revalidatePath` or `revalidateTag` after writes.
5. Use `generateStaticParams` for known dynamic routes to pre-render at build time and reduce cold-start latency.
