import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { and, desc, eq, isNull, sql } from "drizzle-orm";

export type UnlinkedLedgerRow = {
  id: string;
  entryDate: Date;
  category: string;
  amount: number;
  relatedParty: string | null;
  customerId: string | null;
  sourceType: string;
  notes: string | null;
};

export type UnlinkedPaymentRow = {
  paymentId: string;
  paidAt: Date;
  amount: number;
  method: string;
  reference: string | null;
  receiptId: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
};

export async function listUnlinkedLedgerIncome(
  client: DbTransaction,
  limit = 100,
) {
  return client
    .select({
      id: schema.ledgerEntry.id,
      entryDate: schema.ledgerEntry.entryDate,
      category: schema.ledgerEntry.category,
      amount: schema.ledgerEntry.amount,
      relatedParty: schema.ledgerEntry.relatedParty,
      customerId: schema.ledgerEntry.customerId,
      sourceType: schema.ledgerEntry.sourceType,
      notes: schema.ledgerEntry.notes,
    })
    .from(schema.ledgerEntry)
    .where(
      and(
        eq(schema.ledgerEntry.type, "income"),
        isNull(schema.ledgerEntry.paymentId),
        sql`${schema.ledgerEntry.sourceType} in ('manual', 'csv_import')`,
      ),
    )
    .orderBy(desc(schema.ledgerEntry.entryDate), desc(schema.ledgerEntry.createdAt))
    .limit(limit);
}

export async function listUnlinkedPayments(client: DbTransaction, limit = 100) {
  return client
    .select({
      paymentId: schema.payment.id,
      paidAt: schema.payment.paidAt,
      amount: schema.payment.amount,
      method: schema.payment.method,
      reference: schema.payment.reference,
      receiptId: schema.receipt.id,
      receiptNumber: schema.receipt.number,
      invoiceId: schema.invoice.id,
      invoiceNumber: schema.invoice.number,
      customerId: schema.customer.id,
      customerName: schema.customer.name,
    })
    .from(schema.payment)
    .innerJoin(schema.receipt, eq(schema.receipt.paymentId, schema.payment.id))
    .innerJoin(schema.invoice, eq(schema.invoice.id, schema.payment.invoiceId))
    .innerJoin(schema.customer, eq(schema.customer.id, schema.invoice.customerId))
    .leftJoin(
      schema.ledgerEntry,
      eq(schema.ledgerEntry.paymentId, schema.payment.id),
    )
    .where(
      and(
        eq(schema.receipt.status, "issued"),
        isNull(schema.ledgerEntry.id),
      ),
    )
    .orderBy(desc(schema.payment.paidAt), desc(schema.payment.createdAt))
    .limit(limit);
}

export async function countUnlinkedLedgerIncome(client: DbTransaction) {
  const [row] = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.ledgerEntry)
    .where(
      and(
        eq(schema.ledgerEntry.type, "income"),
        isNull(schema.ledgerEntry.paymentId),
        sql`${schema.ledgerEntry.sourceType} in ('manual', 'csv_import')`,
      ),
    );
  return row?.count ?? 0;
}

export async function countUnlinkedPayments(client: DbTransaction) {
  const [row] = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.payment)
    .innerJoin(schema.receipt, eq(schema.receipt.paymentId, schema.payment.id))
    .leftJoin(
      schema.ledgerEntry,
      eq(schema.ledgerEntry.paymentId, schema.payment.id),
    )
    .where(
      and(eq(schema.receipt.status, "issued"), isNull(schema.ledgerEntry.id)),
    );
  return row?.count ?? 0;
}

export type ReconciliationSuggestion = {
  ledgerEntryId: string;
  paymentId: string;
  ledgerAmount: number;
  paymentAmount: number;
  ledgerDate: Date;
  paymentDate: Date;
  relatedParty: string | null;
  customerName: string;
  receiptNumber: string;
  invoiceNumber: string;
};

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

function daysApart(a: Date, b: Date) {
  return Math.abs(a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24);
}

function partyMatchesLedger(
  ledger: UnlinkedLedgerRow,
  payment: UnlinkedPaymentRow,
) {
  if (ledger.customerId && ledger.customerId === payment.customerId) {
    return true;
  }
  if (!ledger.relatedParty) return false;
  return (
    normalizeName(ledger.relatedParty) === normalizeName(payment.customerName)
  );
}

export function buildReconciliationSuggestions(
  ledgerRows: UnlinkedLedgerRow[],
  paymentRows: UnlinkedPaymentRow[],
): ReconciliationSuggestion[] {
  const suggestions: ReconciliationSuggestion[] = [];

  for (const ledger of ledgerRows) {
    for (const payment of paymentRows) {
      if (ledger.amount !== payment.amount) continue;
      if (!partyMatchesLedger(ledger, payment)) continue;
      if (daysApart(ledger.entryDate, payment.paidAt) > 60) continue;

      suggestions.push({
        ledgerEntryId: ledger.id,
        paymentId: payment.paymentId,
        ledgerAmount: ledger.amount,
        paymentAmount: payment.amount,
        ledgerDate: ledger.entryDate,
        paymentDate: payment.paidAt,
        relatedParty: ledger.relatedParty,
        customerName: payment.customerName,
        receiptNumber: payment.receiptNumber,
        invoiceNumber: payment.invoiceNumber,
      });
    }
  }

  suggestions.sort(
    (a, b) =>
      daysApart(a.ledgerDate, a.paymentDate) -
      daysApart(b.ledgerDate, b.paymentDate),
  );

  const usedLedger = new Set<string>();
  const usedPayment = new Set<string>();
  const unique: ReconciliationSuggestion[] = [];

  for (const item of suggestions) {
    if (usedLedger.has(item.ledgerEntryId)) continue;
    if (usedPayment.has(item.paymentId)) continue;
    usedLedger.add(item.ledgerEntryId);
    usedPayment.add(item.paymentId);
    unique.push(item);
  }

  return unique;
}

export async function getReconciliationSnapshot(client: DbTransaction) {
  const [unlinkedLedger, unlinkedPayments, unlinkedLedgerCount, unlinkedPaymentCount] =
    await Promise.all([
      listUnlinkedLedgerIncome(client),
      listUnlinkedPayments(client),
      countUnlinkedLedgerIncome(client),
      countUnlinkedPayments(client),
    ]);

  const suggestions = buildReconciliationSuggestions(
    unlinkedLedger,
    unlinkedPayments,
  );

  return {
    unlinkedLedgerCount,
    unlinkedPaymentCount,
    unlinkedLedger,
    unlinkedPayments,
    suggestions,
  };
}
