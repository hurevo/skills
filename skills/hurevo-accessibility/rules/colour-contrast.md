---
title: Colour and Contrast
impact: medium
tags: [accessibility, colour, contrast, wcag, design]
---

## Why

- Low contrast text fails WCAG 2.1 AA and is unreadable for users with low vision or in bright sunlight — common on mobile devices
- Using colour as the only differentiator for error/success states means colour-blind users cannot tell the difference
- Content that overflows or overlaps at 200% zoom fails WCAG 1.4.4 and breaks users who rely on browser zoom

## Pattern

**Bad** — insufficient contrast, colour-only validation, zoom breakage:

```css
/* ❌ Light grey on white — fails 4.5:1 requirement */
.helper-text { color: #aaa; background: #fff; }  /* ratio ~2.3:1 */

/* ❌ Red/green only — indistinguishable for red-green colour blindness */
.field-valid   { border-color: green; }
.field-invalid { border-color: red; }

/* ❌ Fixed pixel layout — overflows at 200% zoom */
.sidebar { width: 250px; flex-shrink: 0; }
.content { width: 750px; }
```

**Good** — passing contrast ratios, colour + icon + text, fluid layout:

```css
/* ✅ Dark grey on white — 12.6:1 ratio, passes AAA */
.helper-text { color: #555; background: #fff; }

/* ✅ Large text (18px+): 3:1 minimum — use #767676 on white at minimum for body text */
.body-text { color: #333; }  /* 12.6:1 — well above AA */
```

```tsx
/* ✅ Colour + icon + text for validation states */
function FieldError({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-1 text-red-700" role="alert">
      {/* Icon provides visual reinforcement beyond colour */}
      <ExclamationCircleIcon className="h-4 w-4" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

function FieldSuccess() {
  return (
    <div className="flex items-center gap-1 text-green-700">
      <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />
      <span>Looks good</span>
    </div>
  )
}
```

```css
/* ✅ Fluid layout — reflows at 200% zoom */
.layout {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}
.sidebar { min-width: 200px; flex: 1; }
.content { min-width: 300px; flex: 3; }
```

## Rules

1. Body text must meet 4.5:1 contrast ratio against its background; large text (≥18px regular or ≥14px bold) requires 3:1 minimum.
2. UI component borders, icons, and input outlines must meet 3:1 contrast against adjacent colours.
3. Never use colour as the sole differentiator for states (valid/invalid, active/inactive) — always add an icon, pattern, or text label.
4. Test all UI at 200% browser zoom — content must reflow and remain usable without horizontal scrolling on a 1280px viewport.
5. Use a contrast checker (Figma plugin, browser DevTools, or axe) during design and review — do not rely on visual estimation.
