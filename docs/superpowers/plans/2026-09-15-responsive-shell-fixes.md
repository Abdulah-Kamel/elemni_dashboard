# Responsive Shell Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix responsive shell layout issues: mobile viewport sizing, safe-area padding for fixed bottom nav, touch targets, and label overflow.

**Architecture:** Replace `h-screen` with `h-dvh` (dynamic viewport height) for mobile-safe sizing; add bottom padding to main content to avoid overlap with fixed bottom nav; ensure bottom-nav items have minimum 44px touch targets and labels truncate at narrow widths; preserve RTL and desktop sidebar behavior.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, next-intl, vitest, @testing-library/react

**Spec:** N/A (approved fixes with clear requirements)

## Global Constraints

- Preserve current visual system (design tokens, colors, spacing)
- Preserve RTL behavior (DirectionProvider, `start-0` positioning)
- Preserve desktop sidebar behavior (hidden on mobile, visible on md+)
- Do not modify topbar.tsx or unrelated files
- Do not commit changes

---

## Task 1: Update Layout Files for Mobile-Safe Viewport Sizing

**Files:**
- Modify: `app/[locale]/(teacher)/layout.tsx:45-58`
- Modify: `app/[locale]/(admin)/layout.tsx:41-57`

**Interfaces:**
- Consumes: None
- Produces: Updated layout structure with mobile-safe viewport and bottom-nav spacing

- [ ] **Step 1: Update teacher layout**

Replace `h-screen` with `h-dvh` and add bottom padding to main content area:

```tsx
// app/[locale]/(teacher)/layout.tsx
// Line 45: Change flex container
<div className="flex h-dvh overflow-hidden bg-page">
  <Sidebar teacherName={user.name} teacherRole={teacherRole} />
  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
    <Topbar teacherName={user.name} />
    <main className="flex-1 overflow-auto pb-20 md:pb-0">
      <ChapterNavigationProvider>
        <div className="teacher-content-shell mx-auto w-full max-w-7xl animate-fade-in px-container-margin py-xl">
          {children}
        </div>
      </ChapterNavigationProvider>
    </main>
  </div>
  <MobileBottomNav />
</div>
```

- [ ] **Step 2: Update admin layout**

Apply same changes to admin layout:

```tsx
// app/[locale]/(admin)/layout.tsx
// Line 41: Change flex container
<div className="flex h-dvh overflow-hidden bg-page">
  <Sidebar
    teacherName={user.name}
    teacherRole={t("admin_role")}
    userRole={user.role}
  />
  <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
    <Topbar teacherName={user.name} userRole={user.role} />
    <main className="flex-1 overflow-auto pb-20 md:pb-0">
      <div className="mx-auto w-full max-w-7xl animate-fade-in px-container-margin py-xl">
        {children}
      </div>
    </main>
  </div>
  <MobileBottomNav userRole={user.role} />
</div>
```

- [ ] **Step 3: Verify changes compile**

Run: `npm run typecheck`
Expected: PASS

---

## Task 2: Fix Mobile Bottom Nav Touch Targets and Label Overflow

**Files:**
- Modify: `src/features/shell/components/mobile-bottom-nav.tsx:52-72`

**Interfaces:**
- Consumes: None
- Produces: Updated MobileBottomNav with proper touch targets and overflow handling

- [ ] **Step 1: Update bottom nav styling**

Update the nav container and item styles for better touch targets and overflow handling:

```tsx
// src/features/shell/components/mobile-bottom-nav.tsx
// Line 52: Update nav container
<nav className="fixed start-0 bottom-0 z-50 flex w-full items-center justify-around border-t border-border bg-surface px-1 py-1 shadow-lg md:hidden safe-area-bottom">
  {navItems.map(({ id, href, icon: Icon }) => {
    const isActive = href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
    return (
      <Link
        key={id}
        href={href as never}
        className={cn(
          "flex min-h-11 min-w-11 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-colors",
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-on-surface-muted hover:text-foreground"
        )}
      >
        <Icon className="size-5 shrink-0" aria-hidden="true" />
        <span className="max-w-[48px] truncate text-[10px] font-semibold leading-tight">{tNav(id)}</span>
      </Link>
    )
  })}
  {userRole === "ADMIN" && <Sheet><SheetTrigger className="flex min-h-11 min-w-11 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-on-surface-muted"><MoreHorizontal className="size-5" /><span className="max-w-[48px] truncate text-[10px] font-semibold leading-tight">{tNav("more")}</span></SheetTrigger><SheetContent side="bottom" className="rounded-t-2xl"><SheetHeader><SheetTitle>{tNav("catalog")}</SheetTitle></SheetHeader><div className="grid gap-2 p-4">{ADMIN_MORE_NAV.map(({ id, href, icon: Icon }) => <Link key={id} href={href as never} className="flex items-center gap-3 rounded-xl bg-surface-muted p-3 font-medium"><Icon className="size-5 text-primary" />{tNav(id)}</Link>)}</div></SheetContent></Sheet>}
</nav>
```

- [ ] **Step 2: Verify changes compile**

Run: `npm run typecheck`
Expected: PASS

---

## Task 3: Verify Sidebar RTL Behavior Preserved

**Files:**
- Read only: `src/features/shell/components/sidebar.tsx`

**Interfaces:**
- Consumes: None
- Produces: Verification that sidebar RTL behavior is unchanged

