import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/kit";
import type { ReleasePlatform } from "@/modules/distribution/domain/contracts";
import {
  distributionStorageSegment,
  distributionUploadAccept,
  distributionUploadHint,
  platformDisplayLabel,
  resolveDistributionContentType,
  validateDistributionFileClient,
  validateDistributionFileName,
} from "@/modules/distribution/domain/release-file-policy";
import type { ReleasesListResult } from "@/modules/distribution/domain/types";
import { DEFAULT_CHUNK_SIZE } from "@/shared/lib/chunk-upload-s3";
import { sha256Hex } from "@/shared/lib/sha256-file";
import { ChunkFileUpload } from "@/shared/ui/ChunkFileUpload";
import { useReplaceReleaseFile } from "../api/queries";

type ReleaseRow = ReleasesListResult["data"][number];

type Props = {
  release: ReleaseRow | null;
  onOpenChange: (open: boolean) => void;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReplaceReleaseFileDialog({ release, onOpenChange }: Props) {
  const replaceFile = useReplaceReleaseFile();
  const open = release != null;
  const platform = (release?.platform ?? "android") as ReleasePlatform;

  const [fileKey, setFileKey] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [contentType, setContentType] = useState<string | null>(null);
  const [checksumSha256, setChecksumSha256] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFileKey("");
    setFileName("");
    setFileSize(0);
    setContentType(null);
    setChecksumSha256(null);
    setHashing(false);
  }, [open, release?.id]);

  const keyPrefix = useMemo(() => {
    if (!release) return "uploads/distribution/pending";
    const slug = release.appSlug ?? "app";
    const segment = distributionStorageSegment(platform);
    return `uploads/distribution/${slug}/${segment}/${release.version}-${release.buildNumber}`;
  }, [release, platform]);

  const fileValid =
    !!fileName && validateDistributionFileName(platform, fileName) === null;

  const canSubmit =
    !!release &&
    !!fileKey &&
    fileValid &&
    fileSize > 0 &&
    fileKey !== release.fileKey &&
    !hashing &&
    !replaceFile.isPending;

  const onSubmit = async () => {
    if (!release || !canSubmit) return;
    await replaceFile.mutateAsync({
      id: release.id,
      input: {
        fileKey,
        fileName,
        fileSize,
        contentType,
        checksumSha256,
      },
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ແທນທີ່ໄຟລ໌</DialogTitle>
          <DialogDescription>
            {release
              ? `${release.appName} ${release.version} (${release.buildNumber}) · ${platformDisplayLabel(platform)} — ໄຟລ໌ເກົ່າຈະຖືກລຶບອອກຈາກ storage`
              : ""}
          </DialogDescription>
        </DialogHeader>

        {release && (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium">ໄຟລ໌ປັດຈຸບັນ</p>
              <p className="text-muted-foreground">
                {release.fileName} · {formatBytes(release.fileSize)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-medium text-sm">ໄຟລ໌ໃໝ່</p>
              <ChunkFileUpload
                keyPrefix={keyPrefix}
                chunkSize={DEFAULT_CHUNK_SIZE}
                accept={distributionUploadAccept(platform)}
                buttonLabel="ເລືອກໄຟລ໌ໃໝ່"
                hint={distributionUploadHint(platform)}
                disabled={hashing || replaceFile.isPending}
                validateFile={(file) =>
                  validateDistributionFileClient(platform, file)
                }
                onSuccess={async (key, file) => {
                  setFileKey(key);
                  setFileName(file.name);
                  setFileSize(file.size);
                  setContentType(
                    resolveDistributionContentType(file.name, file.type) ?? null,
                  );
                  setChecksumSha256(null);
                  setHashing(true);
                  try {
                    const hash = await sha256Hex(file);
                    setChecksumSha256(hash);
                  } catch {
                    setChecksumSha256(null);
                  } finally {
                    setHashing(false);
                  }
                }}
              />
              {fileKey && (
                <p className="text-muted-foreground text-xs">
                  {fileName} · {formatBytes(fileSize)}
                  {hashing
                    ? " · ກໍຳລັງຄິດໄລ່ hash..."
                    : checksumSha256
                      ? ` · sha256 ${checksumSha256.slice(0, 12)}…`
                      : ""}
                </p>
              )}
              {fileKey && fileKey === release.fileKey && (
                <p className="text-destructive text-xs">
                  ເລືອກໄຟລ໌ໃໝ່ທີ່ແຕກຕ່າງຈາກໄຟລ໌ປັດຈຸບັນ
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ຍົກເລີກ
          </Button>
          <Button disabled={!canSubmit} onClick={onSubmit}>
            {replaceFile.isPending ? "ກຳລັງບັນທຶກ..." : "ແທນທີ່ໄຟລ໌"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
