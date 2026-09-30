# Final Customer UI QA — audit and fix status

**Branch:** `customer-module-mvp1` (verified before the audit and before writing this file)
**Status:** Phase 9 findings are retained below as the pre-fix baseline. Phase 10 resolutions and verification are recorded in section 11.
**Functional source:** this Customer implementation and `CUSTOMER-MODULE-SCOPE.md`.
**Visual source:** the local checkout of the finalized Packages project at `../pakages-module` (Booking, Vendor CRM, Finance, integrated shell and design tokens), as mapped in `COMPONENT-MAPPING.md`. The reference is a React project; Customer is static HTML/CSS/JavaScript, so visual recipes and tokens are the appropriate comparison.

## 1. Overall findings and coverage

**Phase 9 baseline:** The migrated product was broadly cohesive. The shell, page background, Onest/Public Sans hierarchy, teal actions, pink selected navigation/tabs, white cards, pale table headers, semantic status tokens, shared search/filter popovers, icon stroke, borders, and focus treatment were consistent across the six areas. Three significant visual inconsistencies and several responsive/density refinements were recorded below. No migration-caused functional regression was reproduced. A high-impact **pre-existing** Query-board interaction issue is documented separately.

| Area | Audited screens, states and representative interactions |
| --- | --- |
| Workspace | Home Normal/Advance, dashboard cards/tables/notes, global search, sidebar and mobile drawer, notifications popover/page, five Account settings sections, navigation and handoffs. |
| Communication | Inbox list and thread, search and filter tabs, WhatsApp and Email states, message reply/template/send, new conversation and sent confirmation, Customer and Query email workspaces, composer and empty states. |
| Operations | Task/follow-up tabs, board and list, status movement, search/filter/sort/pagination, detail/create/edit/delete confirmation, customer/query contextual tasks and responsive views. |
| Sales / Queries | Six service routes and forms, board/list/status movement, search/filter, Query detail tabs, proposal creation/catalog/modes, trip itinerary builder and its content/costing/preview views. |
| CRM | Customer list/detail and its seven tabs, search/filter/sort/import, travellers, referral tree, notes, pipeline, finance history, document vault, request/secure upload/review and public upload entry. |
| Entry dialogs | New Vendor and New Booking, validation, disabled states, submissions, close/reopen, responsive sizing and existing handoffs. |

The 25 overlay IDs in `CUSTOMER-MODULE-SCOPE.md` were included in the visual inventory: global search, notifications, account menu, both task overlays, referral tree, New Customer, New Vendor, Query type/form, New Booking, file upload, Customer edit, profile edit, Query position, bank account, Customer deletion, Customer notes, traveller, document request/upload/review, import, new conversation, and sent confirmation. Inline filters, row menus, date/select controls and the mobile navigation backdrop were also compared. Interactive automation covered representative instances of each overlay family; it did **not** exhaust every destructive branch or external integration.

**Verification:** 17 direct route/entry forms at 1440×900, 820×1000 and 390×844 (51 loads) rendered without document-level horizontal overflow or browser console/page errors. The production `vite build` passed. Existing Workspace, Communication, Operations, Sales, CRM and Entry Dialog interaction checks passed in isolated browser sessions. The Sales check passes when Query detail is opened directly; the board click failure after a drag is recorded under existing limitations. Screenshots were inspected at all three widths, including Customer list, Document vault, Inbox, Query board/detail, Tasks and the trip builder. Refresh busy states, no-match/empty views and form validation were sampled. This static app has no shared skeleton loader or remote API error screen to exercise.

## 2. P0 — major visual or migration-caused functional regression

**None reproduced.** No route disappeared, production build failure, console exception, broken desktop/mobile shell, or document-level overflow was found in the tested states. This is bounded by the representative interaction coverage above; it is not a claim that every possible data combination was exercised.

## 3. P1 — significant design-system inconsistency

