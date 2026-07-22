import { z } from "zod";
import {
  Button,
  FormActions,
  FormCheckbox,
  FormInput,
  FormRoot,
  FormTextarea,
  RHF,
  zodResolver,
} from "@/components/kit";
import { config } from "@/shared/lib/config";
import { fetchLookupForInfinite, hydrateLookupItem } from "@/shared/lib/utils";
import { FormInfiniteCombobox } from "@/components/kit";
import type { CustomerDTO } from "@/modules/customers/domain/contracts";
import {
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleTotalPercent,
} from "@/modules/finance/domain/payment-schedule";
import { LineItemsEditor } from "./LineItemsEditor";
import { PaymentScheduleEditor } from "./PaymentScheduleEditor";

const LineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

const PaymentScheduleSchema = z.object({
  percent: z.number().min(0).max(100),
  label: z.string().min(1),
  condition: z.string().default(""),
  dueDays: z.number().int().min(0).optional().nullable(),
});

const QuotationFormSchema = z
  .object({
    customerId: z.string().min(1, "ຕ້ອງເລືອກລູກຄ້າ"),
    issueDate: z.string().min(1, "ຕ້ອງໃສ່ວັນທີ"),
    validUntil: z.string().optional(),
    currency: z.string().default("LAK"),
    taxNote: z.string().optional(),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    showSignature: z.boolean().default(true),
    paymentSchedule: z.array(PaymentScheduleSchema).min(1),
    lines: z.array(LineSchema).min(1, "ຕ້ອງມີຢ່າງໜ້ອຍ 1 ລາຍການ"),
  })
  .superRefine((vals, ctx) => {
    if (paymentScheduleTotalPercent(vals.paymentSchedule) !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paymentSchedule"],
        message: "Milestone percentages must total 100%",
      });
    }
  });

export type QuotationFormValues = z.infer<typeof QuotationFormSchema>;

export function QuotationForm({
  initialValues,
  onSubmit,
  submitting,
  readOnly = false,
}: {
  initialValues?: Partial<QuotationFormValues>;
  onSubmit: (values: QuotationFormValues) => void;
  submitting?: boolean;
  readOnly?: boolean;
}) {
  const methods = RHF.useForm<QuotationFormValues>({
    resolver: zodResolver(QuotationFormSchema),
    defaultValues: {
      customerId: "",
      issueDate: new Date().toISOString().split("T")[0] ?? "",
      validUntil: "",
      currency: "LAK",
      taxNote: "VAT 0%",
      notes: "",
      internalNotes: "",
      showSignature: true,
      paymentSchedule: DEFAULT_PAYMENT_SCHEDULE.map((item) => ({ ...item })),
      lines: [{ description: "", quantity: 1, unitPrice: 0, sortOrder: 0 }],
      ...initialValues,
    },
  });

  const currency = methods.watch("currency");

  return (
    <FormRoot<QuotationFormValues>
      methods={methods}
      onSubmit={(vals) => onSubmit(vals)}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              hydrateLookupItem(`${config.apiUrl}/customers/lookup`, id)
            }
            getLabel={(item) => item.name}
            getValue={(item) => item.id}
            placeholder="ເລືອກລູກຄ້າ..."
          />
        </div>
        <FormInput name="issueDate" label="ວັນທີ" type="date" requiredMark />
        <FormInput name="validUntil" label="ໝົດກໍານົດ" type="date" />
        <FormInput name="currency" label="ສະກຸນເງິນ" placeholder="LAK" />
        <FormInput name="taxNote" label="ຫມາຍເຫດພາສີ" placeholder="VAT 0%" />
        <div className="md:col-span-2">
          <FormTextarea name="notes" label="ໝາຍເຫດ" placeholder="ໝາຍເຫດ" />
        </div>
        <div className="md:col-span-2">
          <FormTextarea
            name="internalNotes"
            label="ໝາຍເຫດພາຍໃນ"
            placeholder="ໝາຍເຫດສຳລັບທີມງານ"
          />
        </div>
        <div className="md:col-span-2">
          <FormCheckbox
            name="showSignature"
            label="ສະແດງຊ່ອງລາຍເຊັນໃນ PDF"
            hint="ປິດໄວ້ຖ້າບໍ່ຕ້ອງການພື້ນທີ່ເຊັນໃນເອກະສານ"
          />
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-2 font-semibold text-sm">ລາຍການ</h3>
        <LineItemsEditor
          name="lines"
          control={methods.control}
          currency={currency}
        />
      </div>

      <div className="mt-6">
        <PaymentScheduleEditor
          control={methods.control}
          name="paymentSchedule"
          readOnly={readOnly}
        />
      </div>

      <FormActions>
        <Button type="submit" isLoading={submitting}>
          {readOnly ? "ບັນທຶກການຕັ້ງຄ່າ PDF" : "ບັນທຶກ"}
        </Button>
      </FormActions>
    </FormRoot>
  );
}
