# Customer Module: complete UI migration scope

## Basis and boundaries

- **Functional source of truth:** this repository's `index.html` and `app.js` on `customer-module-mvp1`. `styles.css`, `design-system-03.css`, and `design-system/src/tokens/tokens.css` contain the current visual implementation.
- **Visual source of truth for the later migration:** the finalized Packages Module, including its Booking, Vendor CRM, and Finance UI. This document inventories Customer functionality; it does not change that functionality.
- **Supplementary evidence:** the attached 49-second recording, `Screen Recording 2026-09-29 at 4.33.25 PM.mov`, shows Home, Inbox, Tasks, Queries, Customers, the Normal/Advance switch, and selected creation dialogs. It is a sampled walkthrough, so screens absent from it are included when the code implements them.
- **Counting rule:** a hash or sidebar label is not treated as a full local page unless `setView` renders one. Customer Groups is a field/filter, proposals live within Query detail, and the full ledger is an All finances handoff. No standalone Quotes, Customer Groups, Finance, Vendors, or Bookings page is implemented here.

## 1. Route and navigation inventory

| Route / entry | Local screen or behavior | Notes |
| --- | --- | --- |
| `#dashboard` | Home dashboard | Default route; Normal and Advance layouts; returning/new workspace states. |
| `#inbox` | All inbox | Conversation list, filters, thread and compose states. |
| `#tasks` | All tasks | Kanban and list layouts. |
| `#trip`, `#flight`, `#accommodation`, `#visa`, `#cruise`, `#transport` | Queries | Six service tabs, each with the same board/list workspace and its own data. |
| `#query-QRY-…` | Query detail | Existing record IDs matching `QRY-[A-Z0-9-]+`; its six tabs and proposal builder are internal states. |
| `#customers` | Customers list | Search, category tabs, filters, table and actions. |
| `#customer-CUST-…` | Customer detail | Existing `CUST-` numeric IDs; seven tabs are internal states. |
| `#document-vault` | Document vault | Global or opened from a customer with customer context. |
| `#notifications` | Notifications page | Also available as a topbar popover. |
| `#account` | Account settings | Five internal settings sections. |
| `?document-request=…&customer-id=…&customer=…&document=…` | Public secure document upload state | Hides the app shell and presents the upload form/success state; it is a query-string entry, not a new hash route. |
| `#finance` | All finances handoff | Sidebar and Full ledger link select a destination/placeholder; there is no local Finance screen. |
| `#bookings` | Booking entry | Opens the local New booking dialog; there is no local Booking list/detail page. |
| `#destinations`, `#news`, `#packages`, `#vendors`, `#team`, `#automation`, `#reports` | Sidebar handoffs/placeholders | Display an outside-preview message rather than a local screen. |

**Persistent navigation and shell:** brand/Home, module notes shortcut and add-note action; Workspace: Home, All inbox, Destination, News, All tasks; Sales: Queries, Packages, Bookings; CRM: Customers, Vendors; Operations: All finances, Team, Automations, Reports, Settings (`#account`). Include sidebar active, collapsed, tooltip, mobile open/backdrop states; credits and Upgrade; topbar back and breadcrumbs; global search/keyboard shortcut; Help, notifications, account menu, and sign out actions. Browser back/history and customer/query deep links are part of the existing UX.

## 2. Feature-by-feature screen and workflow inventory

### Workspace: Home dashboard

- **Normal view:** four module cards for Active queries, Inbox, Bookings, and Tasks. Each has counts, summaries, meter, View all/Open action. New-workspace empty state has Add query.
- **Advance view:** KPI strip for at-risk bookings, payment due, queries needing action, booking value; Open queries table (Customer/trip, Status, Value, Action); Bookings table (Trip/window, Risk/payment, Amount, Action); Tasks, Follow-ups, and Notes lists; inline Save note form. Each data section has its own empty state.
- **Controls/workflows:** Normal/Advance toggle, Add customer, Add vendor, Add query, card and row navigation, note creation and note shortcut. No separate dashboard route for Advance.

### Communication: All inbox

- **List:** conversation search; All, Read, Unread, With attachments tabs; unread counts, customer/channel previews, no-match states.
- **Thread/detail:** initial Start a conversation empty illustration, WhatsApp and Email conversation renderings, message timestamps/attachments, selected and unread/read states, message input/send interactions.
- **Create flow:** Start conversation dialog with customer search/selection and disabled/enabled Start action; sent confirmation dialog with Back to inbox/View conversation. Customer Communication can open its conversation in All inbox.

### Operations: All tasks and follow-ups

