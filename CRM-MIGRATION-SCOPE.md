# Phase 7 CRM migration scope

## Evidence and boundaries

Inventoried from `CUSTOMER-MODULE-SCOPE.md`, `COMPONENT-MAPPING.md`, and the active branch's `index.html`, `app.js`, and existing styles before application edits. Customer code defines routes, states, data and workflow. The local Packages, Booking, Vendor CRM and Finance implementation defines the visual language. CRM includes linked Tasks, Communication, Queries and Bookings context, but their Phase 4–6 interiors and separate module routes are outside this page migration.

## Routes, navigation and screens

| Entry | Local CRM screen or state |
| --- | --- |
| `#customers` | Customer directory and category tabs; search/filter/table/pagination/empty state |
| `#customer-CUST-…` | Customer detail, seven internal tabs; existing `CUST-` numeric IDs only |
| `#document-vault` | Global or customer-context document vault |
| `?document-request=…&customer-id=…&customer=…&document=…` | Public secure upload page; query-string entry hides the app shell |

Sidebar **Customers** and the Customer detail header/back/breadcrumb, list row links, vault links, and secure-upload preview/link are CRM navigation. **Vendors** and `#finance` are handoffs, not local CRM or Finance pages. No standalone Customer Groups, Traveller, Referral, Notes, Pipeline, or ledger route is implemented. Mobile sidebar/backdrop, browser history and customer deep links retain their existing shared-shell behavior.

## Customer directory and customer creation

- Header: Refresh busy state, Import, Document vault, Add customer.
- Search and icon-triggered filter popover: Tier, Group Type, outstanding balance, document expiring soon, Apply/Cancel; applied chips and clear actions.
- Category tabs: All, B2C, B2B, Sub-Agent, Other with counts.
- Customer data table: Customer identity/avatar/ID, Category, Tier, Location, Travellers, Total value, row action menu (Edit/Delete), row open, pagination, no-record/no-match/clear-filters state. Current implementation has no separate directory sort control, so none will be added.
- New customer dialog (`modalBackdrop`): identity/photo/code, primary traveller/contact, travel preferences with typeahead/suggestions/chips, category, group/tier/credit/note and additional details, acquisition/referral source, conditional person/channel fields, custom tier editor, validation, submit/cancel.
- Import dialog (`importModalBackdrop`): CSV sample download, CSV/XLS/XLSX browse/dropzone, chosen-file card/removal, 50 MB size check, disabled/enabled action, submit toast, close. The file picker advertises CSV/XLS/XLSX, but the submit handler does not parse or persist imported rows. The current code has no row-by-row import preview or network upload progress screen; these will not be invented during a visual migration.
- Edit customer dialog (`customerEditBackdrop`) and delete confirmation (`customerDeleteBackdrop`) are reached from row or detail actions. Preserve their fields, validation, confirmation and focus behavior.

## Customer detail: seven tabs and supporting actions

- Shared record header: avatar/photo, name, category, tier, code, location, customer-since metadata; Add query, Add booking, Edit customer, Delete customer actions. Tabs and counts: **Overview, Travellers, Documents, Pipeline, Finance, Tasks, Communication**. Tab state is internal to `#customer-CUST-…`.
- **Overview:** lifetime spend/trips/travellers/documents strip; Primary contact with Edit/Call/Email; Profile and Important dates cards with Edit; Task, Preferences, Referral Tree trio; recent activity. Contextual profile editor (`profileEditBackdrop`) changes its fields for contact/profile/dates/preferences and retains save/validation states.
- **Travellers:** expandable traveller list/accordion, Add traveller, linked document/trip/preference counts and primary designation. Traveller dialog (`travellerModalBackdrop`) has view/add/edit/delete modes, identity/contact/address, primary setting, preferences with search suggestions/chips, required fields and deletion state.
- **Documents:** readiness metric/ring, vault and Request documents actions, customer uploads waiting for review, request/link state, expandable traveller and document hierarchy, type/status/action rows and empty states.
- **Pipeline:** four metrics (Total queries, Proposals sent, Proposal value, Vouchers), Queries/Proposals/Vouchers subtabs, data sheets/status/money cells/row links, empty states. This is the customer-context Sales surface reviewed in Phase 6.
- **Finance:** booked/credited/debited/outstanding metrics, bank details and preferred-account/copy actions, empty bank state, Add/Edit bank dialog (`bankModalBackdrop`), payment history table and empty row, Full ledger handoff to `#finance`. Calculations and data remain unchanged.
- **Tasks:** customer-scoped search, filters/sort/date range, table/pagination, Add/Edit task dialogs and empty states. Reuse the completed Phase 5 Operations styling and behavior.
- **Communication:** customer email mailbox tabs/counts, collapsible sidebar, message list/reader/attachments, composer/templates/upload/discard/send and empty states. Reuse the completed Phase 4 Communication styling and behavior.

## Relationship and notes overlays

- Referral tree (`referralTreeBackdrop`): referrer selection/save, linked customer relationship cards/connectors, navigation and no-referrer/empty graph states. Preserve tree relationships and the existing controls.
- Customer/module notes (`customerNotesBackdrop`): context shortcut/count, All/Pinned/Mine filters, search, note list, pinned state, compose/edit/delete, related-record selector, create task from note, empty/no-match and confirmation states. Home Advance's inline note is a Workspace state and remains as previously migrated.

## Document vault and secure document workflow

- Vault route: customer/global context header and metrics; customer/traveller/document-name/type search; Tier, Category and Expiring soon filter popover/chips; Refresh busy state; Add file; expandable grouped customer/traveller/document rows with counts, statuses, document actions, pagination, no-result/Clear search state. It is an existing div-based hierarchy, not a table to replace.
- Add file (`fileModalBackdrop`): customer/traveller choice, type/name/expiry, file picker and validation/upload action.
- Request documents (`requestDocumentBackdrop`): traveller and document checkbox selection, message, generated link, Copy, preview upload page, Send link and status.
- Secure upload (`requestUploadBackdrop` and public query-string view): request context, type/name/file picker/dropzone, PDF/image preview, remove file, size/type validation error, submit for review, success/Under review state.
- Review (`documentReviewBackdrop`): image/PDF/fallback preview and Print; side inspector for traveller, type, name, expiry, reviewer note and metadata; Approve, Replace file, Delete with inline confirmation. The inspector is inside the modal, not a separate drawer.

## Reusable and CRM-specific components

Reuse established shell, buttons, icons, fields, themed selects/date controls, tabs, search/filter popovers/chips, status/tier badges, avatars, metric cards, sheets/tables, pagination, modals, toast, confirmation, focus/disabled/hover and empty-state primitives. Customer-specific compositions to adapt in place are the directory row recipe, onboarding/preference controls, traveller accordion and detail editor, referral tree, note overlay, Pipeline/Finance summary, bank card/history, document readiness/review queue, vault grouped hierarchy, import dropzone, public upload, and review inspector. No separate CRM component library or new route is needed.

## States and current implementation limits

Cover selected/active, hover/focus, disabled/validation, no-record/no-match, pending review, approved/expiring/missing document status, upload success/error, import selected/invalid file, confirmation, and desktop/tablet/mobile layouts. Refresh uses the existing temporary busy/`aria-busy` state. The app has no CRM network skeleton or standalone server error page; preserve implemented states instead of inventing a loading or error flow. Keep all current data relationships, filters, local persistence, calculations, status/action behavior, and external handoffs unchanged.
