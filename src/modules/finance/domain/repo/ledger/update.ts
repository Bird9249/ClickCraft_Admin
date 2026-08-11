import { schema } from "@/server/platform/db/client";
import type { UpdateLedgerEntryDTO } from "@/modules/finance/domain/contracts";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import { resolveLedgerParty } from "../../ledger-party";
import { assertLedgerEntryMutable } from "./delete-by-payment";

export async function updateLedgerEntry(
  id: string,
  input: UpdateLedgerEntryDTO,
  client: DbTransaction,
) {
  const [existing] = await client
    .select({ sourceType: schema.ledgerEntry.sourceType })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.id, id));
  if (!existing) return null;
  assertLedgerEntryMutable(existing.sourceType);

  const party = await resolveLedgerParty(input, client);
  const [row] = await client
    .update(schema.ledgerEntry)
    .set({
      type: input.type,
      entryDate: input.entryDate,
      category: input.category,
      amount: input.amount,
      partyType: party.partyType,
      customerId: party.customerId,
      relatedParty: party.relatedParty,
      notes: input.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.ledgerEntry.id, id))
    .returning();
  return row ?? null;
}
