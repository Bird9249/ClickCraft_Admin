import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

export async function getLedgerEntryById(id: string, client: DbTransaction) {
  const [row] = await client
    .select()
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.id, id));
  return row ?? null;
}
