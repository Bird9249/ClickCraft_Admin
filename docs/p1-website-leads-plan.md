# แผน Implement P1 — Website Quotation Leads (Inbox)

**โปรเจกต์:** ClickCraft (Website + Admin)  
**แนวทาง:** **A — Lead inbox ก่อน** (ไม่สร้าง QT การเงินทันทีจาก anonymous)  
**เป้าหมาย:** เมื่อผู้ใช้กดขอใบเสนอราคาบน Website ให้บันทึกคำขอเข้า Admin และติดตามว่าทีมติดต่อแล้วหรือยัง  
**สถานะแผน:** Implemented (MVP)  
**อัปเดต:** 2026-07-22

## Implementation status

- [x] Phase A Foundation
- [x] Phase B Public ingest + Website submit (fail-open)
- [x] Phase C Admin inbox
- [x] Phase D Convert to customer + QT draft
- [x] Phase E Dashboard + seed + test
- Commands: `bun run db:seed:leads`, `bun test:leads`, `bun rbac:sync`
- Website env: `VITE_ADMIN_API_URL=http://localhost:3000/api`

**อ้างอิง:** `docs/p0-finance-mvp-plan.md` (§14 P1 CRM), Website `quotation-dialog.tsx`

---

## 1. เป้าหมายและขอบเขต

### 1.1 เป้าหมายธุรกิจ

ให้ทีม ClickCraft สามารถ:

1. รับคำขอใบเสนอราคาจาก Website โดยอัตโนมัติ (ไม่พึ่งแค่ PDF ที่พิมพ์ฝั่ง client)
2. เห็นรายการ lead ใน Admin พร้อมข้อมูลติดต่อ + แพ็กเกจที่สนใจ
3. มาร์กว่า **ยังไม่ติดต่อ / ติดต่อแล้ว / ปิดดีล** ได้
4. เมื่อพร้อมแล้ว **แปลง lead → ลูกค้า + ใบเสนอราคา (draft)** ในระบบการเงินจริง

### 1.2 ทำไมไม่สร้าง QT ทันที (สรุปการตัดสินใจ)

| เหตุผล | รายละเอียด |
|--------|------------|
| คนละโดเมน | “ติดต่อแล้วหรือยัง” เป็น CRM ไม่ใช่สถานะเอกสาร QT (`draft/sent/accepted`) |
| คุณภาพข้อมูล | คำขอจากเว็บมักยังไม่พร้อมออกเลข QT จริง |
| Spam / ซ้ำ | Lead แยกช่วย rate-limit และรวมเบอร์ซ้ำก่อนสร้างลูกค้า |
| เลขเอกสาร | Admin ใช้ sequence จริง — ไม่ควรให้ anonymous กินเลข QT |

PDF ที่พิมพ์บน Website ยังใช้เป็น **เอกสารประมาณการสำหรับลูกค้า** ได้; เอกสารทางการออกจาก Admin หลังแปลง lead

### 1.3 ในขอบเขต (In scope)

| รายการ | รายละเอียด |
|--------|------------|
| Lead entity | เก็บคำขอจากเว็บ + สถานะติดต่อ |
| Public API | `POST` รับคำขอจาก Website (ไม่ต้อง login) |
| Admin inbox | รายการ / รายละเอียด / เปลี่ยนสถานะ / โน้ต |
| Convert | สร้าง Customer + Quotation draft จาก lead |
| Website bridge | หลัง validate ฟอร์ม → บันทึก lead แล้วค่อยพิมพ์ PDF |
| Permissions | `leads:read`, `leads:update`, `leads:convert` (และ sync RBAC) |
| Dashboard (ขั้นต่ำ) | การ์ดหรือ badge จำนวน lead `new` |

### 1.4 นอกขอบเขต (Out of scope — เฟสถัดไป)

