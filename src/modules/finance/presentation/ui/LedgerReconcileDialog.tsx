import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  FieldDescription,
  FieldGroup,
  FieldLayout,
  confirm,
} from "@/components/kit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDateLocal } from "@/shared/lib/date-time";
import { cn } from "@/lib/utils";
import { Link2Icon, SparklesIcon } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useLedgerReconciliationQuery,
  useLinkLedgerPayment,
} from "../api/queries";
import { formatLak } from "../lib/ledger-constants";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LedgerReconcileDialog({ open, onOpenChange }: Props) {
  const reconciliation = useLedgerReconciliationQuery(open);
  const linkPayment = useLinkLedgerPayment();
  const [selectedLedgerId, setSelectedLedgerId] = useState("");
  const [selectedPaymentId, setSelectedPaymentId] = useState("");

  const reset = () => {
    setSelectedLedgerId("");
    setSelectedPaymentId("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const selectedLedger = useMemo(
    () =>
      reconciliation.data?.unlinkedLedger.find((row) => row.id === selectedLedgerId),
    [reconciliation.data?.unlinkedLedger, selectedLedgerId],
  );

  const selectedPayment = useMemo(
    () =>
      reconciliation.data?.unlinkedPayments.find(
        (row) => row.paymentId === selectedPaymentId,
      ),
    [reconciliation.data?.unlinkedPayments, selectedPaymentId],
  );

  const applySuggestion = async (ledgerEntryId: string, paymentId: string) => {
    const ok = await confirm({
      title: "ຜູກລາຍການອັດຕະໂນມັດ",
      description: "ຢືນຢັນການຜູກລາຍການ ledger ກັບການຊໍາລະທີ່ກົງກັນ?",
      actionText: "ຜູກ",
    });
    if (!ok) return;

    try {
      await linkPayment.mutateAsync({ ledgerEntryId, paymentId });
      reset();
    } catch {
      // toast in mutation
    }
  };

  const handleLink = async () => {
    if (!selectedLedgerId || !selectedPaymentId) return;

    const ok = await confirm({
      title: "ຜູກລາຍການ",
      description: "ຢືນຢັນການຜູກລາຍການ ledger ກັບການຊໍາລະທີ່ເລືອກ?",
      actionText: "ຜູກ",
    });
    if (!ok) return;

    try {
      await linkPayment.mutateAsync({
        ledgerEntryId: selectedLedgerId,
        paymentId: selectedPaymentId,
      });
      reset();
    } catch {
      // toast in mutation
    }
  };

  const amountMismatch =
    selectedLedger &&
    selectedPayment &&
    selectedLedger.amount !== selectedPayment.amount;

  const isEmpty =
    !reconciliation.isLoading &&
    (reconciliation.data?.unlinkedLedgerCount ?? 0) === 0 &&
    (reconciliation.data?.unlinkedPaymentCount ?? 0) === 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>ຈັດຄູ່ລາຍການ</DialogTitle>
          <DialogDescription>
            ຜູກລາຍຮັບຈາກ CSV/ມື ກັບການຊໍາລະໃນລະບົບເພື່ອຫຼີກລ່ຽງການນັບຊ້ຳ
          </DialogDescription>
        </DialogHeader>

        {reconciliation.isLoading ? (
          <FieldDescription>ກໍາລັງໂຫຼດ...</FieldDescription>
        ) : isEmpty ? (
          <Alert>
            <AlertTitle>ບໍ່ມີລາຍການຄ້າງຜູກ</AlertTitle>
            <AlertDescription>
              ລາຍຮັບທີ່ຍັງບໍ່ຜູກ payment ແລະ payment ທີ່ຍັງບໍ່ມີ ledger ຄົບແລ້ວ
            </AlertDescription>
          </Alert>
        ) : (
          <FieldGroup className="min-h-0 flex-1 gap-4 overflow-y-auto">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                Ledger ຄ້າງ: {reconciliation.data?.unlinkedLedgerCount ?? 0}
              </Badge>
              <Badge variant="secondary">
                Payment ຄ້າງ: {reconciliation.data?.unlinkedPaymentCount ?? 0}
              </Badge>
            </div>

            {(reconciliation.data?.suggestions.length ?? 0) > 0 ? (
              <FieldLayout>
                <FieldDescription className="mb-2 flex items-center gap-1.5 font-medium text-foreground">
                  <SparklesIcon className="size-4" />
                  ຄູ່ທີ່ແນະນຳ (ຈຳນວນ + ລູກຄ້າ + ວັນທີໃກ້ຄຽງ)
                </FieldDescription>
                <div className="space-y-2">
                  {reconciliation.data?.suggestions.map((item) => (
                    <div
                      key={`${item.ledgerEntryId}-${item.paymentId}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3"
                    >
                      <div className="min-w-0 text-sm">
                        <div className="font-medium">
                          {item.relatedParty ?? item.customerName} ·{" "}
                          {formatLak(item.ledgerAmount)}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {formatDateLocal(item.ledgerDate)} →{" "}
                          {item.receiptNumber} ({formatDateLocal(item.paymentDate)})
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          applySuggestion(item.ledgerEntryId, item.paymentId)
                        }
                        isLoading={linkPayment.isPending}
                      >
                        <Link2Icon className="size-4" />
                        ຜູກທັນທີ
                      </Button>
                    </div>
                  ))}
                </div>
              </FieldLayout>
            ) : null}

            <div className="grid min-h-0 gap-4 md:grid-cols-2">
              <FieldLayout className="min-h-0">
                <FieldDescription className="mb-2 font-medium text-foreground">
                  ລາຍຮັບຍັງບໍ່ຜູກ (CSV / ມື)
                </FieldDescription>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-1">
                  {(reconciliation.data?.unlinkedLedger.length ?? 0) === 0 ? (
                    <FieldDescription className="p-3">ບໍ່ມີລາຍການ</FieldDescription>
                  ) : (
                    reconciliation.data?.unlinkedLedger.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedLedgerId(row.id)}
                        className={cn(
                          "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                          selectedLedgerId === row.id && "bg-primary/10 ring-1 ring-primary",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{row.category}</span>
                          <span className="font-mono text-emerald-600 text-xs">
                            {formatLak(row.amount)}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {formatDateLocal(row.entryDate)} ·{" "}
                          {row.relatedParty ?? "-"}
                          {row.sourceType === "csv_import" ? " · CSV" : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </FieldLayout>

              <FieldLayout className="min-h-0">
                <FieldDescription className="mb-2 font-medium text-foreground">
                  Payment ຍັງບໍ່ມີ ledger
                </FieldDescription>
                <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-1">
                  {(reconciliation.data?.unlinkedPayments.length ?? 0) === 0 ? (
                    <FieldDescription className="p-3">ບໍ່ມີລາຍການ</FieldDescription>
                  ) : (
                    reconciliation.data?.unlinkedPayments.map((row) => (
                      <button
                        key={row.paymentId}
                        type="button"
                        onClick={() => setSelectedPaymentId(row.paymentId)}
                        className={cn(
                          "w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                          selectedPaymentId === row.paymentId &&
                            "bg-primary/10 ring-1 ring-primary",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium">{row.customerName}</span>
                          <span className="font-mono text-emerald-600 text-xs">
                            {formatLak(row.amount)}
                          </span>
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {row.receiptNumber} · {formatDateLocal(row.paidAt)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </FieldLayout>
            </div>

            {amountMismatch && selectedLedger && selectedPayment ? (
              <Alert variant="destructive">
                <AlertTitle>ຈຳນວນເງິນບໍ່ກົງກັນ</AlertTitle>
                <AlertDescription>
                  Ledger {formatLak(selectedLedger.amount)} ≠ Payment{" "}
                  {formatLak(selectedPayment.amount)} — ກະລຸນາກວດສອບກ່ອນຜູກ
                </AlertDescription>
              </Alert>
            ) : null}
          </FieldGroup>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            ປິດ
          </Button>
          <Button
            type="button"
            onClick={handleLink}
            disabled={
              !selectedLedgerId ||
              !selectedPaymentId ||
              !!amountMismatch ||
              linkPayment.isPending
            }
            isLoading={linkPayment.isPending}
          >
            <Link2Icon className="size-4" />
            ຜູກລາຍການ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
