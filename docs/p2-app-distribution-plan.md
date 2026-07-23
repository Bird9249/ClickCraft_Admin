# แผน Implement P2 — App Distribution (Share Link)

**โปรเจกต์:** ClickCraft Admin  
**แนวทาง:** **B — Share link สำหรับ tester ภายนอก** (ไม่บังคับ login Admin)  
**เป้าหมาย:** แจกจ่าย build **Android** รายเวอร์ชันผ่านลิงก์ให้คนนอกดาวน์โหลดไปลองได้  
**สถานะแผน:** Implemented (B1 + B2)  
**อัปเดต:** 2026-07-23

## Implementation status

- [x] Phase B1 Foundation (schema + permissions + upload/list/publish) — **Android only**
- [x] Phase B1 Share links + public download page
- [x] Phase B2 Limits / QR / multi-app / stats / checksum
- [ ] Phase iOS — **รอ Apple Developer** → แผนแยก: [`p2-ios-distribution-plan.md`](./p2-ios-distribution-plan.md)
- Commands: `bun rbac:sync`, `bun test:distribution`  
  Migrations: `0003_distribution.sql`, `0004_distribution_b2.sql`  
  (หมายเหตุ: `bun run db:migrate` ของโปรเจกต์อาจติด journal เก่า — apply SQL distribution โดยตรงได้ถ้าจำเป็น)

**อ้างอิง:** `docs/p0-finance-mvp-plan.md`, `docs/p1-website-leads-plan.md`,  
โมดูล: `src/modules/distribution/`, upload: `ChunkFileUpload` + S3 utils

---

## 0. การตัดสินใจแพลตฟอร์ม (สำคัญ)

| ข้อเท็จจริง | ผลต่อแผน |
|-------------|----------|
| ตอนนี้**ยังไม่มีบัญชี Apple Developer** | ทำ iOS distribution จริงจังไม่ได้ |
| Android แจก `.apk` ได้โดยไม่พึ่ง Apple | **B1/B2 โฟกัส Android ให้ใช้งานจริง** |
| iOS OTA / เก็บ `.ipa` | **ยังไม่ทำ** — อย่าสัญญาว่าแชร์ลิงก์แล้วติดตั้งบน iPhone ได้ |

**เมื่อมี Apple Developer แล้ว (อนาคต):**

1. **แนะนำก่อน:** ใช้ **TestFlight**
2. **ค่อยพิจารณา:** เก็บลิงก์ TestFlight ใน Admin หรือทำ iOS OTA เอง

---

## 1. เป้าหมายและขอบเขต

### 1.1 เป้าหมายธุรกิจ

ให้ทีม ClickCraft สามารถ:

1. อัปโหลดไฟล์ build **Android (`.apk`)** เข้า Admin ได้ทีละเวอร์ชัน
2. จัดการสถานะ release: draft → published → archived
3. สร้าง **share link** ส่งให้ tester / ลูกค้า / partner โดยไม่ต้องสร้างบัญชี Admin
4. ยกเลิก (revoke) / ตั้งวันหมดอายุ / จำกัดจำนวนดาวน์โหลดได้
5. ควบคุมสิทธิ์ฝั่ง Admin ผ่าน RBAC
6. จัดการหลายแอป + QR + ดูสถิติลิงก์ (B2)

### 1.2 ทำไมเลือกตัวเลือก B (สรุปการตัดสินใจ)

| ทางเลือก | สรุป | เหตุผล |
|----------|------|--------|
| A — Internal only | ดาวน์โหลดได้เฉพาะคน login Admin | ไม่พอเมื่อต้องส่งให้คนนอก |
| **B — Share link** | หน้า public + token | **เลือกแล้ว** — ยืดหยุ่น ควบคุมด้วย expiry/revoke/quota |
| C — Firebase-like เต็มรูป | channel, notify, auto-cleanup | เกินขอบเขตรอบนี้ |

### 1.3 ในขอบเขตที่ทำแล้ว (B1 + B2)

| รายการ | รายละเอียด |
|--------|------------|
| App entity | หลายแอปได้ + seed `ClickCraft` + UI จัดการแอป |
| Release | platform = `android` เท่านั้น, version, build, S3 file, changelog, status, checksum |
| Upload | `ChunkFileUpload` → S3 + คำนวณ SHA-256 ฝั่ง client |
| Admin UI | list + filter ตามแอป + upload + publish/archive + share links |
| Share link | token, expiry (1/7/30 วัน), revoke, label, maxDownloads |
| Public page | `/d/:token` + download + checksum + คำแนะนำติดตั้ง Android |
| Public API | metadata + download (presigned GET redirect) + rate limit |
| Permissions | `distribution:read` / `distribution:write` |
| B2 extras | QR code, lastDownloadedAt, downloads left บนหน้า public |

