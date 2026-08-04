# Grill Sessions Summary

> Status: ✅ All 6 sessions completed

---

## Session Overview

| # | Topic | Status | Key Decisions |
|---|-------|--------|---------------|
| 1 | NISN vs NIP | ✅ Resolved | NISN di UserProfile, NIP di Employee |
| 2 | User Identity | ✅ Resolved | UserProfile primary, login via email |
| 3 | Notification | ✅ Resolved | 1 record = 1 channel, AuditLog |
| 4 | Organization | ✅ Resolved | Multi-org, admin-configurable settings |
| 5 | Academic Records | ✅ Resolved | CourseEnrollment is the heart |
| 6 | Data Lifecycle | ✅ Resolved | archived_at/deleted_at, End-of-Year procedure |

---

## Key Decisions Summary

### Identity Model
- `UserProfile` = master identity (NIK, NISN, isAlive)
- `User` = auth only (email, password)
- UserProfile can exist without User (for non-login users like parents)

### Parent System
- `UserParent` links to `UserProfile` (not `Student`)
- Supports FATHER, MOTHER, GUARDIAN
- Admin creates auth accounts for parents

### Academic Model
- `CourseEnrollment` is the heart (Student + LearningUnit + Period)
- `StudentGroup` for group membership (with history)
- Grade stored directly in CourseEnrollment
- Generic `AuditLog` for change tracking

### Organization
- 1 instance = many organizations
- `Organization.type` + `settings` JsonB
- Labels configurable per organization

### Employee
- Single `Employee` table (no separate Teacher/Staff)
- Teacher-specific relations directly on Employee
- RBAC via Better Auth `Member` model

### Data Lifecycle
- `archived_at` = hide from active views
- `deleted_at` = soft delete (inaccessible)
- `graduated_at` = student graduated
- Global state: Year/Period in cookie, auto-detect by date
- End-of-Year/End-of-Period: Manual procedure with checkbox UI
- Backup: JSON/SQL, queue-based, notification
- Hard delete: Owner only, with audit log

---

## Files

| File | Purpose |
|------|---------|
| [grill/1-nisn-vs-nip.md](grill/1-nisn-vs-nip.md) | NISN vs NIP placement |
| [grill/2-user-identity-model.md](grill/2-user-identity-model.md) | User identity model |
| [grill/3-notification-system.md](grill/3-notification-system.md) | Notification system |
| [grill/4-organization-structure.md](grill/4-organization-structure.md) | Organization structure |
| [grill/5-academic-records.md](grill/5-academic-records.md) | Academic records & MVP |
| [grill/6-data-lifecycle.md](grill/6-data-lifecycle.md) | Data lifecycle |

---

## Next Steps

1. Review `schema-consolidated.md` for final schema
2. Implement ZenStack schema in `packages/db/zenstack/schema.zmodel`
3. Setup Better Auth with organization plugin
4. Begin MVP implementation (Phase 2 in ROADMAP.md)
