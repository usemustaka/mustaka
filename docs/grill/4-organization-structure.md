# Grill #4: Organization & Multi-School Structure

> Status: ✅ Resolved

---

## Pertanyaan

Bagaimana structure organisasi yang benar untuk mendukung:
1. Multi-sekolah dalam 1 instance
2. Berbagai tipe lembaga (sekolah, madrasah, pesantren, kursus)
3. RBAC per organisasi
4. Custom fields per tipe lembaga

---

## Keputusan

### Architecture: 1 Instance = Banyak Organisasi

```
1 Instance Mustaka
├── Yayasan ABC
│   ├── SMA Negeri 1 Jakarta (Organization)
│   ├── SMP Negeri 3 Bandung (Organization)
│   ├── Pesantren Al-Hikmah (Organization)
│   └── Lembaga Kursus Digital (Organization)
```

**Main user:** Yayasan yang memiliki banyak lembaga pendidikan.

---

### Organization Model

```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  type        String   // 'school', 'madrasah', 'pesantren', 'kursus'
  logo        String?
  settings    Json?    // Admin-configurable settings
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Better Auth relations
  members     Member[]
  invitations Invitation[]
  
  // Domain relations
  years       Year[]
  learningGroups  LearningGroup[]
  learningUnits   LearningUnit[]
  students    Student[]
  employees   Employee[]
  workflows   Workflow[]
}
```

**Key Decision:** Settings di-JSONB, admin configure via UI, bukan hardcoded.

---

### Organization Settings (JsonB)

```json
{
  "semesterSystem": "semester",  // or "caturwulan"
  "maxStudentsPerGroup": 36,
  "academicYearStart": 7,  // Juli
  "language": "id",
  "labels": {
    "learningUnit": "Mata Pelajaran",  // or "Kitab", "Modul", "Program"
    "learningGroup": "Rombel",         // or "Halaqah", "Batch", "Grup"
    "student": "Siswa"                 // or "Santri", "Peserta", "Mahasiswa"
  }
}
```

---

### Multi-Organization User

```
User: Budi Santoso
├── Member di SMA Negeri 1 (role: 'guru')
├── Member di Pesantren Al-Hikmah (role: 'staff')
└── Member di Lembaga Kursus (role: 'admin')
```

**Setiap organization punya Member record terpisah dengan role berbeda.**

---

### RBAC: Dynamic Access Control

```typescript
// Better Auth organization plugin
organization({
  dynamicAccessControl: {
    enabled: true
  }
})

// Custom roles per organization
await authClient.organization.createRole({
  role: "guru_mata_pelajaran",
  permission: {
    student: ["read"],
    grade: ["read", "write"],
    attendance: ["read", "write"],
  }
})
```

---

### Custom Fields Approach

**Decision:** Simple unified model dengan admin-configurable settings.

- **Tipe lembaga** → `organization.type` (display/filtering)
- **Settings** → `organization.settings` (JSONB, admin UI)
- **Program/Kurikulum** → Data, bukan schema (admin buat)
- **Jurusan** → Hanya grouping rombel (nama rombel)

**NOT:** Custom field definitions, EAV pattern, atau template system.

---

### Validation Strategy

3-layer validation:
1. **Database:** ZenStack RLS (access control)
2. **API:** TypeBox/Elysia validation
3. **Web:** React Hook Form + Zod

**Single source of truth:** Zod schema di `packages/validation`.

---

## Summary

| Aspect | Decision |
|--------|----------|
| Instance model | 1 instance = banyak organizations |
| Organization type | Field `type` + configurable `settings` JSONB |
| User roles | Per-organization, dynamic RBAC |
| Custom fields | Admin-configurable via UI, not schema |
| Validation | 3-layer (DB, API, Web) with shared Zod schemas |
