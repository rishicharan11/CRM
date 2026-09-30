# Finalized module parity

30 September 2026

The Customer module was compared with the locally finalized `../pakages-module` application, including its Packages, Booking, Vendor CRM and Finance screens. Shared layouts, controls and interactions now follow those reference patterns while retaining Customer-specific content and workflows.

## Reference used

- Local reference revision: `7c2009e4de3a7cbb117fa66c8bfe0564268ffbb7`.
- Shared components and tokens: the reference's installed `@paryatech/ui`, especially its workspace shell, data sheets, tabs, buttons, filters, pagination, avatars and menus.
- Rendered comparisons: integrated Packages and Booking lists; Vendor CRM list, record and communication patterns; Finance section and KPI patterns.
- Both local token files now match the installed reference source exactly. The reference application has no source changes from this work.

## Changes by area

| Area | Alignment made |
| --- | --- |
| Shared shell | Reference navigation glyphs, stroke and icon sizes; global-search width; breadcrumb and module-notes labels; collapse chevrons; credit meter geometry and 72% fill. |
| Customer directory | Full-width search with a separate Filters control, reference title/tab spacing, 64px rows and 40px table header, selection column, continuous column rules, vertical row menus, six records per page and a footer that stays inside the workspace. |
| Queries | Shared list layout by default, full-width toolbar, category and status tabs, All statuses option, consistent row menus, list/Kanban preference remembered between visits. |
| All tasks | Matching list layout and toolbar, All statuses option, shared task menus, visible disabled pagination states, list/Kanban preference remembered between visits. |
| Customer and Query records | Tighter header-to-tab spacing, consistent person avatars, task tabs with the same selection/menu/table/footer behavior as the main lists, open communication sections with independently scrolling content. |
| All inbox | Panes fill the workspace. Desktop retains conversation list and reader; phones show the list or the selected conversation, with a Back to conversations control. |
| Home | Reference card and KPI typography, button sizing, semantic warning/danger/success colors and sentence-case status labels in the Advanced dashboard. |
| Forms and navigation | Consistent dialog surfaces, header typography and action casing; contained modal keyboard focus; tab and row-menu keyboard navigation; reduced-motion support. |

## Interaction details

- Selecting a checkbox does not navigate into the record.
- Select-all applies to the visible page and shows a mixed state when appropriate.
- Selection survives paging and filtering. Clear selection resets it explicitly.
- Export selected downloads CSV content for selected records across pages, including records that are no longer visible.
- Query menus offer View query, Edit query and Add task. Task menus offer View task, Edit task, Mark completed and Delete task; deletion retains the existing confirmation.
- Existing customer creation/editing, traveller/document, pipeline, finance, proposal, task, notes and communication workflows remain connected to their original handlers.
- Query icons and inbox illustrations use bundled asset URLs so they also work in the production build.

## Implementation

`reference-parity.css` is loaded after the existing design-system CSS and adapts the finalized reference specifications to this vanilla JavaScript application. `workspace-parity.js` centralizes list selection/export, saved layout preferences, shared row menus and keyboard behavior. `app.js` and `index.html` connect those patterns to existing records and controls.

The application continues to use its existing demo data and local state. This work aligns the prototype's interface and interaction behavior; it does not introduce a backend integration.

## Validation and review

**Result:** Production build and the complete production UI verification passed. The run generated 75 screenshots, with no captured runtime errors or missing local resources.

The repeatable UI check is `scripts/verify-ui.mjs`. It covers:

- Customer creation, editing dialog, search, category and tier filters, empty-state recovery, paging, selection, mixed selection state and CSV export across pages.
- Every Customer record tab and every Query record tab, including contextual task creation, selection and menus.
- Query editing, task editing/completion, All statuses pagination and saved list/Kanban preferences.
- Inbox conversations and mobile return navigation; normal/Advanced Home views; global search, notes, collapsed sidebar and mobile navigation drawer.
- Keyboard focus in dialogs and menus, including query tabs that re-render when changed.
- Main pages at 1920, 1440, 1280, 768 and 390 pixels; Customer and Query record tabs and communication composers at tablet and phone sizes.
- Table column widths, viewport-contained pagination, reachable compose controls, document overflow, runtime errors and missing local resources.

Development screenshots are in [`artifacts/design-parity`](artifacts/design-parity). Production-build screenshots are in [`artifacts/design-parity-production`](artifacts/design-parity-production). Some screenshots contain temporary QA records created within the isolated test browser.

Useful review images:

- [Customer directory](artifacts/design-parity-production/customers-desktop.png)
- [Queries](artifacts/design-parity-production/queries-desktop.png)
- [All tasks](artifacts/design-parity-production/tasks-desktop.png)
- [All inbox](artifacts/design-parity-production/inbox-desktop.png)
- [Home](artifacts/design-parity-production/home-desktop.png)
- [Customer communication on phone](artifacts/design-parity-production/customer-communication-390.png)
- [Inbox conversation on phone](artifacts/design-parity-production/inbox-conversation-mobile.png)

## Run locally

Use Node.js 22 (or a compatible version supported by Vite 7):

```sh
npm install
npm run dev -- --host 127.0.0.1 --port 5175
npm run build
npm run preview -- --host 127.0.0.1 --port 5176
```

With Chrome installed on macOS, run UI verification against the preview:

```sh
PREVIEW_URL=http://127.0.0.1:5176 QA_OUTPUT=artifacts/design-parity-production BROWSER_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run verify:ui
```

Alternatively, install Playwright Chromium with `npx playwright install chromium`, then omit `BROWSER_EXECUTABLE`. The default verification URL is `http://127.0.0.1:5175`.
