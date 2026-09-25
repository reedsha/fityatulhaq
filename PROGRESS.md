# 📊 FityatulHaq Public Website (Web 1) — Progress & Survival Guide

> **Last Updated:** 2026-09-26 · **Current Milestone:** M5 Profile Activities + Search + Legal — ✅ **Done** (2026-09-26), all gates green — next: M6 (Web 2 integration) · **Source of Truth:** `Requirement.pdf` (raw text at `requirement_raw.txt`)
>
> **⚠️ THIS FILE IS THE SURVIVAL GUIDE.** Every task, decision, deletion, and deviation must be recorded here. Before touching any file, read the full Milestones section, verify prerequisites, and confirm Definition-of-Done items are satisfied.
>
> **Repo state 2026-09-26:** M0–M2 work plus M2.5 (Batches 1, 1.5, B2, B3 and B4), M3, the D11 debt fix, M4 (webboard) and M5 (profile activities + search + legal) are committed. `AGENTS.md` / `IDENTITY.md` / `SOUL.md` / `USER.md` were **deliberately deleted and committed as deletions** (commit `5c32eeb`, owner decision 2026-09-24) — they are not to be restored. The code-review gate now runs from the repo-root `CODE_REVIEW_SKILL.md`; the old `deep-code-review` skill path is dead and must not be restored. Live DB has 5 migrations applied.

---

## ⚙️ HOW TO RUN

```powershell
# From repo root:
npm install                     # orchestrator (concurrently + sharp)
cd backend && npm install       # Express + Prisma 7
cd ../frontend && npm install   # Next.js 15.5.25 App Router

# Environments (copy examples, NEVER commit):
cd backend; Copy-Item .env.example .env   # DATABASE_URL, JWT_SECRET, SUPABASE_*, SMTP_*
cd ../frontend; Copy-Item .env.example .env.local

# Run both servers:
npm run dev                     # backend → :4000, frontend → :3000

# Verification gates (NON-NEGOTIABLE — all three must pass):
cd frontend; npx tsc --noEmit
cd frontend; npm run build
cd backend; npm run build       # tsc compilation
```

**PowerShell note:** no `&&` chaining between commands — use `;`.

**Stale-cache recovery (blank page, or a page serving a previous version of itself):** `next build` and `next dev` share one `.next` directory. Running either while the other is live, or deleting/renaming a route, can leave compiled output from a previous tree in place — the symptoms are (a) a page rendering an older version of itself, including a long-deleted stub, and (b) `tsc --noEmit` reporting a phantom `TS2307` for a route file that no longer exists. Recovery, in order: stop both servers → `rm -rf frontend/.next frontend/tsconfig.tsbuildinfo` → re-run the three gates → restart `next dev`. Diagnose this in the cache, **not** in source: on 2026-09-23 the source was correct the whole time while `/` served the pre-refactor stub.

---

## 🧭 1. ENVIRONMENT STRATEGY

- **Dev Supabase project:** `kbyruvtdprxtdhtcteju.supabase.co` → DB host `db.kbyruvtdprxtdhtcteju.supabase.co:5432`
- **Prod switch = config swap only.** No code references a project ID anywhere. All Supabase/Postgres config lives in `.env` files:
  - `backend/.env`: ALL secrets — `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=fityatulhaq-assets`, `SMTP_*`
  - `frontend/.env.local`: browser-safe only (`NEXT_PUBLIC_*`, `BACKEND_API_URL`). Never store service-role key here.
- **Auth delivery:** httpOnly cookies via `Set-Cookie`. Frontend never reads raw tokens. Every API request includes `credentials: "include"`. `AuthContext` restores session by calling `GET /auth/me` on mount. No `localStorage` for credentials.
- **Cookie config:** `COOKIE_SAME_SITE=lax` (default), optional `COOKIE_DOMAIN`. `Secure=true` when `NODE_ENV=production` or `sameSite=none`.
- **Bucket name:** `fityatulhaq-assets` (from `SUPABASE_STORAGE_BUCKET` env). Code reads env var → falls back to `"assets"` if unset. Tests may hardcode either value depending on their stub purpose.
- **Next.js version drift:** PRD §10 specifies Next.js 16, current build is 15.5.25. Defer to M7 deployment per your approval. Rationale: upgrading mid-development risks untested React 19 edge cases while building features. Grouping with deployment preparation minimizes risk surface. Use codemod at deploy: `npx @next/codemod upgrade latest`.
- **Switching Dev→Prod effort: ZERO code rework.** Only 3 env variables change (`DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`). Plus dashboard clicks to create bucket and enable public access. Zero hardcoded IDs in source code (verified).

---

## 🗺️ 2. ARCHITECTURE MAP

```
Frontend:    Next.js 15.5.25 App Router (PRD target: 16 — deferred to M7 deployment)
Backend:     Express.js 5 + TypeScript + Prisma 7 ORM
Database:    PostgreSQL (Supabase) — tables: User (role GUEST|MEMBER|CONTENT_MODERATOR), RefreshToken, OtpCode, Post, Comment, Reaction, Report, Notification
Storage:     Supabase Storage (bucket `fityatulhaq-assets`, folder `avatars/`)
Deployment:  Cloudflare Workers (frontend) + Docker (backend) — not yet implemented
Realtime:    Deferred per PRD (§8.2)
Auth:        Custom JWT + httpOnly cookies (NOT NextAuth.js — deliberate choice, see Deviations Ledger)
```

### Current route inventory vs PRD §2.1 sitemap (33 pages)

| # | PRD URL Path | Status | Notes |
|---|-------------|--------|-------|
| `/` | ✅ Implemented | Reference-design landing page (promoted from `/dashboard`): hero, ticker, category cards, news grid, webboard preview, stats — **Public per §5.1.1**: guest hero CTAs (ร่วมเป็นสมาชิก → `/register`, เข้าสู่ระบบ → `/login`), member sees their name; no auth gate |
| `/news` | ✅ Implemented | Dept filter, sort, pagination, keyword search — mock data |
| `/news/[slug]` | ✅ Implemented | SSG detail view |
| `/announcements` | ✅ Implemented | Ref numbers, dates, PDF icon — mock data |
| `/announcements/[slug]` | ✅ Implemented | SSG detail view |
| `/about` | ✅ Implemented | Vision/mission/history |
| `/about/committee` | ✅ Stub | Static committee cards — needs Web 2 sync per §8.2 |
| `/donate` | ✅ Implemented | Bank/PromptPay, QR placeholder, proof-of-transfer form |
| `/contact` | ✅ Implemented | Contact form, map embed, social links |
| `/partners` | ✅ Implemented | Logo grid with external links |
| `/knowledge` | ✅ Implemented | 9-category landing grid with lock badges + "Coming soon" chips |
| `/knowledge/courses` | ✅ Implemented | Public grid — mock data (M2) |
| `/knowledge/camps` | ✅ Implemented | Public timeline — mock data (M2) |
| `/knowledge/academic` | ✅ Implemented | Public list + abstracts; download is member-only via signed URL — 503 until M6 (M2) |
| `/knowledge/encyclopedia` | ✅ Implemented | Public card grid — mock data (M2) |
| `/knowledge/biography` | ✅ Implemented | Public portrait grid — mock data (M2) |
| `/knowledge/youth-advice` | ✅ Implemented | Public article cards — mock data (M2) |
| `/knowledge/qa` | ✅ Implemented | Public accordion; Ask button member-only, logging lands M4 (M2) |
| `/knowledge/books` | ✅ Implemented | Public catalogue; download is member-only via signed URL — 503 until M6 (M2) |
| `/knowledge/videos` | ✅ Implemented | Public thumbnails; playback member-only, placeholder embeds (M2) |
| `/knowledge/recommended` | ✅ Implemented | Public curated list, real links only (M2) |
| `/search` | ✅ Implemented | Unified keyword search across all content types, grouped with type badges; guest-accessible, debounced, type filters; member-only hits show a lock (M5) |
| `/webboard` | ✅ Implemented | Hub: two board cards with live counts + latest threads across both; "ตั้งกระทู้ใหม่" for members, login link for guests (M4) |
| `/webboard/general` | ✅ Implemented | Public thread list with tags and latest/popular/most-replied sort; post-moderated (§7.2) (M4) |
| `/webboard/youth-care` | ✅ Implemented | Public list of *approved* questions, "รอตอบ / ทีมงานตอบแล้ว" toggle, always-anonymous bylines, pre-moderated (§7.1) (M4) |
| `/webboard/[board]/[postId]` | ✅ Implemented | Thread + nested replies, like/report; guest composer locked per §5.3.4 (M4) |
| `/webboard/new` | ✅ Implemented | Board picker + thread/question form; member-only with `?next=` return; `?board=` preselects (M4) |
| `/webboard/moderation` | ✅ Implemented | CONTENT_MODERATOR queue: pending questions, pending replies, open reports (M4) |
| `/register` | ✅ Implemented | Self-service registration with OTP |
| `/login` | ✅ Implemented | Cookie-based login |
| `/forgot-password` | ✅ Implemented | Email OTP flow |
| `/reset-password` | ✅ Implemented | Password reset page |
| `/verify-reset-code` | ✅ Implemented | OTP verification on reset |
| `/register/success` | ✅ Implemented | Registration confirmation |
| `/profile` | ✅ Implemented | Edit profile + avatar upload |
| `/profile/activities` | ✅ Implemented | Member-only activity tabs: my threads (incl. own PENDING/REJECTED with status + reason per §7.1), my comments, bookmarks placeholder, notifications (M5) |
| `/privacy-policy` | ✅ Implemented | PDPA static page — pure server component, no API calls (M5) |
| `/terms` | ✅ Implemented | Moved out of `/(auth)` to `src/app/terms/page.tsx`; public static page, footer-linked (M5) |

### Non-PRD pages currently live

| Page | Why not in PRD | Action |
|------|---------------|--------|
| ~~`/dashboard`~~ | Not in PRD sitemap | **Done 2026-09-23** — route deleted; its UI was promoted to become `/`. All inbound links re-pointed. |
| ~~`/community`~~ | Not in PRD sitemap (added mid-build as programmes overview) | **Done 2026-09-23 (M2.5 B2)** — page, components and `communityData.ts` deleted; the single inbound link in `DashboardPanel.tsx` was found still live during M5 verification and re-pointed to `/about` |
| ~~`/faq`~~ | Not in PRD sitemap (was leftover stub) | **Done 2026-09-23 (M2.5 B2)** — page, components and `faqData.ts` deleted; Header/Footer entries removed. Re-verified clean in M5 |
| `/design-system` | Dev-only debug tool | Keep as-is; exclude from production sitemap/noindex at deploy |

### Links that needed re-pointing after the `/dashboard` removal — ✅ all done 2026-09-23

| Source file | Was | Now |
|---|---|---|
| `VerifyEmailForm.tsx` (router.push L86 + AuthLink L136) | `/dashboard` | `/` |
| `Header.tsx` logo (href + aria-label + comment) | `/dashboard` | `/` |
| `ProfilePage.tsx` footer | `/dashboard` | `/` |
| `LoginForm.tsx` post-login redirect — **found by audit, missing from the task prompt** | `/dashboard` | `/` |
| `KnowledgeHubPage.tsx` "While you wait" cross-links | `/webboard/youth-care`, `/news` | *Kept — both are PRD pages* |

---

## 🔄 MILESTONES (execution order — dependency-corrected)

Every milestone cites its PRD sections as source of truth. Follow this order strictly. Nothing below depends on anything above it unless noted.

---

### M0: Foundation Infrastructure (before all feature work)

**PRD sources:** §6.2, §6.3, §6.4, §6.5, §8.2, §10  
**Goal:** Build authorization and signing infrastructure so no future feature has to be rewritten to support it.

#### M0-Step 1: Role Schema Alignment
- **Status:** ✅ Done — all gates re-verified 2026-09-23
- **Gate checks:** All three green. FE `npx tsc --noEmit` clean · FE `npx --no-install next build` 41/41 pages · BE `npm run build` exit 0 (`dist/index.js` 5,822 B).
- **PRD §6.2 defines:** Three roles — `GUEST` (view-browse only), `MEMBER` (full site access), `CONTENT_MODERATOR` (approve/reject webboard posts in Youth Care board).
- **Actions completed:**
  - Migration `20260923012900_change_roles_enum` — renames old enum, creates `UserRole_new`, migrates data, renames back. Its **effect was already present in the live DB**, but the migration was never recorded in `_prisma_migrations`; discovered and reconciled on 2026-09-26 (see **D11**). The 2026-09-23 claim that it had been "applied" was only ever true of the database's shape, not of Prisma's migration history.
  - `schema.prisma` updated from stale `@default(MEMBER)` → `@default(GUEST)` to match PRD semantics + DB column default. Registration still assigns `role = 'MEMBER'` explicitly in `authService.ts` (no behavioral change).
  - Prisma client regenerated (`7.10.0`) after the schema edit, so the generated client no longer disagrees with the column default.
  - Enum agreement verified across all four surfaces: DB column default (`migration.sql` L19 `SET DEFAULT 'GUEST'`), generated client, `schema.prisma` L53, and `types/index.ts`.
  - `types/index.ts` — `ROLES` constant already exports `GUEST | MEMBER | CONTENT_MODERATOR`.
  - `middleware/authenticate.ts` — populates `req.user.role` on every verified JWT.
  - `middleware/requireRole.ts` — full factory with tuple rest-spread composition + argument-time validation.
