import { useParams } from "@tanstack/react-router";
import { Download } from "lucide-react";
import symbolUrl from "@/assets/brand/symbol.webp";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/kit";
import { cn } from "@/lib/utils";
import { formatDateLocal } from "@/shared/lib/date-time";
import { distributionApi } from "../api/client";
import { usePublicShareMeta } from "../api/queries";

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorMessage(code: string | undefined): string {
  switch (code) {
    case "REVOKED":
      return "ລິ້ງດາວໂຫຼດນີ້ຖືກຖອນແລ້ວ.";
    case "EXPIRED":
      return "ລິ້ງດາວໂຫຼດນີ້ໝົດອາຍຸແລ້ວ.";
    case "QUOTA":
      return "ລິ້ງດາວໂຫຼດນີ້ໃຊ້ຄົບຈໍຳນວນທີ່ກໍຳນົດແລ້ວ.";
    case "UNAVAILABLE":
      return "release ນີ້ບໍ່ພ້ອມໃຫ້ດາວໂຫຼດອີກ.";
    case "NOT_FOUND":
      return "ລິ້ງດາວໂຫຼດບໍ່ຖືກຕ້ອງ.";
    case "RATE_LIMIT":
      return "ຂໍເກີນຄວາມຖີ່. ລອງໃໝ່ພາຍຫຼັງ.";
    default:
      return "ໂຫຼດລິ້ງດາວໂຫຼດບໍ່ສໍເລັດ.";
  }
}

export function PublicDownloadPage() {
  const { token } = useParams({ from: "/d/$token" });
  const meta = usePublicShareMeta(token);
  const errorCode =
    meta.error && typeof meta.error === "object" && "code" in meta.error
      ? String((meta.error as { code?: string }).code)
      : undefined;

  const appName = meta.data?.appName ?? "ດາວໂຫຼດແອັບ";

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,oklch(0.656_0.118_181.7/0.16),transparent_55%),radial-gradient(ellipse_55%_40%_at_100%_100%,oklch(0.971_0.003_285.7),transparent_60%),radial-gradient(ellipse_45%_35%_at_0%_90%,oklch(0.95_0.02_181.7/0.55),transparent_55%)]"
      />
      <div
        aria-hidden
        className="mask-[radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)] pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,oklch(0.93_0.003_285.7)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.93_0.003_285.7)_1px,transparent_1px)] bg-size-[48px_48px] opacity-[0.28]"
      />

      <header className="relative z-10 flex items-center justify-center px-5 pt-8 sm:pt-10">
        <Logo />
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-10 sm:py-14">
        <div
          className={cn(
            "flex flex-col items-center text-center",
            "fade-in-0 slide-in-from-bottom-3 animate-in fill-mode-both duration-500",
            "motion-reduce:animate-none",
          )}
        >
          <img
            src={symbolUrl}
            alt=""
            aria-hidden
            className="cc-float mb-7 size-16 object-contain opacity-95 sm:size-[4.5rem]"
          />

          <p className="font-semibold text-primary text-xs uppercase tracking-[0.22em]">
            Android
          </p>

          <h1 className="mt-3 max-w-md text-balance font-bold text-3xl text-foreground tracking-tight sm:text-4xl">
            {appName}
          </h1>

          {meta.isLoading && (
            <p className="mt-4 text-muted-foreground text-sm">ກໍຳລັງໂຫຼດ...</p>
          )}

          {meta.isError && (
            <div className="mt-6 max-w-sm space-y-2">
              <p className="font-medium text-base text-destructive">
                {errorMessage(errorCode)}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                ຖ້າຍັງຕ້ອງການ build ນີ້ ຂໍລິ້ງໃໝ່ຈາກຜູ້ສົ່ງ
              </p>
            </div>
          )}

          {meta.data && (
            <>
              <p className="mt-3 max-w-sm text-pretty text-base text-muted-foreground leading-relaxed">
                ເວີຊັນ {meta.data.version} ({meta.data.buildNumber}) ·{" "}
                {formatBytes(meta.data.fileSize)}
              </p>

              <div className="mt-8 w-full max-w-sm">
                <Button
                  className="h-12 w-full text-base transition-transform duration-200 hover:scale-[1.02] active:scale-[0.99] motion-reduce:transition-none motion-reduce:hover:scale-100"
                  size="lg"
                  onClick={() => {
                    window.location.href =
                      distributionApi.publicDownloadUrl(token);
                  }}
                >
                  <Download className="h-5 w-5" />
                  ດາວໂຫຼດ APK
                </Button>
              </div>
            </>
          )}
        </div>

        {meta.data && (
          <div
            className={cn(
              "mx-auto mt-10 w-full max-w-sm space-y-6",
              "fade-in-0 slide-in-from-bottom-2 animate-in fill-mode-both delay-150 duration-700",
              "motion-reduce:animate-none",
            )}
          >
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-left text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">ໄຟລ໌</dt>
                <dd
                  className="mt-0.5 truncate font-medium"
                  title={meta.data.fileName}
                >
                  {meta.data.fileName}
                </dd>
              </div>
              {meta.data.expiresAt && (
                <div>
                  <dt className="text-muted-foreground text-xs">ລິ້ງໝົດອາຍຸ</dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDateLocal(meta.data.expiresAt)}
                  </dd>
                </div>
              )}
              {meta.data.maxDownloads != null && (
                <div>
                  <dt className="text-muted-foreground text-xs">ເຫຼືອດາວໂຫຼດ</dt>
                  <dd className="mt-0.5 font-medium">
                    {Math.max(
                      meta.data.maxDownloads - meta.data.downloadCount,
                      0,
                    )}{" "}
                    / {meta.data.maxDownloads}
                  </dd>
                </div>
              )}
              {meta.data.checksumSha256 && (
                <div className="col-span-2">
                  <dt className="text-muted-foreground text-xs">SHA-256</dt>
                  <dd className="mt-0.5 break-all font-mono text-[11px] text-muted-foreground leading-relaxed">
                    {meta.data.checksumSha256}
                  </dd>
                </div>
              )}
            </dl>

            {meta.data.changelog && (
              <div className="border-border/70 border-t pt-5 text-left">
                <p className="font-medium text-sm">ສິ່ງໃໝ່</p>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground text-sm leading-relaxed">
                  {meta.data.changelog}
                </p>
              </div>
            )}

            <p className="text-muted-foreground text-xs leading-relaxed">
              ໃນ Android ອາດຕ້ອງອະນຸຍາດຕິດຕັ້ງຈາກແຫຼ່ງທີ່ບໍ່ຮູ້ຈັກ browser ຫຼື ໄຟລ໌ manager
              ກ່ອນຕິດຕັ້ງ APK.
            </p>
          </div>
        )}
      </main>

      <footer className="relative z-10 px-5 pb-8 text-center text-muted-foreground text-xs">
        ClickCraft
      </footer>
    </div>
  );
}
