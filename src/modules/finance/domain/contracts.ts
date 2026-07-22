import { z } from "zod";
import { DEFAULT_PAYMENT_SCHEDULE } from "./payment-schedule";

// ─── Shared ──────────────────────────────────────────────────────────────────

export const IdParamSchema = z.object({ id: z.string().min(1) });
export type IdParamDTO = z.infer<typeof IdParamSchema>;

// ─── Lines ────────────────────────────────────────────────────────────────────

export const LineInputSchema = z.object({
  description: z.string().min(1, "ຕ້ອງໃສ່ລາຍການ"),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().int().min(0).default(0),
  sortOrder: z.number().int().min(0).default(0),
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
});
export type UpdateFinanceSettingsDTO = z.infer<
  typeof UpdateFinanceSettingsSchema
>;
