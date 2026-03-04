---
title: React Component Standards
impact: high
tags: [react, components, typescript, props]
---

## Why

- Inconsistent component patterns create cognitive overhead when switching between files
- Prop drilling beyond two levels breaks encapsulation and makes refactoring painful
- Missing prop validation causes silent runtime errors that are hard to trace

## Pattern

**Bad** — untyped, prop-drilling, and mixed responsibilities:

```tsx
function App() {
  const [theme, setTheme] = useState('light')
  return <Page theme={theme} setTheme={setTheme} />
}

function Page({ theme, setTheme }) {
  return <Header theme={theme} setTheme={setTheme} />
}

function Header({ theme, setTheme }) {
  return <button onClick={() => setTheme('dark')}>{theme}</button>
}
```

**Good** — typed props, context for cross-cutting state, single responsibility:

```tsx
// context/ThemeContext.tsx
interface ThemeContextValue {
  theme: 'light' | 'dark'
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light')
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

// components/ThemeToggle.tsx
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <button onClick={toggleTheme} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      {theme === 'light' ? '☀️' : '🌙'}
    </button>
  )
}
```

## Rules

1. Type all props with TypeScript interfaces; never use `any` for prop types.
2. Use React Context or Zustand for state shared across more than two component levels.
3. Limit a component to a single concern — if it has more than one reason to change, split it.
4. Prefer named exports over default exports for components to enable consistent imports.
5. Add `aria-label` and semantic roles to interactive elements; this is not optional.
