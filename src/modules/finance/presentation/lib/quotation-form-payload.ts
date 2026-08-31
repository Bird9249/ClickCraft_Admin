import type { QuotationFormValues } from "../ui/QuotationForm";
import { mapFormLinesToApi } from "./line-form";

export function buildQuotationPayload(vals: QuotationFormValues) {
  const isAttachment = vals.documentMode === "attachment";
  return {
    customerId: vals.customerId,
    issueDate: new Date(vals.issueDate),
    validUntil: vals.validUntil ? new Date(vals.validUntil) : null,
    currency: vals.currency,
    taxNote: vals.taxNote || null,
    notes: vals.notes || null,
    internalNotes: vals.internalNotes || null,
    showSignature: vals.showSignature,
    documentMode: vals.documentMode,
    paymentSchedule: vals.paymentSchedule,
    attachmentFileKey: isAttachment ? vals.attachmentFileKey : null,
    attachmentFileName: isAttachment ? vals.attachmentFileName : null,
    attachmentContentType: isAttachment ? vals.attachmentContentType : null,
    contractTotal: isAttachment ? vals.contractTotal : undefined,
    lines: isAttachment ? [] : mapFormLinesToApi(vals.lines),
  };
}
