import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { and, eq, isNull } from "drizzle-orm";
import { buildPaymentLedgerNotes } from "../../ledger-payment-constants";

export async function linkLedgerToPayment(
  input: { ledgerEntryId: string; paymentId: string },
  client: DbTransaction,
) {
  const [ledger] = await client
    .select()
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.id, input.ledgerEntryId));
  if (!ledger) throw new Error("Ledger entry not found");
  if (ledger.type !== "income") {
    throw new Error("Only income entries can be linked to payments");
  }
  if (ledger.paymentId) {
    throw new Error("Ledger entry is already linked to a payment");
  }
  if (ledger.sourceType === "payment") {
    throw new Error("Ledger entry is already marked as payment-sourced");
  }

  const [payment] = await client
    .select()
    .from(schema.payment)
    .where(eq(schema.payment.id, input.paymentId));
  if (!payment) throw new Error("Payment not found");

  const [existingLedger] = await client
    .select({ id: schema.ledgerEntry.id })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.paymentId, input.paymentId));
  if (existingLedger) {
    throw new Error("Payment is already linked to a ledger entry");
  }

  const [receipt] = await client
    .select()
    .from(schema.receipt)
    .where(
      and(
        eq(schema.receipt.paymentId, input.paymentId),
        eq(schema.receipt.status, "issued"),
      ),
    );
  if (!receipt) {
    throw new Error("Issued receipt not found for this payment");
  }

  const [invoice] = await client
    .select()
    .from(schema.invoice)
    .where(eq(schema.invoice.id, payment.invoiceId));
  if (!invoice) throw new Error("Invoice not found");

  const [customer] = await client
    .select({ id: schema.customer.id, name: schema.customer.name })
    .from(schema.customer)
    .where(eq(schema.customer.id, invoice.customerId));
  if (!customer) throw new Error("Customer not found");

  const docNotes = buildPaymentLedgerNotes({
    invoiceNumber: invoice.number,
    receiptNumber: receipt.number,
    milestoneLabel: invoice.milestoneLabel,
  });
  const notes = ledger.notes?.trim()
    ? `${ledger.notes.trim()} | ${docNotes}`
    : docNotes;

  const [updated] = await client
    .update(schema.ledgerEntry)
    .set({
      sourceType: "payment",
      paymentId: payment.id,
      invoiceId: invoice.id,
      receiptId: receipt.id,
      partyType: "customer",
      customerId: customer.id,
      relatedParty: customer.name,
      notes,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.ledgerEntry.id, input.ledgerEntryId),
        isNull(schema.ledgerEntry.paymentId),
      ),
    )
    .returning();

  if (!updated) throw new Error("Failed to link ledger entry to payment");
  return updated;
}
