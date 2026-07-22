# แผน Implement P0 — Finance Documents (MVP)

**โปรเจกต์:** ClickCraft Admin  
**เป้าหมาย:** จัดการเอกสารการเงินขั้นต่ำให้สตูดิโอใช้งานจริงได้  
**สถานะแผน:** Implemented (MVP + demo seed + tests)  
**อัปเดต:** 2026-07-22

---

## 1. เป้าหมายและขอบเขต

### 1.1 เป้าหมายธุรกิจ

ให้ทีม ClickCraft สามารถ:

1. เก็บข้อมูลลูกค้าขั้นต่ำ
2. ออกและเก็บ **ใบเสนอราคา (Quotation)**
3. แตก **ใบแจ้งหนี้ (Invoice)** ตามงวดชำระ
4. บันทึกการรับเงินและออก **ใบเสร็จ (Receipt)**
5. พิมพ์/ดาวน์โหลด PDF ตามแบรนด์ ClickCraft
6. ควบคุมสิทธิ์ผ่าน RBAC และมี audit trail

### 1.2 ในขอบเขต (In scope)

| รายการ | รายละเอียด |
|--------|------------|
| Customers | CRUD ลูกค้า (บริษัท/บุคคล) |
| Quotation | สร้าง / แก้ / คัดลอก / เปลี่ยนสถานะ / PDF |
| Invoice | สร้างจาก quotation (งวด) หรือ manual / PDF |
| Receipt | สร้างเมื่อบันทึกชำระเงิน / PDF |
| Payments | บันทึกยอดรับ ผูก invoice |
| Document numbering | เลขรันจริง `QT-` / `INV-` / `RC-` |
| Permissions | `customers:*`, `finance:*` |
| UI | รายการ + ฟอร์ม + รายละเอียดเอกสาร ใน Admin sidebar |

### 1.3 นอกขอบเขต (Out of scope — เฟสถัดไป)

- บัญชีคู่ / งบการเงิน
- เชื่อมธนาคารอัตโนมัติ
- e-tax / e-invoice ราชการ
- ใบส่งมอบ / ใบตรวจรับ / สัญญาเต็มรูปแบบ
- CRM lead inbox / CMS เว็บ
- Portal ให้ลูกค้า login เอง
- Multi-currency (MVP ใช้ **LAK** เป็นหลัก; เก็บ currency field เผื่ออนาคต)
- Sync อัตโนมัติกับ quotation dialog บน Website (ทำภายหลังได้)

### 1.4 นิยาม Done ของ MVP

- [x] สร้างลูกค้าได้
- [x] สร้างใบเสนอราคา → ส่ง (sent) → รับ (accepted) ได้
- [x] สร้าง invoice จาก quotation ตามงวด 40/30/30 ได้
- [x] บันทึกชำระเงิน → ออกใบเสร็จได้
- [x] ดาวน์โหลด PDF ของ QT / INV / RC ได้ (HTML print-ready)
- [x] ผู้ไม่มีสิทธิ์เข้าเมนู/API ไม่ได้ (RBAC)
- [ ] การออก/void/รับชำระถูกเขียน audit log (ยังไม่ wire `appendAudit` — follow-up)

---

## 2. สถานะปัจจุบันที่เกี่ยวข้อง

| ส่วน | สถานะ | ใช้ต่ออย่างไร |
|------|--------|----------------|
| Auth + session | มี (Better Auth) | ใช้ login เดิม |
| RBAC | มี (`users:*`, `audit:read`) | เพิ่ม permissions ใหม่ + `rbac:sync` |
| Audit | มี | ยิง event เมื่อออก/แก้สถานะเอกสาร |
| Upload / S3 | มี | เก็บ PDF snapshot (optional ใน MVP; อย่างน้อย generate on-demand) |
| Website quotation | มี template ฝั่ง client | อ้างอิง layout/ข้อความ; **อย่าพึ่ง random doc id** |
| Dashboard | mock โรงแรม | ยังไม่แตะใน P0 (หรือใส่ stat การเงินง่ายๆ ท้ายเฟสถ้าเหลือเวลา) |

