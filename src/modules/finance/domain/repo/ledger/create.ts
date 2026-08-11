import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { CreateLedgerEntryRepoInput } from "@/modules/finance/domain/contracts";
import { resolveLedgerParty } from "../../ledger-party";

export async function createLedgerEntry(
  input: CreateLedgerEntryRepoInput,
  client: DbTransaction,
) {
  const party = await resolveLedgerParty(input, client);
  const [row] = await client
    .insert(schema.ledgerEntry)
    .values({
      type: input.type,
      entryDate: input.entryDate,
      category: input.category,
      amount: input.amount,
      partyType: party.partyType,
      customerId: party.customerId,
      relatedParty: party.relatedParty,
      notes: input.notes ?? null,
      sourceType: input.sourceType ?? "manual",
      paymentId: input.paymentId ?? null,
      invoiceId: input.invoiceId ?? null,
      receiptId: input.receiptId ?? null,
      createdBy: input.createdBy ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create ledger entry");
  return row;
}
