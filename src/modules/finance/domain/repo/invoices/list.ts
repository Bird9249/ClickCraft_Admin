import { schema } from "@/server/platform/db/client";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import { sql } from "drizzle-orm";

const columns = {
  id: schema.invoice.id,
  number: schema.invoice.number,
  status: schema.invoice.status,
  customerId: schema.invoice.customerId,
  customerName: schema.customer.name,
  issueDate: schema.invoice.issueDate,
  dueDate: schema.invoice.dueDate,
  total: schema.invoice.total,
  amountPaid: schema.invoice.amountPaid,
  currency: schema.invoice.currency,
  createdAt: schema.invoice.createdAt,
} as const;

export async function listInvoices(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const whereExpr = buildWhereGroups(columns, query.filters ?? []);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.invoice)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.invoice.customerId}`,
    )
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const base = client
    .select({
      id: schema.invoice.id,
      number: schema.invoice.number,
      status: schema.invoice.status,
      customerId: schema.invoice.customerId,
      quotationId: schema.invoice.quotationId,
      issueDate: schema.invoice.issueDate,
      dueDate: schema.invoice.dueDate,
      milestoneLabel: schema.invoice.milestoneLabel,
      currency: schema.invoice.currency,
      subtotal: schema.invoice.subtotal,
      taxAmount: schema.invoice.taxAmount,
      total: schema.invoice.total,
      amountPaid: schema.invoice.amountPaid,
      createdAt: schema.invoice.createdAt,
      customerName: schema.customer.name,
    })
    .from(schema.invoice)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.invoice.customerId}`,
    )
    .where(whereExpr);

  const ordered =
    orderBy && orderBy.length > 0 ? base.orderBy(...orderBy) : base;
  const rows = await ordered.limit(query.limit).offset(query.offset);

  return {
    data: rows,
    meta: { total, limit: query.limit, offset: query.offset },
  };
}
