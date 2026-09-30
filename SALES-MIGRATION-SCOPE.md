# Phase 6 Sales / Queries migration scope

## Evidence and boundary

Inventory is based on `CUSTOMER-MODULE-SCOPE.md`, `COMPONENT-MAPPING.md`, `index.html`, `app.js`, and the existing CSS. The Customer implementation defines behavior and routes. The local Packages checkout supplies visual patterns; it does not add Customer features. Proposals and the Trip builder are states inside Query detail, not standalone routes. Customer Pipeline is a linked Sales context inside the Customer detail route and its overall CRM page redesign belongs to the later CRM phase.

## Routes and navigation

| Route | Screen and state |
| --- | --- |
| `#trip` | Trip Queries board or list |
| `#flight` | Flight Queries board or list |
| `#accommodation` | Accommodation Queries board or list |
| `#visa` | Visa Queries board or list |
| `#cruise` | Cruise Queries board or list |
| `#transport` | Transport Queries board or list |
| `#query-QRY-…` | Existing Query detail record; six internal tabs and proposal workspace |
| `#customer-CUST-…` | Customer Pipeline tab exposes contextual Queries, Proposals, and Vouchers; linked navigation is in scope, while full Customer page migration is not |

The Sales sidebar Queries item and six category subitems, active state, hash/history navigation, and customer/query links are part of the existing route experience. Packages and Bookings sidebar links are external handoffs, not local Sales pages.

## Query workspaces: all six categories

- Category tabs with counts and corresponding sidebar subitems.
- Search input; filter popover with Mine/All scope, Priority, Pending on, and Customer tier; Apply/Clear and applied state; Refresh action.
- Kanban/list switch. Kanban has six columns: Unassigned, New, Quoting, Negotiation, Won, Lost. Each column has status/count, add action, empty state, draggable cards and drop targets. Cards show priority, customer tier, title, customer/ID, delay, activity, and assignee. Status movement and drag feedback remain intact.
- List view has the same six status tabs, service/title and customer identity, priority, pending on, value, activity/assignee, row action, pagination, status-specific empty row, and whole-category no-query state.
- Query board/table cards and actions open the same detail record. Search/filter no-match and no-record presentation must retain its current conditions.

## Query creation and editing

- Query-type selector dialog: six type cards and close action.
- Shared Query dialog with three grouped sections in one form: customer search/picker; inline Create customer panel; type-specific service fields; repeat sections; travellers/group size and child ages; assignment including multiple assignees; priority, follow-up, value, and notes; Save as draft and Add query actions. Although the sections have `data-query-step` attributes, the current `submitQuery` handler submits the form rather than advancing a stepper. Existing required-field/date validation, disabled submit, and close behavior remain.
- Trip: Domestic/International scope, departure/destination, dates, repeat cities and days, vehicles.
- Flight: One way/Round trip/Multi-city, route, departure/return dates, cabin class, preferred airlines.
- Accommodation: destination, type, check-in/out, property, meal plan, multi-select star ratings.
- Visa: country, visa type, intended date, processing speed, passport status, nationality.
- Cruise: region, cruise line, departure/arrival ports, sailing/return dates, cabin preference, cabin count.
- Transport: departure/destination, start/end dates, optional repeated stops and vehicles.
- The Query detail action menu contains **Edit query**, but its handler looks for `#queryDetailEditForm` and no such form is rendered by the current implementation; the menu action has no editable form to open. This is an existing functional limitation, not a migration task. The working current-position editor is a separate overlay in Query detail.

## Query detail

- Record header: type icon, title/metadata, status select, Build proposal, favorite, action menu (View customer, Add task, Mark as lost, Edit query, Delete customer). Preserve the existing menu labels and behavior.
- Tabs: Overview, Proposals, Travellers, Documents, Tasks, Communication with counts and active states.
- Overview: current position/commercial facts and editor overlay, customer context, task preview, and activity timeline.
- Proposals: proposal table, status, empty state, Build proposal action, and proposal workspace states listed below.
- Travellers: linked table, role/document summary, customer navigation.
- Documents: linked document rows/statuses, document vault action, empty state.
- Tasks: query-scoped search, filters/sort/date range, table, pagination, and Add task. Its operational controls retain the Phase 5 behavior and styling.
- Communication: query-context customer email workspace, mailbox tabs, thread/list/reader, composer, attachments/templates/send. Its communication behavior and Phase 4 styling remain intact.
- Unavailable Query state, missing Proposal state, and per-tab empty states.

## Proposal creation and list

- Trip proposal creator: package/saved itinerary/scratch source chooser, searchable catalog, selectable catalog cards, empty search result, proposal title, Simple/Advanced itinerary mode, cancel/create actions.
- Non-Trip query types: existing direct draft proposal path and list state.
- Proposal list/table: proposal title, status, date/value/context and existing row actions. Status is shared with the Query/customer pipeline display.
- No separate Proposal route, modal, or independent Quotes screen is implemented.

## Trip itinerary builder

- Existing four-step workspace within Query Proposals: Build itinerary, Proposal content, Costing, Preview; Previous/Continue controls and Simple/Advanced mode switch.
- Build: route/stops editor; day accordions with editable date/city/time/description, meals/operations fields as appropriate; add/remove days and activities; accommodation, transportation, and flights editable service tables with add/remove row actions.
- Content: title, Prepared for, Booking from, introduction, inclusions, exclusions, important notes.
- Costing: All services/Accommodation/Activities/Transportation/Flights tabs, editable unit costs, calculated totals, margin percentage, category/base/margin/client price summary, no-services state.
- Preview: customer-facing cover, route, day plan, stays, inclusions/exclusions/notes, review checklist, shared link, Publish/Publish changes, and Share in Communication when available.
- Builder-specific unavailable proposal and empty service states, active/complete step states, input validation/disabled states, and responsive presentation.

## Cross-context and supporting UI

- Customer detail Pipeline metrics and contextual Queries, Proposals, Vouchers sub-tabs/tables, status/money cells, empty states, and links to Sales records. Shared Sales visual recipes may be applied to these records without changing the Customer page layout.
- Shared components consumed: sidebar/nav state, page header, tabs, search, filter popover, buttons, icon buttons, inputs/selects/textarea/radio/checkbox, badges, avatar, cards, data tables, pagination, modal, dropdown, empty state, toast, and feedback states.
- Customer-specific visual components: Query Kanban/drop feedback, dynamic six-type form sections, current-position editor, proposal source/catalog cards, Trip builder stepper/route/day accordions/service grids/cost sheet/preview. These have no exported one-to-one reference component and retain their current workflow.

## State coverage and exclusions

Cover hover, focus, active, selected, disabled, validation error, empty/no-match, unavailable-record, and responsive states in every Sales surface. Query workspaces are rendered from local application records; no dedicated Sales loading spinner or network error screen is implemented, so no new loading or error flow will be invented. Existing task, email, and CRM interiors reached from Query detail are retained and only shared Sales containers or links may receive visual adjustments. No routes, APIs, data models, calculations, business logic, or information architecture are part of this migration.
