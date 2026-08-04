# Mustaka — Product Requirement Document (PRD)

> Version: 1.1 | Last Updated: 2026-08-03 | Status: 🚀 Foundation Phase

---

## 1. Executive Summary

**Mustaka** is an open-source, multi-tenant **Academic Information System (SIAKAD)** agnostic to institutional types (Schools, Madrasah, Pesantren, Courses, Universities). Built with a modular architecture, it allows organizations to configure their own academic structures, workflows, and branding within a single instance.

### Core Value Proposition

- **Organization First:** One instance supports unlimited organizations with isolated data.
- **Agnostic Modeling:** Generic domain models (LearningUnit, LearningGroup) replace rigid school-specific tables.
- **Workflow Automation:** A visual automation engine (Phase 3) allows no-code logic for notifications and administrative tasks.

---

## 2. User Roles & RBAC Matrix

Mustaka leverages the **Better Auth Organization Plugin** for multi-tenant RBAC.

### Roles Definition

| Role       | Description                                                              | Scope                 |
| :--------- | :----------------------------------------------------------------------- | :-------------------- |
| **Owner**  | System/Organization Owner. Bypasses all RLS restrictions for their org.  | Organization-wide     |
| **Admin**  | Staff TUs. Manage users, students, employees, and settings.              | Organization-wide     |
| **Member** | Teachers/Staff. Manage grades, attendance, and specific student groups.  | Assigned Groups/Units |
| **Guest**  | Parents/Guardians. View-only access to specific student data (Children). | Specific Student(s)   |

### Permissions Matrix (MVP)

| Action               | Owner | Admin |    Member     | Guest |
| :------------------- | :---: | :---: | :-----------: | :---: |
| **User Management**  |  ✅   |  ✅   |      ❌       |  ❌   |
| **Org Settings**     |  ✅   |  ✅   |      ❌       |  ❌   |
| **Student CRUD**     |  ✅   |  ✅   |   🟡 (Read)   |  ❌   |
| **Grade Management** |  ✅   |  ✅   | ✅ (Assigned) |  ❌   |
| **Audit Log View**   |  ✅   |  ✅   |      ❌       |  ❌   |
| **Hard Delete**      |  ✅   |  ❌   |      ❌       |  ❌   |
| **View Own Child**   |  ✅   |  ✅   |      ❌       |  ✅   |

---

## 3. Key Product Features (MVP)

### 3.1 Identity & Access Management

- **Separation of Concerns:** `UserProfile` (Identity) vs `User` (Auth).
- **Parent Linking:** Parents linked to `UserProfile` (not `Student`) to handle deceased parents/missing NIK.
- **Multi-Organization User:** A single user can be a Teacher in Org A and an Admin in Org B.

### 3.2 Academic Structure

- **Period Management:** Supports Semester, Quarter (Caturwulan), or custom periods.
- **Generic Groups:** `LearningGroup` (Rombel/Halaqah/Batch) with configurable labels.
- **Generic Subjects:** `LearningUnit` (Matpel/Kitab/Modul).
- **Curriculum Templates:** A `Curriculum` model defines a blueprint of LearningUnits for a program.

### 3.3 Enrollment & Records

- **Enrollment is Heart:** `CourseEnrollment` connects Student + Unit + Period.
- **Group Membership:** `StudentGroup` tracks class assignment history (supports transfers).
- **Audit Trail:** Every grade change or significant mutation is recorded in `AuditLog`.
- **Flexible Enrollment:** Auto-generated (Primary/SD) or Manual Selection (University/Kursus).

### 3.4 Teaching & Scheduling

- **TeachingAssignment:** Links Employee (Teacher) to a LearningUnit + LearningGroup (Allocation).
- **Schedule:** Defines WHEN and WHERE (Day, Time, Room) the teaching happens.

### 3.5 Notification System

- **Multi-Channel:** In-App, Email, WhatsApp.
- **1 Record = 1 Channel:** Simplifies status tracking (Pending/Sent/Delivered/Failed).
- **Workflow Driven:** Templates defined in Workflow nodes.

---

## 4. Operational Context

### 4.1 Deployment

- **Containerized:** Docker Compose (Traefik, PostgreSQL, Redis, MinIO).
- **Target Spec:** 4GB RAM VPS (common in Indonesian hosting).

### 4.2 Data Lifecycle

- **Soft Delete:** `archived_at` (hide) vs `deleted_at` (inaccessible).
- **Global State:** Academic Year/Period selected via Cookie (auto-detected by date).
- **End-of-Year:** Manual procedure to copy Learning Groups/Units to the next year.

---

## 5. Future Modules (Post-MVP)

- `attendance`: Daily presence tracking (Deferred).
- `violation`: Student disciplinary records.
- `workflow`: Visual automation engine (ReactFlow).
- `finance`: SPP and billing management.
