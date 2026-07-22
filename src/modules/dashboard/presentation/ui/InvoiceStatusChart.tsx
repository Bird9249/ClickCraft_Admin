import { Cell, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  Skeleton,
} from "@/components/kit";
import type { DashboardSummary } from "../api/client";

const STATUS_META: Record<
  keyof NonNullable<DashboardSummary["invoiceStatus"]>,
  { label: string; color: string }
> = {
  draft: { label: "ຮ່າງ", color: "var(--chart-3)" },
  issued: { label: "ອອກແລ້ວ", color: "var(--chart-1)" },
  partial: { label: "ຊຳລະບາງສ່ວນ", color: "var(--chart-2)" },
  paid: { label: "ຊຳລະຄົບ", color: "var(--chart-4)" },
  void: { label: "ຍົກເລີກ", color: "var(--chart-5)" },
};

type Props = {
  data?: DashboardSummary["invoiceStatus"];
  isLoading?: boolean;
};

export function InvoiceStatusChart({ data, isLoading }: Props) {
  const chartData = (Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>)
    .map((key) => ({
      key,
      status: STATUS_META[key].label,
      count: data?.[key] ?? 0,
      fill: STATUS_META[key].color,
    }))
    .filter((row) => row.count > 0);

  const chartConfig = Object.fromEntries(
    (Object.keys(STATUS_META) as Array<keyof typeof STATUS_META>).map((key) => [
      key,
      { label: STATUS_META[key].label, color: STATUS_META[key].color },
    ]),
  ) satisfies ChartConfig;

  const total = chartData.reduce((sum, row) => sum + row.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"ສະຖານະໃບເກັບເງິນ"}</CardTitle>
        <CardDescription>{"ຈຳນວນຕາມສະຖານະປັດຈຸບັນ"}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="mx-auto h-[220px] w-[220px] rounded-full" />
        ) : total === 0 ? (
          <p className="py-16 text-center text-muted-foreground text-sm">
            {"ຍັງບໍ່ມີໃບເກັບເງິນ"}
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="mx-auto h-[220px] w-full">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="status"
                    formatter={(value) => `${Number(value).toLocaleString()} ໃບ`}
                  />
                }
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={48}
                outerRadius={80}
                strokeWidth={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        {!isLoading && total > 0 ? (
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm">
            {chartData.map((row) => (
              <li key={row.key} className="flex items-center gap-2">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: row.fill }}
                />
                <span className="truncate text-muted-foreground">{row.status}</span>
                <span className="ml-auto tabular-nums">{row.count}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