**Pattern โมดูลที่ต้องตาม:**  
`src/modules/<name>/{api,domain,presentation}` เหมือน `users` / `roles`

---

## 3. Domain Model

### 3.1 Entities

```
Customer
  - id, type (company|individual)
  - name, nameLocal?
  - email?, phone?, whatsapp?
  - address?, taxId?
  - notes?
  - createdAt, updatedAt, deletedAt?

Document (polymorphic header หรือแยกตารางก็ได้ — แนะนำแยกตารางชัดเจน)
  Quotation / Invoice / Receipt

Quotation
  - id, number (unique), status
  - customerId
  - issueDate, validUntil?
  - currency (default LAK)
  - subtotal, taxAmount, total
  - taxNote (เช่น VAT 0%)
  - notes?, internalNotes?
  - sourcePresetId? (string optional — อ้างอิง preset บนเว็บ)
  - createdBy, createdAt, updatedAt

QuotationLine
  - id, quotationId, sortOrder
  - description, quantity, unitPrice, amount
  - meta? (json)

Invoice
  - id, number, status
  - customerId, quotationId?
  - issueDate, dueDate?
  - milestoneLabel? (เช่น "งวดที่ 1 — 40%")
  - currency, subtotal, taxAmount, total
  - amountPaid (denormalized), notes?
  - createdBy, timestamps

InvoiceLine
  - เหมือน QuotationLine

Payment
  - id, invoiceId
  - amount, paidAt
  - method (cash|transfer|other)
  - reference? (เลขอ้างอิงโอน)
  - notes?, createdBy, createdAt

Receipt
  - id, number, status
  - customerId, invoiceId, paymentId
  - issueDate, amount, currency
  - notes?, createdBy, timestamps

DocumentSequence
  - docType (quotation|invoice|receipt)
  - yearMonth (YYYYMM) หรือ year
  - lastValue
  - unique(docType, yearMonth)
```

### 3.2 สถานะเอกสาร

**Quotation**

```
draft → sent → accepted
              ↘ rejected
draft / sent → void / cancelled
```

กฎสำคัญ:

- แก้ line items ได้เฉพาะ `draft`
- `accepted` แล้วจึงอนุญาตสร้าง invoice จาก quotation ได้ (หรืออนุญาตจาก `sent` ก็ได้ — **แนะนำ: จาก accepted เป็นหลัก**, จาก sent ได้แบบยืนยัน)
- `void` ไม่ลบประวัติ; ห้ามใช้เลขซ้ำ

**Invoice**

```
draft → issued → partial → paid
issued / partial → void
```

- `amountPaid` อัปเดตจากผลรวม Payment
- เมื่อ `amountPaid >= total` → `paid`
- เมื่อ `0 < amountPaid < total` → `partial`

**Receipt**

```
issued (default) → void
```

- สร้างอัตโนมัติเมื่อบันทึก Payment (MVP)
- 1 payment = 1 receipt

### 3.3 เลขเอกสาร

รูปแบบให้สอดคล้องเว็บ:

| ประเภท | รูปแบบ | ตัวอย่าง |
|--------|--------|---------|
| Quotation | `QT-YYYYMM###` | `QT-202607001` |
| Invoice | `INV-YYYYMM###` | `INV-202607001` |
| Receipt | `RC-YYYYMM###` | `RC-202607001` |

- ใช้ตาราง `document_sequences` + transaction / row lock
- ออกเลขตอนเปลี่ยนสถานะเป็น `sent`/`issued` (หรือตอนสร้างถ้าต้องการเลขทันที — **แนะนำออกเลขตอน issue/sent** เพื่อไม่ไหม้เลขตอน draft ทิ้ง)
- MVP ทางเลือกง่าย: ออกเลขตอนสร้างเอกสารเลยก็ได้ ถ้าง่ายกว่า — แต่ต้องไม่สุ่มแบบเว็บ

