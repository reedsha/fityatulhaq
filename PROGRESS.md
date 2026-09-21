# 📊 FityatulHaq Public Website (Web 1) - Progress Tracking

> **Last Updated:** 2026-09-21 · **Current Phase:** Phase 0 Complete · Phase 1 in progress (schema done, migration pending DB URL)

> **Environment strategy:** Dev Supabase project now → real project later. All Supabase/Postgres config lives in `.env` files (backend `.env`, frontend `.env.local`); no code references a project ID, so the swap is a pure config change. Frontend SSR helpers (`src/utils/supabase/*`) + session-refresh middleware are already wired.

This document outlines the detailed development plan, architecture requirements, and progress tracking for the FityatulHaq Public Website, based on SRS Version 1.0.

## 🛠 1. Technology Stack (Section 10)
- [x] **Frontend:** Next.js **15.5.25** (React) + TailwindCSS — installed & package-configured
- [x] **Backend/API:** Express.js **4.21.2** + TypeScript + Prisma ORM **7.10.0** — installed & package-configured
- [~] **Database:** PostgreSQL (Independent from Web 2) — *Prisma 7 schema drafted & validated (`User`, `RefreshToken`, `OtpCode`); initial migration SQL generated offline; first `migrate dev` pending dev Supabase DB URL*
- [x] **Authentication:** NextAuth.js **4.24.11** + JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) — packages installed
- [x] **File Storage:** Supabase Storage — `@supabase/supabase-js` installed on both frontend & backend
- [ ] **Deployment:** Cloudflare Workers (Frontend) + Docker (Backend) — *Phase 5*
- [ ] **Realtime (Optional):** Supabase Realtime / WebSocket for Webboard notifications — *Phase 4*

## ⚙️ 2. Non-Functional Requirements (Section 9)
- [ ] **Responsive Design:** Support Desktop (1280px), Tablet (768px), Mobile (375px).
- [ ] **Performance:** First Contentful Paint (FCP) < 2.5 seconds on mobile networks.
- [ ] **Optimization:** Implement Image Optimization and Lazy Loading for media-heavy pages.
- [ ] **Caching:** Configure CDN/Caching for static public content (News, Articles).
- [ ] **Security:**
  - [ ] HTTPS enforcement on all pages.
  - [x] Prisma ORM parameterized queries (SQLi prevention) — Prisma 7.10.0 installed.
  - [x] Input sanitization packages installed: `xss`, `express-validator`, `isomorphic-dompurify`, `zod`.
  - [x] Rate limiting package installed: `express-rate-limit` 7.5.0. NFR constants pre-configured in `backend/.env.example` (`AUTH_RATE_LIMIT_MAX_ATTEMPTS=5`, `AUTH_RATE_LIMIT_WINDOW_MS=900000`).
  - [x] HTTP hardening package installed: `helmet` 8.0.0.
  - [x] Strictly separated Environment Variables — `backend/.env.example` holds ALL secrets; `frontend/.env.example` holds browser-safe vars only (no DB creds, no Service Role key).
- [ ] **SEO:** SSR/Static Generation for public content, Meta Tags, Open Graph Images, `sitemap.xml`, `robots.txt`.
- [ ] **Accessibility:** Alt text for images, Semantic HTML, WCAG 2.1 AA minimum contrast.
- [ ] **Browser Support:** Latest 2 versions of Chrome, Safari, Edge, Firefox (Priority: Safari iOS, Chrome Android).

## 🔄 3. Future Integration Prep (Section 8.2)
- [ ] **Database Schema Prep:** Add `sourceId` (String/Nullable) and `syncStatus` (Enum) fields to `News`, `Announcements`, `Committee`, `Knowledge`, and `Users` tables — *awaiting Phase 2: Prisma schema*.
  > `WEB2_API_BASE_URL` and `WEB2_API_WEBHOOK_SECRET` are pre-stubbed (commented-out) in `backend/.env.example`, ready to activate when Web 2 sync goes live.

---

## 🚀 4. Development Roadmap & UI Implementation

### ✅ Phase 0: Environment & Repository Initialization — COMPLETE
> Completed: 2026-09-21

