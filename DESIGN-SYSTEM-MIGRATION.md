# Direction 03 design-system migration record

Date: 2026-09-21

## Canonical source

- Design system: `../-Design-System-03-experiment-main`
- Tokens consumed directly: `src/tokens/tokens.css`
- Typography consumed directly: `src/tokens/typography.css`
- Product integration: `design-system-03.css`
- Local link: `design-system -> ../-Design-System-03-experiment-main`
- Booking implementation reference: `/Users/rishicharan/Desktop/new-direction-03-main/booking-redesign.html`
- Sizing and interaction evidence: `Screen Recording 2026-09-21 at 1.31.11 PM.mov`, `Screen Recording 2026-09-21 at 1.45.52 PM.mov`, `Screen Recording 2026-09-21 at 2.24.29 PM.mov`, and the booking-notes reference `Screen Recording 2026-09-21 at 6.25.10 PM.mov`.
- Fixed product reference: `https://vendor-crm-tau.vercel.app/`, inspected at desktop, collapsed-rail, and 800px responsive widths across the vendor list, every vendor record tab, rate-card editor, menus, filters, and create/edit flows.

The static prototype keeps its existing HTML and JavaScript behavior. Its visual layer now resolves through Direction 03 semantic tokens rather than maintaining a second product palette.

## Shared shell and primitives

- Replaced the edge-to-edge product rail with the Direction 03 inset shell: 250px expanded sidebar, 66px collapsed rail, 10px inset/gap by default, 12px from 1440px, 14px from 1920px, 16px shell radius, token borders, and canonical elevation.
- Added the canonical topbar structure: contextual back control, required breadcrumbs, module-aware search, settings/help/call/notification actions, and pink person account treatment.
- Moved the collapse control to the sidebar footer to match the fixed Vendor CRM direction, preserved the 250px-to-66px panel transition, retained the credits meter, and added the matching compact Upgrade action.
- Applied the deployed Vendor CRM typography hierarchy from `https://vendor-crm-tau.vercel.app/`: Onest for headings/actions, Public Sans for body/navigation, and JetBrains Mono for IDs, money, counts, dates, and pagination. The exact reference roles include 24px page headings, 22px record headings, 13.5px navigation, 11px/16.5px sidebar groups, 12px/18px table headers, 13.5px/16.875px table titles, and 11px mono record IDs.
- Applied 10px soft-rect actionable controls. Pills remain limited to compact status/count treatments.
- Active navigation and record tabs use pink person/place hierarchy. Work actions remain teal.
- All modals, fields, menus, search controls, buttons, focus rings, and empty states now use shared semantic colors, radii, and elevations.
- Matched the Vendor CRM icon hierarchy: 18px sidebar icons, 17px topbar actions, 16px search/back icons, 15px standard button icons, and 14px compact button icons.
- Matched the reference workspace-density calculation by deriving horizontal page padding from the available workspace width instead of the full viewport.
- Preserved the product wordmark and installed the supplied 20px sidebar panel icon without rotating or substituting it.
- Replaced the local sidebar taxonomy with the current Vendor CRM structure: Workspace, Sales, CRM, and Operations, while retaining the Paryatech logo.

## Dashboard

- Reframed the dashboard inside the canonical shell and topbar.
- Rebuilt KPI cards with Direction 03 surface, border, radius, label, and value roles.
- Standardized pipeline, recent logs, focus, alerts, and top-alert panels to the shared panel hierarchy.
- Replaced local status colors with design-system success/warning/danger/info/person/work tokens.
- Preserved reporting-period updates, quick actions, chart interaction, alert actions, and customer links.

## Customers

### Customer list

- Rebuilt summary KPIs as the reference's flat, full-width summary strip with single-pixel separators.
- Converted category navigation to the reference tab hierarchy and placed it before the search/filter toolbar.
- Converted the customer table to the Vendor CRM data-sheet hierarchy: 40px neutral header, 64px rows, horizontal and vertical token dividers, Public Sans headers, mono IDs/amounts, stacked customer identity, pink person avatars, and full-width sheet layout.
- Removed the visible customer-row `View` control: the complete accessible row now opens the profile, while the compact `More` menu mirrors the profile menu's Edit customer and Delete customer operations with the same 6px menu and 10px item padding.
- Replaced the multi-number pager with the approved compact pattern: range label, Previous, current page only, Next.
- Preserved category filters, advanced filters, search, row navigation, refresh, import, create, and pagination behavior.
- Removed the duplicate `All (16)` search result label and toolbar edge rules; the search field now sits directly below the category tabs.
- Replaced the five-step customer creation wizard with one internally scrollable form and a single `Create customer` action.
- Set the new-customer Phone and WhatsApp country-code controls to compact 84px columns beside their full-width number fields at desktop and narrow modal widths.

