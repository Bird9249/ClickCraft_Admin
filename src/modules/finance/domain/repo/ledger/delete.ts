import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import { assertLedgerEntryMutable } from "./delete-by-payment";

export async function deleteLedgerEntry(id: string, client: DbTransaction) {
  const [existing] = await client
    .select({ sourceType: schema.ledgerEntry.sourceType })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.id, id));
  if (!existing) return null;
  assertLedgerEntryMutable(existing.sourceType);

  const [row] = await client
    .delete(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.id, id))
    .returning();
  return row ?? null;
}
