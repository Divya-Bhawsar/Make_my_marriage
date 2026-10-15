# Make My Marriage

Make My Marriage is a digital wedding management platform designed for couples and families collaboratively planning and managing Indian weddings.

---

## 1. Architecture Overview

* **Architecture Style:** Modular Monolith
* **Framework:** Next.js (App Router) + React
* **Language:** TypeScript (Strict Mode)
* **Database:** MongoDB Atlas via Mongoose ODM
* **Validation:** Zod at all system boundaries
* **Authentication:** Custom server-side sessions with SHA-256 hashed tokens and `HttpOnly` cookies
* **Media Storage:** Cloudflare R2 via direct signed browser uploads
* **Email:** Resend + lightweight MongoDB background email jobs processed by Vercel Cron
* **External Integrations:** Google Places API for vendor discovery, YouTube Live embed for livestreaming

---

## 2. Getting Started

### Prerequisites
* Node.js v20+ (Node v20, v22, or v25)
* A running MongoDB instance (local or MongoDB Atlas connection string)

### Setup Instructions

1. **Clone and Navigate:**
   ```bash
   cd /Applications/XAMPP/Make_my_marriage
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env.local
   ```
   Update `.env.local` with your MongoDB connection string (`DATABASE_URL`) and a secure `SESSION_SECRET`.

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Available Scripts

* `npm run dev` — Starts Next.js development server with hot reloading
* `npm run build` — Compiles production application build
* `npm run start` — Starts compiled production application
* `npm run lint` — Runs ESLint checks
* `npm run typecheck` — Executes TypeScript compiler validation (`tsc --noEmit`)
* `npm run test` — Executes test suite using Vitest
* `npm run test:watch` — Starts Vitest in interactive watch mode

---

## 4. Codebase Organization

```text
src/
├── app/                  # Next.js App Router (UI surfaces and API route handlers)
│   ├── (auth)/           # Authentication flows (login, signup, password reset)
│   ├── (dashboard)/      # Authenticated wedding management command center
│   ├── (public)/         # Token-protected guest invitations, wedding website, and gallery
│   └── api/              # REST API Route Handlers (/api/*)
├── env.ts                # Validated environment variables (Zod)
├── modules/              # Domain modules (encapsulated business logic, services, models)
├── server/               # Server-only shared infrastructure (DB pooling, logging)
└── shared/               # Universal types, constants, error classes, and validators
```

---

## 5. Architectural Rules & Guidelines

1. **Wedding as Tenant Boundary:** Every private resource belongs to a `Wedding`. Always resolve `weddingId` from the authenticated session membership, never from client input.
2. **Thin Route Handlers:** API routes only handle authentication, authorization, Zod validation, calling domain services, and returning standard response envelopes.
3. **Paise Minor Units:** All monetary values are integers in paise (INR).
4. **Frictionless Guests:** Guests never create accounts; access is controlled via high-entropy, random URL tokens.
5. **No Proxied Uploads:** Images upload directly to Cloudflare R2 using pre-signed URLs; only metadata is persisted in MongoDB.

---

## 6. Implemented APIs (Phase 1: Foundation)

### Authentication (`/api/auth/*`)
* `POST /api/auth/signup` — Registers user, hashes password via bcrypt, sets `mmm_session` cookie (`201 Created`).
* `POST /api/auth/login` — Authenticates credentials, sets `mmm_session` cookie (`200 OK`).
* `POST /api/auth/logout` — Deletes active session from DB, clears `mmm_session` cookie (`200 OK`).
* `GET /api/auth/me` — Resolves session, returns active user, membership, and wedding (`200 OK` or `401`).

### Wedding Workspace (`/api/wedding`)
* `POST /api/wedding` — Creates a wedding workspace and assigns creator the `ADMIN` role (`201 Created`).
* `GET /api/wedding` — Retrieves current wedding details for authenticated members (`200 OK`).
* `PATCH /api/wedding` — Updates wedding details without mutating the published slug (`200 OK`).

### Operational Health (`/api/health`)
* `GET /api/health` — Returns system uptime, environment, and MongoDB connection status.

---

## 7. Specification Documents

Approved design baselines reside in the `docs/` folder:
* [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document
* [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) — System Design Architecture Document
* [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) — Database Design Document
* [`docs/API_DESIGN.md`](docs/API_DESIGN.md) — REST API Design Document
