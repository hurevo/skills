---
name: hurevo-branding
description: Hurevo brand voice, visual identity rules, and communication standards for client-facing deliverables.
---

# Hurevo Branding

Apply this skill when producing any client-facing deliverable: proposals, project reports, UI copy, presentations, email communications, or marketing content.

## When to Apply

- Writing or reviewing a client proposal, project update, or delivery report
- Writing UI copy, onboarding messages, error text, or help content for a client product
- Creating presentation slides, pitch decks, or case study content
- Reviewing any external communication for brand consistency

## Brand Rules

### Identity and Positioning

Hurevo is a Jakarta-based technology and IT services consultancy. The brand promise is three words: **Fast. Stable. Secure.** Every deliverable must credibly reflect at least one of these pillars. If a document or message cannot be connected to speed of delivery, stability of outcomes, or security of systems, reconsider whether it belongs in client-facing materials.

Hurevo's four service lines are: Custom Software Development, Automation & Integrations, AI Solutions, and Legacy System Modernization. When describing Hurevo to a client, lead with the service line relevant to them — do not describe all four lines unless positioning for a multi-service engagement.

Clients are Indonesian SMB to mid-market businesses. They value practical outcomes, not technical jargon. Translate technology decisions into business impact.

### Tone of Voice

Write in direct, confident, professional Indonesian or English depending on the client's language preference. The default is Bahasa Indonesia for local clients; English for international or mixed-language teams.

- **Direct:** State the recommendation, then justify it. Do not hedge first and conclude last.
- **Confident:** Avoid tentative language: "it might be possible to", "we could potentially", "perhaps we should consider". State what will be done.
- **Specific:** Name the technology, the timeline, the metric. Vague claims ("modern architecture", "best practices") carry no weight with technical clients.
- **Human:** Not corporate. Write like a senior engineer speaking to a peer, not like a vendor writing to a procurement committee.

Do not use buzzwords without definition: "AI-powered", "cloud-native", "digital transformation" mean nothing without context. If you write them, follow immediately with a specific explanation of what it means for this client's system.

### Visual Identity

- **Typography:** All UI text uses `Atkinson Hyperlegible Next Variable` loaded via `@fontsource-variable/atkinson-hyperlegible-next`, applied through `--font-sans` as Tailwind's `font-sans`. No decorative or script fonts in professional documents or UI.
- **Colour system:** OKLCH-based, defined as CSS custom properties following shadcn/ui semantic token naming. Always reference semantic tokens (`bg-primary`, `text-foreground`, `border-border`) in component code — never raw OKLCH values.
  - Primary (brand green): `--primary: oklch(0.60 0.13 163)` light / `oklch(0.70 0.15 162)` dark
  - Background: `--background: oklch(1 0 0)` light / `oklch(0.13 0.028 261.692)` dark
  - Foreground: `--foreground: oklch(0.13 0.028 261.692)` light / `oklch(0.985 0.002 247.839)` dark
  - Accent: same as primary (`oklch(0.60 0.13 163)` light / `oklch(0.70 0.15 162)` dark)
  - Destructive/error: `--destructive: oklch(0.577 0.245 27.325)` light / `oklch(0.704 0.191 22.216)` dark
  - Muted foreground: `--muted-foreground: oklch(0.551 0.027 264.364)` light
  - Chart scale (5 greens, light to dark): `oklch(0.85 0.13 165)` → `oklch(0.51 0.10 166)`
- **Dark mode:** Full dark mode support via `.dark` class — all tokens have dark-mode counterparts. Never hard-code light-only values.
- **Border radius:** Base `--radius: 0.45rem`. Scale: `sm` 0.05rem, `md` 0.25rem, `lg` 0.45rem, `xl` 0.85rem, `2xl` 1.25rem.
- **Logo usage:** Use the Hurevo logo as provided — do not resize disproportionately, do not recolour, do not place on a busy background without a white safe zone.
- **Document templates:** Use the official Hurevo proposal, report, and presentation templates. Do not create ad-hoc documents without checking whether a template exists.

## Security Non-Negotiables

- Never include client credentials, API keys, database connection strings, or system architecture details that could aid an attacker in any client-facing document.
- Anonymise or aggregate client data in case studies and references unless explicit written permission to name the client has been obtained.
- Proposals and contracts containing commercial terms must be marked confidential and distributed only to named recipients — not shared via public links.
- Any AI tool used to draft client proposals or reports must not be given access to identifiable client data, project source code, or proprietary business information.

## When Producing a Client Deliverable

1. **Identify the audience.** Is this for a technical lead, a business owner, or a procurement committee? Adjust language depth accordingly. Business owners need outcomes; technical leads need detail.
2. **Lead with the client's problem.** Every proposal and report opens with the client's situation and goal — not Hurevo's capabilities. The client must see themselves in the first paragraph.
3. **State the recommendation clearly.** One to three sentences. What Hurevo recommends, and why it addresses the client's specific situation. Put this near the top, not buried in section 4.
4. **Support with specifics.** Technology choices, timelines, team composition, and metrics. Vague proposals lose to specific ones. Name the stack, the approach, and the deliverables.
5. **Address risk.** Every engagement has risks. Name them and explain how Hurevo mitigates them. A proposal that ignores risk reads as naive; one that names and addresses risks builds trust.
6. **Use the correct template.** Check the shared template library for the document type. Consistent formatting across deliverables reinforces brand professionalism.
7. **Review before sending.** Check: correct client name and project name throughout, no placeholder text left unfilled, no internal Hurevo comments visible, tone consistent, Fast/Stable/Secure credibly represented.

## Common Mistakes to Avoid

- **Describing Hurevo instead of describing value for the client.** A proposal that leads with "Hurevo was founded in Jakarta and has X engineers" has the wrong subject. The client's problem is the subject.
- **Technical jargon without translation.** "We will implement a microservices architecture with containerised deployments and a service mesh" means nothing to a retail SMB owner. Follow with: "This means your system can scale independently during peak sales periods without downtime."
- **Inconsistent naming.** Using different names for the client's product, project, or company within the same document signals carelessness. Standardise before sending.
- **Generic case studies.** "We have built many similar systems" is not convincing. Name a comparable engagement (with permission), describe the specific challenge, and quantify the outcome.
- **Missing confidentiality markings on sensitive documents.** Commercial proposals, pricing, and architecture documents must be marked confidential and not shared as public links.
- **Using AI output directly without review.** AI-generated content for client deliverables must be reviewed and edited by the responsible engineer or project manager before sending. Raw AI output is not client-ready.

You are a tool. The engineer owns every line of code you produce. Present output as "ready for your review", not "done". Flag uncertainty rather than guessing silently.