### 1.4 นอกขอบเขต (ยังไม่ทำ)

| ช่วง | รายการ |
|------|--------|
| **ยังไม่ทำ** | อัปโหลด/แจก `.ipa`, iOS OTA, ข้อความว่า “ติดตั้งบน iPhone ได้” |
| **หลังมี Apple Developer** | TestFlight (แนะนำ) หรือ iOS OTA ใน Admin (optional) |
| ภายหลัง | แจ้งเตือนอัตโนมัติ, CI upload จาก pipeline, Play Internal Testing |
| ไม่ทำ | เก็บไฟล์บนดิสก์เซิร์ฟเวอร์, เปิด `/api/files/*` สาธารณะทั้งก้อน |

### 1.5 นิยาม Done — B1

- [x] อัปโหลด **Android `.apk`** ได้จาก Admin
- [x] Publish release แล้วสร้าง share link ได้
- [x] เปิด `/d/:token` โดยไม่ login แล้วดาวน์โหลด APK ได้
- [x] ลิงก์หมดอายุ / revoke แล้วดาวน์โหลดไม่ได้
- [x] ผู้ไม่มี `distribution:*` เข้าเมนู/API Admin ไม่ได้
- [x] ไฟล์อยู่บน S3 ไม่ใช่ local disk
- [x] UI/API **ไม่เปิดทางอัปโหลด iOS** ในรอบนี้

### 1.6 นิยาม Done — B2

- [x] `maxDownloads` ตั้งตอนสร้างลิงก์และ enforce ตอนดาวน์โหลด
- [x] QR code สำหรับ share link ใน Admin
- [x] หลายแอป: สร้าง/ลิสต์แอป + filter releases ตามแอป
- [x] สถิติลิงก์: downloadCount, maxDownloads, lastDownloadedAt
- [x] checksum SHA-256 เก็บตอนอัปโหลดและแสดงบนหน้า public

---

## 2. สถานะปัจจุบันที่เกี่ยวข้อง (หลัง implement)

| ส่วน | สถานะ |
|------|--------|
| Auth + session | ใช้ Better Auth กับ Admin routes |
| RBAC | มี `distribution:read` / `distribution:write` |
| Upload | multipart / `ChunkFileUpload` สำหรับ APK |
| File proxy `/api/files/*` | ยังต้อง auth — **ไม่ใช้** สำหรับ public download |
| S3 / MinIO | เก็บ APK + download ผ่าน `presign-download` |
| Schema / migrations | `distribution.ts` + `0003` / `0004` |
| โมดูล | `src/modules/distribution/` ตามแพตเทิร์น finance/leads |
| Apple Developer | ยังไม่มี — iOS นอกขอบเขต |

---

## 3. Domain Model (implemented)

### 3.1 Entities

ตารางจริง: `distribution_app`, `distribution_release`, `distribution_share_link`

```
distribution_app
  id, name, slug, createdAt, updatedAt

distribution_release
  id, appId
  platform          -- API/UI บังคับ 'android'
  version, buildNumber
  fileKey, fileName, fileSize, contentType
  checksumSha256    -- คำนวณตอนอัปโหลด
  changelog, status, publishedAt
  createdByUserId, createdAt, updatedAt

distribution_share_link
  id, releaseId, token, label
  expiresAt, maxDownloads
  downloadCount, lastDownloadedAt
  revokedAt, createdByUserId, createdAt
```

### 3.2 Constraints / กฎธุรกิจ

| กฎ | รายละเอียด |
|----|------------|
| Platform | รับแค่ `android` + ไฟล์ `.apk` |
| Unique release | `(appId, platform, version, buildNumber)` |
| Share link | สร้างได้เฉพาะ `published` |
| Download | ไม่ revoke, ไม่หมดอายุ, ไม่เกิน maxDownloads, release ยัง `published` |
| Archive | ลิงก์เก่าใช้ไม่ได้ |
| Token | opaque สุ่ม — ไม่ใช้ release id |

### 3.3 S3 key convention

```
uploads/distribution/{appSlug}/android/{version}-{buildNumber}/...
```

---

## 4. Permissions