### Customer overview and record tabs

- Added detail-shell back behavior and three-level breadcrumbs: CRM / Customers / customer.
- Matched the customer record identity to the live Vendor CRM header: a 97px pale-green gradient panel with a 1px teal border, 16px radius, 22px horizontal padding, and a 32px visual gap before the six-tab rail. The rail keeps only its bottom divider.
- Added focused edit dialogs for primary contact, profile, important dates, and preferences; removed traveller note callouts; removed the Documents filter strip and tracked-record summary; and linked each traveller's Documents summary directly to that traveller in the Documents tab.
- Added a Communication tab after Finance with chronological sent/received email history, All/Inbox/Sent mailbox filters, a full composer, and reusable document, acceptance, and supporting-letter request templates.
- Replaced the mixed Pipeline opportunity/status list with customer-specific Queries, Proposals, and Vouchers subtabs. The tab now shows live totals, every linked query, sent package pricing, and operational booking records such as flight PNRs, ticket numbers, stays, invoices, activities, and attractions.
- Reworked Finance around the operational ledger model: Total booking value, Credited refunds, Debited customer receipts, and Outstanding now derive from one transaction history; the history adds explicit debit/credit and running-outstanding columns, while Full ledger hands off to Operations / All finances with the finance icon.
- Matched the booking reference's contextual `Customer notes` shortcut beneath the logo. It appears only inside a customer record, exposes a dedicated add action, and badges the number of notes pinned for that customer.
- Replaced the centered notes modal with the reference's 388px anchored popover: browse/compose modes, search, All/Pinned/Mine filters, pinned-first history, related-record labels, pin/unpin, task creation, deletion, an empty result state, and browser-local customer isolation and persistence.
- Rebuilt the customer-work row as one shared panel below Primary contact, Profile, and Important dates. Its larger `Task` region keeps only the title and add action, removes quick entry, counts, and filters, and lists active tasks in visible Task name/due date, Status, Priority, and Created by columns. The compact Referral tree region keeps Website acquisition and the relationship dialog.
- Customer-linked tasks now remain connected when a customer is renamed and are removed with the customer. Referral links receive the same deletion cleanup.

## Inbox

- Rebuilt the conversation list and thread as one flat split pane with a shared outline, vertical divider, pink selected-row treatment, person/channel avatars, status chips, branded outgoing messages, and reference control hierarchy.
- Preserved conversation filtering, unread counts, conversation selection, WhatsApp/email composition, customer communication links, and create-conversation flow.

## Tasks

- Rebuilt task header, filters, tabs, Kanban columns, cards, priority chips, assignee avatars, due-state hierarchy, drag state, empty state, and task modal with Direction 03 tokens.
- Preserved search, filters, category tabs, create/edit, refresh, drag-and-drop status updates, and keyboard card opening.

## Queries

- Rebuilt the query workflow around the supplied recording and card anatomy: Unassigned, New, Quoting, Negotiation, Won, and Lost are now the only board and list lifecycle stages.
- Rebuilt query cards around priority, customer tier, title, customer name and ID, delay reason, last activity, assignee avatar, and drag affordance while retaining the existing Vendor CRM design tokens.
- Added Mine/All assignment scope plus Priority, Pending on, and Customer tier filters. Every Trip, Flight, Accommodation, Visa, Cruise, and Transport board now contains 12 seeded queries.
- Preserved search, category navigation, Kanban/list switching, record actions, query creation, and drag-and-drop stage changes.
- Replaced the three-step booking wizard with one internally scrollable form and a single `Create booking` action.

## Behavior checks

