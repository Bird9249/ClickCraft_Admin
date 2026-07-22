import { Link } from "@tanstack/react-router";
import { FileText, Inbox, Receipt, Send, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/kit";
import type { DashboardSummary } from "../api/client";

function formatAmount(amount: number, currency: string) {
  return `${amount.toLocaleString()} ${currency}`;
}

type Props = {
  data?: DashboardSummary;
  isLoading?: boolean;
};

export function StatCards({ data, isLoading }: Props) {
  const overdueHint =
    data && data.overdueInvoicesCount > 0
      ? `ເກີນກຳນົດ ${data.overdueInvoicesCount} ໃບ`
      : "ໃບເກັບເງິນທີ່ຍັງບໍ່ຄົບ";

  const cards: Array<{
    key: string;
    label: string;
    value: string;
    hint: string;
    icon: typeof Inbox;
    href?: "/app/leads";
  }> = [
    {
      key: "new-leads",
      label: "Lead ໃໝ່",
      value: data ? String(data.newLeadsCount ?? 0) : "—",
      hint: "ຈາກ Website ຍັງບໍ່ຕິດຕໍ່",
      icon: Inbox,
      href: "/app/leads",
    },
    {
      key: "outstanding",
      label: "ຍອດຄ້າງຊຳລະ",
      value: data
        ? formatAmount(data.outstandingAmount, data.currency)
        : "—",
      hint: overdueHint,
      icon: Wallet,
    },
    {
      key: "open-invoices",
      label: "ໃບເກັບເງິນລໍຖ້າເກັບ",
      value: data ? String(data.openInvoicesCount) : "—",
      hint: "ສະຖານະ ອອກແລ້ວ / ບາງສ່ວນ",
      icon: Receipt,
    },
    {
      key: "quotations-open",
      label: "ໃບສະເໜີລາຄາລໍຖ້າ",
      value: data ? String(data.quotationsOpenCount) : "—",
      hint: "ຮ່າງ + ສົ່ງແລ້ວ",
      icon: Send,
    },
    {
      key: "received-month",
      label: "ຮັບເງິນເດືອນນີ້",
      value: data
        ? formatAmount(data.receivedThisMonth, data.currency)
        : "—",
      hint: data
        ? `${data.receiptsThisMonthCount} ໃບຮັບເງິນ`
        : "ຈາກໃບຮັບເງິນ",
      icon: FileText,
    },
  ];

  return (
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
                  <CardTitle className="font-semibold text-2xl tabular-nums">
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
            className={card.href ? "transition hover:bg-muted/30" : undefined}
          >
            {card.href ? (
              <Link to={card.href} className="block">
                {body}
              </Link>
            ) : (
              body
            )}
          </Card>
        );
      })}
    </div>
  );
}
