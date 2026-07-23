import QRCode from "qrcode";
import { useEffect, useState } from "react";

type Props = {
  url: string;
  size?: number;
  className?: string;
};

export function ShareLinkQr({ url, size = 140, className }: Props) {
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
    <img
      src={dataUrl}
      alt="QR ລິ້ງແບ່ງປັນ"
      width={size}
      height={size}
      className={`rounded border bg-white ${className ?? ""}`}
    />
  );
}
