import type { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import {
  buildPaymentLedgerNotes,
  LEDGER_PAYMENT_INCOME_CATEGORY,
} from "../ledger-payment-constants";
import { createLedgerEntry } from "../repo/ledger/create";
import { getFinanceSettings } from "../repo/settings/get";

type PaymentRow = typeof schema.payment.$inferSelect;
type ReceiptRow = typeof schema.receipt.$inferSelect;
type InvoiceRow = typeof schema.invoice.$inferSelect;

export async function createLedgerFromPaymentIfEnabled(
  client: DbTransaction,
  params: {
    payment: PaymentRow;
    receipt: ReceiptRow;
    invoice: InvoiceRow;
    actorId?: string | null;
  },
) {
  const settings = await getFinanceSettings(client);
  if (!settings.autoLedgerOnPayment) return null;

  return createLedgerEntry(
    {
      type: "income",
      entryDate: params.payment.paidAt,
      category: LEDGER_PAYMENT_INCOME_CATEGORY,
      amount: params.payment.amount,
      partyType: "customer",
      customerId: params.invoice.customerId,
      notes: buildPaymentLedgerNotes({
        invoiceNumber: params.invoice.number,
        receiptNumber: params.receipt.number,
        milestoneLabel: params.invoice.milestoneLabel,
      }),
      sourceType: "payment",
      paymentId: params.payment.id,
      invoiceId: params.invoice.id,
      receiptId: params.receipt.id,
      createdBy: params.actorId ?? null,
    },
    client,
  );
}
