import type { DbTransaction } from "@/shared/types";
import type {
  CreateLedgerEntryDTO,
  UpdateLedgerEntryDTO,
} from "../contracts";
import { createLedgerEntry } from "../repo/ledger/create";
import { deleteLedgerEntry } from "../repo/ledger/delete";
import { updateLedgerEntry } from "../repo/ledger/update";

export async function createLedgerEntryService(
  client: DbTransaction,
  params: { input: CreateLedgerEntryDTO; actorId?: string | null },
) {
  const created = await createLedgerEntry(
    {
      ...params.input,
      sourceType: "manual",
      createdBy: params.actorId ?? null,
    },
    client,
  );
  return { created };
}

export async function updateLedgerEntryService(
  client: DbTransaction,
  params: { id: string; input: UpdateLedgerEntryDTO },
) {
  const updated = await updateLedgerEntry(params.id, params.input, client);
  if (!updated) throw new Error("Ledger entry not found");
  return { updated };
}

export async function deleteLedgerEntryService(
  client: DbTransaction,
  params: { id: string },
) {
  const deleted = await deleteLedgerEntry(params.id, client);
  if (!deleted) throw new Error("Ledger entry not found");
  return { deleted };
}
