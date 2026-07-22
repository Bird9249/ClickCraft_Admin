import { Header } from "@/app/layout/Header";
import { Main } from "@/app/layout/Main";
import { Button, toast } from "@/components/kit";
import { Badge } from "@/components/ui/badge";
import { normalizePaymentSchedule } from "@/modules/finance/domain/payment-schedule";
import { formatDateForInput } from "@/shared/lib/date-time";
import { QueryState } from "@/shared/ui/QueryState";
import { useNavigate, useParams } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import { quotationsApi } from "../api/client";
import {
  useCreateInvoicesFromQuotation,
  useQuotationAction,
  useQuotationQuery,
  useUpdateQuotation,
} from "../api/queries";
import { CreateInvoicesDialog } from "../ui/CreateInvoicesDialog";
import { QuotationForm } from "../ui/QuotationForm";

export function QuotationEditPage() {
  const nav = useNavigate({ from: "/app/quotations/$id/edit" });
  const { id } = useParams({ from: "/app/quotations/$id/edit" });
  const { data, ...result } = useQuotationQuery(id);
  const updateQuotation = useUpdateQuotation(id);
  const actions = useQuotationAction(id);
  const createInvoices = useCreateInvoicesFromQuotation();
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const runAction = async (
    label: string,
    fn: () => Promise<unknown>,
  ) => {
    try {
      await fn();
      toast.success(label);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : label);
    }
  };

  return (
    <>
      <Header />
      <Main>
        <div className="flex flex-wrap items-center justify-between gap-3 space-y-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-2xl tracking-tight">
                ແກ້ໄຂໃບສະເໜີລາຄາ
              </h2>
              {data ? <Badge variant="secondary">{data.status}</Badge> : null}
              {data ? (
                <span className="font-mono text-muted-foreground text-sm">
                  {data.number}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground">
              ປັບປຸງໃບສະເໜີລາຄາ.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {data ? (
              <Button
                variant="outline"
                onClick={() =>
                  window.open(quotationsApi.pdfUrl(id), "_blank")
                }
              >
                PDF
              </Button>
            ) : null}
            {data?.status === "draft" ? (
              <Button
                onClick={() =>
                  runAction("Sent", () => actions.send.mutateAsync())
                }
                isLoading={actions.send.isPending}
              >
                Send
              </Button>
            ) : null}
            {data?.status === "sent" ? (
              <>
                <Button
                  onClick={() =>
                    runAction("Accepted", () => actions.accept.mutateAsync())
                  }
                  isLoading={actions.accept.isPending}
                >
                  Accept
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    runAction("Rejected", () => actions.reject.mutateAsync())
                  }
                  isLoading={actions.reject.isPending}
                >
                  Reject
                </Button>
              </>
            ) : null}
            {data?.status === "accepted" ? (
              <Button onClick={() => setInvoiceDialogOpen(true)}>
                Create invoices
              </Button>
            ) : null}
            {data && data.status !== "void" ? (
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
              onClick={() => nav({ to: "/app/quotations" })}
            >
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
          </div>
        </div>

        <QueryState
          result={result}
          title="Loading"
          description="Loading quotation"
          variant="fullscreen"
        >
          {!data ? null : (
            <div className="mt-6 rounded-xl border bg-card p-6">
              {data.status !== "draft" ? (
                <p className="mb-4 text-muted-foreground text-sm">
                  Only draft quotations can be edited. Use actions above for
                  status changes.
                </p>
              ) : null}
              <QuotationForm
                readOnly={data.status !== "draft"}
                initialValues={{
                  customerId: data.customerId ?? "",
                  issueDate: data.issueDate
                    ? formatDateForInput(data.issueDate)
                    : "",
                  validUntil: data.validUntil
                    ? formatDateForInput(data.validUntil)
                    : "",
                  currency: data.currency ?? "LAK",
                  taxNote: data.taxNote ?? "VAT 0%",
                  notes: data.notes ?? "",
                  internalNotes: data.internalNotes ?? "",
                  showSignature: data.showSignature ?? true,
                  paymentSchedule: normalizePaymentSchedule(data.paymentSchedule),
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
                      await updateQuotation.mutateAsync({
                        showSignature: vals.showSignature,
                      });
                      toast.success("Saved");
                      return;
                    }
                    await updateQuotation.mutateAsync({
                      customerId: vals.customerId,
                      issueDate: new Date(vals.issueDate),
                      validUntil: vals.validUntil
                        ? new Date(vals.validUntil)
                        : null,
                      currency: vals.currency,
                      taxNote: vals.taxNote || null,
                      notes: vals.notes || null,
                      internalNotes: vals.internalNotes || null,
                      showSignature: vals.showSignature,
                      paymentSchedule: vals.paymentSchedule,
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
                submitting={updateQuotation.isPending}
              />
            </div>
          )}
        </QueryState>
        <CreateInvoicesDialog
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          quotationId={id}
          quotationTotal={data?.total ?? 0}
          currency={data?.currency ?? "LAK"}
          paymentSchedule={data?.paymentSchedule}
          submitting={createInvoices.isPending}
          onConfirm={async (input) => {
            await runAction("Invoices created", () =>
              createInvoices.mutateAsync(input),
            );
            setInvoiceDialogOpen(false);
          }}
        />
      </Main>
    </>
  );
}

