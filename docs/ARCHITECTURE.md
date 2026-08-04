# Mustaka — Technical Architecture

> Version: 1.1 | Last Updated: 2026-08-03

---

## 1. Monorepo Structure

Mustaka uses **Bun Workspaces** for a strict, modular monorepo.

```text
mustaka/
├── apps/
│   ├── api/          # Backend: ElysiaJS (Bun)
│   └── web/          # Frontend: Next.js 16 (React 19)
│
├── packages/
│   ├── auth/         # @mustaka/auth (Better Auth Wrapper)
│   ├── db/           # @mustaka/db (ZenStack ORM + Prisma)
│   │   └── zenstack/schema.zmodel  # Source of Truth
│   ├── events/       # @mustaka/events (NATS PubSub)
│   ├── logger/       # @mustaka/logger (Pino/Winston)
│   ├── storage/      # @mustaka/storage (MinIO Client)
│   ├── utils/        # @mustaka/utils (Helpers)
│   └── validation/   # @mustaka/validation (Shared Zod Schemas)
│
└── modules/          # Feature Modules (Schema extensions + Routes + UI)
```

---

## 2. System Data Flow

### 2.1 Request Lifecycle

1. **Client (Next.js):** Type-safe request via Eden RPC or standard REST.
2. **API (Elysia):** Validates request against TypeBox/Zod schemas.
3. **Auth (@mustaka/auth):** Intercepts request, verifies session/JWT, attaches `organizationId`.
4. **DB (@mustaka/db):** ZenStack applies **RLS (Row-Level Security)** automatically based on the logged-in user.
5. **Storage (@mustaka/storage):** File uploads proxied to MinIO.

### 2.2 Event-Driven Architecture

Domain mutations (e.g., `createStudent`, `updateGrade`) publish events to **NATS**.

- **Notification Service:** Subscribes to events to trigger In-App/Email/WhatsApp notifications.
- **Workflow Engine:** (Future) Subscribes to events to execute visual automations.

---

## 3. Monorepo Invariant Rules

### 3.1 Import Hygiene

- **Apps (`apps/*`) MUST NOT** import external DB/Auth/Queue libraries directly.
- **Apps MUST** use internal wrappers: `@mustaka/db`, `@mustaka/auth`, etc.
- **Reason:** Ensures consistent configuration, type safety, and centralized upgrades.

### 3.2 Schema as Source of Truth

- **Location:** `packages/db/zenstack/schema.zmodel`.
- **Rule:** Never modify generated Prisma files. Always edit `.zmodel`.

### 3.3 Strict Isolation

- **Modules** are isolated. They extend the core schema but do not modify core tables directly.

---

## 4. Technology Stack

| Layer           | Technology           | Rationale                                               |
| :-------------- | :------------------- | :------------------------------------------------------ |
| **Frontend**    | Next.js 16, React 19 | App Router, Server Components, Type-safe RPC.           |
| **Backend**     | ElysiaJS (Bun)       | High performance, TypeBox integration.                  |
| **ORM**         | ZenStack V3 (Prisma) | Built-in Access Control (`@@allow`), Zod generation.    |
| **Auth**        | Better Auth          | Multi-tenant Organization plugin, Session management.   |
| **Events**      | NATS                 | Lightweight, high-throughput PubSub for microservices.  |
| **Cache/Queue** | Redis + BullMQ       | Session store, Background jobs (Export, Notifications). |
| **Storage**     | MinIO                | S3-compatible object storage for avatars/documents.     |

---

## 5. Development Workflow

```bash
# Local Dev
bun install
bun run dev         # Starts API (port 3001) + Web (port 3000)

# Database
bun run db:generate # Generates Prisma Client from ZenStack
bun run db:push     # Pushes schema to PostgreSQL
bun run db:studio   # Opens Prisma Studio

# Validation
bun run typecheck   # Ensures strict TS compliance across monorepo
```
