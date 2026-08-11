/** Default income category for payment-linked ledger entries. */
export const LEDGER_PAYMENT_INCOME_CATEGORY = "ຄ່າພັດທະນາ";

export function buildPaymentLedgerNotes(params: {
  invoiceNumber: string;
  receiptNumber: string;
  milestoneLabel?: string | null;
}) {
  const parts = [params.invoiceNumber, params.receiptNumber];
  const milestone = params.milestoneLabel?.trim();
  if (milestone) parts.push(milestone);
  return parts.join(" / ");
}
