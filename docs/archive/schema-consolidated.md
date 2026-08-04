# Mustaka — Consolidated Domain Schema

> Final schema based on 5 grill sessions. Last updated: 2026-08-03

---

## Overview

Mustaka adalah **SIAKAD (Sistem Informasi Akademik) agnostik** untuk berbagai jenis lembaga pendidikan:

- Sekolah (SD, SMP, SMA, SMK)
- Madrasah (MI, MTs, MA)
- Pesantren
- Kursus / Bootcamp
- Universitas

**Prinsip:** Satu instance = banyak organisasi. Setiap organisasi punya konfigurasi sendiri.

---

## Core Principle: Organization First

```
Organization
├── Year
│   └── Period
├── Learning Group (Rombel/Halaqah/Batch)
├── Learning Unit (Mapel/Kitab/Modul)
├── Student
│   ├── Student Group (kelas/rombel)
│   ├── Course Enrollment (enrollment + nilai)
│   └── User Parent (orangtua/wali)
└── Employee (Guru/Staff)
```

---

## Schema Tables

### Better Auth Tables (Generated — JANGAN DIUBAH)

| Table          | Purpose                                      |
| -------------- | -------------------------------------------- |
| `user`         | Auth identity (email, password, session)     |
| `session`      | User sessions                                |
| `account`      | OAuth accounts                               |
| `verification` | Email verification tokens                    |
| `organization` | Multi-tenant orgs (with `type` + `settings`) |
| `member`       | Org membership with RBAC roles               |
| `invitation`   | Org invitations                              |
| `twoFactor`    | 2FA secrets                                  |

---

### Domain Tables

#### 1. User Profile

**Purpose:** Public identity & personal info. Can exist without User (for non-login users like parents).

```prisma
model UserProfile {
  id           String   @id @default(uuid())
  userId       String?  @unique  // NULL = no auth account
  user         User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  organizationId String
  organization   Organization @relation(...)

  // Identity numbers
  nik          String?  @unique  // Nomor Induk Kependudukan (KTP)
  nisn         String?           // Nomor Induk Siswa Nasional (for students)

  // Personal info
  name         String
  gender       Gender?
  birthDate    DateTime?
  address      String?
  phone        String?

  // Status
  isAlive      Boolean  @default(true)

  // Preferences (notifications, theme, etc.)
  preferences  Json?

  // Dynamic fields
  attributes   Json?

  // Timestamps
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  children     UserParent[] @relation("Child")
  parents      UserParent[] @relation("Parent")
}

enum Gender {
  MALE
  FEMALE
}
```

**Key Decisions:**

- `userId` nullable (profile can exist without auth)
- `nik` unique (National Identity Number)
- `nisn` optional (for students)
- `isAlive` status (for deceased parents/guardians)
- `preferences` JsonB (notifications, theme, language)

---

#### 2. User Parent (Orangtua/Wali)

**Purpose:** Relationship between child (UserProfile) and parent/guardian (UserProfile).

```prisma
model UserParent {
  id              String   @id @default(uuid())

  // Child
  childProfileId  String
  childProfile    UserProfile @relation("Child", fields: [childProfileId], references: [id], onDelete: Cascade)

  // Parent/Guardian
  parentId        String
  parent          UserProfile @relation("Parent", fields: [parentId], references: [id], onDelete: Cascade)

  // Metadata
  relationship    ParentRelationship
  isPrimary       Boolean  @default(false)
  isEmergency     Boolean  @default(false)

  createdAt       DateTime @default(now())

  @@unique([childProfileId, parentId])
  @@index([childProfileId])
  @@index([parentId])
  @@index([relationship])
}

enum ParentRelationship {
  FATHER
  MOTHER
  GUARDIAN  // Paman, Kakek, Bibi, Kakak, dll
}
```

**Key Decisions:**

- Links to `UserProfile`, not `Student` (parent is parent of a PERSON, not an academic record)
- Supports FATHER, MOTHER, GUARDIAN (yatim/piatu case)
- `isPrimary` for main contact, `isEmergency` for emergencies
- Parent can exist without User account (userId null in UserProfile)

---

#### 3. Academic Period

**Purpose:** Tahun akademik dan periode (semester/caturwulan/batch).

```prisma
model Year {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(...)

  name           String   // "2025/2026"
  startDate      DateTime
  endDate        DateTime
  isActive       Boolean  @default(false)

  periods        Period[]
  learningGroups LearningGroup[]
  students       Student[]
}

model Period {
  id        String   @id @default(uuid())
  yearId    String
  year      Year     @relation(fields: [yearId], references: [id], onDelete: Cascade)

  name      String   // "Ganjil", "Genap", "Caturwulan 1", "Batch 1"
  type      String   // 'semester' | 'caturwulan' | 'quarter' | 'batch'
  startDate DateTime
  endDate   DateTime
  isActive  Boolean  @default(false)
}
```

