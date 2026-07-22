import { schema } from "@/server/platform/db/client";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import { and, isNull, sql } from "drizzle-orm";

const columns = {
  id: schema.customer.id,
  name: schema.customer.name,
  nameLocal: schema.customer.nameLocal,
  email: schema.customer.email,
  phone: schema.customer.phone,
  type: schema.customer.type,
  createdAt: schema.customer.createdAt,
  updatedAt: schema.customer.updatedAt,
} as const;

export async function listCustomers(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const filterExpr = buildWhereGroups(columns, query.filters ?? []);
  const notDeleted = isNull(schema.customer.deletedAt);
  const whereExpr = filterExpr ? and(notDeleted, filterExpr) : notDeleted;

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.customer)
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const base = client
    .select()
    .from(schema.customer)
    .where(whereExpr);

  const ordered =
    orderBy && orderBy.length > 0 ? base.orderBy(...orderBy) : base;
  const rows = await ordered.limit(query.limit).offset(query.offset);

  return {
    data: rows,
    meta: { total, limit: query.limit, offset: query.offset },
  };
}
