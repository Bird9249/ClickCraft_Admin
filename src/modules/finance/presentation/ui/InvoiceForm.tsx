import { z } from "zod";
import {
  Button,
  FormActions,
  FormCheckbox,
  FormInput,
  FormInfiniteCombobox,
  FormRoot,
  FormTextarea,
  RHF,
  zodResolver,
} from "@/components/kit";
import type { CustomerDTO } from "@/modules/customers/domain/contracts";
import { config } from "@/shared/lib/config";
import { fetchLookupForInfinite, hydrateLookupItem } from "@/shared/lib/utils";
import { LineItemsEditor } from "./LineItemsEditor";

const LineSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

const InvoiceFormSchema = z.object({
  customerId: z.string().min(1, "ຕ້ອງເລືອກລູກຄ້າ"),
  issueDate: z.string().min(1, "ຕ້ອງໃສ່ວັນທີ"),
  dueDate: z.string().optional(),
  milestoneLabel: z.string().optional(),
  currency: z.string().default("LAK"),
  taxNote: z.string().optional(),
  notes: z.string().optional(),
  showSignature: z.boolean().default(true),
  lines: z.array(LineSchema).min(1, "ຕ້ອງມີຢ່າງໜ້ອຍ 1 ລາຍການ"),
});

export type InvoiceFormValues = z.infer<typeof InvoiceFormSchema>;

export function InvoiceForm({
  initialValues,
  onSubmit,
  submitting,
}: {
  initialValues?: Partial<InvoiceFormValues>;
  onSubmit: (values: InvoiceFormValues) => void;
  submitting?: boolean;
}) {
  const methods = RHF.useForm<InvoiceFormValues>({
    resolver: zodResolver(InvoiceFormSchema),
    defaultValues: {
      customerId: "",
      issueDate: new Date().toISOString().split("T")[0] ?? "",
      dueDate: "",
      milestoneLabel: "",
      currency: "LAK",
      taxNote: "VAT 0%",
      notes: "",
      showSignature: true,
      lines: [{ description: "", quantity: 1, unitPrice: 0, sortOrder: 0 }],
      ...initialValues,
    },
  });

  const currency = methods.watch("currency");

  return (
    <FormRoot<InvoiceFormValues>
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
        <FormInput name="dueDate" label="ກໍານົດຊໍາລະ" type="date" />
        <FormInput
          name="milestoneLabel"
          label="Milestone"
          placeholder="ເຊັ່ນ: Milestone 1 (40%)"
        />
        <FormInput name="currency" label="ສະກຸນເງິນ" placeholder="LAK" />
        <FormInput name="taxNote" label="ຫມາຍເຫດພາສີ" placeholder="VAT 0%" />
        <div className="md:col-span-2">
          <FormTextarea name="notes" label="ໝາຍເຫດ" placeholder="ໝາຍເຫດ" />
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

      <FormActions>
        <Button type="submit" isLoading={submitting}>
          ບັນທຶກ
        </Button>
      </FormActions>
    </FormRoot>
  );
}
