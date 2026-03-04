---
name: hurevo-accessibility
description: WCAG 2.1 AA compliance, semantic HTML, keyboard navigation, and ARIA standards for Hurevo client-facing UIs.
---

# Hurevo Accessibility

Apply this skill when building or reviewing any user-facing UI component, form, modal, or page layout.

## When to Apply

- Building a new UI component or page
- Reviewing a PR that touches frontend HTML or React components
- Running an accessibility audit before a client demo or launch
- Evaluating contrast ratios or colour usage in a design

## Accessibility Rules

- **@rules/semantic-html.md** — use native elements (`<button>`, `<nav>`, `<main>`), one `<h1>` per page, every input has a `<label>`, every image has meaningful `alt`
- **@rules/interactive-components.md** — keyboard-operable with Tab/Enter/Space, visible focus ring, correct ARIA roles and properties per APG, modal focus trapping
- **@rules/colour-contrast.md** — 4.5:1 minimum for body text, 3:1 for large text and UI components, never colour-only for validation states
- **@rules/a11y-workflow.md** — define semantic structure first, keyboard test before mouse test, run Axe/Lighthouse, test with VoiceOver or NVDA on critical flows

Use native HTML elements before reaching for ARIA. A `<button>` has keyboard handling, focus management, and role semantics built in. A `<div onClick>` has none of them.

Never rely solely on colour to communicate state (error, success, warning, disabled). Always pair colour with an icon, label, or text indicator.

## Security Non-Negotiables

- Never render user-supplied content as raw HTML (`dangerouslySetInnerHTML`) without sanitisation — this is both an XSS vulnerability and an accessibility risk (injected content may break screen reader flow).
- Error messages displayed to users must not include stack traces, database errors, or internal paths — beyond being a security leak, they are meaningless to assistive technology users.
- Authentication and password reset forms must be compatible with password managers — do not block autocomplete or paste on credential fields.

## When Building or Reviewing a UI Component

1. **Start with semantic HTML.** Choose the correct native element for the interaction before considering ARIA. If a native element exists, use it.
2. **Add labels to every interactive element.** Every `<input>`, `<select>`, and `<textarea>` needs a visible `<label>` with `for`/`id` linkage, or `aria-label` if a visual label is not appropriate.
3. **Verify keyboard operability.** Tab through the component. Every interactive element must be reachable and operable with keyboard alone. Modals must trap focus inside while open and restore focus on close.
4. **Check colour contrast.** Use a contrast checker (Figma plugin, browser DevTools, or axe) to confirm 4.5:1 for body text and 3:1 for UI components.
5. **Validate with Axe or Lighthouse.** Run `axe` in the browser or Lighthouse accessibility audit. Zero violations is the target; any blocking violation must be fixed before merge.
6. **Test with a screen reader on critical flows.** For login, checkout, form submission, and error states: test with VoiceOver (macOS/iOS) or NVDA (Windows). If a user cannot complete the flow by hearing only, it is broken.

## Common Mistakes to Avoid

- **Using `<div>` or `<span>` as buttons.** They have no keyboard handling, no implicit role, and require ARIA and `tabindex` to compensate — native `<button>` is always the better choice.
- **Missing alt text on informative images.** An image without `alt` is invisible to screen readers. An image with `alt=""` is explicitly decorative — only use this for decorative images.
- **Icon-only buttons without accessible names.** A button containing only an icon renders as "button" to a screen reader with no context. Add `aria-label` or visually hidden text.
- **Colour-only error states.** A red border on an input field fails users with colour blindness and fails WCAG 1.4.1. Add an error message text and an icon.
- **Skipping keyboard testing.** Automated tools catch ~30% of accessibility issues. Manual keyboard and screen reader testing is required for interactive flows.
- **Auto-playing audio or video.** Any media that auto-plays with audio is disorienting and violates WCAG 1.4.2. Require explicit user interaction to start.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