- **⚠️ Not yet wired:** `requireRole.ts` has **zero call sites** — it is complete and correct, but nothing enforces a role yet. Expected first consumer: M1/M2 route gating. Do not mistake its existence for enforcement.
- **Definition of Done:** Three roles defined in schema matching PRD §6.2 ✅ · Registration assigns MEMBER ✅ · Middleware populates `req.user.role` ✅ · Zero hardcoded hex/RGB values introduced — N/A, no frontend files touched in this step

#### M0-Step 2: Signed URL Service Layer
- **Status:** ✅ Done
- **Gate checks:** All green. BE `tsc --noEmit` clean · BE `npm run build` exit 0 · FE `npx tsc --noEmit` clean · FE `next build` 41/41 pages (lint + type validity checked) · new suite `signUrlService.test.ts` 39/39 assertions pass · live smoke `POST /api/v1/assets/sign` → `401 UNAUTHORIZED` (route mounted, auth gate enforced, dev server healthy).
- **PRD sources:** §6.5 (two-layer contract — public static path vs signed URL) + §8.2 (knowledge files stored on a Supabase Storage bucket shared with Web 2) + §9.3 (Web 1 / Web 2 secrets stay strictly separated).
- **Actions completed:**
  - `services/internalApiClient.ts` (new) — Web 2 transport: `x-backend-api-secret` header, `AbortController` bound (`WEB2_INTERNAL_TIMEOUT_MS`, default 5 s, clamped 100 ms–30 s), upstream status → transport codes `UPSTREAM_NOT_FOUND` / `UPSTREAM_CREDENTIALS_REJECTED` / `UPSTREAM_UNAVAILABLE`. Deliberately split from the signing logic so M6's committee sync reuses the transport without inheriting anything asset-specific.
  - `services/signUrlService.ts` (new) — `getSignedAssetUrl(assetId, userId)`: `POST {WEB2_INTERNAL_API_URL}/internal/api/v1/assets/{id}/sign`, then constructs `…/storage/v1/object/sign/{bucket}/{path}?token=…`. TTL from `SIGNED_URL_TTL_SECONDS` (default 300, clamped 30–3600) with any shorter upstream TTL capping it. Structured logs carry `assetId`, `userId`, `latency_ms`, `outcome`.
  - `controllers/assetController.ts` (new) + `routes/signedUrl.ts` (new) — `POST /api/v1/assets/sign`, zod body `{ assetId }`, `authenticate` middleware, own rate limiter.
  - `config/routePrefix.ts` — added `ASSETS_ROUTE_PREFIX`, mounted in `src/index.ts`. `config/supabase.ts` now exports `SUPABASE_PROJECT_URL`. `types/index.ts` gained `SignedUrlResponse`.
  - `__tests__/signUrlService.test.ts` (new) — 39 checks against a stubbed `fetch`; no network, no Supabase, no Web 2.
- **⚠️ Deliberate deviations from the handover prompt (recorded, none accidental):**
  1. `createAppError(code, message, statusCode)` replaces the prompt's bare `class …Error extends Error` types — `errorHandler` gates on `isApplicationError()`, which requires both `code` and `statusCode`, so every class as specified would have degraded to `500 INTERNAL_ERROR`.
  2. No `app.ts` exists. Mounted in `src/index.ts` via `config/routePrefix.ts`, the declared single source of truth.
  3. Responses use the `formatAuthResponse` envelope (`{ success: true, data }`), matching the FE's `ApiEnvelope<T>`.
  4. Own rate limiter (`ASSET_SIGN_RATE_LIMIT_WINDOW_MS` / `..._MAX_ATTEMPTS`, default 100 / 15 min) instead of the prompt's `AUTH_RATE_LIMIT_*`: those are local, unexported consts in `authRoutes.ts`, and sharing the budget would let two document opens consume the five sign-in attempts a member is allowed.
  5. Web 2 rejecting **our** service credential answers `SERVICE_CREDENTIALS_REJECTED` / 502, not the prompt's 401 — a wrong service secret is our misconfiguration, and a 401 would tell every member their own session had expired.
  6. Gated assets use a **dedicated private bucket** (`SUPABASE_SIGNED_ASSETS_BUCKET`, default `signed-assets`), never `SUPABASE_STORAGE_BUCKET` ("assets"), which is the public avatar bucket. A test asserts the two cannot collide.
  7. `WEB2_INTERNAL_API_URL` was **not** added to `REQUIRED_ENV_VARS`: doing so makes the API refuse to boot until `.env` is edited — an outage for a feature that cannot work before M6. It fails loudly and actionably at call time instead.
  8. `.env.example` was **not** updated by the agent (blocked by the private-files guard). Values were handed over for manual paste and have since been added to both `backend/.env` and `backend/.env.example`.
- **Carried into M6:** create the private `signed-assets` bucket · real Web 2 round-trip (the `/internal/api/v1/assets/{id}/sign` contract is ours until then) · promote `WEB2_INTERNAL_API_URL` to `REQUIRED_ENV_VARS` · confirm whether the shared bucket lives in this Supabase project or Web 2's.
- **Definition of Done:** Backend proxy endpoint works ✅ (`POST /api/v1/assets/sign`) · Token exchange flows correctly ✅ verified against a stubbed `fetch`; the live round-trip is M6 by §8.2 · Zero hardcoded credential values ✅ (both `BACKEND_API_SECRET` and `WEB2_INTERNAL_API_URL` read from env; a test proves the header tracks the env value) · All gates green ✅

#### M0-Step 3: Data Migration Strategy (mock → live)
- **Status:** ✅ Done — with one recorded deviation (see below)
- **Gate checks:** FE `npx tsc --noEmit` clean · FE `next build` 40/40 pages · BE `npm run build` exit 0 · live checks: `/` → 200, `/dashboard` → 404
- **Actions completed:**
  - All six mock data modules tagged with `/* MOCK — DELETE after Live API swap */` as line 1: `newsData.ts`, `announcementData.ts`, `knowledgeData.ts`, `partnerData.ts`, `communityData.ts`, `faqData.ts`.
  - Verified by grep that the tag exists exactly once per file, and that no other module carries mock data exports.
- **⚠️ Deviation — the "runtime fallback verified via error-handling test" DoD item is not exercisable yet:** the mock modules are imported *directly* by page components (listing shells, detail shells, client pages). No fetch/service caller wraps them, because the live API layer does not exist yet. There is therefore nothing to fail over from, and no test to write — a fallback wrapper built now would be dead code. The pattern to implement at swap time (per module, in a server-safe data-access layer): `try { return await api.get…() } catch { logger.warn(…); return MOCK_DATA }`. Recorded so M2/M6 implement it rather than re-derive it.
- **Note:** the homepage panel (`components/home/DashboardPanel.tsx`) carries its own inline content (hero copy, ticker text, news/announcement previews, stats). Those literals are *page copy*, not data-module exports, and were left as-is; if the ticker/news previews become API-fed later, extract them then.
- **Definition of Done:** All mock files tagged ✅ · Runtime fallback verified — ⚠️ deferred to the API swap with the pattern documented above (no callers exist to fail over)

#### M0 housekeeping — commits landed & green re-verification (2026-09-23)
- **Status:** ✅ Done — verification and history hygiene only; no functional change.
- **Commits landed** (pathspec-only staging, never `git add -A`):
  - `6adf90f` — Add signed asset URL service and cookie sessions (M0-Step 2 backend + cookie-session wiring, 13 files)
  - `617f7d4` — Serve dashboard UI at root and tag mock data (homepage promotion + M0-Step 3 tags + design tokens + this file, 31 files). Git recorded the panel move as a rename: `components/dashboard/DashboardPanel.tsx` → `components/home/DashboardPanel.tsx` (98% similar), so its history is preserved.
  - `208fd7a` — Ignore OneDrive staging and agent scratch dirs.
- **Gate re-run on a clean tree** (`.next` and `tsconfig.tsbuildinfo` deleted first): FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 · BE `npm run build` exit 0.
- **Live verification** (production build served on `:3100`, because the same `.next` cannot be shared with `next dev`): `/` → **200**, HTML contains the global chrome (`bg-brand-950` bands, nav labels Announcements / Community / Knowledge / Webboard, one `animate-pulse` skeleton node) and **zero** occurrences of the old stub copy ("scaffolding") · `/dashboard` → **404** ("could not be found") · `/news` → 200 · `/about` → 200.
- **Route-table proof of the deletion:** `.next/app-path-routes-manifest.json` contains `"/page": "/"` and **0** occurrences of `dashboard`.
- **Interpretation note:** `/` carries the panel's loading skeleton in its server HTML because `DashboardPanel` resolves the session client-side via `getMe`; hero/ticker/stats markup appears after hydration. Pre-existing panel behaviour, not a regression.
- **`.gitignore` additions (`208fd7a`):** `.tmp.driveupload/` (OneDrive in-flight upload staging — it held one orphaned copy of a `node_modules/effect` file), `.openclaw/` and `memory/` (coordinator runtime state). Keeps a future `git add -A` from sweeping OneDrive/agent junk into the tree. Note `.previews/` (5 QA screenshots) is deliberately **not** ignored — it is already tracked.
- **Why this entry exists:** the first post-refactor live check served the *old* stub page at `/`. Root cause was a stale `.next` left behind by an earlier `next build`-while-`next dev` collision, so the recovery protocol is now recorded under HOW TO RUN rather than being re-diagnosed next session.
- **Post-verification ops notes (2026-09-23, same day):**
  - **Hydration warning on `<html>`** (`data-qb-installed="true"`, `suppresshydrationwarning` in the React diff): caused by the **QuillBot browser extension** injecting attributes before React hydrates — benign, dev-console only, not a code bug. Mitigated anyway: `suppressHydrationWarning` added to `<html>` in `RootLayout` (silences attribute-level mismatches on that element only; children remain strictly checked). FE `tsc --noEmit` clean after the edit; the full FE build was **not** re-run while `next dev` is live (cache-corruption trap) — the next gate run covers it.
  - **Dev account deleted at the owner's request:** `mrasheed.smd1424@gmail.com` (username `mora`, role MEMBER) removed so the owner can re-register fresh. 14 refresh tokens cascaded. Method: throwaway `ts-node` script against `DATABASE_URL` via the driver adapter (the generated client is `.ts`-only, so plain `node` cannot require it) — script deleted after use, never committed. Login for the deleted email now returns `401 INVALID_CREDENTIALS` (verified). Remaining users are the six known test rows (`probe_*`, `smoke_*`, `e2e_verify_9214@`).
  - **OTP delivery note for re-registration:** SMTP is still unconfigured (debt D0, `SMTP_HOST=localhost`), so the verification email cannot actually send. The code is **echoed to the backend console/log** as `[OTP_DEV_ONLY] EMAIL_VERIFICATION code for <email>: <6 digits>` — read it from there. Sign-in works even while unverified (`isNew: true` just routes to the verify screen).

---

### M1.5: Public access alignment + access-control wiring (§5.1.1, §3.3, §6.2, §6.4, §6.5)

**Status:** ✅ Done — 2026-09-23, all gates green
**Gate checks:** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (40/40 pages, `/login` still static ○) · BE `npm run build` exit 0 · BE suites: `signUrlService.test.ts` all pass, `auth.test.ts` smoke all pass, new `assetSignRole.test.ts` 3/3 (401 / GUEST→403 / MEMBER→gate-open) · live matrix: guest `/` → 200 with both hero CTAs in SSR HTML and zero "Loading your account" remnants · guest `/profile` → 200 (login card is client-side, as designed)
**Depends on:** M0-1 (roles + `requireRole` factory)

**Owner decision 2026-09-23:** the site follows the PRD model exactly — **every page a guest may see is open to everyone; only member-only *actions* redirect to `/login`** (and return the visitor to where they were afterwards). This step retires the deliberate stopgap that gated the homepage.

**Why now:** `/` was the only page contradicting §5.1.1 (audit 2026-09-23: every other live page is already guest-accessible; `AuthAwareShell.requireAuth` has zero call sites; `/profile` self-gates with a login card, which is the correct pattern). No milestone previously planned the un-gating.

**Role-based access status after M1.5:**
- ✅ Roles in schema (`GUEST | MEMBER | CONTENT_MODERATOR`, M0-1) · JWT carries role · `authenticate` populates `req.user.role`
- ✅ `requireRole` has its **first consumer**: `POST /api/v1/assets/sign` is gated to `MEMBER | CONTENT_MODERATOR` (proved by `assetSignRole.test.ts` 3/3)
- ✅ Frontend guest/member states: `Header` (§3.3 pills vs avatar), `AuthAwareShell.requireAuth`, `/profile` login card
- ✅ Login return-URL flow built: `/login?next=<internal path>` (M2 knowledge gates and M4 New Thread are its planned consumers)
- Guests are unauthenticated visitors by design — the DB `GUEST` role stays unused (no self-serve path creates it); the M1.5 GUEST probe mints a stateless token, touching no rows

