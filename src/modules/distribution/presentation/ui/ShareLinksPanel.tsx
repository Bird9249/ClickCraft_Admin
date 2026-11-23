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
import {
  type ShareLinkRow,
  shareLinkAbsoluteUrl,
  shareLinkDownloadAbsoluteUrl,
} from "../api/client";
import {
  useAddShareLinkDownloads,
  useCreateShareLink,
  useExtendShareLinkExpiry,
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

function canUseLinkActions(link: ShareLinkRow): boolean {
  return !link.revokedAt;
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
  const extendExpiry = useExtendShareLinkExpiry(releaseId);
  const addDownloads = useAddShareLinkDownloads(releaseId);
  const [label, setLabel] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<1 | 7 | 30>(7);
  const [maxDownloads, setMaxDownloads] = useState("");
  const [qrLinkId, setQrLinkId] = useState<string | null>(null);
  const [extendLinkId, setExtendLinkId] = useState<string | null>(null);
  const [quotaLinkId, setQuotaLinkId] = useState<string | null>(null);
  const [addDownloadsValue, setAddDownloadsValue] = useState("10");

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

  const onExtend = async (linkId: string, days: 1 | 7 | 30) => {
    await extendExpiry.mutateAsync({
      id: linkId,
      input: { expiresInDays: days },
    });
    setExtendLinkId(null);
  };

  const onAddQuota = async (linkId: string) => {
    const parsed = Number.parseInt(addDownloadsValue.trim(), 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("ກະລຸນາໃສ່ຈຳນວນດາວໂຫຼດທີ່ຕ້ອງການເພີ່ມ");
      return;
    }
    await addDownloads.mutateAsync({
      id: linkId,
      input: { addDownloads: parsed },
    });
    setQuotaLinkId(null);
    setAddDownloadsValue("10");
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
            const pageUrl = shareLinkAbsoluteUrl(link.publicPath);
            const qrDownloadUrl = shareLinkDownloadAbsoluteUrl(link.token);
            const showQr = qrLinkId === link.id;
            const showExtend = extendLinkId === link.id;
            const showQuota = quotaLinkId === link.id;
            const actionsEnabled = canUseLinkActions(link);
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
                    {canWrite && actionsEnabled && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setQuotaLinkId(null);
                            setExtendLinkId((prev) =>
                              prev === link.id ? null : link.id,
                            );
                          }}
                        >
                          ຕໍ່ອາຍຸ
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setExtendLinkId(null);
                            setQuotaLinkId((prev) =>
                              prev === link.id ? null : link.id,
                            );
                          }}
                        >
                          ເພີ່ມໂຄວຕາ
                        </Button>
                      </>
                    )}
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
                {showExtend && canWrite && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
                    <span className="text-muted-foreground text-xs">
                      ຕໍ່ອາຍຸເພີ່ມ:
                    </span>
                    {([1, 7, 30] as const).map((days) => (
                      <Button
                        key={days}
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={extendExpiry.isPending}
                        onClick={() => void onExtend(link.id, days)}
                      >
                        +{days}d
                      </Button>
                    ))}
                  </div>
                )}
                {showQuota && canWrite && (
                  <div className="flex flex-wrap items-center gap-2 rounded-md border border-dashed p-2">
                    <Input
                      type="number"
                      min={1}
                      className="h-8 w-28"
                      value={addDownloadsValue}
                      onChange={(e) => setAddDownloadsValue(e.target.value)}
                      placeholder="ຈຳນວນ"
                    />
                    <Button
                      type="button"
                      size="sm"
                      disabled={addDownloads.isPending}
                      onClick={() => void onAddQuota(link.id)}
                    >
                      ເພີ່ມດາວໂຫຼດ
                    </Button>
                  </div>
                )}
                <p className="break-all font-mono text-muted-foreground text-xs">
                  {pageUrl}
                </p>
                {showQr && (
                  <div className="flex flex-col items-center gap-1 pt-1">
                    <ShareLinkQr
                      url={qrDownloadUrl}
                      downloadName={`${link.label?.trim() || "share-link"}-qr.png`}
                    />
                    <p className="text-center text-muted-foreground text-xs">
                      ສະແກນ QR ເພື່ອດາວໂຫຼດໄຟລ໌ໂດຍກົງ
                    </p>
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
