# Plan: Replace hand-rolled UI with canonical shadcn components

**Audience:** an implementing LLM/engineer. Execute phases in order. Each task
has explicit acceptance criteria. Do not batch phases — verify after each.

> **Goal:** every reusable UI element in the app comes from a canonical shadcn
> (base-ui / `base-nova`) primitive in **one** `ui` directory. No hand-rolled
> `<button>`/`<input>`/card/badge/alert/skeleton markup where a primitive
> exists, and no duplicate/shadowed primitive files.

---

## 0. Facts you must know before touching anything

- **shadcn variant:** `components.json` has `"style": "base-nova"`. Primitives
  are built on `@base-ui/react`, **not** Radix. `"rtl": true` is set, so the
  CLI emits RTL-aware (logical-property) classes — keep it that way.
- **Path resolution is the core hazard.** `tsconfig.json` has
  `"@/*": ["./src/*", "./*"]`. TypeScript/Next try **`src/` first**, then repo
  root. So `@/components/ui/x` → `src/components/ui/x.tsx` **if it exists**,
  otherwise `components/ui/x.tsx` (root).
- **There are currently TWO `ui` directories** — this is the mess to fix:
  - `src/components/ui/` → **canonical shadcn** so far: `select.tsx`,
    `radio-group.tsx`. These WIN for the `@/` alias.
  - `components/ui/` (repo root) → **hand-rolled minimal** wrappers: `alert`,
    `badge`, `button`, `card`, `dropdown-menu`, `input`, `label`, `select`,
    `sheet`, `skeleton`, `sonner`.
  - `components/ui/select.tsx` (root) is **dead/shadowed** — the `@/` alias
    never resolves to it because `src/components/ui/select.tsx` exists. It even
    has an incompatible API (`SelectPopup`/`SelectList` vs the canonical
    `SelectContent`/`SelectGroup`). It must be deleted, not merged.
- **`npm run build` is the real gate** (typecheck + lint). There is also
  `npx tsc --noEmit`, `npx vitest run` (150 tests today), and `npx eslint`.
- **Non-negotiables from `CLAUDE.md`:** RTL-first (no `ml-/mr-/left-/right-`,
  use `ms/me/ps/pe/start/end`); every UI PR checked in both AR and EN; no
  hardcoded user-facing strings (all via `next-intl`).

### The one decision to confirm

**Canonical `ui` location = `src/components/ui/`.** Rationale: the canonical
shadcn components already live there and win the alias; the shadcn CLI, reading
`components.json` + tsconfig, writes there naturally; `CLAUDE.md`'s target
layout is `src/`-based. **This plan deletes the root `components/ui/`
directory** once each component is migrated. If the maintainer instead wants
root as canonical, invert every "move to `src/components/ui`" instruction and
delete `src/components/ui` — but do not leave both.

---

## Phase 1 — Consolidate primitives into `src/components/ui/` (canonical)

For **each** primitive below, regenerate the canonical shadcn version into
`src/components/ui/`, then delete the root duplicate. Regenerate with:

```bash
npx shadcn@latest add <name> --overwrite
```

Confirm the file was written to `src/components/ui/<name>.tsx` (NOT root). If
the CLI writes to root, move it: `git mv components/ui/<name>.tsx src/components/ui/<name>.tsx`.
After each component, delete the now-stale root file if the CLI didn't, and run
`npx tsc --noEmit`.

### 1a. Low-risk primitives (canonical API is a superset — consumers unaffected)

Do these first; they should need **zero consumer edits**.

| Component | CLI name | Root file to delete | Importers to leave untouched |
|---|---|---|---|
| Button | `button` | `components/ui/button.tsx` | `app/page.tsx:1`, `course-card-actions.tsx:4`, `course-list.tsx:4`, `create-course-sheet.tsx:13`, `edit-course-sheet.tsx:13`, `empty-state.tsx:3` |
| Input | `input` | `components/ui/input.tsx` | `course-form.tsx:5`, `price-input.tsx:3` |
| Label | `label` | `components/ui/label.tsx` | `course-form.tsx:6`, `curriculum-picker.tsx:4`, `price-input.tsx:4` |
| Card | `card` | `components/ui/card.tsx` | `course-card.tsx:2`, `empty-state.tsx:2` |
| Badge | `badge` | `components/ui/badge.tsx` | `course-card.tsx:3` |
| Skeleton | `skeleton` | `components/ui/skeleton.tsx` | `course-list.tsx:2`, `create-course-sheet.tsx:12`, `edit-course-sheet.tsx:12` |
| Sonner/Toaster | `sonner` | `components/ui/sonner.tsx` | `app/layout.tsx:3` |

