import { Link } from "@tanstack/react-router";
import { FilePlus2, Users } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button } from "@/components/kit";
import { usePermissions } from "@/modules/auth/presentation/model/usePermissions";
import { useDashboardSummaryQuery } from "../api/queries";
import { ActivityChart } from "../ui/ActivityChart";
import { AttentionInvoices } from "../ui/AttentionInvoices";
import { InvoiceStatusChart } from "../ui/InvoiceStatusChart";
import { QuotationPipeline } from "../ui/QuotationPipeline";
import { RecentQuotations } from "../ui/RecentQuotations";
import { RevenueChart } from "../ui/RevenueChart";
import { StatCards } from "../ui/StatCards";

export function DashboardPage() {
  const { has } = usePermissions();
  const canFinance = has("finance:read");
  const { data, isLoading, isError } = useDashboardSummaryQuery(canFinance);

  return (
    <>
      <Header />

      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="font-bold text-2xl tracking-tight">
              {"ແຜງຄວບຄຸມ"}
            </h1>
            <p className="text-muted-foreground">
              {
                "ພາບລວມງານ ClickCraft — pipeline ແລະຍອດຄ້າງຊຳລະ"
              }
            </p>
          </div>
          {canFinance ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <Link to="/app/customers">
                  <Users />
                  {"ລູກຄ້າ"}
                </Link>
              </Button>
              <Button asChild>
                <Link to="/app/quotations/create">
                  <FilePlus2 />
                  {"ສ້າງໃບສະເໜີລາຄາ"}
                </Link>
              </Button>
            </div>
          ) : null}
        </div>

        {!canFinance ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
            {
              "ບໍ່ມີສິດເບິ່ງຂໍ້ມູນການເງິນ — ຕິດຕໍ່ຜູ້ດູແລລະບົບເພື່ອເປີດສິດ "
            }
            <code className="text-xs">finance:read</code>
          </div>
        ) : isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center text-destructive text-sm">
            {"ໂຫລດຂໍ້ມູນແຜງຄວບຄຸມບໍ່ສຳເລັດ"}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <StatCards data={data} isLoading={isLoading} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <RevenueChart
                data={data?.monthlySeries}
                currency={data?.currency}
                isLoading={isLoading}
              />
              <InvoiceStatusChart
                data={data?.invoiceStatus}
                isLoading={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <ActivityChart
                data={data?.monthlySeries}
                isLoading={isLoading}
              />
              <QuotationPipeline
                pipeline={data?.quotationPipeline}
                isLoading={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <AttentionInvoices
                items={data?.attentionInvoices}
                isLoading={isLoading}
              />
              <RecentQuotations
                items={data?.recentQuotations}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </Main>
    </>
  );
}
