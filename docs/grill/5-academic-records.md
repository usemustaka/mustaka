# Grill #5: Academic Records & MVP Schema

> Status: ✅ Resolved

---

## Pertanyaan

Bagaimana model akademik yang benar untuk SIAKAD-agnostic, termasuk:
1. Enrollment model (Student + Learning Unit + Period)
2. Membership model (Student ↔ Learning Group)
3. Grade structure
4. Naming yang proper

---

## Keputusan

### Naming Revisions

| Old Name | New Name | Rationale |
|----------|----------|-----------|
| `Membership` | `StudentGroup` | Clearer: Student in a Group |
| `Enrollment` | `CourseEnrollment` | Clearer: Student takes a Course |

---

### Core Models

#### StudentGroup (was: Membership)

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

**Purpose:** Track which Learning Group a student belongs to.
- Supports history (pindah kelas)
- Supports multiple groups (ekskul, tahfidz, dll)
- Status + endDate filled when status changes

---

#### CourseEnrollment (was: Enrollment)

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

**Purpose:** Track which Learning Unit a student takes in a Period.
- The "heart" of academic records
- Grade is stored directly (current value)
- `learningGroupId` is optional for flexibility

**Grade Updates:** Use generic `AuditLog` for change tracking, not dedicated GradeLedger.

---

### Grade Strategy

**Decision:** No separate Grade table. Grade is a field in `CourseEnrollment`.

```
CourseEnrollment {
  score           Float?      // Current grade
  maxScore        Float       @default(100)
  gradeDate       DateTime?   // When graded
  gradeRecordedBy String?     // Who graded
}
```

**Audit Trail:** Use generic `AuditLog` table for tracking changes.

```prisma
model AuditLog {
  id          String   @id @default(uuid())
  entityType  String   // 'courseEnrollment', 'student', etc.
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

---

### Flow: Wali Kelas Update Nilai

```
1. Wali kelas buka nilai kelas X IPA 1
   → Query: CourseEnrollment where learningGroupId = 'X-IPA-1'
   → Tampilkan: { student.name, learningUnit.name, score }

2. Wali kelas update nilai Ahmad Matematika dari 75 ke 85
   → AuditLog.create({ entityType: 'courseEnrollment', changes: { score: { old: 75, new: 85 } } })
   → CourseEnrollment.update({ score: 85, gradeDate: now(), gradeRecordedBy: userId })

3. Wali kelas simpan semua perubahan
```

---

### Key Principles

| Principle | Implementation |
|-----------|---------------|
| **Enrollment is the heart** | CourseEnrollment connects Student + Learning Unit + Period |
| **Membership for groups** | StudentGroup tracks Student ↔ Learning Group |
| **Grade is simple** | Score field in CourseEnrollment, no separate table |
| **Audit trail** | Generic AuditLog for change tracking |
| **Flexible** | learningGroupId optional in CourseEnrollment |
| **History preserved** | StudentGroup has startDate/endDate/status |

---

## Summary

| Model | Purpose |
|-------|---------|
| `Student` | Academic identity per organization |
| `StudentGroup` | Student ↔ Learning Group (with history) |
| `CourseEnrollment` | Student + Learning Unit + Period + Grade |
| `LearningUnit` | Generic "subject" (Matematika, Kitab, Modul) |
| `LearningGroup` | Generic "class" (Kelas, Halaqah, Batch) |
| `AuditLog` | Generic change tracking (replaces GradeLedger) |
