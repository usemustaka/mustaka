# Mustaka

**SIAKAD Agnostik Open-Source — untuk Sekolah, Madrasah, Pesantren, Kursus, Universitas.**

Mustaka adalah SIAKAD (Sistem Informasi Akademik) agnostik yang bisa digunakan oleh berbagai jenis lembaga pendidikan. Setiap yayasan/lembaga mendapat satu instance lengkap dengan multi-organisasi. Platform terdiri dari model domain generic, workflow visual berbasis ReactFlow, dan arsitektur modular plug-n-play.

---

## Mengapa Agnostik?

Mustaka **tidak mengenal istilah Mapel atau Mata Kuliah sebagai entity utama.** Semuanya disederhanakan menjadi generic concepts:

| Generic Concept | Sekolah        | Pesantren    | Kursus/Bootcamp | Universitas |
| --------------- | -------------- | ------------ | --------------- | ----------- |
| `LearningUnit`  | Mata Pelajaran | Kitab        | Modul           | Mata Kuliah |
| `LearningGroup` | Rombel/Kelas   | Halaqah      | Batch/Class     | Kelas       |
| `Student`       | Siswa          | Santri       | Peserta         | Mahasiswa   |
| `Year`          | Tahun Ajaran   | Tahun Ajaran | Tahun           | Semester    |
| `Period`        | Semester       | Caturwulan   | Batch           | Quarter     |

---

## Prinsip Arsitektur

1. **Organization First** — Semua data di dalam organisasi. Multi-org dalam 1 instance.
2. **API-first** — Business logic 100% di API. Frontend hanya lapisan presentasi.
3. **Event-driven** — Komunikasi antar modul via NATS event bus. Zero coupling.
4. **JSONB untuk dynamic fields** — Data inti di kolom relasional, data dinamis di JSONB.
5. **Enrollment is the Heart** — `CourseEnrollment` menghubungkan Student + Learning Unit + Period.

---

## Tech Stack

| Layer              | Teknologi                  | Fungsi                                    |
| ------------------ | -------------------------- | ----------------------------------------- |
| **Runtime**        | Bun v1.3+                  | Runtime JS all-in-one                     |
| **Backend**        | Elysia v1.4                | Type-safe HTTP framework                  |
| **Frontend**       | Next.js 16 + React 19      | SSR + SPA admin panel                     |
| **ORM**            | ZenStack V3                | Schema-first ORM + access control         |
| **Auth**           | Better Auth v1.6           | Autentikasi multi-provider, session, RBAC |
| **Database**       | PostgreSQL 18 + JSONB      | Relational + document hybrid              |
| **Object Storage** | MinIO                      | S3-compatible, file & dokumen             |
| **Cache & Queue**  | Redis 7                    | Cache, BullMQ queue, session store        |
| **Message Broker** | NATS                       | Event bus antar modul                     |
| **UI**             | shadcn/ui + Tailwind CSS 4 | Utility-first component library           |
| **Theming**        | next-themes                | Dark/light mode                           |

---

## Struktur Monorepo

```
mustaka/
├── apps/
│   ├── api/                    # Backend — Elysia server
│   └── web/                    # Frontend — Next.js 16
│
├── packages/
│   ├── auth/                   # @mustaka/auth — Better Auth config
│   ├── db/                     # @mustaka/db — ZenStack ORM
│   ├── logger/                 # @logger — Structured logging
│   ├── events/                 # @mustaka/events — NATS event bus
│   ├── utils/                  # @mustaka/utils — Shared helpers
│   └── validation/             # @mustaka/validation — Shared Zod schemas
│
├── modules/                    # Official & community modules
│   ├── attendance/             # Absensi siswa
│   ├── violation/              # Pelanggaran siswa
│   └── workflow/               # Visual automation
│
├── docs/                       # Documentation
│   ├── PRODUCT.md              # Domain & visi bisnis
│   ├── ARCHITECTURE.md         # Sistem & alur data
│   ├── ROADMAP.md              # Roadmap & milestones
│   └── schema-consolidated.md  # Final domain schema
│
├── docker/                     # Docker compose files
└── scripts/                    # Deployment & utility scripts
```

---

## Domain Schema (Core Tables)

```
Organization
├── Year → Period
├── LearningGroup (Rombel/Halaqah/Batch)
├── LearningUnit (Mapel/Kitab/Modul)
├── Student
│   ├── StudentGroup (kelas/rombel)
│   ├── CourseEnrollment (enrollment + nilai)
│   └── UserParent (orangtua/wali)
└── Employee (Guru/Staff)
```

