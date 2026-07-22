import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { and, asc, desc, eq, gte, inArray, lt, ne, sql } from "drizzle-orm";

const OPEN_INVOICE_STATUSES = ["issued", "partial"] as const;

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfNextMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}

const LAO_MONTH_SHORT = [
  "ມ.ກ",
  "ກ.ພ",
  "ມີ.ນ",
  "ມ.ສ",
  "ພ.ພ",
  "ມິ.ຖ",
  "ກ.ກ",
  "ສ.ຫ",
  "ກ.ຍ",
  "ຕ.ລ",
  "ພ.ຈ",
  "ທ.ວ",
] as const;

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonthKeys(n: number, from = new Date()): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(from.getFullYear(), from.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  return keys;
}

function toMonthMap(rows: { month: string; value: number }[]) {
  const map = new Map<string, number>();
  for (const row of rows) {
    map.set(row.month, Number(row.value) || 0);
  }
  return map;
}

export async function getDashboardSummary(client: DbTransaction) {
  const monthStart = startOfMonth();
  const monthEnd = startOfNextMonth();
  const seriesStart = startOfMonth(
    new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
  );
  const monthKeys = lastNMonthKeys(6);

  const [outstandingRow] = await client
    .select({
      amount: sql<number>`coalesce(sum(${schema.invoice.total} - ${schema.invoice.amountPaid}), 0)::int`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.invoice)
    .where(inArray(schema.invoice.status, [...OPEN_INVOICE_STATUSES]));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [overdueRow] = await client
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.invoice)
    .where(
      and(
        inArray(schema.invoice.status, [...OPEN_INVOICE_STATUSES]),
        lt(schema.invoice.dueDate, today),
      ),
    );

  const [receivedRow] = await client
    .select({
      amount: sql<number>`coalesce(sum(${schema.receipt.amount}), 0)::int`,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.receipt)
    .where(
      and(
        ne(schema.receipt.status, "void"),
        gte(schema.receipt.issueDate, monthStart),
        lt(schema.receipt.issueDate, monthEnd),
      ),
    );

  const quotationStatusRows = await client
    .select({
      status: schema.quotation.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.quotation)
    .groupBy(schema.quotation.status);

  const quotationPipeline = {
    draft: 0,
    sent: 0,
    accepted: 0,
    rejected: 0,
    void: 0,
  };
  for (const row of quotationStatusRows) {
    if (row.status in quotationPipeline) {
      quotationPipeline[row.status as keyof typeof quotationPipeline] =
        row.count;
    }
  }

  const quotationsOpenCount =
    quotationPipeline.draft + quotationPipeline.sent;

  const attentionInvoices = await client
    .select({
      id: schema.invoice.id,
      number: schema.invoice.number,
      status: schema.invoice.status,
      dueDate: schema.invoice.dueDate,
      total: schema.invoice.total,
      amountPaid: schema.invoice.amountPaid,
      currency: schema.invoice.currency,
      customerName: schema.customer.name,
    })
    .from(schema.invoice)
    .leftJoin(
      schema.customer,
      eq(schema.customer.id, schema.invoice.customerId),
    )
    .where(inArray(schema.invoice.status, [...OPEN_INVOICE_STATUSES]))
    .orderBy(asc(schema.invoice.dueDate), desc(schema.invoice.issueDate))
    .limit(5);

  const recentQuotations = await client
    .select({
      id: schema.quotation.id,
      number: schema.quotation.number,
      status: schema.quotation.status,
      total: schema.quotation.total,
      currency: schema.quotation.currency,
      issueDate: schema.quotation.issueDate,
      updatedAt: schema.quotation.updatedAt,
      customerName: schema.customer.name,
    })
    .from(schema.quotation)
    .leftJoin(
      schema.customer,
      eq(schema.customer.id, schema.quotation.customerId),
    )
    .orderBy(desc(schema.quotation.updatedAt))
    .limit(5);

  const [newLeadsRow] = await client
    .select({
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.quotationLead)
    .where(eq(schema.quotationLead.status, "new"));

  const receivedByMonthRows = await client
    .select({
      month: sql<string>`to_char(date_trunc('month', ${schema.receipt.issueDate}), 'YYYY-MM')`,
      value: sql<number>`coalesce(sum(${schema.receipt.amount}), 0)::int`,
    })
    .from(schema.receipt)
    .where(
      and(
        ne(schema.receipt.status, "void"),
        gte(schema.receipt.issueDate, seriesStart),
      ),
    )
    .groupBy(sql`date_trunc('month', ${schema.receipt.issueDate})`);

  const quotationsByMonthRows = await client
    .select({
      month: sql<string>`to_char(date_trunc('month', ${schema.quotation.createdAt}), 'YYYY-MM')`,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.quotation)
    .where(gte(schema.quotation.createdAt, seriesStart))
    .groupBy(sql`date_trunc('month', ${schema.quotation.createdAt})`);

  const leadsByMonthRows = await client
    .select({
      month: sql<string>`to_char(date_trunc('month', ${schema.quotationLead.createdAt}), 'YYYY-MM')`,
      value: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.quotationLead)
    .where(gte(schema.quotationLead.createdAt, seriesStart))
    .groupBy(sql`date_trunc('month', ${schema.quotationLead.createdAt})`);

  const receivedMap = toMonthMap(receivedByMonthRows);
  const quotationsMap = toMonthMap(quotationsByMonthRows);
  const leadsMap = toMonthMap(leadsByMonthRows);

  const monthlySeries = monthKeys.map((key) => {
    const [y, m] = key.split("-").map(Number);
    const monthIndex = (m ?? 1) - 1;
    return {
      month: key,
      label: LAO_MONTH_SHORT[monthIndex] ?? key,
      year: y,
      received: receivedMap.get(key) ?? 0,
      quotations: quotationsMap.get(key) ?? 0,
      leads: leadsMap.get(key) ?? 0,
    };
  });

  const invoiceStatusRows = await client
    .select({
      status: schema.invoice.status,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(schema.invoice)
    .groupBy(schema.invoice.status);

  const invoiceStatus = {
    draft: 0,
    issued: 0,
    partial: 0,
    paid: 0,
    void: 0,
  };
  for (const row of invoiceStatusRows) {
    if (row.status in invoiceStatus) {
      invoiceStatus[row.status as keyof typeof invoiceStatus] = row.count;
    }
  }

  return {
    currency: "LAK",
    outstandingAmount: outstandingRow?.amount ?? 0,
    openInvoicesCount: outstandingRow?.count ?? 0,
    overdueInvoicesCount: overdueRow?.count ?? 0,
    quotationsOpenCount,
    receivedThisMonth: receivedRow?.amount ?? 0,
    receiptsThisMonthCount: receivedRow?.count ?? 0,
    newLeadsCount: newLeadsRow?.count ?? 0,
    quotationPipeline,
    monthlySeries,
    invoiceStatus,
    attentionInvoices: attentionInvoices.map((row) => ({
      ...row,
      remaining: row.total - (row.amountPaid ?? 0),
      customerName: row.customerName ?? "—",
    })),
    recentQuotations: recentQuotations.map((row) => ({
      ...row,
      customerName: row.customerName ?? "—",
    })),
  };
}

export type DashboardSummary = Awaited<
  ReturnType<typeof getDashboardSummary>
>;
