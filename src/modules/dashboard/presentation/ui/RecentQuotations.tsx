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
  draft: "ຮ່າງ",
  sent: "ສົ່ງແລ້ວ",
  accepted: "ຍອມຮັບ",
  rejected: "ປະຕິເສດ",
  void: "ຍົກເລີກ",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  draft: "secondary",
  sent: "default",
  accepted: "default",
  rejected: "destructive",
  void: "outline",
};

type Props = {
  items?: DashboardSummary["recentQuotations"];
  isLoading?: boolean;
};

export function RecentQuotations({ items, isLoading }: Props) {
  return (
    <Card className="lg:col-span-1">
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{"ໃບສະເໜີລາຄາຫລ້າສຸດ"}</CardTitle>
          <CardDescription>{"5 ລາຍການທີ່ອັບເດດລ່າສຸດ"}</CardDescription>
        </div>
        <Link
          to="/app/quotations"
          className="text-primary text-sm hover:underline"
        >
          {"ເບິ່ງທັງໝົດ"}
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col divide-y">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="py-3 first:pt-0">
              <Skeleton className="h-10 w-full" />
            </div>
          ))
        ) : !items?.length ? (
          <p className="py-6 text-center text-muted-foreground text-sm">
            {"ຍັງບໍ່ມີໃບສະເໜີລາຄາ — "}
            <Link
              to="/app/quotations/create"
              className="text-primary hover:underline"
            >
              {"ສ້າງໃບໃໜ່"}
            </Link>
          </p>
        ) : (
          items.map((q) => (
            <Link
              key={q.id}
              to="/app/quotations/$id/edit"
              params={{ id: q.id }}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 hover:bg-muted/40"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {q.number} · {q.customerName}
                </p>
                <p className="truncate text-muted-foreground text-xs">
                  {formatDateLocal(q.issueDate)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-medium text-sm tabular-nums">
                  {q.total.toLocaleString()} {q.currency}
                </span>
                <Badge variant={STATUS_VARIANT[q.status] ?? "secondary"}>
                  {STATUS_LABEL[q.status] ?? q.status}
                </Badge>
              </div>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
