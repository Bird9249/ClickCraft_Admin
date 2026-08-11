import { schema } from "@/server/platform/db/client";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import { asc, eq, sql } from "drizzle-orm";

const columns = {
  id: schema.ledgerEntry.id,
  type: schema.ledgerEntry.type,
  entryDate: schema.ledgerEntry.entryDate,
  category: schema.ledgerEntry.category,
  amount: schema.ledgerEntry.amount,
  relatedParty: schema.ledgerEntry.relatedParty,
  sourceType: schema.ledgerEntry.sourceType,
  notes: schema.ledgerEntry.notes,
  createdAt: schema.ledgerEntry.createdAt,
  updatedAt: schema.ledgerEntry.updatedAt,
} as const;

function signedAmount(type: string, amount: number) {
  return type === "income" ? amount : -amount;
}

/** Compute running balance map for all entries (ordered by date). */
async function buildRunningBalanceMap(client: DbTransaction) {
  const all = await client
    .select({
      id: schema.ledgerEntry.id,
      type: schema.ledgerEntry.type,
      amount: schema.ledgerEntry.amount,
    })
    .from(schema.ledgerEntry)
    .orderBy(
      asc(schema.ledgerEntry.entryDate),
      asc(schema.ledgerEntry.createdAt),
    );

  let balance = 0;
  const map = new Map<string, number>();
  for (const row of all) {
    balance += signedAmount(row.type, row.amount);
    map.set(row.id, balance);
  }
  return map;
}

export async function getLedgerSummary(client: DbTransaction) {
  const rows = await client
    .select({
      type: schema.ledgerEntry.type,
      total: sql<number>`cast(coalesce(sum(${schema.ledgerEntry.amount}), 0) as int)`,
    })
    .from(schema.ledgerEntry)
    .groupBy(schema.ledgerEntry.type);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.ledgerEntry);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of rows) {
    if (row.type === "income") totalIncome = row.total;
    if (row.type === "expense") totalExpense = row.total;
  }

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    entryCount: countRow[0]?.count ?? 0,
  };
}

export async function listLedgerEntries(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const whereExpr = buildWhereGroups(columns, query.filters ?? []);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.ledgerEntry)
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const ledgerSelect = {
    id: schema.ledgerEntry.id,
    type: schema.ledgerEntry.type,
    entryDate: schema.ledgerEntry.entryDate,
    category: schema.ledgerEntry.category,
    amount: schema.ledgerEntry.amount,
    relatedParty: schema.ledgerEntry.relatedParty,
    partyType: schema.ledgerEntry.partyType,
    customerId: schema.ledgerEntry.customerId,
    notes: schema.ledgerEntry.notes,
    sourceType: schema.ledgerEntry.sourceType,
    paymentId: schema.ledgerEntry.paymentId,
    invoiceId: schema.ledgerEntry.invoiceId,
    receiptId: schema.ledgerEntry.receiptId,
    createdBy: schema.ledgerEntry.createdBy,
    createdAt: schema.ledgerEntry.createdAt,
    updatedAt: schema.ledgerEntry.updatedAt,
    invoiceNumber: schema.invoice.number,
    receiptNumber: schema.receipt.number,
  } as const;

  const base = client
    .select(ledgerSelect)
    .from(schema.ledgerEntry)
    .leftJoin(
      schema.invoice,
      eq(schema.ledgerEntry.invoiceId, schema.invoice.id),
    )
    .leftJoin(
      schema.receipt,
      eq(schema.ledgerEntry.receiptId, schema.receipt.id),
    )
    .where(whereExpr);

  const defaultOrder = [
    asc(schema.ledgerEntry.entryDate),
    asc(schema.ledgerEntry.createdAt),
  ];
  const ordered =
    orderBy && orderBy.length > 0
      ? base.orderBy(...orderBy)
      : base.orderBy(...defaultOrder);

  const rows = await ordered.limit(query.limit).offset(query.offset);
  const balanceMap = await buildRunningBalanceMap(client);

  return {
    data: rows.map((row) => ({
      ...row,
      runningBalance: balanceMap.get(row.id) ?? 0,
    })),
    meta: { total, limit: query.limit, offset: query.offset },
  };
}

export async function listLedgerDistinctValues(client: DbTransaction) {
  const categories = await client
    .selectDistinct({ value: schema.ledgerEntry.category })
    .from(schema.ledgerEntry)
    .orderBy(asc(schema.ledgerEntry.category));

  const parties = await client
    .selectDistinct({ value: schema.ledgerEntry.relatedParty })
    .from(schema.ledgerEntry)
    .where(sql`${schema.ledgerEntry.relatedParty} is not null`)
    .orderBy(asc(schema.ledgerEntry.relatedParty));

  return {
    categories: categories.map((r) => r.value).filter(Boolean),
    relatedParties: parties
      .map((r) => r.value)
      .filter((v): v is string => !!v),
  };
}
