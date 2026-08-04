# Domain Docs

Bagaimana skill engineering harus mengonsumsi dokumentasi domain repo ini saat mengeksplorasi codebase.

## Sebelum eksplorasi, baca ini

- **`CONTEXT.md`** di root repo, atau
- **`CONTEXT-MAP.md`** di root repo jika ada — menunjuk ke satu `CONTEXT.md` per context. Baca yang relevan dengan topik.
- **`docs/adr/`** — baca ADR yang menyentuh area yang akan dikerjakan. Di multi-context repo, cek juga `src/<context>/docs/adr/` untuk keputusan spesifik context.

Jika file-file ini tidak ada, **lanjutkan secara diam-diam**. Jangan tandai ketiadaannya; jangan sarankan membuatnya di awal. Skill `/domain-modeling` (dari `/grill-with-docs` dan `/improve-codebase-architecture`) membuatnya secara lazy ketika istilah atau keputusan benar-benar diselesaikan.

## Struktur file

Single-context repo (sebagian besar repo):

```
/
├── CONTEXT.md
├── docs/adr/
│   ├── 0001-event-sourced-orders.md
│   └── 0002-postgres-for-write-model.md
└── src/
```

Multi-context repo (ada `CONTEXT-MAP.md` di root):

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← keputusan system-wide
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← keputusan context-specific
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## Gunakan kosakata dari glossary

Ketika outputmu menamai konsep domain (di judul issue, proposal refactor, hipotesis, nama test), gunakan istilah sebagaimana didefinisikan di `CONTEXT.md`. Jangan berpindah ke sinonim yang secara eksplisit dihindari glossary.

Jika konsep yang kamu butuh belum ada di glossary, itu sinyal — kamu mungkin menciptakan bahasa yang tidak dipakai project (pertimbangkan ulang) atau ada celah nyata (catatkan untuk `/domain-modeling`).

## Tandai konflik ADR

Jika outputmu bertentangan dengan ADR yang sudah ada, tunjukkan secara eksplisit daripada diam-diam meng-overwrite:

> _Bertentangan dengan ADR-0007 (event-sourced orders) — tapi worth reopening karena…_