**Files Created:**
- [x] `/package.json` — Root orchestrator with `concurrently` (runs frontend + backend simultaneously via `npm run dev`)
- [x] `/.gitignore` — All `.env` variants, `node_modules/`, build outputs excluded
- [x] `/README.md` — Project map, tech stack table, setup guide, NFR checklist
- [x] `/frontend/package.json` — Next.js 15, Tailwind, NextAuth, Supabase, DOMPurify, bcrypt, Axios
- [x] `/frontend/tsconfig.json` — Strict TypeScript, App Router compatible, `@/*` path aliases
- [x] `/frontend/.env.example` — Browser-safe vars only (`NEXT_PUBLIC_*`, `NEXTAUTH_*`, `BACKEND_API_URL`)
- [x] `/backend/package.json` — Express, Prisma 7, JWT, bcrypt, Helmet, rate-limit, xss, zod, Winston
- [x] `/backend/tsconfig.json` — CommonJS → `dist/`, strict TypeScript, layered path aliases
- [x] `/backend/.env.example` — All secrets (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, rate-limit NFR constants, Web 2 stub vars)

**Dependency Audit Results:**
- [x] Backend: **0 vulnerabilities** (Prisma upgraded 6.x→7.10.0; overrides applied for `deepmerge-ts` + `mysql2`)
- [x] Frontend: 2 remaining (build-tool `postcss` bundled inside `next` — **accepted risk**, dev-environment only, no production attack vector)

**Quick Start (after filling `.env` files):**
```bash
npm run install:all   # install root + frontend + backend
npm run dev           # http://localhost:3000 + http://localhost:4000
```

---

### Phase 1: Core Framework & Authentication (Sprint 1)

**Global UI Layout (Sections 3 & 4)**
- [ ] **Header (Sticky):**
  - [ ] Left: Logo (links to Home) + Short Name (Desktop only).
  - [ ] Center: Main Navigation (Home, News/PR, About, Knowledge, Webboard, Search Icon).
  - [ ] Right (Guest): Outline "Login" button, Solid Green "Register" button.
  - [ ] Right (Member): Notification Bell, Avatar with Dropdown (Profile, My Threads, Settings, Logout).
  - [ ] Mobile: Hamburger Menu (Drawer from side) -> Accordion menus, Auth buttons at top, Search bar below.
- [ ] **Footer:**
  - [ ] 4 Columns: 1. About (Logo, short contact), 2. Quick Links, 3. Contact Channels, 4. Legal (Privacy, Terms, Sitemap).
  - [ ] Bottom Bar: Copyright text, Arabic quote + translation, Circular Social Media Icons.

**Authentication System (Sections 5.4 & 6)**
- [~] **Database & API:** JWT (7-day refresh) + bcrypt + OTP models in Prisma schema — *schema done; Express auth endpoints next*
- [ ] **`/register`:** Form (Name, Email/Username, Password, Confirm, Phone [opt], DOB [opt], Terms checkbox). OTP/Email verification flow.
- [ ] **`/login`:** Form (Username/Email, Password), links to Forgot Password and Register.
- [ ] **`/forgot-password`:** Email/Phone input -> OTP/Link (15 min expiry) -> New Password form.
- [ ] **`/profile`:** Member Only. Edit personal info, Avatar upload, Download history.
- [ ] **`/profile/activities`:** Member Only. Tabs: My Threads, Youth Care Qs (with status), My Comments, Bookmarks.

### Phase 2: PR & Corporate Communications (Sprint 1)

**Page Implementations (Section 5.1)**
- [ ] **`/` (Home):**
  - [ ] Hero Banner Carousel (Admin configurable).
  - [ ] Event Pop-up/Highlight Modal (Dismissible).
  - [ ] 4-Pillar Cards (Communication, Info, Community, Admin).
  - [ ] Latest News Section (3-6 cards, "View All" btn).
  - [ ] Latest Announcements Section.
  - [ ] Knowledge Hub Highlights (Featured courses/books/videos).
  - [ ] Call-to-action Register Section (Hidden if logged in).
  - [ ] Popular/Latest Webboard Threads Section.
