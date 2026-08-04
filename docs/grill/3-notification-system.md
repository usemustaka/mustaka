# Grill #3: Notification System

> Status: ✅ Resolved

---

## Pertanyaan

Bagaimana sistem notifikasi yang benar, terutama untuk:
1. FCM token storage untuk mobile
2. WhatsApp gateway integration
3. Notification preferences per user
4. Notification template di workflow
5. Status tracking per channel

---

## Keputusan

### Notification Model

```prisma
model Notification {
  id           String              @id @default(uuid())
  userId       String
  user         User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Channel & Status
  channel      NotificationChannel
  status       NotificationStatus  @default(PENDING)
  
  // Content
  type         String              // 'violation', 'grade', 'attendance', 'system'
  title        String
  body         String
  
  // Payload untuk additional data / click-through URL
  payload      Json?               // { url: "/students/123", action: "view", data: {...} }
  
  // Status tracking
  sentAt       DateTime?
  deliveredAt  DateTime?
  readAt       DateTime?           // untuk in-app
  errorMessage String?             // jika gagal kirim
  
  // Source reference
  sourceType   String?             // 'violation', 'grade', etc
  sourceId     String?
  
  createdAt    DateTime            @default(now())
}

enum NotificationChannel {
  IN_APP
  EMAIL
  WHATSAPP
}

enum NotificationStatus {
  PENDING
  SENT
  DELIVERED
  FAILED
}
```

**Key Decision:** 1 notification record = 1 channel. Jika mau kirim via multiple channel, buat multiple records.

---

### UserDevice (FCM Token)

```prisma
model UserDevice {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  fcmToken  String
  platform  String   // 'ios', 'android', 'web'
  lastActive DateTime @default(now())
  
  @@unique([userId, platform])
}
```

**Decision:** 1 device per user per platform (simplified).

---

### UserProfile Preferences (JsonB)

```prisma
model UserProfile {
  // ...
  preferences Json?   // JSONB: { notifications: {...}, theme: 'dark', ... }
}
```

**Contoh structure:**
```json
{
  "notifications": {
    "email": true,
    "whatsapp": true,
    "inApp": true
  },
  "theme": "dark",
  "language": "id"
}
```

---

### WhatsApp Package

```
packages/whatsapp/
├── index.ts           # Main export
├── providers/
│   ├── wablas.ts
│   ├── fonnte.ts
│   └── baileys.ts     # Self-hosted
└── types.ts
```

**Decision:** Flexible provider system, tidak hardcode ke satu provider.

---

### Notification Template

**Decision:** Template ada di workflow config, bukan tabel terpisah.

Workflow node config:
```json
{
  "action": "send_notification",
  "params": {
    "channel": "email",
    "title": "Pelanggaran Siswa",
    "body": "Ananda {{trigger.student.name}} melakukan pelanggaran",
    "payload": {
      "url": "/students/{{trigger.student.id}}/violations"
    }
  }
}
```

---

## Flow: Multi-Channel Notification

```
Workflow Trigger: Violation Created
    │
    ├──▶ Action: Send Notification (IN_APP)
    │    → Notification { channel: IN_APP, status: PENDING }
    │
    ├──▶ Action: Send Notification (EMAIL)
    │    → Notification { channel: EMAIL, status: PENDING }
    │
    └──▶ Action: Send Notification (WHATSAPP)
         → Notification { channel: WHATSAPP, status: PENDING }

Setelah dikirim:
→ Notification.status = SENT
→ Notification.sentAt = now()

Jika delivered:
→ Notification.status = DELIVERED
→ Notification.deliveredAt = now()

Jika user buka (in-app):
→ Notification.readAt = now()
```

---

## Payload Examples

### In-App Notification (click-through)
```json
{
  "url": "/dashboard/students/abc123/violations",
  "action": "view_violation",
  "data": {
    "violationId": "xyz789",
    "studentName": "Ahmad Fauzi"
  }
}
```

### Email Notification (CTA button)
```json
{
  "url": "https://app.mustaka.id/dashboard/students/abc123",
  "ctaText": "Lihat Detail Siswa"
}
```

### WhatsApp Notification (deep link)
```json
{
  "url": "https://app.mustaka.id/s/abc123",
  "shortUrl": true
}
```

---

## Summary

| Component | Location | Notes |
|-----------|----------|-------|
| Notification records | `notifications` table | 1 record = 1 channel |
| FCM tokens | `user_devices` table | 1 per user per platform |
| Preferences | `UserProfile.preferences` (JsonB) | notifications, theme, etc |
| Templates | Workflow config | Dynamic, user-defined |
| WhatsApp | `packages/whatsapp` | Multi-provider support |
