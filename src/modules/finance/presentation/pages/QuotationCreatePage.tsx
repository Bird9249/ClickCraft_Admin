import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { useCreateQuotation } from "../api/queries";
import { buildQuotationPayload } from "../lib/quotation-form-payload";
import { QuotationForm } from "../ui/QuotationForm";

export function QuotationCreatePage() {
  const nav = useNavigate({ from: "/app/quotations/create" });
  const createQuotation = useCreateQuotation();

  return (
    <>
      <Header />
      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              ສ້າງໃບສະເໜີລາຄາ
            </h2>
            <p className="text-muted-foreground">ສ້າງໃບສະເໜີລາຄາໃໝ່.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/quotations" })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <div className="mt-6 rounded-xl border bg-card p-6">
          <QuotationForm
            onSubmit={async (vals) => {
              try {
                const payload = buildQuotationPayload(vals);
                await createQuotation.mutateAsync(payload);
                toast.success("ສ້າງໃບສະເໜີລາຄາສໍາເລັດ");
                nav({ to: "/app/quotations" });
              } catch {
                // handled by mutation
              }
            }}
            submitting={createQuotation.isPending}
          />
        </div>
      </Main>
    </>
  );
}
