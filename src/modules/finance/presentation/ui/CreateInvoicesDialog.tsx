import { PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/kit";
import { Textarea } from "@/components/ui/textarea";
import type { MilestoneDTO } from "@/modules/finance/domain/contracts";
import {
  normalizePaymentSchedule,
  paymentScheduleTotalPercent,
  type PaymentScheduleItem,
} from "@/modules/finance/domain/payment-schedule";
import { formatDateForInput } from "@/shared/lib/date-time";

type Row = {
  percent: number;
  label: string;
  condition: string;
  dueDate: string;
};

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toRows(
  schedule: PaymentScheduleItem[],
  issueDate: Date,
): Row[] {
  return schedule.map((item) => ({
    percent: item.percent,
    label: item.label,
    condition: item.condition,
    dueDate: formatDateForInput(addDays(issueDate, item.dueDays ?? 0)),
  }));
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  quotationTotal: number;
  currency: string;
  paymentSchedule?: unknown;
  submitting?: boolean;
  onConfirm: (input: {
    quotationId: string;
    issueDate: Date;
    milestones: MilestoneDTO[];
  }) => Promise<void> | void;
};

export function CreateInvoicesDialog({
  open,
  onOpenChange,
  quotationId,
  quotationTotal,
  currency,
  paymentSchedule,
  submitting,
  onConfirm,
}: Props) {
  const [issueDate, setIssueDate] = useState(
    () => formatDateForInput(new Date()),
  );
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!open) return;
    const issue = new Date();
    setIssueDate(formatDateForInput(issue));
    setRows(toRows(normalizePaymentSchedule(paymentSchedule), issue));
  }, [open, paymentSchedule]);

  const totalPercent = paymentScheduleTotalPercent(rows);
  const issue = useMemo(() => new Date(issueDate || Date.now()), [issueDate]);

  const updateRow = (index: number, patch: Partial<Row>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create invoices by milestone</DialogTitle>
          <DialogDescription>
            Set percent, label, payment condition and due date for each
            installment. Percentages must total 100%.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-muted-foreground text-xs">
                Issue date
              </label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => {
                  setIssueDate(e.target.value);
                  const nextIssue = new Date(e.target.value);
                  setRows((prev) =>
                    prev.map((row, i) => {
                      const days =
                        normalizePaymentSchedule(paymentSchedule)[i]?.dueDays ??
                        i * 30;
                      return {
                        ...row,
                        dueDate: formatDateForInput(
                          addDays(nextIssue, Number(days) || 0),
                        ),
                      };
                    }),
                  );
                }}
              />
            </div>
            <div className="flex items-end justify-between gap-2">
              <p className="text-muted-foreground text-sm">
                Quotation total:{" "}
                <span className="font-mono text-foreground">
                  {currency} {quotationTotal.toLocaleString()}
                </span>
              </p>
              <span
                className={
                  totalPercent === 100
                    ? "font-mono text-muted-foreground text-xs"
                    : "font-mono text-destructive text-xs"
                }
              >
                {totalPercent}% / 100%
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {rows.map((row, index) => {
              const amount = Math.round((quotationTotal * row.percent) / 100);
              return (
                <div
                  key={index}
                  className="space-y-2 rounded-lg border bg-muted/20 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm">
                      Milestone {index + 1}
                      <span className="ml-2 font-mono text-muted-foreground">
                        {currency} {amount.toLocaleString()}
                      </span>
                    </p>
                    {rows.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() =>
                          setRows((prev) => prev.filter((_, i) => i !== index))
                        }
                      >
                        <TrashIcon className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-muted-foreground text-xs">
                        %
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={row.percent}
                        onChange={(e) =>
                          updateRow(index, {
                            percent: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-muted-foreground text-xs">
                        Label
                      </label>
                      <Input
                        value={row.label}
                        onChange={(e) =>
                          updateRow(index, { label: e.target.value })
                        }
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-muted-foreground text-xs">
                        Due date
                      </label>
                      <Input
                        type="date"
                        value={row.dueDate}
                        onChange={(e) =>
                          updateRow(index, { dueDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="mb-1 block text-muted-foreground text-xs">
                        Payment condition
                      </label>
                      <Textarea
                        rows={2}
                        value={row.condition}
                        onChange={(e) =>
                          updateRow(index, { condition: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setRows((prev) => [
                ...prev,
                {
                  percent: 0,
                  label: `M${prev.length + 1}`,
                  condition: "",
                  dueDate: formatDateForInput(issue),
                },
              ])
            }
          >
            <PlusIcon className="size-4" />
            Add milestone
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={totalPercent !== 100 || submitting}
            isLoading={submitting}
            onClick={async () => {
              await onConfirm({
                quotationId,
                issueDate: issue,
                milestones: rows.map((row) => ({
                  percent: row.percent,
                  label: row.label,
                  condition: row.condition,
                  dueDate: row.dueDate ? new Date(row.dueDate) : null,
                })),
              });
            }}
          >
            Create invoices
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
