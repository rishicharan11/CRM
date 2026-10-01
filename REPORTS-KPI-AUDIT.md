# Reports: application tracking audit and implementation

Implemented in customer-module-mvp1 after inspecting both module folders. The finalized pakages-module is the visual and behavioral reference. Reports is available at #reports under Operations.

## Coverage

71 available indicators across 13 reporting areas, plus 6 explicitly unmeasured indicators. Figures come from records and definitions, rather than the Home page's independent hardcoded dashboard totals.

| Area | Records and fields inspected | Source |
| --- | --- | --- |
| Customers | Category, tier, location, travellers, lifetime booking value, ledger outstanding, customer creation where recorded | app.js: customers, customerFinanceSummary |
| Queries | Service type, stage, owner, priority, pending-on party, customer link, expected value, relative activity label | app.js: queryModuleRecords, query-sample-requirements.js |
| Customer proposals | Issued date, validity, status, value, linked query, persisted service proposals | app.js: customerProposalRecords; service-proposals.js |
| Catalogue proposals | Status, face value, customer, update date, travel labels | pakages-module/src/App.tsx |
| Bookings | Unique booking ID, stage, risk state, queue, travel label, next action, finance state | pakages-module/booking-module/booking-redesign.html |
| Tasks | Creation, due date, assignee, status, priority, follow-up, related entity / value | app.js: taskRecords and task update handlers |
| Inbox | Channel, message direction, unread flags, latest-message direction, customer link | app.js: inboxConversations |
| Documents | Traveller, type, expiry, state, uploads, request creation, sent / received / approval flow | app.js: vaultDocumentRecords, documentRequests, uploadedRequestDocuments |
| Vouchers | Issued service references, state, type, service date | app.js: customerVoucherRecords |
| Packages | Publication state, last update, destination, region, starting price | pakages-module/src/App.tsx |
| Vendor CRM | Vendor state, categories, owner, location, services, supplier relationships, rate-card publication / validity, compliance owner / expiry, vendor tasks | pakages-module/vendor-crm/src/data |
| Agency finance | Obligations and applied settlements; transaction occurrence / direction / verification / allocations; expenses and incurred date; accounts; statement difference and unmatched credit; advances; refunds; booking margin; forecast; event audit trail | pakages-module/finance-module/src/financeModel.ts |
| Customer ledger | Dated receipts / refunds, account balance, booking value, reference | app.js: customerFinanceEntries, customerFinanceSummary |
| Home / shell | Sample summary cards, notes, notifications, module links | app.js and index.html; operational links are reused without treating sample dashboard totals as ledger facts |

## Date and accounting rules

- Inclusive local calendar dates. Today, Yesterday, Last 7 days, previous Monday–Sunday week, Last 30 days, This month, Last month, Year to date and Custom dates. Equal From / To dates produce a single-day report. Invalid or reversed dates do not apply.
- Comparisons use the preceding period of equal length. A zero baseline is labelled without inventing a percentage growth rate.
- Period indicators use their explicit creation, issue, due, occurrence, incurred or last-update date. Last-updated counts represent current records last updated in the period, rather than an edit-event total.
- Snapshot indicators keep their source date and do not become historical balances when report dates change. Customer records reflect current application state. Agency Finance's supplied snapshot is 26 September 2026.
- Relative labels and yearless booking dates are excluded from period activity. Month-only document expiry supports a past-month expired check, but does not imply an exact expiry day in the 30-day window.
- Reference finance amounts are integer paise and are converted to INR exactly once. CRM ledger values already use rupees.
- CRM and Agency Finance have separate sample scopes. Their balances and receipts are never summed. Synthetic fallback CRM payments used to display a legacy balance are excluded from dated receipt reports.
- Pending receipt proof is recorded activity but does not settle an obligation until verified and applied. Internal transfers do not enter receipts, outgoing or net movement. Incurred expenses, commitments and payments remain separate measures.
- Unmatched bank credit and closing statement difference are separate controls. A party-owned advance does not reduce another party's receivable. Approved refunds due are separate from paid refunds.
- Projected margin applies to BK-2026-000003 only. Net cash movement and catalogue starting prices are not agency profit or recognized revenue.

## KPI definitions

### Customers

Source: Customer workspace.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Customers | Snapshot | All customer records in this workspace. Creation timestamps are not available for every seed record. |
| Travellers | Snapshot | Traveller counts on current customer records. |
| Lifetime booked value | Snapshot | Customer CRM lifetime values. Not recognized revenue and not combined with Agency finance. |
| CRM outstanding | Snapshot | Sum of the same current customer-ledger balances shown on Customer Finance tabs. |

