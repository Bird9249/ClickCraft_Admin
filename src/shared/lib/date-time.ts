/**
 * DateTime utilities – ใช้ร่วมกันได้ทั้ง frontend และ backend
 *
 * ## Backend (schema ใช้ timestamp/date แบบ mode: "date")
 * - **เขียนค่า timestamp ลง DB** (createdAt, updatedAt, occurredAt ในตาราง): ใช้ `nowDate()` (ได้ Date object)
 * - **เขียนค่าวันที่อย่างเดียวลง DB** (เช่น ban_expires ที่เป็น type date): ใช้ `toDateOnlyString(iso)` ได้ "yyyy-MM-dd"
 * - **ส่ง occurredAt เข้า audit payload (JSON)**: ใช้ `nowISO()` (ได้ ISO string สำหรับ serialize)
 * - **รับค่าจาก request**: รับเป็น ISO string แล้วใช้ `parseISO(s)` ถ้าต้องการเป็น Date
 * - **Query / logic**: คิดเป็น UTC เสมอ ใช้ Date หรือ ISO string ที่มีความหมายเป็น UTC
 *
 * ## Frontend
 * - **แสดงผล**: ใช้ `formatDateTimeLocal(date)` หรือ `formatDateLocal(date)` (ตาม timezone ของ browser)
 * - **ส่งค่าไป API (POST/PUT)**: ส่งเป็น ISO string เช่น `date.toISOString()` (หรือใช้ `toISOForAPI(date)`)
 * - **รับค่าจาก API**: API ส่ง ISO มาแล้ว parse เป็น Date ได้เลย เช่น `new Date(isoString)` แล้วค่อย format แสดง
 *
 * ## หลักการ
 * - DB เก็บเป็น timestamp with time zone (UTC) หรือ date; schema ใช้ mode: "date" จึงรับ/คืนค่าเป็น Date
 * - API ส่งรับเป็น ISO 8601 string
 * - แสดงผลตาม timezone ของ browser (ผู้ใช้)
 */

import { format } from "date-fns";

// ============== Backend ==============

/**
 * เวลาปัจจุบันเป็น Date object (UTC)
 *
 * **ใช้เมื่อ**: เขียนค่า timestamp ลง DB (createdAt, updatedAt, occurredAt ในตาราง) ที่ schema ใช้ mode: "date"
 *
 * @example
 * const now = nowDate();
 * await db.insert(table).values({ createdAt: now, updatedAt: now });
 */
export function nowDate(): Date {
  return new Date();
}

/**
 * เวลาปัจจุบันเป็น ISO 8601 string (UTC)
 *
 * **ใช้เมื่อ**: ส่ง occurredAt เข้า audit payload (JSON จะ serialize เป็น string), หรือที่ต้องการ string โดยตรง
 * **ไม่ใช้**: เขียนลงคอลัมน์ timestamp ที่ mode: "date" (ให้ใช้ nowDate() แทน)
 *
 * @example
 * appendAudit({ ..., occurredAt: nowISO() });
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * เวลาปัจจุบัน + N ชั่วโมง เป็น ISO 8601 string (UTC)
 * ใช้เมื่อตั้งค่า expires (เช่น session หมดอายุใน 24 ชม.)
 */
export function addHoursFromNowISO(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

/**
 * แปลง ISO 8601 string เป็น Date
 * ใช้เมื่อรับค่าจาก request หรือจาก DB (ถ้าได้เป็น string) แล้วต้องคำนวณ/เปรียบเทียบ
 *
 * @param iso - ISO 8601 string (เช่น "2025-01-30T10:00:00.000Z")
 */
export function parseISO(iso: string): Date {
  return new Date(iso);
}

/**
 * แปลง Date หรือ ISO string เป็นสตริง "yyyy-MM-dd" (วันอย่างเดียว)
 * ใช้เมื่อเขียนลงคอลัมน์ type date ใน PostgreSQL (เช่น ban_expires)
 *
 * @param date - Date object หรือ ISO string
 */
export function toDateOnlyString(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
}

// ============== Frontend – แสดงผล ==============

/**
 * แสดงวันเวลาใน timezone ของ browser (ผู้ใช้)
 * ใช้เมื่อแสดง createdAt, updatedAt, occurredAt ในตารางหรือรายละเอียด
 *
 * @param date - Date object หรือ ISO string จาก API
 * @returns สตริงรูปแบบ "dd/MM/yyyy HH:mm:ss"
 */
export function formatDateTimeLocal(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy HH:mm:ss");
}

/**
 * แสดงเฉพาะวันที่ใน timezone ของ browser
 *
 * @param date - Date object หรือ ISO string จาก API
 * @returns สตริงรูปแบบ "dd/MM/yyyy"
 */
export function formatDateLocal(date: Date | string): string {
  return format(new Date(date), "dd/MM/yyyy");
}

/**
 * วันที่รูปแบบ yyyy-MM-dd (สำหรับ date input, query param, filter)
 * ใช้ใน timezone ของ browser
 */
export function formatDateForInput(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
}

// ============== Frontend – ส่งค่าไป API ==============

/**
 * แปลง Date เป็น ISO string สำหรับส่งใน body ของ POST/PUT
 * ใช้เมื่อฟอร์มมีฟิลด์วันที่ (เช่น วันหมดอายุแบน) แล้วจะส่งไป backend
 *
 * @param date - Date จาก form state หรือ date picker
 * @returns ISO 8601 string หรือ undefined ถ้าไม่มีค่า
 */
export function toISOForAPI(
  date: Date | string | null | undefined,
): string | undefined {
  if (date == null) return undefined;
  const d = typeof date === "string" ? new Date(date) : date;
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}
