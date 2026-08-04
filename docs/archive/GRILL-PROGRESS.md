# Grill Progress — Sesi 7: Mustaka Domain Refinement

> **Status**: Berlangsung
> **Tanggal**: 2026-08-03

---

## Keputusan yang Telah Disepakati

### 1. Hierarki Organisasi

- **Organization** = Lembaga pendidikan (sekolah, madrasah, pesantren, kursus).
- **Foundation/Yayasan** = Instance Mustaka (satu database = satu yayasan).
- _Catatan_: Tidak ada tabel `Foundation` tingkat atas; isolasi terjadi di level instance.

### 2. Identitas Pengguna & Orang Tua

- **UserProfile** = Identitas global seseorang (bisa ada tanpa akun login).
- **UserParent** terhubung ke `UserProfile` anak (bukan ke `Student`).
- **Konsekuensi**: Orang tua melihat riwayat akademik gabungan dari semua lembaga dalam satu yayasan (misal: anak pindah dari SD ke SMP dalam yayasan yang sama).

### 3. Model Siswa (Student)

- Satu `UserProfile` bisa memiliki beberapa record `Student`.
- Setiap `Student` merepresentasikan "jalur akademik" atau keanggotaan di satu `Organization`.
- **Skenario Valid**: Seorang anak terdaftar di Sekolah A (sebagai siswa formal) DAN mengikuti kursus di Lembaga B (sebagai peserta kursus) dalam yayasan yang sama.

### 4. Kelompok Belajar (Learning Group)

- Satu `Student` boleh berada di beberapa `LearningGroup` dalam satu `Organization` dan `AcademicPeriod`.
- **Skenario Valid**: Kelas reguler (Kelas 7A) + Program Tambahan (Halaqah Tahfidz) di waktu berbeda.
- **Kunci**: Semua relasi akademik terikat pada `AcademicPeriod`.

### 5. Model Kurikulum (Curriculum/Program)

- **Curriculum** berfungsi sebagai _template_ atau _blueprint_ daftar mata pelajaran untuk sebuah "program".
- `LearningUnit` bersifat global per Organization (tidak terikat kurikulum/kelas).
- `LearningGroup` dihubungkan ke satu `Curriculum`.
- **Contoh**:
  - "SD Reguler Kelas 7" (Curriculum) berisi: Matematika, IPA, Bahasa (LearningUnit).
  - "Program Pesantren" (Curriculum) berisi: Tahfidz, Fiqih, Adab.

### 6. Prosedur Insert CourseEnrollment (Hybrid)

- **Sekolah Dasar (Otomatis)**: Admin pindahkan siswa ke Kelas → sistem auto-generate `CourseEnrollment` berdasarkan Curriculum kelas.
- **Universitas/Kursus (Manual)**: Admin/Siswa pilih mata pelajaran tertentu dari daftar kurikulum (Selective Enrollment).
- **Kunci**: Fleksibilitas ini dikonfigurasi di level Organization atau LearningGroup.

### 7. Sistem Penilaian (Grading System)

- **`score` field**: Kolom utama di `CourseEnrollment` untuk nilai akhir (Numerik 0-100).
- **`metadata` field (JSONB)**: Kolom generic untuk data pendukung:
  - Konversi nilai (misal: `"grade_letter": "A"`).
  - Rincian komponen (misal: `{ "task": 90, "midterm": 80 }`).
  - Progres hafalan (misal: `{ "pages": 50, "total": 304 }`).
- **Pendekatan Hybrid**: Simple score untuk SD, komponen via JSON untuk universitas, metadata progres untuk pesantren.

### 8. Model Pengajaran (Teaching Model)

- **Dua Tabel Terpisah**:
  - **`TeachingAssignment`**: Menentukan SIAPA (Employee) mengajar APA (LearningUnit) di KELAS (LearningGroup) mana. Berfungsi sebagai alokasi jam tatap muka per minggu.
  - **`Schedule`**: Menentukan KAPAN dan DIMANA pertemuan terjadi (Hari, Jam, Ruang). Merujuk pada `TeachingAssignment`.
- **Alasan**: Menghindari redundansi data (satu assignment bisa punya banyak jadwal) dan memisahkan konfigurasi statis (alokasi guru) dari dinamis (jadwal mingguan).

### 9. Fitur yang Ditunda (Out of MVP Scope)

- **Absensi (Attendance)**: Ditunda karena terkait erat dengan modul `workflow` dan `violation` yang lebih kompleks.

---

## Pertanyaan yang Sedang Dibahas

### Topik: Laporan Akademik (Rapor)

- Bagaimana sistem menghasilkan "Rapor" atau laporan nilai akhir per siswa per periode?
- Apakah ada tabel `ReportCard` atau cukup dengan query `CourseEnrollment` + `metadata`?

---

## Dokumen Terkait

- [docs/schema-consolidated.md](docs/schema-consolidated.md)
- [docs/grill/README.md](docs/grill/README.md)
