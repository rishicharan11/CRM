# Shared design foundation changelog

**Branch:** `customer-module-mvp1`

**Reference:** local `../pakages-module` checkout at `7c2009e4de3a7cbb117fa66c8bfe0564268ffbb7` (the supplied GitHub URL was unavailable from this environment).
**Phase:** shared design foundation only.

## What changed

- Matched the integrated reference shell's outer inset and sidebar/workspace gap: 12 px at 1440 px and wider, 14 px at 1920 px and wider. The shell still uses its existing mobile layout and 10 px default desktop spacing.
- Added the reference's Onest 400 font weight to the existing Google Fonts request. Onest, Public Sans, and JetBrains Mono remain the existing heading, body, and mono families.
- Updated the existing inline SVG sprite's shared people, search, filter, and location glyphs to the corresponding paths from the reference design-system icon registry. No icon library or duplicate icon component was added. Existing CSS token roles continue to set icon dimensions and strokes.

## Files changed in this phase

| File | Change |
| --- | --- |
| `design-system-03.css` | Reference desktop shell spacing breakpoints. |
| `index.html` | Onest 400 request and four existing shared icon paths. |
| `DESIGN-FOUNDATION-CHANGELOG.md` | This phase record. |

## Tokens created or reused

No new token was created. The existing local copy of the reference tokens in `design-system/src/tokens/tokens.css` remains the source for surface, text, border, action, status, type, space, radius, elevation, control height, and icon roles. This phase explicitly reuses `--space-3` for the 12 px shell gutter and the existing `--shell-inset` / `--shell-gap` shell variables. The 14 px wide-screen value is the reference shell's literal value; it was not invented for Customer. Color and status values were already mapped to the reference semantic tokens and were not duplicated.

## Components affected

- The shared app shell at wide desktop sizes, including sidebar, topbar, and main workspace alignment.
- Shared icon instances that use the existing `i-users`, `i-search`, `i-sliders`, or `i-map-pin` symbols.
- Any text that requests regular Onest, through the already configured display font family.

No Customer page layout, form, modal, Kanban, conversation, proposal builder, document workflow, route, API call, business rule, customer record, or event handler was changed.

## Validation

- Vite production build passed with no errors. This project has no TypeScript source or typecheck script; the build also passed JavaScript transformation.
- Launched the app with Vite on `127.0.0.1:5175`. Browser checks used Chrome at 1440 × 900, 390 × 900, and 1920 × 1080. The 1440 px shell resolved to a 12 px inset and gap, and the 1920 px shell to 14 px. Desktop and mobile screenshots showed the shell rendering without document-level horizontal overflow.
- Fifteen direct local routes loaded: Home, Inbox, Tasks, all six Query categories, Customers, Customer detail, Query detail, Document vault, Notifications, and Account. The public secure-upload query-string entry also opened with the app shell hidden.
- Sampled interactions passed: sidebar navigation to Home and Tasks; Tasks list switch; opening and closing Add customer; Customer detail Travellers tab; mobile sidebar open and close.
- No browser console or page errors occurred. The Customers list still showed 16 seeded records. `app.js` and all data files are unchanged.

## Deviations, risks, and follow-up

- The reference `Icon` component is React-based while Customer is vanilla JavaScript. The existing SVG sprite now uses the matching shared glyph paths and token-based sizing/strokes without a framework change. Other Customer-only glyphs remain for later visual migration.
- The local reference revision is pinned above because its remote could not be checked here. If the remote has changed, compare those changes before the next phase.
- The working tree already contained uncommitted component CSS and earlier scope/checklist documents before this phase. They were not staged for this commit and remain outside its change set. Browser validation exercised the current working tree; the staged phase snapshot was also built separately before committing.
- Responsive Customer tables and page-specific surfaces remain in their existing form for later phases.
