# Customer Module visual migration audit

**Date:** 29 September 2026  
**Working branch:** `customer-module-mvp1`  
**Scope:** Audit and migration plan only. No application UI, behavior, data, or business logic was changed.

## Evidence and decision rule

- Reference workspace: the existing local checkout of `yakosasam797/pakages-module` at `7c2009e4de3a7cbb117fa66c8bfe0564268ffbb7`. Booking is submodule `da8a836b`, Vendor CRM is `1a423e38`, and Finance is `2e91178d`. The GitHub URL returned “Repository not found” from this environment, so the remote's current state could not be verified. This audit describes the local checkout, not an unverified later revision.
- Reference code: `../pakages-module/booking-module/booking-redesign.html`, `../pakages-module/vendor-crm/src/`, `../pakages-module/finance-module/src/`, and their installed `@paryatech` design-system packages. The workspace shell and its `src/styles.css` were checked because they wrap the three modules.
- Customer code: `index.html`, `app.js`, `styles.css`, `design-system-03.css`, and `design-system/src/tokens/`. The prior `DESIGN-SYSTEM-MIGRATION.md` was read as history, then checked against the current rendered UI.
- Rendered comparison: desktop 1440 × 900 for Booking, Vendor CRM, Finance, Customer list/profile, dashboard, inbox, tasks, queries, document vault, notifications, account, Customer filter, and creation flows; 390 × 844 for the Packages and Customer lists. This was a visual inspection, not a full interaction or accessibility test.
- **When references differ:** use the shared Vendor CRM/Finance/workspace shell for global chrome, Booking for record, table, communication, and notes patterns, and the common semantic token roles for colors and states. Booking's standalone sidebar still has visible group labels and a different mark, while the integrated Vendor/Finance shell hides labels and uses the full Paryatech lockup. Preserve Customer's present navigation destinations and interactions.

## 1. Reference UI design rules