- **Task workspace:** My Inbox, Team, Overdue, Completed, Follow-ups tabs; search; filter popover for Priority, Related entity, Assignee, Order, Due from/to; Kanban/list toggle.
- **Kanban:** Backlog, Open, In Progress, Blocked, Done, Cancelled columns; task cards, empty columns, add-per-column controls and status movement. **List:** status tabs, table (Task name, Priority, Related entity, Due, Activity, Action), pagination, result and empty states.
- **Task detail/create/edit:** Task details dialog with Edit, Mark completed (disabled when already done), and inline delete confirmation. Shared Add/Edit task form covers ID, title, description, status, priority, multi-assignee picker, due date/time; reused for global, customer-scoped and query-scoped tasks.
- **Customer/query task views:** each has its own search, the same filter dimensions, table (Task name, Priority, Related entity, Assignee, Due, Action), pagination, Add task and empty result state. Task relationships and the Follow-ups tab remain functional behavior, not new routes.

### Sales: Queries and proposals

- **Query workspace:** service tabs Trip, Flight, Accommodation, Visa, Cruise, Transport; search; filter popover (Mine/All, Priority, Pending on, Customer tier); Refresh; Kanban/list switch. Kanban and list statuses: Unassigned, New, Quoting, Negotiation, Won, Lost. Board cards, per-column empty/add states and status movement; list table (service name, Priority, Pending on, value, Activity, Action), status tabs, pagination and no-query state.
- **Create/edit query:** query-type selector dialog followed by shared Query form. It includes customer choice and inline Create customer, service details, group size/child ages, assignment/multi-assignee, priority/follow-up and notes, Save as draft/submit. Type-specific fields: Trip (domestic/international, departure, destination, dates, cities/days and vehicles); Flight (journey type, route/dates, cabin and airline); Accommodation (destination, stay type/dates, preferred property, meal plan, star ratings); Visa (destination, visa type, travel date, speed, passport status, nationality); Cruise (region, line, ports, dates, cabin and cabins); Transport (route/dates, optional stops and vehicles).
- **Query detail:** header with status select, Build proposal, favorite and more-actions menu (View customer, Add task, Mark as lost, Edit query, Delete customer). Tabs: **Overview** (position/commercial details, customer context, task summary and activity timeline), **Proposals**, **Travellers** (linked traveller table), **Documents** (linked document list/vault action), **Tasks** (scoped table/form), **Communication** (linked email workspace). Unavailable-query and per-tab empty states.
- **Proposal list/create:** proposal table/statuses and no-proposal state. Trip proposals can start from a package, saved itinerary or scratch; searchable catalog cards/selection; proposal title and Simple/Advanced mode. Other service types use the existing direct draft creation path.
- **Trip itinerary builder:** stepper for Build itinerary, Proposal content, Costing, Preview; Simple/Advanced switch. Route and day accordion editors; add/remove days and activities; editable Accommodation, Transportation and Flights tables with add/remove rows. Content form for title, prepared for, booking from, introduction, inclusions, exclusions and notes. Cost tabs All/Accommodation/Activities/Transportation/Flights, editable unit costs, margin and price summary. Preview contains customer-facing day plan, stay/commercial details, review checklist, Publish/Publish changes and Share in Communication. All builder states are within Query detail, not extra routes.

### CRM: Customers list, profiles and relationships

- **Customers list:** search; All, B2C, B2B, Sub-Agent, Other tabs; Tier, Group Type, outstanding-balance and document-expiry filters with applied chips; Refresh, Import, Document vault and Add customer. Table: Customer, Category, Tier, Location, Travellers, Total value, Action; row open and Edit/Delete menu; pagination; no-record/no-match state and Clear filters.
- **New customer flow:** multi-section dialog for basic identity/photo/code, primary traveller/contact, travel preferences, category, additional details (including group, tier, credit/note), and acquisition/referral source. Custom tier editor and preference typeahead/chips are nested controls.
- **Import flow:** CSV sample download, CSV/XLS/XLSX browse/dropzone, selected-file/removal state and validation/import action. Existing matching/row-limit behavior must be preserved.
- **Customer detail header:** identity, category/tier/code/location/since, Add query, Add booking, Edit customer and Delete customer actions. Edit customer form and deletion confirmation are separate dialogs.
- **Overview tab:** lifetime spend/trips/travellers/documents metrics; Primary contact (Edit, Call, Email), Profile (Edit), Important dates (Edit), Task/Preferences/Referral Tree trio, recent activity. Profile editor changes its fields for contact, profile, dates and preferences. Referral tree dialog has referrer selection/save and relationship tree/empty state.
- **Travellers tab:** traveller accordion/list, Add traveller, profile/detail modal in view/edit/add modes, primary designation, identity/contact/address, traveller preferences with search suggestions/chips, document/trip/preference counts and Delete traveller.
- **Documents tab:** readiness summary and Open document vault/Request documents actions; customer uploads awaiting review; generated request/link state; expandable traveller/document hierarchy and document status/actions. Document workflows are detailed below.
- **Pipeline tab:** Total queries, Proposals sent, Proposal value and Vouchers metrics; Queries, Proposals, Vouchers sub-tabs and their tables/empty states. This is a customer-scoped view of existing sales records.
- **Finance tab:** booking value/credited/debited/outstanding metrics; bank-details card/grid, preferred-account/copy actions and empty state; Add/Edit bank account dialog; Payment history table (Date, Description, Amount, Debit/Credit, Total outstanding) and empty row; Full ledger goes to the All finances handoff.
- **Tasks tab:** customer-scoped task search/filter/table/pagination and shared task dialogs, as above.
- **Communication tab:** customer email workspace: All mail/Inbox/Sent tabs and counts, collapsible mailbox sidebar, list, reader with attachments, empty mailbox states, composer (To, Subject, Message, upload attachments, Documents/Acceptance/Letter templates, Discard, Send).
- **Notes:** module/customer contextual note shortcut and overlay, list/search, compose/edit/delete, related-record selection, and create task from a note. Home Advance also has an inline note form.