**Note (Card):** canonical Card adds `CardTitle`, `CardDescription`,
`CardAction`. Existing importers only use `Card/CardHeader/CardContent/CardFooter`
— still exported, so no break. You may optionally adopt `CardTitle`/
`CardDescription` in `course-card.tsx` for semantics, but that's not required
here.

**Acceptance (1a):** `npx tsc --noEmit` clean; `npx vitest run` = all pass;
root files above deleted; the seven components exist only in
`src/components/ui/`.

### 1b. API-changing primitives (reconcile consumers)

These hand-rolled versions have thinner APIs than canonical shadcn. Regenerate,
then **verify prop/export names against the freshly generated file** and fix
consumers.

#### Select — mostly done, just clean up
- Canonical `src/components/ui/select.tsx` already exists and is correct.
- **Action:** delete the dead root `components/ui/select.tsx`. Nothing else.
- Sole consumer `curriculum-picker.tsx` already uses the canonical API
  (`Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem`)
  and passes `items={...}` to `<Select>` (needed so the trigger renders the
  selected **label**, not the raw id — base-ui `Select.Value` requires it).
  Leave it as-is.
- **Acceptance:** `git rm components/ui/select.tsx`; app still builds; opening
  the create-course sheet and picking subject/grade/stream shows names.

#### Radio Group — already canonical
- `src/components/ui/radio-group.tsx` exists and is canonical. No root
  duplicate exists. **No action** beyond confirming `course-form.tsx:7` still
  resolves.

#### Dropdown Menu
- Regenerate `dropdown-menu` into `src/components/ui/`. Delete
  `components/ui/dropdown-menu.tsx`.
- Consumers: `course-card-actions.tsx:6-9`
  (`DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger`)
  and `publish-toggle.tsx:5` (`DropdownMenuItem`).
- **Reconcile:** confirm the canonical file still exports those 4 names.
  Verify `DropdownMenuContent`'s alignment prop — the hand-rolled version took
  `align="end"` (`course-card-actions.tsx:37`); the canonical base-ui version
  may expose `align`/`side` on the content wrapper or expect them on a
  positioner. Adjust the call site to match the generated signature.
- Confirm `DropdownMenuTrigger` still accepts `render={<Button.../>}`
  (`course-card-actions.tsx:34-36`) — base-ui uses the `render` prop for
  as-child; it should.
- **Acceptance:** the `⋮` menu on a course card opens, "Edit" and the
  publish toggle work, in both AR and EN.

#### Sheet
- Regenerate `sheet` into `src/components/ui/`. Delete `components/ui/sheet.tsx`.
- Consumers: `create-course-sheet.tsx:6-10` and `edit-course-sheet.tsx:6-10`
  (`Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger`).
- **Reconcile:** confirm those exports exist and that `SheetContent` still
  accepts `side="right"` (`create-course-sheet.tsx`). Canonical shadcn sheet
  usually also ships `SheetDescription`/`SheetFooter`/`SheetClose` — optional
  to adopt. If the generated `Sheet` requires `open`/`onOpenChange` typing
  different from today's, update the call sites.
- **Acceptance:** create-course and edit-course sheets open, submit, and close;
  the built-in close (X) works.

#### Alert
- Regenerate `alert` into `src/components/ui/`. Delete `components/ui/alert.tsx`.
- Consumer: `course-list.tsx:3` (`Alert, AlertDescription`). Canonical adds
  `AlertTitle` (not required by the current consumer).
- **Add a `success` variant.** `forgot-password-form.tsx:26` renders a success
  notice (`border-success/20 bg-success-tint`) as raw markup — Phase 3 will
  convert it to `<Alert variant="success">`, so extend the generated
  `alertVariants` cva with a `success` variant now:
  ```ts
  success: "border-success/20 bg-success-tint text-success [&>svg]:text-success",
  ```
  (Match the token names actually used in `app/globals.css`.)
- **Acceptance:** `course-list` error state still renders; `Alert` exports a
  `success` variant.

**Acceptance (Phase 1 overall):** root `components/ui/` directory is **empty
and deleted**; `npx tsc --noEmit` clean; `npx eslint .` clean; `npx vitest run`
all pass.

---

## Phase 2 — Add primitives that don't exist yet

Two hand-rolled patterns have **no** primitive. Add them, then Phase 4 swaps
consumers onto them.

- **Avatar:** `npx shadcn@latest add avatar` → `src/components/ui/avatar.tsx`
  (`Avatar, AvatarImage, AvatarFallback`). Used for initials circles.