| ID | Finding and evidence | Recommended visual fix, preserving UX |
| --- | --- | --- |
| P1-01 | **The same “High” priority has two appearances.** Task Kanban cards inherit the solid red `.query-priority-high` rule in `design-system-03.css:941`; Query board cards override it with a pale red fill and red text at `design-system-03.css:2326`; customer/query contextual task cards use the pale variant around `design-system-03.css:4073`. This makes a shared status look like different severity across Operations, Sales and CRM. | Consolidate one semantic High/Urgent badge recipe, with a documented stronger variant only if the meaning differs. Keep labels, priorities and status logic unchanged. |
| P1-02 | **Creation dialog headings switch visual language.** New Customer, Query onboarding and Traveller onboarding display teal uppercase titles, while New Vendor, New Booking, Inbox create and most other dialogs display dark sentence-case titles at the reference modal size. The Phase 8 Vendor/Booking rules explicitly use `--type-heading-modal-*` in `design-system-03.css:4149`, but the older onboarding family retains a different heading treatment. | Apply the existing reference modal title tokens/appearance to the older onboarding headers. Keep each dialog's steps, fields, width and behavior. |
| P1-03 | **The Customer directory is hard to scan on mobile.** At 390px, the seven-column table shows only Customer, Category and part of Tier; the remaining columns and row actions require horizontal scrolling with no visible cue. The Packages reference uses a stacked mobile record presentation. This is a reference deviation, not a regression from these migrations. | Add a clear horizontal-scroll affordance or a responsive row presentation that retains every field and action. Preserve table semantics, sorting, pagination and row interactions. |

## 4. P2 — minor visual inconsistency or responsive presentation

| ID | Finding and evidence | Recommended visual fix, preserving UX |
| --- | --- | --- |
| P2-01 | **Task dialog scale differs from peer dialogs.** The Add/Edit Task header computes to roughly 14.5px with a 16px modal radius; New Vendor, New Booking, New Customer and Query dialogs use roughly 17px headings and 14px radius. The task override is at `design-system-03.css:4109`. | Use the shared modal heading/radius tokens; retain the task form layout and detail/actions. |
| P2-02 | **Form label treatment differs by module.** Customer, Vendor and Booking dialog labels compute to 11px bold uppercase; Task labels use the same approximate size/tracking but sentence case (`design-system-03.css:4116`), and Account labels are larger sentence case. Some hierarchy variance is useful, but identical field roles should use a defined variant rather than page-specific casing. | Specify field-label versus settings-label variants using current tokens and apply them consistently; do not alter label text or validation. |
| P2-03 | **Table header height drifts.** Task list and Customer Pipeline headers are about 44px, Query and Customer directory about 40px, and Customer finance history about 38px, despite matching pale surface, type and borders. Finance may intentionally be denser; the role is not documented. | Normalize equivalent list tables or document a compact history-table variant; preserve all columns and row density needed by each workflow. |
| P2-04 | **Document-vault metadata wraps awkwardly on mobile.** At 390px, long IDs and the `Sub-Agent` chip split across lines and interrupt the otherwise consistent customer row hierarchy. | Adjust the existing mobile row grid/min-width and chip wrapping; preserve the traveller/document counts and expand control. |
| P2-05 | **Mobile Inbox gives too much space to the empty thread.** The conversation list is capped at `46vh` and the empty thread panel has a 620px minimum (`styles.css:2619-2620`). Only about two and a half conversations are visible before the large empty panel on a 390×844 screen. The list itself remains scrollable, so this is presentation, not lost access. | Rebalance the two panels for the unselected mobile state while retaining list scroll, thread selection and composer behavior. |
| P2-06 | **Deep mobile breadcrumbs truncate early.** Customer and Query detail breadcrumbs lose much of the parent path in the narrow topbar; the simpler Packages reference path fits. | Improve truncation/priority of existing breadcrumb segments while preserving destinations and back behavior. |

## 5. P3 — cosmetic polish

**No separate P3 issue is needed yet.** The remaining small differences observed (for example service-specific illustrations and content-specific card spacing) serve different workflows. Polishing them before the issues above risks changing intentional hierarchy without a clear reference pattern. Legacy CSS still contains literal colors and dimensions, but token debt alone is not a visible defect; replace a value only when correcting a confirmed inconsistency.

## 6. Existing functional limitations — not migration regressions

| ID | Reproduction / baseline evidence | Impact and boundary |
| --- | --- | --- |
| EXISTING-01 | On the Query Kanban, drag a card to another status, then click a Query card. The card click may no longer open Query detail until a fresh document load; keyboard Enter still has an independent handler. `app.js:7943-7985` sets `suppressQueryCardClick` on `dragstart` and resets it only on `dragend`; the drop rerenders the board. The same handler is present in `customer-module-beta:app.js` (read with `git show`, without checking out or changing that branch). Fresh-load card clicks and direct Query routes work. | High-impact existing board interaction; investigate separately from visual QA. Do not silently alter drag/drop or Query navigation in a visual-only fix. |
| EXISTING-02 | Customer import accepts a selected file and shows a success toast, but the submit handler does not parse, preview or persist imported rows (`app.js:8658-8664`). The same handler exists on `customer-module-beta`. | Existing incomplete import behavior. Visual QA can check the dropzone, validation and toast, but cannot verify imported records because the implementation does not create them. |
| EXISTING-03 | The local `#finance`, `#bookings` and other sidebar destinations are handoffs/placeholders, not independent Customer screens (see the route inventory in `CUSTOMER-MODULE-SCOPE.md`). New Vendor also ends in the existing local feedback flow. | Do not report the absence of full Finance/Booking/Vendor pages or remote records as UI migration failures. Cross-module persistence requires separate product/integration scope. |

