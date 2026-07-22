import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { Badge } from "@/components/ui/badge";
import { formatDateForInput } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import { invoicesApi } from "../api/client";
import {
  useCreatePayment,
  useInvoiceAction,
  useInvoiceQuery,
  useUpdateInvoice,
} from "../api/queries";
import { InvoiceForm } from "../ui/InvoiceForm";

export function InvoiceEditPage() {
  const nav = useNavigate({ from: "/app/invoices/$id/edit" });
  const { id } = useParams({ from: "/app/invoices/$id/edit" });
  const { data, ...result } = useInvoiceQuery(id);
  const updateInvoice = useUpdateInvoice(id);
  const actions = useInvoiceAction(id);
  const createPayment = useCreatePayment();

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : label);
    }
  };

  const remaining = data ? Math.max(0, data.total - (data.amountPaid ?? 0)) : 0;

  return (
    <>
      <Header />
      <Main>
        <div className="flex flex-wrap items-center justify-between gap-3 space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-2xl tracking-tight">
                ໃບເກັບເງິນ
              </h2>
              {data ? <Badge variant="secondary">{data.status}</Badge> : null}
              {data ? (
                <span className="font-mono text-muted-foreground text-sm">
                  {data.number}
                </span>
              ) : null}
            </div>
            {data ? (
              <p className="text-muted-foreground text-sm">
                Total {data.total.toLocaleString()} {data.currency} · Paid{" "}
                {(data.amountPaid ?? 0).toLocaleString()} · Remaining{" "}
                {remaining.toLocaleString()}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {data ? (
              <Button
                variant="outline"
                onClick={() => window.open(invoicesApi.pdfUrl(id), "_blank")}
              >
                PDF
              </Button>
            ) : null}
            {data?.status === "draft" ? (
              <Button
                onClick={() =>
                  runAction("Issued", () => actions.issue.mutateAsync())
                }
                isLoading={actions.issue.isPending}
              >
                Issue
              </Button>
            ) : null}
            {data &&
            (data.status === "issued" || data.status === "partial") &&
            remaining > 0 ? (
              <Button
                onClick={() =>
                  runAction("Payment recorded", () =>
                    createPayment.mutateAsync({
                      invoiceId: id,
                      amount: remaining,
                      paidAt: new Date(),
                      method: "transfer",
                    }),
                  )
                }
                isLoading={createPayment.isPending}
              >
                Record full payment
              </Button>
            ) : null}
            {data && data.status !== "void" && (data.amountPaid ?? 0) === 0 ? (
              <Button
                variant="destructive"
                onClick={() =>
                  runAction("Voided", () => actions.void.mutateAsync())
                }
                isLoading={actions.void.isPending}
              >
                Void
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => nav({ to: "/app/invoices" })}
            >
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
          </div>
        </div>

        <QueryState
          result={result}
          title="Loading"
          description="Loading invoice"
          variant="fullscreen"
        >
          {!data ? null : (
            <div className="mt-6 rounded-xl border bg-card p-6">
              {data.status !== "draft" ? (
                <p className="mb-4 text-muted-foreground text-sm">
                  Only draft invoices can be edited. Use actions above for
                  issue/payment.
                </p>
              ) : null}
              <InvoiceForm
                initialValues={{
                  customerId: data.customerId ?? "",
                  issueDate: data.issueDate
                    ? formatDateForInput(data.issueDate)
                    : "",
                  dueDate: data.dueDate
                    ? formatDateForInput(data.dueDate)
                    : "",
                  milestoneLabel: data.milestoneLabel ?? "",
                  currency: data.currency ?? "LAK",
                  taxNote: data.taxNote ?? "VAT 0%",
                  notes: data.notes ?? "",
                  showSignature: data.showSignature ?? true,
                  lines: (data.lines ?? []).map((l) => ({
                    description: l.description,
                    quantity: l.quantity,
                    unitPrice: l.unitPrice,
                    sortOrder: l.sortOrder,
                  })),
                }}
                onSubmit={async (vals) => {
                  try {
                    if (data.status !== "draft") {
                      await updateInvoice.mutateAsync({
                        showSignature: vals.showSignature,
                      });
                      toast.success("Saved");
                      return;
                    }
                    await updateInvoice.mutateAsync({
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
                    toast.success("Saved");
                  } catch {
                    // handled by mutation
                  }
                }}
                submitting={updateInvoice.isPending}
              />
            </div>
          )}
        </QueryState>
      </Main>
    </>
  );
}