- Dashboard period changed to Day: at-risk value updated to `1`; payment due updated to `₹38k`.
- Customer shell search `Jain` synchronized to the module search and reduced the table to one `Jain Family` row.
- Customer pager moved to page 2 and rendered `9–16 of 16`; Previous enabled and Next disabled.
- Customer detail opened as `#customer-CUST-0001`, showed the shell back control, three breadcrumbs, four KPIs, and the Overview tab.
- Inbox rendered eight conversations; selecting Anushka Bose opened its two-message thread with its composer.
- Tasks rendered four status columns and six My Inbox cards.
- Completed task view rendered three completed records; Create task opened the populated `New task` modal.
- Detail-shell Back returned from `#customer-CUST-0001` to `#customers`.
- At 800px, the sidebar was inert while closed, opened as a 320px drawer, exposed the backdrop, returned focus to its trigger when closed from the footer control, and retained a two-column KPI layout.
- Vendor-reference parity at a 1200px viewport produced a 250px sidebar, 920px workspace, 13.5px navigation type, 18px navigation icons, 11px group labels, 24px page headings, flat summary sheets, and 1px table grids.
- The footer control collapsed the sidebar to 66px and expanded it to 250px; the full logo exchanged for the 28px mark, the supplied icon remained 20px, and `aria-expanded` tracked both states.
- Every primary route, all six customer record tabs, Communication mailbox filters and templates, section edit dialogs, traveller-to-document navigation, customer search, customer creation modal, desktop collapse/expand, and the mobile drawer were exercised in Google Chrome. The customer table stayed internally scrollable without horizontal page movement.
- Final browser navigation reported no page errors, console errors, or failed requests.
- The 30.9-second customer-flow reference recording and five supplied UI references were reviewed before the follow-up UX changes.
- Query creation now uses one vertically scrollable form for Trip, Flight, Accommodation, Visa, Cruise, and Transport; the obsolete three-step progress state was removed while field validation, draft saving, and creation behavior remain intact.
- The Overview travel-profile panel was replaced by the four-row Important dates panel, and the Pipeline journey/follow-up strip was removed so filters and records begin immediately.
- Customer category tabs now show live totals: All 16, B2C 10, B2B 2, Sub-Agent 2, and Other 2.
- Google Chrome verification covered every query type, successful Trip query creation, desktop and 800px scrolling, overview dates, the simplified pipeline, category filtering, and runtime errors.
- Google Chrome verification covered all six service boards with 12 queries each, every six-stage list view, Mine/All scope, search, all three new filters, exact card anatomy, drag-and-drop stage changes, and list record actions.
- Google Chrome verification covered the exact 13-item Vendor CRM sidebar order, local logo, customer control ordering, successful customer creation, successful booking creation, all visible query sections, internally scrollable forms, and the 800px navigation drawer. Final navigation reported no page, console, or request errors.
- Follow-up Google Chrome verification measured an 84px/570px country-code and number hierarchy at 752px, a 13.6px logo-to-Workspace gap, and three visible unfiltered pipeline records. No page, console, or request errors occurred.
- Reviewed the supplied 31.24-second booking-notes recording and the local `booking-redesign.html` implementation before matching the customer notes flow.
- Google Chrome verification matched the contextual shortcut, transparent anchored popover, browse/compose mode switch, reference filters, compact history rows, related-record selector, pin control, hover actions, and narrow layout.
- Jain Family rendered 2 All, 2 Pinned, and 1 Mine seeded notes; search returned the expected passport note. Creating a pinned Payment note raised the badge to 3 and persisted its complete record in `paryatech.customer-notes.v1`.
- Unpinning reduced the badge to 2, Create task opened the existing task modal prefilled with Jain Family and the note body, deletion removed the temporary note from storage, and reload restored the two seeded notes.
- Pragyam Soni rendered the zero-count `No notes match.` state. At 390×844 the popover stayed within 12px horizontal insets with no page overflow; the exercised interactions reported no page or console errors.
- Typography parity verification matched all 253 live Vendor CRM font/type custom properties and 16 computed list/detail roles with zero differences.
- Google Chrome verification covered all 13 primary routes, all six customer tabs, B2B filtering, row navigation, the primary-contact edit dialog, Communication mailbox filtering, the inline composer, and template population without changing their flows.
- At 1440px and 800px, every audited visible text node used at least 10.5px type and a canonical 400/500/600/700 weight; no audited route or customer tab produced horizontal page overflow. Instrumented customer-tab interactions reported no runtime, rejection, or console errors.
- Reviewed both supplied 22 September customer recordings. Traveller preferences now cover Stay, Transport, Activities, Food, Budget, Travel style, and Communication, including the observed hotel, room, meal, airline, seat, vehicle, activity, dietary, budget, timing, channel, and language choices without duplicating the reference platform's overlapping categories.
- Add/Edit Traveller now captures structured per-traveller preferences; collapsed traveller rows show accurate counts, expanded rows show labelled selections, and View full details presents the same read-only preference record.
- Document traveller groups now load collapsed and behave as a single-open accordion. Traveller and document initials use the same soft-square person avatar treatment as the customer header, while tabs and actionable rows share one neutral hover treatment.
- Google Chrome verification added Shubham Jain with six preferences, reopened the saved read-only record, exercised every document row through expand, switch, and collapse states, and checked the 800px traveller list and preference editor. No horizontal overflow or instrumented interaction errors occurred.
- Reviewed the supplied customer-table recording before replacing the visible View control. Google Chrome verification at 1440px and 800px covered pointer and Enter-key row navigation, Edit customer and Delete customer dialogs from the table menu, Escape focus return, lower-row menu collision handling, and zero horizontal page overflow.
- The verified customer table keeps 64px rows with symmetric 10px vertical cell padding, a 56px action column, and the same Edit/Delete labels, descriptions, and vertical menu spacing as the customer profile menu.
- Reviewed the supplied customer-overview recording and both task/referral image references. Jain Family renders two seeded active tasks with due dates beneath their names, Open status, P1/P2 priorities, and creator identity; completed tasks disappear from this table.
- Google Chrome verification at 1440×900 covered customer-prefilled full task creation, active-only removal after completion, creator display, existing-customer referrer selection, reciprocal relationship updates, referral navigation, and Website acquisition. The instrumented final flow reported no page, console, or request errors.
- At 390×844 the single outlined task/referral panel becomes one column, the task table scrolls internally, the referral dialog remains inside the viewport, and the page has no horizontal overflow.
- Reviewed the supplied 15-second document-preview recording. The preview now keeps a Print badge beside the file surface and exposes Replace Document and Delete Document actions in its footer; deletion uses an inline, focus-safe confirmation before changing the traveller record.
- Google Chrome verification replaced Vandan Jain’s passport with a PNG and refreshed its preview, file metadata, source, and status; deletion cancel restored the actions, while confirmation removed the visa and restored its required-document row. The Print action opened Chrome’s native print flow.
- At 390×844 the preview remained inside the viewport without page overflow, the Print badge stayed visible, and Replace Document and Delete Document remained side by side in the fixed footer.
- Reviewed the supplied 16.63-second pipeline recording before replacing the prior Quoting, Negotiation, and Completed-style opportunity list with the three operational record types.
- Jain Family now renders 4 queries, 4 sent proposals worth ₹2,76,000, and 5 issued vouchers. The proposal table includes the ₹45,000 Bali Family Escape package; the voucher table includes flight PNR `X7P9QK`, ticket numbers, accommodation confirmation, invoice, activity, and attraction references.
- Google Chrome verification at 1440×900 covered all three subtabs and their counts, and a newly created Flight booking raised the voucher total to 6 and opened Vouchers with its booking reference and pending PNR state.
- At 390×844 the summary and tab counts remain visible, the record table scrolls internally without page overflow, ArrowRight moves focus and selection between subtabs, and the instrumented flow reported no page, rejection, or console errors.
- Reviewed the supplied 8.595-second finance recording. Jain Family now renders ₹3,00,000 booking value, ₹20,000 credited, ₹2,20,000 debited, and ₹1,00,000 outstanding; its three newest-first ledger rows retain chronological running balances of ₹1,80,000, ₹80,000, and ₹1,00,000.
- Google Chrome verification covered the four KPI definitions, five ledger columns, Credit and Debit labels, the changed finance icon, and Full ledger routing to `#finance` with All finances selected and no inline dialog. Rishi Charan independently balanced at ₹1,85,000 booked − ₹1,70,000 debited + ₹10,000 credited = ₹25,000 outstanding.
- At a 390px emulated viewport the four KPI cards became one column, the 820px ledger scrolled inside its 356px container, and the page retained zero horizontal overflow. An instrumented reload reported no page or console errors.
- Reviewed the supplied 12.667-second customer-hover recording and 21.9-second KPI-standardization recording. Customer record tabs and Pipeline subtabs now reuse the list-page tab hierarchy: 44px controls, 10px horizontal padding, transparent hover surfaces, primary text on hover, and the existing pink active underline.
- Overview, Pipeline, and Finance now reuse the customer-list `metrics-grid` and `metric-card` implementation rather than maintaining parallel KPI components. Each verified desktop strip has four equal columns, 88px cards, zero gap, square corners, white surfaces, one-pixel dividers, and identical KPI typography; Pipeline adds Proposal value as its fourth metric.
- Google Chrome verification matched the computed KPI geometry and surface styles across the customer list and all three customer-record tabs. Jain Family rendered Overview values ₹3,00,000 / 2 / 4 / 3 of 12 ready, Pipeline values 4 / 4 / ₹2,76,000 / 5, and the unchanged Finance values ₹3,00,000 / ₹20,000 / ₹2,20,000 / ₹1,00,000.
- At a 390px emulated viewport each KPI strip became one column, customer tabs scrolled internally, the finance ledger retained its internal 820px scroll surface, and the page retained zero horizontal overflow. The instrumented Overview, Pipeline, and Finance interaction pass reported no page or console errors.

