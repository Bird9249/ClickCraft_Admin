import { useState } from "react";
import {
  Button,
  confirm,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from "@/components/kit";
import { formatDateLocal, formatDateTimeLocal } from "@/shared/lib/date-time";
import { type ShareLinkRow, shareLinkAbsoluteUrl } from "../api/client";
import {
  useCreateShareLink,
  useRevokeShareLink,
  useShareLinksQuery,
} from "../api/queries";
import { ShareLinkQr } from "./ShareLinkQr";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  releaseId: string;
  releaseLabel: string;
  canWrite?: boolean;
};

function linkStatus(link: ShareLinkRow): string {
  if (link.revokedAt) return "ຖອນແລ້ວ";
  if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
    return "ໝົດອາຍຸ";
  }
  if (link.maxDownloads != null && link.downloadCount >= link.maxDownloads) {
    return "ຄົບໂຄວຕາ";
  }
  return "ໃຊ້ງານ";
}

export function ShareLinksPanel({
  open,
  onOpenChange,
  releaseId,
  releaseLabel,
  canWrite,
}: Props) {
  const linksQuery = useShareLinksQuery(releaseId, open);
  const createLink = useCreateShareLink(releaseId);
  const revokeLink = useRevokeShareLink(releaseId);
  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<1 | 7 | 30>(7);
  const [maxDownloads, setMaxDownloads] = useState("");
  const [qrLinkId, setQrLinkId] = useState<string | null>(null);

  const onCreate = async () => {
    const parsedMax = maxDownloads.trim()
      ? Number.parseInt(maxDownloads.trim(), 10)
      : null;
    await createLink.mutateAsync({
      label: label.trim() || null,
      expiresInDays,
      maxDownloads:
        parsedMax && Number.isFinite(parsedMax) && parsedMax > 0
          ? parsedMax
          : null,
    });
    setLabel("");
    setExpiresInDays(7);
    setMaxDownloads("");
  };

  const onCopy = async (link: ShareLinkRow) => {
    const url = shareLinkAbsoluteUrl(link.publicPath);
    try {
      await navigator.clipboard.writeText(url);
      toast.success("ສໍເນົາລິ້ງແລ້ວ");
    } catch {
      toast.error("ສໍເນົາລິ້ງບໍ່ສໍເລັດ");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>ລິ້ງແບ່ງປັນ</DialogTitle>
          <DialogDescription>
            ຜູ້ທົດສອບພາຍນອກດາວໂຫຼດໄດ້ໂດຍບໍ່ຕ້ອງມີບັນຊີ Admin. Release: {releaseLabel}
          </DialogDescription>
        </DialogHeader>

        {canWrite && (
          <div className="space-y-3 rounded-lg border p-3">
            <p className="font-medium text-sm">ສ້າງລິ້ງແບ່ງປັນ</p>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ປ້າຍຊື່ (ບໍ່ບັງຄັບ) ເຊັ່ນ ລູກຄ້າ A"
            />
            <div className="flex flex-wrap gap-2">
              {([1, 7, 30] as const).map((days) => (
                <Button
                  key={days}
                  type="button"
                  size="sm"
                  variant={expiresInDays === days ? "default" : "outline"}
                  onClick={() => setExpiresInDays(days)}
                >
                  {days}d
                </Button>
              ))}
            </div>
            <Input
              type="number"
              min={1}
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(e.target.value)}
              placeholder="ຈໍຳນວນດາວໂຫຼດສູງສຸດ (ບໍ່ບັງຄັບ)"
            />
            <Button
              onClick={onCreate}
              disabled={createLink.isPending}
              className="w-full sm:w-auto"
            >
              {createLink.isPending ? "ກໍຳລັງສ້າງ..." : "ສ້າງລິ້ງແບ່ງປັນ"}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {linksQuery.isLoading && (
            <p className="text-muted-foreground text-sm">ກໍຳລັງໂຫຼດລິ້ງ...</p>
          )}
          {!linksQuery.isLoading &&
            (linksQuery.data?.data?.length ?? 0) === 0 && (
              <p className="text-muted-foreground text-sm">ຍັງບໍ່ມີລິ້ງ</p>
            )}
          {linksQuery.data?.data?.map((link) => {
            const status = linkStatus(link);
            const url = shareLinkAbsoluteUrl(link.publicPath);
            const showQr = qrLinkId === link.id;
            return (
              <div
                key={link.id}
                className="space-y-2 rounded-lg border p-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{link.label || "ລິ້ງບໍ່ມີຊື່"}</p>
                    <p className="text-muted-foreground text-xs">
                      {status} · {link.downloadCount}
                      {link.maxDownloads != null
                        ? ` / ${link.maxDownloads}`
                        : ""}
                      ຄັ້ງດາວໂຫຼດ
                      {link.expiresAt
                        ? ` · ໝົດອາຍຸ ${formatDateLocal(link.expiresAt)}`
                        : ""}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      ດາວໂຫຼດລ່າສຸດ:
                      {link.lastDownloadedAt
                        ? formatDateTimeLocal(link.lastDownloadedAt)
                        : "ຍັງບໍ່ເຄີຍ"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onCopy(link)}
                      disabled={status !== "ໃຊ້ງານ"}
                    >
                      ສໍເນົາ
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setQrLinkId((prev) =>
                          prev === link.id ? null : link.id,
                        )
                      }
                      disabled={status !== "ໃຊ້ງານ"}
                    >
                      QR
                    </Button>
                    {canWrite && status === "ໃຊ້ງານ" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const ok = await confirm({
                            title: "ຖອນລິ້ງນີ້?",
                            description: "ຜູ້ທົດສອບຈະດາວໂຫຼດບໍ່ໄດ້ອີກ.",
                          });
                          if (ok) revokeLink.mutate(link.id);
                        }}
                      >
                        ຖອນ
                      </Button>
                    )}
                  </div>
                </div>
                <p className="break-all font-mono text-muted-foreground text-xs">
                  {url}
                </p>
                {showQr && (
                  <div className="flex justify-center pt-1">
                    <ShareLinkQr url={url} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ປິດ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
