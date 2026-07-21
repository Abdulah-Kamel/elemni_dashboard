---
name: Elemni
colors:
  surface: '#fcf8ff'
  surface-dim: '#dcd8e5'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f2ff'
  surface-container: '#f0ecf9'
  surface-container-high: '#eae6f4'
  surface-container-highest: '#e4e1ee'
  on-surface: '#1b1b24'
  on-surface-variant: '#464555'
  inverse-surface: '#302f39'
  inverse-on-surface: '#f3effc'
  outline: '#777587'
  outline-variant: '#c7c4d8'
  surface-tint: '#4d44e3'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#c3c0ff'
  secondary: '#712ae2'
  on-secondary: '#ffffff'
  secondary-container: '#8a4cfc'
  on-secondary-container: '#fffbff'
  tertiary: '#7e3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#a44100'
  on-tertiary-container: '#ffd2be'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#eaddff'
  secondary-fixed-dim: '#d2bbff'
  on-secondary-fixed: '#25005a'
  on-secondary-fixed-variant: '#5a00c6'
  tertiary-fixed: '#ffdbcc'
  tertiary-fixed-dim: '#ffb695'
  on-tertiary-fixed: '#351000'
  on-tertiary-fixed-variant: '#7b2f00'
  background: '#fcf8ff'
  on-background: '#1b1b24'
  surface-variant: '#e4e1ee'
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
The palette is rooted in the Zinc grayscale to maintain a professional, neutral environment. The primary brand expression is a vibrant Indigo (#4F46E5), used sparingly for high-impact actions and focus states. 

- **Primary:** Vibrant Indigo for call-to-actions, progress indicators, and active navigation.
- **Surface:** The background utilizes Zinc-50 (#FAFAFA) to provide a soft contrast against pure white (#FFFFFF) component cards.
- **Typography:** Zinc-900 is used for maximum legibility in headings, while Zinc-500 handles metadata and secondary descriptions.
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
- **Buttons:** Primary buttons use the Indigo-600 background with white text. Apply a subtle 1px inner-border (top-only) in a lighter indigo to create a "pressed" 3D effect. Secondary buttons are Zinc-100 with Zinc-900 text.
- **Cards:** White background, Zinc-200 1px border. On hover, the border darkens to Zinc-300 and the card lifts slightly (Level 2 elevation). 
- **Input Fields:** Zinc-50 background with a Zinc-200 border. On focus, the border transitions to Indigo-500 with a 3px Indigo-500/10% halo (ring).
- **Badges:** Use a "soft" style—low-opacity background (Indigo-50) with high-contrast text (Indigo-700). 
- **Progress Bars:** Thin 4px or 6px heights with rounded ends. Use Indigo-600 for the fill and Zinc-100 for the track.
- **Lists:** Clean rows separated by 1px Zinc-100 borders, with generous 16px vertical padding per item.