# Phase 7 CRM UI migration

## Scope and sources

The discovery inventory is in `CRM-MIGRATION-SCOPE.md`. It was written before application edits after reviewing `CUSTOMER-MODULE-SCOPE.md`, `COMPONENT-MAPPING.md`, routes, markup, behavior, and styles. The Customer implementation remains the source of routes, data, interactions, and information hierarchy. The local Packages reference at `7c2009e4de3a7cbb117fa66c8bfe0564268ffbb7` supplied the existing design tokens and the visual patterns of its Vendor CRM record header and documents panel, Finance summary and tables, Packages detail tabs and accordion, and shared DataSheet, modal, and control styling.

## Routes, screens, and tabs migrated

| Route or entry | Visual coverage |
| --- | --- |
| `#customers` | Directory heading/actions, category tabs, search/filter/chips, customer table, row actions, pagination and empty state; new/edit/delete customer and import dialogs |
| `#customer-CUST-…` | Record header, actions, seven tabs and all CRM-local compositions below |
| `#document-vault` | Search/filter, grouped expandable customer/traveller/document hierarchy, status and actions, pagination and empty state; add-file dialog |
| `?document-request=…&customer-id=…&customer=…&document=…` | Public secure upload dialog, validation, preview and success state |

The seven detail tabs are **Overview, Travellers, Documents, Pipeline, Finance, Tasks, Communication**. Overview includes profile/contact/dates cards, preferences, referral preview, recent activity and notes shortcut. Travellers includes the accordion and add/view/edit form. Documents includes readiness, request state, review queue and expandable traveller/document rows. Pipeline includes Queries, Proposals and Vouchers subtabs, metrics and sheets. Finance includes bank cards/editor, payment history and ledger handoff. The Tasks and Communication tabs continue to use their Phase 5 and Phase 4 shared styles; this phase only makes their enclosing record and shared CRM surfaces consistent.

## Components reused and adapted

- Reused the Phase 1 token imports and Phase 2 shell, buttons, icons, fields, themed selects, tabs, table, pagination, menu, modal, badge and empty-state rules. No new token or parallel component system was added.
- Adapted the existing Customer directory table, record header, summary strip, overview cards, traveller accordion, notes overlay, Pipeline and Finance sheets, bank card, document readiness/review rows, vault grouped rows and document overlays in `design-system-03.css`.
- Kept the Customer-specific import/dropzone, referral tree, secure upload and review inspector implementations. Their colors, type, borders, radius, surface, focus and feedback now use the closest reference patterns. The tree, hierarchy, dropzones and inspector retain their existing layout and behavior because the reference has no direct exported equivalents.
- No JavaScript, markup, route, API, data or business logic was changed. No new component was created.

## Visual changes

Customer directory and vault headings/actions use reference heading and toolbar tokens. Table and hierarchy headers use the shared sheet header treatment; rows use existing neutral line/surface/hover roles. The Customer record uses the Vendor CRM record border and shape, reference title/monospace ID styling, shared metric strip, and flat card surfaces. Traveller, referral, notes, Pipeline, Finance and documents now use canonical typography, status colors, spacing, borders, radius and focus roles. Import, request, upload and review use the established form, feedback and overlay tokens. The responsive layouts and existing horizontal table handling remain intact.

## Preserved UX and functionality

Customer category/search/filter/pagination and row navigation; create/edit/delete dialogs; import file selection and toast; all seven detail tabs; profile/traveller/bank editors; notes and referral controls; Pipeline subtabs and linked records; Finance history and ledger handoff; document request generation, link preview, secure upload, review/approval/replacement/delete confirmation, vault filtering and expansion; browser shell navigation and responsive behavior. The migration does not alter customer records, query/task/document relationships, calculations or persistent state.

## Validation

- Production Vite build passed. No application TypeScript source or TypeScript errors were introduced; this app's entry is vanilla JavaScript.
- Playwright in Chrome loaded each of the four CRM route forms; all seven detail tabs were visible and selectable at 1440 × 900, 820 × 1000 and 390 × 844. No page overflow or browser console/page errors were observed on those route passes.
- Interaction checks passed for directory no-match/clear, category, filter, pagination, row menu/edit, import selected/removal/disabled state, new customer dialog, row navigation, record actions/profile editor, referral tree, notes search/composer, traveller accordion/form, Pipeline subtabs, bank form, document hierarchy, vault navigation/filter/empty/expansion/add-file, request generation, upload preview/error/success, pending review inspector, delete confirmation/cancel and approval.
- Import, referral and request dialogs were inspected at tablet and mobile widths with no dialog or page horizontal overflow and no console errors. The public upload route also displayed successfully at mobile width.
- These checks used isolated browser contexts and temporary files; no repository customer data file was changed.

## Existing limitations and deviations

- The directory has no sorting control. Import checks size and shows a success toast, but its current submit handler does not parse or persist imported rows. There is no import row preview or network upload progress. These are existing implementation limits, not changes from this phase.
- The CRM has no network skeleton or standalone server error page. Existing busy, empty, validation, toast and confirmation states were styled and tested where implemented.
- A fresh Customer deep link loads correctly. The existing `popstate` fallback does not infer a Customer detail view from a manually changed same-document `#customer-CUST-…` hash without history state; the app's own row/back navigation works. Routing was intentionally left unchanged.
- The import/dropzone, referral tree, secure upload, review inspector and expandable vault hierarchy have no exact exported reference component. They retain their Customer workflows and use the closest reference visual roles.

## Files in this phase

- `CRM-MIGRATION-SCOPE.md`: complete discovery inventory.
- `design-system-03.css`: scoped CRM visual rules using existing tokens.
- `CRM-MIGRATION.md`: migration and validation record.