**Key Decisions:**

- `Year` scoped to organization
- `Period` is flexible (semester, caturwulan, batch, etc.)
- Admin configures periods per year

---

#### 4. Learning Unit (Mata Pelajaran/Kitab/Modul)

**Purpose:** Generic "subject" — bisa berupa mata pelajaran, kitab, modul bootcamp, dll.

```prisma
model LearningUnit {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(...)

  name           String   // "Matematika", "Al-Qur'an", "Tahfidz", "Modul React"
  code           String   @unique
  level          Int?     // NULL = semua level

  // Relations
  employees      EmployeeLearningUnit[]
  courseEnrollments CourseEnrollment[]
}
```

**Key Decisions:**

- Named `LearningUnit` (not "Subject") for agnosticism
- UI label configurable per organization (Mapel/Kitab/Modul/Program)
- `level` optional (SD=1-6, SMP=7-9, SMA=10-12)

---

#### 5. Learning Group (Rombel/Halaqah/Batch)

**Purpose:** Generic "class" — bisa berupa rombel, halaqah, batch, grup tahfidz, dll.

```prisma
model LearningGroup {
  id                String   @id @default(uuid())
  organizationId    String
  organization      Organization @relation(...)
  yearId            String
  year              Year     @relation(...)

  // Optional: For context where groups are per-period (bootcamp, kursus)
  periodId          String?
  period            Period?  @relation(...)

  name              String   // "X IPA 1", "Halaqah Umar", "Batch React - Class A"
  capacity          Int      @default(36)
  homeroomTeacherId String?
  homeroomTeacher   Employee? @relation(...)

  // Relations
  studentGroups     StudentGroup[]
  courseEnrollments CourseEnrollment[]
}
```

**Key Decisions:**

- `yearId` required (scoped to academic year)
- `periodId` optional (for bootcamp/kursus where groups are per-batch)
- School: periodId = NULL (class persists across all periods)
- Bootcamp: periodId = specific batch
- `homeroomTeacherId` direct field (no separate WaliKelas table)
- UI label configurable per organization (Rombel/Kelas/Halaqah/Batch)

---

#### 6. Student

**Purpose:** Academic identity per organization. One user can have multiple students (different orgs, different years).

```prisma
model Student {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(...)
  profileId      String
  profile        UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)
  yearId         String
  year           Year     @relation(fields: [yearId], references: [id], onDelete: Cascade)

  status         StudentStatus @default(ACTIVE)
  enrollDate     DateTime @default(now())
  graduatedAt    DateTime?     // Set when status = GRADUATED
  archivedAt     DateTime?     // Set when TRANSFERRED/DROPPED (hide from active)
  deletedAt      DateTime?     // Set when hard-deleted (inaccessible)

  // Dynamic fields
  attributes     Json?

  // Relations
  studentGroups  StudentGroup[]
  courseEnrollments CourseEnrollment[]
}

enum StudentStatus {
  ACTIVE
  GRADUATED
  TRANSFERRED
  DROPPED
}
```

**Key Decisions:**

- Links to `UserProfile` (not `User`) for identity
- `organizationId` for multi-tenant isolation
- `yearId` for academic year scoping
- `graduatedAt` for graduation tracking
- `archivedAt` for hiding from active views
- `deletedAt` for soft delete (inaccessible)
- Status field for lifecycle tracking

---

#### 7. Student Group

**Purpose:** Student ↔ Learning Group relationship. Supports history and multiple groups.

```prisma
model StudentGroup {
  id              String   @id @default(uuid())
  studentId       String
  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  learningGroupId String
  learningGroup   LearningGroup @relation(fields: [learningGroupId], references: [id], onDelete: Cascade)

  startDate       DateTime @default(now())
  endDate         DateTime?  // NULL = still active
  status          StudentGroupStatus @default(ACTIVE)

  @@unique([studentId, learningGroupId, startDate])
  @@index([studentId])
  @@index([learningGroupId])
  @@index([status])
}

enum StudentGroupStatus {
  ACTIVE
  TRANSFERRED
  GRADUATED
  DROPPED
}
```

**Key Decisions:**

- Separate table for history tracking
- Supports multiple groups per student (main class + ekskul + tahfidz)
- Status + endDate filled when status changes
- `startDate` in unique constraint (same student can rejoin same group)

---

#### 8. Course Enrollment

**Purpose:** The HEART of academic records. Student + Learning Unit + Period + Grade.

