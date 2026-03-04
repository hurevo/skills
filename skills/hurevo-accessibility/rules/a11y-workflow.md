---
title: Accessibility Workflow
impact: medium
tags: [accessibility, workflow, testing, audit]
---

## Why

- Starting with visual design and retrofitting accessibility at the end costs more than building it in from the start — ARIA bolted onto inaccessible markup rarely works correctly
- Keyboard testing catches 70–80% of accessibility failures before running an automated tool, because most failures are about interactivity and focus management
- Automated tools (Axe, Lighthouse) catch only ~30% of WCAG failures — manual keyboard and screen reader testing is required before marking a feature ready

## Pattern

**Bad** — accessibility as an afterthought, tool-only testing:

```
# Development sequence (wrong)
1. Build component visually
2. Write tests (unit only)
3. Manually test with mouse
4. Ship to QA
5. QA runs Lighthouse — gets 6 accessibility violations
6. Engineer spends 2 days retrofitting ARIA onto wrong markup
```

**Good** — accessibility-first sequence:

```
# Development sequence (correct)
1. Define semantic HTML structure first
   <section aria-labelledby="...">
     <h2 id="...">...</h2>
     <form>
       <label for="email">Email address</label>
       <input type="email" id="email" name="email" required />
       <button type="submit">Subscribe</button>
     </form>
   </section>

2. Implement keyboard navigation
   - Tab through the component with mouse disconnected
   - Every action reachable? Focus order logical?
   - Enter/Space work on all interactive elements?

3. Add ARIA only where native HTML is insufficient
   - Custom components need role, aria-expanded, aria-controls, etc.
   - Do not add ARIA to elements that already have correct semantics

4. Run automated scan
   npx axe --browser chrome http://localhost:3000/feature
   # Fix all violations before proceeding

5. Screen reader test (critical flows only)
   - VoiceOver (macOS): Cmd+F5
   - NVDA (Windows): free download from nvaccess.org
   - Navigate through the happy path — does it make sense when heard?

6. Mark ready for review — include accessibility notes in PR description
```

## Rules

1. Define the semantic HTML structure before writing any CSS or JavaScript — structure first, style second.
2. Test keyboard navigation (Tab, Enter, Space, Escape, arrow keys) before testing with a mouse — fix issues before adding ARIA.
3. Add ARIA roles, properties, and states only where native HTML semantics are insufficient — ARIA on correct elements is noise.
4. Run Axe DevTools or `axe-core` in CI and fix all violations before marking a PR ready for review.
5. Test critical user flows with VoiceOver (macOS) or NVDA (Windows) before launch — automated tools cannot replace screen reader testing.
