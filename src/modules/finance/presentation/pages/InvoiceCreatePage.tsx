import { useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { useCreateInvoice } from "../api/queries";
import { InvoiceForm } from "../ui/InvoiceForm";

export function InvoiceCreatePage() {
  const nav = useNavigate({ from: "/app/invoices/create" });
  const createInvoice = useCreateInvoice();

  return (
    <>
      <Header />
      <Main>
        <div className="flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              ສ້າງໃບເກັບເງິນ
            </h2>
            <p className="text-muted-foreground">ສ້າງໃບເກັບເງິນໃໝ່.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => nav({ to: "/app/invoices" })}
          >
            <ArrowLeftIcon className="size-4" />
            ກັບຄືນ
          </Button>
        </div>

        <div className="mt-6 rounded-xl border bg-card p-6">
          <InvoiceForm
            onSubmit={async (vals) => {
              try {
                await createInvoice.mutateAsync({
                  customerId: vals.customerId,
                  issueDate: new Date(vals.issueDate),
                  dueDate: vals.dueDate ? new Date(vals.dueDate) : null,
                  milestoneLabel: vals.milestoneLabel || null,
                  currency: vals.currency,
                  taxNote: vals.taxNote || null,
                  notes: vals.notes || null,
                  showSignature: vals.showSignature,
                  lines: vals.lines.map((l, i) => ({
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    sortOrder: i,
                  })),
                });
                toast.success("ສ້າງໃບເກັບເງິນສໍາເລັດ");
                nav({ to: "/app/invoices" });
              } catch {
                // handled by mutation
              }
            }}
            submitting={createInvoice.isPending}
          />
        </div>
      </Main>
    </>
  );
}