- Full CRM pipeline / kanban หลายสเตจซับซ้อน
- Auto-assign owner / SLA timer
- Email/WhatsApp อัตโนมัติจากระบบ
- Captcha ภายนอก (เช่น Turnstile) — วางเป็น optional hardening
- CMS จัดการ preset บน Admin (ยังอ่านจาก Website constants)
- Portal ให้ลูกค้า login ดู QT เอง
- แทนที่ PDF ฝั่ง Website ด้วยเลข QT จาก Admin ในรอบนี้

### 1.5 นิยาม Done

- [x] กดขอใบเสนอราคาบน Website แล้วมีแถว lead ใน Admin
- [x] Admin มาร์ค `contacted` / `lost` / ใส่โน้ตได้
- [x] แปลง lead → Customer + Quotation draft ได้ (lines จากฟีเจอร์ที่เลือก)
- [x] Public API ไม่ต้อง login แต่มีกัน spam ขั้นต่ำ
- [x] ผู้ไม่มีสิทธิ์ `leads:*` เข้าเมนู/API ไม่ได้
- [x] PDF บน Website ยังพิมพ์ได้แม้ API ล้ม (fail-open ตาม §9)

---

## 2. สถานะปัจจุบันที่เกี่ยวข้อง

| ส่วน | สถานะ | ใช้ต่ออย่างไร |
|------|--------|----------------|
| Website quotation dialog | มี — กรอกแล้ว `printQuotation()` อย่างเดียว | เพิ่มเรียก public API ก่อนพิมพ์ |
| Website presets | `presets-data.ts` (hotel, etc.) | ส่ง `presetId`, phase, selected features |
| Admin customers | CRUD พร้อม | ใช้ตอน convert |
| Admin quotations | lifecycle + PDF + `sourcePresetId` ใน schema | สร้าง draft ตอน convert; wire `sourcePresetId` |
| Admin dashboard | สรุปการเงินจริงแล้ว | เพิ่มจำนวน lead ใหม่ |
| Auth / RBAC | มี | เพิ่ม permissions `leads:*` |
| Public API | มีแค่ health (โดยรวม) | เพิ่ม endpoint แยก ไม่ใช้ `/quotations` |
| CORS | `CORS_ORIGIN` | ต้องรวม origin ของ Website |

**Pattern โมดูล Admin:**  
`src/modules/<name>/{api,domain,presentation}` เหมือน `customers` / `finance`

---

## 3. Domain Model

### 3.1 Entity: `quotation_lead` (ชื่อตารางแนะนำ)

```
QuotationLead
  - id
  - status: new | contacted | qualified | converted | lost
  - companyName
  - contactName
  - phone
  - email?                 (optional — ฟอร์มเว็บยังไม่มี; เผื่อขยาย)
  - addressText            (ดิบจากฟอร์ม)
  - addressHouse?
  - addressCity?
  - addressProvince?
  - presetId               (เช่น "hotel")
  - presetName?            (snapshot ตอน submit)
  - phaseIndex             (0-based หรือ 1-based — ล็อกใน contracts)
  - phaseLabel?            (snapshot)
  - selectedFeatures       jsonb  [{ key, label, phaseNumber, phaseLabel, priceLak }]
  - estimatedSubtotal      integer (LAK)
  - currency               default "LAK"
  - source                 default "website"
  - sourceUrl?             (page URL / share link)
  - clientMeta?            jsonb  { userAgent?, locale? } — ไม่เก็บ IP ถาวรถ้าไม่จำเป็น
  - notes?                 (โน้ตทีม)
  - contactedAt?
  - contactedBy?           → user.id
  - convertedAt?
  - convertedBy?           → user.id
  - customerId?            → customer.id (หลัง convert)
  - quotationId?           → quotation.id (หลัง convert)
  - createdAt, updatedAt
```

**ไม่ soft-delete ใน MVP** — ใช้สถานะ `lost` แทนการลบ (หรือเพิ่ม `archived` ภายหลัง)

