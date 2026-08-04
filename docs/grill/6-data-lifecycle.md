# Grill #6: Data Lifecycle

> Status: ✅ Resolved

---

## Pertanyaan

Bagaimana data bergerak sepanjang waktu dalam sistem Mustaka?

---

## Keputusan

### 1. Soft Delete vs Archive

| Field | Purpose | When Set |
|-------|---------|----------|
| `archived_at` | Hide from active views | Student transferred/dropped, Employee left |
| `deleted_at` | Soft delete (hidden, not accessible) | User chooses to "delete" |
| `graduated_at` | Student graduated | Status = GRADUATED |

**Key:** Both fields exist. `archived_at` = hidden but accessible. `deleted_at` = hidden and inaccessible.

---

### 2. Student Lifecycle

```prisma
model Student {
  // ... existing fields
  status        StudentStatus @default(ACTIVE)
  enrollDate    DateTime      @default(now())
  graduatedAt   DateTime?     // Set when status = GRADUATED
  archivedAt    DateTime?     // Set when TRANSFERRED/DROPPED (hide from active)
  deletedAt     DateTime?     // Set when hard-deleted (inaccessible)
}
```

**Status Flow:**
```
ACTIVE → GRADUATED (graduated_at set)
ACTIVE → TRANSFERRED (archived_at set, create new Student)
ACTIVE → DROPPED (archived_at set, create new Student)
```

**Returning Student (Alumni):**
1. Old Student: `archived_at` = now, status = TRANSFERRED/DROPPED
2. New Student: Created with same profile

---

### 3. Employee Lifecycle

```prisma
model Employee {
  // ... existing fields
  joinDate      DateTime
  endDate       DateTime?     // Set when leaving
  archivedAt    DateTime?     // Set when leaving (hide from active)
  deletedAt     DateTime?     // Set when hard-deleted (inaccessible)
}
```

**Flow:**
```
Active → Left (endDate set, archived_at set)
Left → Re-hired (archived_at = null, endDate = null)
```

---

### 4. Global State: Year/Period Selection

**Location:** Cookie (lightweight)

**Auto-detection Logic:**
```
1. Get current date
2. Find Year WHERE startDate <= now AND endDate >= now
3. Find Period WHERE startDate <= now AND endDate >= now
4. If found → use that year/period
5. If not found → use latest year/period
6. If no year/period exists → redirect to setup page
```

**Behavior:**
- User selects year/period → saved to cookie
- All data filtered by selected year/period
- LearningGroup, StudentGroup, CourseEnrollment respect this filter

---

### 5. LearningGroup Copying (End-of-Year/End-of-Period)

**Procedure Name:** "End-of-Year" / "End-of-Period"

**Flow:**
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

**Timing:** Manual process (no automation for now)

---

### 6. Backup & Restore

**Format:** JSON or SQL (contextual)

**Export Process:**
1. User requests export
2. Export job added to queue (BullMQ)
3. System processes in background
4. When done, notification sent to user
5. User downloads file

**Export Scope:**

| Context | Scope |
|---------|-------|
| **Per Page** | Current view's data only |
| **Per Feature** | All data for that feature |
| **Full Database** | Everything (settings, permission-gated) |

**Permission:** Full database export only accessible by users with `export:database` permission (custom RBAC).

**Restore:** Upload JSON/SQL to new instance → system imports data.

---

### 7. Hard Delete

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
    entityType: 'student',
    entityId: studentId,
    action: 'hard_delete',
    userId: ownerUserId,
    changes: { deleted: true, data: studentData }
  }
});
```

**Query for hard delete:**
```typescript
// Owner hard-deletes a student
await db.student.delete({
  where: { id: studentId }
  // RLS checks: user must be owner of organization
});
```

---

### 8. Data Retention

**Rule:** Keep data forever (no automatic purging).

**Exceptions:**
- Hard delete by owner (with audit log)
- GDPR: Skip for now

---

## Summary

| Aspect | Decision |
|--------|----------|
| **Soft delete** | `archived_at` (hide) + `deleted_at` (inaccessible) |
| **Global state** | Cookie, auto-detect by date, fallback to latest |
| **LearningGroup copy** | Manual procedure with checkbox UI |
| **Backup format** | JSON/SQL, queue-based, notification |
| **Hard delete** | Owner only, via `db` (RLS), with audit log |
| **Data retention** | Forever (except hard delete by owner) |
