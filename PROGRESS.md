# 📊 FityatulHaq Public Website (Web 1) — Progress & Survival Guide

> **Last Updated:** 2026-09-24 · **Current Milestone:** M0 Complete (Steps 1–3 Done, committed & re-verified) — next: M1 · **Source of Truth:** `Requirement.pdf` (raw text at `requirement_raw.txt`)
>
> **⚠️ THIS FILE IS THE SURVIVAL GUIDE.** Every task, decision, deletion, and deviation must be recorded here. Before touching any file, read the full Milestones section, verify prerequisites, and confirm Definition-of-Done items are satisfied.
>
> **Repo state 2026-09-23:** M0 work committed (`6adf90f` backend · `617f7d4` homepage promotion + mock tags · `208fd7a` gitignore). Working tree clean except the owner's own `AGENTS.md` / `IDENTITY.md` / `SOUL.md` / `USER.md` deletions and untracked `.zedignore` — all four are intentional and must stay out of commits.

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
Database:    PostgreSQL (Supabase) — tables: User (role MEMBER|ADMIN|SUPERADMIN), RefreshToken, OtpCode
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
| `/search` | ❌ Missing | Global unified keyword search across all types |
| `/webboard` | ⚠️ Stub | Placeholder card — real threads come in M5 |
| `/webboard/general` | ⚠️ Stub | Guest-read/member-post — comes in M5 |
| `/webboard/youth-care` | ⚠️ Stub | Anonymous display + pending review — comes in M5 |
| `/webboard/[board]/[postId]` | ❌ Missing | Thread + nested comments — comes in M5 |
| `/register` | ✅ Implemented | Self-service registration with OTP |
| `/login` | ✅ Implemented | Cookie-based login |
| `/forgot-password` | ✅ Implemented | Email OTP flow |
| `/reset-password` | ✅ Implemented | Password reset page |
| `/verify-reset-code` | ✅ Implemented | OTP verification on reset |
| `/register/success` | ✅ Implemented | Registration confirmation |
| `/profile` | ✅ Implemented | Edit profile + avatar upload |
| `/profile/activities` | ❌ Missing | Member-only activity feed (tabs) — comes in M6 |
| `/privacy-policy` | ❌ Missing | PDPA static page — comes in M6 |
| `/terms` | ⚠️ Partially placed | Exists at `/(auth)/terms` — must move to `/terms` (guest-facing) |

### Non-PRD pages currently live

| Page | Why not in PRD | Action |
|------|---------------|--------|
| ~~`/dashboard`~~ | Not in PRD sitemap | **Done 2026-09-23** — route deleted; its UI was promoted to become `/`. All inbound links re-pointed. |
| `/community` | Not in PRD sitemap (added mid-build as programmes overview) | Delete page + remove inbound link — **not yet done; page still live** |
| `/faq` | Not in PRD sitemap (was leftover stub) | Delete page + remove unused data file — **not yet done; page still live** |
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
  - Migration `20260923012900_change_roles_enum` applied — renames old enum, creates `UserRole_new`, migrates data, renames back.
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

**Status:** 📋 Planned — Batch 1 (M2.5-1 Foundation) ✅ Done 2026-09-23 · Batch 1.5 (M2.5-1.5 Logo integration) ✅ Done 2026-09-24, all gates green · Batches 2–3 pending  
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
- **Batch B3 (M2.5-2) — M1 public pages + their mock data (M2.5-2 prompt):** news list/detail (`newsData.ts` content incl. department names — the filter chips are data-driven), announcements, about + committee, donate (keep the frozen placeholder bank values), contact, partners (`partnerData.ts`), profile/webboard/terms shells.
- **Batch B4 (M2.5-3) — M2 knowledge + closeout (M2.5-3 prompt):** hub + ten sections + `knowledgeItemsData.ts` content; site-wide leftover-English audit; M2.5 marked Done.
- **Backend stays English** (deviation to record): error codes/messages and zod messages are machine-facing; `errorMessages.ts` is the human-translation layer. Exception: the OTP email template in `backend/src/utils/smtp.ts` is member-facing — translate to Thai (D-T3; harmless now even though SMTP is unconfigured, debt D0).
- **Terminology sheet (single source for all batches):** เข้าสู่ระบบ = Log in · สมัครสมาชิก = Register · สมาชิก = Member · ออกจากระบบ = Log out · ดาวน์โหลด = Download · ความรู้/ศูนย์ความรู้ = Knowledge Hub · ข่าวสาร = News · ประกาศ = Announcements · ติดต่อเรา = Contact · โปรไฟล์ = Profile. Tone: neutral polite web-Thai, no gendered particles.

