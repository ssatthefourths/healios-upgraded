# Phase 8b — Admin-editable email system (post-launch)

**Status:** spec — not scheduled yet. Post-launch sprint.
**Owners:** Servaas (eng), Monique (content + UX review).
**Parent ticket:** `healios_tasks_v2.csv` #3.
**Predecessor:** Phase 8a (commit `36f7c0c`) — templates moved in-repo, order-confirmation wired live, admin preview page at `/admin/emails`.

## Why this exists

Phase 8a gave us the structure: Monique's designs land on real emails and are previewable in the admin. But the copy is still in `.tsx` files — any change means a code commit, a build, and a deploy. Monique can't iterate on her own emails.

Phase 8b makes the email system **admin-editable, data-driven, and dynamic** so:

- Monique edits template copy, colours, images, and layout blocks from `/admin/emails` without opening a code editor.
- Every template has defined **dynamic variables** (customer name, order number, product list, etc.) that the admin UI surfaces with inline help and examples.
- Campaigns can be sent to filtered user segments from the admin.
- Every send is tracked — opens, clicks, bounces, unsubscribes — visible in the admin with Resend data.
- The UX is **ADHD/OCD-friendly**: every input has an "ℹ" icon → tooltip with purpose + example. No ambiguity about what a field does.

## Core capabilities

1. **Visual block editor** (Phase 8b.1)
   - WordPress-style right sidebar: select a block, edit its properties (text, colour, image URL, link).
   - Templates broken into named blocks: `Header`, `Hero`, `EditorialCard`, `ProductGrid`, `Footer` — matches Monique's existing component library.
   - Drag-reorder blocks within a template.
   - Live preview on the left, re-renders on every change.

2. **Dynamic-variable schema** (Phase 8b.2)
   - Each template declares its variables (e.g. order-confirmation: `customerName`, `orderNumber`, `items[]`, `total`).
   - Editor inserts variables via `{{ variableName }}` tokens or a "Insert variable" button.
   - Preview shows either sample data (for design iteration) or live data (pick a real order/user to preview against).

3. **Template storage in D1** (Phase 8b.3)
   - Templates become database rows, not `.tsx` files. Schema:
     - `email_templates`: id, group, name, version, blocks (JSON), variables (JSON), updated_at, updated_by.
     - `email_template_versions`: full history for rollback.
   - Worker's `renderX(props)` becomes `renderTemplate(templateId, props)` — reads the blocks JSON, composes React components, renders to HTML.
   - Migration path: one-time seed from current `.tsx` templates, then the code files become reference-only.

4. **Send triggers** (Phase 8b.4)
   - Admin dashboard shows which templates are wired to which triggers (order placed, password reset, cart abandoned, etc.).
   - New UI: assign a template to a trigger via dropdown.
   - "Send test" button for every template → enters recipient email → Resend send with sample data.
   - Support for **scheduled campaigns**: compose → pick segment → pick send time → queue.

5. **Recipient / segment management** (Phase 8b.5)
   - Dropdown-driven recipient selection:
     - "All subscribers" / "Active customers" / "Churned 90d+" / "Bought bundle X" / etc.
     - Built on top of the existing RFM and cohort segments the admin already has.
   - Per-campaign recipient preview: shows count + first 10 emails before sending.

6. **Resend tracking dashboard** (Phase 8b.6)
   - Webhook from Resend → new D1 table `email_events` (resend_id, event_type, recipient, timestamp, metadata).
   - Per-template and per-campaign stats: delivered, opened, clicked, bounced, unsubscribed.
   - Surface on `/admin/emails/<id>/stats` and on the campaign detail page.

7. **Inline help everywhere** (Phase 8b.7) — ADHD/OCD-friendly UX
   - Every configurable field has an "ℹ" icon adjacent to it.
   - Hover/click → tooltip with: what this field does, an example, what it's not for.
   - Three consistent placements: field label, section header, action button.
   - Content written collaboratively with Monique during the build.

## Tech approach

- Frontend: extend `src/pages/admin/EmailsAdmin.tsx` with a new route pattern `/admin/emails/:id/edit`. Block editor built on DND-kit (already in deps) + shadcn form controls.
- Backend: new worker routes under `/admin/emails/*` (list templates, get template, update blocks, clone, version history, send-test).
- Renderer: refactor `scripts/build-emails.mjs` into a runtime renderer that takes a template JSON blob and hydrates Monique's existing React components (`Header`, `Hero`, `EditorialCard`, etc.) with block data — so her component library stays the substrate.
- Send tracking: `POST /resend-webhook` endpoint with signature verification, inserts into `email_events`.

## Rough phasing (if we do it all)

| Sub-phase | Deliverable | Est. |
|---|---|---|
| 8b.0 | Planning session with Monique — confirm UX + field list + variable mapping | 2 days |
| 8b.1 | Block editor MVP — edit existing templates inline (text + colour + image URL) | 5 days |
| 8b.2 | Dynamic-variable schema + `{{ token }}` syntax + live-data preview | 3 days |
| 8b.3 | D1 storage + migration from code-based templates | 3 days |
| 8b.4 | Send triggers + "send test" + campaign queue | 4 days |
| 8b.5 | Segment picker | 3 days |
| 8b.6 | Resend webhook + tracking dashboard | 3 days |
| 8b.7 | Inline help content pass (every field) | 2 days |

Total: ~25 working days ≈ 5 weeks of focused eng + design time. Not realistic inside a launch sprint — hence post-launch.

## Decisions to resolve at 8b.0 kickoff

1. **Template editor visual model** — block-based (today's recommendation) or freeform (Gutenberg-style multi-column grids)?
2. **Variable syntax** — `{{ name }}` (Handlebars-style, familiar), `${name}` (JS-style), or a WYSIWYG token pill (no syntax visible to Monique)?
3. **Version policy** — keep every version forever, or prune to last 10?
4. **"Send test" throttle** — how many can Monique send per hour before we rate-limit?
5. **Unsubscribe / preferences URL generator** — per-recipient tokens signed with `IP_HASH_SECRET` or a new dedicated secret?

## Out of scope (future phases)

- A/B testing on email subject lines / content.
- Localisation (multilingual templates). Current templates are English-only.
- SMS / push notification channels. Email only for now.
- Third-party email-builder embed (Beefree, Stripo). We're building our own because Monique wants the editor IN the admin dashboard, not an external tool.

## Reference material

- Phase 8a commit: `36f7c0c`
- Template source: `src/lib/emails/`
- Worker renderer: `worker-api/src/emails/generated.ts` (auto-generated)
- Current admin preview: `src/pages/admin/EmailsAdmin.tsx`
- Monique's original brief: `healios_tasks_v2.csv` ticket #3