### 3.2 สถานะติดต่อ (CRM) — คนละชุดกับ QT

| Status | ความหมาย | UI หลัก |
|--------|----------|---------|
| `new` | เพิ่งเข้าจากเว็บ ยังไม่แตะ | Inbox หลัก / badge |
| `contacted` | ทัก/โทร/ไลน์ แล้ว | ปุ่มมาร์คว่าติดต่อแล้ว |
| `qualified` | น่าสนใจ รอออก QT | optional ก่อน convert |
| `converted` | สร้างลูกค้า + QT แล้ว | อ่านอย่างเดียว + ลิงก์ไป QT |
| `lost` | ไม่ไปต่อ | ปิดจาก inbox |

**Transition ที่อนุญาต (MVP):**

```
new → contacted | qualified | lost | converted
contacted → qualified | lost | converted
qualified → lost | converted
converted → (terminal)
lost → contacted | qualified   (เปิดใหม่ได้ถ้าลูกค้ากลับมา)
```

### 3.3 ความสัมพันธ์หลัง convert

```
QuotationLead (converted)
  ├─ customerId  → Customer
  └─ quotationId → Quotation (status = draft, sourcePresetId = presetId)
```

Lead **ไม่ถูกลบ** หลัง convert — เก็บประวัติว่ามาจากเว็บ

---

## 4. API Design

### 4.1 Public (Website → Admin) — ไม่ต้อง session

| Method | Path | รายละเอียด |
|--------|------|------------|
| `POST` | `/api/public/quotation-leads` | สร้าง lead จากเว็บ |

**ข้อบังคับความปลอดภัย**

- อย่าใช้ `/api/quotations` หรือ permission `finance:write` กับ anonymous
- แยก router / prefix `/public/*`
- Rate limit ขั้นต่ำ: per IP หรือ per phone (เช่น 5 ครั้ง / ชั่วโมง)
- Honeypot field (เช่น `website` ว่าง — ถ้ามีค่าให้ 204 โดยไม่บันทึก)
- Payload size limit + Zod validate เข้ม
- CORS: อนุญาต origin Website เท่านั้นสำหรับ `/public/*` (หรือรวมใน `CORS_ORIGIN` แบบ list)
- Optional ภายหลัง: shared secret header จาก Website server proxy (ถ้าไม่ยิงตรงจาก browser)

**Request body (ร่าง)**

```ts
{
  companyName: string
  contactName: string
  phone: string
  addressText: string
  addressHouse?: string
  addressCity?: string
  addressProvince?: string
  presetId: string
  presetName?: string
  phaseIndex: number
  phaseLabel?: string
  selectedFeatures: Array<{
    key: string
    label: string
    phaseNumber: number
    phaseLabel: string
    priceLak: number
  }>
  estimatedSubtotal: number
  currency?: "LAK"
  sourceUrl?: string
  // honeypot
  website?: string
}
```

**Response**

```ts
{ id: string; status: "new" }
```

ไม่คืนข้อมูลภายในเกินจำเป็น

### 4.2 Admin (authenticated + RBAC)

| Method | Path | Permission | รายละเอียด |
|--------|------|------------|------------|
| `GET` | `/api/leads` | `leads:read` | list + filter status/q |
| `GET` | `/api/leads/:id` | `leads:read` | detail |
| `PATCH` | `/api/leads/:id` | `leads:update` | notes, status (ยกเว้น convert) |
| `POST` | `/api/leads/:id/contacted` | `leads:update` | ตั้ง `contacted` + `contactedAt/By` |
| `POST` | `/api/leads/:id/lost` | `leads:update` | ตั้ง `lost` |
| `POST` | `/api/leads/:id/convert` | `leads:convert` | สร้าง customer + QT draft |

**Convert behavior**

