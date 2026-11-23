import { uploadApi } from "./upload-api";
import { uploadFileToPresignedUrl } from "./upload-to-presigned";

/** ขนาด chunk ต่อ part (S3 minimum 5MB ยกเว้น part สุดท้าย) */
export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024;

/** จำนวน part ที่อัปโหลดพร้อมกัน */
export const DEFAULT_UPLOAD_CONCURRENCY = 3;

/** จำนวน part ที่ขอ presign ต่อครั้ง */
const PRESIGN_BATCH_SIZE = 20;

/** ต่ำกว่านี้ใช้ single PUT แทน multipart (ยังเล็กกว่า min part size) */
const SINGLE_PUT_MAX_BYTES = DEFAULT_CHUNK_SIZE;

export type ChunkUploadOptions = {
  /** Prefix ของ key ใน bucket เช่น "uploads/large" */
  keyPrefix?: string;
  /** ขนาดต่อ chunk (bytes), default 5MB */
  chunkSize?: number;
  /** จำนวน part ที่อัปโหลดขนาน, default 3 */
  concurrency?: number;
  /** เรียกหลังอัปโหลดแต่ละ part: (loadedBytes, totalBytes) */
  onProgress?: (loaded: number, total: number) => void;
};

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "file";
}

function buildObjectKey(file: File, keyPrefix: string): string {
  const ext = file.name.includes(".") ? (file.name.split(".").pop() ?? "") : "";
  const baseName = file.name.includes(".")
    ? file.name.slice(0, file.name.lastIndexOf("."))
    : file.name;
  const safeBase = sanitizeFilename(baseName);
  return `${keyPrefix}/${Date.now()}-${safeBase}${ext ? `.${ext}` : ""}`;
}

function resolveContentType(file: File): string | undefined {
  if (file.type) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".apk")) {
    return "application/vnd.android.package-archive";
  }
  if (lower.endsWith(".zip")) {
    return "application/zip";
  }
  if (lower.endsWith(".ipa")) {
    return "application/octet-stream";
  }
  return undefined;
}

function extractEtag(res: Response, partNumber: number): string {
  const raw =
    res.headers.get("ETag") ??
    res.headers.get("etag") ??
    res.headers.get("Etag") ??
    "";
  let etag = raw.trim();
  if (!etag) {
    throw new Error(
      `Part ${partNumber} missing ETag (check MinIO/S3 CORS ExposeHeaders: ETag)`,
    );
  }
  if (!etag.startsWith('"')) etag = `"${etag}"`;
  return etag;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next++;
      const item = items[index];
      if (item === undefined) continue;
      results[index] = await worker(item, index);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => run(),
  );
  await Promise.all(runners);
  return results;
}

async function uploadViaSinglePut(
  file: File,
  key: string,
  contentType: string | undefined,
  onProgress?: (loaded: number, total: number) => void,
): Promise<string> {
  const { uploadUrl } = await uploadApi.getPresignUrl({ key, contentType });
  onProgress?.(0, file.size);
  await uploadFileToPresignedUrl(uploadUrl, file, { contentType });
  onProgress?.(file.size, file.size);
  return key;
}

/**
 * แบ่งไฟล์เป็น chunks แล้วอัปโหลดผ่าน S3 Multipart (presigned URL)
 * ไฟล์ที่เล็กกว่าหรือเท่ากับ 5MB ใช้ single PUT
 * คืน key ที่ใช้เก็บใน DB
 */
export async function uploadLargeFileInChunks(
  file: File,
  options: ChunkUploadOptions = {},
): Promise<string> {
  const {
    keyPrefix = "uploads",
    chunkSize = DEFAULT_CHUNK_SIZE,
    concurrency = DEFAULT_UPLOAD_CONCURRENCY,
    onProgress,
  } = options;

  if (file.size <= 0) {
    throw new Error("File is empty");
  }
  if (chunkSize < DEFAULT_CHUNK_SIZE) {
    throw new Error("chunkSize must be at least 5MB for S3 multipart");
  }

  const key = buildObjectKey(file, keyPrefix);
  const contentType = resolveContentType(file);

  if (file.size <= SINGLE_PUT_MAX_BYTES) {
    return uploadViaSinglePut(file, key, contentType, onProgress);
  }

  const totalSize = file.size;
  const partCount = Math.ceil(totalSize / chunkSize);
  const partNumbers = Array.from({ length: partCount }, (_, i) => i + 1);

  const { uploadId } = await uploadApi.multipartInit({ key, contentType });

  try {
    const presignedByPart = new Map<number, string>();

    for (let i = 0; i < partNumbers.length; i += PRESIGN_BATCH_SIZE) {
      const batch = partNumbers.slice(i, i + PRESIGN_BATCH_SIZE);
      const { parts } = await uploadApi.multipartPresignParts({
        key,
        uploadId,
        partNumbers: batch,
      });
      for (const part of parts) {
        presignedByPart.set(part.partNumber, part.uploadUrl);
      }
    }

    const loadedByPart = new Array<number>(partCount).fill(0);

    const reportProgress = () => {
      const loaded = loadedByPart.reduce((sum, n) => sum + n, 0);
      onProgress?.(loaded, totalSize);
    };

    const completedParts = await mapPool(
      partNumbers,
      Math.max(1, concurrency),
      async (partNumber) => {
        const index = partNumber - 1;
        const start = index * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const blob = file.slice(start, end);
        const uploadUrl = presignedByPart.get(partNumber);
        if (!uploadUrl) {
          throw new Error(`Missing presigned URL for part ${partNumber}`);
        }

        const res = await fetch(uploadUrl, {
          method: "PUT",
          body: blob,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(
            `Part ${partNumber} upload failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`,
          );
        }

        const etag = extractEtag(res, partNumber);
        loadedByPart[index] = end - start;
        reportProgress();
        return { partNumber, etag };
      },
    );

    await uploadApi.multipartComplete({
      key,
      uploadId,
      parts: completedParts.sort((a, b) => a.partNumber - b.partNumber),
    });

    return key;
  } catch (err) {
    await uploadApi.multipartAbort({ key, uploadId }).catch(() => {});
    throw err;
  }
}
