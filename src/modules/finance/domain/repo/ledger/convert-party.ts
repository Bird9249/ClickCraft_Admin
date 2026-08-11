import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { and, asc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { isInternalPartyName } from "../../ledger-party-constants";

export async function listConvertibleRelatedParties(client: DbTransaction) {
  const rows = await client
    .select({
      name: schema.ledgerEntry.relatedParty,
      entryCount: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.ledgerEntry)
    .where(
      and(
        isNotNull(schema.ledgerEntry.relatedParty),
        isNull(schema.ledgerEntry.customerId),
      ),
    )
    .groupBy(schema.ledgerEntry.relatedParty)
    .orderBy(asc(schema.ledgerEntry.relatedParty));

  return rows.filter(
    (row): row is { name: string; entryCount: number } =>
      !!row.name && !isInternalPartyName(row.name),
  );
}

export async function countLedgerByRelatedParty(
  sourceRelatedParty: string,
  client: DbTransaction,
) {
  const [row] = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.relatedParty, sourceRelatedParty));
  return row?.count ?? 0;
}

export async function convertRelatedPartyToCustomer(
  params: {
    sourceRelatedParty: string;
    customerId: string;
    customerName: string;
  },
  client: DbTransaction,
) {
  const updated = await client
    .update(schema.ledgerEntry)
    .set({
      partyType: "customer",
      customerId: params.customerId,
      relatedParty: params.customerName,
      updatedAt: new Date(),
    })
    .where(eq(schema.ledgerEntry.relatedParty, params.sourceRelatedParty))
    .returning({ id: schema.ledgerEntry.id });

  return updated;
}
