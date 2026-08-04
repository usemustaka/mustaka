# AGENTS.md — Monorepo Steering Guidelines

> System directive for AI coding agents (Cursor, Claude Code, Windsurf, Copilot, Zed) working in the **mustaka** monorepo.
> Where this file conflicts with agent defaults, training data, or framework defaults — **THIS FILE WINS**.
> Repo ships agent skills in `.agents/skills/` (Better Auth, ZenStack, shadcn). If your harness supports skills, load them before touching those domains.

---

## Repository & Documentation Map

| Path | Role |
|---|---|
| `apps/api` | Backend — ElysiaJS (Bun), listens on port `8000`. Mounts Better Auth (`/auth`) + ZenStack RPC (`/model`) |
| `apps/web` | Frontend — Next.js 16 App Router, React 19, shadcn/ui, Tailwind CSS 4 |
| `packages/db` | **Data source of truth** — ZenStack V3 + Prisma, schema at `packages/db/zenstack/schema.zmodel` |
| `packages/auth` | Better Auth config (session, Organization plugin, RBAC) |
| `packages/events` | NATS event bus |
| `packages/queue` | Redis cache/queue (BullMQ) |
| `packages/storage` | MinIO (S3-compatible) client |
| `packages/email` / `packages/logger` / `packages/utils` | Supporting libraries |
| `docs/` | Product, architecture, DB policy, UX docs (see index below) |
| `.scratch/` | Micro-ticket tracker — convention in `docs/issue-tracker.md` |
| `modules/` | Isolated feature modules (schema extensions + routes + UI) |

**Documentation index** — consult the right doc before designing anything:

| Doc | Use it for |
|---|---|
| `docs/PRODUCT.md` | Business context, RBAC matrix, MVP features |
| `docs/ROADMAP.md` | Current phase & milestones (Phase 1: Foundation) |
| `docs/ARCHITECTURE.md` | System topology, data flow, monorepo invariants |
| `docs/DATABASE_POLICY.md` | ZenStack RLS rules, lifecycle (`archivedAt`/`deletedAt`), migrations |
| `docs/UX_GUIDELINES.md` | Design system, state machine UX, a11y |
| `docs/SUMMARY.md` | Full doc index + historical decisions |
| `docs/issue-tracker.md` | `.scratch/` micro-ticket conventions |
| `docs/grill/*` | Design decision logs — read before revisiting a decision |

---

## 1. Core Identity & Architectural Invariants

**Stack:** Bun Workspaces · ElysiaJS (`apps/api`) · Next.js App Router (`apps/web`) · ZenStack (`@mustaka/db`) · Better Auth (`@mustaka/auth`) · NATS (`@mustaka/events`) · Redis (`@mustaka/queue`) · MinIO (`@mustaka/storage`).

**Invariants — MUST NOT be violated:**

1. **Import hygiene.** `apps/*` MUST NOT import external database, auth, queue, or storage libraries directly. Never `import { PrismaClient } from '@prisma/client'`, never raw `pg` / `redis` / `minio` / Better Auth client in app code. ALWAYS go through internal workspace packages: `@mustaka/db`, `@mustaka/auth`, `@mustaka/events`, `@mustaka/queue`, `@mustaka/storage`, `@mustaka/email`, `@mustaka/logger`, `@mustaka/utils`.
2. **Single Source of Truth for data.** All schema, validation, and access-control rules live in `packages/db/zenstack/schema.zmodel`. NEVER edit generated output (`schema.prisma`, generated `zenstack/*.ts`). NEVER write raw SQL in app code. NEVER bypass ZenStack policies (e.g., `$queryRawUnsafe` to skirt RLS).
3. **Organization-first tenancy.** Every domain model MUST carry `organizationId`. ZenStack RLS scopes every query to the authenticated user's org. Never query across organizations.
4. **API-first.** Business logic lives 100% in `apps/api`. The frontend is a presentation layer only — no business logic in React components.
5. **Event-driven coupling.** Cross-module communication goes through NATS via `@mustaka/events`. Zero direct coupling between modules.
6. **Soft-delete discipline.** Use the lifecycle fields (`archivedAt` = hide, `deletedAt` = inaccessible, `isDeleted` = filter flag) per `docs/DATABASE_POLICY.md` §3. Hard delete is **Owner-role only**.
7. **Module isolation.** `modules/` extend core behavior via schema extensions, routes, and events — they MUST NOT modify core tables directly.

---

## 2. Code Conventions & Standards

