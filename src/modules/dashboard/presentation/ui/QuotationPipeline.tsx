import { Link } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/kit";
import type { DashboardSummary } from "../api/client";

const STAGES = [
  { key: "draft", label: "ຮ່າງ" },
  { key: "sent", label: "ສົ່ງແລ້ວ" },
  { key: "accepted", label: "ຍອມຮັບ" },
  { key: "rejected", label: "ປະຕິເສດ" },
] as const;

type Props = {
  pipeline?: DashboardSummary["quotationPipeline"];
  isLoading?: boolean;
};

export function QuotationPipeline({ pipeline, isLoading }: Props) {
  const total = pipeline
    ? STAGES.reduce((sum, s) => sum + pipeline[s.key], 0)
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>{"Pipeline ໃບສະເໜີລາຄາ"}</CardTitle>
          <CardDescription>{"ຈຳນວນຕາມສະຖານະ"}</CardDescription>
        </div>
        <Link
          to="/app/quotations"
          className="text-primary text-sm hover:underline"
        >
          {"ເປີດລາຍການ"}
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))
        ) : (
          STAGES.map((stage) => {
            const count = pipeline?.[stage.key] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={stage.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{stage.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-[width]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
