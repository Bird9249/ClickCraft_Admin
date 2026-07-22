import { schema } from "@/server/platform/db/client";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import { sql } from "drizzle-orm";

const columns = {
  id: schema.receipt.id,
  number: schema.receipt.number,
  status: schema.receipt.status,
  customerId: schema.receipt.customerId,
  customerName: schema.customer.name,
  invoiceId: schema.receipt.invoiceId,
  invoiceNumber: schema.invoice.number,
  amount: schema.receipt.amount,
  issueDate: schema.receipt.issueDate,
  createdAt: schema.receipt.createdAt,
} as const;

export async function listReceipts(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const whereExpr = buildWhereGroups(columns, query.filters ?? []);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.receipt)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.receipt.customerId}`,
    )
    .leftJoin(
      schema.invoice,
      sql`${schema.invoice.id} = ${schema.receipt.invoiceId}`,
    )
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const base = client
    .select({
      id: schema.receipt.id,
      number: schema.receipt.number,
      status: schema.receipt.status,
      customerId: schema.receipt.customerId,
      invoiceId: schema.receipt.invoiceId,
      paymentId: schema.receipt.paymentId,
      issueDate: schema.receipt.issueDate,
      amount: schema.receipt.amount,
      currency: schema.receipt.currency,
      showSignature: schema.receipt.showSignature,
      createdAt: schema.receipt.createdAt,
      customerName: schema.customer.name,
      invoiceNumber: schema.invoice.number,
    })
    .from(schema.receipt)
    .leftJoin(
      schema.customer,
      sql`${schema.customer.id} = ${schema.receipt.customerId}`,
    )
    .leftJoin(
      schema.invoice,
      sql`${schema.invoice.id} = ${schema.receipt.invoiceId}`,
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
