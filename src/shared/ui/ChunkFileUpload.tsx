import { Loader2, Upload } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/kit";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CHUNK_SIZE,
  DEFAULT_UPLOAD_CONCURRENCY,
  uploadLargeFileInChunks,
} from "@/shared/lib/chunk-upload-s3";

export type ChunkFileUploadProps = {
  /** Prefix ของ key ใน bucket เช่น "uploads/large" */
  keyPrefix?: string;
  /** ขนาด chunk (bytes), default 5MB */
  chunkSize?: number;
  /** จำนวน part ที่อัปโหลดขนาน */
  concurrency?: number;
  /** accept attribute ของ input */
  accept?: string;
  /** ปิดปุ่มเลือกไฟล์ */
  disabled?: boolean;
  /** คืนข้อความ error ถ้าไฟล์ไม่ผ่าน (อัปโหลดจะไม่เริ่ม) */
  validateFile?: (file: File) => string | null;
  /** callback เมื่ออัปโหลดสำเร็จ (ได้ key ใน bucket + ไฟล์ต้นทาง) */
  onSuccess?: (key: string, file: File) => void;
  /** callback เมื่อเกิดข้อผิดพลาด */
  onError?: (error: Error) => void;
  /** ป้ายชื่อปุ่ม */
  buttonLabel?: string;
  /** คำอธิบายสั้น */
  hint?: string;
  /** แสดง object key หลังอัปโหลดสำเร็จ */
  showKey?: boolean;
  /** เปิดใช้ drag-and-drop */
  enableDrop?: boolean;
  className?: string;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatChunkSize(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export function ChunkFileUpload({
  keyPrefix = "uploads/large",
  chunkSize = DEFAULT_CHUNK_SIZE,
  concurrency = DEFAULT_UPLOAD_CONCURRENCY,
  accept,
  disabled = false,
  validateFile,
  onSuccess,
  onError,
  buttonLabel = "ອັບໂຫຼດ file ຂະຫນາດໃຫຍ່ (Chunk)",
  hint,
  showKey = false,
  enableDrop = true,
  className,
}: ChunkFileUploadProps) {
  const inputId = useId();
  const dragDepth = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<{
    loaded: number;
    total: number;
  } | null>(null);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const validationError = validateFile?.(file) ?? null;
      if (validationError) {
        setError(validationError);
        onError?.(new Error(validationError));
        return;
      }

      setError(null);
      setLastKey(null);
      setUploading(true);
      setProgress({ loaded: 0, total: file.size });
      try {
        const key = await uploadLargeFileInChunks(file, {
          keyPrefix,
          chunkSize,
          concurrency,
          onProgress: (loaded, total) => setProgress({ loaded, total }),
        });
        setLastKey(key);
        setProgress(null);
        onSuccess?.(key, file);
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err.message);
        setProgress(null);
        onError?.(err);
      } finally {
        setUploading(false);
      }
    },
    [keyPrefix, chunkSize, concurrency, validateFile, onSuccess, onError],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void handleFile(file);
      e.target.value = "";
    },
    [handleFile],
  );

  const openFilePicker = useCallback(() => {
    if (uploading || disabled) return;
    document.getElementById(inputId)?.click();
  }, [inputId, uploading, disabled]);

  const onDragEnter = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!enableDrop || uploading || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current += 1;
      setIsDragging(true);
    },
    [enableDrop, uploading, disabled],
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!enableDrop || uploading || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setIsDragging(false);
      }
    },
    [enableDrop, uploading, disabled],
  );

  const onDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!enableDrop || uploading || disabled) return;
      e.preventDefault();
      e.stopPropagation();
    },
    [enableDrop, uploading, disabled],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (!enableDrop || uploading || disabled) return;
      e.preventDefault();
      e.stopPropagation();
      dragDepth.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void handleFile(file);
    },
    [enableDrop, uploading, disabled, handleFile],
  );

  const progressPercent =
    progress && progress.total > 0
      ? Math.round((progress.loaded / progress.total) * 100)
      : 0;

  const busy = uploading || disabled;
  const usesMultipart =
    progress != null && progress.total > DEFAULT_CHUNK_SIZE;

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="file"
        accept={accept}
        onChange={onInputChange}
        disabled={busy}
        className="hidden"
        id={inputId}
      />

      {enableDrop ? (
        <button
          type="button"
          disabled={busy}
          onClick={openFilePicker}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors",
            busy && "pointer-events-none opacity-60",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50",
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
          <div className="space-y-1">
            <p className="font-medium text-sm">
              {uploading
                ? `ກຳລັງອັບໂຫຼດ... ${progressPercent}%`
                : isDragging
                  ? "ວາງໄຟລ໌ທີ່ນີ້"
                  : "ລາກແລະວາງໄຟລ໌ ຫຼື ກົດເພື່ອເລືອກ"}
            </p>
            {!uploading && (
              <p className="text-muted-foreground text-xs">{buttonLabel}</p>
            )}
          </div>
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={openFilePicker}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="ml-2">
              {uploading ? `ກຳລັງອັບໂຫຼດ... ${progressPercent}%` : buttonLabel}
            </span>
          </Button>
        </div>
      )}

      {progress && progress.total > 0 && (
        <div className="space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
            {usesMultipart
              ? ` · chunk ${formatChunkSize(chunkSize)}`
              : ""}
          </p>
        </div>
      )}

      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      {showKey && lastKey && (
        <p className="break-all text-muted-foreground text-xs">
          ອັບໂຫຼດແລ້ວ: <code className="rounded bg-muted px-1">{lastKey}</code>
        </p>
      )}
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
