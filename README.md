# Mustaka - Modern Education Management Platform

Multi-tenant education management platform for institutions at every level — primary school to university, including LMS-style deployments. One deployment serves many organizations; students, parents/guardians, teachers, and staff each see only what their organization grants them.

> **Status: boilerplate.** The platform skeleton is in place — auth, organizations, schema-driven access control, and a student admin UI. Full academic workflows are planned.

## Stack

- **Monorepo** on [Bun](https://bun.com) workspaces (`apps/*`, `packages/*`)
- **Web** — Nuxt 4 (SPA) with Nuxt UI, Pinia + Colada data layer
- **API** — [Elysia](https://elysiajs.com) server mounting Better Auth and a schema-driven RPC
- **Data** — PostgreSQL, reached only through ZenStack (access policies enforced in the schema)
- **Auth** — Better Auth: email/password, organizations, 2FA

## Local setup

Prerequisites: [Bun](https://bun.com) and Docker (for PostgreSQL).

```bash
# 1. Start PostgreSQL (Adminer UI at http://localhost:8080)
docker compose up -d

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
#    then fill in the secret values

# 4. Sync schema to the database and generate the typed client
bun run db:push
bun run db:generate

# 5. Run web + API
bun run dev
```

- Web: http://localhost:3000 (redirects to `/core`)
- API: http://localhost:8000 (Better Auth at `/auth`, data RPC at `/model`)

## Layout

| Path              | Role                                                                        |
| ----------------- | --------------------------------------------------------------------------- |
| `apps/web`        | Nuxt SPA — pages, UI components, DataGrid/Kanban/Workflow components        |
| `apps/api`        | Elysia server — Better Auth + ZenStack RPC                                  |
| `packages/db`     | ZenStack schemas (`packages/db/zenstack/*.zmodel`) + generated typed client |
| `packages/auth`   | Better Auth configuration                                                   |
| `packages/logger` | pino logger                                                                 |

## For AI agents

Working with an AI agent, or need the architecture and conventions? See [AGENTS.md](./AGENTS.md). Domain vocabulary lives in [CONTEXT.md](./CONTEXT.md).
