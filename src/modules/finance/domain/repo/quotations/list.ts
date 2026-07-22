import { schema } from "@/server/platform/db/client";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import { sql } from "drizzle-orm";

const columns = {
  id: schema.quotation.id,
  number: schema.quotation.number,
  status: schema.quotation.status,
  customerId: schema.quotation.customerId,
  customerName: schema.customer.name,
  issueDate: schema.quotation.issueDate,
  total: schema.quotation.total,
  currency: schema.quotation.currency,
  createdAt: schema.quotation.createdAt,
} as const;

export async function listQuotations(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const whereExpr = buildWhereGroups(columns, query.filters ?? []);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.quotation)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.quotation.customerId}`,
    )
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const base = client
    .select({
      id: schema.quotation.id,
      number: schema.quotation.number,
      status: schema.quotation.status,
      customerId: schema.quotation.customerId,
      issueDate: schema.quotation.issueDate,
      validUntil: schema.quotation.validUntil,
      currency: schema.quotation.currency,
      subtotal: schema.quotation.subtotal,
      taxAmount: schema.quotation.taxAmount,
      total: schema.quotation.total,
      createdAt: schema.quotation.createdAt,
      customerName: schema.customer.name,
    })
    .from(schema.quotation)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.quotation.customerId}`,
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
