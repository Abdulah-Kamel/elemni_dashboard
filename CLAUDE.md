# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

Package manager: **npm**. Node scripts (`package.json`):

```bash
npm run dev      # start dev server (Next 16, http://localhost:3000)
npm run build    # production build — the real typecheck + lint gate
npm run start    # serve the production build
npm run lint     # ESLint (flat config: core-web-vitals + typescript)
```

- **No test runner is wired up yet.** The "Testing" section below describes the
  intended stack (Vitest · MSW · Playwright) — none of it is installed or
  scripted. Adding tests means adding the dependency and an npm script first;
  don't assume `npm test` exists.
- No standalone typecheck script. `tsc` runs via `next build` and the editor;
  `tsconfig.json` is `strict`. Path alias: `@/*` → repo root (e.g.
  `@/app/...`). Note the alias is root-relative, **not** `src`-relative —
  reconcile this if/when the `src/` layout below is adopted.
- **Read the bundled docs before writing Next.js code.** This is Next.js
  **16.2.10** with React 19; APIs differ from older training data. Guides live
  in `node_modules/next/dist/docs/` (`01-app`, `03-architecture`, …), as
  `AGENTS.md` insists.

## Current state vs. target

**The repo is currently a fresh Create Next App**, not the architecture
described below. What actually exists today: `app/layout.tsx`, `app/page.tsx`,
`app/globals.css` (Tailwind v4 via `@tailwindcss/postcss`), and default config.
There is **no** `src/`, no `features/`, no `lib/api/`, no next-intl, no zod, no
BFF routes, no `[locale]` segment — yet.

Everything from "Elemni Web — Project Instructions" onward is the **intended
design**, not a map of existing files. Treat it as the spec to build toward:
when you add the first real feature, create the structure it prescribes rather
than extending the CNA boilerplate. Don't cite a path from it as if the file
already exists — check first.

---

# Elemni Web — Project Instructions

Frontend for Elemni, an LMS for Egyptian teachers. Teachers upload video
lessons, organize them by subject/grade/stream, protect them with DRM, and sell
them to students via subscription tiers + per-transaction commission.

**This repo is the frontend only.** All business logic, persistence, payments,
DRM licensing, and video processing live behind a separate backend API.

**Stack:** Next.js (App Router) · TypeScript strict · Tailwind · next-intl
(AR/EN, RTL-first)

---

## The boundary

This is the single most important thing in this file.

**This repo owns:** rendering, routing, i18n/RTL, form UX, client state,
optimistic UI, accessibility, performance, and being a trustworthy proxy for
the browser.

**This repo does NOT own:** business rules, authorization decisions, money
math, DRM policy, or the source of truth for anything.

If you find yourself writing a rule here — "teachers on the free tier can only
have 50 students", "commission is 5% on Pro" — **stop.** That belongs in the
API. Duplicating it here means two implementations that will disagree, and the
one users can read in a JS bundle is not the authoritative one.

The frontend may *display* a rule the API tells it about. It may *never* be the
rule.

---

## Non-negotiables

1. **Server Components are the default.** `"use client"` needs a reason: state,
   effects, event handlers, browser APIs. Push it as far down the tree as
   possible.
2. **No `fetch()` to the API scattered in components.** Everything goes through
   `src/lib/api/`. One place that knows the base URL, auth, retries, errors,
   and tracing.
3. **Parse every API response at the boundary.** The API is a separate deploy on
   a separate release cycle. Its contract *will* drift from your types. `zod`
   at the edge, typed domain objects inside.
4. **Tokens never touch client-readable storage.** httpOnly, Secure, SameSite
   cookies. No `localStorage`, no `sessionStorage`, no tokens in Redux, no
   tokens in a `NEXT_PUBLIC_` var.
5. **The browser never calls the API directly for anything authenticated.** It
   calls Next; Next calls the API. See "BFF" below.
6. **RTL is the default, not a feature flag.** No `ml-`/`mr-`/`left-`/`right-`.
7. **No hardcoded user-facing strings.** Everything through `next-intl`.

---

## Directory structure

Feature-first, not type-first. Do not create top-level `components/`, `hooks/`,
`utils/` dumping grounds.

```
src/
  app/                          # ROUTING ONLY — thin
    [locale]/
      (marketing)/              # landing, pricing — static, no auth
      (auth)/                   # login, signup, reset
      (teacher)/                # teacher dashboard — role-gated layout
        dashboard/
        lessons/
        students/
        analytics/
        billing/
      (student)/
        courses/
        watch/[lessonId]/
      layout.tsx
    api/                        # BFF ONLY — see below
      auth/[...]/route.ts       # login/refresh/logout, sets httpOnly cookies
      proxy/[...path]/route.ts  # authenticated passthrough where needed
  features/                     # domain-shaped UI + data access
    lessons/
      components/
      actions.ts                # "use server" — mutations, call the API
      queries.ts                # server-side reads, call the API
      schema.ts                 # zod: API response shapes + form shapes
      types.ts
    curriculum/
    enrollment/
    billing/
    player/                     # video player + DRM client integration
    analytics/
  lib/
    api/
      client.ts                 # the ONE fetch wrapper
      errors.ts                 # ApiError taxonomy
      endpoints.ts              # typed endpoint map
    auth/
      session.ts                # read session server-side
      guards.ts                 # requireTeacher(), requireStudent()
  components/ui/                # primitives ONLY: Button, Input, Dialog, Card
  i18n/
    messages/{ar,en}.json
  styles/
  env.ts                        # zod-validated env, throws at boot
```