#### Scope:
1. **Un-gate `/`** ✅ — `DashboardPanel.tsx`: redirect effect + full-page spinner deleted; every section renders immediately for guests and members. Hero greeting: member → `ยินดีต้อนรับ, {fullName}`; guest → `ยินดีต้อนรับ — ร่วมเป็นสมาชิก (→ /register, lime) · เข้าสู่ระบบ (→ /login, white)`. Existing lime `/register` CTA pill kept (§5.1.1 guest CTA section).
2. **Login return-URL flow** ✅ — `LoginForm` resolves `?next=` at submit time (window.location, NOT useSearchParams — keeps `/login` static) and redirects there after verified sign-in; internal-only validation (leading `/`, no `//`, no scheme) else `/`. Unverified flow untouched.
3. **Frontend action-gate pattern** — a small `ensureMember(returnTo)` helper (check `isAuthenticated`, else `router.push("/login?next=…")`). **Built with its first real consumer, not before** — dead-code rule per the M0-Step 3 deviation. First consumer arrives in M2 (knowledge download/ask) or M4 (New Thread); both milestone scopes already describe this exact behaviour and will consume the helper + `?next=` flow.
4. **First `requireRole` consumer (backend)** ✅ — `POST /api/v1/assets/sign` now uses `...requireRole(ROLES.MEMBER, ROLES.CONTENT_MODERATOR)` (the tuple composes its own `authenticate`, so the standalone import was replaced — one JWT verification, not two). Proven by `assetSignRole.test.ts`.
5. **Docs** ✅ — route-inventory row for `/` and the Deviations Ledger entry updated to the public-per-§5.1.1 position.

#### Deviations from the prompt (recorded):
1. `FOCUS_RING_DARK` used on the hero CTAs instead of `FOCUS_RING` — the greeting sits on the dark `bg-brand-950` hero, where a brand-600 ring would be invisible; the dark variant (accent-300 ring, brand-950 offset) is the surface-correct treatment per Header.tsx's own docs.
2. `signedUrl.ts` replaced the standalone `authenticate` import with the `requireRole` tuple (whose first element IS authenticate) instead of stacking both — the middleware's own docstring prescribes the spread, and stacking would verify the JWT twice.
3. Live-matrix checks that need a browser session (member greeting after hydration, `?next=/news` landing, `next=https://evil…` fallback) are **code-verified + build-verified but not click-through-verified** — curl cannot execute client JS. The guest-CTA SSR output, 401/403/role-open API behaviour, and all three builds are machine-verified. Owner click-through recommended.
4. Micro-copy: LoginForm success line changed "Taking you to your dashboard..." → "Taking you to where you left off..." so it stays truthful when `?next` points elsewhere.

#### Gate checks:
FE `tsc --noEmit` · FE `npm run build` · BE `npm run build` · live matrix: guest `/` → 200 no redirect; guest `/profile` → login card; guest clicking a member action → `/login?next=…`; member → personalised greeting; `GUEST`-role JWT on `/assets/sign` → 403.

---

### M1: Completed — §5.1 Public Pages

**Status:** ✅ Done  
**Scope:** News list/detail, announcements list/detail, about+committee, donate, contact, partners

**Remaining work per PRD compliance:**
- Committee data is currently static JSX array. Per §5.1.7: "← Sync from Web 2 API → Read-only" with `publicDisplay` flag. Implementation deferred to M7 (Web 2 integration).
- Donate bank details are placeholders. PRD says real bank/PromptPay details + QR codes. Replace before M8 deployment.
- Partner logos are static SVG/placeholder images. Real partner assets come via Web 2.

---

### M2: Knowledge Hub Full (§5.2) — ✅ Done 2026-09-23

**Status:** ✅ Done — 2026-09-23, all gates green
**Gate checks:** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (**route count 40 → 50**; ten `/knowledge/*` routes SSG ●) · BE `npm run build` exit 0 · BE suites `assetSignRole.test.ts` 3/3 + `signUrlService.test.ts` all pass (code unchanged) · live matrix: hub tiles are real links (zero "Coming soon" chips), all 12 `/knowledge*` GETs → 200, unknown slug → graceful not-found block, guest gated pages show "Log in to download/play/ask" linking to `/login?next=…`, zero `<img>` tags, recommended hrefs all resolve
**PRD sources:** §5.2.1–§5.2.11  
**Depends on:** M0-1 (role schema), M0-2 (signed URL service), M0-3 (fallback strategy), M1.5 (?next= flow)  
**UI preserved:** Current `/knowledge` landing page — dark band header, category tiles with lock badges, "While you wait" cross-links — NOT rebuilt. Extended: non-interactive `<article>` tiles became `<Link>` components pointing to the real sub-routes.

#### What to implement (exact PRD scope):

#### Actions completed (all ✅):
- `lib/knowledgeData.ts` — every `KnowledgeCategory` gained a PRD `slug` (`kc-papers`→`academic`, `kc-qa-corner`→`qa`, …).
- `lib/knowledgeItemsData.ts` (new, MOCK-tagged) — the ten typed collections (`COURSES…RECOMMENDED`, 3–5 fictional items each) with the exact interfaces from the task spec; `assetId`s are mock strings the real signing endpoint will 503 on until M6; `embedUrl` is the marked Blender open-film placeholder on youtube-nocookie.
- `lib/memberGate.ts` (new) — `isSafeInternalPath` + `loginReturnHref`; `LoginForm.resolvePostLoginTarget` now consumes it (one shared validation).
- Hub (`KnowledgeHubPage.tsx`): tiles are real `<Link>`s with hover affordance, "Coming soon" chips removed, member-note kept, third cross-link card "Curated picks" → `/knowledge/recommended`; route-shell metadata de-phased.
- `app/knowledge/[category]/page.tsx` (new shell) — `generateStaticParams` (9 slugs + `recommended`), per-category `generateMetadata`, graceful not-found block, dark header band with breadcrumb; `KnowledgeCategoryContent.tsx` switches slug → section.
- Ten section components (one file each): Courses (difficulty chips), Camps (timeline), Encyclopedia (tag chips, display-only), Biography (initials avatars, committee pattern), YouthAdvice, Recommended (typed badges, real links) — plus the four GATED ones: Academic/Books (abstract for all; guest → `Log in to download` link via `loginReturnHref`; member → `DownloadButton` calling real `POST /assets/sign`, honest 502/503 "library being connected" toast, 401 → login return), Videos (guest → `Log in to play`; member → inline youtube-nocookie iframe, one at a time), Qa (accordion mirroring FaqPage aria contract; guest → `Log in to ask` lime pill; member → Ask button with the honest M4-deferral toast + webboard link).

#### Deviations from the prompt (recorded):
1. `gatedActions.tsx` — `LoginToDownloadLink` renders an `<a>` styled as a button rather than a `<button>` wrapping navigation; semantics for a navigation action favour the anchor, styling is identical.
2. Videos guest link carries `?play=<videoId>` in its `next` value (still a page path + query, validated by the same rules) so a post-login return is distinguishable; no auto-play resume was built — the member just clicks Play after returning.
3. `502 SERVICE_CREDENTIALS_REJECTED` was added to the "library pending" toast set alongside 503 — both mean "Web 2 not wired", which is M6's work, not a user error.

#### What intentionally lands later:
- qa Ask logging → M4 (Youth Care board) · real downloads/streaming quality → M6 (Web 2 archive) · tag filtering + /search → M5

#### Gate checks:
FE `tsc --noEmit` · FE `npm run build` · BE `npm run build`. All three pass.

---

### M2.5: Thai Language & Brand Typography (site-wide; PRD context — Thai-language public site)

**Status:** ✅ **Done 2026-09-25** — Batch 1 (M2.5-1 Foundation) ✅ Done 2026-09-23 · Batch 1.5 (M2.5-1.5 Logo integration) ✅ Done 2026-09-24 · Batch B2 (M2.5-2 Auth flows) ✅ Done 2026-09-24 · Batch B3 (M2.5-2 M1 public pages) ✅ Done 2026-09-25 · Batch B4 (M2.5-3 M2 knowledge + closeout) ✅ Done 2026-09-25 — every batch gated green
**Gate checks (Batch 1):** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (**route count 50 → 48** — `/community` + `/faq` deleted) · BE `npm run build` exit 0 · BE suites `assetSignRole` + `signUrlService` + auth smoke all pass · live matrix: `/` `/knowledge` `/login` → 200 · `/community` `/faq` → 404 · `--font-kanit` class on `<html>` (`__variable_f3269f`) · Kanit stack + 6 `@font-face` blocks in emitted CSS, 5 woff2 faces emitted to `/_next/static/media/` (sizes match the source files) · header shows 7 Thai nav entries, zero "Community" · Footer FAQ entry gone · `/login` title → `เข้าสู่ระบบ | FityatulHaq` · Thai dates render (`14 กันยายน 2568`)  
**Sequencing rationale:** deliberately slotted BEFORE M3/M4/M5. The PRD is written in Thai and targets Thai youth; all English copy so far was build scaffolding. Running this now means M3 (header states), M4 (webboard) and M5 (search/legal) ship Thai natively instead of being translated afterwards — one sweep instead of two.

#### Actions completed (Batch 1 — all ✅):
- Five Kanit woff2 faces copied to `frontend/src/fonts/` (Regular/Medium/SemiBold/Bold/ExtraBold); loaded via `next/font/local` in `app/layout.tsx` with the variable class on **`<html>`** (preflight applies the stack at html level).
- `designTokens.fontFamily.sans` → `var(--font-kanit), system-ui, …`; Tailwind mapping consumed the token unchanged (verified in emitted CSS: `font-family: var(--font-kanit), system-ui, …` + 5 `@font-face` + 1 `kanit Fallback` block).
- `/community` + `/faq` deleted (page shells, components, data modules); Header `Community` nav entry removed (7 Thai entries remain); Footer FAQ entry removed; DashboardPanel SDU-TMYDA CTA re-pointed → `/knowledge`.
- `Header.tsx` fully Thai (nav labels, skip link, auth pills เข้าสู่ระบบ/สมัครสมาชิก, aria-labels); `Footer.tsx` remaining strings Thai (copyright → `สงวนลิขสิทธิ์`).
- `errorMessages.ts` — every user-facing message Thai (code keys untouched).
- `validation.ts` — all field/form messages Thai; `formatDate` → `th-TH` long month (Buddhist era: `14 กันยายน 2568` verified live); `timeAgo` units Thai (`ชั่วโมงที่แล้ว`), `just now` → `เมื่อสักครู่`.
- Route-shell metadata Thai for: root (`/` — also fixed the leftover **Indonesian** description), `/profile`, `/webboard` ×3, `/design-system`, `/terms`, and the six (auth) shells (`/login` title verified live: `เข้าสู่ระบบ | FityatulHaq`).
- `backend/src/utils/smtp.ts` — OTP subject lines, heading/intro/expiry/footer copy in Thai (HTML `lang="th"`), transport/rate-limit logic untouched. Emails still cannot send until D0 (SMTP unconfigured) — copy-readiness only.

#### Deviations from the prompt (recorded):
1. `timeAgo`'s `elapsedAgo` helper was translated (not deleted) — the prompt allowed either; it IS exported/used via `timeAgo`, and unit strings became Thai (`นาที/ชั่วโมง/วัน/สัปดาห์/เดือน/ปี`). Its docstring examples updated to match.
2. Root `page.tsx` metadata edit was included in this batch (prompt listed it) but the old_text premise included the public-root doc comment — matched reality by editing only the metadata block.

