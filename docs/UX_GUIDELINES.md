# Mustaka — UX Guidelines

> Version: 1.1 | Last Updated: 2026-08-03

---

## 1. Design System

### 1.1 Tech Stack

- **Components:** shadcn/ui (Radix UI primitives).
- **Styling:** Tailwind CSS 4.
- **Icons:** Lucide React.
- **Theming:** `next-themes` (Light/Dark mode support mandatory).

### 1.2 Visual Identity

- **Voice:** Professional, Clear, Indonesian-first.
- **Layout:** Sidebar navigation (Admin), Top-nav (Parent/Guest).
- **Density:** Comfortable spacing, high readability.

---

## 2. State Machine UX

Every data-fetching component MUST handle these 4 states:

| State       | UI Representation                            | Action                  |
| :---------- | :------------------------------------------- | :---------------------- |
| **Loading** | Skeleton shimmer (Tailwind `animate-pulse`). | User waits.             |
| **Empty**   | Illustration + "No Data" text + CTA button.  | Guide user to create.   |
| **Error**   | Error Boundary + "Retry" button.             | Inform user of failure. |
| **Success** | Data Table / Card Grid.                      | Interactive view.       |

---

## 3. Interaction Patterns

### 3.1 Forms

- **Validation:** Real-time validation (Zod) via React Hook Form.
- **Feedback:** Toast notifications for Success/Error on submit.
- **Loading:** Disable submit button + Spinner during async operations.

### 3.2 Data Tables

- **Filtering:** Column filters + Global search.
- **Pagination:** Server-side pagination (default 20 rows).
- **Bulk Actions:** Checkbox selection for bulk delete/import.

### 3.3 Notifications

- **In-App:** Bell icon in header with unread count badge.
- **Toast:** Bottom-right popups for immediate feedback.

---

## 4. Accessibility (A11y)

- **WCAG 2.1 AA:** Target compliance.
- **Keyboard Navigation:** All interactive elements must be focusable and operable via keyboard.
- **Color Contrast:** Minimum 4.5:1 ratio for text.
- **Semantic HTML:** Use `<main>`, `<nav>`, `<table>` correctly.

---

## 5. Responsive Breakpoints

| Device      | Width          | Behavior                           |
| :---------- | :------------- | :--------------------------------- |
| **Mobile**  | < 768px        | Stack layout, bottom nav (future). |
| **Tablet**  | 768px - 1024px | Collapsible sidebar.               |
| **Desktop** | > 1024px       | Fixed sidebar + Content area.      |
