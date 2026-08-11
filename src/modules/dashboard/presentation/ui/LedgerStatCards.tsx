import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/kit";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Link2,
  Scale,
  Wallet,
} from "lucide-react";
import type { DashboardSummary } from "../api/client";

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`;
}

type Props = {
  data?: DashboardSummary;
  isLoading?: boolean;
};

export function LedgerStatCards({ data, isLoading }: Props) {
  const ledger = data?.ledger;
  const currency = data?.currency ?? "LAK";
  const unlinkedTotal =
    (ledger?.unlinkedLedgerCount ?? 0) + (ledger?.unlinkedPaymentCount ?? 0);

  const cards: Array<{
    key: string;
    label: string;
    value: string;
    hint: string;
    icon: typeof Wallet;
    href?: "/app/ledger";
    valueClassName?: string;
  }> = [
      {
        key: "balance",
        label: "ເງິນຄົງເຫຼືອ (Ledger)",
        value: ledger ? formatAmount(ledger.balance, currency) : "—",
        hint: ledger
          ? `${ledger.entryCount.toLocaleString()} ລາຍການໃນສະຫມຸດ`
          : "ຍອດສະສົມລາຍຮັບ − ລາຍຈ່າຍ",
        icon: Scale,
        href: "/app/ledger",
      },
      {
        key: "income-month",
        label: "ລາຍຮັບເດືອນນີ້",
        value: ledger ? formatAmount(ledger.incomeThisMonth, currency) : "—",
        hint: ledger
          ? `ລວມ ${formatAmount(ledger.totalIncome, currency)}`
          : "ຈາກສະຫມຸດລາຍຮັບ-ລາຍຈ່າຍ",
        icon: ArrowUpCircle,
        valueClassName: "text-emerald-600",
        href: "/app/ledger",
      },
      {
        key: "expense-month",
        label: "ລາຍຈ່າຍເດືອນນີ້",
        value: ledger ? formatAmount(ledger.expenseThisMonth, currency) : "—",
        hint: ledger
          ? `ລວມ ${formatAmount(ledger.totalExpense, currency)}`
          : "ຄ່າໃຊ້ຈ່າຍດຳເນີນງານ",
        icon: ArrowDownCircle,
        valueClassName: "text-red-600",
        href: "/app/ledger",
      },
      {
        key: "net-month",
        label: "ສຸດທິເດືອນນີ້",
        value: ledger ? formatAmount(ledger.netThisMonth, currency) : "—",
        hint: "ລາຍຮັບ − ລາຍຈ່າຍ ເດືອນນີ້",
        icon: Wallet,
        href: "/app/ledger",
      },
      {
        key: "unlinked",
        label: "ຄ້າງຈັດຄູ່",
        value: ledger ? String(unlinkedTotal) : "—",
        hint: ledger
          ? `Ledger ${ledger.unlinkedLedgerCount} · Payment ${ledger.unlinkedPaymentCount}`
          : "ລາຍການທີ່ຍັງບໍ່ຜູກກັນ",
        icon: Link2,
        href: "/app/ledger",
      },
    ];

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-semibold text-lg">ສະຫມຸດເງິນສົດ (ClickCraft)</h2>
        <p className="text-muted-foreground text-sm">
          ພາບລວມລາຍຮັບ-ລາຍຈ່າຍຈິງ — ແຍກຈາກໃບຮັບເງິນ (AR)
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          const body = (
            <>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                <div className="space-y-1.5">
                  <CardDescription>{card.label}</CardDescription>
                  {isLoading ? (
                    <Skeleton className="h-8 w-28" />
                  ) : (
                    <CardTitle
                      className={`font-semibold text-2xl tabular-nums ${card.valueClassName ?? ""}`}
                    >
                      {card.value}
                    </CardTitle>
                  )}
                </div>
                <div className="rounded-md bg-primary/10 p-2 text-primary">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-4 w-36" />
                ) : (
                  <p className="text-muted-foreground text-sm">{card.hint}</p>
                )}
              </CardContent>
            </>
          );
          return (
            <Card
              key={card.key}
              className="transition hover:bg-muted/30"
            >
              <Link to={card.href ?? "/app/ledger"} className="block">
                {body}
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