**Rule of thumb:** used by one feature → lives in that feature. Promote to
shared on the third usage, not the second.

---

## The API client

One wrapper. Everything else goes through it.

```ts
// src/lib/api/client.ts
import "server-only";

export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit & { tags?: string[]; revalidate?: number },
): Promise<T> {
  const res = await fetch(`${env.API_URL}${path}`, {
    ...init,
    headers: { ...authHeaders(), "Accept-Language": locale, ...init?.headers },
    next: { tags: init?.tags, revalidate: init?.revalidate },
  });

  if (!res.ok) throw await toApiError(res);   // typed, never a raw throw
  return schema.parse(await res.json());      // contract enforced HERE
}
```

Requirements:

- `import "server-only"` on this module. A leaked import into a client bundle
  becomes a build error instead of an exposed token.
- **Timeouts on every call.** `AbortSignal.timeout()`. A hung API must not hang
  a Server Component render — it will hold the connection until the platform
  kills it.
- Retry idempotent GETs only, with backoff. **Never auto-retry a POST** — that
  is how a student gets charged twice.
- Forward `Accept-Language` so the API returns localized errors.
- Forward a request ID for tracing across the boundary. Debugging a
  frontend/backend split without correlation IDs is misery.
- Map API errors to a typed taxonomy: `Unauthorized`, `Forbidden`,
  `NotFound`, `Validation`, `RateLimited`, `Conflict`, `Upstream`. Components
  branch on the type, never on a status number or a message string.

### Types

If the API ships an OpenAPI schema, **generate types from it in CI** and fail
the build on drift. That is far better than hand-written types that silently
lie. Still zod-parse at runtime — generated types describe the contract, not
what the server actually sent today.

If there's no OpenAPI spec, ask for one. Hand-maintaining two type definitions
across two repos is a slow-motion outage.

---

## BFF: why the browser never calls the API directly

The browser holds an httpOnly cookie for **this** origin. It cannot attach a
bearer token to a cross-origin API call without that token being readable by
JS — which means readable by any XSS. So:

- **Reads:** Server Components call the API server-side with the session. The
  browser gets HTML, not credentials.
- **Mutations:** Server Actions call the API server-side. Same story.
- **Client-side interactive reads** (search-as-you-type, polling, infinite
  scroll): call a Next route handler under `app/api/proxy/`, which attaches
  credentials server-side and forwards.

The `app/api/` directory exists **only** for this. It is not a place for
business logic. A route handler here should be: read session → forward →
return. If one grows a branch that decides something, it's in the wrong repo.

---

## Server Actions

```ts
"use server";

export async function createLesson(input: unknown) {
  const session = await requireTeacher();            // 1. gate
  const data = createLessonSchema.parse(input);      // 2. shape check (UX)
  const lesson = await lessonsApi.create(session, data); // 3. API decides
  revalidateTag(`lessons:${session.userId}`);        // 4. invalidate
  return { ok: true, lesson };
}
```

- Step 1 is a **UX gate, not security.** It stops a logged-out user seeing a
  confusing error. The API still authorizes independently — assume this check
  doesn't exist.
- Step 2 is **shape validation for fast feedback**, not trust. The API
  revalidates everything.
- **Never return raw API errors to the client.** Map to typed codes; let the UI
  render a localized message.
- Server Actions are public HTTP endpoints. Anyone can call them with any
  payload. They are not "internal functions."

---

## Caching

Be explicit. Next's defaults shift between versions; don't rely on them.

| Data | Strategy |
|---|---|
| Marketing / pricing pages | static, ISR |
| Curriculum tree (subject/grade/stream) | `revalidate: 3600`, tag `curriculum` |
| Teacher dashboard | dynamic, tag `lessons:${teacherId}` |
| Student enrollments | dynamic, tag `enrollments:${studentId}` |
| Video playback URLs / DRM tokens | **never cached** |
| Anything with money in it | **never cached** |

Tag naming is scoped per-entity. A broad `lessons` tag means one teacher's
upload revalidates every teacher's dashboard.

**Cache invalidation now spans two systems.** If the API mutates state through
a path this frontend didn't trigger (a webhook, an admin action, a background
job), `revalidateTag` never fires and the UI serves stale data indefinitely.
Either keep TTLs short on anything the backend can change independently, or ask
the API team for a revalidation webhook into this app. Decide deliberately —
don't discover it in production.

---

## Video playback

This repo integrates a player. It does not process, store, or protect video.

