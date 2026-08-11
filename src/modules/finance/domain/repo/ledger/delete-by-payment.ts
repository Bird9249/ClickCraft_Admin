import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

export async function deleteLedgerByPaymentId(
  paymentId: string,
  client: DbTransaction,
) {
  const rows = await client
    .delete(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.paymentId, paymentId))
    .returning();
  return rows;
}

export function assertLedgerEntryMutable(sourceType: string | null | undefined) {
  if (sourceType === "payment") {
    throw new Error(
      "Cannot modify ledger entry linked to a payment. Void the receipt instead.",
    );
  }
}
