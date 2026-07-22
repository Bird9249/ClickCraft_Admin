import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

const chartConfig = {
  received: {
    label: "ຮັບເງິນ",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type Props = {
  data?: DashboardSummary["monthlySeries"];
  currency?: string;
  isLoading?: boolean;
};

export function RevenueChart({ data, currency = "LAK", isLoading }: Props) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>{"ຮັບເງິນ 6 ເດືອນ"}</CardTitle>
        <CardDescription>
          {"ຍອດຈາກໃບຮັບເງິນ (ບໍ່ລວມ void)"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="h-[260px] w-full">
            <AreaChart data={data ?? []} margin={{ left: 8, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="fillReceived" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-received)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-received)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
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
              <Area
                dataKey="received"
                type="monotone"
                fill="url(#fillReceived)"
                stroke="var(--color-received)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