- [ ] **Step 1: Verify sidebar uses RTL-compatible classes**

Check that sidebar uses `border-e` (logical property) instead of `border-r`/`border-l`, and `start-0`/`end-0` instead of `left-0`/`right-0`.

The sidebar already uses:
- `border-e` (line 100) - correct for RTL
- Hidden on mobile, visible on `md:` (line 100) - correct
- No position-based RTL issues

- [ ] **Step 2: No changes needed**

Sidebar RTL behavior is already correct. No modifications required.

---

## Task 4: Add Focused Tests for Mobile Bottom Nav

**Files:**
- Create: `src/features/shell/components/mobile-bottom-nav.test.tsx`

**Interfaces:**
- Consumes: MobileBottomNav component
- Produces: Test file with touch target and overflow tests

- [ ] **Step 1: Create test file**

```tsx
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { MobileBottomNav } from "./mobile-bottom-nav"

vi.mock("next-intl", () => ({
  useTranslations: vi.fn().mockReturnValue((key: string) => {
    const messages: Record<string, string> = {
      overview: "Overview",
      my_courses: "My Courses",
      students: "Students",
      earnings: "Earnings",
      profile: "Profile",
      storage: "Storage",
      settings: "Settings",
      more: "More",
      catalog: "Catalog",
      teachers: "Teachers",
      subscriptions: "Subscriptions",
      coupons: "Coupons",
      grades: "Grades",
      streams: "Streams",
      subjects: "Subjects",
    }
    return messages[key] ?? key
  }),
}))

vi.mock("@/i18n/routing", () => ({
  Link: ({ href, className, children, ...props }: any) => (
    <a href={href} className={className} {...props}>
      {children}
    </a>
  ),
  usePathname: vi.fn().mockReturnValue("/dashboard"),
}))

describe("MobileBottomNav", () => {
  it("renders all teacher nav items", () => {
    render(<MobileBottomNav />)

    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getByText("My Courses")).toBeInTheDocument()
    expect(screen.getByText("Students")).toBeInTheDocument()
    expect(screen.getByText("Earnings")).toBeInTheDocument()
    expect(screen.getByText("Profile")).toBeInTheDocument()
    expect(screen.getByText("Storage")).toBeInTheDocument()
    expect(screen.getByText("Settings")).toBeInTheDocument()
  })

  it("has minimum touch target size of 44px", () => {
    render(<MobileBottomNav />)

    const links = screen.getAllByRole("link")
    links.forEach((link) => {
      expect(link.className).toContain("min-h-11")
      expect(link.className).toContain("min-w-11")
    })
  })

  it("truncates long labels", () => {
    render(<MobileBottomNav />)

    const labels = screen.getAllByText(/(Overview|My Courses|Students|Earnings|Profile|Storage|Settings)/)
    labels.forEach((label) => {
      expect(label.className).toContain("truncate")
      expect(label.className).toContain("max-w-\\[48px\\]")
    })
  })

  it("renders admin nav items when userRole is ADMIN", () => {
    render(<MobileBottomNav userRole="ADMIN" />)

    expect(screen.getByText("Overview")).toBeInTheDocument()
    expect(screen.getByText("Teachers")).toBeInTheDocument()
    expect(screen.getByText("Students")).toBeInTheDocument()
    expect(screen.getByText("Subscriptions")).toBeInTheDocument()
    expect(screen.getByText("Coupons")).toBeInTheDocument()
    expect(screen.getByText("More")).toBeInTheDocument()
  })

  it("hides on md+ screens", () => {
    render(<MobileBottomNav />)

    const nav = screen.getByRole("navigation")
    expect(nav.className).toContain("md:hidden")
  })
})
```

- [ ] **Step 2: Run tests**

Run: `npm run test -- src/features/shell/components/mobile-bottom-nav.test.tsx`
Expected: PASS

---

## Task 5: Run Full Typecheck and Lint

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: All changes from Tasks 1-4
- Produces: Verification that all changes compile and pass lint

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Run all shell tests**

Run: `npm run test -- src/features/shell/`
Expected: PASS

---

## Summary of Changes

**Files Modified:**
1. `app/[locale]/(teacher)/layout.tsx` - Changed `h-screen` to `h-dvh`, added `pb-20 md:pb-0` to main
2. `app/[locale]/(admin)/layout.tsx` - Changed `h-screen` to `h-dvh`, added `pb-20 md:pb-0` to main
3. `src/features/shell/components/mobile-bottom-nav.tsx` - Added `min-h-11 min-w-11` for touch targets, `max-w-[48px] truncate` for labels, `safe-area-bottom` class

**Files Created:**
1. `src/features/shell/components/mobile-bottom-nav.test.tsx` - Tests for touch targets, label overflow, and responsive behavior

**Key Changes:**
- `h-screen` → `h-dvh` for mobile-safe viewport height
- `pb-20 md:pb-0` on main to prevent content hiding behind fixed bottom nav
- `min-h-11 min-w-11` on nav items for 44px minimum touch targets
- `max-w-[48px] truncate` on labels to prevent overflow at narrow widths
- `safe-area-bottom` class on nav for iOS safe area support
- Preserved RTL behavior (using `start-0` and logical properties)
- Preserved desktop sidebar behavior (hidden on mobile, visible on md+)
