import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Skeleton,
} from "@/components/kit";
import type { DashboardSummary } from "../api/client";

const chartConfig = {
  quotations: {
    label: "ໃບສະເໜີລາຄາ",
    color: "var(--chart-1)",
  },
  leads: {
    label: "Lead",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type Props = {
  data?: DashboardSummary["monthlySeries"];
  isLoading?: boolean;
};

export function ActivityChart({ data, isLoading }: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{"ການເຄື່ອນໄຫວ 6 ເດືອນ"}</CardTitle>
        <CardDescription>
          {"ຈຳນວນ Lead ຈາກ Website ແລະ ໃບສະເໜີລາຄາທີ່ສ້າງ"}
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
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="leads"
                fill="var(--color-leads)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="quotations"
                fill="var(--color-quotations)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
