export type ShareAccessDenial =
  | "NOT_FOUND"
  | "REVOKED"
  | "EXPIRED"
  | "UNAVAILABLE"
  | "QUOTA";

export type ShareAccessInput = {
  revokedAt: Date | null;
  expiresAt: Date | null;
  releaseStatus: string;
  maxDownloads?: number | null;
  downloadCount?: number | null;
};

/** Pure validation for share-link download eligibility. */
export function evaluateShareAccess(
  input: ShareAccessInput | null | undefined,
  now: Date = new Date(),
): ShareAccessDenial | null {
  if (!input) return "NOT_FOUND";
  if (input.revokedAt) return "REVOKED";
  if (input.expiresAt && input.expiresAt.getTime() <= now.getTime()) {
    return "EXPIRED";
  }
  if (input.releaseStatus !== "published") return "UNAVAILABLE";
  if (
    input.maxDownloads != null &&
    (input.downloadCount ?? 0) >= input.maxDownloads
  ) {
    return "QUOTA";
  }
  return null;
}

export function generateShareToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/** ต่ออายุจากวันหมดอายุเดิม (ถ้ายังไม่หมด) หรือจากวันนี้ */
export function computeExtendedExpiry(
  currentExpiresAt: Date | null,
  expiresInDays: number,
  now: Date = new Date(),
): Date {
  const base =
    currentExpiresAt && currentExpiresAt.getTime() > now.getTime()
      ? currentExpiresAt
      : now;
  const next = new Date(base);
  next.setUTCDate(next.getUTCDate() + expiresInDays);
  return next;
}

/** เพิ่มโควต้าดาวน์โหลด — ลิงก์ไม่จำกัดใช้ downloadCount เป็นฐาน */
export function computeIncreasedMaxDownloads(
  maxDownloads: number | null | undefined,
  downloadCount: number,
  addDownloads: number,
): number {
  const base = maxDownloads ?? downloadCount;
  return base + addDownloads;
}
