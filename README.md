# FityatulHaq Public Website — Web 1

> Portal Komunitas dan Informasi Publik FityatulHaq

---

## Project Structure

```
fityatulhaq/
├── frontend/               # Next.js 14 (App Router) — Public-facing UI
│   ├── src/
│   │   ├── app/            # App Router pages & layouts
│   │   ├── components/     # Shared React components
│   │   ├── lib/            # NextAuth config, API client, helpers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── types/          # Shared TypeScript types
│   │   └── utils/          # Utility functions (sanitization, formatting)
│   ├── public/             # Static assets
│   ├── .env.example        # Frontend environment template
│   ├── package.json
│   ├── tailwind.config.ts  # (Phase 3)
│   ├── next.config.ts      # (Phase 3)
│   └── tsconfig.json
│
├── backend/                # Express.js BFF / Public REST API
│   ├── src/
│   │   ├── config/         # App config, env validation (zod)
│   │   ├── middleware/      # Auth, rate-limit, sanitize, error handler
│   │   ├── routes/         # Express router definitions
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic layer
│   │   ├── utils/          # Shared utilities (logger, response helpers)
│   │   └── index.ts        # Express app entry point
│   ├── prisma/
│   │   ├── schema.prisma   # (Phase 2) — with sourceId & syncStatus
│   │   └── seed.ts         # Database seeder
│   ├── .env.example        # Backend environment template (ALL secrets)
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
├── package.json            # Root orchestrator (concurrently)
└── README.md
```

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | TailwindCSS 3 |
| Backend/BFF | Express.js + TypeScript |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Authentication | NextAuth.js v4 + JWT + bcrypt |
| File Storage | Supabase Storage |
| HTTP Security | Helmet, express-rate-limit |
| Input Sanitization | express-validator, xss, zod |
| Logging | Winston |

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL running locally (or connection string from Neon/Supabase)

## Setup

```bash
# 1. Install all dependencies (root + frontend + backend)
npm run install:all

# 2. Configure environment variables
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
# → Fill in all values in both .env files

# 3. Run database migrations (Phase 2 — after Prisma schema is defined)
npm run prisma:migrate

# 4. Start development servers
npm run dev
# → Frontend: http://localhost:3000
# → Backend:  http://localhost:4000
```

## NFR Compliance Checklist

- [x] **Security**: Rate limiting (5 auth attempts/15min/IP via `express-rate-limit`)
- [x] **Security**: XSS prevention via `xss` + `express-validator` + `isomorphic-dompurify`
- [x] **Security**: SQL Injection prevention via Prisma parameterized queries
- [x] **Security**: HTTP headers hardened via `helmet`
- [x] **Security**: Strict env var separation (no DB secrets in frontend)
- [ ] **Performance**: FCP < 2.5s — Next.js image optimization configured (Phase 3)
- [ ] **Integration**: `sourceId` + `syncStatus` on all core Prisma models (Phase 2)
- [ ] **Auth**: NextAuth session + JWT refresh flow (Phase 3+)
