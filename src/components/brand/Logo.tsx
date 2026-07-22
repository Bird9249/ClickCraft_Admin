import symbolUrl from "@/assets/brand/symbol.webp";
import { cn } from "@/lib/utils";

/**
 * ClickCraft wordmark. Accent (Craft Cyan) appears only in the trailing
 * pixel — never the full wordmark. Prefer either `showSymbol` or the pixel,
 * not both.
 */
export function Logo({
  tone = "dark",
  showSymbol = false,
  className,
}: {
  tone?: "dark" | "light";
  showSymbol?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex select-none items-center gap-2.5", className)}
    >
      {showSymbol ? (
        <img
          src={symbolUrl}
          alt=""
          aria-hidden
          className="size-8 shrink-0 object-contain"
        />
      ) : null}
      <span
        className={cn(
          "inline-flex items-baseline gap-1 font-semibold text-lg tracking-tight",
          tone === "light" ? "text-white" : "text-foreground",
        )}
      >
        <span>ClickCraft</span>
        {!showSymbol ? (
          <span
            aria-hidden
            className="mb-0.5 inline-block size-1.5 rounded-[1px] bg-primary"
          />
        ) : null}
      </span>
    </span>
  );
}
