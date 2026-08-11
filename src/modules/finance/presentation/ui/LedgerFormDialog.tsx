import { useEffect, useMemo } from "react";
import { z } from "zod";
import {
  Button,
  FormActions,
  FormAmountInput,
  FormDatePicker,
  FormInfiniteCombobox,
  FormRoot,
  FormStaticCombobox,
  FormTextarea,
  FormToggleGroup,
  RHF,
  Separator,
  zodResolver,
} from "@/components/kit";
import type { CustomerDTO } from "@/modules/customers/domain/contracts";
import type { LedgerEntryByIdResult } from "@/modules/finance/domain/types";
import { config } from "@/shared/lib/config";
import { fetchLookupForInfinite, hydrateLookupItem } from "@/shared/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCreateLedgerEntry,
  useLedgerLookupsQuery,
  useUpdateLedgerEntry,
} from "../api/queries";
import {
  isInternalPartyName,
  LEDGER_EXPENSE_CATEGORIES,
  LEDGER_INCOME_CATEGORIES,
  LEDGER_INTERNAL_PARTIES,
} from "../lib/ledger-constants";

const LedgerFormSchema = z
  .object({
    type: z.enum(["income", "expense"]),
    entryDate: z.date({ message: "ຕ້ອງໃສ່ວັນທີ" }),
    category: z.string().trim().min(1, "ຕ້ອງໃສ່ລາຍການ"),
    amount: z.number().int().positive("ຈໍານວນເງິນຕ້ອງຫຼາຍກວ່າ 0"),
    partyType: z.enum(["customer", "internal"]).optional(),
    customerId: z.string().optional(),
    relatedParty: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "income") {
      if (!val.partyType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["partyType"],
          message: "ຕ້ອງເລືອກປະເພດຜູ້ກ່ຽວຂ້ອງ",
        });
      } else if (val.partyType === "customer" && !val.customerId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerId"],
          message: "ຕ້ອງເລືອກລູກຄ້າ",
        });
      } else if (
        val.partyType === "internal" &&
        !val.relatedParty?.trim()
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relatedParty"],
          message: "ຕ້ອງເລືອກຜູ້ກ່ຽວຂ້ອງ",
        });
      }
    }
  });

type LedgerFormValues = z.infer<typeof LedgerFormSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: LedgerEntryByIdResult | null;
  defaultType?: "income" | "expense";
};

function inferIncomeParty(entry: LedgerEntryByIdResult) {
  if (entry.customerId) {
    return {
      partyType: "customer" as const,
      customerId: entry.customerId,
      relatedParty: "",
    };
  }
  if (
    entry.partyType === "internal" ||
    isInternalPartyName(entry.relatedParty)
  ) {
    return {
      partyType: "internal" as const,
      customerId: "",
      relatedParty: entry.relatedParty ?? "",
    };
  }
  return {
    partyType: "customer" as const,
    customerId: "",
    relatedParty: "",
  };
}