| Area | Rule observed in Booking, Vendor CRM, and Finance |
| --- | --- |
| Overall layout | Pale neutral page surrounds an inset white workspace. Desktop sidebar is about 250 px, with a compact rail and a bounded workspace. Content scrolls inside the workspace. Titles, tabs, toolbars, open sheets, and pagers follow one page gutter. On narrow screens the shell becomes a single workspace. |
| Sidebar | Full Paryatech lockup in the integrated shell; notes near the top; destination groups separated by quiet rules; credits and Collapse at the foot. In the integrated shell, active destination has a pale pink fill and dark pink text/icon. Booking standalone retains visible group labels and a different logo treatment. |
| Header | Thin white top bar with back/breadcrumbs at left, compact global search, help/notification utilities, and pink person account at right. Customer-specific labels can differ; chrome dimensions should not. |
| Typography | Onest for page, record, section, and action headings; Public Sans for body, navigation, labels, and table text; JetBrains Mono for IDs, dates, counts, references, and tabular money. Page headings use the `--type-heading-page-*` role (up to 24 px); record titles use `--type-heading-record-*` (up to 22 px); sheet headers use 12 px Public Sans at weight 600. |
| Colors | White `--surface`, warm sidebar `--side` (`#fcfbfa`), dark `--ink` (`#16181d`), light grid `--line` (`#e4e7ec`). Teal `--accent` (`#0f6e63`) identifies work actions and links. Pink `--pink` (`#a5537e`) identifies selected navigation/tabs and person or place context. Success, warning, danger, and neutral info use semantic status tones. |
| Spacing | Small recurring steps of 4, 8, 12, 16, and 24 px. Shell inset/gap is roughly 10–14 px by viewport. Main page gutter responds to workspace width. Toolbars sit directly above their data surface; related text has tight internal spacing. |
| Buttons and icon actions | One teal filled primary action; teal outline brand/secondary work action; neutral outline or ghost utilities. Small actions are compact, usually 32–36 px, while standard fields/actions can be 36–38 px. Disabled actions are visibly muted. Icon buttons stay square and labelled for assistive technology. |
| Inputs | Light bordered soft rectangles; clear label/placeholder hierarchy; consistent focus outline. Search carries a search icon, and filters show their current value. Form help and validation text stay next to the field. |
| Tables and pagination | Open data sheets, usually with a pale header, thin horizontal/vertical rules, stacked lead cell, mono secondary ID, and attached pager. Interactive rows shade as a whole on hover and show visible keyboard focus. Finance aligns money right with tabular figures. Large sheets scroll within their region on narrow screens. |
| Cards | Use restrained borders and little elevation for genuinely separate records, tasks, or summaries. Avoid nesting a rounded card around an open register. Finance metrics form a divided flat strip; record headers can have a subtle tint. |
| Tabs and badges | Tabs use a bottom rule and pink active underline/text with compact mono count chips. Status chips use semantic color, soft fill, and often a leading dot in Vendor/Packages; category/identity chips are neutral or person colored, not automatically status colored. Pills are for counts/status/channels, not every control. |
| Modals and drawers | White surface, token border, modest radius and `--overlayShadow` under a dim backdrop. Header, scrolling body, and footer actions are distinct. Booking uses a 14 px centered modal; Finance uses a right drawer for longer money forms; Vendor uses both full-page creation and modals. Their **visual grammar** is reusable without changing Customer's flow type. |
| Dropdowns and menus | Anchored white surfaces, thin border, `--menuShadow`, compact rows, neutral hover, clear selected/disabled state, and focus visibility. Destructive items use danger color only for destructive meaning. |
| Filters and search | Search appears before record-specific filters. Applied values stay visible. Filtered empty results explain what happened and offer a sensible recovery action where one exists. Package/Vendor list filters are labelled controls; Customer can keep its existing filter popover. |
| Icons | Small line icons with consistent size/stroke (roughly 14–18 px in controls/navigation). Use a semantic icon consistently for the same destination/action. The integrated shell exposes a shared icon set; Booking also has local SVGs. |
| Radius and shadows | Design-system radius roles: `--radius-xs` 5 px, `--radius-sm` 8 px, `--radius-md` 10 px, `--radius-lg` 16 px, plus pill. `--blockShadow` and `--panelShadow` are subtle; `--menuShadow` and `--overlayShadow` are reserved for floating layers. |
| Empty states | Plain title and helpful explanation; an action only when useful. Vendor uses `EmptyState`; Finance also uses simple empty rows; Booking has purpose-specific empty content. There is no single mandatory illustration style. |
| Loading states | No common full-page skeleton is established in the inspected three modules. The workspace uses local in-context progress, for example region suggestions; Vendor also marks noninteractive loading rows. Do not introduce a global loader into Customer without an actual asynchronous wait. |
| Error states | Errors are contextual: inline form feedback, alert text, or semantic danger chips. Finance's record form exposes an inline `role="alert"` error. Errors should not recolor unrelated UI or silently clear the user input. |
| Hover, active, focus | Neutral hover for rows and ordinary controls; teal hover for work links/buttons; pink for selected nav/tabs/person context; semantic hover for status; visible 2 px focus outline from `--focus`. Active state must remain visible without hover. |

## 2. Existing Customer UI rules

Customer is a static HTML/CSS/JavaScript application, not a React consumer of `@paryatech/ui`. `index.html` loads `styles.css` first and `design-system-03.css` second. The latter imports a local copy of Direction 03 tokens and typography, then overrides many product styles. The prior migration already aligned much of the UI.

| Area | Current Customer implementation |
| --- | --- |
| Shell | Inset 250 px/66 px desktop shell, Paryatech lockup, notes, grouped navigation, credits, Collapse, breadcrumb/search/action top bar. Rendered desktop shell is close to Vendor CRM and Finance. |
| Type and color | Mostly uses the same Onest/Public Sans/JetBrains Mono roles and teal/pink semantics. The imported local token palette is nearly identical to the reference package. Product CSS still contains direct slate, blue, pink, border, and shadow values in selected components. |
| Lists | Customers and Document vault are open sheets with attached pagers. Customer rows are clickable and retain an Edit/Delete overflow menu. Main list uses 68 px rows and an icon-only advanced-filter popover; reference sheets are generally denser and use token-colored cells. |
| Profile | Tinted customer record header, seven tabs (Overview, Travellers, Documents, Pipeline, Finance, Tasks, Communication), flat summary strip, details, and linked records. The identity/header visual already resembles Vendor record treatment. |
| Other pages | Dashboard has Normal/Advance modes and its own card/grid layout; Inbox is a split conversation surface; Queries and Tasks use multi-column boards and list alternatives; Document vault, Notifications, and Account each have their own views. |
| Forms and layers | Customer creation, query/booking creation, tasks, traveller/document work, import, editing, and confirmations use Customer-owned modals/popovers. Customer notes use an anchored popover. Form content/validation is part of the current UX and must remain. |
| States | Pink primary record tabs/nav and teal work actions mostly match. Some secondary tabs, notably Inbox, use teal selection. Empty states exist for search, boards, mail, documents, and dashboard. Document upload has inline error text; there is no page-wide asynchronous loading state. |
| Responsive | Desktop preserves a fixed shell and internally scrolling workspace. At 390 px, Customer list remains a horizontally scrollable seven-column table with compact icon actions, while the Packages list presents each record as a stacked card. |