```prisma
model CourseEnrollment {
  id              String   @id @default(uuid())
  studentId       String
  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  learningUnitId  String
  learningUnit    LearningUnit @relation(fields: [learningUnitId], references: [id], onDelete: Cascade)
  periodId        String
  period          Period   @relation(fields: [periodId], references: [id], onDelete: Cascade)

  // Optional: For school context (enrollment tied to a class)
  learningGroupId String?
  learningGroup   LearningGroup? @relation(fields: [learningGroupId], references: [id], onDelete: SetNull)

  status          CourseEnrollmentStatus @default(ACTIVE)

  // Grade (current - denormalized for quick access)
  score           Float?
  maxScore        Float    @default(100)
  gradeDate       DateTime?
  gradeRecordedBy String?  // userId

  @@unique([studentId, learningUnitId, periodId])
  @@index([studentId])
  @@index([learningUnitId])
  @@index([periodId])
  @@index([learningGroupId])
}

enum CourseEnrollmentStatus {
  ACTIVE
  COMPLETED
  FAILED
  DROPPED
}
```

**Key Decisions:**

- `learningGroupId` optional (school: fill it, university: leave null)
- Grade stored directly (no separate Grade table)
- Grade changes tracked via AuditLog
- Supports repeat course (new enrollment for university)
- Unique constraint prevents duplicate enrollment

---

#### 9. Employee

**Purpose:** Guru/Staff identity per organization. Single table for all employee types.

```prisma
model Employee {
  id             String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(...)
  profileId      String
  profile        UserProfile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  type           String   // 'teacher' | 'staff'
  nip            String?  @unique  // Nomor Induk Pegawai
  joinDate       DateTime
  endDate        DateTime?     // Set when leaving
  archivedAt     DateTime?     // Set when leaving (hide from active)
  deletedAt      DateTime?     // Set when hard-deleted (inaccessible)
  phone          String?

  // Relations (teacher-specific)
  subjects       EmployeeLearningUnit[]
  schedules      []  // Future: EmployeeSchedule module
  waliKelas      []  // Via LearningGroup.homeroomTeacherId

  // RBAC handled by Better Auth Member model
}

model EmployeeLearningUnit {
  id              String   @id @default(uuid())
  employeeId      String
  employee        Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  learningUnitId  String
  learningUnit    LearningUnit @relation(fields: [learningUnitId], references: [id], onDelete: Cascade)

  @@unique([employeeId, learningUnitId])
}
```

**Key Decisions:**

- Single table (no separate Teacher/Staff tables)
- `type` field determines behavior (teacher vs staff)
- Teacher-specific relations directly on Employee
- Staff RBAC handled by Better Auth `Member` model
- `endDate` + `archivedAt` for leaving
- `deletedAt` for soft delete (inaccessible)
- Schedule is future module (not MVP)

---

#### 10. Audit Log

**Purpose:** Generic change tracking for all entities.

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  organizationId String
  organization   Organization @relation(...)

  entityType  String   // 'courseEnrollment', 'student', 'employee', etc.
  entityId    String   // ID of the record
  action      String   // 'create' | 'update' | 'delete'
  userId      String   // Who did it
  changes     Json?    // { field: { old: x, new: y } }
  createdAt   DateTime @default(now())

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
}
```

**Key Decisions:**

- Generic (not grade-specific)
- Tracks changes to any entity
- JSONB `changes` field for flexibility
- Indexed for efficient queries

---

## Notification System (Module)

### Notification

```prisma
model Notification {
  id           String              @id @default(uuid())
  userId       String
  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  channel      NotificationChannel
  status       NotificationStatus  @default(PENDING)

  type         String   // 'violation', 'grade', 'attendance', 'system'
  title        String
  body         String

  payload      Json?    // { url: "/students/123", action: "view", data: {...} }

  sentAt       DateTime?
  deliveredAt  DateTime?
  readAt       DateTime?
  errorMessage String?

  sourceType   String?
  sourceId     String?

  createdAt    DateTime            @default(now())
}