- Upload: request a presigned URL from the API, then upload **direct from the
  browser to storage**. Bytes never pass through Next. Show real progress and
  handle resume.
- Lesson status is a state machine from the API:
  `uploading → processing → ready | failed`. Render every state explicitly.
  There is no "assume it worked."
- Playback: fetch a short-lived signed URL per session, server-side, uncached.
  Never render a playback URL into static HTML.
- Player is `dynamic()` imported. It's a large bundle; don't put it in the
  shared chunk.

### DRM — read before touching

The landing page promises encrypted streaming, per-student burned-in
watermarks, device limits, and instant bans on shared logins. Teachers will
test these in week one.

**None of them are enforceable from this repo.**

- License acquisition (Widevine/FairPlay) goes browser → license server. This
  app configures the player; it does not decide policy.
- Device limits are enforced at license issuance, server-side. A client-side
  device check is theater.
- **Forensic watermarking is server-side** — per-session transcode or a
  provider feature. A CSS overlay with the student's name is removed with
  devtools in ten seconds. Do not ship one and call it a watermark.
- Screen recording cannot be fully blocked on Android or desktop browsers. If
  marketing copy claims otherwise, the copy is the bug.

If the API can't back a claim, fix the landing page. Never fake enforcement in
the client — it converts a product gap into a trust incident.

---

## Money

This frontend **displays** money. It never computes it.

- Amounts arrive from the API as **integer piastres**. Format for display with
  `Intl.NumberFormat("ar-EG", { style: "currency", currency: "EGP" })`. Never
  parse to float, never do arithmetic.
- Commission rates, payout totals, tier limits: **rendered from the API
  response**, never calculated locally. A 5% multiply in a React component is a
  bug even when it produces the right number today.
- Checkout: never optimistic. Show a pending state, poll or subscribe for
  confirmation from the API. Fawry and wallet flows are asynchronous and can
  take minutes.
- Never render a "success" state the API hasn't confirmed.

---

## i18n & RTL

- `next-intl`, locale segment `[locale]`, `ar` is the default.
- `<html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>`.
- Tailwind logical properties only: `ms/me`, `ps/pe`, `start/end`,
  `text-start/text-end`. **Add an ESLint rule banning the physical ones** — this
  is not enforceable by review discipline alone.
- Fonts: Cairo (AR), Inter/Poppins (EN) via `next/font`, `display: swap`,
  subset. Arabic webfonts are heavy.
- Arabic-Indic numerals in UI via `Intl.NumberFormat("ar-EG")`; Latin digits in
  IDs, URLs, and code.
- Direction-implying icons (arrows, chevrons) must mirror.
- Every UI PR is checked in both directions before merge.

---

## Performance

Your users are on Egyptian mobile networks. Budget for 3G, not your laptop.

- Ship no client JS for content that doesn't need it.
- `dynamic()` for the player, charts, and any rich editor.
- `next/image` everywhere, explicit dimensions, no CLS.
- If a route's client bundle crosses ~150KB gzipped, justify it in the PR.
- Server Components mean API latency is now render latency. Parallelize
  independent fetches (`Promise.all`), and use `<Suspense>` with real skeletons
  so one slow endpoint doesn't block the page.
- Never waterfall: a fetch in a child that depends on a fetch in a parent is a
  round-trip you're paying for twice.

---

## Testing

- Vitest for units: formatters, RTL helpers, zod schemas, error mapping.
- **MSW for API mocking.** Mock at the network layer, never by stubbing your own
  client — you want the parsing and error paths under test too.
- **Contract tests:** assert your zod schemas against the API's real response
  fixtures. This is the test that catches a backend deploy breaking the
  frontend. Run it in CI against a live staging API.
- Playwright for critical paths: signup → upload → enroll → pay → play. Run in
  both AR and EN.
- Test the failure states: API down, 401 mid-session, slow network, failed
  upload. In a split architecture these aren't edge cases, they're Tuesday.

---

## Conventions

- Files `kebab-case.ts`, components `PascalCase`.
- One zod schema per feature is the source of truth; infer TS types from it,
  never declare both.
- `any` is banned. `unknown` + a parse is the answer.
- No barrel files (`index.ts` re-exports) — they break tree-shaking and create
  cycles.
- Env validated with zod in `src/env.ts`; the app refuses to boot on a missing
  var. `API_URL` is server-only — never `NEXT_PUBLIC_`.
- Errors that reach a user are localized and actionable. "Something went wrong"
  is not acceptable copy in either language.

---

## When working in this repo

- Read the existing feature module before adding to it. Match its patterns.
- New feature → new folder in `src/features/`.
- **If a task seems to require business logic here, say so and stop.** It's
  almost always a missing API endpoint. Adding it to the frontend is the wrong
  fix and it will be wrong twice: once now, once when the API changes.
- If the API is missing something you need, name the endpoint you want and its
  shape. Don't work around it with client-side stitching of three calls.
- Anything touching auth, money, or DRM: explain the flow across both systems
  before writing code.
- If a requirement conflicts with this file, raise it — don't quietly route
  around it.