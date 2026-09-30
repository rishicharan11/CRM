# Phase 10 — final Customer UI QA fixes

**Branch:** `customer-module-mvp1`
**Source of truth:** `FINAL-UI-QA.md` and the Packages Booking, Vendor CRM and Finance design language.
**Boundary:** visual and responsive changes only. Customer routes, data, forms, APIs, search, filters, drag/drop, submissions and handoffs were preserved.

## P1 fixes

| Audit ID | Fix | Reuse and result |
| --- | --- | --- |
| P1-01 | High-priority chips on Task and Query cards now share the pale error badge treatment. | Reused `--bad`, `--bad-bg`, `--bad-line`; removed a redundant Query override. |
| P1-02 | Customer, Query and Traveller onboarding dialog headings now use dark sentence-case modal typography. | Reused `--type-heading-modal-*` and `--ink`, as already used by Vendor and Booking. |
| P1-03 | Customer, Query and Task mobile list tables share a visible horizontal-scroll cue. The Customer table still exposes every column and row action through its existing scroller. | Reused the table scroller and semantic surface, border, spacing, accent and secondary text tokens. No table or workflow was replaced. |

## P2 fixes

| Audit ID | Fix | Reuse and result |
| --- | --- | --- |
| P2-01 | Task modal heading and radius now match peer dialogs. | `--type-heading-modal-*`, `--radius-modal`. |
| P2-02 | Task form field labels now use the established field-label transform. Account settings retain the deliberate sentence-case settings hierarchy. | `--type-label-field-transform`. |
| P2-03 | Customer, Query, Task, Pipeline and Finance list-table headers share one 40px height. | New shared `--size-table-head` token captures the existing list-table size; row layouts remain unchanged. |
| P2-04 | Mobile Document vault IDs and category chips remain intact, with location on its own metadata line. | Existing vault row/grid and spacing tokens. |
| P2-05 | Unselected mobile Inbox shows more conversations above a compact empty-thread prompt; selected conversations keep their original panel behavior. | Existing list/thread/empty components and responsive styles. |
| P2-06 | Narrow breadcrumbs reveal the current detail by scrolling the existing breadcrumb trail; earlier crumbs remain reachable and clickable. | Existing breadcrumb markup and `--space-1`; no destination changed. |

## P3 fixes

None. The audit identified no distinct low-risk P3 defect.

## Existing issues intentionally untouched

- **EXISTING-01:** Query-board card clicks can stop opening details after drag/drop. This handler is also present on `customer-module-beta`; no drag/click logic changed here.
- **EXISTING-02:** Customer import displays a success toast without parsing or persisting rows. This submit behavior is also present on `customer-module-beta`; no import logic changed here.
- **EXISTING-03:** Finance/Bookings and other sidebar destinations remain the documented Customer-module handoffs/placeholders. No new local pages or integrations were added.

## Files in this phase

| File | Purpose |
| --- | --- |
| `design-system-03.css` | Shared badge, modal title, table cue, table density and breadcrumb styling. |
| `design-system/src/tokens/tokens.css` | Shared table-header size token. |
| `styles.css` | Responsive vault metadata and unselected Inbox balance. |
| `index.html` | Shared table scroll cue on Customer, Query and Task list tables. |
| `app.js` | Position the existing breadcrumb scroller to show the active detail. |
| `FINAL-UI-QA.md` | Original findings and per-issue fix status/validation. |
| `FINAL-QA-FIXES.md` | This phase summary. |

The first five files are application presentation changes. The last two are documentation. The three previously untracked scope/mapping/checklist documents were not changed for this phase.

## Regression and build results

- **Production build:** `vite build` passed.
- **Routes and console:** 17 route/entry forms at desktop 1440×900, tablet 820×1000 and mobile 390×844: 51 successful loads, no document-level overflow and no browser console/page errors.
- **Existing browser suites:** Workspace passed; Communication 45/45, Operations 59/59, Sales 22/22, CRM 40/40, Entry Dialogs 25/25. The local parallel run produced navigation timeouts in Sales/CRM/Entry; all three passed sequential reruns. No product error was reproduced.
- **Targeted visual checks:** Task and Query High badges have matching computed colors; Customer/Query/Traveller dialog titles and Task dialog title/radius align; list-table headers compute to 40px; mobile Customer table and row actions scroll; empty Customer results hide the cue; mobile vault ID/chip remain unbroken; Inbox selection still opens a thread; the mobile detail breadcrumb is visible and its earlier CRM link still navigates.
- **Responsive review:** desktop, tablet and mobile screenshots were compared across the six module areas. The Customer directory intentionally remains a horizontally scrolling table rather than the reference's stacked mobile cards to preserve its existing table UX.

**Remaining visual deviation:** mobile Customer, Query and Task lists remain tables with horizontal scrolling; the cue makes off-screen content discoverable. No unresolved P1/P2 visual issue from `FINAL-UI-QA.md` remains after the targeted checks.