1. ถ้า `status === converted` → 409  
2. Match ลูกค้าเดิมด้วย `phone` (normalize) ถ้าพบให้ reuse; ไม่พบให้สร้าง Customer ใหม่  
3. สร้าง Quotation `draft` + lines จาก `selectedFeatures`  
4. ตั้ง `sourcePresetId`, notes อ้างอิง lead  
5. อัปเดต lead → `converted` + ids  
6. (แนะนำ) `appendAudit` events

---

## 5. Permissions

เพิ่มใน `permissions.ts`:

```ts
leads: {
  read: "leads:read",
  update: "leads:update",
  convert: "leads:convert",
}
```

| Permission | ใช้กับ |
|------------|--------|
| `leads:read` | ดูรายการ/รายละเอียด + badge dashboard |
| `leads:update` | เปลี่ยนสถานะติดต่อ, โน้ต, lost |
| `leads:convert` | แปลงเป็นลูกค้า + QT |

หลังเพิ่ม: รัน `bun rbac:sync` และใส่สิทธิ์ให้ role ที่ทีมใช้จริง (เช่น Admin / Sales)

Sidebar: กลุ่มใหม่หรือใต้การเงิน — แนะนำกลุ่ม **CRM** หรือรายการใต้ **ລູກຄ້າ** ชื่อ **ຄຳຂໍໃບສະເໜີລາຄາ** / **Leads**

---

## 6. Website Integration

### 6.1 จุดแก้

| ไฟล์ | การเปลี่ยนแปลง |
|------|----------------|
| `Website/src/components/landing/quotation-dialog.tsx` | หลัง validate → `POST` lead → แล้ว `printQuotation` |
| `Website/src/utils/quotation-leads.ts` (ใหม่) | client helper ยิง API + env base URL |
| `.env` Website | `VITE_ADMIN_API_URL` หรือ `VITE_LEADS_API_URL` |

### 6.2 UX ตอน submit

1. Validate ฟอร์มเหมือนเดิม  
2. Disable ปุ่ม + แสดง loading  
3. `POST /api/public/quotation-leads`  
4. สำเร็จ → ปิด dialog → พิมพ์ PDF  
5. ล้มเหลว → ดู §9 (แนะนำ: เตือนแต่ยังพิมพ์ PDF ได้ — fail-open รอบแรก)

### 6.3 ข้อมูลที่ส่งเพิ่มจาก dialog

นอกจากฟอร์มลูกค้า ส่งจาก props ที่มีอยู่แล้ว:

- `preset.id`, `preset.name`
- `selectedPhase` index + label
- `selectedFeatures` + ราคา
- `estimatedSubtotal` จาก `calculateQuotationSubtotal`
- `sourceUrl`: `window.location.href`

---

## 7. Admin UI

### 7.1 หน้าหลัก — Leads list

- Filter: status, ค้นหาชื่อ/เบอร์
- คอลัมน์: วันที่, บริษัท, ผู้ติดต่อ, เบอร์, preset/phase, ยอดประมาณ, สถานะ
- Row action: เปิดรายละเอียด, มาร์คติดต่อแล้ว, แปลง, lost

### 7.2 หน้ารายละเอียด

- ข้อมูลติดต่อ + ที่อยู่
- รายการฟีเจอร์ที่เลือก + ยอดประมาณ
- Timeline สั้นๆ: created / contacted / converted
- ฟอร์มโน้ตทีม
- ปุ่ม: ติดต่อแล้ว · แปลงเป็นลูกค้า+QT · ปิด (lost)
- ถ้า converted: ลิงก์ไป Customer / Quotation

### 7.3 Dashboard

เพิ่มใน `GET /dashboard/summary` (หรือ field ใหม่):

- `newLeadsCount`
- (optional) รายการ lead ล่าสุด 5 รายการ

การ์ด: **Lead ໃໝ່** คลิกไป `/app/leads?status=new`

---

## 8. Mapping: Lead → Customer + Quotation