### Queries

Source: Customer workspace.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Open queries | Snapshot | All query stages except Won and Lost. |
| Open pipeline value | Snapshot | Expected value of open queries; not receipts or booked revenue. |
| Unassigned queries | Snapshot | Queries with no assigned owner. |
| Won queries | Snapshot | Current Won stage; not wins occurring within the selected report dates. |
| Lost queries | Snapshot | Current Lost stage; not losses occurring within the selected report dates. |
| Closed-query win rate | Snapshot | Won ÷ (Won + Lost). Current stage distribution; no historical conversion cohort is implied. |

### Proposals

Source: Customer workspace.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Proposals issued | Selected period · Issued / sent date | Customer proposals with an issued date inside the selected inclusive period. |
| Issued proposal value | Selected period · Issued / sent date | Face value of proposals issued in the period; not revenue. |
| Accepted in issued cohort | Selected period · Issued / sent date | Current accepted status of proposals issued in this period. Acceptance timestamps are not stored. |
| Expired open proposals | Snapshot | Still-open customer proposals whose validity ended before today. |

### Catalogue proposals

Source: Finalized module sample.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Catalogue proposals | Snapshot | Proposal records in the finalized Packages module, separate from Customer proposals. |
| Catalogue proposals updated | Selected period · Last-updated date | Current catalogue proposal records with a last update in this period; not proposal issue dates. |
| Accepted catalogue proposals | Snapshot | Current accepted proposals in the finalized catalogue sample. |

### Bookings

Source: Finalized module sample.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Bookings | Snapshot | Unique booking records from the Booking module, not supplier booking views added together. |
| At-risk bookings | Snapshot | Booking records explicitly marked At risk. |
| Upcoming bookings | Snapshot | Current upcoming stage as stored in the reference sample. Travel labels do not contain a complete year. |
| Unassigned bookings | Snapshot | Booking records in the Unassigned ownership queue. |
| Travelling now | Snapshot | Current booking stage in the reference register, not a period transition count. |
| Completed bookings | Snapshot | Current booking stage in the reference register, not a period transition count. |
| Cancelled bookings | Snapshot | Current booking stage in the reference register, not a period transition count. |

### Tasks & follow-ups

Source: Customer workspace.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Open tasks | Snapshot | Tasks currently active, including Backlog, Open, InProgress and Blocked; excludes Done and Cancelled. |
| Completed tasks | Snapshot | Current Done status. Completion dates are not stored. |
| Unassigned tasks | Snapshot | Currently active tasks with no assigned owner. |
| Tasks created | Selected period · Creation timestamp | All task records created during the selected period, across the team. |
| Tasks due in period | Selected period · Due date | Tasks still open whose due date falls inside this period. |
| Overdue tasks | Snapshot | Currently active tasks due before today, excluding Done and Cancelled. |
| Blocked tasks | Snapshot | Tasks in the current Blocked state. |
| Open follow-ups | Snapshot | Active tasks marked as a follow-up. |

### Inbox

Source: Customer workspace.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Unread conversations | Snapshot | Conversations containing at least one incoming unread message. |
| Unread messages | Snapshot | Incoming messages not yet marked read. |
| Awaiting our reply | Snapshot | Conversations where the latest message is incoming. No response-time SLA is inferred. |

### Documents

Source: Customer workspace.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Customer documents | Snapshot | Documents from the customer vault and uploaded request documents. |
| Expired documents | Snapshot | Known expiry date before today, a past expiry month, or an explicit Expired state. |
| Expiring in 30 days | Snapshot | Known complete expiry date from today through the next 30 days, inclusive. Month-only expiry labels are excluded from this dated window. |
| Documents to review | Snapshot | Documents with a review, approval or pending state. |
| Awaiting document upload | Snapshot | Sent document requests still awaiting upload. Received files awaiting approval are counted in Documents to review. |
| Document requests created | Selected period · Request creation timestamp | Document requests with a creation timestamp inside this period, whether sent or received. |

### Vouchers

Source: Customer workspace.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Service vouchers in period | Selected period · Service date | Issued service vouchers whose service date falls in the selected period. Not new booking counts. |
| Confirmed service vouchers | Snapshot | Currently confirmed flight, stay, activity and attraction references. |