export function LedgerFormDialog({
  open,
  onOpenChange,
  entry,
  defaultType = "expense",
}: Props) {
  const createEntry = useCreateLedgerEntry();
  const updateEntry = useUpdateLedgerEntry();
  const lookups = useLedgerLookupsQuery();
  const isEdit = !!entry;

  const methods = RHF.useForm<LedgerFormValues>({
    resolver: zodResolver(LedgerFormSchema),
    defaultValues: {
      type: defaultType,
      entryDate: new Date(),
      category: "",
      amount: 0,
      partyType: defaultType === "income" ? "customer" : undefined,
      customerId: "",
      relatedParty: "",
      notes: "",
    },
  });

  const watchType = methods.watch("type");
  const watchPartyType = methods.watch("partyType");

  const categorySuggestions = useMemo(() => {
    const base =
      watchType === "income"
        ? [...LEDGER_INCOME_CATEGORIES]
        : [...LEDGER_EXPENSE_CATEGORIES];
    for (const c of lookups.data?.categories ?? []) {
      if (!base.includes(c as never)) base.push(c as never);
    }
    return base;
  }, [lookups.data?.categories, watchType]);

  const internalSuggestions = useMemo(() => {
    const base = [...LEDGER_INTERNAL_PARTIES];
    for (const p of lookups.data?.relatedParties ?? []) {
      if (isInternalPartyName(p) && !base.includes(p as never)) {
        base.push(p as never);
      }
    }
    return base;
  }, [lookups.data?.relatedParties]);

  const expensePartySuggestions = useMemo(() => {
    const base = [...internalSuggestions];
    for (const p of lookups.data?.relatedParties ?? []) {
      if (!base.includes(p as never)) base.push(p as never);
    }
    return base;
  }, [internalSuggestions, lookups.data?.relatedParties]);

  useEffect(() => {
    if (!open) return;
    if (entry) {
      const incomeParty =
        entry.type === "income" ? inferIncomeParty(entry) : null;
      methods.reset({
        type: entry.type as "income" | "expense",
        entryDate: new Date(entry.entryDate),
        category: entry.category,
        amount: entry.amount,
        partyType: incomeParty?.partyType,
        customerId: incomeParty?.customerId ?? "",
        relatedParty:
          entry.type === "expense"
            ? (entry.relatedParty ?? "")
            : (incomeParty?.relatedParty ?? ""),
        notes: entry.notes ?? "",
      });
    } else {
      methods.reset({
        type: defaultType,
        entryDate: new Date(),
        category: "",
        amount: 0,
        partyType: defaultType === "income" ? "customer" : undefined,
        customerId: "",
        relatedParty: "",
        notes: "",
      });
    }
  }, [open, entry, defaultType, methods]);

  useEffect(() => {
    if (watchType === "income" && !watchPartyType) {
      methods.setValue("partyType", "customer");
    }
    if (watchType === "expense") {
      methods.setValue("partyType", undefined);
      methods.setValue("customerId", "");
    }
  }, [watchType, watchPartyType, methods]);

  const submitting = createEntry.isPending || updateEntry.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "ແກ້ໄຂລາຍການ" : "ບັນທຶກລາຍການ"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "ແກ້ໄຂລາຍຮັບ/ລາຍຈ່າຍ"
              : "ເພີ່ມລາຍຮັບ ຫຼື ລາຍຈ່າຍໃໝ່"}
          </DialogDescription>
        </DialogHeader>

        <FormRoot<LedgerFormValues>
          methods={methods}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          onSubmit={async (vals) => {
            const payload = {
              type: vals.type,
              entryDate: vals.entryDate,
              category: vals.category,
              amount: vals.amount,
              partyType:
                vals.type === "income" ? (vals.partyType ?? null) : null,
              customerId:
                vals.type === "income" && vals.partyType === "customer"
                  ? vals.customerId?.trim() || null
                  : null,
              relatedParty:
                vals.type === "expense" ||
                (vals.type === "income" && vals.partyType === "internal")
                  ? vals.relatedParty?.trim() || null
                  : null,
              notes: vals.notes?.trim() || null,
            };
            if (isEdit && entry) {
              await updateEntry.mutateAsync({ id: entry.id, input: payload });
            } else {
              await createEntry.mutateAsync(payload);
            }
            onOpenChange(false);
          }}
        >
          <div className="md:col-span-2">
            <FormToggleGroup
              name="type"
              label="ປະເພດ"
              requiredMark
              options={[
                { value: "income", label: "ລາຍຮັບ" },
                { value: "expense", label: "ລາຍຈ່າຍ" },
              ]}
            />
          </div>

          <FormDatePicker
            name="entryDate"
            label="ວັນທີ"
            requiredMark
            placeholder="ເລືອກວັນທີ"
          />

          <FormAmountInput
            name="amount"
            label="ຈໍານວນ"
            requiredMark
            min={1}
          />

          <div className="md:col-span-2">
            <FormStaticCombobox
              name="category"
              label="ລາຍການ"
              requiredMark
              options={categorySuggestions}
              placeholder="ເລືອກຫຼືພິມລາຍການ"
              searchPlaceholder="ຄົ້ນຫາຫຼືພິມໃໝ່..."
            />
          </div>

          {watchType === "income" ? (
            <>
              <div className="md:col-span-2">
                <FormToggleGroup
                  name="partyType"
                  label="ຜູ້ກ່ຽວຂ້ອງ"
                  requiredMark
                  options={[
                    { value: "customer", label: "ລູກຄ້າ" },
                    {
                      value: "internal",
                      label: "ຜູ້ກ່ຽວຂ້ອງໃນລະບົບ",
                    },
                  ]}
                />
              </div>

              {watchPartyType === "customer" ? (
                <div className="md:col-span-2">
                  <FormInfiniteCombobox<CustomerDTO>
                    name="customerId"
                    label="ລູກຄ້າ"
                    requiredMark
                    queryKey={["customers-lookup"]}
                    queryFn={(args) =>
                      fetchLookupForInfinite(
                        `${config.apiUrl}/customers/lookup`,
                        args,
                      )
                    }
                    preloadQueryFn={(id) =>
                      hydrateLookupItem(
                        `${config.apiUrl}/customers/lookup`,
                        id,
                      )
                    }
                    getLabel={(item) => item.name}
                    getValue={(item) => item.id}
                    placeholder="ເລືອກລູກຄ້າ..."
                  />
                </div>
              ) : null}

              {watchPartyType === "internal" ? (
                <div className="md:col-span-2">
                  <FormStaticCombobox
                    name="relatedParty"
                    label="ຜູ້ກ່ຽວຂ້ອງໃນລະບົບ"
                    requiredMark
                    options={internalSuggestions}
                    placeholder="ເຊັ່ນ All, Bird, Alex"
                    searchPlaceholder="ຄົ້ນຫາຜູ້ກ່ຽວຂ້ອງ..."
                  />
                </div>
              ) : null}
            </>
          ) : (
            <FormStaticCombobox
              name="relatedParty"
              label="ຜູ້ກ່ຽວຂ້ອງ"
              options={expensePartySuggestions}
              placeholder="ເຊັ່ນ Bird, Alex"
              searchPlaceholder="ຄົ້ນຫາຜູ້ກ່ຽວຂ້ອງ..."
            />
          )}

          <div className="md:col-span-2">
            <Separator />
          </div>

          <div className="md:col-span-2">
            <FormTextarea
              name="notes"
              label="ຫມາຍເຫດ"
              placeholder="ລາຍລະອຽດເພີ່ມເຕີມ"
            />
          </div>

          <DialogFooter className="md:col-span-2 sm:justify-end">
            <FormActions className="w-full justify-end pt-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                ຍົກເລີກ
              </Button>
              <Button type="submit" isLoading={submitting}>
                {isEdit ? "ບັນທຶກ" : "ເພີ່ມລາຍການ"}
              </Button>
            </FormActions>
          </DialogFooter>
        </FormRoot>
      </DialogContent>
    </Dialog>
  );
}
