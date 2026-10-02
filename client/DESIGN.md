---
name: Elite Talent System
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#45464d'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#4648d4'
  on-secondary: '#ffffff'
  secondary-container: '#6063ee'
  on-secondary-container: '#fffbff'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#002113'
  on-tertiary-container: '#009668'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for high-stakes talent acquisition and professional development. It embodies an **Elite Corporate Modern** aesthetic — combining the authority of traditional enterprise with the fluid efficiency of a high-end SaaS.

The personality is **Trustworthy, Efficient, and Zen**. To achieve this, the UI prioritizes:
- **Breathable Layouts:** Using generous whitespace to reduce cognitive load for HR administrators.
- **Precision:** Tight alignment and consistent geometry to convey competence.
- **Refinement:** Subtle transitions and sophisticated depth cues that favor high-quality "glass" and "paper" metaphors over flat, lifeless surfaces.
- **Focus:** Minimizing unnecessary decorative elements to create a calm, purposeful workspace.

## Colors

The palette is anchored in a professional hierarchy that separates navigation, content, and action.

- **Deep Navy (#0F172A):** Utilized for primary navigation sidebars and headers to provide a strong, authoritative frame.
- **Electric Indigo (#6366F1):** Reserved for primary calls-to-action (CTAs), focus states, and active indicators. It provides a modern, high-energy contrast to the navy.
- **Emerald (#10B981):** Specific to success states, "Hire" confirmations, and positive progress tracking.
- **Surface Neutrals:** The application uses `#F8FAFC` as the global background to maintain a "zen" atmosphere, while pure `#FFFFFF` is reserved for elevated cards and containers.
- **Borders:** Use `#E2E8F0` for subtle structural definitions that remain unobtrusive.

## Typography

This design system uses a dual-font approach to balance character with utility.

- **Plus Jakarta Sans** is the headline face. Its slightly rounded, modern geometric terminals provide an approachable yet premium feel for page titles and section headers.
- **Inter** is used for all body text, inputs, and labels. Its high x-height and neutral character ensure maximum readability in data-heavy recruitment tables and candidate profiles.

**Weight Usage:**
- Use **Semibold (600)** for sub-headers and primary labels.
- Use **Regular (400)** for long-form content.
- Use **Bold (700)** sparingly for high-level statistics and primary headlines.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid** model. Navigation is fixed to the left, while the main content area utilizes a fluid grid with a maximum cap to prevent line-lengths from becoming unreadable.

- **Grid:** A 12-column grid system is used for dashboard layouts.
- **Rhythm:** An 8px linear scale (represented by `base * n`) governs all padding and margins to ensure mathematical harmony.
- **Sectioning:** Content is grouped into high-level cards with 32px (`xl`) spacing between modules to maintain the "zen" aesthetic.
- **Mobile:** On devices <768px, the 12-column grid collapses to a single column with 16px side margins. The side navigation transforms into a bottom bar or a hidden drawer.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering**.

1. **The Canvas (Level 0):** Background set to `#F8FAFC`.
2. **The Card (Level 1):** Primary content containers in `#FFFFFF`. They feature a 1px border of `#E2E8F0` and a "Soft Shadow": `0px 4px 6px -1px rgba(15, 23, 42, 0.03), 0px 2px 4px -2px rgba(15, 23, 42, 0.02)`.
3. **The Hover (Level 2):** Interactive cards elevate on hover with a more pronounced shadow: `0px 10px 15px -3px rgba(15, 23, 42, 0.08)`.
4. **The Overlay (Level 3):** Modals and dropdowns use a deep, diffused shadow and a backdrop blur (12px) to focus the user's attention on the task at hand.

Avoid harsh, dark shadows. The goal is to make elements feel like they are resting lightly on a professional surface.

## Shapes

The shape language is **Soft & Modern**.

- **Standard Elements:** Buttons, input fields, and small cards use a **0.5rem (8px)** radius.
- **Large Containers:** Main content cards and modular sections use **1rem (16px)** radius to create a distinct, friendly silhouette.
- **Status Pills:** Badges and tags use a fully rounded (pill) shape to distinguish them from interactive buttons.

This consistent use of rounded corners softens the professional navy/white palette, making the system feel user-friendly rather than strictly institutional.

## Components

### Buttons
- **Primary:** Background `#6366F1`, text white. Heavy 600 weight. Use a subtle scale-down effect (0.98) on click.
- **Secondary:** Transparent background, 1px border `#E2E8F0`, text `#0F172A`.
- **Tertiary:** No border, text `#6366F1`. Used for low-priority actions in tables.

### Input Fields
- Inputs must have a height of 44px. Background `#FFFFFF`. Border `#E2E8F0`.
- On focus, the border changes to `#6366F1` with a 3px soft indigo outer glow.

### Cards
- Always use the 16px (`rounded-lg`) corner radius.
- Padding should be a minimum of 24px (`lg`) to maintain the "zen" feel.

### Chips & Badges
- Used for "Application Status" (e.g., "Pending", "Interviewing").
- Use low-opacity background tints of the status color (e.g., Emerald at 10% opacity) with high-contrast text.

### Progress Bars
- Used for training modules. 4px height, rounded ends. Track is `#E2E8F0`, indicator is `#6366F1`.

### Icons
- Use thin-stroke icons (2px weight) to match the "Elite" brand. Avoid filled icons unless indicating an active state.

---

## Implementation notes for this codebase (added during the 2026-08 redesign)

This spec has already been implemented at the **token layer** — do not re-derive colors/spacing/radii/shadows from the prose above; read them from `client/src/styles/tokens.scss` instead, via CSS custom properties. Every component in `client/src/components/**` and `client/src/layouts/**` is 100% token-driven (no hardcoded hex/px anywhere) — follow that convention.

Key tokens (see `tokens.scss` for the full list):
- Colors: `--color-text`, `--color-text-muted`, `--color-text-subtle`, `--color-surface`, `--color-surface-raised`, `--color-surface-sunken`, `--color-border`, `--color-border-strong`, `--color-accent`, `--color-accent-hover`, `--color-accent-soft`, plus `--color-{success,warning,danger,info}` and their `-surface` tints.
- Type: `--font-sans` (Inter, body) and `--font-heading` (Plus Jakarta Sans, headings) — both loaded via Google Fonts in `index.html`. Scale: `--text-xs` … `--text-4xl`.
- Radii: `--radius-sm` (6px), `--radius-md` (8px, buttons/inputs), `--radius-lg` (16px, cards), `--radius-full` (pills).
- Shadows: `--shadow-sm`, `--shadow-md` (the "soft shadow", default card elevation), `--shadow-lg` (hover elevation), `--shadow-overlay` (modals), `--focus-ring-glow` (the indigo focus glow).
- Mixins (`client/src/styles/_mixins.scss`): `@include input-field` (44px inputs with the focus glow), `@include surface-card` (the Level-1 card), `@include hover-lift`, `@include focus-ring`, `@include visually-hidden`, `@include line-clamp($n)`. Breakpoints via `@include from(sm|md|lg|xl)`.
- Icons: `lucide-react` — thin-stroke SVG icons, sized via the `size` prop (18–22px typical), colored via `currentColor`/CSS.

Shared UI components already restyled to this spec: `Button`, `Card`, `TextField`, `SelectField`, `TextareaField`, `DataTable`, `Pagination`, `StatusBadge`, `TagList`, `PageHeader`, `Alert`, `EmptyState`, `Spinner`, `FullPageLoader`. The `PortalLayout` (authenticated shell: sticky glass top bar + icon sidebar) and `PublicLayout` (marketing site header/footer) are also done. When touching a page, prefer composing these rather than writing new one-off styles, and reuse `@include surface-card` / `@include input-field` for anything bespoke.
