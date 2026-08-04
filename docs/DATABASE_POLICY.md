# Mustaka — Database & Access Control Policy

> Version: 1.1 | Last Updated: 2026-08-03

---

## 1. Single Source of Truth

The **ZenStack Schema** (`packages/db/zenstack/schema.zmodel`) is the absolute source of truth for:

1. **Data Structure:** Models, Fields, Relations, Enums.
2. **Access Control (RLS):** `@@allow` and `@@deny` rules.
3. **Validation:** `@@validate` rules (e.g., `@email`, `@length`).

**Rule:** Never edit `schema.prisma` or generated client code directly.

---

## 2. Access Control Policies (RLS)

ZenStack injects Row-Level Security into the database queries. Policies are defined using `auth()` to identify the current user.

### 2.1 Global Rules

Every domain table MUST have an `organizationId` field to ensure tenant isolation.

```prisma
// Default policy: User can only access data in their own organization
@@allow('read, update, delete', auth().orgMemberships any (m => m.organizationId == organizationId))
@@allow('create', auth() != null) // Must be logged in to create
```

### 2.2 Role-Based Rules (Example)

```prisma
model Student {
  // ... fields ...

  // Admins can do anything
  @@allow('all', auth().role == 'ADMIN')

  // Teachers can read their assigned students
  @@allow('read', auth().role == 'TEACHER' && enrollments any (e => e.teacherId == auth().id))

  // Parents can only see their own children
  @@allow('read', parents any (p => p.userId == auth().id))
}
```

### 2.3 Hard Delete Policy

Hard deletes are restricted to the **Owner** role only.

```prisma
@@allow('delete', auth().role == 'OWNER')
```

---

## 3. Lifecycle & State Management

### 3.1 Soft Delete vs. Archive

| Field        | Purpose                          | Access State                      |
| :----------- | :------------------------------- | :-------------------------------- |
| `archivedAt` | Temporary hide (e.g., Transfer)  | Accessible via "Archive" view.    |
| `deletedAt`  | Soft delete (Retirement)         | Inaccessible to standard queries. |
| `isDeleted`  | Boolean flag for quick filtering | Used in RLS to exclude records.   |

### 3.2 Global State Filtering

Data is filtered by `Year` and `Period`. The active Year/Period is resolved via:

1. **Client Cookie:** User selection.
2. **Auto-Detection:** If no cookie, match current date to `Year.startDate <= now <= Year.endDate`.

---

## 4. Workflow & Tooling

### 4.1 Migration

Use ZenStack CLI to manage migrations.

```bash
bunx zenstack migrate dev --name add_student_index
bunx zenstack migrate deploy
```

### 4.2 Seeding

Use `packages/db/prisma/seed.ts` for initial data (Demo Org, Admin User).

```bash
bun run db:seed
```

### 4.3 Type Generation

After any schema change, regenerate types for API and Client.

```bash
bun run db:generate
bun run typecheck
```
