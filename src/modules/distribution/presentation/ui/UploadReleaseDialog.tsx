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
    return `uploads/distribution/${slug}/android/${ver}-${build}`;
  }, [selectedApp?.slug, version, buildNumber]);

  const canSubmit =
    !!selectedApp &&
    version.trim().length > 0 &&
    buildNumber.trim().length > 0 &&
    !!fileKey &&
    fileName.toLowerCase().endsWith(".apk") &&
    fileSize > 0 &&
    !hashing &&
    !createRelease.isPending;

  const onSubmit = async () => {
    if (!selectedApp || !canSubmit) return;
    await createRelease.mutateAsync({
      appId: selectedApp.id,
      platform: "android",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>ອັບໂຫຼດ Android release</DialogTitle>
          <DialogDescription>
            ຮອງຮັບແຕ່ໄຟລ໌ .apk — ຄິດໄລ່ SHA-256 ຫຼັງອັບໂຫຼດເພື່ອກວດສອບ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
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
            <p className="font-medium text-sm">ໄຟລ໌ APK</p>
            <ChunkFileUpload
              keyPrefix={keyPrefix}
              accept=".apk,application/vnd.android.package-archive"
              buttonLabel="ເລືອກໄຟລ໌ APK"
              hint="ແນະນຳໃຫ້ກໍຳນົດ version/build ກ່ອນອັບໂຫຼດ"
              onSuccess={async (key, file) => {
                setFileKey(key);
                setFileName(file.name);
                setFileSize(file.size);
                setContentType(file.type || null);
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
