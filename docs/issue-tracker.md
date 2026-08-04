# Issue tracker: Local Markdown

Issues dan spec (PRD) untuk repo ini hidup sebagai file markdown di `.scratch/`.

## Konvensi

- Satu fitur per direktori: `.scratch/<feature-slug>/`
- Spec: `.scratch/<feature-slug>/spec.md`
- Issue implementasi: satu file per ticket di `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, nomor dari `01` — jangan gabung semua ticket dalam satu file
- Status triage dicatat sebagai baris `Status:` di dekat atas setiap file issue (lihat `triage-labels.md` untuk role strings)
- Komentar dan riwayat percakapan di-append ke bawah file di bawah heading `## Comments`

## Ketika skill bilang "publish to the issue tracker"

Buat file baru di bawah `.scratch/<feature-slug>/` (buat direktori jika perlu).

## Ketika skill bilang "fetch the relevant ticket"

Baca file di path yang direferensikan. User biasanya akan pass path atau nomor issue secara langsung.

## Wayfinding operations

Digunakan oleh `/wayfinder`. **Map** adalah satu file dengan satu **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` — badan Notes / Decisions-so-far / Fog.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, nomor dari `01`, dengan pertanyaan di badan. Baris `Type:` mencatat tipe ticket (`research`/`prototype`/`grilling`/`task`); baris `Status:` mencatat `claimed`/`resolved`.
- **Blocking**: baris `Blocked by: NN, NN` di dekat atas. Ticket unblocked ketika semua file yang dilist statusnya `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` untuk file yang open, unblocked, dan unclaimed; yang paling kecil nomornya menang.
- **Claim**: set `Status: claimed` dan save sebelum mulai kerja.
- **Resolve**: append jawaban di bawah heading `## Answer`, set `Status: resolved`, lalu append context pointer (gist + link) ke Decisions-so-far di map `map.md`.