## 7. Cross-module consistency matrix

| Shared pattern | Workspace | Communication | Operations | Sales | CRM | Entry dialogs | Result |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Primary/secondary actions, icon buttons, focus/disabled | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Common teal action and control sizing; no material discrepancy found. |
| Search and filter popovers | Global search | Inbox search/tabs | Search/filter/sort | Search/filter | Search/filter/vault | Field lookup | Search fields and filter popovers visually align; behavior remains module-specific. |
| Tables/cards | Dashboard | Conversation rows | Task table/cards | Query table/cards | Customer, pipeline, finance | — | Card surfaces align; table header height is P2-03. |
| Tabs/selected states | Mode toggle | Inbox/mail tabs | Task/status tabs | Service/detail tabs | Customer/detail tabs | Form steps | Pink active treatment is coherent; content hierarchy remains distinct. |
| Priority/status badges | Dashboard statuses | Read/unread/channel | Task priority/status | Query priority/status | Task/pipeline/document status | Validation/success | High priority mismatch is P1-01; other semantic colors align. |
| Modal/form shell | Quick actions | Conversation create/sent | Task detail/form | Query forms/position/proposal | Customer/traveller/document forms | Vendor/Booking | Heading/case mismatch P1-02; task size P2-01; field labels P2-02. |
| Loading/empty/error | Inline/new workspace | Inbox empty/compose | Board/list empty/validation | Board/detail/builder empty | List/vault/upload/review | Validation/toast | Reference token palette generally holds. Actual states differ by workflow; no shared skeleton exists. |

## 8. Reference UI deviations

- **Reference-aligned:** page and sidebar surfaces, Onest/Public Sans typography, semantic teal/pink palette, line and shadow hierarchy, rounded cards/controls, line icons, table headers, search/filter popovers, form focus/validation, and most modal proportions. These are backed by `design-system/src/tokens/tokens.css` and the migrated shared CSS.
- **Different with a Customer-specific reason:** the two Kanban boards, WhatsApp/Email threads, trip builder, referral tree, import/dropzone, secure upload and document inspector have no directly reusable exported reference component. They keep their existing interaction structure and consume the closest reference tokens/cards/forms. Do not replace those workflows with a generic reference screen.
- **Needs attention:** mobile Customer directory presentation (P1-03), onboarding modal headings (P1-02), High priority badges (P1-01), and task dialog/table density variants (P2-01/P2-03).
- **No business-content copying:** labels, customer/query records, routes, tabs, data and handoffs remain those of Customer.

## 9. Responsive findings

| Width checked | Result |
| --- | --- |
| Desktop, 1440×900 | Shell, dashboards, boards, tables, forms, dialogs and trip builder rendered without page-level overflow. No console/page errors in the route pass. |
| Tablet, 820×1000 | Sidebar/content transitions, Query/Task boards, dialogs and builder steps remained usable; no page-level overflow in the route pass. |
| Mobile, 390×844 | No document-level overflow in the route pass. Boards and wide tables use local horizontal scroll. Customer list needs a clearer off-screen-column cue (P1-03); vault metadata wraps (P2-04); Inbox unselected layout is unbalanced (P2-05); deep breadcrumbs truncate (P2-06). Mobile navigation, tabs, dialogs and builder steps remained available in sampled interactions. |

This check cannot establish visual correctness for every browser zoom level, localization length, uploaded file type, or live remote-data state. Recheck those dimensions if they become release requirements.

## 10. Recommended fix order from Phase 9 — completed in Phase 10

1. **P1-01 and P1-02:** consolidate shared priority badge and modal heading rules. These affect several modules and can be corrected without touching behavior.
2. **P1-03:** resolve Customer table mobile discoverability while preserving all row actions and table functionality.
3. **P2-01 to P2-03:** align task modal, define field-label variants and normalize/document table density.
4. **P2-04 to P2-06:** refine mobile vault row, Inbox panel balance and breadcrumb truncation.
5. **EXISTING-01/02:** route to a separate functional workstream. They are not visual-migration regressions and should not be bundled into the UI consistency patch.
6. Repeat the same route-width, console, build and representative interaction checks after any approved fixes.

