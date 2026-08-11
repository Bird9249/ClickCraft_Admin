import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Skeleton,
  type ChartConfig,
} from "@/components/kit";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { DashboardSummary } from "../api/client";

const chartConfig = {
  ledgerIncome: {
    label: "ລາຍຮັບ",
    color: "var(--chart-3)",
  },
  ledgerExpense: {
    label: "ລາຍຈ່າຍ",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

type Props = {
  data?: DashboardSummary["monthlySeries"];
  currency?: string;
  isLoading?: boolean;
};

export function LedgerCashflowChart({
  data,
  currency = "LAK",
  isLoading,
}: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{"ກະແສເງິນສົດ 6 ເດືອນ"}</CardTitle>
        <CardDescription>
          {"ລາຍຮັບ vs ລາຍຈ່າຍຈາກສະຫມຸດ ClickCraft"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <BarChart data={data ?? []} margin={{ left: 8, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v) =>
                  Number(v) >= 1_000_000
                    ? `${Math.round(Number(v) / 1_000_000)}M`
                    : Number(v) >= 1000
                      ? `${Math.round(Number(v) / 1000)}K`
                      : String(v)
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) =>
                      `${Number(value).toLocaleString()} ${currency}`
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="ledgerIncome"
                fill="var(--color-ledgerIncome)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="ledgerExpense"
                fill="var(--color-ledgerExpense)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
