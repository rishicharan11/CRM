# Workspace UI migration — Phase 3

**Branch:** `customer-module-mvp1`

## Scope and reference

This phase covers only the Workspace and global experiences in `CUSTOMER-MODULE-SCOPE.md`. The visual source is the local checkout of `https://github.com/yakosasam797/pakages-module` at `7c2009e4de3a7cbb117fa66c8bfe0564268ffbb7`, including its integrated shell and `@paryatech/ui` card, sheet, search, overlay, and token styles. The GitHub page could not be fetched in this environment; the local checkout's origin matches that repository.

## Screens migrated

| Screen or state | Visual changes | Existing UX kept |
| --- | --- | --- |
| Home Normal mode | Aligned four module cards, header actions, typography, meter, border, radius, shadow, spacing, mode switch, hover/focus, and new-workspace empty treatment with the reference card and button rules. | Four cards, counts, summaries, meters, action labels, Normal/Advance switch, and Add query empty action. |
| Home Advance mode | Aligned KPI strip to compact reference metrics, two dashboard sheets to DataSheet header/row/type roles, and Tasks/Follow-ups/Notes lists to shared dividers and text roles. | KPI meanings, two tables and columns, row actions, list content, section order, and all empty states. |
| Dashboard notes | Applied shared field, button, focus and divider styles to the inline note form. The workspace notes overlay uses the reference elevation and search control dimensions. | Existing shortcut, browse/compose flows, note submit behavior and keyboard/close behavior. |
| Global search | Applied modal elevation/radius, search focus, result row, and keyboard focus styles. | Trigger, Ctrl/⌘ K, filtering, quick/recent destinations, Escape, and navigation. |
| Navigation and header | Kept the Phase 1/2 AppShell visual rules; aligned the Home mode switch and fixed the mobile Home greeting position beside the menu button. | Sidebar order, active destination, collapse, mobile drawer, breadcrumbs, back/history, topbar controls and handoffs. |
| Notifications | Aligned topbar popover and page list with reference overlay/sheet surfaces, selected pink state, unread dot, action hierarchy, disabled controls, and no-unread state. | Unread/All, Show unread, mark all read, View all, preferences action and notification data. |
| Account settings | Aligned section navigation, form control heights, role/status chip, device/role cards, focus and overlay styles. The mobile profile row now gives the name and photo action room. | All five sections, profile fields/photo action, save behavior, placeholder actions and account menu. |

## Components reused

The existing Customer `.button`, `.field`, `.query-table`, `.dashboard-panel`, `.dashboard-kpi`, `.dashboard-status`, `.query-empty-state`, `.toast`, sidebar/topbar, notes overlay, search dialog, notification rows, account menu, and shared semantic tokens are reused. This phase adds no duplicate component, route, data model, API call, or JavaScript behavior. The visual recipes correspond to the reference `AppShell`, `Button`, `TabBar`, `DataSheet`, `SearchField`, `Modal`, `EmptyState`, KPI card and notes drawer patterns.

## Validation

- Ran the app in Vite and completed the production build. No TypeScript project or type-check script exists in this Customer implementation.
- Opened `#dashboard`, `#notifications`, and `#account`; tested Normal/Advance visibility and state, four Home cards, Advance table rows, note submit and feedback, Add customer/Add query entry, and search by shortcut and topbar trigger.
- Tested global search result navigation; sidebar collapse; notification popover, Unread/All, mark-all-read and empty state, View all; all five account sections, profile save and account-menu navigation.
- Checked Chrome console and page errors during those flows. Checked desktop `1440px`, tablet `768px`, and mobile `390px` for all three Workspace routes; no document-level horizontal overflow. Tested the mobile navigation drawer.
- Compared desktop/mobile screenshots with the reference shell, DataSheet and shared component patterns. Browser interaction testing used an isolated context; saved test account values were not written to the user's browser data.

## Deviations and known issues

- Home's Normal cards, Advance tables, notification page and account settings do not have direct exported reference pages. Their existing Customer layout and workflow remain, with reference token and component treatments applied.
- The reference components are React; Customer remains vanilla HTML/CSS/JavaScript. Their visual rules are adapted through the existing stylesheet.
- Global search still filters its fixed quick/recent destinations and has no dedicated no-match message. That behavior predates this visual phase and remains unchanged.
- No build, console or route issue was found in validation.

## Files changed

- `design-system-03.css` — Workspace-specific visual rules using existing tokens and components.
- `WORKSPACE-MIGRATION.md` — this migration record.
