# แผน Implement — iOS Distribution (หลัง Apple Developer)

**โปรเจกต์:** ClickCraft Admin  
**อ้างอิงแผนหลัก:** [`p2-app-distribution-plan.md`](./p2-app-distribution-plan.md) (B1+B2 Android ทำแล้ว)  
**สถานะแผน:** Draft — **รอ Apple Developer**  
**อัปเดต:** 2026-07-23

## สรุปทิศทาง

| ลำดับ | แนวทาง | แนะนำ |
|-------|--------|--------|
| **1** | **TestFlight** (App Store Connect) | **ทำก่อน** — ติดตั้งบน iPhone ได้จริง ไม่ต้องทำ OTA เอง |
| **2** | เก็บ/แสดงลิงก์ TestFlight ใน Admin | optional — ให้ทีมหาลิงก์จาก Admin ได้ |
| **3** | iOS OTA ใน Admin (`.ipa` + manifest) | optional ทีหลัง — ซับซ้อนกว่า และมีข้อจำกัด enterprise/ad-hoc |

**อย่าสัญญาว่า** แชร์ลิงก์แบบ Android (`/d/:token` ดาวน์โหลดไฟล์) แล้วติดตั้งบน iPhone ได้ จนกว่าจะเลือกและทำครบเส้นทางด้านบน

---

## 0. ความสัมพันธ์กับโมดูล Android ปัจจุบัน

สิ่งที่มีแล้วและ**ใช้ต่อได้**:

| ส่วน | สถานะ | หมายเหตุสำหรับ iOS |
|------|--------|-------------------|
| `distribution_app` / release / share_link | มีแล้ว | คอลัมน์ `platform` เป็น text — เผื่อ `ios` ได้ |
| RBAC `distribution:read/write` | มีแล้ว | ใช้ชุดเดิมได้ |
| S3 + chunk upload | มีแล้ว | เก็บ `.ipa` ได้ แต่**ยังไม่เท่ากับติดตั้งได้** |
| Public `/d/:token` | มีแล้ว | โหมด Android = ดาวน์โหลดไฟล์; iOS ต้องแยก UX (TestFlight link หรือ OTA) |

สิ่งที่**ยังห้ามเปิด**จนกว่าจะจบข้อเตรียม + เลือกเฟส:

- อัปโหลด `.ipa` ใน Admin โดยไม่บอกข้อจำกัด
- ข้อความบนหน้า public ว่า “ติดตั้งบน iPhone ได้” ถ้าแค่ไฟล์อย่างเดียว

---

## 1. สิ่งที่ต้องเตรียมก่อนลงมือ (Prerequisites)

### 1.1 บัญชีและองค์กร (บังคับ)

