# Grill #1: NISN vs NIP Placement

> Status: ✅ Resolved

---

## Pertanyaan

Di mana seharusnya NISN (Nomor Induk Siswa Nasional) dan NIP (Nomor Induk Pegawai) ditempatkan?

---

## Analisis

### NISN (Nomor Induk Siswa Nasional)
- Diterbitkan oleh Kemendikbud
- **Permanent** — melekat pada siswa seumur hidup
- Siswa yang pindah sekolah tetap membawa NISN
- Bahkan jika siswa nanti menjadi karyawan, NISN tetap ada di profil mereka

### NIP (Nomor Induk Pegawai)
- Diterbitkan oleh BKN (Badan Kepegawaian Negara)
- **Melekat pada pengangkatan** — sesuai Surat Keterangan pengangkatan pegawai
- Hanya relevan untuk karyawan (guru/staff)

---

## Keputusan

| Field | Lokasi | Alasan |
|-------|--------|--------|
| **NISN** | `UserProfile` | Permanent, mengikuti user seumur hidup |
| **NIP** | `Employee` | Melekat pada pengangkatan, hanya untuk karyawan |

---

## Rationale

1. **UserProfile** adalah "master identity" yang mengikuti user sepanjang lifecycle di sistem
2. Siswa yang nanti menjadi karyawan tetap memiliki NISN di profil mereka
3. NIP tidak perlu di UserProfile karena hanya relevan untuk role karyawan
4. Ini menghindari duplikasi data dan menjaga clean separation of concerns

---

## Schema Impact

```prisma
model UserProfile {
  id        String  @id @default(uuid())
  userId    String  @unique
  user      User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Identity numbers
  nisn      String?  // National Student ID — permanent
  nik       String?  // National Identity Number (KTP)
  
  // ... other fields
}

model Employee {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  nip       String?  @unique  // Nomor Induk Pegawai — tied to appointment
  // ... other fields
}
```

---

## Related Decisions

- User ID format: `{NIK}@mustaka.id` (akan digrill di #2)
- UserProfile jadi master identity layer