- Reviewed the supplied 13.37-second Communication recording and low-fi mail reference. The customer identity now occupies one compact 68px header with a circular avatar, while the left rail contains only All mail, Inbox, and Sent and collapses from 216px to 64px on desktop or fully hides on narrow layouts.
- Email rows now open a dedicated full-pane reader with sender, route, direction, timestamp, preserved line breaks, and attachments. The composer follows the low-fi hierarchy with To, Subject, a large Message field, Upload and Template tools on the left, and Discard and Send actions on the right.
- Google Chrome verification covered Inbox filtering, desktop and mobile sidebar collapse, full incoming and sent-message reading, personalized template population, attachment upload, discard/reset, send/count updates, and attachment retrieval from the sent reader. At 390×844 the rail, reader, and stacked composer produced zero horizontal page overflow; the instrumented desktop and mobile flows reported no page or console errors.

- Reviewed the supplied 45.98-second Document vault recording before replacing the nested card stack with a directional customer table. Every current customer now owns a vault profile; each row is one disclosure target and expands into traveller and group document records without a competing customer-link action.
- Vault KPIs now derive from the live customer and document stores instead of fixed display values. The verified seed state rendered 7 documents, 16 customers, 41 travellers, and 1 document expiring soon; adding a document raised both the global total to 8 and Pragyam Soni’s profile total to 1 immediately.
- The top bar now carries vault search beside `CRM › Customers › Document vault`. Customer-origin navigation adds the source customer to form `CRM › Customers › Jain Family › Document vault`, preserves the scoped search and expanded row, and returns through the customer breadcrumb to the Documents tab.
- Reviewed the supplied 37.29-second vault refinement recording. The vault table now shares the customer-table outer edges, left content inset, 16px right inset, and eight-record pagination: `1–8 of 16` followed by `9–16 of 16`.
- Vault customer avatars now reuse the customer list’s `.avatar` implementation rather than a vault-specific treatment. Chrome measured identical 32px geometry, pink foreground/background/border colors, 8px radius, and first-column position for Jain Family in both tables.
- Every traveller group now loads collapsed. The four Jain Family traveller blocks retain 10px separation, a 1px solid boundary, and a 12px radius; opening one group exposes its document table without opening the other three. Desktop and 390×844 verification produced zero horizontal overflow and no page or console errors.