### Packages

Source: Finalized module sample.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Published packages | Snapshot | Published records in the finalized package catalogue. Starting prices are not sales. |
| Draft packages | Snapshot | Draft records awaiting publication. |
| Packages updated | Selected period · Last-updated date | Packages whose most recent recorded update falls in this period. Not a count of every edit. |

### Vendor CRM

Source: Finalized module sample.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Active vendors | Snapshot | Active supplier records in the reference Vendor CRM catalogue. |
| Supplier services | Snapshot | Service directory entries, counted once per service ID. |
| Published rate cards | Snapshot | Published rate-card records; validity ranges are shown in the source details. |
| Compliance follow-ups | Snapshot | Supplier documents expired, approaching expiry, or awaiting signature / evidence. |
| Open vendor tasks | Snapshot | Open tasks from the Vendor CRM sample, kept separate from the Customer task register. Relative due labels cannot support dated counts. |

### Agency finance

Source: Finance sample · 26 Sept 2026.

| Indicator | Basis | Definition |
| --- | --- | --- |
| Recorded receipts | Selected period · Money occurrence date | Recorded incoming payments, including pending verification. Advances are included once; internal transfers are excluded. |
| Verified receipts | Selected period · Money occurrence date | Only recorded receipts whose current verification status is Verified. This is not a verification-event date report. |
| Recorded outgoing | Selected period · Money occurrence date | Supplier / agency payments and recorded refunds. Internal transfers are excluded. |
| Net recorded movement | Selected period · Money occurrence date | Recorded incoming less outgoing cash movements, excluding transfers. Not profit. |
| Expenses incurred | Selected period · Expense incurred date | Expense records counted once when incurred, separately from cash payments. Includes approved unpaid reimbursements. |
| Agency receivables | Snapshot | Customer obligations less verified applied receipts, at the Finance source snapshot. Pending proof does not settle debt. |
| Outgoing obligations | Snapshot | Supplier balances plus approved unpaid reimbursements. Supplier bills do not add a second commitment. |
| Recorded bank & cash | Snapshot | Recorded account balances at the Finance snapshot; not reconstructed historical bank balances. |
| Receipts awaiting verification | Snapshot | Existing receipt proof pending verification. These amounts remain in receivables until applied. |
| Bank statement difference | Snapshot | Statement closing balance less the recorded HDFC balance. Unmatched credits are a separate reconciliation item. |
| Unallocated customer advance | Snapshot | Party-owned advance not applied to an invoice. Not subtracted from another customer’s receivable. |
| Approved refund due | Snapshot | Approved refund still due, distinct from a recorded paid refund and supplier recovery. |
| Projected booking margin | Snapshot | Accepted sell price less confirmed supplier commitments for BK-2026-000003 only. Not agency-wide realized profit. |
| Forecast closing cash | Snapshot | Reference forecast starting from recorded bank and cash, plus scheduled movements. Forecast is not actual cash received. |
| Forecast minimum cash | Snapshot | Minimum running cash in the same reference forecast schedule. |
| Finance audit events | Selected period · Event occurrence timestamp | Recorded activity events that occurred in the selected period. Audit events do not create additional money movements. |
| Unmatched statement credit | Snapshot | Unmatched bank credit still awaiting reconciliation, separate from the closing statement difference and recorded receipts. |
| Supplier bills missing | Snapshot | Confirmed supplier commitments whose bill has not been received; cost is already represented in the obligation. |

### Customer ledger

Source: Customer workspace.

| Indicator | Basis | Definition |
| --- | --- | --- |
| CRM receipts | Selected period · CRM ledger date | Dated receipts recorded in Customer ledgers. Separate sample scope from Agency finance; never added to its receipts. |
| CRM refunds | Selected period · CRM ledger date | Dated Customer ledger credits presented as refunds, matching the existing CRM ledger. |

## Awaiting data

- **New customers by day:** A complete creation date is not recorded for every customer.
- **Query conversion over time:** Query creation and Won/Lost transition timestamps are not recorded.
- **Response-time SLA:** Full message timestamps and a configured SLA are required.
- **Tasks completed in period:** Completion timestamps are not stored; current Done status is available.
- **Agency-wide realized profit:** A reconciled revenue-recognition and cost ledger is required.
- **Historical balances by report date:** Historical settlements and account snapshots are required.

## User flow and document templates