### CRM: Document vault and secure document workflow

- **Document vault:** standalone/global and customer-context entry; search by customer/traveller/document name/type; Tier, Category and Expiring soon filters with applied chips; Refresh and Add file. Expandable grouped customer/traveller document rows with counts/status/actions, pagination and clear-search empty state. The list is a custom div grid, not an HTML table.
- **Add file dialog:** customer/traveller, document type/name, expiry and file selection/upload controls.
- **Request documents dialog:** traveller and requested document checkboxes, message, generated customer link, Copy, Preview upload page and Send link states.
- **Secure upload:** modal preview and public query-string entry; requested type/name/file picker, image/PDF preview, remove file, validation error, submit-for-review and success/Under review states.
- **Review document dialog:** image/PDF/fallback preview and Print; side inspector for traveller, type, name, expiry, reviewer note and metadata; Approve, Replace file, Delete with inline confirmation. The side inspector is part of this dialog, not a separate drawer.

### Workspace support: Notifications and account

- **Notifications:** topbar center with Unread/All tabs, mark-all-read, View all and preferences action; `#notifications` list with Show unread and mark-all-read, plus no-unread state. Notification rows have unread/seen states.
- **Account:** account menu and `#account` page; My profile (photo/name/email/phone form), Security and sign-in, Devices and sessions, Personal preferences (language/time zone), Workspace role and memberships. Preserve the current behavior of controls that presently show placeholder feedback or static information.

### Other local entry dialogs

- **New vendor:** vendor dialog reached from Home; fields for vendor identity, service, city and contact. There is no local Vendor list page.
- **New booking:** booking dialog reached from customer or Bookings navigation; booking details, travel/pricing and operations setup sections. There is no local Booking list/detail page.

## 3. Exhaustive overlay/form register

| Existing surface (`index.html` ID) | Purpose / form or state |
| --- | --- |
| `globalSearchBackdrop` | Search dialog, quick/recent results, keyboard navigation. |
| `notificationCenterBackdrop` | Notification popover/tabs. |
| `accountMenuBackdrop` | Account menu. |
| `taskDetailsBackdrop` | Task detail and delete confirmation. |
| `taskModalBackdrop` | Add/Edit task form. |
| `referralTreeBackdrop` | Referral graph and referrer editor. |
| `modalBackdrop` | New customer form. |
| `vendorModalBackdrop` | New vendor form. |
| `queryTypeModalBackdrop` | Choose query service. |
| `queryModalBackdrop` | New/Edit query form, including inline customer. |
| `bookingModalBackdrop` | New booking form. |
| `fileModalBackdrop` | Add document form. |
| `customerEditBackdrop` | Edit customer form. |
| `profileEditBackdrop` | Section-specific profile editor. |
| `queryPositionBackdrop` | Edit query commercial/current position. |
| `bankModalBackdrop` | Add/Edit bank account form. |
| `customerDeleteBackdrop` | Customer deletion confirmation. |
| `customerNotesBackdrop` | Note list, search, compose/edit and related record controls. |
| `travellerModalBackdrop` | Traveller view/add/edit/delete form. |
| `requestDocumentBackdrop` | Document request and generated link. |
| `requestUploadBackdrop` | Secure customer upload, validation and success. |
| `documentReviewBackdrop` | Review, preview, approve, replace, print, delete. |
| `importModalBackdrop` | Customer file import form. |
| `inboxCreateBackdrop` | Customer picker for new conversation. |
| `inboxSentBackdrop` | Sent-message confirmation. |