## 3. Differences and migration decisions

| Priority | Difference | Evidence | Visual decision, with behavior preserved |
| --- | --- | --- | --- |
| High | Customer sheet text, borders, hover, avatar, category chips, and overflow button still use raw slate/pink hex values such as `#0f172a`, `#475569`, `#eef1f4`, and `#f8fafc`. | `design-system-03.css` customer-table block around lines 644–700 and later row overrides | Map them to `--ink`, `--ink-2`, `--line`, `--surface-2`, `--pink-*`, and radius/shadow roles. Keep customer category and tier meanings. |
| High | Narrow Customer table hides most facts/actions offscreen, unlike the reference Packages card layout. | Rendered 390 px Customer/Packages comparison; Customer `min-width: 880px` table rule | Design a narrow record card or accessible stacked row presentation containing the **same** fields and Edit/Delete actions. Keep category tabs, search, filters, row opening, and pagination unchanged. If an internal horizontal sheet remains for dense subrecords, keep scrolling inside that region. |
| High | Small/medium control height aliases differ from the reference package: Customer has both at 36 px; reference tokens define `sm` 32 px and `md` 38 px, with a separate 36 px toolbar role. | Diff of local `design-system/src/tokens/tokens.css` against `../pakages-module/node_modules/@paryatech/ui/src/tokens/tokens.css` | Map by component role, not a blanket size swap. Keep 36 px toolbar/icon buttons; use 32 px small CTAs where reference does; use 38 px standard form/action control where appropriate. Check dialogs and narrow actions for regressions. |
| Medium | Customer list search is a short combined search/filter control; Vendor/Booking sheets give search more horizontal weight and distinguish filter controls. | Rendered Customer/Vendor/Booking lists | Widen search where space permits and make the existing filter trigger and applied chips visually clearer. Keep the popover's options, Apply/Cancel behavior, and focus order. |
| Medium | Inbox filter and some secondary selection styles use teal even though cross-module tabs use pink for selected navigation. | `styles.css` `.inbox-filter-tabs button.is-active`; rendered Inbox | Align navigational/filter tab underline and text with the pink tab role, while retaining teal for Send/Add actions and channel/status meaning. Audit all active/hover pairs, not just default states. |
| Medium | Board cards, profile subpanels, document rows, notification items, and account sections have component-specific borders, spacing, and radii. Some are already close, others read denser or more boxed than the reference open-sheet language. | Rendered Customer dashboard, profile, Tasks, Queries, Vault, Notifications, Account | Use one hierarchy: open sheets for registers/activity, restrained bordered cards for distinct tasks/summary units, subtle tint for record identity. Keep existing groupings and section order. |
| Medium | Customer forms have different label casing, field fill, footer button geometry, and floating layer details from Booking/Vendor/Finance. | Rendered Add customer and filter popover; `styles.css` and `design-system-03.css` modal/field blocks | Normalize field, label, disabled, focus, menu, modal header/body/footer, and error styling through shared roles. Keep Customer's single scrollable form, exact fields, validation, and modal workflow. |
| Medium | Customer has multiple local icon shapes and strokes, including sidebar icons, with small visible differences from the reference integrated shell. | Rendered sidebar and `index.html` SVG sprite | Normalize size/stroke and use consistent glyphs for shared destinations, without changing labels or action semantics. |
| Low | Customer's local token copy duplicates the package and can drift; most numeric typography diffs are CSS notation only (`.01em` versus `0.12px`). | Token file diff | Treat the installed design-system token version as the audit target. Avoid a framework migration solely to import React components. Keep typography roles already matching. |
| Low | Empty/error treatments vary among Customer screens; a universal loading pattern is absent in both Customer and the references. | Customer empty states and Finance/Vendor source | Unify color, type, spacing, and recovery-action styling where a state already exists. Document a styling contract for future loading/error surfaces; do not invent new flows or data transitions. |