- Reviewed both supplied references before rebuilding the Trip workflow: the 2:28 Trip query/proposal recording and the 30:54 Simple Itinerary recording. Trip query capture now supports customer search and inline customer creation with name, mobile number, and optional email while retaining the existing modal, field, button, and validation patterns.
- Trip detail now keeps itinerary work inside Proposals; the standalone Itinerary tab has been removed. Proposals exposes `Send a package` and `Build itinerary`, then supports three starting points: a searchable package catalog, a saved itinerary, or the current query details. The setup explicitly offers Simple itinerary and Advanced itinerary modes.
- The proposal builder uses the existing system sections, tables, fields, badges, buttons, colors, and responsive shell across four persisted steps: Build itinerary, Proposal content, Costing, and Preview. Days include destination, date, time, description, travel, stay, activities, and Advanced-only meals and operations notes. Costing derives category subtotals, base cost, configurable margin, and client price. Publishing creates a customer link; `Share in Communication` opens the existing composer with the link and generated proposal attachment, and sending updates the proposal to Sent.
- Final Chrome verification filtered the customer selector, created and selected `CUST-0017` inline, and submitted a new international Trip query. The proposal pass filtered the package catalog to Shimla, built an Advanced seven-day package itinerary, added an activity, day, and flight, edited customer content, calculated category totals and a 15% margin to `₹81,305`, previewed eight days, published a customer link, prefilled Communication with that link and a generated PDF, sent the email, and confirmed the proposal status changed to Sent.
- The alternate entry checks loaded the saved Sri Lanka itinerary as a 15-day Simple itinerary and confirmed the scratch path can create immediately from query data. At 390×844 the query/customer capture, source catalog, builder, costing, and preview all stacked without horizontal page scrolling; the 1,100px service table retained its intended internal 356px scroll surface. The final JavaScript browser build completed successfully, and all exercised desktop and responsive paths reported zero runtime or console errors.

