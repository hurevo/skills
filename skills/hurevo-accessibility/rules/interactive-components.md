---
title: Interactive Components
impact: high
tags: [accessibility, keyboard, aria, focus, modals]
---

## Why

- Keyboard-only users navigate by Tab, arrow keys, Enter, and Space — a custom dropdown built with `<div>` intercepts none of these without explicit ARIA and event handlers
- Removing the focus ring breaks keyboard navigation entirely for users who cannot use a mouse
- A modal that does not trap focus allows Tab to reach page content behind the overlay, confusing both sighted keyboard users and screen reader users

## Pattern

**Bad** — click-only, outline removed, no ARIA, focus not trapped:

```tsx
// ❌ div is not keyboard accessible — no Tab stop, no Enter/Space handling
<div className="btn" onClick={handleSubmit}>Submit</div>

// ❌ Removes focus ring globally
* { outline: none; }

// ❌ Custom dropdown with no keyboard support or ARIA
<div className="dropdown" onClick={() => setOpen(!open)}>
  {options.map(o => <div key={o} onClick={() => select(o)}>{o}</div>)}
</div>

// ❌ Modal — focus not trapped, does not return focus on close
function Modal({ onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
```

**Good** — native elements, visible focus, ARIA roles, focus trap:

```tsx
// ✅ Native button — keyboard accessible by default
<button type="button" onClick={handleSubmit}>Submit</button>

// ✅ Replace outline: none with visible custom focus style
button:focus-visible {
  outline: 2px solid #005FCC;
  outline-offset: 2px;
}

// ✅ Custom dropdown with full ARIA and keyboard support
function Dropdown({ options, onSelect }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  return (
    <div>
      <button
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        Select option
      </button>
      {open && (
        <ul role="listbox" aria-label="Options">
          {options.map((o, i) => (
            <li
              key={o}
              role="option"
              aria-selected={i === activeIndex}
              tabIndex={-1}
              onClick={() => { onSelect(o); setOpen(false) }}
              onKeyDown={e => e.key === 'Enter' && onSelect(o)}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ✅ Modal with focus trap (using focus-trap-react)
import FocusTrap from 'focus-trap-react'

function Modal({ onClose, triggerRef }: ModalProps) {
  useEffect(() => {
    return () => triggerRef.current?.focus()  // return focus on unmount
  }, [])

  return (
    <FocusTrap>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <h2 id="modal-title">Confirm Action</h2>
        <p>Are you sure you want to proceed?</p>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleConfirm}>Confirm</button>
      </div>
    </FocusTrap>
  )
}
```

## Rules

1. Use native HTML elements (`<button>`, `<a>`, `<select>`) for all interactive controls — they get keyboard support and ARIA semantics for free.
2. Never remove `outline` without providing a visible `:focus-visible` replacement of at least 2px solid contrast.
3. Implement correct ARIA roles, `aria-expanded`, `aria-selected`, and `aria-controls` on custom components per the ARIA Authoring Practices Guide.
4. Trap focus inside modal dialogs while open; return focus to the trigger element on close.
5. Tooltips and popovers must be triggerable by keyboard focus, not mouse hover only.
