import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { CreatePaymentDTO } from "../../contracts";
import { nextDocNumber } from "../../service/sequence";

export async function createPaymentWithReceipt(
  input: CreatePaymentDTO & { createdBy?: string | null },
  client: DbTransaction,
) {
  const [inv] = await client
    .select()
    .from(schema.invoice)
    .where(eq(schema.invoice.id, input.invoiceId));

  if (!inv) throw new Error("Invoice not found");
  if (inv.status === "void") throw new Error("Cannot pay a voided invoice");
  if (inv.status === "paid") throw new Error("Invoice already paid in full");
  if (inv.status === "draft")
    throw new Error("Invoice must be issued before payment");

  const newAmountPaid = (inv.amountPaid ?? 0) + input.amount;
  const newStatus =
    newAmountPaid >= inv.total
      ? "paid"
      : newAmountPaid > 0
        ? "partial"
        : "issued";

  const [pmt] = await client
    .insert(schema.payment)
    .values({
      invoiceId: input.invoiceId,
      amount: input.amount,
      paidAt: input.paidAt,
      method: input.method ?? "transfer",
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  if (!pmt) throw new Error("Failed to create payment");

  const rcNumber = await nextDocNumber(client, "receipt");
  const [rc] = await client
    .insert(schema.receipt)
    .values({
      number: rcNumber,
      status: "issued",
      customerId: inv.customerId,
      invoiceId: input.invoiceId,
      paymentId: pmt.id,
      issueDate: input.paidAt,
      amount: input.amount,
      currency: inv.currency,
      notes: input.notes ?? null,
      showSignature: input.showSignature ?? true,
      createdBy: input.createdBy ?? null,
    })
    .returning();

  await client
    .update(schema.invoice)
    .set({ amountPaid: newAmountPaid, status: newStatus, updatedAt: new Date() })
    .where(eq(schema.invoice.id, input.invoiceId));

  return { payment: pmt, receipt: rc! };
}
