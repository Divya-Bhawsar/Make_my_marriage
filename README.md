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

## 6. Implemented Features & APIs (Phase 1: Foundation)

### Public Platform Homepage (`/`)
* **Visual-First Landing Page:** Designed specifically for Indian weddings with headline *"Your Wedding. Your People. Your Plan. All in One Place."*
* **Bespoke Vector Logo:** Luxury ceremonial insignia combining the Gathbandhan knot, lotus arch, and gold foil gradients.
* **Interactive 4-Theme Switcher:** Live preview switcher allowing couples to preview Royal Crimson, Marigold Amber, Regal Emerald, and Pastel Gulabi palettes.
* **Realistic Cards & Fast Contrast:** Live mock wedding preview with ceremony thumbnails, exact caterer headcounts, and a side-by-side comparison against WhatsApp chaos.

### Authentication UI Pages (`/signup` & `/login`)
* **Luxury Auth Shell:** Shared royal card container featuring the ceremonial Gathbandhan vector emblem, trust badges, and gold accents.
* **Interactive Signup Form (`/signup`):** Client-side validation, password visibility toggle, conflict error alerts (e.g. existing email), and automated onboarding redirect.
* **Interactive Login Form (`/login`):** Streamlined sign-in with credential verification, inline error handling, and direct routing to the couple dashboard.

### Wedding Setup & Onboarding (`/onboarding`)
* **3-Step Royal Wizard:** Collects couple names (Bride & Groom), auspicious wedding date, destination city (with 1-click popular pills), and custom celebration title.
* **Live Workspace Preview:** Dynamic real-time preview card displaying couple names, date, destination city, and countdown badge (*"X Days to Go"*).
* **Workspace Creation:** Creates wedding in MongoDB via `POST /api/wedding`, generates unique URL slug, sets creator as `ADMIN`, and forwards to `/app`.

### Couple Command Center Shell (`/app`)
* **Dashboard Shell:** Authenticated command center displaying active wedding details, countdown clock, user identity, and navigation to ceremony, guest list, expense ledger, and wedding website modules.

### Multi-Ceremony Itinerary Manager (`/app/ceremonies`)
* **Visual Timeline & Presets:** Manage Haldi, Mehendi, Sangeet, Pheras, and Reception with 1-click presets, dress code badges, and Google Maps venue navigation.
* **Tenant-Isolated REST APIs:** `GET /api/events`, `POST /api/events`, `PATCH /api/events/:eventId`, and soft `DELETE /api/events/:eventId`.

### Guest List & Caterer Plate Tracker (`/app/guests` & `/invite/:token`)
* **Roster Management:** Segregation by groom vs. bride side (Vivek & Eisha), party size headcounts, dietary requirements (Pure Veg, Jain, Non-Veg), and ceremony invitations.
* **Caterer Plate Calculator:** Live calculation of confirmed attending plates, total party capacity, pending counts, and dietary chips to prevent caterer overbilling and food waste.
* **1-Click WhatsApp Invitations:** High-entropy tokenized link generation with pre-composed WhatsApp invitation copy.
* **Accountless 1-Tap RSVP Page (`/invite/:token`):** Public royal wedding card for guests with ceremony schedule and instant attendance confirmation without app installs or passwords.

### Authentication APIs (`/api/auth/*`)
* `POST /api/auth/signup` — Registers user, hashes password via bcrypt, sets `mmm_session` cookie (`201 Created`).
* `POST /api/auth/login` — Authenticates credentials, sets `mmm_session` cookie (`200 OK`).
* `POST /api/auth/logout` — Deletes active session from DB, clears `mmm_session` cookie (`200 OK`).
* `GET /api/auth/me` — Resolves session, returns active user, membership, and wedding (`200 OK` or `401`).

### Wedding Workspace APIs (`/api/wedding`)
* `POST /api/wedding` — Creates a wedding workspace and assigns creator the `ADMIN` role (`201 Created`).
* `GET /api/wedding` — Retrieves current wedding details for authenticated members (`200 OK`).
* `PATCH /api/wedding` — Updates wedding details without mutating the published slug (`200 OK`).

### Guest & RSVP APIs (`/api/guests/*` & `/api/public/invitations/*`)
* `GET /api/guests` — Lists guests for wedding with query filters (`side`, `rsvpStatus`, `search`, `dietary`).
* `POST /api/guests` — Adds family or individual guest with party capacity and invited events (`201 Created`).
* `GET /api/guests/:guestId` — Retrieves guest family details.
* `PATCH /api/guests/:guestId` — Updates guest details, headcounts, or RSVP status.
* `DELETE /api/guests/:guestId` — Removes guest from wedding roster.
* `GET /api/guests/:guestId/invitation-link` — Returns secret tokenized invitation URL and pre-composed WhatsApp message.
* `GET /api/guests/plate-summary` — Aggregates real-time caterer plate metrics and dietary breakdown.
* `GET /api/public/invitations/:token` — Public read endpoint returning ceremony schedule and guest details.
* `POST /api/public/invitations/:token/rsvp` — Public 1-tap RSVP endpoint saving confirmed headcounts and dietary choice.

