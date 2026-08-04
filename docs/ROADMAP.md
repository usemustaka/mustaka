# Mustaka — Roadmap

> Last Updated: 2026-08-03 | Current Phase: **Phase 1 (Foundation)**

---

## Phase 1: Foundation (Current)

**Goal:** Establish core infrastructure, auth, and database schema.

- [ ] **ZenStack Schema:** Finalize `schema.zmodel` with all domain models.
- [ ] **Better Auth Setup:** Configure Organization plugin, Email provider.
- [ ] **Core Packages:**
  - [ ] `@mustaka/auth` (Session management).
  - [ ] `@mustaka/db` (Prisma client wrapper).
  - [ ] `@mustaka/events` (NATS connection).
- [ ] **Monorepo Config:** Bun workspaces, ESLint, Prettier.

---

## Phase 2: MVP Features

**Goal:** Build the core SIAKAD functionality (Student, Parent, Grades).

- [ ] **Student Management:** CRUD, Profile, Bulk Import.
- [ ] **Parent System:** Linking, Account creation (Admin-only).
- [ ] **Academic Structure:** Year, Period, Learning Unit, Learning Group.
- [ ] **Enrollment & Grades:** Course Enrollment, Grade entry with Audit Trail.
- [ ] **Employee Management:** Teacher/Staff CRUD, RBAC assignment.
- [ ] **Dashboard:** Stats, Recent Activity, Quick Actions.

---

## Phase 3: Modules (Post-MVP)

**Goal:** Expand functionality via modular system.

- [ ] **Attendance:** Daily presence, Reports.
- [ ] **Violation:** Points system, Threshold alerts.
- [ ] **Workflow Engine:**
  - [ ] API & Engine (BullMQ).
  - [ ] Visual Editor (ReactFlow).
  - [ ] Template system.
- [ ] **Schedule:** Timetable, Conflict detection.
- [ ] **Finance:** SPP/Billing, Invoicing.

---

## Phase 4: Community & Ecosystem

**Goal:** Enable community contributions and integrations.

- [ ] **Module System:** Manifest, Installation, Isolation.
- [ ] **Marketplace:** Workflow templates, Community modules.
- [ ] **Integrations:** WhatsApp (Wablas/Fonnte), SMS, Webhooks.
- [ ] **Reporting:** PDF/Excel export, Custom templates.

---

## Phase 5: Advanced Features

**Goal:** Scale and modernize.

- [ ] **Multi-DB:** Database-per-tenant option.
- [ ] **Mobile App:** React Native (Push notifications, QR scan).
- [ ] **AI Features:** Assistant, Predictive analytics.

---

## Success Metrics (MVP)

| Metric           | Target                           |
| :--------------- | :------------------------------- |
| **Core Tables**  | 100% Implemented                 |
| **MVP Features** | Student + Grade + Parent working |
| **Tests**        | Unit tests for core packages     |