- **Table:** `npx shadcn@latest add table` → `src/components/ui/table.tsx`
  (`Table, TableHeader, TableBody, TableRow, TableHead, TableCell`). Used for
  the dashboard activity table.

**Acceptance:** both files exist under `src/components/ui/`; `npx tsc --noEmit`
clean. No consumers yet.

---

## Phase 3 — Replace raw interactive HTML with primitives

Swap each raw element for the primitive. Preserve every `aria-*`, `onClick`,
`type`, `name`, form binding, and i18n string. Keep RTL logical classes.

### 3a. Raw `<button>` → `<Button>`
Pick `variant`/`size` to match existing styling (icon buttons →
`variant="ghost" size="icon"`; primary CTAs → default; text links →
`variant="link"`). Files/lines:

- `src/features/shell/components/topbar.tsx:34` (help), `:42` (notifications)
- `src/features/shell/components/theme-toggle.tsx:60`
- `src/features/shell/components/locale-toggle.tsx:22`
- `src/features/shell/components/notification-bell.tsx:10`
- `src/features/shell/components/logout-button.tsx:57`
- `src/features/shell/components/placeholder.tsx:52` (retry)
- `src/features/dashboard/components/overview.tsx:67` (date range), `:74`
  (create course), `:271` (view all → `variant="link"`), `:316` (generate report)
- `src/features/auth/components/sign-in-form.tsx:87` (`type="submit"`)
- `src/features/auth/components/sign-up-form.tsx:100` (`type="submit"`)
- `src/features/auth/components/forgot-password-form.tsx:74` (`type="submit"`)
- `src/features/auth/components/reset-password-form.tsx:59` (`type="submit"`)

> Auth submit buttons often show a pending state — preserve any
> `useFormStatus`/`disabled`/spinner logic when wrapping in `<Button>`.

### 3b. Raw `<input>`/`<label>` → `<Input>` / `<Label>`
- `src/features/shell/components/topbar.tsx:22` — search `<input type="search">`
  → `<Input type="search" .../>`.
- `src/features/auth/components/auth-field.tsx:31` — `<input>` → `<Input>`, and
  its `<label>` at `:25` → `<Label>`. This is the shared auth field, so this one
  change propagates to all auth forms — verify each still renders and validates.

**Do NOT touch** hidden inputs (`sign-in-form.tsx:44-45`, `sign-up-form.tsx:25`,
`forgot-password-form.tsx:41`, `reset-password-form.tsx:25-26`) or semantic nav
`<ul>` (`sidebar.tsx:61`, `overview.tsx:279`).

**Acceptance (Phase 3):** every listed element uses the primitive; visuals
unchanged in AR and EN; auth forms still submit and show validation/pending
states; `npx tsc --noEmit` + `vitest` + `eslint` clean.

---

## Phase 4 — Replace hand-rolled visual components

Swap markup for the matching primitive; keep all content, i18n, `data-*`, and
RTL classes. Verify each visually in both directions.

### 4a. Card wrappers → `<Card>`/`<CardHeader>`/`<CardContent>`
- `src/features/dashboard/components/overview.tsx:156` (StatCard `<article>`),
  `:233` (PerformanceCard), `:266` (TopPerformingCard), `:350`
  (StudentActivityCard)
- `src/features/auth/components/auth-shell.tsx:38`
- `src/features/course-management/components/course-list.tsx:54` (skeleton card
  wrapper — wrap in `<Card>` or leave if it complicates the skeleton; prefer
  `<Card>` for consistency)

### 4b. Pills → `<Badge>` (choose/add matching variants)
- `src/features/dashboard/components/overview.tsx:197`, `:208`, `:217`
  (TrendBadge up/new/stable) and `:391` (status pill in activity table).
- If up/down/stable colors don't map to existing Badge variants, extend
  `badgeVariants` cva with `success`/`warning`/`muted` variants rather than
  inline classes.

### 4c. Notice boxes → `<Alert>`
- `src/features/auth/components/auth-error.tsx:17` → `<Alert variant="destructive"><AlertDescription>…`
- `src/features/auth/components/forgot-password-form.tsx:26` → `<Alert variant="success">` (variant added in Phase 1b).

### 4d. Initials circles → `<Avatar><AvatarFallback>` (primitive from Phase 2)
- `src/features/dashboard/components/overview.tsx:376`
- `src/features/shell/components/sidebar.tsx:113`
- `src/features/shell/components/account-menu.tsx:24`, `:37`

### 4e. `animate-pulse` blocks → `<Skeleton>`
- `src/features/shell/components/placeholder.tsx:31-33`
- `src/features/dashboard/components/chart-loader.tsx:11-13`, `:24-26`
  (acceptable to keep as a `dynamic()` loader, but prefer `<Skeleton>` for
  consistency)

