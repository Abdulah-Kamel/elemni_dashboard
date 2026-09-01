---
name: Elemni
colors:
  surface: '#fcfcfe'
  surface-dim: '#e8e5f0'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf9fd'
  surface-container: '#f0f9ff'
  surface-container-high: '#e0f2fe'
  surface-container-highest: '#e2e0ef'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#0b132b'
  inverse-on-surface: '#f8fafc'
  outline: '#777587'
  outline-variant: '#e2e0ef'
  surface-tint: '#0284c7'
  primary: '#0284c7'
  on-primary: '#ffffff'
  primary-container: '#e0f2fe'
  on-primary-container: '#0369a1'
  inverse-primary: '#7dd3fc'
  secondary: '#0369a1'
  on-secondary: '#ffffff'
  secondary-container: '#bae6fd'
  on-secondary-container: '#0c4a6e'
  tertiary: '#22c55e'
  on-tertiary: '#ffffff'
  tertiary-container: '#d1fae5'
  on-tertiary-container: '#14532d'
  error: '#ef4444'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#991b1b'
  primary-fixed: '#e0f2fe'
  primary-fixed-dim: '#bae6fd'
  on-primary-fixed: '#0c4a6e'
  on-primary-fixed-variant: '#0369a1'
  secondary-fixed: '#e0f2fe'
  secondary-fixed-dim: '#bae6fd'
  on-secondary-fixed: '#0c4a6e'
  on-secondary-fixed-variant: '#0369a1'
  tertiary-fixed: '#d1fae5'
  tertiary-fixed-dim: '#bbf7d0'
  on-tertiary-fixed: '#14532d'
  on-tertiary-fixed-variant: '#166534'
  background: '#fcfcfe'
  on-background: '#1b1b24'
  surface-variant: '#e0f2fe'
typography:
  display-lg:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style
The design system embodies a high-end, minimalist SaaS aesthetic tailored for the modern education sector. It prioritizes clarity, focus, and a sense of "intellectual calm." By stripping away unnecessary ornamentation and leaning into a "Linear-inspired" execution, the system projects an image of technical precision and premium quality.

The emotional response should be one of confidence and efficiency. The interface stays out of the user's way, using generous whitespace and a rigorous grid to organize complex educational data. The style is defined by ultra-clean surfaces, micro-interactions, and a sophisticated balance between vibrant brand accents and a monochrome functional foundation.

## Colors
The palette is rooted in soft slate neutrals and the student portal's sky-blue identity. The primary brand expression is Sky Blue (#0284C7), supported by Deep Sky (#0369A1), warm Orange (#F97316), and calm semantic tints.

- **Primary:** Sky Blue for call-to-actions, progress indicators, focus states, and active navigation.
- **Surface:** The background uses #FCFCFE with pale sky-blue surfaces (#F0F9FF / #E0F2FE) and white component cards.
- **Typography:** #1B1B24 is used for maximum legibility in headings, while #777587 handles metadata and secondary descriptions.
- **Status:** Standardized semantic colors (Success: Green-600, Warning: Amber-500, Error: Red-600) should be desaturated slightly to match the professional tone.

## Typography
The system utilizes a dual-font approach to differentiate between structural elements and long-form content. **Geist** provides a technical, precise feel for headings, labels, and UI controls, while **Inter** ensures maximum readability for body text and educational content.

Hierarchy is established through tight letter-spacing on large headings and generous line-heights for body text to reduce cognitive load during learning sessions. All uppercase styling is reserved strictly for small labels or badges.

## Layout & Spacing
The design system follows a 12-column fluid grid for desktop, transitioning to a single-column stack for mobile. It uses an 8px base unit for all spatial relationships. 

- **Layout:** Standardize on a "Centered-Max" layout for dashboards (1280px) to prevent line lengths from becoming unreadable on ultra-wide monitors.
- **Rhythm:** Use "Stack" patterns for vertical spacing—larger gaps (64px+) between distinct conceptual sections, and tighter gaps (16px) between related content cards.
- **Padding:** High-end feel is achieved by using internal component padding that is often larger than the gap between components (e.g., 24px internal card padding vs 16px card gap).

## Elevation & Depth
Depth is created through subtle tonal layering rather than aggressive shadows. This system avoids deep, dark shadows in favor of "ambient lift."

- **Level 0 (Base):** Zinc-50 background.
- **Level 1 (Cards):** Pure white surface with a 1px Zinc-200 border. No shadow or a very faint 2px blur, 2% opacity neutral shadow.
- **Level 2 (Hover/Active):** Pure white surface with a 1px Zinc-300 border and a soft, diffused shadow (Y: 4, Blur: 12, Color: Zinc-900 @ 5%).
- **Overlays:** Modals and dropdowns use a crisp border with a larger backdrop blur (8px) to maintain the "glass" SaaS aesthetic without excessive transparency.

## Shapes
The shape language is modern and approachable, utilizing "Super-elliptical" curves. 
- **Standard Components:** Buttons and input fields use a `12px` (rounded-xl) radius.
- **Containers:** Main content cards and modular sections use a `16px` (rounded-2xl) radius to create a soft, framed appearance.
- **Small Elements:** Tooltips and tags use a `6px` radius to maintain sharpness at smaller scales.

## Components
- **Buttons:** Primary buttons use the Sky-600 background with white text. Apply a subtle 1px inner-border (top-only) in a lighter sky to create a "pressed" 3D effect. Secondary buttons are slate-100 with slate-900 text.
- **Cards:** White background, Zinc-200 1px border. On hover, the border darkens to Zinc-300 and the card lifts slightly (Level 2 elevation). 
- **Input Fields:** #F8FAFC background with a #E2E0EF border. On focus, the border transitions to Sky-600 with a 3px Sky-600/10% halo (ring).
- **Badges:** Use a "soft" style—low-opacity background (Sky-50) with high-contrast text (Sky-700).
- **Progress Bars:** Thin 4px or 6px heights with rounded ends. Use Sky-600 for the fill and slate-100 for the track.
- **Lists:** Clean rows separated by 1px Zinc-100 borders, with generous 16px vertical padding per item.