The app also uses inline popovers/menus for filters, customer/query row actions, assignees, preferences, email templates, themed selects/calendars, and account/notification controls. The mobile navigation has a backdrop and behaves as a sidebar drawer. No independent business form drawer is implemented.

## 4. Reusable components and visual migration candidates

| Existing reusable pattern | Where it is reused | Visual migration scope |
| --- | --- | --- |
| Shell sidebar/topbar, breadcrumbs, icon buttons, global search | All local routes | Shared typography, sizing, active/hover, responsive and overlay treatment. |
| Primary/secondary/tertiary/danger buttons; small/icon variants | Pages, dialogs, builders | All action and disabled/loading/hover states. |
| Field labels, text/search inputs, textareas, checkbox/radio, native/themed select, country/date/month pickers | Customer, query, task, document, account and booking forms | Consistent height, spacing, border, focus, validation and suggestion menus. |
| Tabs, segmented toggles, status/category/tier badges, avatars | Lists, details, dashboard, builders | Active, count, selected and status color rules. |
| Search plus filter popover, option listbox, chips | Customers, vault, queries, tasks | Shared positioning, applied state, clear/apply actions. |
| Table shell, row menu, pagination | Customer, query, task, pipeline, finance and dashboard | Header/row density, alignment, hover and action treatment; preserve columns. |
| Metric and section cards; empty-state block | Dashboard and detail pages | Surface, spacing, hierarchy and illustration treatment. |
| Modal/backdrop/header/body/footer, confirm actions | Overlay register above | Shared dialog sizing, radius, shade, focus and responsive behavior. |
| Task modal/detail; customer/query scoped task filter/table | Three task contexts | Reuse the existing behavior and markup family; avoid new duplicate task components. |
| Customer/query email workspace | Two detail views | Align common mailbox/list/reader/composer presentation. |
| Toast, refresh busy indicator, inline error, empty/result states | Multiple routes | Apply finalized visual states without changing their triggers. |

**Custom UI that needs its own visual pass:** dashboard Normal cards and Advance grids; WhatsApp/Email inbox thread; both Kanban boards and draggable cards; Trip proposal catalog/stepper/route/day editor/service grids/cost sheet/preview; traveller hierarchy and preference editor; document readiness and grouped vault rows; secure upload dropzone/public view; review preview with side inspector; referral tree; note overlay; customer mail composer; import dropzone; bank details and payment history. These should retain their current structure and workflows while adopting the reference design language.

## 5. State inventory and migration guardrails

- **Empty/no-match:** dashboard new workspace and section empties; inbox initial/thread/list/customer-picker empties; query board/list/detail/proposal/catalog/document/task empties; task board/list/customer/query result empties; customer list/overview/preferences/referrals/pipeline/finance/mail empties; vault and notification empties. Include both no-data and filtered-no-match copy/actions.
- **Loading/busy:** the implemented refresh buttons use a temporary `is-refreshing` and `aria-busy` state. There is no shared skeleton page loader in this code; do not add one merely to fill a checklist item.
- **Error/validation:** browser form validation and disabled-submit states across dialogs; secure upload file-size/type error (`requestUploadError`); no-match suggestion/search results; unavailable Query/proposal detail states. Preserve exact conditions and recovery actions.
- **Hover/active/focus:** sidebar current/collapsed/mobile states; tabs and segmented toggles; selected customer/query/status rows/cards; Kanban drag/status states; menus, popovers and editable controls; modal focus return and keyboard/escape behavior.
- **Scope protection:** retain all hashes, deep links, history state, tabs, table columns, board statuses, forms, fields, data relationships, local persistence, filters, CRUD actions, confirmations, communication flows, and external handoffs. The visual migration must not turn placeholder destinations into invented local pages or change Customer's information architecture/business logic.

## Code anchors used for this inventory

- `index.html`: shell/navigation and every static view/form/overlay; `app.js`: `viewHash`, `setView`, initial hash/query-string handling, renderers and event handlers.
- Main renderer families in `app.js`: `renderDashboardHome`, `renderInbox*`, `renderTask*`, `renderQueryModule`, `renderQueryDetail`, `queryItineraryMarkup`, `renderCustomers`, `renderCustomerDetail`, `renderCustomerPipeline`, `renderCustomerFinance`, `renderCustomerMailWorkspace`, `renderVault`, `renderCustomerNotes`, and `renderShellNotifications`.
- `DESIGN-MIGRATION-AUDIT.md` is the earlier visual audit; this inventory expands its page examples to the actual code scope. No application code was changed for this document.