**ตัดสินใจที่แนะนำสำหรับ MVP:** ออกเลขตอนสร้างเอกสาร (ง่ายต่อ UX) และห้ามลบ physical; ใช้ `void` แทน

---

## 4. Permissions

เพิ่มใน `permissions.ts` แล้วรัน `bun rbac:sync`

```ts
customers: {
  create: "customers:create",
  read: "customers:read",
  update: "customers:update",
  delete: "customers:delete",
},
finance: {
  read: "finance:read",
  write: "finance:write",   // สร้าง/แก้ draft
  issue: "finance:issue",   // sent / issued / รับชำระ
  void: "finance:void",
},
```

| การกระทำ | สิทธิ์ที่ต้องใช้ |
|----------|------------------|
| ดูลูกค้า/เอกสาร | `customers:read` / `finance:read` |
| สร้าง/แก้ draft | `customers:write*` / `finance:write` |
| ส่ง QT / ออก INV / บันทึกชำระ | `finance:issue` |
| void เอกสาร | `finance:void` |

\* ใช้ `customers:create|update|delete` แยกตาม action เหมือน users

Labels UI (ลาว) เพิ่มใน `RESOURCE_LABELS` / `ACTION_LABELS` เช่น  
`customers` → ລູກຄ້າ, `finance` → ການເງິນ, `issue` → ອອກເອກະສານ, `void` → ຍົກເລີກ

---

## 5. API Design (ร่าง)

Base: `/api/...` ตามรูปแบบ Elysia เดิม

### Customers

| Method | Path | Permission |
|--------|------|------------|
| GET | `/customers` | `customers:read` |
| GET | `/customers/:id` | `customers:read` |
| POST | `/customers` | `customers:create` |
| PATCH | `/customers/:id` | `customers:update` |
| DELETE | `/customers/:id` | `customers:delete` (soft delete แนะนำ) |

### Quotations

| Method | Path | Permission |
|--------|------|------------|
| GET | `/quotations` | `finance:read` |
| GET | `/quotations/:id` | `finance:read` |
| POST | `/quotations` | `finance:write` |
| PATCH | `/quotations/:id` | `finance:write` (draft only) |
| POST | `/quotations/:id/send` | `finance:issue` |
| POST | `/quotations/:id/accept` | `finance:issue` |
| POST | `/quotations/:id/reject` | `finance:issue` |
| POST | `/quotations/:id/void` | `finance:void` |
| POST | `/quotations/:id/duplicate` | `finance:write` |
| GET | `/quotations/:id/pdf` | `finance:read` |
| POST | `/quotations/:id/invoices` | `finance:write` + `finance:issue` (สร้างงวดจาก QT) |

### Invoices

| Method | Path | Permission |
|--------|------|------------|
| GET | `/invoices` | `finance:read` |
| GET | `/invoices/:id` | `finance:read` |
| POST | `/invoices` | `finance:write` |
| PATCH | `/invoices/:id` | `finance:write` (draft only) |
| POST | `/invoices/:id/issue` | `finance:issue` |
| POST | `/invoices/:id/void` | `finance:void` |
| POST | `/invoices/:id/payments` | `finance:issue` |
| GET | `/invoices/:id/pdf` | `finance:read` |

### Receipts

| Method | Path | Permission |
|--------|------|------------|
| GET | `/receipts` | `finance:read` |
| GET | `/receipts/:id` | `finance:read` |
| GET | `/receipts/:id/pdf` | `finance:read` |
| POST | `/receipts/:id/void` | `finance:void` |

> Payment สร้างผ่าน `POST /invoices/:id/payments` แล้วระบบสร้าง Receipt ให้

---

## 6. โครงสร้างโฟลเดอร์ (ตาม convention โปรเจกต์)

```
src/modules/customers/
  api/
  domain/
    contracts.ts
    http/
    repo/
    service/
  presentation/
    api/
    pages/
    ui/

src/modules/finance/
  api/
  domain/
    contracts/
    http/
    repo/
    service/          # quotation, invoice, payment, sequence, pdf
  presentation/
    api/
    pages/
    ui/
```

