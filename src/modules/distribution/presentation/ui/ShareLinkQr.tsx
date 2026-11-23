import { Download } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button } from "@/components/kit";

type Props = {
  url: string;
  size?: number;
  className?: string;
  /** ชื่อไฟล์เมื่อกดดาวน์โหลด QR (default: share-link-qr.png) */
  downloadName?: string;
};

export function ShareLinkQr({
  url,
  size = 140,
  className,
  downloadName = "share-link-qr.png",
}: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: size,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((value) => {
        if (!cancelled) setDataUrl(value);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  const onDownloadQr = () => {
    if (!dataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = downloadName.endsWith(".png")
      ? downloadName
      : `${downloadName}.png`;
    anchor.click();
  };

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded border bg-muted text-muted-foreground text-xs ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        QR
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center gap-2 ${className ?? ""}`}>
      <img
        src={dataUrl}
        alt="QR ລິ້ງດາວໂຫຼດ"
        width={size}
        height={size}
        className="rounded border bg-white"
      />
      <Button type="button" size="sm" variant="outline" onClick={onDownloadQr}>
        <Download className="h-4 w-4" />
        ດາວໂຫຼດ QR
      </Button>
    </div>
  );
}