## 11. Phase 10 resolution and validation

The original findings above remain as audit evidence. The status of every issue is below; functional baseline limitations were intentionally left untouched. The mobile Customer directory still uses its existing horizontal table rather than the reference's stacked card layout. Its off-screen columns now have a visible scroll cue, preserving all table actions.

| Issue | Status | What changed / component | Reused token or shared pattern | Validation |
| --- | --- | --- | --- | --- |
| P1-01 | **FIXED** | Unified High-priority badge colors on Task and Query cards; removed the redundant Query override. `design-system-03.css`. | Existing `--bad`, `--bad-bg`, `--bad-line` semantic tokens. | Both badges compute to the same pale red surface and red text. |
| P1-02 | **FIXED** | Standardized Customer, Query and Traveller onboarding headings. `design-system-03.css`. | Existing shared `--type-heading-modal-*` and `--ink` tokens used by Vendor/Booking. | All sampled onboarding titles compute to 17px dark sentence case. |
| P1-03 | **FIXED** | Added a shared mobile scroll cue to Customer, Query and Task list tables; retained their tables and actions. `index.html`, `design-system-03.css`. | Existing table scrollers, `--side`, `--line`, `--space-*`, `--accent` and secondary body type. | Cue is visible at 390px, hidden for empty Customer results, and Customer row actions remain reachable by scrolling. |
| P2-01 | **FIXED** | Aligned the Task detail/create/edit modal title and radius with peer dialogs. `design-system-03.css`. | `--type-heading-modal-*`, `--radius-modal`. | Task form title computes to 17px and radius to 14px. |
| P2-02 | **FIXED** | Task form field labels now use the existing uppercase field-label transform. Account settings retain their intentional sentence-case settings hierarchy. `design-system-03.css`. | `--type-label-field-transform` and the existing settings presentation. | Task labels compute to uppercase; Account form controls remain usable in the Workspace test. |
| P2-03 | **FIXED** | Normalized list-table header height across Customer, Query, Task, Pipeline and Finance history. `design-system/src/tokens/tokens.css`, `design-system-03.css`. | One shared `--size-table-head` token set to the existing 40px list-table value. | Sampled headers compute to 40px without changing row content or columns. |
| P2-04 | **FIXED** | Kept vault Customer ID and category chip together without splitting; moved location to a stable second metadata line on small screens. `styles.css`. | Existing vault row, badge and spacing tokens. | At 390px, ID/chip do not wrap internally, location remains visible and there is no page overflow. |
| P2-05 | **FIXED** | Rebalanced only the unselected mobile Inbox list and empty-thread panel, with a smaller existing illustration. `styles.css`. | Existing panels and responsive rules. | At 390px, more conversations and the start action are visible; selecting a thread still opens it. |
| P2-06 | **FIXED** | Let narrow breadcrumbs scroll to show the current Customer/Query/document detail while retaining earlier clickable crumbs and back navigation. `design-system-03.css`, `app.js`. | Existing breadcrumb structure and `--space-1`; only its visual scroll position changed. | Current detail is visible at 390px; scrolling back and clicking the CRM crumb still navigates to `#customers`. |
| P3 | **NOT FIXED — REASON:** no distinct P3 defect was identified in the audit. | No cosmetic-only changes. | — | — |
| EXISTING-01 | **NOT FIXED — REASON:** Query-board click after drag is in the frozen baseline and outside visual QA scope. | No Query drag/click logic changed. | — | Direct Query routes and Sales suite pass; baseline issue remains. |
| EXISTING-02 | **NOT FIXED — REASON:** import's toast-only submit behavior is in the frozen baseline. | No import logic changed. | — | CRM visual/interaction suite passes within the existing behavior. |
| EXISTING-03 | **NOT FIXED — REASON:** cross-module handoffs/placeholders are existing product boundaries. | No destination, route or integration changed. | — | Route-width pass and Entry Dialog suite pass. |

**Validation after fixes:** the production Vite build passed. All 51 route/viewport loads rendered with no page-level overflow or browser console/page errors. Workspace, Communication (45 checks), Operations (59), Sales (22), CRM (40), and Entry Dialogs (25) passed their existing browser suites after the fixes. Desktop, tablet and mobile routes were rechecked; targeted mobile checks covered the Customer table, Query/Task list cues, vault, Inbox and breadcrumbs. Parallel browser-suite execution briefly caused navigation timeouts from local test contention; the affected suites passed when rerun sequentially. No business data, APIs, routes or workflow logic changed.
