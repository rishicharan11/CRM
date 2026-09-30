# Phase 8 entry dialogs UI migration

## Scope and reference

The complete local entry-dialog scope is **New Vendor** (`#vendorModalBackdrop`) and **New Booking** (`#bookingModalBackdrop`). Inventory came from `CUSTOMER-MODULE-SCOPE.md`, `COMPONENT-MAPPING.md`, `index.html`, and the corresponding handlers in `app.js`. No extra confirmation or handoff dialog is implemented for these two entry points. The local Packages reference supplied Vendor CRM `VendorFormModal` and Booking `booking-redesign.html` direct-booking modal/field styling. The existing Customer forms remain the workflow source of truth.

## Dialogs and controls migrated

| Dialog | Existing controls and states retained | Visual adaptation |
| --- | --- | --- |
| New Vendor | Vendor name, Service select, City, Contact person, Email; required fields, native email validation, close/Cancel/backdrop/Escape and submit toast | Reference compact modal width, subdued header surface, monospace eyebrow, shared heading, neutral field surface, teal focus and shared actions |
| New Booking | Booking title, Customer, Booking type, Currency, travel start/end, Travellers, Total selling price, Tax, service-line/operational-note choice, conditional Service type/cost/details or note; required and date-range validation, disabled Add booking, Save as draft/Cancel, close/backdrop/Escape and submit toast | Reference wide modal width, standard heading and header, section hierarchy, field grid, radio selection, shared field/focus/disabled/action styling |

The implementation reuses the Phase 1 tokens and Phase 2 modal, button, input, select, textarea, date control, icon and toast rules. It adapts existing `vendor-modal` and `booking-onboarding-modal` selectors in `design-system-03.css`. No component, token, icon library, dialog, route or data structure was added.

## Entry points and cross-module handoffs

- **Vendor:** Home's **Add vendor** opens the existing form. Successful submission closes it, displays the existing toast, and leaves the user on Home. The Vendors sidebar item remains its existing external/placeholder destination. No Vendor record or API write is performed by the current submit handler.
- **Booking:** Bookings sidebar navigation and Customer detail **Add booking** open the same form. Customer detail preselects that customer; Bookings navigation uses the current default customer. Submit or Save as draft adds the existing local booking record to that customer, closes the dialog, selects Customer detail → Pipeline → Vouchers, and displays the existing toast. Title, currency, dates, price, tax, party size and operations data are passed through the unchanged form handler. No local Booking list/detail page or API handoff exists.
- Query detail has a `booking` action branch in `app.js`, but none of the current query detail screens render a booking action control. No new entry point was introduced.

## Preserved UX and functionality

Field order, section order, labels, conditional operations setup, validation messages, native select/date behavior, keyboard focus/return, dismissal, draft semantics, status, creation payload, destination and toast behavior are unchanged. No JavaScript, markup, API, route or business logic was edited. The CSS uses existing `--surface`, `--side`, `--surface-3`, `--line`, `--ink`, `--accent`, `--teal-ring`, type, space and radius tokens.

## Validation

- Production Vite build and `git diff --check` passed. This project contains JavaScript, with no TypeScript build step.
- Chrome Playwright checks passed for New Vendor from Home, New Booking from sidebar and Customer detail, opening/closing via buttons, Cancel, Escape and backdrop, initial focus and customer preselection.
- Vendor required-field and email validation, all five controls and success feedback passed. Booking required/disabled state, invalid end-date recovery, type/currency/number/date/select controls, both operations modes, service and note submission, draft submission, toast and Pipeline/Vouchers handoff passed.
- Both dialogs were visually checked at desktop (1440 × 900), tablet (820 × 1000), and mobile (390 × 844). Booking service-line submission and voucher appearance passed at all three sizes. No page or dialog horizontal overflow and no browser console/page errors were observed.
- There is no asynchronous loading or API error state in these forms; the implemented disabled, native validation and toast states were tested. Browser tests used isolated contexts and did not change repository data.

## Visual deviations and known issues

- New Vendor keeps its five-field Customer form rather than copying the reference's larger Vendor CRM creation workflow. New Booking keeps three sections and conditional operations setup rather than the reference's shorter direct-booking form.
- Vendor submit currently only shows a toast; it does not create a vendor record. Bookings navigation opens the entry dialog because this app has no local Booking list. These are existing behavior and were not changed.
- The query-detail booking handler is dormant in the current rendered UI. There is no dialog loading spinner or server error state to migrate.

## Files in this phase

- `design-system-03.css`: scoped visual changes for the two entry dialogs.
- `ENTRY-DIALOGS-MIGRATION.md`: scope, visual mapping and validation record.
