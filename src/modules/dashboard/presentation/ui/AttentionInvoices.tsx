import { Link } from "@tanstack/react-router";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/kit";
import { formatDateLocal } from "@/shared/lib/date-time";
import type { DashboardSummary } from "../api/client";

const STATUS_LABEL: Record<string, string> = {
  issued: "ອອກແລ້ວ",
  partial: "ຊຳລະບາງສ່ວນ",
};

type Props = {
  items?: DashboardSummary["attentionInvoices"];
  isLoading?: boolean;
};

export function AttentionInvoices({ items, isLoading }: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{"ໃບເກັບເງິນທີ່ຕ້ອງເກັບ"}</CardTitle>
          <CardDescription>{"ລາຍການຄ້າງຊຳລະລ່າສຸດ"}</CardDescription>
        </div>
        <Link
          to="/app/invoices"
          className="text-primary text-sm hover:underline"
        >
          {"ເບິ່ງທັງໝົດ"}
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3 first:pt-0">
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : !items?.length ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            {"ບໍ່ມີໃບເກັບເງິນຄ້າງຊຳລະ"}
          </p>
        ) : (
          items.map((inv) => {
            const overdue =
              inv.dueDate != null && new Date(inv.dueDate) < new Date();
            return (
              <Link
                key={inv.id}
                to="/app/invoices/$id/edit"
                params={{ id: inv.id }}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">
                    {inv.number} · {inv.customerName}
                  </p>
                  <p className="truncate text-muted-foreground text-xs">
                    {inv.dueDate
                      ? `ຄົບກຳນົດ ${formatDateLocal(inv.dueDate)}`
                      : "ບໍ່ລະບຸກຳນົດ"}
                    {overdue ? " · ເກີນກຳນົດ" : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-medium text-sm tabular-nums">
                    {inv.remaining.toLocaleString()} {inv.currency}
                  </span>
                  <Badge variant={overdue ? "destructive" : "secondary"}>
                    {STATUS_LABEL[inv.status] ?? inv.status}
                  </Badge>
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
