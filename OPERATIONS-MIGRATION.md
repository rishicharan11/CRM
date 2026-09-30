# Phase 5: Operations UI migration

## Scope and source

The Customer code and `CUSTOMER-MODULE-SCOPE.md` define the Operations workflow. The visual reference is the local checkout of `yakosasam797/pakages-module`, especially Vendor CRM `TasksPanel.css` and the shared data sheet, form, modal and status styles. No Operations route or task record structure changed.

## Screens and routes migrated

| Route or context | Existing screens and states covered |
| --- | --- |
| `#tasks` | My Inbox, Team, Overdue, Completed and Follow-ups tabs; six-column Kanban; list view and six status tabs; search, priority/entity/assignee/date filters, sorting, pagination, refresh, empty board/list/result states. |
| Customer detail `#customer-CUST-…` | Overview task preview cards; Tasks tab table, search, filters, sorting, pagination, empty result and Add task. |
| Query detail `#query-QRY-…` | Overview task preview cards; Tasks tab table, search, filters, sorting, pagination, empty result and Add task. |
| Shared dialogs | Task detail, completion, inline delete confirmation, Add/Edit task, assignee picker, status and priority controls, due date/time controls and required-field validation. Follow-up tasks use these same dialogs. |

## Reused and adapted components

- Reused the existing design tokens, icon symbols, buttons, tabs, search fields, filter popovers, table and pagination styling, badges, modal shell, form fields, date/time controls and multi-assignee picker. No new component or token was created.
- Adapted the existing Customer Kanban columns and cards to the reference card, sheet header, semantic status, type, border and focus patterns. The six columns, card fields, add-per-column action and native drag/drop targets remain unchanged.
- Applied one task table vocabulary to the global task list and the customer/query contextual tables. Column sets, row actions and horizontal scrolling remain as implemented.
- Applied the Vendor task detail/form vocabulary to the existing Customer modal. The reference uses a create popover; Customer keeps its existing shared modal and fields.
- Added a `data-status` presentation attribute to the task detail status badge so its color can use the established neutral, pink, warning, error and success tokens. This attribute does not affect task behavior.

## Visual changes

The Operations tabs and filters now use the reference font roles, spacing and pink active treatment. Kanban column headings, empty columns, cards, priority/due chips, avatars, drag-over and focus states use the established tokens. Global and contextual task tables use reference sheet headers, dividers, row hover, type hierarchy and semantic badges. Detail and Add/Edit dialogs use the shared overlay, surfaces, form controls, focus treatment and status colors. Customer/query overview task previews use the same card and badge language.

## UX and functionality preserved

No route, API, task data, local storage format, status transition, assignment rule, customer/query relationship or task action was changed. Search/filter/sort behavior, list and board views, keyboard access, drag/drop, create/edit/complete/delete, due date/time dependency and follow-up membership remain driven by the existing code.

## Validation

- Ran the local Vite application and the production Vite build successfully.
- Browser tested `#tasks`, customer detail Tasks and query detail Tasks in Chrome at desktop and 390px mobile widths. The Kanban remains horizontally scrollable on mobile; the list tables retain their existing horizontal scroll. Reviewed board, list, filter, detail, form and contextual task screenshots.
- Tested all five task categories, six board/list statuses, Kanban drag/drop, search/no match, filter Apply/Clear, sorting, list and board selection, pagination display, detail, create/edit, multi-assignee choice, due date/time enablement, completion, disabled completion, delete confirmation and deletion, customer/query linked task creation, follow-up detail/edit, and required title validation. No browser page or console errors occurred.
- Browser tests used fresh contexts; test tasks and changes were isolated from existing user data.

## Existing limitations and visual deviations

- Follow-ups are tasks with an existing `followUp` flag. Existing follow-ups can be viewed and edited through the shared task dialog. The Add Task form has no control to set this flag, so adding a task while the Follow-ups tab is active does not make it a follow-up. This existing behavior was preserved.
- There is no dedicated asynchronous loading or network error state in Operations. Native form validity and existing empty/no-match states remain the available states; no new workflow was invented.
- The reference Vendor CRM has a task sheet and create popover, but no matching six-column Kanban. Customer retains its board and modal, with reference surfaces and tokens. Native drag/drop was verified on desktop; the existing mobile board remains swipeable horizontally.
