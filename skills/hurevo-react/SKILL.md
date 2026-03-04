---
name: hurevo-react
description: Load for React + Vite projects. Covers component architecture, data fetching, Tailwind styling, and security practices.
---

# Hurevo React

React + Vite component and architecture standards for Hurevo frontend projects. Contains 4 rules covering architecture, component standards, styling, and security.

## When to Apply

- Any project using React + Vite as the frontend
- Adding new components, hooks, or pages to an existing React codebase
- Reviewing a PR for React-specific patterns

## Rules Summary

### Architecture (HIGH)

#### react-architecture - @rules/react-architecture.md

TanStack Query for server state, React Hook Form for forms, React Router v6 for routing. No `useEffect` + `fetch` patterns. Components over 150 lines must be split.

```jsx
// Bad — useEffect + fetch for server state
useEffect(() => {
  fetch('/api/invoices').then(r => r.json()).then(setInvoices)
}, [])

// Good — TanStack Query
const { data: invoices, isLoading } = useQuery({
  queryKey: ['invoices'],
  queryFn: () => api.get('/invoices').then(r => r.data),
})
```

### Components (HIGH)

#### react-components - @rules/react-components.md

Functional components only. Props typed with TypeScript interfaces. Default export for pages, named exports for reusable UI. Error boundaries on every route.

```jsx
// Bad — untyped props, class component
class InvoiceCard extends React.Component {
  render() { return <div>{this.props.invoice.number}</div> }
}

// Good — typed, functional
interface Props { invoice: Invoice }
export function InvoiceCard({ invoice }: Props) {
  return <div>{invoice.number}</div>
}
```

### Styling (MEDIUM)

#### react-styling - @rules/react-styling.md

Tailwind CSS only. No inline `style` except for dynamic values. Extract repeated class combos into components — not `@apply`. Mobile-first with `sm:`, `md:`, `lg:` breakpoints.

```jsx
// Bad — inline style, ad-hoc CSS class
<div style={{ padding: '1rem', borderRadius: '8px', background: '#fff' }}>

// Good — Tailwind, extracted to a component
<Card className="p-4">
```

### Security (HIGH)

#### react-security - @rules/react-security.md

Never `dangerouslySetInnerHTML` unless source is server-controlled and sanitised. Validate all user-supplied URLs. No secrets with `VITE_` prefix. Store tokens in `httpOnly` cookies for sensitive apps.

```jsx
// Bad — raw user HTML, token in localStorage
<div dangerouslySetInnerHTML={{ __html: userInput }} />
localStorage.setItem('token', apiToken)

// Good — sanitised, httpOnly cookie (set by backend)
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userInput) }} />
// token stored in httpOnly cookie via Set-Cookie header
```