#### Owner decisions (resolved 2026-09-23):
- **D-T1 ✅** — `font/` now carries the **complete Kanit family** (Thin→Black, woff2 + woff, all italics). The M1.5 weight gap is closed: Bold (700) and ExtraBold (800) are available. Execution uses the five needed **woff2** faces only (Regular 400, Medium 500, SemiBold 600, Bold 700, ExtraBold 800) — smallest payload, no faux-bold; italics/other weights added later if a design need appears.
- **D-T2 ✅** — Kanit for everything. `Prompt-Medium.ttf` is gone from `font/` (owner replaced the folder with the full family); no pairing.
- **D-T3 ✅** — OTP email template (`backend/src/utils/smtp.ts`) translates to Thai in M2.5-1.
- **D-T4 ✅** — `/community` and `/faq` are **deleted in M2.5-1** (M5's deletion pulled forward). Inbound links audited: Header nav `Community` entry, DashboardPanel category-card CTA (`href="/community"` → re-point to `/knowledge`, matching the sibling card), Footer `คำถามที่พบบ่อย` link entry.
- **D-T5 ✅** — `formatDate` switches to `Intl.DateTimeFormat("th-TH")` (Buddhist-era Thai dates); `<time dateTime>` keeps ISO.

#### A. Brand typography (the `font/` directory at repo root)
Files provided: `Kanit-Light.otf`, `Kanit-Regular.otf`, `Kanit-Medium.otf`, `Kanit-SemiBold.otf`, `Prompt-Medium.ttf` (Kanit + Prompt are OFL-licensed Google Fonts — free for commercial use).

1. Copy **five Kanit woff2 faces** into `frontend/src/fonts/`: `Kanit-Regular.woff2` (400), `Kanit-Medium.woff2` (500), `Kanit-SemiBold.woff2` (600), `Kanit-Bold.woff2` (700), `Kanit-ExtraBold.woff2` (800) — from the repo-root `font/` directory (full family now present; skip italics/other weights until a design need appears).
2. `frontend/src/app/layout.tsx` — load via `next/font/local` (`weight` per file, `display: "swap"`, `variable: "--font-kanit"`) and put the variable class on **`<html>`**, not `<body>`: Tailwind preflight applies the font stack on `html`, and a CSS variable defined on `body` is invisible to it.
3. `frontend/src/styles/designTokens.ts` — replace the system `fontFamily.sans` with `"var(--font-kanit), system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"` (the token's own comment anticipated exactly this swap — every consumer, including the Tailwind `sans` mapping in `tailwind.config.ts`, follows automatically). `mono` unchanged.
4. **Weight gap — RESOLVED:** the complete Kanit family is in `font/`; 700/800 load as real faces. No remapping needed.
5. **D-T2 ✅:** Kanit everywhere — no Prompt, no two-face pairing.
6. Verification: `/design-system` page + a few real pages render Kanit; `Network` tab shows self-hosted woff2/otf, no external requests.

#### B. Thai copy sweep — scope established by audit (2026-09-23)
Current language split: only 3 files carry Thai (`DashboardPanel.tsx`, `Footer.tsx`, root `page.tsx` — whose metadata description is leftover **Indonesian**, "Portal Komunitas…", and gets fixed here); **39 component files are English-only**.

Batches (each ends with the three gates + a leftover-English spot check):
- **Batch B0 (M2.5-1) — foundation & deletions ✅:** font infrastructure (A); **delete `/community` + `/faq`** (page shells, components, `communityData.ts`/`faqData.ts`, Header nav entry, Footer FAQ entry, DashboardPanel CTA re-point → `/knowledge`); `Header.tsx` + `Footer.tsx` remaining English strings; `errorMessages.ts`; `lib/validation.ts` user-facing messages; `formatDate` → `th-TH`; root `layout.tsx`/`page.tsx` metadata; `backend/src/utils/smtp.ts` OTP email template → Thai.
- **Batch B1.5 (M2.5-1.5) — logo integration ✅ Done 2026-09-24, all gates green (owner request 2026-09-23):** assets from repo-root `logos/` (six PNGs: f/fit/fityatulhaq × blue/white — the f1/f2/f3 system, logo blue `#0052FF` + white) → copy to `frontend/src/assets/logos/`; favicon via `app/icon.png` + `app/apple-icon.png` (f-blue); Header logo tile swap (f-blue + keep Kanit wordmark text); Footer brand column (f-white on the `#0052ff` band); auth screens (fityatulhaq-white above the card in `(auth)/layout.tsx`). Runs next, before B2.
  - **Completion note (2026-09-24):** Owner-finalised mapping (supersedes the tentative one above): Header → `fityatulhaq-white.png`; Footer wordmark → `fityatulhaq-white.png`; auth canvas → `fityatulhaq-white.png` (above the card); favicon / apple-touch → `f-white.png`.
  - **Files modified:** `frontend/src/components/layout/Header.tsx` (icon-tile `<span>` + matching text span → one `next/image`, `h-8`, `priority`); `frontend/src/components/layout/Footer.tsx` (oversized `FITYATULHAQ` `<p>` → centred `next/image`, `h-10`); `frontend/src/app/(auth)/layout.tsx` (`fityatulhaq-white.png` inside the centred column, above the card, `h-12`, `priority`; redundant duplicate `AuthFeature` interface removed). **Assets:** the six PNGs copied from repo-root `logos/` → `frontend/src/assets/logos/`; `frontend/src/app/icon.png` + `frontend/src/app/apple-icon.png` are `f-white.png` via Next's file convention (no `metadata.icons` needed). Every image carries `alt="FityatulHaq"`; no hardcoded colours; no new dependencies.
  - **Gate checks:** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (50/50 routes prerendered, lint + type validity checked). No backend change → BE `npm run build` not run.
- **Batch B2 (M2.5-2) — auth flows (M2.5-2 prompt):** the 8 auth forms + `AuthCard`, `FormField`, `SubmitButton`, `OtpVerification` (labels, placeholders, banners, success copy) + their route-shell metadata.
  - **Completion note (2026-09-24):** the auth copy was already fully Thai in the tree (commit `5f9097a feat: translate auth flow copy to Thai`); the prompt's "eight forms" is actually **six** form components — every `useAuthForm` consumer under `@/components/auth`: `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `VerifyResetCodeForm`, `ResetPasswordForm`, `VerifyEmailForm`. Plus the four shared components and their route shells. Nothing needed re-translating, so this pass made **no source changes** (avoids regressing the already-Thai `errorMessages.ts` / `validation.ts`, per the prompt's warning).
  - **Files verified (all Thai):** `frontend/src/components/auth/{LoginForm,RegisterForm,ForgotPasswordForm,VerifyResetCodeForm,ResetPasswordForm,VerifyEmailForm,AuthCard,FormField,SubmitButton,OtpVerification}.tsx`; route shells `frontend/src/app/(auth)/{layout,login,register,register/success,forgot-password,forgot-password/sent,reset-password}.tsx`. Only intentional non-Thai strings remain: `alt="FityatulHaq"` (brand) and the format-hint placeholders `you@example.com` / `Ahmad bin Abdullah`. `/terms` left untouched (already localised in `e10257f`).
  - **Gate checks:** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (50/50 routes prerendered, lint + type validity checked). No backend change → BE `npm run build` not run.
- **Batch B3 (M2.5-2) — M1 public pages + their mock data ✅ Done 2026-09-25, all gates green:** news list/detail (`newsData.ts` content incl. department names — the filter chips are data-driven), announcements, about + committee, donate (keep the frozen placeholder bank values), contact, partners (`partnerData.ts`), profile/webboard/terms shells.
  - **Completion note (2026-09-25):** every user-facing string in scope is Thai (labels, headings, intro copy, buttons, empty states, `aria-live` announcements, `aria-label`s, `<title>`/`description` metadata, mock-data content). **Files changed:** `lib/newsData.ts`, `lib/announcementData.ts`, `lib/partnerData.ts`; `components/news/{NewsPage,NewsDetail}.tsx`; `components/announcements/{AnnouncementList,AnnouncementDetail}.tsx`; `components/about/{AboutPage,CommitteePage}.tsx`; `components/partners/PartnersPage.tsx`; `components/contact/ContactPage.tsx`; `components/donate/DonatePage.tsx`; route shells `app/{news,announcements,about,about/committee,contact,partners}/page.tsx`; detail shells `app/news/[slug]/page.tsx` + `app/announcements/[slug]/page.tsx`; `components/layout/Footer.tsx` (4 social `aria-label`s — kept in sync with the duplicate list in `ContactPage`). One scope addition beyond the batch prompt: those 4 Footer `aria-label`s, because `ContactPage`'s `SOCIAL_LINKS` comment mandates the two lists stay in sync and leaving one English would contradict the DoD.
  - **Notable patterns (do not regress):** `AnnouncementList` gained `WITH_PDF` / `TEXT_ONLY` consts so its identity comparisons against filter values survive translation — never inline those literals. `NewsDetail`'s `SHARE_PLATFORMS` third entry is now `คัดลอกลิงก์` and `shareLabel` compares against that same literal. Detail-shell `generateMetadata` keeps its `| ข่าวสาร` / `| ประกาศ` suffix (the root layout's `%s | FityatulHaq` template appends after it).
  - **Deviations / open items:** `DonatePage` bank values (`00-00-00`, `00000000`, `FityatulHaq Foundation`) are deliberately still obviously-placeholder — only labels and instructional copy were translated (the reference *value* became `โปรดระบุหมายเลขสมาชิกของคุณ`). The donate impact tiles still quote `£` amounts: currency is a mock-data decision for the owner, not a translation one (debt D6).
  - **Review gate (repo-root `CODE_REVIEW_SKILL.md`):** an independent review of the B3 diff returned *Request Changes* with two must-fixes — both applied, then re-gated. (1) `lib/newsData.ts` `authorName: "Committee Secretary"` → `เลขานุการคณะกรรมการ`: the only role-based byline, and therefore the only one that was user-facing English (the other authors and the committee members are person names and stay in Latin script). (2) `components/layout/Footer.tsx`'s office address → `เลขที่ 12 ถนนคอมมิวนิตี สปริงฟิลด์`, so it no longer contradicts the same address in `ContactPage`. Verdict after fixes: ✅ Approved.
  - **Non-blocking observations carried into B4:** `Footer` uses `คลังความรู้` for `/knowledge` while the terminology sheet prefers `ศูนย์ความรู้`; its quick link reads `ติดต่อ` rather than `ติดต่อเรา`; `DonatePage`'s `เพื่อให้เราขอบคุณคุณได้` is slightly awkward Thai. All three predate B3.
  - **Gate checks:** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (**50/50 static pages** prerendered) · BE `npm run build` exit 0 · review gate ✅.
