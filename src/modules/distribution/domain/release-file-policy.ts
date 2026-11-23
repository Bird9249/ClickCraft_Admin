import type { ReleasePlatform } from "./contracts";

const BLOCKED_EXTENSIONS = new Set([
  "exe",
  "bat",
  "cmd",
  "com",
  "msi",
  "scr",
  "vbs",
  "js",
  "mjs",
  "sh",
  "bash",
  "app",
  "deb",
  "rpm",
  "html",
  "htm",
  "php",
  "jar",
]);

export function getFileExtension(fileName: string): string | null {
  const lower = fileName.toLowerCase().trim();
  const dot = lower.lastIndexOf(".");
  if (dot <= 0 || dot === lower.length - 1) return null;
  return lower.slice(dot + 1);
}

export function validateDistributionFileName(
  platform: ReleasePlatform,
  fileName: string,
): string | null {
  const ext = getFileExtension(fileName);
  if (!ext) {
    return "fileName must include a file extension";
  }

  if (platform === "android") {
    if (ext !== "apk") {
      return "Android releases require .apk file";
    }
    return null;
  }

  if (BLOCKED_EXTENSIONS.has(ext)) {
    return `File type .${ext} is not allowed`;
  }

  return null;
}

export function distributionStorageSegment(platform: ReleasePlatform): string {
  return platform === "android" ? "android" : "files";
}

export function resolveDistributionContentType(
  fileName: string,
  fileType?: string | null,
): string | undefined {
  if (fileType) return fileType;
  const ext = getFileExtension(fileName);
  if (ext === "apk") return "application/vnd.android.package-archive";
  if (ext === "zip") return "application/zip";
  if (ext === "pdf") return "application/pdf";
  if (ext === "json") return "application/json";
  if (ext === "xml") return "application/xml";
  if (ext === "txt") return "text/plain";
  if (ext === "csv") return "text/csv";
  return undefined;
}

export function distributionUploadAccept(platform: ReleasePlatform): string {
  if (platform === "android") {
    return ".apk,application/vnd.android.package-archive";
  }
  return ".zip,application/zip,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.json,.xml,.7z,.rar,.aab";
}

export function distributionUploadHint(platform: ReleasePlatform): string {
  if (platform === "android") {
    return "ລາກແລະວາງ .apk ຫຼື ກົດເພື່ອເລືອກ — ແບ່ງ chunk ລະ 5MB · ແນະນຳໃຫ້ກໍຳນົດ version/build ກ່ອນ";
  }
  return "ຮອງຮັບ .zip ແລະ ໄຟລ໌ທົ່ວໄປ (ບໍ່ຮອງຮັບ .exe/.js/.html) — chunk ລະ 5MB";
}

export function validateDistributionFileClient(
  platform: ReleasePlatform,
  file: File,
): string | null {
  return validateDistributionFileName(platform, file.name);
}

export function platformDisplayLabel(platform: string): string {
  if (platform === "file") return "ໄຟລ໌";
  if (platform === "android") return "Android";
  return platform;
}

export function publicDownloadButtonLabel(
  platform: string,
  fileName: string,
): string {
  if (platform === "android") return "ດາວໂຫຼດ APK";
  if (fileName.toLowerCase().endsWith(".zip")) return "ດາວໂຫຼດ ZIP";
  return "ດາວໂຫຼດໄຟລ໌";
}
