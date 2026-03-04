---
title: React Application Architecture
impact: high
tags: [react, architecture, components, state]
---

## Why

- Flat component trees become unmaintainable when features grow; layered architecture keeps concerns separate
- Mixing data fetching, business logic, and rendering in one component makes testing and reuse impossible
- Unstructured file layout forces engineers to hunt for files rather than reason about structure

## Pattern

**Bad** — logic, data, and UI tangled together:

```tsx
// UserDashboard.tsx — does everything
export default function UserDashboard() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { setUsers(data); setLoading(false) })
  }, [])

  const deactivate = async (id) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' })
    setUsers(users.filter(u => u.id !== id))
  }

  if (loading) return <Spinner />
  return (
    <div>
      {users.map(u => (
        <div key={u.id}>
          <span>{u.name}</span>
          <button onClick={() => deactivate(u.id)}>Deactivate</button>
        </div>
      ))}
    </div>
  )
}
```

**Good** — separated into hook, service, and presentational layers:

```tsx
// services/userService.ts
export const fetchUsers = () => fetch('/api/users').then(r => r.json())
export const deactivateUser = (id: string) =>
  fetch(`/api/users/${id}`, { method: 'DELETE' })

// hooks/useUsers.ts
export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers().then(data => { setUsers(data); setLoading(false) })
  }, [])

  const deactivate = async (id: string) => {
    await deactivateUser(id)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  return { users, loading, deactivate }
}

// features/users/UserDashboard.tsx
export default function UserDashboard() {
  const { users, loading, deactivate } = useUsers()
  if (loading) return <Spinner />
  return <UserList users={users} onDeactivate={deactivate} />
}

// features/users/UserList.tsx — pure presentational
export function UserList({ users, onDeactivate }: UserListProps) {
  return (
    <div>
      {users.map(u => (
        <UserRow key={u.id} user={u} onDeactivate={onDeactivate} />
      ))}
    </div>
  )
}
```

## Rules

1. Organise by feature (`features/<name>/`), not by type (`components/`, `hooks/`).
2. Keep data fetching in custom hooks or React Query — never directly inside components.
3. Separate presentational components (props in, JSX out) from container components that own state.
4. Extract business logic to plain service functions; keep hooks thin orchestrators.
5. Co-locate tests, styles, and types with the component they belong to.
