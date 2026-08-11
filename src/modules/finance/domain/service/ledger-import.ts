import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import {
  buildImportNotes,
  LEDGER_CSV_IMPORT_MARKER,
  parseLedgerCsv,
} from "../ledger-csv";
import { createLedgerEntry } from "../repo/ledger/create";
import { getLedgerSummary } from "../repo/ledger/list";

export type LedgerImportMode = "append" | "replace";

export async function importLedgerCsvService(
  client: DbTransaction,
  params: {
    csvText: string;
    mode: LedgerImportMode;
    actorId?: string | null;
  },
) {
  const parsed = parseLedgerCsv(params.csvText);
  if (parsed.rows.length === 0) {
    const detail =
      parsed.errors[0] ?? "No valid rows found in CSV";
    throw new Error(detail);
  }

  if (params.mode === "replace") {
    await client.delete(schema.ledgerEntry);
  }

  const batchId = `${LEDGER_CSV_IMPORT_MARKER}_${new Date().toISOString()}`;

  for (const row of parsed.rows) {
    await createLedgerEntry(
      {
        type: row.type,
        entryDate: row.entryDate,
        category: row.category,
        amount: row.amount,
        relatedParty: row.relatedParty,
        notes: buildImportNotes(batchId, row.notes),
        sourceType: "csv_import",
        createdBy: params.actorId ?? null,
      },
      client,
    );
  }

  const summary = await getLedgerSummary(client);

  return {
    imported: parsed.rows.length,
    skipped: parsed.skipped,
    errors: parsed.errors,
    batchId,
    summary,
  };
}