ทางเลือก: รวม customers ไว้ใต้ `finance/customers`  
**แนะนำแยก `customers` module** เพราะ P1 CRM จะใช้ซ้ำ

Wire:

- `src/server/api/rest/index.ts`
- `src/server/platform/db/schema/` + migrate
- `src/app/router.tsx`
- `src/app/layout/data/sidebar-data.tsx`
- `permissions.ts` + `bun rbac:sync`

---

## 7. UI / UX (Admin)

### 7.1 Sidebar

กลุ่มใหม่ เช่น **ການເງິນ**:

- ລູກຄ້າ → `/app/customers`
- ໃບສະເໜີລາຄາ → `/app/quotations`
- ໃບເກັບເງິນ → `/app/invoices`
- ໃບເສັດ → `/app/receipts`

### 7.2 หน้าจอหลัก

1. **Customers list/form** — ตาราง + สร้าง/แก้
2. **Quotations list** — filter สถานะ/ลูกค้า/ช่วงวันที่
3. **Quotation detail/editor**
   - หัวเอกสาร + เลือกลูกค้า
   - ตาราง line items (เพิ่ม/ลบ/เรียง)
   - สรุปยอด
   - Actions: Save draft, Send, Accept, Reject, Void, Duplicate, Download PDF
   - ปุ่ม **สร้าง Invoice ตามงวด** (เมื่อ accepted)
4. **Invoices list + detail** — แสดงยอดค้าง, ปุ่มบันทึกชำระ
5. **Receipts list + detail** — อ่านเป็นหลัก + PDF + void

### 7.3 สร้าง Invoice จาก Quotation (MVP) ✅ เสร็จ

- [x] เก็บ `paymentSchedule` บน Quotation (แก้ได้ในฟอร์ม QT)
- [x] Dialog ตั้งค่างวด: % / label / เงื่อนไขการจ่าย / due date (ค่าเริ่มต้น 40/30/30 จาก Website)
- [x] สร้าง invoice หลายใบ; `milestoneLabel` + เงื่อนไขเก็บใน notes; PDF QT ใช้ schedule จริง

### 7.4 PDF ✅ เสร็จ (aligned with Website)

- [x] เรนเดอร์ HTML template ฝั่ง server (`domain/service/pdf.ts`)
- [x] endpoint `/:id/pdf` คืน HTML print-ready (เลขเอกสาร/ยอดจาก DB)
- [x] **layout ตรงกับ Website** `Website/src/utils/quotation.ts`:
  - logo + tagline + contact (WhatsApp / Facebook / Email)
  - info-grid (CLIENT INFO + Document No. / Issue Date / Validity)
  - ตาราง # / Description / Price, totals box, payment milestones (QT)
  - ลายเซ็น 2 ฝั่ง + ปุ่มพิมพ์ใน toolbar
  - ฟอนต์ Noto Sans Lao, โทน `#00A896` / `#1A1A1A` / `#F4F4F6`
- [x] โลโก้ฝังเป็น data URI จาก `src/assets/brand/logo-clickcraft-transparant.webp`

---

## 8. เฟสงาน Implement (เรียงลำดับ)

### Phase A — Foundation (½–1 วัน) ✅ เสร็จ

1. [x] ออกแบบ schema Drizzle + migration (`customers`, `finance` + `db:push`)
2. [x] เพิ่ม permissions + labels + `rbac:sync` (`customers:*`, `finance:*`)
3. [x] สร้าง module skeleton `customers` + `finance`
4. [x] เพิ่มเมนู sidebar กลุ่ม **ການເງິນ**

**Deliverable:** migrate ผ่าน, permission โผล่ในหน้า roles — **done**

### Phase B — Customers (½ วัน) ✅ เสร็จ

1. [x] contracts (zod) + repo + service + routes
2. [x] FE list/create/edit
3. [x] soft delete (ถ้าทำ)
4. [ ] audit: create/update/delete customer — follow-up (`appendAudit`)