- [ ] **`/news`:** Grid cards (Cover, Title, Date, Dept, Excerpt). Department Tabs/Dropdown filter. Pagination/Infinite Scroll. Search bar.
- [ ] **`/news/[slug]`:** Rich Text content (Images, Videos, Gallery). Social Share buttons. "Related News" section.
- [ ] **`/announcements`:** Formal List view (Ref number, Date). PDF Download Icon.
- [ ] **`/announcements/[slug]`:** Formal content text. PDF Download button. Digital signature (if applicable).
- [ ] **`/about`:** Org Chart Image, Vision, Mission, History, link to Committee.
- [ ] **`/about/committee`:** Grid cards (Photo, Name, Position). Department Tabs. *Constraint: No private contact info.*
- [ ] **`/donate`:** Bank/PromptPay details, QR Code image, Proof of transfer form/info.
- [ ] **`/contact`:** Contact Form, Google Maps embed, Social/Phone links.
- [ ] **`/partners`:** Grid of Partner Logos with external links (open in new tab). Grouped by category.

### Phase 3: Knowledge Hub & Gated Content (Sprint 2)

**Page Implementations (Section 5.2 & Content Gating Flow)**
*Note: Implement API-level Token validation for Member-only files via Signed URLs.*
- [ ] **`/knowledge`:** Grid of 9 main categories. Quick search. Popular/Latest sections.
- [ ] **`/knowledge/courses`:** Grid cards (Title, Level, Duration, Cover). Detail page (Content, Instructor, Docs).
- [ ] **`/knowledge/camps`:** Timeline or Grid layout. Detail page (Objective, Schedule, Photo Gallery).
- [ ] **`/knowledge/academic`:** List view with Category Tags. **[Lock Icon]** Full PDF download for Members only (Guest sees abstract).
- [ ] **`/knowledge/encyclopedia`:** Short card layout, Tags, In-category search.
- [ ] **`/knowledge/biography`:** Grid of persons (Photo, Era). Detail page.
- [ ] **`/knowledge/youth-advice`:** List categorized by Target Group (Parents, Youth, Teachers).
- [ ] **`/knowledge/qa` (Knowledge Archive):** FAQ Accordion format. Category filter. "Ask New Question" button (Member only - redirects to Webboard Youth Care).
- [ ] **`/knowledge/books`:** Grid of Book Covers (Title, Author, Excerpt). **[Lock/Free Badge]**. Guest: View details, Download redirects to Login. Member: Direct file download.
- [ ] **`/knowledge/videos`:** Grid of Thumbnails. **[Member Badge]**. Embed Player. Guest: Sees thumbnail/description of gated vids. Member: Can play gated vids.
- [ ] **`/knowledge/recommended`:** List format with Category Badges. Filter dropdown.
- [ ] **`/search`:** Unified Search Box + Filters. Mixed List results. Display **[Lock Icon]** on gated results to encourage signup.

### Phase 4: Webboard & Community (Sprint 3)

**Page Implementations (Section 5.3 & 7)**
- [ ] **`/webboard`:** Portal with 2 main board cards. Latest threads cross-board list. "New Thread" button (Auth required).
- [ ] **`/webboard/youth-care`:** 
  - [ ] List of Questions. Enforce Anonymous Display ("Anonymous User #ID").
  - [ ] Status badges: Pending / Answered.
  - [ ] Member Action: "Ask Question" (Strict Anonymous toggle option).
  - [ ] *Logic:* New posts set to `Pending Review`. Only visible to user in `/profile/activities` until Admin approves/answers.
- [ ] **`/webboard/general`:** 
  - [ ] Standard Forum List. Tags, Sorting (Latest, Popular, Most Replied).
  - [ ] Member Actions: "New Thread". Post moderation is instant.
- [ ] **`/webboard/[board]/[postId]`:** 
  - [ ] Main Thread content.
  - [ ] Comment Thread (Chronological or Nested).
  - [ ] "Report Inappropriate Content" button on all posts/comments.
  - [ ] Guest View: Read-only. Comment box locked with "Login to comment" message.
  - [ ] Member View: Can comment, Like/React, Report.

### Phase 5: Legal & Final Polish (Sprint 3)
- [ ] **`/privacy-policy`:** Static text page detailing PDPA compliance.
- [ ] **`/terms`:** Static text page detailing Webboard rules and usage terms.
- [ ] **QA & Access Control Testing:** Rigorously test Guest vs Member boundaries, especially file download bypass attempts.