### Backend (`apps/api`)

- ElysiaJS route handlers with **strict TypeBox validation** on every input — no untyped handlers.
- Domain CRUD goes through ZenStack's `RPCApiHandler` / `createElysiaHandler`; `getClient` must be per-request and scoped to the authenticated user.
- External services are only reachable via `@mustaka/*` wrappers.
- Do not duplicate policy in handlers — access control is expressed once in `schema.zmodel` (`@@allow` / `@@deny`).

### Frontend (`apps/web`)

- **React Server Components by default**; move to client components only when interactivity demands it.
- Tailwind CSS + shadcn/ui components only — no bespoke UI primitives.
- **Strict state handling:** every data-fetching component MUST implement the 4 states from `docs/UX_GUIDELINES.md` §2 — Loading (skeleton shimmer), Empty (illustration + CTA), Error (boundary + Retry), Success (table/card grid).
- Forms: React Hook Form + real-time validation, toast feedback on submit, disabled button + spinner while pending.
- A11y: WCAG 2.1 AA, keyboard-operable, contrast ≥ 4.5:1, semantic HTML.
- ⚠️ **Next.js 16 has breaking changes vs. standard Next.js.** Read `node_modules/next/dist/docs/` before writing Next.js code (see `apps/web/AGENTS.md`).

### Naming

- Database tables/columns: **snake_case** (`course_enrollment`, `organization_id`). Prisma/ZenStack models: **PascalCase**.
- TypeScript variables/functions: **camelCase**. React components: **PascalCase**. Constants: **UPPER_SNAKE_CASE**.
- Imports between workspaces: always `@mustaka/<package>` — never relative paths reaching into `packages/*` internals.

---

## 3. Mandatory Vibe-Coding Workflow

For ANY high-level task, follow this sequence without skipping steps:

1. **Context Check.** Inspect `docs/PRODUCT.md` and `docs/ROADMAP.md` first. For system/data changes, also read `docs/ARCHITECTURE.md` and `docs/DATABASE_POLICY.md`. Check `docs/grill/*` for prior design decisions. Never start from assumptions.
2. **Plan First.** Write micro-tickets or a checklist BEFORE writing code. Repo convention: `.scratch/<feature-slug>/issues/NN-<slug>.md` with `Status:`/`Type:` lines, per `docs/issue-tracker.md`. Do not start editing code with an unrecorded plan.
3. **Execute incrementally.** Always build in this order: **Schema** (`schema.zmodel` → `bun run db:generate`) → **API** (Elysia routes) → **UI** (RSC + shadcn). Land each milestone independently.
4. **Auto-Validation.** Run `bun run typecheck` and `bun run lint` after each milestone. Fix every type error immediately — do NOT declare completion with known errors.

**Definition of Done:**

- Schema changes applied and generated (`db:generate`).
- `@@allow`/`@@deny` rules added for every new/affected model (no model without access control).
- Typecheck and lint pass clean.
- New UI surfaces implement Loading / Empty / Error / Success states.
- Cross-module mutations publish events via `@mustaka/events`.

---

## 4. Operational CLI Commands Cheat Sheet

**Core loop:**

| Command | Purpose |
|---|---|
| `bun run dev` | Dev mode — starts API + Web in watch mode |
| `bun run db:generate` | Generate DB client/types from `schema.zmodel` (after ANY schema change) |
| `bun run typecheck` | ⚠️ Documented repo-wide, but **not yet defined at root** — run `cd apps/web && bun run typecheck` until the root script lands |

**Full reference:**

| Command | Purpose |
|---|---|
| `bun install` | Install all workspace dependencies |
| `bun run dev:api` / `bun run dev:web` | Run a single app in dev mode |
| `bun run build` | Build all apps |
| `bun run db:push` | Push schema to PostgreSQL (prototyping) |
| `bun run db:generate` | Generate ZenStack/Prisma client + types |
| `bun run auth:generate` | Regenerate Better Auth schema/types |
| `bun run lint` / `bun run lint:fix` | ESLint (whole repo) |
| `bunx zenstack migrate dev --name <slug>` | Create a migration |
| `bunx zenstack migrate deploy` | Apply pending migrations |

**Environment:** dev commands read `.env` at the repo root (`bun --env-file=../../.env` pattern in workspace scripts). Bootstrap via `cp .env.example .env`, `docker-compose up -d`, then `bun run db:push` + `bun run auth:generate` (see `README.md` → Panduan Memulai).