### Rupee Expense Ledger APIs (`/api/expenses/*`)
* `GET /api/expenses` — Lists expenses with search, category, payment status, and payer side filters.
* `POST /api/expenses` — Records new wedding expense with integer paise minor units (`201 Created`).
* `GET /api/expenses/summary` — Aggregates financial totals, advance tokens, pending balance dues, category spending breakdown, and payer distributions.
* `GET /api/expenses/:expenseId` — Retrieves single expense entry.
* `PATCH /api/expenses/:expenseId` — Updates expense entry and synchronizes payment status.
* `DELETE /api/expenses/:expenseId` — Permanently removes expense from financial ledger.

### Tasks Checklist & Family Committees (`/app/tasks`)
* **8 Ceremonial Preparation Committees:** Rituals & Puja, Hospitality & Logistics, Catering & Halwai, Attire & Jewellery, Music & Sangeet, Decor & Flowers, Cards & Shagun, General Duties.
* **Family Squad Coordination:** Assign duties to specific workspace members or family squads (e.g. "Mama ji's Squad", "Pooja Didi & Cousins") with calendar due dates and priority alerts (`HIGH`, `MEDIUM`, `LOW`).
* **Interactive Checklist & Summary Strip:** Real-time completion progress %, urgent counters, 4 quick view tabs, and 1-click status checkboxes with automatic completion timestamps.
* `GET /api/tasks`, `POST /api/tasks`, `GET /api/tasks/summary`, `GET /api/tasks/members`, `GET /api/tasks/:taskId`, `PATCH /api/tasks/:taskId`, `DELETE /api/tasks/:taskId`.

### Vendor Notebook & Nearby Discovery (`/app/vendors`)
* **Hired Vendor Notebook:** Maintain contracted vendors across 14 Indian wedding categories (Photographer, Videographer, Venue, Caterer, Decorator, DJ, Makeup Artist, Pandit, etc.) with 1-tap phone calling, address maps, website links, and ceremony assignments.
* **Financial Contract Tracking:** Track agreed costs in integer paise (`totalAgreedCostPaise`), cross-linked with the Rupee Expense Ledger to display paid vs. remaining dues.
* **Nearby Vendor Discovery:** Location-aware marketplace powered by Google Places for exploring top-rated wedding venues, halwais, decorators, and photographers in the wedding destination city with 1-click "Add to My Vendors" import (`POST /api/vendors/from-place`).
### Themed Wedding Website & Live Streaming (`/w/:slug` & `/app/website`)
* **Luxury Public Wedding Website (`/w/:slug`):** Hosted public digital invitation with Ganesh shloka, couple monogram, countdown timer, ceremonial itinerary with Google Maps directions, and 1-tap WhatsApp attendance RSVP.
* **4 Auspicious Design Themes:** Royal Crimson & Zari Gold, Marigold Sunshine & Amber, Regal Emerald & Sandalwood, and Pastel Gulabi & Rose Gold.
* **Dual Virtual Attendance Modes:**
  * **🔴 YouTube Live Broadcast:** Responsive 16:9 embedded live stream player with pulsing red *LIVE* badge for mass broadcast.
  * **🟢 Google Meet Virtual Room:** Interactive *Virtual Baithak* card with meeting code, host family instructions, 1-tap *Join Google Meet Room ↗* action, and WhatsApp link forwarding.
* **Dashboard Website Manager (`/app/website`):** Interactive theme switcher, welcome message editor, dual-provider selector (YouTube vs Google Meet), publication visibility toggle, and instant WhatsApp link sharing.
* `GET /api/wedding/website`, `PATCH /api/wedding/website`, `GET /api/wedding/livestream`, `PATCH /api/wedding/livestream`, `GET /api/public/weddings/:slug`.

### Operational Health (`/api/health`)
* `GET /api/health` — Returns system uptime, environment, and MongoDB connection status.

---

## 7. Project Status & Progress Tracking

The active implementation progress and feature history of Make My Marriage is tracked in:
* **[`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md)** — Living project status log, completed feature ledger, and roadmap queue.

> **CRITICAL MAINTENANCE INSTRUCTION:**  
> Whenever a new major feature or milestone is implemented in this codebase, developers and AI agents **MUST** update [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) immediately with the deliverables, acceptance criteria, test count, and roadmap status so context is never lost across sessions.

---

## 8. Specification Documents

Approved design baselines and project tracking reside in the `docs/` folder:
* [`docs/PROJECT_STATUS.md`](docs/PROJECT_STATUS.md) — Living Project Status & Implementation Progress Log
* [`docs/PRD.md`](docs/PRD.md) — Product Requirements Document
* [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) — System Design Architecture Document
* [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) — Database Design Document
* [`docs/API_DESIGN.md`](docs/API_DESIGN.md) — REST API Design Document