**Deliverable:** CRUD ลูกค้าใช้งานได้ — **done**

### Phase C — Quotations (1–2 วัน) ✅ เสร็จ (audit ค้าง)

1. [x] sequence service (`QT-|INV-|RC-YYYYMM###`)
2. [x] quotation + lines CRUD (draft)
3. [x] transitions: send / accept / reject / void
4. [ ] duplicate — ยังไม่ทำ (optional)
5. [x] list + filters
6. [x] detail editor UI (รวมปุ่ม lifecycle)
7. [x] PDF endpoint ขั้นต่ำ (HTML print-ready)
8. [ ] audit events — follow-up

**Deliverable:** วงจร QT ครบ + PDF — **done**

### Phase D — Invoices + Payments + Receipts (1–2 วัน) ✅ เสร็จ (audit ค้าง)

1. [x] สร้าง invoice manual (draft → issue)
2. [x] สร้าง invoice จาก quotation (งวด 40/30/30)
3. [x] บันทึก payment → อัปเดตสถานะ invoice → สร้าง receipt
4. [x] void invoice/receipt (ย้อนยอดอย่างระวัง)
5. [x] list/detail + PDF
6. [ ] audit events — follow-up

**Deliverable:** วงจรเก็บเงินครบ QT → INV → Pay → RC — **done**

### Phase E — Polish (½–1 วัน) ✅ เสร็จส่วนหลัก

1. [x] empty states / validation ข้อความลาว (ขั้นต่ำในฟอร์ม)
2. [x] สิทธิ์ปุ่มตาม permission (`finance:issue` สำหรับ send/accept/pay)
3. [x] ทดสอบ happy path + partial payment (`bun test:finance` — 9 pass)
4. [x] การ์ดสรุปบน dashboard — `GET /dashboard/summary` + UI สตูดิโอ
5. [x] seed demo: `bun run db:seed:finance` (`seed-finance-demo.ts`)

---

## 9. กฎธุรกิจสำคัญ (ต้องล็อกก่อนลงมือ)

| # | กฎ | ค่าเริ่มต้นที่แนะนำ |
|---|----|---------------------|
| 1 | สกุลเงิน MVP | LAK |
| 2 | VAT | เก็บ `taxAmount` ได้; default 0 + โน้ต “VAT 0%” |
| 3 | แก้เอกสารหลัง issue | ไม่ได้ — ต้อง void แล้วสร้างใหม่ หรือ credit note (credit note = เฟสถัดไป) |
| 4 | ลบเอกสาร | ไม่ลบ — ใช้ void |
| 5 | Partial payment | รองรับ |
| 6 | 1 payment = 1 receipt | ใช่ |
| 7 | สร้าง INV จาก QT | ต้อง QT = accepted (default) |
| 8 | ภาษาเอกสาร | ลาวเป็นหลัก รอง EN ใน template ถ้ามีเวลา |

---

## 10. การทดสอบ (MVP)

**คำสั่ง:** `bun test:finance` (หรือ `bun test src/modules/finance`)  
**ผลล่าสุด (2026-07-22):** 9 pass / 0 fail

| ไฟล์ | ครอบคลุม |
|------|----------|
| `domain/service/totals.test.ts` | `computeTotals`, `lineAmount` |
| `domain/service/pdf.test.ts` | HTML QT / INV / RC + brand color |
| `domain/service/finance-flow.test.ts` | integration: QT→accept→INV 40/30/30→pay full/partial; ปฏิเสธ INV จาก QT ที่ยังไม่ accepted |

**Demo seed:** `bun run db:seed:finance`  
- ลูกค้า 2 ราย (marker `DEMO_SEED_P0_FINANCE`)  
- QT draft + accepted, INV 3 งวด, RC จากชำระบางส่วน  
- idempotent — รันซ้ำได้

### Happy path