- **Batch B4 (M2.5-3) — M2 knowledge + closeout (M2.5-3 prompt) ✅ Done 2026-09-25, all gates green:** hub + ten sections + `knowledgeItemsData.ts` content; site-wide leftover-English audit; M2.5 marked Done.
  - **Known English still in the tree (audit 2026-09-25, the starting inventory for B4's sweep):** `lib/knowledgeItemsData.ts` (all content); `CATEGORY_INTROS` in `app/knowledge/[category]/page.tsx` (10 strings) plus its `aria-label="Collection not found"` and `aria-label="Breadcrumb"`; the `aria-label` on every `components/knowledge/*Section.tsx` (`"Academic papers"`, `"Biographies"`, `"Books library"`, `"Camp archive"`, `"Courses"`, `"Encyclopedia"`, `"Q&A corner"`, `"Recommended picks"`, `"Video library"`, `"Youth advice"`, `"Tags"`); `components/knowledge/KnowledgeHubPage.tsx` (`Breadcrumb`, `Membership note`, `Knowledge categories`, `While you wait`, and the stray `"Read the latest news"`); `components/home/DashboardPanel.tsx` (5 `aria-label`s: Hero banner, Category cards, News and announcements, Community discussions, Organisation statistics); `components/layout/AuthAwareShell.tsx` (`Loading your session`); the three `app/webboard/**/page.tsx` stubs (`Back to home`); `lib/api.ts` `defaultMessageForStatus` fallbacks. `app/design-system/page.tsx` specimen text is an internal page and is probably out of scope — confirm before touching.
  - **Correction to the B0 record:** the claim that `Header.tsx` was "fully Thai" covers its visible nav/auth strings only — three `aria-label`s were missed and are still English: `"FityatulHaq — go to the homepage"`, `"Primary"`, `"Primary mobile"` (lines ~347/358/462). Sweep them in B4.
  - **Deliberately out of scope:** `placeholder="you@example.com"` / `"Ahmad bin Abdullah"` (auth format hints), `alt="FityatulHaq"` (brand), and `console.warn` messages (developer-facing). Comments and docstrings are never in scope — user-facing strings only.
  - **Completion note (2026-09-25) — ✅ Done, all gates green:** every user-facing string in scope is now Thai. **Files changed (27):** `lib/knowledgeItemsData.ts` (all content — 4 courses · 4 camps · 4 papers · 5 encyclopedia · 4 biographies · 4 advice articles · 5 Q&A · 5 books · 5 videos · 6 recommended, incl. `tags[]`, `paragraphs[]`, `topic`, `field`, `durationLabel`); `lib/knowledgeData.ts` (9 `name` + `blurb` pairs — `slug`/`id`/`icon` kept); `lib/api.ts` (`defaultMessageForStatus` + 2 fallbacks); `app/knowledge/page.tsx` + `app/knowledge/[category]/page.tsx` (`CATEGORY_INTROS`, not-found block, breadcrumb, member badge, metadata — the `| คลังความรู้` suffix kept so the root layout's `%s | FityatulHaq` appends after it); `components/knowledge/*` (hub + all ten sections + `gatedActions` toasts/labels); `components/home/DashboardPanel.tsx`; `components/layout/Header.tsx`; `components/layout/AuthAwareShell.tsx`; the three `app/webboard/**/page.tsx` stubs; `components/donate/DonatePage.tsx`; `app/design-system/page.tsx`; `components/profile/{ProfilePage,AvatarUploader}.tsx`.
  - **Scope additions (owner-approved caveats):** (1) `app/design-system/page.tsx` translated — the starting inventory marked it "probably out of scope"; the owner approved including it. Its `fast`/`normal`/`slow` labels stay English because they compose real class names (`duration-fast`). (2) Donate impact-tile currency switched `£25 / £100 / £500` → `฿25 / ฿100 / ฿500` (amounts stay mock; the bank-detail placeholder *values* stay obviously fake per the file's SAFETY comment).
  - **Enum-mapping decision (do not regress):** the union-typed fields in `knowledgeItemsData.ts` (`difficulty: "Beginner"|"Intermediate"|"Advanced"`, `season: "Summer"|"Winter"`, `type: "News"|…`, `fileType: "PDF"|"Word"`) stay English as **machine keys** — they key the `*_CHIP` colour `Record`s and are union members. Thai display is added in the consuming components as typed `Record<Union, string>` maps (`DIFFICULTY_LABEL`, `SEASON_LABEL`, `TYPE_LABEL`), so a missing member fails at compile time. `fileType` renders as `ดาวน์โหลด (${fileType})` — PDF/Word treated as format tokens (same precedent as the announcement `WITH_PDF` filter). The design-system `SCALES`/`STATE_COLORS` translated values are also `key={…}` sources; keys stay unique and stable, so this is safe (noted so it isn't mistaken for a regression).
  - **Terminology resolution:** adopted **`คลังความรู้`** site-wide for `/knowledge` (matches the live Header/Footer nav) and **`บอร์ด` / `บอร์ดดูแลเยาวชน`** for the webboard (matches the nav), superseding the sheet's tentative `ศูนย์ความรู้` and the mock-data `กระดาน` variants — the stragglers in `knowledgeItemsData.ts` and `newsData.ts` were normalised. Also removed the only two gendered particles (`ครับ`) in the frontend (mock forum bubbles in `DashboardPanel`), so the whole app now follows the neutral-tone rule. The Footer's short `ติดต่อ` label/heading is retained deliberately (idiomatic Thai; carry-over item closed as "resolved — kept short").
  - **Pre-existing typo fixed:** `DashboardPanel` heading `กระดูเว็บบอร์ดยอดนิยม` → `กระทู้เว็บบอร์ดยอดนิยม`.
  - **Review gate (repo-root `CODE_REVIEW_SKILL.md`):** an independent review of the B4 diff returned 💬 *Comment* — no functional or structural defects; enum mapping, `key` stability, identity/literal comparisons, metadata suffixes and `knowledgeItemsData.ts` structure all verified correct. One 🟡 must-fix was raised (mock forum bubbles still tagged `General` / `Youth Care` in Latin) plus 🟢 nits (ellipsis style, `แนะนำ` vs `รายการคัดสรร` naming, the `กระดู` typo, `ครับ` tone). **All addressed**, then the gates were re-run green.
  - **Gate checks:** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (**50/50 static pages** prerendered) · BE `npm run build` exit 0 (no backend change) · review gate 💬 → all items resolved.
- **Backend stays English** (deviation to record): error codes/messages and zod messages are machine-facing; `errorMessages.ts` is the human-translation layer. Exception: the OTP email template in `backend/src/utils/smtp.ts` is member-facing — translate to Thai (D-T3; harmless now even though SMTP is unconfigured, debt D0).
- **Terminology sheet (single source for all batches):** เข้าสู่ระบบ = Log in · สมัครสมาชิก = Register · สมาชิก = Member · ออกจากระบบ = Log out · ดาวน์โหลด = Download · **คลังความรู้** = Knowledge Hub (B4 resolved the sheet's `ความรู้/ศูนย์ความรู้` ambiguity in favour of the live nav term `คลังความรู้`) · ข่าวสาร = News · ประกาศ = Announcements · ติดต่อเรา = Contact · โปรไฟล์ = Profile · หน้าแรก = Home · เส้นทางนำทาง = breadcrumb aria-label · **บอร์ด**/**บอร์ดดูแลเยาวชน** = webboard / Youth Care board. Tone: neutral polite web-Thai, no gendered particles.

#### Definition of Done:
- Kanit self-hosted via `next/font/local`, no external font requests, weights resolve without faux-bold
- No user-facing English strings remain outside code identifiers (checklist per batch: labels, placeholders, buttons, banners, toasts, aria-labels, metadata, mock-data content)
- Thai dates site-wide via `formatDate` (`th-TH`)
- All three gates green after every batch; `/design-system` shows the Kanit specimen

#### Owner decisions pending:
- **D-T1** font weights: add Kanit Bold/ExtraBold files (preferred) or remap 700/800 → 600?
- **D-T2** `Prompt-Medium.ttf` role: skip for now (proposed) or pair as body face?
- **D-T3** translate the OTP email template to Thai now? (proposed: yes)
- **D-T4 ✅** delete `/community` + `/faq` in this milestone (pulling M5's deletion forward) — DONE: **M2.5-1**
- **D-T5** Buddhist-era Thai dates (`th-TH` default) — confirm? (proposed: yes)

---

### M3: Header Complete — Logged-in State (§3.3, §3.4) — ✅ Done 2026-09-26

**PRD sources:** §3.2 (navigation), §3.3 (member state), §3.4 (mobile drawer)  
**Depends on:** M0-1 (role schema for moderator-specific items)  
**UI preserved:** Current sticky header — brand logo, desktop nav with dropdowns, hamburger menu. Extends what exists, does not rebuild.

#### Scope:
1. Header detects logged-in state via `useAuth()` hook from `AuthContext`
2. When logged in: replace Login/Register buttons with Avatar circle (uploaded image or initials fallback)
3. Notification bell icon with red dot indicator for unread count > 0
4. Dropdown menu (avatar click or bell click): Profile → `/profile`, Activities → `/profile/activities`, Account Settings (future placeholder), Logout
5. Mobile drawer §3.4: Hamburger drawer includes Avatar + sign-out option alongside navigation

**Status:** ✅ **Done 2026-09-26** — all gates green
**Gate checks:** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (**50/50 static pages**, lint + type validity checked) · BE `npm run build` exit 0 (no backend change) · review gate 💬 *Comment* → every raised item addressed, gates re-run green.

#### Completion note (2026-09-26)

- **Steps 1–2 already existed** (the `useAuth()` state and the avatar pill with its initials fallback were built earlier) and were kept — this milestone implemented **steps 3, 4 and 5**.
- **Desktop rail:** new `AccountMenu` component — a notification bell (red dot, with the unread count in its accessible name) and the avatar, rendered as **two triggers for one account panel**, which is the literal wording of step 4. The bell therefore opens the same panel rather than a separate notifications list: there is no notifications screen yet to put in one.
- **Panel items:** `โปรไฟล์` → `/profile` · `กิจกรรมของฉัน` → `/profile` with a `เร็ว ๆ นี้` badge · `ตั้งค่าบัญชี` — a non-interactive placeholder row with the same badge · `ออกจากระบบ` → sign-out. Lucide icons throughout.
- **Drawer (§3.4):** a flat member row — avatar (photo or initials), full name, email, and a sign-out button — laid out beside the navigation rather than a nested dropdown.
- **Sign-out** closes every header layer, calls `logout()`, and returns to `/`, so no member-only screen keeps rendering behind an ended session.
- **Shared logic extracted:** new `lib/avatar.ts` `initialsOf()` now serves both the profile uploader and the header (the uploader's private copy was deleted), so the two circles cannot disagree. New `lib/notificationData.ts` is the notification source.
- **Avatar rendering** in the header uses a plain `<img>` with `alt=""` (decorative — both call sites label the avatar themselves), matching the `AvatarUploader` precedent for Supabase-hosted URLs, so `images.remotePatterns` is never touched.

**Deviations / decisions (both approved before the work started):**

- `Activities` points at `/profile` with a `เร็ว ๆ นี้` badge instead of `/profile/activities`, which does not exist yet (D9, M5) — avoids shipping a dead link. `โปรไฟล์` and `กิจกรรมของฉัน` therefore land on the same screen for now.
- **Account Settings** is a non-interactive row (there is nowhere to navigate yet), marked with the same badge.
- **The bell's unread count is MOCK** — `PLACEHOLDER_UNREAD_NOTIFICATION_COUNT = 2` in `lib/notificationData.ts`, loudly commented — because Web 1 has no notifications endpoint; recorded as new debt **D18**. The badge reads `0` during SSR and the first client render and is filled after mount, so hydration can never mismatch; swap the module body for `GET /notifications/unread-count` when the endpoint exists.
- The header avatar now shows the member's **two** initials (first + last word) where it previously showed one, so it matches the `/profile` circle; the drawer's larger circle uses the same helper. Partner monograms are a different algorithm and keep their own helper (`PartnersPage.tsx`).

**Review gate (repo-root `CODE_REVIEW_SKILL.md`):** the independent review of the M3 diff returned 💬 *Comment* — no blockers; hydration safety, the mock, sign-out ordering, effect dependencies and the `initialsOf` extraction were all verified. Addressed: (1) the panel originally carried `role="menu"`/`role="menuitem"`, which promises the APG menu keyboard contract (arrow keys, focus-on-open) that the implementation does not provide — reverted to a plain labelled disclosure (`aria-expanded` + `aria-haspopup="true"` + conditional `aria-controls`), matching the desktop nav dropdowns; (2) the session skeleton gained `motion-reduce:animate-none`; (3) `initialsOf` now takes its initial by code point, so a non-BMP character cannot be split. **Declined with reason:** `PartnersPage`'s own `initialsOf` is deliberately a *different* algorithm (first two words → organisation monograms) and is not merged. **Accepted residual (🟢):** `AccountMenu` registers its own document `keydown`, so a keyboard user could briefly have a nav dropdown and the account panel open at once; opening the account panel now dismisses the nav dropdown, and Escape closes both.

**Definition of Done:** steps 1–5 all implemented ✅ · sticky header, desktop nav dropdowns and hamburger behaviour unchanged ✅ · no hardcoded colours — semantic tokens only ✅ · keyboard contract kept (Escape restores focus to the opening trigger, outside-pointerdown closes, focus-visible rings, reduced motion honoured) ✅ · all gates green ✅

---

### M4: Webboard — Real Content (§5.3 + §7 Moderation) — ✅ Done 2026-09-26

**Status:** ✅ **Done 2026-09-26** — all gates green
**Gate checks:** FE `npx tsc --noEmit` exit 0 · FE `npm run build` exit 0 (**52/52 static pages**, up from 50) · BE `npm run build` exit 0 · BE suites `webboard.test.ts` (all pass) + `webboardRoutes.test.ts` (23 checks) + `signUrlService.test.ts` + `imageValidation.test.ts` all pass · live-database end-to-end harness over the real router: 33 + 11 + 3 checks pass (temporary scripts, deleted after running; verified to leave zero rows behind) · review gate run twice, every raised item fixed, gates re-run green.

**PRD sources:** §5.3.1–§5.3.4, §7.1–§7.3  
**Depends on:** M0-1 (role schema), M0-3 (fallback)  
**UI preserved:** If stub UI was already designed, extend it. Otherwise scaffold from scratch using design tokens.

#### Scope:
1. `/webboard` — Two board cards: Youth Care + General. "New Thread" button visible to members, hidden/redirect-to-login for guests (**via the M1.5 `?next=` return flow**)
2. `/webboard/youth-care` — Anonymous display mode ("Anonymous User #ID"), Pending/Answered status toggle, strict anonymity enforced, posts go to Pending Review queue until CONTENT_MODERATOR approves
3. `/webboard/general` — Tags, sort (Latest/Popular/Most Replied), instant moderation
4. `/webboard/[board]/[postId]` — Thread view, nested comments, report button. Guests: read-only. Members: comment + react + report
5. Moderation queue: accessible to CONTENT_MODERATOR role, per §7.1–§7.3 — approve/reject with reason, profanity filter, rate limiting

#### Completion note (2026-09-26)

- **The three stub pages were extended, not rebuilt** (`/webboard`, `/webboard/general`, `/webboard/youth-care` kept their Thai metadata and shells). Three routes are new: `/webboard/new`, `/webboard/moderation`, `/webboard/[board]/[postId]`.
- **Backend:** `Post` / `Comment` / `Reaction` / `Report` + five enums, added by two migrations (`20260926090000_add_webboard_core`, `20260926093000_add_comment_moderation_audit`) — both authored with `prisma migrate diff` and applied with `migrate deploy`. `sourceId` / `syncStatus` were added to all four models because §8.2 explicitly asks for that prep. Router at `WEBBOARD_ROUTE_PREFIX`; reads are public (a new `optionalAuthenticate` attaches the caller when a session exists, which is what lets a list show "you liked this" without making the page protected), writes are `requireRole(ROLES.MEMBER, ROLES.CONTENT_MODERATOR)`, the queue is `requireRole(ROLES.CONTENT_MODERATOR)`.
- **The two boards are one implementation driven by a rules table.** `BOARD_RULES` (`utils/webboardTaxonomy.ts`) is the single place that says Youth Care is pre-moderated + anonymous + tag-free and general is not; services and projections read it, so a new rule cannot be applied to one board and forgotten on the other.
- **§7.1 anonymity is enforced in the type system, not by remembering.** Public payloads carry `AuthorView`, a discriminated union whose `anonymous` branch has no field that could hold an id, name, username or avatar. The digest is an HMAC over `(member, board[, item])`, so it cannot be reversed by enumerating ids, and the author row is not even *fetched* on the Youth Care board's own queries.
- **Two moderation regimes, and the boundary is documented:** Youth Care pre-moderates questions *and* replies (nothing on that board is visible before a moderator has read it); the general board posts immediately and relies on the §7.2 report button plus the §7.3 filters. Both pending lists appear in the queue.
- **§7.3 is three mechanisms, each independently tested:** a curated profanity screen that rejects before saving, a per-account write budget (default 5/min, env-tunable), and a posting restriction *derived* from ACTIONED reports in a rolling window (default 3 reports / 30 days) rather than a flag on `User` — so it cannot drift and lifts on its own.
- **Frontend:** `lib/webboardApi.ts` (transport + the board vocabulary), `hooks/useWebboardResource.ts` (the shared loading/error/retry/cancel contract), and nine components under `components/webboard/`. Shared refinements: `lib/api.ts` gained `requestPaginated` (the plain `request` resolves to `data` alone, which loses the pager block), `auth/FormField.tsx` gained an optional `multiline` so the thread/comment boxes reuse the same label + error + `aria-describedby` wiring as the auth forms, and `AuthAwareShell` gained an optional `returnTo` so a guest hitting `/webboard/new` or `/webboard/moderation` directly still comes back after signing in.

**Deviations / decisions:**

- **§5.3.2 and §7.1 disagree, and §7.1 wins.** §5.3.2 offers a "ต้องการปกปิดตัวตนอย่างเข้มงวด" option that hides the *username* (implying the default shows it); §7.1 forbids showing the name or username publicly **always**, for the asker's safety, "ไม่ว่าผู้ถามจะเลือกโหมดนิรนามหรือไม่ก็ตาม". Identity is therefore never shown on Youth Care, and the toggle instead controls whether the pseudonym is per-post (strict — nothing links two posts) or per-(member, board) (default — one recurring voice). Reworded in the UI accordingly.
- **The §6.4 access matrix's webboard row is unreadable in the source** (the table's columns are lost in extraction and it appears to say guests are redirected). §5.3's prose is explicit and is the authority: "ทุกกระดานจะเปิดให้ Guest อ่านได้ตามปกติ". Reads are public; posting, commenting, reacting and reporting are member actions.
- **The moderation queue is built in Web 1** although §8.1 places those screens in Web 2 — with M6 unwired, the alternative was a pre-moderation gate nothing could operate. M6 will connect Web 2 to it; the queue's services are the seam.
- **No mock/fallback data for the webboard** (this is the M0-3 dependency's resolution): the knowledge hub's fallback is static content, but a forum's is user-generated, and rendering invented threads and replies on a real board would be misrepresentation rather than resilience. The fallback here is an honest empty state or an error with a retry.
- **`ensureMember(returnTo)` was not built**, although M1.5 recorded M4 as its first likely consumer. The behaviour it described is delivered by `MemberActionLink`, which renders a real `<a>` whose `href` is either the action or `/login?next=<action>` — a link is the accessible shape for navigation (focusable, announces its destination, respects modifier-clicks), whereas a click handler that pushes the login route is not. The M1.5 plan is superseded rather than pending.
- **Boards and tags are code-defined, not tables.** §8.1 gives Web 2 no module for either, so there is nothing an administrator could add later; this matches how the knowledge categories are defined. Board *rules* live authoritatively in the backend and are *presented* by a second copy in `webboardApi.ts` (`BOARD_META`) — a drift there can only remove a badge, never open a gate, because the backend decides.
- **Two spellings of a board, deliberately:** the site's own URLs use the segment (`/webboard/youth-care`) while every API path and the `?board=` value use the canonical key (`YOUTH_CARE`). One spelling per layer is what makes the server able to validate a single form.
- **Reply moderation is recorded, not just logged.** `Comment` carries the same audit columns as `Post` (`moderationNote`, `moderatedById`, `moderatedAt`); nothing reads a reply's rejection reason yet, but M5's activity list will, and an audit trail cannot be backfilled.
- **Webboard content is client-fetched**, so thread text is not in the initial HTML. §9.4's SEO requirement names news/articles/courses and not the board, and the page needs the session for its "you liked this" state, so this is recorded as debt (D21) rather than solved with a second, session-blind fetch path.

**Review gate (repo-root `CODE_REVIEW_SKILL.md`):** two independent passes.

- **Pass 1** (whole diff) returned 💬 *Comment* with 2 must-fixes: `newThreadPath` emitted the route segment where `boardFromKey` expects the canonical key (so "ตั้งกระทู้ใหม่" from `/webboard/general` silently preselected Youth Care), and the comment-parent lookup omitted the `PUBLISHED` filter, letting a member reply to an unreviewed comment and turning the endpoint into an existence oracle. Both fixed; the second is what led to pending replies being reviewable at all.
- **Pass 2** (focused on the fixes) returned 💬 *Comment* with a further blocker and must-fix: `"แม่ง"` substring-matched the ordinary word `"แม่งาน"` (foreman) — removed, exactly as `"สัด"` had been for `"สัดส่วน"` — and the queue's envelope `total` summed three independently-paginated lists, so the pager offered pages that could never contain anything (now the longest list). Its nit — that `moderateComment` persisted nothing but the new state — was accepted and fixed with the audit columns above.
- **Declined with reason:** an index on `Comment.parentId`. No M4 query filters by it (a thread's replies are fetched by `postId`, which is indexed, and the tree is assembled in memory), so it would serve only the cascade. Recorded rather than silently skipped.

**Definition of Done:** all five scope items implemented ✅ · guests can read every board, and every member action routes a guest through `/login?next=…` ✅ · Youth Care never exposes an identity, and pending content is invisible to everyone but the queue ✅ · approve/reject-with-reason, profanity screen and rate limiting all present and tested ✅ · no hardcoded colours — semantic tokens only ✅ · keyboard contract kept (real links for guest affordances, `aria-pressed`/`aria-expanded` on toggles, `aria-live` on filter results, reduced motion honoured, no `role="menu"`) ✅ · all gates green ✅

---

### M5: Profile Activities + Search + Legal (§5.4.5, §5.2.12, §5.5) — ✅ Done 2026-09-26

**PRD sources:** §5.4.5, §5.2.12, §5.5.1, §5.5.2  
**Depends on:** M2 (knowledge data for search index), M4 (webboard threads for activities tab)

#### Scope:
1. `/profile/activities` — Tabbed interface: "My Threads" (webboard posts), "My Answers", "Bookmarks", "Notifications". Member only. Each tab paginated with summary preview.
2. `/search` — Unified keyword search across ALL content types: news, announcements, courses, camps, encyclopedia, biography, etc. Results grouped by type with badge labels. Guest-accessible. Debounced input. No auth required.
3. `/privacy-policy` — Static PDPA-compliant page. Pure server component, no API calls.
4. Move `/terms` from `/(auth)/terms/page.tsx` → `/terms/page.tsx`. Public-facing, accessible to all.
5. Delete non-PRD pages: `/community`, `/faq` — `/dashboard` already resolved on 2026-09-23 (route deleted, UI promoted to `/`). Remove unused data files: `communityData.ts`, `faqData.ts`. Re-point all inbound links (see §2 Deletions section). **⚠️ The homepage panel is `components/home/DashboardPanel.tsx` — do not delete it during this cleanup.**

> **Scope-item 5 was already done** in M2.5 Batch 2 (2026-09-23). M5 treated it as a *verification* task, not a build task — see the note below. Its "see §2 Deletions section" cross-reference is dangling: there is no §2 Deletions section in this file. Do not go looking for it.

#### Status: ✅ **Done** (2026-09-26) — all gates green

**What shipped:**

1. **`/profile/activities`** — member-only, URL-addressed tabs (`?tab=`), full APG tablist (roving `tabIndex`, Arrow/Home/End with focus follow-through; **not** a half-declared `role="tab"`).
   - "กระทู้ของฉัน" and "ความคิดเห็นของฉัน" are **real backend data** (`GET /webboard/me/threads`, `GET /webboard/me/comments`, both MEMBER-gated), paginated through the shared `Pager`.
   - **§7.1 is the reason the tab exists:** `me/threads` deliberately has *no* moderation filter, so the author sees their own PENDING/REJECTED/HIDDEN rows with a Thai status chip and, when a moderator rejected it, the `moderationNote` — the only screen where the pre-moderation gate is lifted, and only for the row's own author. `me/comments` keeps `post.moderation = PUBLISHED` so every row has an openable target, but does *not* filter the reply's own state, so a pending Youth Care reply shows its status (this is what M4 recorded the comment audit columns for).
   - "เนื้อหาที่บันทึกไว้" is an **honest empty state** (`เร็ว ๆ นี้`); "การแจ้งเตือน" is real, with per-row mark-as-read.
2. **`/search`** — guest-accessible, debounced (300 ms), type-filter chips, results grouped by type with badge labels, `aria-live` count. Member-only hits are listed with a lock badge (§5.2.12: show that they exist to encourage sign-up) and route a settled guest through the M1.5 `loginReturnHref` flow.
3. **`/privacy-policy`** — public static server component, no API calls. Written to the PDPA shape §5.5.1 names (categories held, purposes, legal bases, retention, disclosure, data-subject rights) and describing what `schema.prisma` actually stores.
4. **`/terms` moved** `(auth)/terms/page.tsx` → `app/terms/page.tsx`, rewritten as a public document (the auth group's layout is the sign-in canvas — wrong chrome for a page anyone may read). Closes **D3**. The register form now links both documents.
5. **Notifications built properly** (not a placeholder): new `Notification` model + migration `20260926100000_add_notifications`, a producer inside the official-answer transaction, and `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`. Closes **D18** and **D22**; the header bell is now a real link to the notifications tab instead of a second trigger for the account menu.

**Deviations / decisions:**

- **Search is client-side, over the static modules** (`lib/searchIndex.ts`). The backend has no content tables at all, so there is nothing for a search endpoint to query; building the index from `newsData` / `announcementData` / `knowledgeItemsData` / `partnerData` is the only coherent option and keeps a public page session-free. **Webboard threads are absent although §5.2.12 names "กระทู้"** — threads are live rows rendered client-side (D21), so indexing them needs a backend text-search endpoint that does not exist. Recorded as debt rather than faked.
- **Bookmarks is a stated placeholder, not a scope dodge.** §5.4.5 lists the tab and §6.4 lists the feature, but there is no `Bookmark` model and, more decisively, **no producer**: the bookmarkable content lives in frontend constants with no durable identity, and no page in the app has a save affordance. A table nothing can write to would be scaffolding; the honest empty state plus a debt row is the truthful alternative.
- **Notification rows point at `Post` rather than copying the thread title**, so the list joins for board + title and a deleted question cascades its notifications away. The enum has one value; adding a producer is a value plus a helper, never a reshape.
- **The self-answer guard lives in the producer helper** (`notificationService.createYouthCareAnsweredNotification`), not at the call site, so every future caller inherits it. The member-facing comment route hard-codes `official: false`, so a member cannot trigger a notification at all.
- **`markRead` is scoped by `userId` and answers 404 — not 403 — for another member's row**, so the two cases are indistinguishable. Idempotent: re-reading returns the original timestamp rather than moving it.
- **A shared `Pager`/`totalPagesOf` was extracted into `webboardUi.tsx`** and M4's `BoardThreadList` switched to it, because the M5 tabs needed identical pagination. One control, one wording ("หน้า X จาก Y", "ก่อนหน้า", "ถัดไป").
- **Scope item 5 re-verified, not rebuilt.** No `/community` or `/faq` route, component or data module remains, and no inbound link survives — **except one straggler the earlier pass missed**: `DashboardPanel.tsx` card 3 (สำนักงานการสตรี) still pointed at `/community`, i.e. a dead link on the homepage. Re-pointed to `/about`. (Card 2's TMYDA CTA had already been re-pointed to `/knowledge`.)

**Review gate (repo-root `CODE_REVIEW_SKILL.md`):** one pass over the whole M5 diff, scoped to React/TypeScript + the universal-quality guides. Verdict 🔄 *Request Changes* with **one blocker**, now fixed:

- **Must-fix:** `/profile/activities` listed the author's own PENDING/REJECTED threads (correct, §7.1) but linked each title to the public thread route, which 404s for exactly those rows — the flagship tab contradicted itself. Fixed by rendering an unreviewed title as plain text, leaving the status chip and the moderator's note to carry the message. (The alternative — a `viewerId === authorId` exemption in `getThread` — was rejected: it widens the §7.1 gate and needs its own tests.)
- **Also fixed from the same pass:** `searchIndex`'s haystack comment claimed a title-weighting that no code implemented (the title was repeated three times against an `includes()` that repetition cannot influence), and per-group truncation was invisible. Now the title is kept in a separate haystack used for a real rank, groups carry a `total`, and the UI says "แสดง N จาก M รายการ" when capped. `Pager` extraction, the tabpanel's `tabIndex`, a Back/Forward page-reset, and a factually wrong route-ordering comment were corrected too.
- **Accepted and recorded, not fixed:** the footer's `bg-[#0052ff]` / `text-blue-200` literals (the whole footer band is a pre-existing sanctioned exception to the token rule; M5's new legal row follows it rather than widening it).

**Definition of Done:** all five scope items satisfied ✅ (item 5 by verification) · `/profile/activities` shows the member's own PENDING question with status **and** reason ✅ · search is guest-accessible, debounced, grouped with badges, and honest about member-only hits ✅ · privacy policy is a pure server component with no API calls ✅ · `/terms` is public and footer-linked ✅ · no hardcoded colours in any new component (footer exception noted) ✅ · keyboard contract kept (APG tablist, `aria-pressed` filters, `aria-live` counts, real links for navigation, no `role="menu"`) ✅ · all gates green ✅

**Gates run:** `frontend` `tsc --noEmit` clean · `npm run build` **55/55 pages** (was 52 after M4) · `backend` `npm run build` clean · backend suites **126 checks, 0 failures** (`webboard` 47, `webboardRoutes` 27, `notificationRoutes` 8, `signUrlService` 41, `assetSignRole` 3) · a **temporary in-process harness against the live DB** ran 17 assertions on the new paths (PENDING visibility to its author only, `getThread` still 404s it, the producer landing in the same transaction as `answeredAt`, the self-answer guard, cross-member `markRead` → 404, idempotency, `me/comments` dropping a hidden thread, pagination totals) and confirmed **zero leftover rows**; the script was then deleted.

---

### M6: Web 2 Integration (§8.2)

**PRD sources:** §8.2  
**Deploys on:** Production environment only. Local/dev uses fallback/mock data.

#### Scope:
1. Committee sync: `GET /api/v1/committee` proxies to Web 2 read-only API. Filters by `publicDisplay` flag. TTL cache (~5 min). Fallback to local data when API unreachable or `ENABLE_WEB2_SYNC=false`
2. Knowledge assets ingestion: Web 2 publishes academic PDFs, books, videos to Supabase Storage. Assets served via signed URLs (M0-2 service layer handles the token exchange)
3. `/about/committee` page switches from local data to live API response. Loading skeleton shown during initial fetch.
4. Deploy-time toggle: `ENABLE_WEB2_SYNC` env variable controls whether live API queries are attempted. Default `false` for safe local development.

---

### M7: Non-Functional Requirements (§9) + Deployment (§10)

**PRD sources:** §9.1–§9.6, §10  
**This is the shipping phase.**

#### M7-Step 1: SEO (§9.4)
- `app/sitemap.ts` — auto-generate from all PRD pages
- `app/robots.txt` — allow crawling, disallow /admin paths
- Open Graph metadata on all pages
- Social share meta tags (title, description, image)
- Canonical tags on all pages

#### M7-Step 2: Performance (§9.2)
- First Contentful Paint < 2.5s mobile target
- Image optimization: use `next/image` with width/size props, lazy loading
- Caching headers on static routes
- CDN configuration at Cloudflare Workers level

#### M7-Step 3: Accessibility (§9.5)
- WCAG 2.1 AA certification: alt-text audit, heading hierarchy h1→h2→h3, focus-visible rings everywhere, contrast ≥ 4.5:1 using design token pairs, keyboard navigation complete
- Screen-reader compatible semantic HTML throughout

#### M7-Step 4: Security (§9.3)
- HTTPS/SSL-TLS enforcement at Cloudflare layer
- SQL injection defense (Prisma ORM provides this; verify sanitization on inputs)
- Rate limiting on forms (already present on auth POSTs via §6.5 middleware)
- PDPA compliance for Youth Care anonymous data handling

#### M7-Step 5: Responsive Design (§9.1)
- Breakpoint verification: Desktop (≥1280px), Tablet (768px), Mobile (375px)
- Header collapses to drawer on ≤768px

#### M7-Step 6: Browser Compatibility (§9.6)
- Chrome latest 2 versions
- Safari latest 2 versions
- Edge latest 2 versions
- Firefox latest 2 versions
- Safari iOS + Chrome Android

#### M7-Step 7: Next.js 16 Upgrade
- Per your approved deferral. Upgrading during deployment preparation groups all infra friction into one migration pass.
- Use `npx @next/codemod upgrade latest` — codemod handles breaking changes (async Request APIs, caching semantics)
- Backport security patches if needed between upgrades

#### M7-Step 8: Deployment
- Frontend → Cloudflare Workers (static + edge SSR)
- Backend → Docker container behind reverse proxy
- Domain DNS routing to Cloudflare
- Health checks configured
- Monitoring/alerting setup

---

## 🚧 DEFINITION OF DONE (applies to every milestone step)

Before marking ANY step complete:

1. **PRD alignment:** Feature implements what the PRD section specifies (URL path, access type, UI elements, data behavior)
2. **Three gates green:** `npx tsc --noEmit` (FE) passes · `npm run build` (FE) passes · `npm run build` (BE) passes
3. **Zero hardcoded colors:** No hex/RGB literals in JSX/TSX — all colors flow through design tokens → Tailwind pipeline
4. **Accessibility floor kept:** Semantic landmarks, ARIA attributes, focus trapping, prefers-reduced-motion honored
5. **No localStorage tokens:** Credentials delivered via httpOnly cookies per §6.5
6. **Mock → API ready:** Components typed against `ApiEnvelope<T>` shape — swapping mock data for real backend data requires zero component changes
7. **No new deps without justification:** Native deps added only if no zero-dependency alternative exists
8. **Recorded in this file:** Task completed, gates passed, updated Last Updated timestamp

---

## 📋 DEVIATIONS LEDGER (accepted divergences from PRD spec)

| Item | PRD expects | Actual implementation | Reason |
|------|------------|----------------------|--------|
| Auth library | NextAuth.js (PRD §10) | Custom JWT + httpOnly cookies | Tighter control over cookie lifecycle, CSRF mitigation via sameSite, avoids NextAuth.js abstraction complexity |
| Next.js version | 16 (PRD §10) | 15.5.25 | Defer to M7 deployment per Big Mo's approval. Upgrading mid-dev introduces untested React 19 edge cases. |
| Realtime/WebSocket | Supabase Realtime (PRD §10) | Deferred per §8.2 | Threading decisions postponed to deployment phase |
| `/` | Not in PRD | Route deleted; its UI **promoted to `/`** (2026-09-23). The panel moved to `components/home/DashboardPanel.tsx`; all inbound links → `/`. The initial auth-gated stopgap was **retired by M1.5** the same day — `/` is now public per §5.1.1 |
| Old homepage UI | — | `components/home/` (`HomePage.tsx` + 10 sections, Phase 4 digest) **deleted** per the same prompt. Tracked in git — recoverable via `git checkout 4fd7ad5 -- frontend/src/components/home` (or any later commit containing it) | The dashboard panel is the homepage of record; two live homepage implementations would have kept drifting apart |
| `/community` | Not in PRD | Deleted | Added mid-build outside PRD scope |
| `/faq` | Not in PRD | Deleted | Leftover stub outside PRD scope |
| `/design-system` | Not in PRD | Kept (dev tool) | Debug page showing all token values; excluded from prod via noindex |

---

## 🗑️ DELETION LEDGER (non-PRD content removal tracking)

When deleting non-PRD pages, follow this checklist:

### Delete: `/dashboard` (entirely) — ✅ done 2026-09-23, with the promotion variant

The original plan deleted the panel outright. Executed instead as **promotion**: the panel became the `/` homepage (coordinator directive, same day), so the checklist resolves as:
- [x] ~~Delete `frontend/src/app/dashboard/page.tsx` and entire directory~~ — directory deleted; its shell (metadata + `AuthAwareShell`) became `app/page.tsx`
- [x] ~~Delete `frontend/src/components/dashboard/DashboardPanel.tsx`~~ — **moved to `frontend/src/components/home/DashboardPanel.tsx`** instead (it is the homepage now); `components/dashboard/` directory deleted
- [x] Update `VerifyEmailForm.tsx`: `href="/dashboard"` → `href="/"` (both the AuthLink *and* the `router.push` after verification)
- [x] Update `Header.tsx` logo: `href="/dashboard"` → `href="/"` (+ aria-label and comment)
- [x] Update `ProfilePage.tsx` footer: `href="/dashboard"` → `href="/"`
- [x] **Extra, not in the original checklist:** `LoginForm.tsx` post-login `router.push("/dashboard")` → `"/"` — found by audit; without it every sign-in would have landed on a 404
- [x] Verify no remaining imports of DashboardPanel from `@/components/dashboard` or references to the `/dashboard` route
- [x] Verify build passes — FE `next build` 40/40, route table shows `/` at 4.88 kB and no `/dashboard`
- [x] Verify runtime — `/` → 200, `/dashboard` → 404
- [x] **Re-verified 2026-09-23 on a clean rebuild after clearing `.next`** — `/` → 200 serving the panel (not the old stub), `/dashboard` → 404, and the rebuilt route manifest is free of `dashboard`

### Delete: `/community` — ✅ done M2.5-1 (2026-09-23), **re-verified and finished in M5** (2026-09-26)
- [x] Delete `frontend/src/app/community/page.tsx`
- [x] Delete `frontend/src/components/community/CommunityPage.tsx`
- [x] **⚠️ `DashboardPanel.tsx` was NOT deleted** — promoted to the `/` homepage at `components/home/DashboardPanel.tsx`. Do **not** delete it.
- [x] Card 2 (TMYDA) CTA re-pointed `/community` → `/knowledge` (M2.5)
- [x] **Card 3 (สำนักงานการสตรี) CTA re-pointed `/community` → `/about` (M5)** — the M2.5 pass missed this second instance: the homepage carried *two* `/community` links, and card 3's was left pointing at the deleted route, i.e. a dead link. Found by M5's scope-item-5 verification, which is exactly what that step was for. `/about` (not `/knowledge`) because the card describes an organisational body, matching card 1's destination.
- [x] Delete `frontend/src/lib/communityData.ts`
- [x] Header `DEFAULT_NAVIGATION`: remove the `Community` entry (7 Thai entries remain)
- [x] Verify build passes — and M5 re-grepped all of `src/**` for `community`: the only hit left is a partner's *name* in `partnerData.ts` ("Springfield Community Centre")

### Delete: `/faq` — ✅ done M2.5-1 (2026-09-23), re-verified clean in M5
- [x] Delete `frontend/src/app/faq/page.tsx`
- [x] Delete `frontend/src/components/faq/FaqPage.tsx`
- [x] Delete `frontend/src/lib/faqData.ts`
- [x] Verify no remaining imports of `FaqPage` or `FAQ_ITEMS`
- [x] Footer `คำถามที่พบบ่อย` link entry removed
- [x] Verify build passes

### Note: `/terms` relocation (not deletion) — ✅ done 2026-09-26 (M5)
- [x] Move `frontend/src/app/(auth)/terms/page.tsx` → `frontend/src/app/terms/page.tsx`
- [x] Verify terms page accessible at `/terms` without auth wrapper (public document, own `max-w-3xl` container; the auth group's sign-in canvas no longer wraps it)
- [x] Update any imports referencing old group path (the register form's `AuthLink href="/terms"` was already URL-based, so it resolved unchanged; it now also links `/privacy-policy`)
- [x] Verify build passes (55/55 pages) — plus both legal pages linked from a new footer `นโยบายและข้อกำหนด` row

---

## 🔴 DEBT REGISTER (remaining issues)

### 🔴 CRITICAL

| # | Debt | Impact | Fix Steps | Depends on |
|---|------|--------|-----------|------------|
| D0 | SMTP credentials not verified | `SMTP_HOST=localhost` in `.env.example`. Real SMTP needed for OTP/email delivery (§6.3). Non-fatal: app continues without email, but OTP resets impossible. | Obtain real SMTP creds → set in `.env` → restart → verify transport works | None |
| D1 | Bucket name consistency | Tests hardcode `"assets"` in some assertions. PRD + `.env` say `"fityatulhaq-assets"`. Must align test expectations to actual bucket name used in prod/dev | Confirm bucket name against dashboard, then fix test stubs in `imageValidation.test.ts` lines that assert bucket strings | M0 completion |
| D2 | E2E smoke test never run | register → login → profile cycle against live Dev PG not formally executed | Manual end-to-end: register via API, login, verify session cookie, navigate to profile, upload avatar, confirm 200 on public URL | D1 resolved |
| D3 | `/terms` mislocated | Currently under `/(auth)/terms` (authenticated group). Should be public at `/terms` per PRD §5.5.2 | ✅ Resolved 2026-09-26 — moved to `frontend/src/app/terms/page.tsx` and rewritten as a public document; the register form links it, and the footer gained a `นโยบายและข้อกำหนด` row linking both legal pages |

### 🟠 HIGH

| # | Debt | Impact | Status |
|---|------|--------|--------|
| D4 | Test coverage thin | Only auth register smoke tested. Login, refresh rotation, forgot/reset cycle, OTP reuse/expiry, rate-limit 429 untested | Open — not blocking functional work |
| D5 | Committee data static | §5.1.7 says Web 2 API sync with `publicDisplay` flag. Currently hardcoded. | Open — deferred to M6 |
| D6 | Donate placeholders | Bank details and QR codes are obviously-placeholder values. Real data needed for launch. Impact-tile currency switched to `฿` in B4 (amounts still mock). | Open — defer to M7 |
| D7 | Knowledge sub-routes absent (§5.2.2–§5.2.11). | ✅ Resolved — M2 built all ten routes; B4 localised them (2026-09-25) |
| D8 | Search endpoint missing | Global unified search absent (§5.2.12). | ✅ Resolved 2026-09-26 (M5) — `/search` shipped as a **client-side** index over the static content modules, with type filters, badges and lock labels for member-only hits. Not a backend endpoint: Web 1 has no content tables. Caveats → **D24**. |
| D9 | Profile activities missing | `/profile/activities` absent (§5.4.5). | ✅ Resolved 2026-09-26 (M5) — four tabs; threads and comments are real backend data (`GET /webboard/me/*`), notifications are real (D18/D22 closed). Bookmarks remain a placeholder → **D23**. |
| D10 | Privacy policy missing | `/privacy-policy` absent (§5.5.1). | ✅ Resolved 2026-09-26 (M5) — public static server component, no API calls, written to the PDPA shape §5.5.1 names. Contact details are the footer's placeholders (see D6). |
| D11 | Role enum unrecorded | ✅ Resolved 2026-09-26 — the original description was stale: `schema.prisma`, the generated Prisma client, `types/index.ts`, `requireRole.ts` and the live DB enum were **all** already `GUEST|MEMBER|CONTENT_MODERATOR`. The real fault was bookkeeping: migration `20260923012900_change_roles_enum` was never **recorded** in `_prisma_migrations`, so `migrate status` reported it pending and any `migrate deploy` would have re-run the rename/cast. Reconciled with `prisma migrate resolve --applied` after `prisma migrate diff --from-config-datasource --to-schema` confirmed **zero drift**. | ✅ Resolved (2026-09-26) |
| D18 | Notifications API missing | The header bell's unread badge is mock (`PLACEHOLDER_UNREAD_NOTIFICATION_COUNT = 2` in `lib/notificationData.ts`, §3.3). No `/notifications` endpoint exists, so the red dot is a placeholder until the activity feed / Web 2 supply real items. | ✅ Resolved 2026-09-26 (M5) — `Notification` model + migration `20260926100000_add_notifications`, `GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`. `lib/notificationData.ts` now calls the real endpoint; the placeholder constant and its docstring are gone. The bell navigates to the notifications tab. Caveat → **D25**. |
| D19 | Profanity screen is deliberately basic | §7.3 asks only for a "basic" filter (คำหยาบเบื้องต้น). Matching is a curated substring list for both scripts, so it catches compounds (`shithead`) at the price of documented collisions (`Scunthorpe` → `cunt`), and it does not defeat deliberate evasion (leet spellings, spaced letters). Two obvious Thai candidates were removed to keep false positives near zero (`สัด`→`สัดส่วน`, `แม่ง`→`แม่งาน`). | Open — by design; revisit only if the board is actually abused |
| D20 | Webboard sort order can disagree with the displayed count | `sort=popular` / `most-replied` order by Prisma relation counts, which cannot be filtered to PUBLISHED the way `_count` can. A hidden reply can therefore influence the ordering while being excluded from the number shown beside it. | Open — cosmetic, and only after a moderator hides something |
| D21 | Webboard content is client-rendered | Thread and board text arrives via `fetch` after mount, so it is not in the initial HTML. §9.4's SEO requirement names news, articles and courses rather than the board, and the pages need the session for their "you liked this" state; a session-blind SSR path would be a second fetch route to keep in step. | Open — revisit if organic search matters for the board |
| D22 | No notification when a Youth Care question is answered | §5.3.2 promises the asker a notification when someone replies, and the status view for their own question is `/profile/activities` (§7.1). Both need the activity feed and the notifications endpoint that D18 already tracks; the webboard records `answeredAt` and the author of every post, so nothing is lost in the meantime. | ✅ Resolved 2026-09-26 (M5) — the producer runs **inside the official answer's `$transaction`** (`notificationService.createYouthCareAnsweredNotification`, called from `webboardService.createComment` when `official: true`), so a rolled-back answer cannot leave a phantom row. Self-answers write nothing; the guard lives in the helper, not the call site. The member-facing comment route hard-codes `official: false`, so a member cannot trigger one. |

### 🟠 HIGH — added by M5

| # | Debt | Detail | Status |
|---|------|--------|--------|
| D23 | Bookmarks are unimplemented | §5.4.5 lists a "เนื้อหาที่บันทึกไว้" tab and §6.4 lists Bookmark as a member feature, but there is no `Bookmark` model **and no producer**: bookmarkable content lives in frontend constants with no durable id, and no page has a save affordance. The tab is an honest `เร็ว ๆ นี้` empty state rather than a table nothing can write to. | Open — needs a content model first (see D24) |
| D24 | Search covers only static content, not the webboard | `/search` indexes the mock modules under `frontend/src/lib/`. §5.2.12 names "กระทู้" among the categories, but threads are live database rows rendered client-side (D21), so indexing them needs a backend text-search endpoint that does not exist. The index also cannot survive the move to DB-backed content without being replaced. | Open — revisit with D21 / when content moves to the DB |
| D25 | The bell badge does not live-update | `AccountMenu` fetches `unread-count` once, keyed on `[user.id]`. Marking a notification read in the notifications tab reloads that list but nothing tells the header, so the red dot stays lit until a full page load. There is no shared client store for it. | Open — needs a small notification context/event, or acceptance |
| D26 | The new activity queries have no DB-backed test | `webboardRoutes.test.ts` and `notificationRoutes.test.ts` prove the 401/403 route gate only, by design (no DB in the suites). The correctness-critical parts — `listMyThreads`/`listMyComments` scoping, and the in-transaction producer with its self-answer guard — were verified by a temporary live-DB harness that was then deleted, not by a committed test. | Open — consistent with the repo's no-DB test approach; a committed DB-backed suite would need an isolated schema |

### 🟡 MEDIUM — Non-functional gating

| # | Requirement | Detail | Gate |
|---|-------------|--------|------|
| D12 | Responsive breakpoints (§9.1) | 1280px / 768px / 375px. Header → drawer ≤3 lines | M7-Step 4 |
| D13 | FCP < 2.5s mobile (§9.2) | Image optimization, lazy loading, CDN/caching headers | M7-Step 2 |
| D14 | Browser matrix (§9.6) | Latest 2 versions × 4 browsers + mobile browsers | M7-Step 6 |
| D15 | SEO completeness (§9.4) | sitemap.xml, robots.txt, OG images, canonical tags | M7-Step 1 |
| D16 | WCAG 2.1 AA (§9.5) | Alt-text audit, heading order, contrast ratios, focus rings, keyboard nav | M7-Step 3 |
| D17 | HTTPS enforcement (§9.3) | TLS/SSL at Cloudflare layer | M7-Step 5 |

---

## 🤖 COORDINATION PROTOCOL

- **Coordinator (this AI):** Engineers prompts, runs the `CODE_REVIEW_SKILL.md` gate, updates this file
- **Zed (execution coder):** Writes code following prompts. One continuous thread per milestone
- **Big Mo (project owner):** Bridges coordinator ↔ Zed. Final authority on acceptance
- **Model routing:** DeepSeek Flash = complex logic/architecture. GLM Flash = scaffolding/UI/large files
- **Prompt hygiene:** Single-copyable markdown blocks; anticipate side effects 3 steps ahead; zero-rework philosophy
- **Verification gates:** Non-negotiable. `tsc --noEmit` → `npm run build` (FE) → `npm run build` (BE) → repo-root `CODE_REVIEW_SKILL.md`. All three must pass before marking any step done
- **Accessibility floor:** Semantic landmarks, `aria-expanded/current/modal`, Escape-dismiss modals, focus trapping, `prefers-reduced-motion` — house standard, never break

---

## 🧰 QUICK REFERENCE

**Infra**
- Supabase project: `kbyruvtdprxtdhtcteju.supabase.co` · direct DB `db.kbyruvtdprxtdhtcteju.supabase.co:5432`
- Ports: backend `4000` (`/api/v1`) · frontend `3000`
- Storage bucket: `fityatulhaq-assets` (folder `avatars/`) — MUST be public in Supabase dashboard
- PRD source: `Requirement.pdf` (raw text at `requirement_raw.txt`)

**Brand/social**
- X: https://x.com/fityatulhaq · Facebook: https://facebook.com/fityatulhaq · Instagram: https://instagram.com/fityatulhaq · YouTube: https://youtube.com/@fityatulhaq
- Contact: `hello@fityatulhaq.org`

**Key env vars (backend/.env)**
- `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `BCRYPT_SALT_ROUNDS` (12), `JWT_ACCESS_TOKEN_EXPIRY` (15m), `JWT_REFRESH_TOKEN_EXPIRY` (7d), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET=fityatulhaq-assets`, `SMTP_*`, `AUTH_RATE_LIMIT_WINDOW_MS`/`AUTH_RATE_LIMIT_MAX_ATTEMPTS`, `COOKIE_SAME_SITE` (default `lax`), `COOKIE_DOMAIN` (optional), `ENABLE_WEB2_SYNC` (future M6 toggle)

**Known gotchas**
- PowerShell: no `&&`; use `;`
- Vision-model parsing abandoned — design extraction uses `sharp.js` pixel sampling (`scripts/extract-final.mjs` → `scripts/design-tokens-v3.json`)
- Backend boot logs SMTP warning until real credentials set — EXPECTED, not a breakage
- Cookie auth + 0 localStorage refs verified
- Mock data files persist as runtime fallback until manual removal confirmed
- Code-review gate: run the repo-root `CODE_REVIEW_SKILL.md`. The old `deep-code-review` skill path (`C:\Users\muham\.openclaw\`) was deleted 2026-09-23 and **must not be restored** (owner decision 2026-09-24) — M2.5 B4, M3, M4 (two passes) and M5 were all reviewed from the repo-root skill.
- Stale `.next` serves a previous version of a page (blank output or outdated UI) after a route change or a build/dev collision; the same cache produces phantom `TS2307` errors for deleted routes. Recovery protocol is under HOW TO RUN — deleting `.next` is always safe, and the fix is never in source.
- Gitignored scratch that will reappear in `git status` if the rules are ever lost: `.tmp.driveupload/` (OneDrive upload staging), `memory/` and `.openclaw/` (coordinator runtime state). `.previews/` is tracked on purpose.
- **Never run two `next dev` instances on the same checkout** — they share one `.next` and corrupt each other (2026-09-23: a second instance on :3001 sat alongside the detached one on :3000; both were killed and a single fresh instance started). One server, or none.
- **LAN-IP origins (`http://192.168.x.x:<port>`) fail CORS by design in dev.** The dev-loopback bypass in `src/index.ts` (`LOOPBACK_ORIGIN_PATTERN`) only covers `localhost` / `127.0.0.1` / `[::1]` with any port; a LAN-IP origin gets `[CORS_REJECTED]` in the backend log and no `Access-Control-Allow-Origin` header. Do **not** fix this by adding the LAN origin to `CORS_ALLOWED_ORIGINS` — it would pass the preflight but `SameSite=lax` auth cookies are cross-site from a LAN origin, so the session still would not stick. Always browse via `http://localhost:<port>`. Real multi-device testing needs HTTPS + `COOKIE_SAME_SITE=none` — defer to M7.
- **Next.js 15.5.25 → 16:** Breaking changes exist (async Request APIs, caching semantics). Codemod available: `npx @next/codemod upgrade latest`. Defer to M7 deployment per Big Mo's approval.

---

## ✅ HANDSHAKE FOR NEXT SESSION

1. Read this whole file (milestones section first, then debt register, then quick reference)
2. Run the verification chain: `tsc --noEmit` (FE) → `npm run build` (FE) → `npm run build` (BE). If a deleted route raises a phantom `TS2307`, delete `.next` first — see HOW TO RUN
3. **M0–M5 are complete, all gated green** (M2.5 Batches 1, 1.5, B2, B3, B4; M3; the D11 debt fix; M4 webboard; M5 profile activities + search + legal). The next work is **M6: Web 2 Integration** (§8.2), scope listed under M6 above — committee sync with its live/fallback toggle, knowledge-asset signed URLs, and `/about/committee` switching from local data to the live API. M7 (NFR + deploy) follows.
4. **Live DB note:** 5 migrations applied and `prisma migrate status` reports "up to date". M5 added `20260926100000_add_notifications`. The Prisma 7 migration workflow and its traps are recorded under M4's notes — in particular, `--from-schema-datasource` is removed and `--to-migrations` fails without a shadow DB; use `migrate diff --from-config-datasource --to-schema` then `migrate deploy`.
5. After each step: update this file, update Last Updated timestamp, record gates passed
6. Never claim done without all three gates passing
7. This file is the only handover surface — the coordinator's `memory/` notes and `.zedignore` are gitignored machine state, not documentation