## 4. Components that can be reused

| Source/pattern | Customer use | Reuse method |
| --- | --- | --- |
| Direction 03 color, type, spacing, radius, and effect tokens | All Customer views | Direct CSS token reuse. Most palette and type roles are already present locally. |
| Existing Customer `.pt-*` shell classes, logo assets, breadcrumb/search/account structure, notes and credits | Global shell | Keep the DOM and event wiring; refine local geometry/icons only where visual comparison finds drift. |
| Existing Customer button, icon button, input, field, tabs, pager, modal, menu, avatar, and empty-state CSS primitives | Repeated Customer controls | Consolidate on shared token-driven recipes; keep IDs, selectors used by `app.js`, labels, and behavior. |
| Reference `DataSheet`, `TabBar`, `StatusChip`, `SearchField`, `FilterSelect`, `Pagination`, `Avatar`, `EmptyState`, `Modal`, `Button`, and `IconButton` | Lists, detail tabs, status, forms, states | Reuse their **visual specifications** from `@paryatech/ui` and Vendor/Finance. These are React components, so direct import into this vanilla JavaScript app would require an unrelated framework rewrite. |
| Booking record header, ID chip, notes, conversation, table-row focus pattern; Vendor status dot and menu pattern; Finance flat KPI/register pattern | Customer profile, notes, communications, sheets, dashboard/finance | Adapt styling and markup only where needed, while keeping Customer data and interaction handlers. |

## 5. Components that need visual migration

1. **Customer and vault sheets:** cell colors, rules, lead typography, avatar/category chips, row hover/focus, overflow menu, attached pager, and narrow layout.
2. **All board/list toolbars:** search width, filter trigger and dropdown geometry, selected values, count chips, hover/focus/disabled states.
3. **Customer profile tabs and subrecords:** consistent tab rail, summary strip, contact/profile/dates panels, traveller/document rows, pipeline/finance/task registers, communication panes.
4. **Creation and edit surfaces:** input/label/help/error styles, modal geometry and footer, select menus, disabled buttons; keep each current flow type.
5. **Shared feedback:** empty results, empty boards, upload/form errors, toast, loading affordances only where an actual operation waits.
6. **Dashboard, Tasks, Queries, Inbox, Notifications, Account:** align repeated card/sheet/state styles and icon language without reordering content.

## 6. Design tokens and values to change

**Keep:** the semantic palette and font families already match the reference. Do not replace teal/pink roles or customer-specific status meanings wholesale.

| Current Customer value/use | Reference target | Migration rule |
| --- | --- | --- |
| `--size-control-sm: 36px`, `--size-control-md: 36px` | Package `sm: 32px`, `toolbar: 36px`, `md: 38px` | Audit every consumer and map it to the correct control role. Do not reduce 36 px icon targets by changing one global variable without review. |
| Raw Customer sheet colors (`#0f172a`, `#475569`, `#64748b`, `#eef1f4`, `#f8fafc`, etc.) | `--ink`, `--ink-2`, `--ink-3`, `--line`, `--line-2`, `--surface-2` / `--side` | Replace direct colors with semantic roles at the component level. |
| Raw avatar and category colors (`#f3c9da`, `#8a4a64`, `#fbe9f0`, slate chip colors) | `--pink-avatar`, `--pink-ink`, `--pink-line`; neutral `--info-*` or `--surface-2` for category | Preserve identity/category semantics; do not turn B2B/B2C or tier into success/warning states. |
| Repeated local border-radius numbers (`10px`, `12px`, `14px`, `999px`) | `--radius-sm/md/lg/pill` where roles fit | Keep Booking's 14 px modal as an intentional exception if its rendered modal remains the closest reference; reduce unexplained one-off radii. |
| Repeated local hover/shadow declarations | `--panelShadow`, `--menuShadow`, `--overlayShadow`, `--line-hover`, `--surface-2/3` | Use subtle elevation only on cards/floating layers; no shadow on open sheets. |
| Teal-selected secondary tabs | `--pink`, `--pink-ink`, `--pink-soft`, `--pink-line` | Reserve teal for work actions and work links. Preserve channel/status colors by meaning. |
| Local spacing increments outside the established rhythm | `--space-1` through `--space-5` and the responsive `--page-pad` | Align shell and sheet edges first, then internal card/form spacing. Retain dense product data where needed. |

