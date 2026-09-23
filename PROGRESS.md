# 📊 FityatulHaq Public Website (Web 1) — Progress & Survival Guide

> **Last Updated:** 2026-09-23 · **Current Milestone:** M0 Complete (Steps 1–3 Done) — next: M1 · **Source of Truth:** `Requirement.pdf` (raw text at `requirement_raw.txt`)
>
> **⚠️ THIS FILE IS THE SURVIVAL GUIDE.** Every task, decision, deletion, and deviation must be recorded here. Before touching any file, read the full Milestones section, verify prerequisites, and confirm Definition-of-Done items are satisfied.

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
| `/` | ✅ Implemented | Reference-design landing page (promoted from `/dashboard`): hero, ticker, category cards, news grid, webboard preview, stats — **auth-gated: guests redirect to `/login`** |
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
| `/knowledge/courses` | ❌ Missing | Sub-route |
| `/knowledge/camps` | ❌ Missing | Sub-route |
| `/knowledge/academic` | ❌ Missing | 🔒 member-gated + signed URL downloads |
| `/knowledge/encyclopedia` | ❌ Missing | Sub-route |
| `/knowledge/biography` | ❌ Missing | Sub-route |
| `/knowledge/youth-advice` | ❌ Missing | Sub-route |
| `/knowledge/qa` | ❌ Missing | 🔒 member-gated ask form + FAQ accordion |
| `/knowledge/books` | ❌ Missing | 🔒 member-gated + signed URL downloads |
| `/knowledge/videos` | ❌ Missing | 🔒 member-gated + embedded player |
| `/knowledge/recommended` | ❌ Missing | Sub-route |
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

---

### M1: Completed — §5.1 Public Pages

**Status:** ✅ Done  
**Scope:** News list/detail, announcements list/detail, about+committee, donate, contact, partners

**Remaining work per PRD compliance:**
- Committee data is currently static JSX array. Per §5.1.7: "← Sync from Web 2 API → Read-only" with `publicDisplay` flag. Implementation deferred to M7 (Web 2 integration).
- Donate bank details are placeholders. PRD says real bank/PromptPay details + QR codes. Replace before M8 deployment.
- Partner logos are static SVG/placeholder images. Real partner assets come via Web 2.

---

### M2: Knowledge Hub Full (§5.2)

**PRD sources:** §5.2.1–§5.2.12  
**Depends on:** M0-1 (role schema), M0-2 (signed URL service), M0-3 (fallback strategy)  
**UI preserved:** Current `/knowledge` landing page — dark band header, category tiles with lock badges, "While you wait" cross-links — NOT rebuilt. Extended: non-interactive `<article>` tiles become `<Link>` components pointing to real sub-routes.

#### What to implement (exact PRD scope):

1. `/knowledge/[category]/page.tsx` — create for each of the 10 categories:
   - `courses` — public, grid layout (title, description, date, difficulty badge)
   - `camps` — public, timeline/grid hybrid (date, location, gallery thumbnail)
   - `academic` — **Public OR Member with gate**, tag cloud layout, gated PDF/Word downloads via signed URL
   - `encyclopedia` — public, card grid with tags/categories
   - `biography` — public, portrait grid with brief bios
   - `youth-advice` — public, rich-text article format
   - `qa` — **Public OR Member with gate**, FAQ accordion + member "Ask" button → logs question for Youth Care board discussion
   - `books` — **Public OR Member with gate**, book cover grid, guest sees title+abstract only, member triggers signed URL download
   - `videos` — **Public OR Member with gate**, thumbnail grid with video player embed, guest sees thumbnail+description, member plays
   - `recommended` — public, curated list with type badges ("News", "Book", "Video")

2. **Gating logic:** For academic, qa, books, videos — public access shows abstract; clicking a gated action redirects to login (per §6.5). After login, the signed URL flow grants temporary access.

3. **KnowledgeHubPage.tsx changes:** Only the category tiles change — `<article>` becomes `<Link href="/knowledge/${category.id}">`. Rest of page preserved verbatim.

4. **Gate checks:** FE tsc, FE build, BE build. All three pass.

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
1. `/webboard` — Two board cards: Youth Care + General. "New Thread" button visible to members, hidden/redirect-to-login for guests
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
| `/dashboard` | Not in PRD | Route deleted; its UI **promoted to `/`** (2026-09-23). The panel moved to `components/home/DashboardPanel.tsx`; all inbound links → `/` | Unified the two competing homepage implementations; `/` is now the signed-in landing page |
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

### Delete: `/community`
- [ ] Delete `frontend/src/app/community/page.tsx`
- [ ] Delete `frontend/src/components/community/CommunityPage.tsx`
- [ ] **⚠️ Updated 2026-09-23:** `DashboardPanel.tsx` was NOT deleted — it was promoted to the `/` homepage and now lives at `components/home/DashboardPanel.tsx`. Do **not** delete it. Instead: audit the panel's category-card CTAs for any `/community` links and re-point or remove them.
- [ ] Delete `frontend/src/lib/communityData.ts`
- [ ] Verify build passes

### Delete: `/faq`
- [ ] Delete `frontend/src/app/faq/page.tsx`
- [ ] Delete `frontend/src/components/faq/FaqPage.tsx`
- [ ] Delete `frontend/src/lib/faqData.ts`
- [ ] Verify no remaining imports of `FaqPage` or `FAQ_ITEMS`
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
- `deep-code-review` skill at: `C:\Users\muham\.openclaw\skills\deep-code-review\SKILL.md`
- **Next.js 15.5.25 → 16:** Breaking changes exist (async Request APIs, caching semantics). Codemod available: `npx @next/codemod upgrade latest`. Defer to M7 deployment per Big Mo's approval.

---

## ✅ HANDSHAKE FOR NEXT SESSION

1. Read this whole file (milestones section first, then debt register, then quick reference)
2. Run the verification chain: `tsc --noEmit` (FE) → `npm run build` (FE) → `npm run build` (BE)
3. Begin **M0-Step 1**: Role Schema Alignment
4. After each step: update this file, update Last Updated timestamp, record gates passed
5. Never claim done without all three gates passing