**Key tables:**

| Table              | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `UserProfile`      | Identity (NIK, NISN), bisa tanpa auth    |
| `UserParent`       | Parent ↔ Child (via UserProfile)         |
| `Student`          | Academic identity per org                |
| `StudentGroup`     | Student ↔ Learning Group (with history)  |
| `CourseEnrollment` | Student + Learning Unit + Period + Grade |
| `LearningUnit`     | Generic "subject"                        |
| `LearningGroup`    | Generic "class" + homeroom teacher       |
| `Employee`         | Guru/Staff (single table)                |
| `AuditLog`         | Generic change tracking                  |

---

## Module System

Modules are in `modules/` directory with `module.json` manifest.

```json
{
  "name": "@mustaka/module-attendance",
  "version": "1.0.0",
  "label": "Absensi Siswa",
  "description": "Modul untuk mencatat kehadiran siswa",
  "dependencies": [],
  "hooks": {
    "schema": ["attendance"],
    "routes": ["attendance"],
    "events": {
      "subscribes": ["student.created"],
      "publishes": ["attendance.marked"]
    }
  }
}
```

**Future modules:**

- `attendance` — Absensi siswa
- `violation` — Pelanggaran siswa
- `workflow` — Visual automation engine
- `schedule` — Jadwal mengajar
- `finance` — SPP, billing

---

## Workflow Engine (Future)

Workflow merupakan automation engine bawaan Mustaka, terinspirasi dari n8n/Zapier.

```
[Trigger: Violation Inserted]
        │
        ▼
[Action: Notify Parent]
"Ananda Ahmad melakukan pelanggaran"
        │
        ▼
[Condition: Points >= 10?]
  ├─ TRUE ──▶ [Action: Notify Guru BK]
  └─ FALSE ─▶ [End]
```

---

## Panduan Memulai

### Prasyarat

- Bun v1.3+
- Docker & Docker Compose
- Git

### Setup Development

```bash
# Clone repository
git clone https://github.com/usemustaka/mustaka.git
cd mustaka

# Install dependencies
bun install

# Start infrastructure
docker-compose up -d

# Setup environment
cp .env.example .env
# Edit .env with your settings

# Push database schema
bun run db:push

# Generate Better Auth schema
bun run auth:generate

# Start development
bun run dev
```

### Perintah

```bash
bun run dev              # Start all (api + web)
bun run dev:api          # Start API only
bun run dev:web          # Start Web only
bun run build            # Build all
bun run lint             # Lint all
bun run db:push          # Push schema to DB
bun run db:generate      # Generate Prisma client
bun run auth:generate    # Generate Better Auth schema
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mustaka

# Auth
BETTER_AUTH_SECRET=your-secret-key-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# App URLs
APP_URL=http://localhost:3000
API_URL=http://localhost:4000

# Redis
REDIS_URL=redis://localhost:6379

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# NATS
NATS_URL=nats://localhost:4222
```

---

## Docker & Infrastruktur

### Development

```yaml
services:
  postgres:
    image: postgres:18-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mustaka

  adminer:
    image: adminer
    ports: ["8080:8080"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  minio:
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    command: server /data --console-address ":9001"

  nats:
    image: nats:alpine
    ports: ["4222:4222"]
```

### Production

```yaml
services:
  traefik:
    image: traefik:v3
    ports: ["80:80", "443:443"]

  postgres:
    image: postgres:18-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine

  nats:
    image: nats:alpine

  minio:
    image: minio/minio
    command: server /data

  api:
    build: ./apps/api
    depends_on: [postgres, redis, nats, minio]

  web:
    build: ./apps/web
    depends_on: [api]
```

---

## Deployment

### Per VPS

1. Clone repository ke VPS
2. Copy `.env.example` ke `.env.production`
3. Edit environment variables
4. Run `docker-compose -f docker-compose.prod.yml up -d`
5. Setup Traefik untuk auto SSL

### Deploy Script

```bash
#!/bin/bash
# scripts/deploy.sh

git pull origin main
bun install
bun run build
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Referensi

- [Product Documentation](docs/PRODUCT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Domain Schema](docs/schema-consolidated.md)
- [Grill Sessions](docs/grill/)
- [Better Auth](https://better-auth.com)
- [ZenStack](https://zenstack.dev)
- [Elysia](https://elysiajs.com)
- [shadcn/ui](https://ui.shadcn.com)

---

## Contributing

Mustaka adalah open-source. Kontribusi sangat diterima!

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Buat Pull Request

---

## License

MIT License