| Lead | Customer | Quotation |
|------|----------|-----------|
| companyName | name, type=`company` | — |
| contactName | notes หรือ nameLocal ชั่วคราว (`ຜູ້ຕິດຕໍ່: …`) | internalNotes |
| phone | phone (+ whatsapp ถ้ารูปแบบมือถือ) | — |
| address* | address (รวมเป็นหนึ่งสตริง) | — |
| selectedFeatures | — | lines[] description/qty/unitPrice/amount |
| estimatedSubtotal | — | คำนวณใหม่ด้วย `computeTotals` ฝั่ง service |
| presetId | — | sourcePresetId |
| — | — | status=`draft`, paymentSchedule default |

**Normalize เบอร์** ก่อน match: ตัดช่องว่าง/ขีด; ถ้าซ้ำให้ reuse customer

---

## 9. กฎธุรกิจที่ต้องล็อกก่อนลงมือ

| # | กฎ | ค่าเริ่มต้นที่แนะนำ |
|---|----|---------------------|
| 1 | PDF เว็บเมื่อ API ล้ม | **Fail-open**: เตือน + ยังพิมพ์ได้ (ไม่เสีย conversion บนเว็บ) |
| 2 | สร้าง QT ตอนไหน | เฉพาะตอน **convert** ใน Admin |
| 3 | สถานะติดต่อขั้นต่ำ | `new` / `contacted` / `converted` / `lost` (`qualified` optional) |
| 4 | ลูกค้าซ้ำ | match `phone` ก่อนสร้างใหม่ |
| 5 | แก้ lead หลัง converted | ห้ามแก้ฟิลด์จากเว็บ; แก้ได้แค่ notes |
| 6 | ภาษา UI Admin | ลาวเป็นหลัก |
| 7 | สกุลเงิน | LAK |
| 8 | เก็บ IP | ไม่เก็บใน MVP (ลดภาระ PDPA); ใช้ rate-limit ที่ layer ชั่วคราวได้ |

---

## 10. โครงสร้างไฟล์ที่คาดหวัง

### Admin

```
src/server/platform/db/schema/leads.ts
src/modules/leads/
  api/index.ts
  domain/
    contracts.ts
    http/
      leads.routes.ts          # admin CRUD/actions
      public-leads.routes.ts   # POST public
    repo/
      create.ts
      list.ts
      get-by-id.ts
      update.ts
    service/
      create-from-website.ts
      mark-contacted.ts
      convert.ts
  presentation/
    api/client.ts
    api/queries.ts
    pages/LeadsPage.tsx
    pages/LeadDetailPage.tsx
    ui/LeadsTable.tsx
    ui/LeadsFilter.tsx
    ui/LeadStatusBadge.tsx
    ui/ConvertLeadDialog.tsx
```

ลงทะเบียน:

- `createRestRoutes()` → `leadsRoutes` + `publicLeadsRoutes`
- `router.tsx` + `sidebar-data.tsx` + `route-meta.ts`
- `permissions.ts` + `rbac:sync`

### Website

```
src/utils/quotation-leads.ts
src/components/landing/quotation-dialog.tsx  # wire submit
```

---

## 11. เฟสงานและลำดับ PR

### Phase A — Foundation (½ วัน)

1. [ ] Schema `quotation_lead` + `db:push`
2. [ ] Permissions `leads:*` + sync
3. [ ] Contracts + repo list/get/create

### Phase B — Public ingest (½–1 วัน)

1. [ ] `POST /api/public/quotation-leads` + honeypot + rate limit ขั้นต่ำ
2. [ ] CORS / env สำหรับ Website origin
3. [ ] Website: helper + ต่อ `quotation-dialog`
4. [ ] ทดสอบมือ: submit จากเว็บ → เห็นแถวใน DB

### Phase C — Admin inbox (1 วัน)

1. [ ] List + filter + detail
2. [ ] Mark contacted / lost + notes
3. [ ] Sidebar + route meta + empty states

### Phase D — Convert (1 วัน)

