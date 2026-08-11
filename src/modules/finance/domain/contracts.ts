import { z } from "zod";
import { DEFAULT_PAYMENT_SCHEDULE } from "./payment-schedule";
import { MAX_SUB_ITEM_DEPTH, subItemDepth } from "./line-pricing";
import { isRichTextEmpty } from "@/shared/lib/rich-text-html";

const RichTextDescriptionSchema = z
  .string()
  .refine((val) => !isRichTextEmpty(val), { message: "ຕ້ອງໃສ່ລາຍການ" });

// ─── Shared ──────────────────────────────────────────────────────────────────

export const IdParamSchema = z.object({ id: z.string().min(1) });
export type IdParamDTO = z.infer<typeof IdParamSchema>;

// ─── Lines ────────────────────────────────────────────────────────────────────

export const PriceOnSchema = z.enum(["parent", "children"]).default("parent");
export type PriceOnDTO = z.infer<typeof PriceOnSchema>;

export type SubItemInputDTO = {
  description: string;
  quantity: number;
  unitPrice: number;
  sortOrder: number;
  children: SubItemInputDTO[];
};

export const SubItemInputSchema: z.ZodType<SubItemInputDTO> = z.lazy(() =>
  z.object({
    description: RichTextDescriptionSchema,
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().int().min(0).default(0),
    sortOrder: z.number().int().min(0).default(0),
    children: z.array(SubItemInputSchema).default([]),
  }),
);

export const LineInputSchema = z
  .object({
    description: RichTextDescriptionSchema,
    quantity: z.number().int().min(1).default(1),
    unitPrice: z.number().int().min(0).default(0),
    sortOrder: z.number().int().min(0).default(0),
    priceOn: PriceOnSchema,
    children: z.array(SubItemInputSchema).default([]),
  })
  .superRefine((line, ctx) => {
    const depth = subItemDepth(line.children);
    if (depth > MAX_SUB_ITEM_DEPTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["children"],
        message: `Sub-items can nest at most ${MAX_SUB_ITEM_DEPTH} levels`,
      });
    }
  });
export type LineInputDTO = z.infer<typeof LineInputSchema>;

export const PaymentScheduleItemSchema = z.object({
  percent: z.number().min(0).max(100),
  label: z.string().min(1),
  condition: z.string().default(""),
  dueDays: z.number().int().min(0).optional().nullable(),
});
export type PaymentScheduleItemDTO = z.infer<typeof PaymentScheduleItemSchema>;

// ─── Quotations ──────────────────────────────────────────────────────────────

export const CreateQuotationSchema = z.object({
  customerId: z.string().min(1, "ຕ້ອງເລືອກລູກຄ້າ"),
  issueDate: z.coerce.date(),
  validUntil: z.coerce.date().optional().nullable(),
  currency: z.string().default("LAK"),
  taxNote: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  sourcePresetId: z.string().optional().nullable(),
  showSignature: z.boolean().default(true),
  paymentSchedule: z
    .array(PaymentScheduleItemSchema)
    .min(1)
    .optional()
    .nullable(),
  lines: z.array(LineInputSchema).min(1, "ຕ້ອງມີຢ່າງໜ້ອຍ 1 ລາຍການ"),
});
export type CreateQuotationDTO = z.infer<typeof CreateQuotationSchema>;

export const UpdateQuotationSchema = CreateQuotationSchema.partial().extend({
  lines: z.array(LineInputSchema).optional(),
});
export type UpdateQuotationDTO = z.infer<typeof UpdateQuotationSchema>;

// ─── Invoices ─────────────────────────────────────────────────────────────────

export const CreateInvoiceSchema = z.object({
  customerId: z.string().min(1),
  quotationId: z.string().optional().nullable(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  milestoneLabel: z.string().optional().nullable(),
  currency: z.string().default("LAK"),
  taxNote: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  showSignature: z.boolean().default(true),
  lines: z.array(LineInputSchema).min(1),
});
export type CreateInvoiceDTO = z.infer<typeof CreateInvoiceSchema>;

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
  lines: z.array(LineInputSchema).optional(),
});
export type UpdateInvoiceDTO = z.infer<typeof UpdateInvoiceSchema>;

export const MilestoneSchema = z.object({
  percent: z.number().min(0).max(100),
  label: z.string().optional(),
  condition: z.string().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
});
export type MilestoneDTO = z.infer<typeof MilestoneSchema>;