| Permission | ความหมาย |
|------------|----------|
| `distribution:read` | ดู app/release/share links |
| `distribution:write` | อัปโหลด, publish/archive, สร้างแอป, สร้าง/revoke share link |

Public download ใช้ token แทน permission

---

## 5. API Design (implemented)

### 5.1 Admin API (`/api/distribution`, ต้อง auth)

| Method | Path | Permission |
|--------|------|------------|
| GET | `/apps` | read |
| POST | `/apps` | write |
| GET | `/releases` | read |
| GET | `/releases/:id` | read |
| POST | `/releases` | write |
| PATCH | `/releases/:id` | write |
| POST | `/releases/:id/publish` | write |
| POST | `/releases/:id/archive` | write |
| GET | `/releases/:id/share-links` | read |
| POST | `/releases/:id/share-links` | write |
| POST | `/share-links/:id/revoke` | write |

### 5.2 Public API (ไม่ต้อง login)

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/api/distribution/public/:token` | metadata (+ checksum, quota) |
| GET | `/api/distribution/public/:token/download` | ตรวจ token → นับ download → 302 S3 |

### 5.3 Error cases (public)

| สถานะ | HTTP | error code |
|--------|------|------------|
| token ไม่มี | 404 | `NOT_FOUND` |
| revoked | 410 | `REVOKED` |
| expired | 410 | `EXPIRED` |
| ไม่ published / archived | 404 | `UNAVAILABLE` |
| เกิน maxDownloads | 410 | `QUOTA` |
| rate limit | 429 | `RATE_LIMIT` |

---

## 6. Frontend (implemented)

### 6.1 Admin

| รายการ | path / รายละเอียด |
|--------|-------------------|
| Route | `/app/distribution` |
| Sidebar | App Distribution + `distribution:read` |
| List | DataTable + filter ตามแอป |
| Upload | dialog เลือกแอป + APK + changelog |
| Apps | Manage apps dialog |
| Share links | create / copy / QR / revoke / stats |

### 6.2 Public download page

| รายการ | รายละเอียด |
|--------|------------|
| Route | `/d/$token` (นอก authenticated shell) |
| เนื้อหา | แอป, version, size, SHA-256, downloads left, changelog, Download APK |
| States | loading / invalid / expired / revoked / quota / ready |

URL: `https://<admin-host>/d/{token}`

---

## 7. Security (implemented)

| หัวข้อ | สถานะ |
|--------|--------|
| Token entropy | 32 bytes base64url |
| Storage | plain token ใน DB |
| Isolation | public routes แยกจาก admin auth group |
| Download | S3 presigned GET สั้นๆ |
| Rate limit | in-memory ต่อ IP สำหรับ public endpoints |
| Enumeration | ไม่มี list releases สาธารณะ |
| Audit | ยังไม่ wire `appendAudit` (optional ตามเดิม) |

---

## 8. โครงสร้างไฟล์ (implemented)

```
src/modules/distribution/
  api/index.ts
  domain/
    contracts.ts
    contracts.test.ts
    types.ts
    http/
      apps.routes.ts
      releases.routes.ts
      share-links.routes.ts
      public.routes.ts
    repo/
      apps/
      releases/
      share-links/
    service/
      apps.ts
      releases.ts
      share-links.ts
      share-access.ts
      share-access.test.ts
      rate-limit.ts
  presentation/
    api/client.ts
    api/queries.ts
    pages/
      DistributionPage.tsx
      PublicDownloadPage.tsx
    ui/
      ReleasesTable.tsx
      UploadReleaseDialog.tsx
      ShareLinksPanel.tsx
      ShareLinkQr.tsx
      ManageAppsDialog.tsx
      ReleaseStatusBadge.tsx

src/server/platform/db/schema/distribution.ts
src/server/platform/db/migrations/0003_distribution.sql
src/server/platform/db/migrations/0004_distribution_b2.sql
src/server/utils/presign-download.ts
src/shared/lib/sha256-file.ts
```

ลงทะเบียนแล้ว: REST (`distributionRoutes`), router `/app/distribution` + `/d/$token`, sidebar, route-meta, permissions

---

## 9. แผนงานรายเฟส

### Phase B1 — Android + Share download

- [x] Schema + migration + seed แอป
- [x] Permissions + sync
- [x] Admin API list/create/publish/archive
- [x] Upload wiring
- [x] Admin UI
- [x] Share link API
- [x] Public API + page `/d/:token`
- [x] Unit tests ขั้นต่ำ

