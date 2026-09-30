# Sidebar UI Anatomy

## Source of truth

- **Figma component:** [Paryatech Redesign — Sidebar, node `2065:11415`](https://www.figma.com/design/BX6vifmwLJW9vkIgmGNO0H/Paryatech--Redesign?node-id=2065-11415&m=dev)
- **Component name:** Primary application sidebar
- **Reference viewport:** `1440 × 1024px`
- **Implementation:** `index.html`, `styles.css`, and `app.js` in this directory

Figma is the visual source of truth. If the component and this document conflict, update the implementation and this document from the linked Figma node in the same change.

## Purpose

The sidebar provides persistent access to Paryatech's global product areas. It preserves the operational hierarchy of Workspace, Sales, CRM, and Operations while allowing the main workspace to use the remaining viewport width.

Use this component for application-level navigation. Do not use it for contextual filters, record details, inspector panels, or page-local actions.

## Structural anatomy

```text
Primary application sidebar
├── 1. Brand header
│   ├── 1a. Paryatech brand link
│   └── 1b. Collapse control
├── 2. Scrollable navigation region
│   ├── 2a. Standalone navigation item
│   ├── 2b. Navigation group label
│   ├── 2c. Navigation item
│   │   ├── Leading icon
│   │   ├── Text label
│   │   └── Optional count badge
│   └── 2d. Expandable navigation item
│       ├── Disclosure chevron
│       └── Nested submenu
├── 3. Utility footer
│   ├── 3a. Token-usage card
│   ├── 3b. Settings link
│   ├── 3c. Sign-out action
│   └── 3d. Powered-by signature
└── 4. Responsive controls
    ├── 4a. Mobile navigation trigger
    └── 4b. Modal backdrop
```

## Anatomy details

### 1. Sidebar shell

The shell is a fixed, full-height `<aside>` with a quiet white surface and a single right-edge divider. It contains one fixed header, one independently scrollable navigation region, and one fixed utility footer.

| Property | Specification |
|---|---|
| Landmark | `<aside aria-label="Primary navigation">` |
| Position | Fixed to the viewport's top, bottom, and left edges |
| Height | `100dvh`, with `100vh` fallback |
| Expanded width | `clamp(256px, 20vw, 320px)` |
| Width at the Figma viewport | `288px` at `1440px`, exactly 20% |
| Collapsed width | `clamp(76px, 7vw, 100px)` |
| Width at the Figma viewport | `100px` collapsed |
| Surface | `--surface-panel` |
| Divider | `1px` using `--border-rule` |
| Layer | Above workspace content and the mobile backdrop; the backdrop covers the workspace without covering the open drawer |

The workspace offset must always equal the visible desktop sidebar width. Width changes animate together so the sidebar never overlaps desktop content during a normal state transition.

### 1a. Brand header

The brand header establishes product identity and owns the desktop collapse control.

| Part | Specification |
|---|---|
| Header height | `80px`; `64px` on viewports shorter than `790px` |
| Layout | Three-column grid: reserved leading slot, centered brand, trailing control |
| Primary logo asset | `assets/paryatech-logo.svg`; supplied `220 × 66px` viewBox rendered at `154px` wide |
| Compact icon asset | `assets/paryatech-favicon.svg`; supplied `74 × 66px` viewBox |
| Brand destination | Product home |

The reserved leading slot keeps the wordmark optically centered even when the trailing collapse control is present.

### 1b. Collapse and expand control

In the expanded state, the trailing control displays the panel-collapse icon inside the brand header. In the collapsed state, the supplied compact brand icon becomes the visible expand control; a second arrow control is not shown.

| State | Visual treatment | Accessible label |
|---|---|---|
| Expanded | `32 × 32px` outlined panel icon | `Collapse navigation` |
| Collapsed | `44 × 44px` button containing the supplied compact icon at `44 × 40px` | `Expand navigation` |
| Mobile drawer open | Panel-close control in the header | `Close navigation` |

The control references the sidebar with `aria-controls="primarySidebar"`. Keyboard focus must remain visible. The expanded control is visually `32px`; implementations should preserve at least a `44px` effective interaction area when this component is moved into a touch-first surface.

### 2. Scrollable navigation region

The navigation region consumes the space between the header and footer. Only this region scrolls when the viewport is too short; the brand and utilities remain visible.

| Property | Expanded | Collapsed |
|---|---:|---:|
| Horizontal inset | `clamp(12px, 1.1vw, 16px)` | Centered controls |
| Item minimum height | `36px` | `40px` |
| Item width | Available width | `44px` |
| Label size | Public Sans, `16px` | Visually hidden |
| Leading icon | `20 × 20px` | `20 × 20px` |
| Corner radius | `6px` | `6px` |

Collapsed labels remain in the accessibility tree and are also exposed as native hover titles. Do not remove the text from the DOM.

### 2a. Standalone navigation item

Dashboard is a standalone item before grouped navigation. It uses the same item anatomy and interaction states as grouped items, but does not need a visible group label.

### 2b. Navigation group label

Group labels organize product areas without becoming navigation targets.

Current groups:

1. Workspace
2. Sales
3. CRM
4. Operations

Labels use Public Sans at `13px`, medium weight, and the faint text color. In collapsed mode, labels are hidden and groups are separated by short rules rather than text.

### 2c. Navigation item

Each navigation item contains:

1. A required leading Lucide-style icon.
2. A required short text label.
3. An optional trailing count badge.
4. An optional disclosure chevron for expandable items.

Labels should be familiar product nouns and fit on one line. Do not rely on an icon alone in the expanded state.

#### Item states

| State | Treatment |
|---|---|
| Default | Transparent background, primary sidebar text |
| Hover | Quiet neutral hover surface |
| Focus-visible | `2px` action-color focus ring with offset |
| Current | Selected surface, action-color icon/text, medium weight |
| Parent expanded | Same emphasis as the current/selected treatment |
| Collapsed | Centered icon-only control with accessible hidden label |

Only one destination may use `aria-current="page"` at a time.

### 2d. Count badge

The count badge communicates pending work, not decorative status.

| Property | Expanded | Collapsed |
|---|---:|---:|
| Height | `20px` | `13px` |
| Minimum width | `20px` | `13px` |
| Shape | Rounded rectangle | Circle |
| Content | Short integer | Short integer |

Use the filled action color with inverse text. Keep counts concise; use `99+` rather than increasing the badge indefinitely.

### 2e. Expandable item and submenu

Queries is the expandable parent in the current sidebar.

- The parent is a `<button>`, not a navigation link.
- `aria-expanded` reports its state.
- `aria-controls` references the submenu.
- The chevron rotates when expanded.
- Collapsing the whole sidebar also closes the submenu.
- Nested links use an indented rule to preserve hierarchy.
- Activating a nested destination closes the mobile drawer.

### 3. Utility footer

The footer remains pinned to the bottom of the sidebar and contains account-level or application-level utilities. It is not part of the scrollable product-navigation list.

### 3a. Token-usage card

The token card shows current platform capacity.

| Expanded state | Collapsed state |
|---|---|
| Token icon, `Tokens` label, remaining percentage, and progress bar | Remaining percentage only |
| Full available width | Full width inside the collapsed footer inset |
| Minimum height `44px` | Minimum height `44px` |

The accessible name must include both the resource and remaining value, for example `Tokens, 85% remaining`. The progress bar is decorative unless interactive usage details are added later.

### 3b. Settings and sign-out

Settings is a navigation link. Sign out is an action button. Both reuse the navigation-item anatomy and preserve their labels for assistive technology in collapsed mode.

Sign out must remain visually distinct through its icon and explicit label; do not communicate the action through color alone.

### 3c. Powered-by signature

The powered-by signature is the final, non-interactive footer element. Expanded mode displays `Powered by` with the supplied Vimaksh logo (`assets/powered-by-logo.svg`) at `112px` wide. Collapsed mode preserves the same logo at `56px` wide so the parent-company identity remains visible.

## Responsive states

### Expanded desktop — `≥1280px`

- Default state.
- Width uses `clamp(256px, 20vw, 320px)`.
- At the `1440 × 1024px` Figma reference, the sidebar is exactly `288px`.
- Users may collapse or expand it without changing navigation order.
- The main workspace occupies the remaining width.

### Compact desktop — `1024–1279px`

- Defaults to collapsed to protect workspace width.
- Collapsed width scales between `76px` and approximately `90px` across this range.
- Icon controls, badges, token usage, separators, and accessible names remain available.
- A user may temporarily expand the sidebar during the current page session.

### Tablet and mobile — `<1024px`

- The sidebar becomes an off-canvas modal drawer.
- Closed drawers are translated fully outside the viewport and made inert.
- Drawer width is `min(320px, 100vw - 32px)`.
- The page header exposes a dedicated navigation trigger.
- Opening the drawer displays a backdrop and locks body scrolling.
- Escape, backdrop activation, the close control, or navigation dismisses the drawer.
- Focus moves into the drawer when opened and returns to the trigger when dismissed.

### Short viewport — `<790px` high

- Header height reduces from `80px` to `64px`.
- Navigation items reduce to a `32px` minimum height.
- Vertical spacing tightens.
- The center navigation region scrolls independently rather than pushing the utility footer off-screen.

### Reduced motion

When `prefers-reduced-motion: reduce` is active, sidebar, workspace-offset, and backdrop transitions are disabled.

## Content rules

- Keep module names short, stable, and recognizable.
- Preserve the operational group order: Workspace → Sales → CRM → Operations.
- Keep Settings and Sign out in the fixed utility footer.
- Use badges only for actionable counts.
- Use progressive disclosure for nested destinations.
- Never expose internal supplier, margin, or operational information in customer-facing navigation.
- Do not add page-local actions to the global sidebar.

## Accessibility contract

- Use a named `<aside>` landmark.
- Use `<nav>` elements for navigation groups.
- Use links for destinations and buttons for state changes or actions.
- Preserve visible focus for every interactive element.
- Use `aria-current="page"` for the active destination.
- Use `aria-expanded` and `aria-controls` for disclosure controls.
- Keep collapsed labels programmatically available.
- Make the closed mobile drawer inert.
- Lock background interaction while the drawer is modal.
- Support Escape dismissal and deterministic focus return.
- Respect reduced-motion preferences.
- Maintain WCAG 2.2 AA text and control contrast.

## Implementation mapping

| Anatomy part | HTML / JavaScript hook | CSS hook |
|---|---|---|
| Sidebar shell | `#primarySidebar` | `.sidebar` |
| Application offset | `#appShell` | `.app-shell` |
| Brand header | — | `.brand-row` |
| Brand link | `.brand` | `.brand`, `.brand-logo` |
| Collapse/expand control | `#collapseButton` | `.collapse-button` |
| Scrollable navigation | `.sidebar-scroll` | `.sidebar-scroll` |
| Navigation group | `.nav-group` | `.nav-group`, `.nav-label` |
| Navigation item | `.nav-item` | `.nav-item` |
| Current item | `[aria-current="page"]` | `.nav-item.is-active` |
| Count badge | `.nav-count` | `.nav-count` |
| Expandable parent | `#queryNavButton` | `.nav-parent`, `.nav-chevron` |
| Nested navigation | `#querySubnav` | `.nav-submenu`, `.nav-subitem` |
| Utility footer | `.sidebar-footer` | `.sidebar-footer` |
| Token usage | `.token-card` | `.token-card`, `.token-progress` |
| Mobile trigger | `#mobileNavButton` | `.mobile-nav-button` |
| Mobile backdrop | `#sidebarBackdrop` | `.sidebar-backdrop` |
| Expanded/collapsed state | `setSidebarCollapsed()` | `.app-shell.is-collapsed` |
| Mobile drawer state | `setMobileSidebarOpen()` | `.app-shell.is-mobile-open` |
| Viewport synchronization | `syncSidebarForViewport()` | Responsive media queries |

## Acceptance checklist

- [ ] The `1440px` expanded sidebar is `288px` wide.
- [ ] Expanded and collapsed content matches the linked Figma component.
- [ ] The collapse control stays inside the brand header.
- [ ] The collapsed state uses the Paryatech mark as the expand control.
- [ ] Navigation order and group hierarchy remain unchanged between states.
- [ ] Active, hover, focus, badge, expanded-parent, and submenu states are present.
- [ ] The navigation region scrolls without moving the header or footer.
- [ ] Compact desktop defaults to the collapsed state.
- [ ] Tablet/mobile uses a modal drawer with backdrop and scroll locking.
- [ ] Closed drawer content is inert.
- [ ] Escape and backdrop dismissal restore focus.
- [ ] Collapsed labels retain accessible names.
- [ ] Reduced-motion preferences are respected.
- [ ] No sidebar element overflows horizontally at supported viewport widths.