#### Definition of Done:
- Kanit self-hosted via `next/font/local`, no external font requests, weights resolve without faux-bold
- No user-facing English strings remain outside code identifiers (checklist per batch: labels, placeholders, buttons, banners, toasts, aria-labels, metadata, mock-data content)
- Thai dates site-wide via `formatDate` (`th-TH`)
- All three gates green after every batch; `/design-system` shows the Kanit specimen

#### Owner decisions pending:
- **D-T1** font weights: add Kanit Bold/ExtraBold files (preferred) or remap 700/800 → 600?
- **D-T2** `Prompt-Medium.ttf` role: skip for now (proposed) or pair as body face?
- **D-T3** translate the OTP email template to Thai now? (proposed: yes)
- **D-T4 ✅** delete `/community` + `/faq` in this milestone (pulling M5's deletion forward) — IN PROGRESS: **M2.5-1**
- **D-T5** Buddhist-era Thai dates (`th-TH` default) — confirm? (proposed: yes)

---

### M3: Header Complete — Logged-in State (§3.3, §3.4)

**PRD sources:** §3.2 (navigation), §3.3 (member state), §3.4 (mobile drawer)  
**Depends on:** M0-1 (role schema for moderator-specific items)  
**UI preserved:** Current sticky header — brand logo, desktop nav with dropdowns, hamburger menu. Extends what exists, does not rebuild.

#### Scope:
1. Header detects logged-in state via `useAuth()` hook from `AuthContext`
2. When logged in: replace Login/Register buttons with Avatar circle (uploaded image or initials fallback)
3. Notification bell icon with red dot indicator for unread count > 0
4. Dropdown menu (avatar click or bell click): Profile → `/profile`, Activities → `/profile/activities`, Account Settings (future placeholder), Logout
5. Mobile drawer §3.4: Hamburger drawer includes Avatar + sign-out option alongside navigation

#### Gate checks: FE tsc, FE build. Pass before M4/M5.

---

### M4: Webboard — Real Content (§5.3 + §7 Moderation)

**PRD sources:** §5.3.1–§5.3.4, §7.1–§7.3  
**Depends on:** M0-1 (role schema), M0-3 (fallback)  
**UI preserved:** If stub UI was already designed, extend it. Otherwise scaffold from scratch using design tokens.

#### Scope:
1. `/webboard` — Two board cards: Youth Care + General. "New Thread" button visible to members, hidden/redirect-to-login for guests (**via the M1.5 `?next=` return flow**)
2. `/webboard/youth-care` — Anonymous display mode ("Anonymous User #ID"), Pending/Answered status toggle, strict anonymity enforced, posts go to Pending Review queue until CONTENT_MODERATOR approves
3. `/webboard/general` — Tags, sort (Latest/Popular/Most Replied), instant moderation
4. `/webboard/[board]/[postId]` — Thread view, nested comments, report button. Guests: read-only. Members: comment + react + report
5. Moderation queue: accessible to CONTENT_MODERATOR role, per §7.1–§7.3 — approve/reject with reason, profanity filter, rate limiting

---

### M5: Profile Activities + Search + Legal (§5.4.5, §5.2.12, §5.5)

**PRD sources:** §5.4.5, §5.2.12, §5.5.1, §5.5.2  
**Depends on:** M2 (knowledge data for search index), M4 (webboard threads for activities tab)

#### Scope:
1. `/profile/activities` — Tabbed interface: "My Threads" (webboard posts), "My Answers", "Bookmarks", "Notifications". Member only. Each tab paginated with summary preview.
2. `/search` — Unified keyword search across ALL content types: news, announcements, courses, camps, encyclopedia, biography, etc. Results grouped by type with badge labels. Guest-accessible. Debounced input. No auth required.
3. `/privacy-policy` — Static PDPA-compliant page. Pure server component, no API calls.
4. Move `/terms` from `/(auth)/terms/page.tsx` → `/terms/page.tsx`. Public-facing, accessible to all.
5. Delete non-PRD pages: `/community`, `/faq` — `/dashboard` already resolved on 2026-09-23 (route deleted, UI promoted to `/`). Remove unused data files: `communityData.ts`, `faqData.ts`. Re-point all inbound links (see §2 Deletions section). **⚠️ The homepage panel is `components/home/DashboardPanel.tsx` — do not delete it during this cleanup.**

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

### Delete: `/community` — pulled forward to M2.5-1 (2026-09-23, owner decision D-T4)
- [ ] Delete `frontend/src/app/community/page.tsx`
- [ ] Delete `frontend/src/components/community/CommunityPage.tsx`
- [ ] **⚠️ Updated 2026-09-23:** `DashboardPanel.tsx` was NOT deleted — it was promoted to the `/` homepage and now lives at `components/home/DashboardPanel.tsx`. Do **not** delete it. Its category-card CTA (`href="/community"`, the SDU TMYDA card) must be re-pointed to `/knowledge` — matching the sibling TMYDA card's CTA.
- [ ] Delete `frontend/src/lib/communityData.ts`
- [ ] Header `DEFAULT_NAVIGATION`: remove the `Community` entry
- [ ] Verify build passes

### Delete: `/faq` — pulled forward to M2.5-1 (2026-09-23, owner decision D-T4)
- [ ] Delete `frontend/src/app/faq/page.tsx`
- [ ] Delete `frontend/src/components/faq/FaqPage.tsx`
- [ ] Delete `frontend/src/lib/faqData.ts`
- [ ] Verify no remaining imports of `FaqPage` or `FAQ_ITEMS`
- [ ] Footer `คำถามที่พบบ่อย` link entry removed
- [ ] Verify build passes

### Note: `/terms` relocation (not deletion)
- [ ] Move `frontend/src/app/(auth)/terms/page.tsx` → `frontend/src/app/terms/page.tsx`
- [ ] Verify terms page accessible at `/terms` without auth wrapper
- [ ] Update any imports referencing old group path
- [ ] Verify build passes

---

## 🔴 DEBT REGISTER (remaining issues)

### 🔴 CRITICAL

| # | Debt | Impact | Fix Steps | Depends on |
|---|------|--------|-----------|------------|
| D0 | SMTP credentials not verified | `SMTP_HOST=localhost` in `.env.example`. Real SMTP needed for OTP/email delivery (§6.3). Non-fatal: app continues without email, but OTP resets impossible. | Obtain real SMTP creds → set in `.env` → restart → verify transport works | None |
| D1 | Bucket name consistency | Tests hardcode `"assets"` in some assertions. PRD + `.env` say `"fityatulhaq-assets"`. Must align test expectations to actual bucket name used in prod/dev | Confirm bucket name against dashboard, then fix test stubs in `imageValidation.test.ts` lines that assert bucket strings | M0 completion |
| D2 | E2E smoke test never run | register → login → profile cycle against live Dev PG not formally executed | Manual end-to-end: register via API, login, verify session cookie, navigate to profile, upload avatar, confirm 200 on public URL | D1 resolved |
| D3 | `/terms` mislocated | Currently under `/(auth)/terms` (authenticated group). Should be public at `/terms` per PRD §5.5.2 | Move to `src/app/terms/page.tsx` | M5 |

### 🟠 HIGH

| # | Debt | Impact | Status |
|---|------|--------|--------|
| D4 | Test coverage thin | Only auth register smoke tested. Login, refresh rotation, forgot/reset cycle, OTP reuse/expiry, rate-limit 429 untested | Open — not blocking functional work |
| D5 | Committee data static | §5.1.7 says Web 2 API sync with `publicDisplay` flag. Currently hardcoded. | Open — deferred to M6 |
| D6 | Donate placeholders | Bank details and QR codes are obviously-placeholder values. Real data needed for launch. | Open — defer to M7 |
| D7 | Knowledge sub-routes missing | 10 routes absent (§5.2.2–§5.2.11). | Open — M2 |
| D8 | Search endpoint missing | Global unified search absent (§5.2.12). | Open — M5 |
| D9 | Profile activities missing | `/profile/activities` absent (§5.4.5). | Open — M5 |
| D10 | Privacy policy missing | `/privacy-policy` absent (§5.5.1). | Open — M5 |
| D11 | Role enum mismatch | `MEMBER|ADMIN|SUPERADMIN` ≠ PRD's `GUEST|MEMBER|CONTENT_MODERATOR`. Schema column exists but enum values wrong. | Open — M0-1 fixes this |

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

- **Coordinator (this AI):** Engineers prompts, runs deep-code-review gate, updates this file
- **Zed (execution coder):** Writes code following prompts. One continuous thread per milestone
- **Big Mo (project owner):** Bridges coordinator ↔ Zed. Final authority on acceptance
- **Model routing:** DeepSeek Flash = complex logic/architecture. GLM Flash = scaffolding/UI/large files
- **Prompt hygiene:** Single-copyable markdown blocks; anticipate side effects 3 steps ahead; zero-rework philosophy
- **Verification gates:** Non-negotiable. `tsc --noEmit` → `npm run build` (FE) → `npm run build` (BE) → deep-code-review. All three must pass before marking any step done
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
- `deep-code-review` skill: **path is dead** — `C:\Users\muham\.openclaw\` was deleted 2026-09-23. Restore the skill before running the next deep-code-review gate.
- Stale `.next` serves a previous version of a page (blank output or outdated UI) after a route change or a build/dev collision; the same cache produces phantom `TS2307` errors for deleted routes. Recovery protocol is under HOW TO RUN — deleting `.next` is always safe, and the fix is never in source.
- Gitignored scratch that will reappear in `git status` if the rules are ever lost: `.tmp.driveupload/` (OneDrive upload staging), `memory/` and `.openclaw/` (coordinator runtime state). `.previews/` is tracked on purpose.
- **Never run two `next dev` instances on the same checkout** — they share one `.next` and corrupt each other (2026-09-23: a second instance on :3001 sat alongside the detached one on :3000; both were killed and a single fresh instance started). One server, or none.
- **LAN-IP origins (`http://192.168.x.x:<port>`) fail CORS by design in dev.** The dev-loopback bypass in `src/index.ts` (`LOOPBACK_ORIGIN_PATTERN`) only covers `localhost` / `127.0.0.1` / `[::1]` with any port; a LAN-IP origin gets `[CORS_REJECTED]` in the backend log and no `Access-Control-Allow-Origin` header. Do **not** fix this by adding the LAN origin to `CORS_ALLOWED_ORIGINS` — it would pass the preflight but `SameSite=lax` auth cookies are cross-site from a LAN origin, so the session still would not stick. Always browse via `http://localhost:<port>`. Real multi-device testing needs HTTPS + `COOKIE_SAME_SITE=none` — defer to M7.
- **Next.js 15.5.25 → 16:** Breaking changes exist (async Request APIs, caching semantics). Codemod available: `npx @next/codemod upgrade latest`. Defer to M7 deployment per Big Mo's approval.

---

## ✅ HANDSHAKE FOR NEXT SESSION

1. Read this whole file (milestones section first, then debt register, then quick reference)
2. Run the verification chain: `tsc --noEmit` (FE) → `npm run build` (FE) → `npm run build` (BE). If a deleted route raises a phantom `TS2307`, delete `.next` first — see HOW TO RUN
3. Begin **M1** — M0 (Steps 1–3) is complete; the next work is the §5.1 public-pages follow-up, starting with the first real consumer of `requireRole.ts`
4. After each step: update this file, update Last Updated timestamp, record gates passed
5. Never claim done without all three gates passing
6. This file is the only handover surface — the coordinator's `memory/` notes and `.zedignore` are gitignored machine state, not documentation