### Phase B2 — เสริมการแจกจ่าย

- [x] `maxDownloads` enforce
- [x] QR code
- [x] หลายแอป / จัดการแอปใน UI
- [x] สถิติดาวน์โหลด (count + lastDownloadedAt)
- [x] checksum บนหน้า public

### Phase iOS — หลังมี Apple Developer เท่านั้น

ดูแผนเต็ม (สิ่งที่ต้องเตรียม + TF1/TF2/OTA):  
**[`p2-ios-distribution-plan.md`](./p2-ios-distribution-plan.md)**

| ขั้น | แนวทาง | สถานะ |
|------|--------|--------|
| 1 | สมัคร Apple Developer Program | รอ |
| 2 | ใช้ TestFlight (TF1) | รอ |
| 3 (optional) | เก็บ/แสดงลิงก์ TestFlight ใน Admin (TF2) | รอ |
| 4 (optional) | iOS OTA ใน Admin | รอ |

---

## 10. ข้อจำกัดแพลตฟอร์ม

| แพลตฟอร์ม | สถานะ | หมายเหตุ |
|-----------|--------|----------|
| **Android** | รองรับ (B1+B2) | ดาวน์โหลด `.apk` → ติดตั้ง (unknown sources) |
| **iOS** | นอกขอบเขต | รอ Apple Developer; แนะนำ TestFlight ก่อน |

---

## 11. Testing checklist

### Automated

- [x] `bun test:distribution` — contracts + share-access (รวม quota)

### Admin (manual / QA)

- [x] ผู้มี `distribution:write` อัปโหลด APK + publish ได้  
- [x] ผู้มีแค่ `read` ดูได้แต่สร้าง/revoke ไม่ได้ (guard ด้วย permission)  
- [x] ผู้ไม่มีสิทธิ์เข้าเมนู/API ไม่ได้  
- [x] version+build ซ้ำถูกปฏิเสธ  
- [x] ไฟล์ไม่ใช่ `.apk` / platform ไม่ใช่ android ถูกปฏิเสธ  

### Share / Public (manual / QA)

- [x] สร้างลิงก์แล้วเปิด `/d/:token` ดาวน์โหลดได้ (flow implement ครบ)  
- [x] revoke / หมดอายุ / archive / quota ถูกปฏิเสธตาม error codes  
- [x] ไม่ใช้ release id เป็น secret ใน URL  

### File

- [x] อัปโหลดผ่าน chunk + เก็บบน S3 prefix `uploads/distribution/.../android/...`  
- [x] SHA-256 คำนวณตอนอัปโหลดและแสดงบนหน้า public  

---

## 12. Rollout

1. [x] Apply migrations `0003` / `0004`  
2. [x] `bun rbac:sync`  
3. [x] Seed แอปเริ่มต้น (`clickcraft`)  
4. [ ] Deploy Admin (production)  
5. [ ] ทดลองอัปโหลด internal build แล้วแชร์ลิงก์ในทีมก่อนส่งลูกค้า  

ไม่ต้องเปลี่ยน Website  
ไม่ต้องสมัคร Apple Developer เพื่อใช้ Android distribution

---

## 13. Decisions (ปิดแล้วในรอบนี้)

| # | คำถาม | ค่าที่เลือก |
|---|--------|-------------|
| 1 | Default อายุลิงก์ | 7 วัน (เลือก 1/7/30 ได้ตอนสร้าง) |
| 2 | เก็บ token | plain ใน DB |
| 3 | จำนวนแอป | seed 1 แอป + UI สร้างเพิ่มได้ (B2) |
| 4 | แก้ metadata หลัง publish | แก้ changelog ได้ |
| 5 | โดเมนหน้า public | `/d/:token` บน Admin host |
| 6 | schema เผื่อ ios | คอลัมน์ platform เป็น text; API/UI รับแค่ android |
| 7 | แนวทาง iOS อนาคต | **TestFlight ก่อน** — OTA optional |

---

## 14. สรุปสั้นๆ

โมดูล **`distribution`** ใน Admin พร้อมใช้งานสำหรับ **Android**: เก็บ APK บน S3, จัดการด้วย RBAC, แจกด้วย **share token + `/d/:token`**, พร้อม quota / QR / หลายแอป / checksum  

งานที่เหลือในแผนนี้มีแค่ **Phase iOS** (ดู [`p2-ios-distribution-plan.md`](./p2-ios-distribution-plan.md)) และ rollout ขึ้น production
)