### 4f. Hand-built table → `<Table>` set (primitive from Phase 2)
- `src/features/dashboard/components/overview.tsx:354-402` — the
  `role="table"`/`role="row"`/`role="cell"` grid → `Table/TableHeader/TableBody/
  TableRow/TableHead/TableCell`. Preserve the status badge (4b) and avatar (4d)
  inside cells.

### 4g. `<details>` dropdown → `<DropdownMenu>`
- `src/features/shell/components/account-menu.tsx:22-49` — the `<details>/<summary>`
  disclosure + popover panel (`:33`) is a re-implemented dropdown. Replace with
  `DropdownMenu/DropdownMenuTrigger/DropdownMenuContent/DropdownMenuItem`.
  Trigger renders the avatar; items are the account actions. Keep keyboard a11y
  (the primitive provides it).

**Acceptance (Phase 4):** no `rounded-*/border/animate-pulse` ad-hoc card/pill/
skeleton wrappers remain in the listed files; dashboard, sidebar, account menu,
and auth screens render identically (or better) in AR and EN; all checks clean.

---

## Final verification (run after every phase, and at the end)

```bash
npx tsc --noEmit          # clear .next/types first if it references deleted routes: rm -rf .next/types
npx eslint .              # 0 errors
npx vitest run            # 150 tests pass (update snapshots/queries only if a test asserts old markup)
npm run build             # the real gate
```

Then **drive the app** (see the project `/run` flow):
- Sign in (real backend on `:8001`).
- `/en/courses` → Create → pick subject/grade/stream (names show) → Save.
- Course card `⋮` menu → Edit + publish toggle.
- Dashboard overview: stat cards, trend badges, activity table, avatars.
- Account menu (top-right) opens and its items work.
- Repeat a spot-check in `/ar/...` to confirm RTL.

---

## Risks & gotchas

1. **Directory shadowing.** Until the root `components/ui/` is fully deleted,
   a component existing in both dirs silently resolves to `src/`. Delete root
   duplicates as you go; don't leave halves.
2. **Stale Next types.** Deleting files can leave `.next/types` referencing
   them and fail `tsc`. `rm -rf .next/types` and re-run.
3. **`items` prop on Select.** Keep passing `items` to `<Select>` in
   `curriculum-picker.tsx`; without it base-ui renders the raw value id, not the
   label. This is a real regression if dropped.
4. **CLI overwrites.** `--overwrite` replaces the whole file. If any root
   primitive had a bespoke tweak worth keeping, diff before deleting. (Reviewed:
   the hand-rolled ones are strict subsets — nothing unique to preserve except
   the Alert `success` variant, handled in 1b.)
5. **Tests asserting markup.** A few `__tests__` query by role/text. If a swap
   changes the accessible role (e.g. `<article>`→Card `<div>`), update the test
   query, not the component, to keep behavior honest.
6. **RTL.** The CLI emits logical props with `"rtl": true`; if you hand-edit,
   never introduce physical `ml/mr/left/right`.
7. **Poisoned `max-w-sm/md/lg` tokens (IMPORTANT).** `app/globals.css` defines a
   named spacing scale (`--spacing-sm: 8px`, `--spacing-md: 12px`,
   `--spacing-lg: 16px`, …) for `p-*`/`gap-*`/`m-*`. In Tailwind v4 the
   `--spacing-*` namespace also feeds `max-w-*`, so these named keys **shadow
   the container scale**: `max-w-sm` → **8px** (not 24rem), `max-w-md` → 12px,
   etc. Any freshly generated shadcn component that sizes itself with
   `max-w-sm/md/lg` (sheet, dialog, drawer, popover, alert-dialog, command…)
   will **collapse**. After adding each such component, replace token widths
   with arbitrary values, e.g. `sm:max-w-[28rem]`. The spacing scale can't be
   removed (the dashboard uses `p-md`/`p-lg`), so treat `max-w-<name>` as
   unusable and always use `max-w-[<rem>]`. (Already applied to
   `src/components/ui/sheet.tsx`; the create-course/edit-course sheets depend
   on it.)

---

## Suggested commit sequence (one PR per phase, or per checklist group)

1. `chore(ui): consolidate primitives into src/components/ui, delete root duplicates` (Phase 1)
2. `feat(ui): add Avatar and Table primitives` (Phase 2)
3. `refactor(shell,auth,dashboard): use Button/Input/Label primitives` (Phase 3)
4. `refactor(dashboard,shell,auth): use Card/Badge/Alert/Avatar/Table/DropdownMenu` (Phase 4)
