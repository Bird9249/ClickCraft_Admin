import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/kit";
import { Textarea } from "@/components/ui/textarea";
import type { ReleasePlatform } from "@/modules/distribution/domain/contracts";
import {
  distributionStorageSegment,
  distributionUploadAccept,
  distributionUploadHint,
  resolveDistributionContentType,
  validateDistributionFileClient,
  validateDistributionFileName,
} from "@/modules/distribution/domain/release-file-policy";
import { DEFAULT_CHUNK_SIZE } from "@/shared/lib/chunk-upload-s3";
import { sha256Hex } from "@/shared/lib/sha256-file";
import { ChunkFileUpload } from "@/shared/ui/ChunkFileUpload";
import { SimpleSelect } from "@/shared/ui/SimpleSelect";
import { useCreateRelease, useDistributionAppsQuery } from "../api/queries";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAppId?: string | null;
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadReleaseDialog({
  open,
  onOpenChange,
  defaultAppId,
}: Props) {
  const appsQuery = useDistributionAppsQuery();
  const createRelease = useCreateRelease();
  const apps = appsQuery.data?.data ?? [];

  const [platform, setPlatform] = useState<ReleasePlatform>("android");
  const [appId, setAppId] = useState("");
  const [version, setVersion] = useState("");
  const [buildNumber, setBuildNumber] = useState("");
  const [changelog, setChangelog] = useState("");
  const [fileKey, setFileKey] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [contentType, setContentType] = useState<string | null>(null);
  const [checksumSha256, setChecksumSha256] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPlatform("android");
    setAppId(defaultAppId || apps[0]?.id || "");
    setVersion("");
    setBuildNumber("");
    setChangelog("");
    setFileKey("");
    setFileName("");
    setFileSize(0);
    setContentType(null);
    setChecksumSha256(null);
    setHashing(false);
  }, [open, defaultAppId, apps]);

  const onPlatformChange = (next: ReleasePlatform) => {
    setPlatform(next);
    setFileKey("");
    setFileName("");
    setFileSize(0);
    setContentType(null);
    setChecksumSha256(null);
  };

  const selectedApp = apps.find((a) => a.id === appId) ?? null;
  const appOptions = useMemo(
    () =>
      apps.map((app) => ({
        value: app.id,
        label: `${app.name} (${app.slug})`,
      })),
    [apps],
  );

  const keyPrefix = useMemo(() => {
    const slug = selectedApp?.slug ?? "app";
    const ver = version.trim() || "pending";
    const build = buildNumber.trim() || "pending";
    const segment = distributionStorageSegment(platform);
    return `uploads/distribution/${slug}/${segment}/${ver}-${build}`;
  }, [selectedApp?.slug, version, buildNumber, platform]);

  const fileValid =
    !!fileName && validateDistributionFileName(platform, fileName) === null;

  const canSubmit =
    !!selectedApp &&
    version.trim().length > 0 &&
    buildNumber.trim().length > 0 &&
    !!fileKey &&
    fileValid &&
    fileSize > 0 &&
    !hashing &&
    !createRelease.isPending;

  const onSubmit = async () => {
    if (!selectedApp || !canSubmit) return;
    await createRelease.mutateAsync({
      appId: selectedApp.id,
      platform,
      version: version.trim(),
      buildNumber: buildNumber.trim(),
      fileKey,
      fileName,
      fileSize,
      contentType,
      checksumSha256,
      changelog: changelog.trim() || null,
    });
    onOpenChange(false);
  };

  const fileLabel = platform === "android" ? "ໄຟລ໌ APK" : "ໄຟລ໌ (ZIP / ທົ່ວໄປ)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ອັບໂຫຼດ release</DialogTitle>
          <DialogDescription>
            Android (.apk), ZIP ຫຼື ໄຟລ໌ທົ່ວໄປ — ຄິດໄລ່ SHA-256 ຫຼັງອັບໂຫຼດ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <p className="font-medium text-sm">ປະເພດ</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={platform === "android" ? "default" : "outline"}
                onClick={() => onPlatformChange("android")}
              >
                Android (APK)
              </Button>
              <Button
                type="button"
                size="sm"
                variant={platform === "file" ? "default" : "outline"}
                onClick={() => onPlatformChange("file")}
              >
                ZIP / ໄຟລ໌ທົ່ວໄປ
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-sm">ແອັບ</p>
            <SimpleSelect
              value={appId || undefined}
              onValueChange={setAppId}
              disabled={apps.length === 0}
              options={appOptions}
              placeholder={apps.length === 0 ? "ຍັງບໍ່ມີແອັບ" : "ເລືອກແອັບ"}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <p className="font-medium text-sm">ເວີຊັນ</p>
              <Input
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0.0"
              />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-sm">ເລກ build</p>
              <Input
                value={buildNumber}
                onChange={(e) => setBuildNumber(e.target.value)}
                placeholder="1"
              />
            </div>
          </div>

          <div className="space-y-1">
            <p className="font-medium text-sm">ສິ່ງທີ່ປ່ຽນ</p>
            <Textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              placeholder="ສິ່ງທີ່ປ່ຽນໃນເວີຊັນນີ້"
              rows={3}
            />
          </div>

          <div className="space-y-1">
            <p className="font-medium text-sm">{fileLabel}</p>
            <ChunkFileUpload
              key={`${platform}-${keyPrefix}`}
              keyPrefix={keyPrefix}
              chunkSize={DEFAULT_CHUNK_SIZE}
              accept={distributionUploadAccept(platform)}
              buttonLabel={
                platform === "android" ? "ເລືອກໄຟລ໌ APK" : "ເລືອກໄຟລ໌"
              }
              hint={distributionUploadHint(platform)}
              disabled={hashing || createRelease.isPending}
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
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ຍົກເລີກ
          </Button>
          <Button disabled={!canSubmit} onClick={onSubmit}>
            {createRelease.isPending ? "ກໍຳລັງບັນທຶກ..." : "ສ້າງຮ່າງ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
