# Shared component migration — Phase 2

**Branch:** `customer-module-mvp1`
**Visual reference:** local Packages Module checkout at `7c2009e4de3a7cbb117fa66c8bfe0564268ffbb7`, including Booking, Vendor CRM, Finance, and the installed `@paryatech/ui` styles.
**Functional reference:** the existing Customer HTML and JavaScript.

## Components changed

| Customer implementation | Reference pattern | Migration |
| --- | --- | --- |
| `.button` variants, icon actions, row actions, loading/disabled states | `Button`, `IconButton`, `RowActions` | Used reference control heights, semantic action and danger colors, hover, pressed, disabled, and keyboard focus treatment. |
| `.field` inputs, textareas, selects, checkboxes, radios, toggles | `TextField`, `Checkbox`, `FilterSelect` and Vendor forms | Used surface/border/focus/error/disabled tokens, shared toolbar height, and consistent native control accent. Existing required fields, input types, and validation remain. |
| Search fields and filter popovers/options/chips | `SearchField`, `FilterSelect`, sheet toolbar | Aligned search dimensions, dropdown radius/shadow, selected and focus states, filter chips, and applied-filter controls. Search targets and filter semantics remain. |
| Sidebar controls, topbar actions/breadcrumbs, tab rails and count chips | `AppShell`, `TabBar` | Kept Customer destinations and order while aligning nav/icon sizing, action dimensions, pink selected state, and tab geometry. |
| Customer/query sheets, row menus, pagination, avatars and status chips | `DataSheet`, `Pagination`, `Avatar`, `StatusChip` | Replaced hardcoded slate row/menu colors with reference tokens; aligned hover/focus, row action dimensions, compact pager controls, avatar and semantic status tones. Columns and sort/navigation behavior remain. |
| Shared cards, task/query cards, empty states and toast | Reference cards, `EmptyState`, Finance feedback | Applied shared border/radius/shadow/type and semantic feedback roles. Contextual empty-state text and actions remain. |
| `.modal`, filter menus, action menus, notes overlay and other existing overlays | `Modal`, reference dropdown/popover recipes | Applied the reference surface, radius, border, elevation and focus rules to existing overlays. Dialog structure, fields, close behavior, and actions remain. |

## Reuse and adaptation

- Reused the existing Customer component markup, classes, SVG sprite, and event handlers. No duplicate functional component was added.
- Reused the reference semantic tokens already present in `design-system/src/tokens/tokens.css`. The small/standard control heights now match the reference `32px`/`38px` roles; toolbar controls retain `36px`.
- Adapted reference React component styling through the existing Customer CSS because Customer is a vanilla HTML/CSS/JavaScript application. Importing the React components directly would require an application rewrite.
- Customer-specific conversation rows, document rows, task cards, query cards, Kanban, mail thread, import, secure upload, referral tree, and review inspector remain on their existing DOM and behavior. Their reusable surfaces consume the established tokens; their distinct compositions are left for page-level migration.

## Files changed

- `design-system-03.css` — shared visual recipes and component states.
- `design-system/src/tokens/tokens.css` — reference small/standard control heights.
- `styles.css` — existing Customer controls whose older declarations needed toolbar-height and selected-state alignment.
- `SHARED-COMPONENT-MIGRATION.md` — this record.

## Validation

- Vite production build passed. There is no TypeScript project or type-check script in this application.
- Ran the application through the Vite dev server and opened all documented local routes plus sidebar handoff hashes in Chrome: dashboard, inbox, tasks, six query categories, query detail, customers, customer detail, document vault, notifications, account, and handoffs. No page or console errors appeared, and each route showed a view.
- Tested Customer search, filter dropdown and Apply, category tabs, row action menu, Add customer modal; task list switch, filters, Add task modal; global search and notes overlay; inbox Add conversation modal. Interactions opened and state changed as expected without saving data.
- Checked desktop at `1440×900` and mobile at `390×844`; no document-level horizontal overflow. The mobile navigation opened successfully. Visually inspected screenshots of Customers, Tasks, Inbox, and mobile Customers.
- No HTML, JavaScript, route, API, or data file changed in this phase. Browser tests used fresh sessions and did not submit any create, edit, or delete action.

## Deviations and follow-up

- Reference components are React and are represented here by their token and CSS recipes rather than imported as runtime components.
- Customer-specific complex compositions have no exported reference equivalent. This phase only aligns their existing reusable surfaces; detailed screen migration remains a separate phase.
- No known build or console issue from this change. Existing handoff routes still show their current destination/placeholder behavior.