1. [x] สร้างลูกค้า A  
2. [x] สร้าง QT draft → เพิ่ม 2–3 บรรทัด → Send → Accept  
3. [x] สร้าง INV 3 งวด (40/30/30)  
4. [x] ชำระงวด 1 เต็ม → ได้ RC → INV1 = paid  
5. [x] ชำระงวด 2 บางส่วน → INV2 = partial  
6. [x] ดาวน์โหลด PDF ทั้งสามประเภทได้ (unit + endpoint HTML)

### Negative / permission

- [ ] user มีแค่ `finance:read` กดสร้างไม่ได้ — ยังไม่มี automated test (RBAC มีในโค้ด)
- [x] แก้ QT ที่ accepted ไม่ได้ (`readOnly` UI + service)
- [x] ห้ามสร้าง INV จาก QT ที่ยังไม่ accepted (integration test)
- void invoice ที่มี payment — กำหนดชัด: **ห้าม void ถ้ามี payment** หรือต้อง void receipt/payment ก่อน (เลือกอย่างหลังถ้าต้องการความยืดหยุ่น; **MVP แนะนำห้าม void invoice ที่มี payment**)

---

## 11. ความเสี่ยงและทางเลือก

| ความเสี่ยง | ผลกระทบ | ทางลดเสี่ยง |
|------------|----------|-------------|
| PDF ซับซ้อนเกิน | ล่าช้า | เริ่มจาก HTML print ก่อน แล้วค่อย PDF lib |
| Sequence race | เลขซ้ำ | transaction + unique constraint |
| รวม customers เข้า finance | ยากตอนทำ CRM | แยก module ตั้งแต่ต้น |
| พยายามดึง preset จาก Website DB | ไม่มี CMS | ใส่ line มือ หรือ hardcode helper อ่านจาก constants ชั่วคราว |

---

## 12. ประมาณการเวลา (คร่าวๆ)

| ช่วง | เวลา |
|------|------|
| A Foundation | 0.5–1 วัน |
| B Customers | 0.5 วัน |
| C Quotations | 1–2 วัน |
| D Invoices/Payments/Receipts | 1–2 วัน |
| E Polish | 0.5–1 วัน |
| **รวม** | **≈ 4–6 วันทำงาน** |

---

## 13. ลำดับ PR ที่แนะนำ

1. `feat(finance): schema + permissions for P0 documents`  
2. `feat(customers): CRUD module`  
3. `feat(finance): quotations lifecycle + PDF`  
4. `feat(finance): invoices, payments, receipts`  
5. `chore(finance): sidebar, polish, audit coverage`

---

## 14. ขั้นตอนถัดไปหลัง P0

- P1 CRM: lead จากเว็บ/WhatsApp → แปลงเป็นลูกค้า/QT  
- ผูก `sourcePresetId` กับ CMS presets  
- ใบสัญญา / ใบส่งมอบ  
- Dashboard สตูดิโอจริง (pipeline + ยอดค้าง)  
- Sync template เว็บให้ใช้เลข/ข้อมูลจาก Admin (ถ้าต้องการ public self-serve QT)

---

## 15. Checklist เริ่มงานวันแรก

- [x] Confirm กฎข้อ 9 กับ stakeholder (โดยเฉพาะ void + ออกเลขตอนไหน) — ใช้ค่าเริ่มต้นในตาราง §9
- [x] สร้าง / ทำงานบนโค้ดเบส Admin หลัก
- [x] เขียน Drizzle schema + migrate บน DB local (`db:push`)
- [x] เพิ่ม permissions แล้ว `bun rbac:sync`
- [x] Scaffold module `customers` + `finance` ใน sidebar
- [x] Phase B → C → D → E (seed + tests) ครบตาม MVP
- [ ] Follow-up: wire `appendAudit` บน create/update/void/pay
- [x] Follow-up: dashboard finance cards (`/dashboard/summary`)
- [ ] Follow-up: duplicate quotation (optional)

---

**เจ้าของแผน:** ClickCraft  
**อ้างอิงการวิเคราะห์:** Admin feature canvas P0 + Website quotation flow ปัจจุบัน