1. Open Operations → Reports; choose a preset or custom inclusive range and optionally compare the previous period.
2. Review activity, workspace health, the sales pipeline, recorded cash chart and attention queues. Use Sales & customers, Operations or Finance for the full area.
3. Select a KPI to see its definition, source and supporting records. Open Customer, Query, Task, Inbox or Document records through existing application navigation. Reference records show their details locally. Related registers expose obligations, forecasts, supplier services, rate cards, compliance, vendor tasks and document requests.
4. Search the KPI directory or filter it by module. View report basis for the exact source / date distinctions.
5. Choose Company template / Download report. Executive overview contains KPIs and priority actions; Operations review adds operational record registers; Finance report adds movements, obligations and forecast schedules.
6. Set company name, logo, brand colour, prepared-by, contact details and footer; select sections and optional KPI definitions. Save template persists these choices in this browser. Date presets and custom ranges persist separately.
7. Preview or download a branded, selectable-text A4 PDF; export the KPI values and definitions as UTF-8 CSV; or use Print for the selected company template. Detailed registers use contextual columns, including task owners / due dates and booking next actions.

Public Sans is embedded for reliable ₹ rendering. The bundled font license is assets/report-fonts/OFL.txt. Logos stay local to the browser; uploaded PNG/JPG/WebP logos are normalized and limited to 2 MB.

## Charts design reference

The Reports dashboard follows the supplied [Paryatech Charts reference](https://paryatech-studio.vimaksh.workers.dev/explorer/components/Charts): compact KPI strips, sparklines for dated activity, one chart per card, a wide main column and a smaller rail. The exact chart palette is teal / amber / blue / pink / green / violet / orange / cyan, with neutral Other and a separate light-to-dark teal ordinal scale. Status colours remain separate from series colours.

- Area chart: recorded receipts and outgoing by inclusive date bucket. Legend controls can hide a series; at least one remains visible. No dual axis or invented revenue / profit figures.
- Bar chart: current query counts by stage, on one integer count axis.
- Donut: current customer category counts and their share of one total. Category colours retain their fixed order.
- Collections ageing: remaining customer obligations, aged at the Finance source date of 26 September 2026. Not-due and overdue buckets sum to Agency receivables; choosing another period does not re-age a source snapshot.
- Sparklines: receipt / outgoing amounts and task creation / proposal issue counts using the same dated buckets as the report. Snapshot KPIs have no fabricated historical trend.

Hover or keyboard focus reveals exact values. Arrow keys move between chart marks; Escape dismisses the tooltip. Each card also exposes its exact data in a table. SVG charts resize with their cards, and the columns stack on smaller screens. The plain JavaScript application uses local closed chart components in reports-charts.js; no third-party chart options, chart styling overrides in product code or remote runtime dependencies are required.

## Data synchronization and local use

Run npm install, then npm run dev. The predev and prebuild steps synchronize service catalogues and report reference fixtures. scripts/sync-report-data.mjs reads the sibling pakages-module without modifying it and writes data/report-reference.json. When the sibling folder is absent, the bundled reference snapshot is used.

The Customer portion uses the current records in app.js and its existing persistence behavior. The finalized module portion uses synchronized source fixtures, **not a live backend or cross-origin browser state connection**. Refresh rereads the Customer workspace and the bundled source snapshot. It does not fetch a production database or import edits made in another application's separate browser session.

## Verification

- npm run build: production bundle, local font / logo assets and reference synchronization.
- npm run verify:reports: real record arithmetic, inclusive boundaries, leap years, previous-week calculation, partial-date exclusion, period comparisons, snapshot invariance, transfer exclusion, scopes, requests / task states. Browser tests cover navigation, KPI drill-through, date ranges, persistence, directory, refresh, custom branding, three PDF downloads, signed numeric CSV values, printable document and responsive geometry.
- PREVIEW_URL=http://127.0.0.1:5175 BROWSER_EXECUTABLE="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run verify:ui: existing workspace regression checks.
- PDF QA exports live in artifacts/reports (sample branding). All pages are rendered and inspected, with embedded ₹ text, repeating branding, pagination and complete tables checked. These are QA examples; the application generates fresh documents for the user's chosen data, dates and branding.

Implementation files: reports.js (page / interaction), reports.css (reference-aligned layout / chart tokens), reports-charts.js (closed responsive chart components), reports-model.js (definitions / aggregation), reports-config.js (templates / defaults), report-document.js (PDF / print / CSV), scripts/sync-report-data.mjs (source fixture capture).
