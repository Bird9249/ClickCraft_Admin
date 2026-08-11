import { cn } from "@/lib/utils";
import type { LedgerSummaryDTO } from "../api/client";
import { formatLak } from "../lib/ledger-constants";

type Props = {
  summary?: LedgerSummaryDTO;
  isLoading?: boolean;
};

export function LedgerSummaryCards({ summary, isLoading }: Props) {
  const cards = [
    {
      label: "ລາຍຮັບລວມ",
      value: summary?.totalIncome ?? 0,
      className: "text-emerald-600",
    },
    {
      label: "ລາຍຈ່າຍລວມ",
      value: summary?.totalExpense ?? 0,
      className: "text-red-600",
    },
    {
      label: "ຄົງເຫຼືອສະສົມ",
      value: summary?.balance ?? 0,
      className: "text-primary",
    },
  ];

  return (
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border bg-card px-4 py-3 shadow-sm"
        >
          <p className="text-muted-foreground text-sm">{card.label}</p>
          <p
            className={cn(
              "mt-1 font-semibold font-mono text-xl tabular-nums",
              card.className,
              isLoading && "animate-pulse opacity-60",
            )}
          >
            {formatLak(card.value)}
          </p>
        </div>
      ))}
    </div>
  );
}