export const CreateFromQuotationSchema = z.object({
  quotationId: z.string().min(1),
  issueDate: z.coerce.date(),
  milestones: z.array(MilestoneSchema).min(1).default(
    DEFAULT_PAYMENT_SCHEDULE.map((m) => ({
      percent: m.percent,
      label: m.label,
      condition: m.condition,
    })),
  ),
});
export type CreateFromQuotationDTO = z.infer<typeof CreateFromQuotationSchema>;

// ─── Payments ─────────────────────────────────────────────────────────────────

export const CreatePaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().int().min(1),
  paidAt: z.coerce.date(),
  method: z.string().default("transfer"),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  showSignature: z.boolean().default(true),
});
export type CreatePaymentDTO = z.infer<typeof CreatePaymentSchema>;

export const UpdateReceiptSchema = z.object({
  showSignature: z.boolean(),
  notes: z.string().optional().nullable(),
});
export type UpdateReceiptDTO = z.infer<typeof UpdateReceiptSchema>;

// ─── Global finance settings (invoice bank payment) ───────────────────────────

export const UpdateFinanceSettingsSchema = z.object({
  bankName: z.string().trim().max(200).optional().nullable(),
  accountName: z.string().trim().max(200).optional().nullable(),
  accountNumber: z.string().trim().max(100).optional().nullable(),
  qrImageKey: z.string().trim().max(500).optional().nullable(),
  autoLedgerOnPayment: z.boolean().optional(),
});
export type UpdateFinanceSettingsDTO = z.infer<
  typeof UpdateFinanceSettingsSchema
>;

// ─── Ledger (income / expense) ────────────────────────────────────────────────

export const LedgerTypeSchema = z.enum(["income", "expense"]);
export type LedgerTypeDTO = z.infer<typeof LedgerTypeSchema>;

export const LedgerPartyTypeSchema = z.enum(["customer", "internal"]);
export type LedgerPartyTypeDTO = z.infer<typeof LedgerPartyTypeSchema>;

export const LedgerSourceTypeSchema = z.enum([
  "manual",
  "csv_import",
  "payment",
]);
export type LedgerSourceTypeDTO = z.infer<typeof LedgerSourceTypeSchema>;

export const CreateLedgerEntrySchema = z
  .object({
    type: LedgerTypeSchema,
    entryDate: z.coerce.date(),
    category: z.string().trim().min(1, "ຕ້ອງໃສ່ລາຍການ"),
    amount: z.number().int().positive("ຈໍານວນເງິນຕ້ອງຫຼາຍກວ່າ 0"),
    partyType: LedgerPartyTypeSchema.optional().nullable(),
    customerId: z.string().trim().optional().nullable(),
    relatedParty: z.string().trim().optional().nullable(),
    notes: z.string().trim().optional().nullable(),
  })
  .superRefine((val, ctx) => {
    if (val.type === "income") {
      if (!val.partyType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["partyType"],
          message: "ຕ້ອງເລືອກລູກຄ້າຫຼືຜູ້ກ່ຽວຂ້ອງ",
        });
      } else if (val.partyType === "customer" && !val.customerId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["customerId"],
          message: "ຕ້ອງເລືອກລູກຄ້າ",
        });
      } else if (val.partyType === "internal" && !val.relatedParty?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["relatedParty"],
          message: "ຕ້ອງເລືອກຜູ້ກ່ຽວຂ້ອງ",
        });
      }
    }
  });
export type CreateLedgerEntryDTO = z.infer<typeof CreateLedgerEntrySchema>;

/** Server-side fields when persisting ledger rows (not from HTTP form). */
export type CreateLedgerEntryRepoInput = CreateLedgerEntryDTO & {
  createdBy?: string | null;
  sourceType?: LedgerSourceTypeDTO;
  paymentId?: string | null;
  invoiceId?: string | null;
  receiptId?: string | null;
};

export const UpdateLedgerEntrySchema = CreateLedgerEntrySchema;
export type UpdateLedgerEntryDTO = z.infer<typeof UpdateLedgerEntrySchema>;

export const ConvertLedgerPartySchema = z.object({
  sourceRelatedParty: z.string().trim().min(1, "ຕ້ອງເລືອກຜູ້ກ່ຽວຂ້ອງ"),
  customerId: z.string().trim().min(1, "ຕ້ອງເລືອກລູກຄ້າ"),
});
export type ConvertLedgerPartyDTO = z.infer<typeof ConvertLedgerPartySchema>;

export const LinkLedgerPaymentSchema = z.object({
  ledgerEntryId: z.string().trim().min(1, "ຕ້ອງເລືອກລາຍການ ledger"),
  paymentId: z.string().trim().min(1, "ຕ້ອງເລືອກການຊໍາລະ"),
});
export type LinkLedgerPaymentDTO = z.infer<typeof LinkLedgerPaymentSchema>;
