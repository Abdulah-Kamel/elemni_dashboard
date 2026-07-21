---
name: Focus Productivity
colors:
  surface: '#fff7fe'
  surface-dim: '#e1d7e3'
  surface-bright: '#fff7fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fbf0fd'
  surface-container: '#f5eaf7'
  surface-container-high: '#efe5f1'
  surface-container-highest: '#eadfec'
  on-surface: '#1f1a22'
  on-surface-variant: '#4c4353'
  inverse-surface: '#342e38'
  inverse-on-surface: '#f8edfa'
  outline: '#7e7384'
  outline-variant: '#cfc2d5'
  surface-tint: '#8234c6'
  primary: '#6100a4'
  on-primary: '#ffffff'
  primary-container: '#7b2cbf'
  on-primary-container: '#e4c2ff'
  inverse-primary: '#deb7ff'
  secondary: '#6b47bc'
  on-secondary: '#ffffff'
  secondary-container: '#aa86ff'
  on-secondary-container: '#3e0e8e'
  tertiary: '#620f99'
  on-tertiary: '#ffffff'
  tertiary-container: '#7c32b2'
  on-tertiary-container: '#e7c1ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#f1dbff'
  primary-fixed-dim: '#deb7ff'
  on-primary-fixed: '#2d0050'
  on-primary-fixed-variant: '#680eac'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#532ca2'
  tertiary-fixed: '#f2daff'
  tertiary-fixed-dim: '#e1b6ff'
  on-tertiary-fixed: '#2e004d'
  on-tertiary-fixed-variant: '#691a9f'
  background: '#fff7fe'
  on-background: '#1f1a22'
  surface-variant: '#eadfec'
typography:
  display-lg:
    fontFamily: Cairo
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 38px
  headline-md:
    fontFamily: Cairo
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Cairo
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Cairo
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  title-md:
    fontFamily: Cairo
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Cairo
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Cairo
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Cairo
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Cairo
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  sidebar-width: 260px
  grid-gutter: 16px
  container-margin: 24px
---

## Brand & Style

This design system is engineered for high-density educational management. The brand personality is authoritative yet vibrant, prioritizing functional clarity over decorative flair. The aesthetic follows a **Modern Minimalist** approach with a strict structural grid, utilizing high-contrast accents to guide the teacher's attention through complex data sets.

The interface relies on clear boundaries and purposeful color coding rather than depth or shadows. It evokes a sense of "organized energy"—professional enough for administrative tasks, but bright enough to remain engaging throughout a long school day.

Key principles:
- **Absolute Flatness:** No gradients, no shadows, no skeuomorphism.
- **Utility First:** Every element must serve a functional purpose in the teacher's workflow.
- **Visual Silence:** Generous use of the tint color for backgrounds to reduce eye strain.

## Colors

The palette is anchored by a sophisticated range of purples, serving as the primary brand identifier. 

- **Primary (#7B2CBF):** Used for main actions, active states, and primary navigation elements.
- **Deep (#3C098C):** Reserved for high-contrast text and critical interactive states.
- **Tint (#F3E8FF):** The core structural color used for card borders and subtle section backgrounds.
- **Status Colors:** Amber (Warning), Teal (Success), and Red (Error) are used sparingly for immediate feedback and data visualization.
- **Neutral Stack:** Ink (#1A1523) provides maximum legibility for text, while Muted (#6B6478) handles secondary information and labels.

## Typography

The typography system uses **Cairo** exclusively to ensure a harmonious and modern Arabic reading experience. The scale is intentionally compact to facilitate the display of large amounts of data without overwhelming the user.

- **Body Text:** The standard reading size is 13px or 14px to allow for dense information layouts (tables, student lists).
- **Weight Usage:** Bold weights (700) are used strictly for headlines. Semibold (600) is the primary weight for UI interactive elements like buttons and tabs to maintain clarity at smaller sizes.
- **RTL Optimization:** Line heights are slightly increased compared to Latin standards to accommodate Arabic diacritics and descenders without clipping.

## Layout & Spacing

The design system employs a **Right-to-Left (RTL)** orientation. The primary navigation sidebar is docked to the right side of the viewport.

- **Grid System:** A 12-column fluid grid is used for the main content area.
- **Density:** High-density spacing. Elements use a 4px base unit. Padding inside cards is consistently 16px to maximize data real estate.
- **Sidebar:** The right-aligned sidebar uses a fixed width of 260px. On mobile, it transitions to a hidden drawer.
- **Responsive Behavior:**
  - **Desktop:** Sidebar visible, 24px outer margins.
  - **Tablet:** Sidebar collapses to icons-only or hidden drawer, 16px margins.
  - **Mobile:** Single column flow, 12px margins, compact component variants triggered.

## Elevation & Depth

This design system rejects shadows and traditional elevation metaphors. Instead, it uses **Tonal Layering** and **Structural Outlines** to define hierarchy.

- **Surface Definition:** All containers and cards use a solid white background (#FFFFFF) against the off-white (#FAF8FF) page background.
- **Borders:** Hierarchy is created via 1px solid borders in #F3E8FF (Tint).
- **Active States:** Selection or focus is indicated by a weight change in the border (2px) or a background shift to the Tint color, never by a shadow.
- **Modals:** Pop-overs and menus use a slightly darker border (#C77DFF) to distinguish them from the base page layer.

## Shapes

The shape language is friendly but structured. A consistent corner radius of **16px** is applied to all primary containers (Cards, Modals, Section Blocks). 

- **Cards:** 16px radius.
- **Buttons & Inputs:** 8px radius to provide a slight visual distinction from the larger containers they sit within.
- **Icons:** Enclosed in circles or 8px rounded squares when used as decorative backgrounds.

## Components

### Buttons
- **Primary:** Solid #7B2CBF with white text. No shadow. 8px radius.
- **Secondary:** White background with #7B2CBF border and text.
- **Tertiary/Ghost:** No border, #7B2CBF text, Tint background on hover.

### Cards
- White background, 1px #F3E8FF border, 16px radius. 
- Headers within cards should have a subtle bottom border of 1px #F3E8FF.

### Inputs & Form Elements
- **Input Fields:** 1px #F3E8FF border, 8px radius, 13px text. Focus state uses 2px #7B2CBF border.
- **Checkboxes/Radios:** Primary #7B2CBF for checked states.

### Icons
- Use **Lucide-style** line icons.
- Standard size: 18px for primary actions, 16px for secondary/inline metadata.
- Stroke width: 2px for clarity at small sizes.

### Data Tables
- Header background: #FAF8FF.
- Row borders: 1px #F3E8FF (horizontal only).
- Cell padding: 12px vertical, 16px horizontal.

### Chips/Badges
- Small, 4px radius or fully rounded (pill).
- Backgrounds use 10% opacity of the status color (e.g., Teal) with 100% opacity text of the same color.