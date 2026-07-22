import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { CreatePaymentDTO } from "../contracts";
import { createPaymentWithReceipt } from "../repo/payments/create";
import { getReceiptById } from "../repo/receipts/get-by-id";

export async function createPaymentService(
  client: DbTransaction,
  params: { input: CreatePaymentDTO; actorId?: string | null },
) {
  return createPaymentWithReceipt(
    { ...params.input, createdBy: params.actorId ?? null },
    client,
  );
}

export async function voidReceiptService(
  client: DbTransaction,
  params: { id: string },
) {
  const rc = await getReceiptById(params.id, client);
  if (!rc) throw new Error("Receipt not found");
  if (rc.status === "void") throw new Error("Receipt already voided");

  await client
    .update(schema.receipt)
    .set({ status: "void", updatedAt: new Date() })
    .where(eq(schema.receipt.id, params.id));

  const [inv] = await client
    .select()
    .from(schema.invoice)
    .where(eq(schema.invoice.id, rc.invoiceId));

  if (inv) {
    const newAmountPaid = Math.max(0, (inv.amountPaid ?? 0) - rc.amount);
    const newStatus =
      inv.status === "paid" || inv.status === "partial"
        ? newAmountPaid === 0
          ? "issued"
          : "partial"
        : inv.status;

    await client
      .update(schema.invoice)
      .set({ amountPaid: newAmountPaid, status: newStatus, updatedAt: new Date() })
      .where(eq(schema.invoice.id, rc.invoiceId));
  }

  return { voided: true };
}
