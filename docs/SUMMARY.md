# Mustaka — Documentation Index

> Last Updated: 2026-08-03

---

## 1. Core Documents

| Document                   | Purpose                                    | Link                                     |
| :------------------------- | :----------------------------------------- | :--------------------------------------- |
| **PRODUCT.md**             | Business logic, features, and RBAC matrix. | [Link](./PRODUCT.md)                     |
| **ARCHITECTURE.md**        | Technical topology and data flow.          | [Link](./ARCHITECTURE.md)                |
| **DATABASE_POLICY.md**     | ZenStack rules, RLS, and lifecycle.        | [Link](./DATABASE_POLICY.md)             |
| **UX_GUIDELINES.md**       | Design system and interaction patterns.    | [Link](./UX_GUIDELINES.md)               |
| **ROADMAP.md**             | Project phases and milestones.             | [Link](./ROADMAP.md)                     |
| **schema-consolidated.md** | Final domain schema details (Archived).    | [Link](./archive/schema-consolidated.md) |

---

## 2. Historical Audit Logs (Grill Sessions)

All design decisions are documented in `docs/grill/`.

| #   | Topic                | Key Decision                                   | File                                                               |
| :-- | :------------------- | :--------------------------------------------- | :----------------------------------------------------------------- |
| 1   | **NISN vs NIP**      | NISN in UserProfile, NIP in Employee.          | [1-nisn-vs-nip.md](./grill/1-nisn-vs-nip.md)                       |
| 2   | **Identity Model**   | UserProfile primary, Login via Email.          | [2-user-identity-model.md](./grill/2-user-identity-model.md)       |
| 3   | **Notifications**    | 1 record = 1 channel, AuditLog for history.    | [3-notification-system.md](./grill/3-notification-system.md)       |
| 4   | **Organization**     | Multi-org, Configurable settings JSONB.        | [4-organization-structure.md](./grill/4-organization-structure.md) |
| 5   | **Academic Records** | CourseEnrollment is the heart.                 | [5-academic-records.md](./grill/5-academic-records.md)             |
| 6   | **Data Lifecycle**   | Soft delete vs Archive, End-of-Year procedure. | [6-data-lifecycle.md](./grill/6-data-lifecycle.md)                 |
| 7   | **Grill Progress**   | Domain Refinement Session.                     | [GRILL-PROGRESS.md](./archive/GRILL-PROGRESS.md)                   |

---

## 3. Quick Reference: CLI Commands

```bash
# Dev Server
bun run dev

# Database Management
bun run db:generate    # Generate Prisma Client
bun run db:push        # Push schema to DB
bun run db:migrate     # Create Migration
bun run db:seed        # Seed Data

# Validation
bun run typecheck      # TypeScript Check
bun run lint           # ESLint Check

# Auth
bun run auth:generate  # Regenerate Better Auth Schema
```