enum NotificationChannel {
  IN_APP
  EMAIL
  WHATSAPP
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}
```

---

## Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                       ORGANIZATION                               │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                     │
│      Year            LearningGroup    LearningUnit             │
│        │                │                │                     │
│        ▼                │                │                     │
│     Period              │                │                     │
│        │                │                │                     │
│        └────────────────┼────────────────┘                     │
│                         ▼                                       │
│                    CourseEnrollment ←── Student                │
│                         │                 │                     │
│                         │           StudentGroup               │
│                         │                 │                     │
│                    AuditLog         LearningGroup              │
│                                                                  │
│     Employee ──── EmployeeLearningUnit ──── LearningUnit        │
│         │                                                       │
│         └─── LearningGroup (homeroomTeacher)                    │
│                                                                  │
│     UserProfile ←── UserParent ←── UserProfile                 │
│         │              (parent)     (child)                      │
│         │                                                        │
│         └── Student, Employee                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Query Patterns

### Get all students in a class

```typescript
const students = await db.studentGroup.findMany({
  where: { learningGroupId: "X-IPA-1", status: "ACTIVE" },
  include: { student: { include: { profile: true } } },
});
```

### Get all grades for a class in a period

```typescript
const grades = await db.courseEnrollment.findMany({
  where: { learningGroupId: "X-IPA-1", periodId: "semester-1" },
  include: { student: true, learningUnit: true },
});
```

### Get all parents of a student

```typescript
const parents = await db.userParent.findMany({
  where: { childProfileId: "ahmad-profile" },
  include: { parent: true },
});
```

### Get all children of a parent

```typescript
const children = await db.userParent.findMany({
  where: { parentId: "budi-profile" },
  include: { childProfile: true },
});
```

### Update grade with audit

```typescript
async function updateGrade(
  enrollmentId: string,
  newScore: number,
  userId: string,
) {
  const old = await db.courseEnrollment.findUnique({
    where: { id: enrollmentId },
  });

  await db.auditLog.create({
    data: {
      organizationId: old.organizationId,
      entityType: "courseEnrollment",
      entityId: enrollmentId,
      action: "update",
      userId,
      changes: { score: { old: old.score, new: newScore } },
    },
  });

  await db.courseEnrollment.update({
    where: { id: enrollmentId },
    data: { score: newScore, gradeDate: new Date(), gradeRecordedBy: userId },
  });
}
```

---

## Data Lifecycle

### Global State: Year/Period Selection

**Location:** Cookie (lightweight)

**Auto-detection Logic:**

```typescript
// 1. Get current date
const now = new Date();

// 2. Find active year
const year = await db.year.findFirst({
  where: {
    organizationId,
    startDate: { lte: now },
    endDate: { gte: now },
  },
});

// 3. Find active period
const period = await db.period.findFirst({
  where: {
    yearId: year?.id,
    startDate: { lte: now },
    endDate: { gte: now },
  },
});

// 4. Fallback to latest if no match
if (!year) year = await db.year.findFirst({ orderBy: { startDate: "desc" } });
if (!period)
  period = await db.period.findFirst({
    where: { yearId: year.id },
    orderBy: { startDate: "desc" },
  });

// 5. Redirect to setup if nothing exists
if (!year || !period) redirect("/setup/academic-year");
```

**Behavior:**

- User selects year/period → saved to cookie
- All data filtered by selected year/period
- LearningGroup, StudentGroup, CourseEnrollment respect this filter

---

### End-of-Year / End-of-Period Procedure

**Manual process** by staff TU:

1. Staff TU clicks "End of Year/Period"
2. System shows checkbox UI: "What to copy from previous year/period?"
3. Staff selects items (with checkboxes)
4. System copies selected items to new year/period
5. Previous year/period marked as inactive

**Checkbox Options:**

- [ ] Learning Groups (rombel/halaqah/batch)
- [ ] Learning Units (mapel/kitab/modul)
- [ ] Employee assignments
- [ ] Templates (not actual data)

**What is NOT copied:**

- Students (new enrollment each year)
- CourseEnrollments (new each period)
- StudentGroups (new each year)
- Grades (historical, not copied)

---

### Backup & Restore

**Format:** JSON or SQL (contextual)

**Export Process:**

1. User requests export
2. Export job added to queue (BullMQ)
3. System processes in background
4. When done, notification sent to user
5. User downloads file

**Export Scope:**

| Context           | Scope                         |
| ----------------- | ----------------------------- |
| **Per Page**      | Current view's data only      |
| **Per Feature**   | All data for that feature     |
| **Full Database** | Everything (permission-gated) |

**Permission:** Full database export only accessible by users with `export:database` permission.

---

### Hard Delete

**Rule:** Any data can be hard-deleted, but only by organization owner (root/superadmin).

**Enforcement:**

- Use `db` (with RLS) for all operations
- ZenStack RLS policies enforce access control
- Owner role bypasses certain restrictions

**Audit Log Required:**

```typescript
await db.auditLog.create({
  data: {
    organizationId,
    entityType: "student",
    entityId: studentId,
    action: "hard_delete",
    userId: ownerUserId,
    changes: { deleted: true, data: studentData },
  },
});
```

---

### Data Retention

**Rule:** Keep data forever (no automatic purging).

**Exceptions:**

- Hard delete by owner (with audit log)
- GDPR: Skip for now

---

## Future Modules

| Module         | Tables                                                          | Purpose                               |
| -------------- | --------------------------------------------------------------- | ------------------------------------- |
| **Attendance** | `attendance`                                                    | Absensi (Alpha/Izin/Sakit/Dispensasi) |
| **Violation**  | `violation`                                                     | Pelanggaran siswa                     |
| **Workflow**   | `workflow`, `workflowNode`, `workflowEdge`, `workflowExecution` | Visual automation                     |
| **Schedule**   | `employeeSchedule`                                              | Jadwal mengajar                       |
| **Finance**    | `payment`, `invoice`                                            | SPP, billing                          |