1. [ ] Service convert → customer + QT draft + lines
2. [ ] Wire `sourcePresetId`
3. [ ] UI ยืนยันก่อนแปลง + ลิงก์ไปเอกสาร
4. [ ] กัน convert ซ้ำ (409)

### Phase E — Polish (½ วัน)

1. [ ] Dashboard `newLeadsCount`
2. [ ] Seed demo lead 2–3 รายการ
3. [ ] Test: create public + convert flow (integration อย่างน้อย 1 เคส)
4. [ ] (Optional) audit events

**รวมประมาณ:** ≈ 3.5–5 วันทำงาน

### ลำดับ PR ที่แนะนำ

1. `feat(leads): schema + permissions + public ingest`  
2. `feat(website): submit quotation request to admin`  
3. `feat(leads): admin inbox + contact status`  
4. `feat(leads): convert to customer + quotation draft`  
5. `chore(leads): dashboard badge, seed, tests`

---

## 12. การทดสอบ

| เคส | คาดหวัง |
|-----|---------|
| Happy path เว็บ | submit → lead `new` → PDF ยังพิมพ์ได้ |
| Honeypot | field ปลอมมีค่า → ไม่สร้าง lead |
| Rate limit | ยิงถี่เกิน → 429 |
| Mark contacted | status + contactedAt/By ถูกต้อง |
| Convert | ได้ customer + QT draft + lead.converted |
| Convert ซ้ำ | 409 |
| Reuse phone | ลูกค้าเดิมถูก reuse |
| RBAC | ไม่มี `leads:read` เข้าเมนูไม่ได้ |
| Public ไม่สร้าง QT | หลัง ingest อย่างเดียวยังไม่มีแถว quotation |

คำสั่งแนะนำ: `bun test` เฉพาะโมดูล leads (สร้างคู่กับ finance tests)

---

## 13. ความเสี่ยงและทางลดเสี่ยง

| ความเสี่ยง | ผลกระทบ | ทางลดเสี่ยง |
|------------|----------|-------------|
| Spam จาก public API | Inbox รก | honeypot + rate limit + ปิด origin |
| CORS / env ผิด | เว็บบันทึกไม่ได้ | fail-open + log; checklist deploy |
| ฟีเจอร์/ราคาบนเว็บเปลี่ยน | lead เก่าเทียบยาก | snapshot features + ราคาตอน submit |
| เบอร์ซ้ำหลายรูปแบบ | ลูกค้าซ้ำ | normalize phone |
| ทีมสับสน QT เว็บ vs QT Admin | ลูกค้าถือเอกสารคนละเลข | ข้อความบน PDF เว็บว่าเป็นประมาณการ (optional copy tweak) |

---

## 14. Checklist เริ่มงานวันแรก

- [ ] Confirm กฎ §9 กับ stakeholder (โดยเฉพาะ fail-open และสถานะที่มีใน MVP)
- [ ] เพิ่ม schema + permissions ใน Admin
- [ ] ตั้ง env Website → Admin public API URL
- [ ] ทำให้ ingest ทำงานก่อน (แม้ UI Admin ยังหยาบ)
- [ ] ค่อยทำ inbox + convert ตาม Phase C–D

---

## 15. สิ่งที่ตั้งใจไม่ทำในรอบนี้

- สร้าง Invoice/Receipt จาก lead โดยตรง  
- Sync เลข QT กลับไปพิมพ์บน Website  
- แจ้งเตือน real-time (WebSocket / LINE notify) — ทำทีหลังได้  
- ย้าย presets ขึ้น CMS  

---

**เจ้าของแผน:** ClickCraft  
**แนวทางที่เลือก:** A — Lead inbox ก่อน แล้วแปลงเป็นลูกค้า/QT เมื่อทีมพร้อม  
**ขั้นถัดไปหลัง P1:** แจ้งเตือนเมื่อมี lead ใหม่, captcha, CMS presets, sync PDF เลขจริง