## 7. Page-by-page migration plan

| Page or flow | Visual work | UX and functionality to preserve |
| --- | --- | --- |
| Shared shell and top bar | Check icon stroke, sidebar spacing, note/credit treatment, account and search focus at desktop/mobile against Vendor/Finance. Keep current close shell match. | Existing destination order, breadcrumbs, global search, notifications, account, notes, collapse/drawer, and cross-module navigation. |
| Home dashboard, Normal and Advance | Align KPI/card type, borders, spacing, tabs and table areas to Finance's divided metric/open-sheet rhythm where applicable; keep distinct cards for separate work queues. | Reporting period, Normal/Advance mode, quick actions, links, charts, alerts, and displayed data. |
| Customers list | Convert hardcoded table styles to semantic tokens, align search/filter/pager density, and design an equivalent narrow record presentation. | All/B2C/B2B/Sub-Agent/Other counts and filtering, advanced filters, search, import, refresh, creation, row open, Edit/Delete, paging. |
| Customer detail shell and Overview | Retain tinted identity header; refine tabs, metric strip, profile panels, link/button hierarchy, and record ID typography. | Customer identity, seven tabs, notes, Add query/booking, profile edits, metrics, tasks/preferences/referral information and actions. |
| Travellers tab and traveller dialogs | Align row/accordion, person avatars, preference chips, inputs, selection, modal footer, empty/error styles. | Add/edit/view traveller, all preference categories, accordion behavior, document navigation and saved data. |
| Documents tab, Document vault and document dialogs | Align open sheet, traveller group rows, counters, badges, preview/print/actions, request/review/upload/replace/delete layer styling. | All document status rules, upload validation, review, request link, print, replacement, deletion confirmation, search/filter/paging. |
| Pipeline tab | Align subtab/count rail, flat summary, query/proposal/voucher sheet cells, status and money alignment. | Three subtabs, linked record totals, references, row navigation and action outcomes. |
| Finance tab | Use Finance's money alignment, semantic balance/status tones, open transaction sheet and understated bank-detail panels. | Existing calculations, credit/debit order, running balances, account actions, and Full ledger handoff. |
| Tasks tab and global Tasks | Align board card density, priority/status chips, owner avatar, toolbar, empty columns, list rows and modal controls. | My Inbox/Team/Overdue/Completed/Follow-ups, search/filter/sort, Kanban/list, task create/edit/complete and drag updates. |
| Communication tab and global Inbox | Use Booking/Vendor split-pane conversation hierarchy, selected thread, channel chips, composer controls, and pink selected filter state. | Mailbox filters, message chronology, templates, attachments, compose/send and customer links. |
| Queries board/list and query detail | Align query card/chip/meta density, six service tabs, stage headers, table rows, detail header/tabs and form controls. | Six query types, Mine/All, filters, search, stage drag, creation, record actions and detail information. |
| Notifications and Account | Align row/selection, section navigation, field/control styles, focus and empty state with shared shell surfaces. | Notification filters/actions/preferences and account sections, photo, profile save and role display. |
| Shared overlays and feedback | Review every modal/popover/menu/toast at normal and narrow widths for token colors, radius, shadow, focus, disabled, error and hover states. | Modal content, validation, keyboard close/focus return, destructive confirmation, local persistence and all handler bindings. |

### Acceptance checks for the later implementation

- Compare Customer list, record Overview, one dense subtab, Inbox, Tasks/Queries, and a form against the reference at 1440 px and 390 px. Check active, hover, focus, disabled, empty, and error states where they exist.
- Keep all current routes, seven customer tabs, fields, labels, data, filters, calculations, row actions, modals, and keyboard/drag behavior. A visual change must not alter Customer's information architecture or business logic.
- Confirm no document-level horizontal overflow at narrow widths; dense record sheets may scroll **inside** their own region. Keep every action accessible.
- Run the Customer build and exercise the existing core flows after implementation. The audit itself does not implement or approve those changes.