- Reviewed the supplied 102.885-second vendor shell recording before updating the shared customer/query shell. The sidebar now keeps credits and its Collapse control in the footer, contracts to the system's 66px icon rail, preserves module context on workspace pages, and keeps module notes anchored beside the rail.
- The top bar now exposes one persistent `Search anything` command palette with `Ctrl/Cmd + K`, filtering, arrow-key navigation, Enter routing, Escape dismissal, and working destinations for customers, queries, tasks, notifications, account settings, and current customer/query records. Breadcrumbs and Back behavior now cover notification and account deep links.
- Notifications now share unread state between the bell popover and full workspace page, including Unread/All, mark-read, preferences, and alert-state updates. The account control now opens the recorded profile menu and routes to Profile, Security, Devices, Personal preferences, and Workspace role sections without browser alerts.
- Chrome verification covered the expanded and collapsed desktop sidebar, module notes, global-search routing, notification state, full notifications, account menu/settings, Trip query detail, and the seven-day itinerary builder. Desktop 1440×1000 and responsive 390×844 checks reported zero horizontal page overflow, runtime errors, or console errors.

- Reviewed the supplied 34.138-second vendor-shell reference and 28.998-second customer-shell comparison recordings before correcting shell parity. The customer/query module now uses the vendor CRM AppShell structure and class contracts for the frame, sidebar, notes strip, navigation groups, credits footer, workspace, top bar, breadcrumbs, universal search, utilities, and account control.
- Desktop geometry now matches the live vendor shell: 10px frame inset and gap, 250px sidebar, 58px brand header, 38px notes strip, 35px navigation rows with divider-separated groups, 103px footer, 57px top bar, and a single bordered 16px-radius workspace. The canonical Paryatech lockup/mark assets, Public Sans/Onest/JetBrains Mono roles, pink active navigation, green primary actions, compact command search, and icon-only collapsed rail are shared without introducing external UI.
- The global sidebar now includes Destination and Settings in the same positions as the vendor CRM shell. List pages expose the vendor-shell Back control; deep links fall back to their parent list or Home instead of returning to the same page.
- Final Chrome verification matched the vendor shell's desktop and 390×844 top-bar bounding boxes, exercised expanded/collapsed rails, the responsive drawer, notes, universal search, notifications, account menu, and list-page Back routing, and reopened the seven-day Trip itinerary builder. The JavaScript browser build completed successfully; the tested desktop and responsive paths produced zero horizontal page overflow, runtime errors, or console errors.

## Visual evidence

- Before: `design-system-before-dashboard.png`
- Dashboard: `design-system-after-dashboard.png`
- Customer list: `design-system-after-customers.png`
- Customer overview: `design-system-after-customer-overview.png`
- Inbox: `design-system-after-inbox.png`
- Tasks: `design-system-after-tasks.png`
- Responsive customer shell: `design-system-after-mobile-customers.png`
- Booking-reference customer list: `booking-parity-customers.webp`
- Booking-reference dashboard: `booking-parity-dashboard.webp`
- Booking-reference customer overview: `booking-parity-customer-overview.webp`
- Booking-reference inbox: `booking-parity-inbox.webp`
- Booking-reference tasks: `booking-parity-tasks.webp`
- Booking-reference responsive customer shell: `booking-parity-mobile-customers.webp`
