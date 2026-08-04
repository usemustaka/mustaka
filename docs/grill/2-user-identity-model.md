# Grill #2: User Identity Model

> Status: ✅ Resolved

---

## Pertanyaan

Bagaimana model identitas user yang benar, terutama untuk:
1. Orangtua yang meninggal (NIK tidak diketahui)
2. Orangtua yang tidak punya email
3. Login flow yang benar

---

## Keputusan

### Core Concept: Identity vs Auth

```
User (Auth) ────1:1────> UserProfile (Identity)
   │                         │
   │                         ├── nik: String? (unique)
   │                         ├── nisn: String? (untuk siswa)
   │                         ├── isAlive: Boolean
   │                         └── ...
   │
   └── email: String (required untuk login)
```

**User** = Pengguna yang bisa login (Better Auth native)
**UserProfile** = Data publik dan informasi manusia (bisa ada tanpa User)

---

## Model Details

### UserProfile

```prisma
model UserProfile {
  id        String  @id @default(uuid())
  userId    String? @unique  // ✅ Nullable - profile bisa ada tanpa auth
  user      User?   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Identity numbers
  nik       String? @unique  // Nomor Induk Kependudukan (KTP)
  nisn      String?          // Nomor Induk Siswa Nasional
  
  // Personal info
  gender    Gender?
  birthDate DateTime?
  address   String?
  
  // Status
  isAlive   Boolean @default(true)
  
  // Dynamic fields
  attributes Json?   // JSONB: golongan_darah, dll
}

enum Gender {
  MALE
  FEMALE
}
```

### User (Better Auth - Generated)

```prisma
model User {
  id            String    @id
  email         String    // ✅ Required - wajib untuk login
  emailVerified Boolean   @default(false)
  name          String
  // ... Better Auth fields
  
  profile       Profile?  // 1:1 optional
}
```

### UserParent (Relationship)

```prisma
model UserParent {
  id              String   @id @default(uuid())
  
  // Student (the child)
  studentId       String
  student         UserProfile @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  // Parent/Guardian
  parentId        String
  parent          UserProfile @relation(fields: [parentId], references: [id], onDelete: Cascade)
  
  // Metadata
  relationship    ParentRelationship
  isPrimary       Boolean  @default(false)
  isEmergency     Boolean  @default(false)
  
  createdAt       DateTime @default(now())
  
  @@unique([studentId, parentId])
}

enum ParentRelationship {
  FATHER
  MOTHER
  GUARDIAN
}
```

---

## Key Decisions

| # | Keputusan | Alasan |
|---|-----------|--------|
| 1 | Login hanya via email | Better Auth native, tidak perlu username plugin |
| 2 | NIK di UserProfile (unique) | Identifier, bukan login credential |
| 3 | UserProfile.userId nullable | Profile bisa ada tanpa auth account |
| 4 | Admin buatkan akun | Orangtua tidak self-register |
| 5 | Email verification tetap jalan | Untuk validasi email yang benar |
| 6 | isAlive di UserProfile | Status hidup/meninggal |

---

## Flow: Orangtua Meninggal

```
1. Admin input data siswa Ahmad
2. Admin tambahkan orangtua:
   - Ayah: Budi (alm.) - NIK: 3201234567890001
   - Ibu: Siti - NIK: 3201234567890002
3. Sistem buat UserProfile untuk kedua orangtua:
   - Ayah: { nik: "3201234567890001", isAlive: false, userId: null }
   - Ibu: { nik: "3201234567890002", isAlive: true, userId: null }
4. UserParent terhubung ke UserProfile (bukan User)
5. Jika Ibu mau login:
   - Admin buat User record dengan email ibu
   - Link User ke UserProfile ibu
   - Ibu bisa login pakai email
```

---

## Flow: Admin Buatkan Akun

```
1. Admin klik "Buat Akun" untuk Ibu Siti
2. Admin input email: siti@gmail.com
3. Sistem buat User record:
   - email: siti@gmail.com
   - name: Siti (dari UserProfile)
4. Link User ke UserProfile Siti
5. Email verifikasi dikirim ke siti@gmail.com
6. Siti klik link → email verified
7. Siti bisa login pakai email
```

---

## Oddities Check

| # | Issue | Status |
|---|-------|--------|
| 1 | Email placeholder jika tidak ada? | ❌ Tidak perlu - admin wajib input email saat buat akun |
| 2 | NIK uniqueness per-instance? | ✅ Benar - single-tenant, NIK unik per instansi |
| 3 | UserProfile tanpa NIK? | ✅ Bisa - untuk user internasional |
| 4 | Email verification ke placeholder? | ❌ Tidak - admin input email asli |
| 5 | isAlive untuk semua user? | ✅ Ya - semua UserProfile punya field ini |

---

## Related Decisions

- Grill #1: NISN di UserProfile, NIP di Employee
- Grill #3: Notification channels (akan digrill)