| รายการ | รายละเอียด | Owner แนะนำ |
|--------|------------|-------------|
| **Apple Developer Program** | สมัครที่ [developer.apple.com](https://developer.apple.com) — รายปี (Individual หรือ Organization) | Founder / Finance |
| **Apple ID** สำหรับทีม | คนที่จัดการใบรับรอง / App Store Connect | Tech lead |
| **Organization (ถ้าใช้บริษัท)** | D-U-N-S, เอกสารนิติบุคคล — ใช้เวลานานกว่า Individual | Founder |
| **ทีม / role ใน App Store Connect** | Admin / App Manager / Developer ตามงาน | Tech lead |

งบประมาณโดยประมาณ: ค่าสมัคร Apple Developer Program (รายปี) + เวลาเตรียมเอกสารถ้าเป็น Organization

### 1.2 แอปและ Bundle ID

| รายการ | รายละเอียด |
|--------|------------|
| **Bundle ID** | เช่น `com.clickcraft.app` — ต้องตรงกับที่ build ใน Xcode / CI |
| **App record ใน App Store Connect** | สร้างแอปก่อนอัปโหลด build ขึ้น TestFlight |
| **ชื่อแอป / privacy** | ข้อมูลที่ App Store Connect บังคับ (แม้ยังไม่ส่งรีวิวเต็ม) |

### 1.3 Signing & devices (ขึ้นกับวิธีแจก)

| โหมด | ใช้เมื่อไหร่ | ต้องเตรียม |
|------|-------------|------------|
| **TestFlight** (แนะนำ) | tester ภายนอก / ภายในผ่าน Apple | Distribution cert + App Store provisioning; **ไม่ต้อง**เก็บ UDID ทุกเครื่องสำหรับ External Testing |
| **Ad Hoc** | ติดตั้งตรงจากลิงก์/ไฟล์ โดยไม่ผ่าน TestFlight | ลงทะเบียน **UDID** ทุกเครื่อง (จำกัดจำนวน), Ad Hoc profile |
| **Enterprise** | องค์กรใหญ่แจกในบริษัท | Apple Developer **Enterprise** Program แยก — ไม่ใช่บัญชีปกติ |

สำหรับ ClickCraft รอบแรก: เตรียมเส้นทาง **TestFlight** เป็นหลัก ไม่เริ่มจาก Enterprise

### 1.4 เครื่องและเครื่องมือพัฒนา

| รายการ | รายละเอียด |
|--------|------------|
| **Mac + Xcode** | build / archive / upload (หรือ CI ที่รองรับ macOS) |
| **ใบรับรอง (Certificates)** | Apple Distribution |
| **Provisioning Profile** | App Store (สำหรับ TestFlight) |
| **CI (optional)** | Fastlane / Xcode Cloud / GitHub Actions macOS — อัปโหลด build อัตโนมัติ |

### 1.5 คนทดสอบ (TestFlight)

| ประเภท | ขีดจำกัดโดยสังเขป | หมายเหตุ |
|--------|-------------------|----------|
| **Internal Testing** | สมาชิกทีมใน App Store Connect (จำนวนน้อย) | เร็ว ใช้ทดสอบในทีม |
| **External Testing** | ได้หลายพันคนต่อแอป | ต้องผ่าน **Beta App Review** ครั้งแรกของกลุ่ม |

เตรียม: รายชื่อ tester (อีเมล Apple ID), ข้อความ “What to Test”, และ build ที่เสถียรพอสำหรับ review

### 1.6 นโยบาย/กฎหมายในทีม

- ใครมีสิทธิ์สร้าง build / เชิญ tester
- ข้อมูลส่วนบุคคลใน build ทดสอบ (อย่าใส่ production secret)
- ระยะเวลา beta / วันหมดอายุ build บน TestFlight (Apple จำกัดอายุ build)

### 1.7 Checklist พร้อมเริ่ม Phase TF1

- [ ] สมัครและอนุมัติ Apple Developer Program แล้ว
- [ ] มีสิทธิ์เข้า App Store Connect
- [ ] สร้าง Bundle ID + App record แล้ว
- [ ] มี Mac/Xcode (หรือ CI) archive + upload ได้
- [ ] ตั้งค่า signing (Distribution + App Store profile) แล้ว
- [ ] รู้ว่าจะใช้ Internal และ/หรือ External Testing
- [ ] ตกลงว่า Admin จะแค่ “ลิงก์ไป TestFlight” หรือจะทำ OTA ทีหลัง

---

## 2. เป้าหมายและขอบเขต

### 2.1 เป้าหมายธุรกิจ

ให้ทีม ClickCraft สามารถ:

1. แจกจ่าย build **iOS** ให้ tester / ลูกค้าติดตั้งบน iPhone ได้จริง
2. ควบคุมว่าใครเข้าถึง build ได้ (ผ่าน TestFlight หรือลิงก์ที่ Admin เก็บ)
3. ไม่ทำให้ผู้ใช้สับสนกับ flow Android ปัจจุบัน

### 2.2 ในขอบเขตที่แนะนำ (เรียงเฟส)

| เฟส | ขอบเขต |
|-----|--------|
| **TF1** | ตั้งค่า Apple + อัปโหลด build + เชิญ tester ผ่าน TestFlight (นอก Admin ก็ได้) |
| **TF2** | Admin: บันทึก/แสดง TestFlight public link (หรือ invite instructions) ต่อแอป/เวอร์ชัน |
| **OTA** (optional) | อัปโหลด `.ipa` + manifest plist + หน้า install แบบ itms-services — เฉพาะเมื่อมีเหตุผลชัด |

### 2.3 นอกขอบเขต

| รายการ | เหตุผล |
|--------|--------|
| แทนที่ Android share-APK ด้วย flow เดียวกันบน iOS | Apple ไม่อนุญาตติดตั้งจากไฟล์แบบ Android |
| Enterprise silent install ทั่วโลก | ต้องโปรแกรม Enterprise และไม่เหมาะกับเคสทั่วไป |
| บังคับ CI ในเฟสแรก | ทำมือด้วย Xcode ก่อนได้ |
| เปิด `/api/files/*` สาธารณะ | หลักการเดิมของแผน P2 — ไม่ทำ |

---

## 3. Phase TF1 — TestFlight (ไม่บังคับแก้ Admin)

**เป้าหมาย:** มีช่องทางติดตั้ง iOS จริงโดยพึ่ง Apple  
**ประมาณการ:** ขึ้นกับการอนุมัติบัญชี + Beta Review (มักคิดเป็นวัน–สัปดาห์ ไม่ใช่ชั่วโมง)

### 3.1 งานที่ต้องทำ

1. สมัคร / ยืนยัน Apple Developer  
2. สร้าง Identifier (Bundle ID), App ใน App Store Connect  
3. ตั้งค่า Certificates & Profiles ใน Xcode  
4. Archive → Upload build  
5. รอประมวลผล build ใน App Store Connect  
6. เพิ่ม Internal testers แล้วติดตั้งผ่านแอป TestFlight  
7. (ถ้าต้องการคนนอก) สร้าง External group → กรอกข้อมูล → ส่ง Beta Review → แชร์ลิงก์ / เชิญอีเมล  

### 3.2 Done — TF1

- [ ] อัปโหลด build iOS ขึ้น TestFlight ได้  
- [ ] ทีมภายในติดตั้งจาก TestFlight ได้  
- [ ] (optional) External link ใช้ได้หลังผ่าน Beta Review  
- [ ] มีเอกสารสั้นในทีม: “ขอเข้า beta ยังไง / ต้องมี Apple ID”  

### 3.3 สิ่งที่ Admin ยังไม่ต้องมีใน TF1

- อัปโหลด `.ipa`
- คอลัมน์ platform = ios ใน UI
- หน้า public โหมด iOS

---

## 4. Phase TF2 — ผูก TestFlight เข้า Admin (optional)

**เป้าหมาย:** ให้คนที่มี `distribution:*` หาลิงก์/เวอร์ชัน iOS ได้จาก Admin โดยไม่ต้องเข้า App Store Connect ทุกครั้ง  
**พึ่งพา:** TF1 ใช้งานได้แล้ว

### 4.1 ทางเลือกออกแบบ (เลือกหนึ่งตอนเริ่ม implement)

| ตัวเลือก | รายละเอียด | ข้อดี | ข้อเสีย |
|----------|------------|------|--------|
| **A. Link-only release** | `platform=ios`, ไม่บังคับ `fileKey`, เก็บ `externalUrl` (TestFlight) | เรียบ ตรงกับ TestFlight | ไม่มีไฟล์ใน S3 |
| **B. Metadata + notes** | เก็บ version/build + ลิงก์ + หมายเหตุ ในตารางย่อย / ฟิลด์ JSON | ยืดหยุ่น | UI/API ต้องออกแบบชัด |
| **C. แค่หน้า Settings** | ช่อง “TestFlight URL” ระดับแอป ไม่ผูกทุก build | ทำเร็วสุด | ไม่ track รายเวอร์ชัน |

**แนะนำเริ่ม:** **A หรือ C** — อย่าเพิ่งทำ OTA

### 4.2 Schema ที่อาจเพิ่ม (ร่าง — ตัดสินตอน implement)

```
-- แนว A: ขยาย distribution_release
-- platform: 'android' | 'ios'
-- fileKey nullable เมื่อ ios + externalUrl
-- externalUrl text null   -- TestFlight link
-- externalProvider text null  -- 'testflight' | ...
```

กฎธุรกิจร่าง:

| กฎ | รายละเอียด |
|----|------------|
| Android | เหมือนเดิม — บังคับไฟล์ `.apk` |
| iOS (TF2) | บังคับ `externalUrl` (TestFlight), ไม่บังคับไฟล์ |
| Share link | ชี้ไปหน้า public ที่ปุ่มหลัก = เปิด TestFlight ไม่ใช่ดาวน์โหลด `.ipa` |
| Public UX | แยก copy: “เปิดใน TestFlight” vs “ดาวน์โหลด APK” |

### 4.3 API / UI (ร่าง)

| ส่วน | งาน |
|------|-----|
| Contracts | อนุญาต `platform: 'ios'` + refine ตามไฟล์/URL |
| Admin upload/create | ฟอร์ม iOS: version, build, TestFlight URL, changelog |
| Releases table | แสดง badge แพลตฟอร์ม + ปุ่มเปิดลิงก์ภายนอก |
| Public page | ถ้า ios → CTA ไป `externalUrl`, ไม่เรียก download APK |
| Filter | filter `platform` (android/ios/all) |

### 4.4 Done — TF2

- [ ] สร้าง/แก้ไข iOS release ที่ผูก TestFlight URL ได้  
- [ ] หน้า public แยก CTA ตามแพลตฟอร์ม  
- [ ] ไม่ทำให้ Android flow พัง  
- [ ] เอกสารทีมอัปเดต: ใช้ Admin แชร์ลิงก์ iOS อย่างไร  

---

## 5. Phase OTA — iOS OTA ใน Admin (optional, ทีหลัง)

ทำเมื่อมีเหตุผลชัด เช่น ต้องการติดตั้งในเครื่องที่จำกัดโดยไม่ผ่าน TestFlight และยอมรับภาระ signing/UDID

### 5.1 สิ่งที่ต้องเข้าใจก่อน

| หัวข้อ | ความจริง |
|--------|----------|
| ไฟล์ | ต้องมี `.ipa` ที่ sign ถูกต้อง |
| ติดตั้งจากเว็บ | ใช้ `itms-services://` + `manifest.plist` ชี้ไปที่ URL ของ ipa |
| Ad Hoc | เครื่องต้องอยู่ใน provisioning (UDID) — ไม่แจกคนไม่จำกัดแบบ APK |
| HTTPS | manifest และไฟล์ต้องเสิร์ฟผ่าน HTTPS ที่อุปกรณ์เชื่อถือได้ |
| UX | ผู้ใช้ต้องกดอนุญาตโปรไฟล์/นักพัฒนา — ไม่ลื่นเหมือน TestFlight |

### 5.2 งาน implement โดยสังเขป

1. อนุญาตอัปโหลด `.ipa` + เก็บบน S3 (`uploads/distribution/{slug}/ios/...`)  
2. Generate / เก็บ `manifest.plist` (bundle-identifier, version, title, ipa URL)  
3. Public page โหมด OTA: ปุ่ม `itms-services://?action=download-manifest&url=...`  
4. Presign หรือ public-readable object เฉพาะ manifest/ipa ตามโมเดลความปลอดภัยที่เลือก  
5. เอกสารจำกัด: “ใช้ได้เฉพาะเครื่องที่ลงทะเบียน”  

### 5.3 Done — OTA

- [ ] อัปโหลด ipa + สร้าง manifest ได้  
- [ ] ติดตั้งบนเครื่องที่ลง UDID แล้วสำเร็จอย่างน้อย 1 เครื่อง  
- [ ] หน้า public ไม่โชว์ OTA กับ release ที่เป็นแค่ TestFlight link  
- [ ] มีคำเตือนใน Admin เรื่องข้อจำกัด Ad Hoc  

### 5.4 เมื่อไหร่ไม่ควรทำ OTA

- ยังไม่มี Apple Developer  
- เป้าหมายคือส่งให้ลูกค้าทั่วไปจำนวนมาก → ใช้ TestFlight  
- ทีมยังไม่มีคนดูแล cert/profile/UDID ประจำ  

---

## 6. Security & Compliance

| หัวข้อ | แนวทาง |
|--------|--------|
| ไม่เปิด S3 ทั้งบัคเก็ตสาธารณะ | เหมือนแผน Android |
| TestFlight | พึ่งการควบคุมของ Apple (invite / public link ที่ปิดได้) |
| OTA | token + expiry + revoke เหมือน share link; manifest URL ต้องไม่เดาได้ง่าย |
| Secrets | ไม่ฝัง production API key ใน beta build |
| Audit (optional) | บันทึกเมื่อสร้าง/แก้ externalUrl หรืออัปโหลด ipa |

---

## 7. Testing checklist (เมื่อถึงเฟส)

### TF1

- [ ] Internal tester ติดตั้งได้บนอุปกรณ์จริง  
- [ ] External (ถ้าใช้) ผ่าน review และลิงก์ใช้ได้  
- [ ] Build หมดอายุ/ถูก expire แล้วเข้าไม่ได้ตามที่คาด  

### TF2

- [ ] สร้าง ios release + URL แล้วหน้า `/d/:token` เปิด TestFlight ได้  
- [ ] Android release เก่ายังดาวน์โหลด APK ได้  
- [ ] URL ว่าง / ไม่ใช่ https ถูกปฏิเสธตาม contract  

### OTA (ถ้าทำ)

- [ ] เครื่องใน profile ติดตั้งได้  
- [ ] เครื่องนอก profile ติดตั้งไม่ได้ (คาดหวัง)  
- [ ] revoke / expiry แล้วปุ่ม install ใช้ไม่ได้  

---

## 8. แผนงานและลำดับแนะนำ

```
[เตรียม Apple Developer + Bundle ID + signing]
            │
            ▼
     Phase TF1 — TestFlight ใช้งานได้จริง
            │
            ▼
     Phase TF2 — (optional) ลิงก์ใน Admin
            │
            ▼
     Phase OTA — (optional) เฉพาะมีเหตุผล + ยอมรับ UDID
```

ประมาณการความพร้อม (คร่าวๆ หลังมีบัญชีแล้ว):

| เฟส | งานหลัก | หมายเหตุเวลา |
|-----|---------|----------------|
| เตรียม | สมัคร/เอกสาร/ Bundle ID | มักเป็นตัวหน่วงหลัก |
| TF1 | upload + tester | 1–3 วันหลังบัญชีพร้อม (ไม่นับรอ review) |
| TF2 | Admin link-only | ประมาณ 0.5–1.5 วันพัฒนา |
| OTA | ipa + manifest + UX | 2–5 วัน + ภาระ ops ต่อเนื่อง |

---

## 9. Decisions ที่ต้องปิดก่อนลงโค้ด TF2/OTA

| # | คำถาม | ค่าเริ่มต้นที่แนะนำ |
|---|--------|---------------------|
| 1 | แจก iOS หลักด้วยอะไร | **TestFlight** |
| 2 | ต้องมีลิงก์ใน Admin ไหม | ทำ TF2 หลัง TF1 นิ่ง |
| 3 | โมเดลข้อมูล iOS ใน Admin | Link-only (A) หรือ Settings-level (C) |
| 4 | จะทำ OTA ไหม | **ไม่ทำ** จนกว่า TestFlight ไม่พอ |
| 5 | โดเมนหน้า public | คง `/d/:token` — แยก UI ตาม platform |
| 6 | ใครดูแล Apple cert/profile | กำหนดชื่อคนก่อน production beta |

---

## 10. Rollout (เมื่อพร้อม)

1. [ ] Apple Developer ใช้งานได้  
2. [ ] TF1: build แรกบน TestFlight + ทีมติดตั้งได้  
3. [ ] เอกสารภายใน “ขอสิทธิ์ tester”  
4. [ ] (optional) Implement TF2 บน Admin + deploy  
5. [ ] (optional) OTA เฉพาะเมื่อมี use case ชัด  

ไม่บล็อก Android distribution ที่ทำไปแล้วในแผน P2

---

## 11. สรุปสั้นๆ

- **เตรียมก่อน:** Apple Developer, Bundle ID, App Store Connect, signing, Mac/Xcode, แผน tester  
- **ทำก่อน:** **TestFlight (TF1)** ให้ติดตั้งบน iPhone ได้จริง  
- **ค่อยทำใน Admin:** เก็บ/แชร์ลิงก์ TestFlight (TF2)  
- **OTA ใน Admin:** optional และยากกว่า — ไม่ใช่จุดเริ่ม  

รายละเอียด Android share-link ที่เสร็จแล้ว ดูที่ [`p2-app-distribution-plan.md`](./p2-app-distribution-plan.md)
