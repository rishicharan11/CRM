# Phase 6 Sales / Queries UI migration

## Complete scope and routes

The discovery inventory is in `SALES-MIGRATION-SCOPE.md`. The six Query workspaces at `#trip`, `#flight`, `#accommodation`, `#visa`, `#cruise`, and `#transport` and existing Query detail records at `#query-QRY-…` received this visual pass. The customer-scoped Queries, Proposals, and Vouchers Pipeline at `#customer-CUST-…` was reviewed and already uses the shared Phase 2/3 table, tab, status, and metric treatments; its CRM page layout was left for the CRM phase. Proposals and the Trip builder remain internal Query-detail states.

## Files and implementation

| File | Change |
| --- | --- |
| `SALES-MIGRATION-SCOPE.md` | Recorded actual routes, screens, controls, forms, board, proposal/builder states, linked contexts, and state coverage before editing the application. |
| `design-system-03.css` | Added scoped Sales presentation rules that consume the existing canonical Packages/Booking/Vendor design tokens. No new token or component library was created. |
| `SALES-MIGRATION.md` | This implementation and validation record. |

No JavaScript, HTML, route, data, API, or business-logic file changed.

## Screens and components

- **Query workspace:** six category tabs, header/actions, search/filter controls, Mine/All and board/list toggles, six Kanban columns, drag/drop cues, cards, list sheet, status tabs, rows, pagination, and empty states now use the shared surface, line, typography, status, avatar, hover, and focus rules. Column status colors now resolve from semantic tokens rather than local hex values.
- **Query form and editor surfaces:** the six type choices and dynamic Trip, Flight, Accommodation, Visa, Cruise, and Transport fields reuse the shared modal, fields, buttons, and select patterns. The scoped rules align type cards, radio/checkbox pills, repeat rows, nested customer panel, labels, selected state, and validation/focus appearance. The existing one-form three-section flow and working current-position editor remain intact. The Query detail menu's separate Edit query action has a pre-existing missing-form limitation described below.
- **Query detail:** the record header, status control, favorite/action buttons, tabs, detail panels, facts, traveller/document rows, linked proposal table, position editor, and empty states use the established record and data-sheet styling. The Query Tasks and Communication interiors retain their Phase 5 and Phase 4 styling and interactions.
- **Proposal creation:** source chooser, package/saved itinerary catalog, search, selected cards, scratch note, mode choices, and actions follow the reference picker/card/field treatment.
- **Trip builder:** the existing four-step itinerary, content, costing, and preview workspace now uses the reference TripComposer sheet, accordion, editable row, step, price summary, and preview grammar while retaining every Customer-specific control.
- **Customer Pipeline context:** existing shared metrics, tabs, badges, and tables were confirmed visually consistent and the Queries/Proposals/Vouchers subtabs were exercised. No CRM page redesign was added.

## Reference reuse and deviations

The local Packages reference checkout (pinned at `7c2009e4de3a7cbb117fa66c8bfe0564268ffbb7`) provided the `TripComposer`, proposal detail, data-sheet, picker, and section patterns. The Customer app already imports the canonical design-system token files through `design-system-03.css`, and Phase 2 provides shared button, form, tab, table, badge, modal, avatar, and empty-state rules. The existing Customer Kanban, six dynamic Query forms, and four-step builder have no exported one-to-one reference component, so their existing DOM and workflow were visually adapted in place. The existing six-column Kanban remains horizontally scrollable on narrow screens, and the Customer builder keeps its own step and cost categories because those are functional UX requirements.

## Functionality preserved

Only CSS and documentation changed. Query/customer IDs and relationships, status changes, drag/drop, search/filter logic, creation, date validation, assignment, proposal creation, pricing and margin calculations, publish/share actions, routes, and linked task/email flows continue to use the original handlers and data structures.

## Validation

- Production build: `node node_modules/vite/bin/vite.js build` passed. `git diff --check` passed.
- Browser checks ran against the local Vite app at `http://127.0.0.1:5175/` using Chrome at 1440×900, 820×1000, and 390×844. All six category routes loaded with their six Kanban columns and no page-level horizontal overflow or browser-console errors. List view, all six Query detail tabs, and the type selector/form also loaded at all three widths.
- Interactions exercised: search/no match/reset; filter selection/Apply/Clear; Kanban drag from one stage to another; list/status switch; all six type-specific form sections and required-field disabled state; Trip Query creation; detail favorite/status/action menu and current-position editor; package catalog search/selection; package/itinerary/scratch source modes; Trip proposal creation; Simple/Advanced switch; add day and flight row; all four builder steps; cost category and margin input; publish and Share in Communication; direct non-Trip draft proposal; customer Pipeline Queries/Proposals/Vouchers subtabs. No console errors were observed.
- Empty/unavailable coverage: Query search no-match, proposal catalog no-match, Kanban/list empties, and builder service empties retain their original conditions. An unknown `#query-QRY-…` deep link follows the application's existing fallback routing rather than rendering the internal unavailable-record panel. There is no dedicated Sales network loading or error screen in the current local-data implementation.

## Existing limitations and follow-up

- After changing a costing amount or margin, the existing `change` listener rerenders the builder on blur. A click on a step immediately after editing can be consumed by that rerender; clicking the step again works. This is in the unchanged `app.js` behavior and was left intact per the visual-only scope.
- The Query detail menu's **Edit query** handler looks for `#queryDetailEditForm`, but `renderQueryDetail` does not render that form. The action currently closes the menu without opening an editor. This pre-existing functional gap was observed during validation and left untouched.
- The reference repository does not export the Customer-specific Kanban or four-step builder as reusable components. The scoped rules use the nearest reference patterns while keeping those compositions isolated for later refinement.
