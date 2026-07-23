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
