import { schema } from "@/server/platform/db/client";
import type { OffsetPageQueryDTO } from "@/shared/contracts/base";
import { buildOrderBy, buildWhereGroups } from "@/shared/db/query";
import type { DbTransaction } from "@/shared/types";
import { sql } from "drizzle-orm";

const columns = {
  id: schema.quotationLead.id,
  status: schema.quotationLead.status,
  companyName: schema.quotationLead.companyName,
  contactName: schema.quotationLead.contactName,
  phone: schema.quotationLead.phone,
  presetId: schema.quotationLead.presetId,
  presetName: schema.quotationLead.presetName,
  phaseLabel: schema.quotationLead.phaseLabel,
  estimatedSubtotal: schema.quotationLead.estimatedSubtotal,
  currency: schema.quotationLead.currency,
  createdAt: schema.quotationLead.createdAt,
  updatedAt: schema.quotationLead.updatedAt,
  contactedAt: schema.quotationLead.contactedAt,
  convertedAt: schema.quotationLead.convertedAt,
} as const;

export async function listLeads(
  query: OffsetPageQueryDTO,
  client: DbTransaction,
) {
  const orderBy = buildOrderBy(columns, query.sort);
  const whereExpr = buildWhereGroups(columns, query.filters ?? []);

  const countRow = await client
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(schema.quotationLead)
    .where(whereExpr);
  const total = countRow[0]?.count ?? 0;

  const base = client
    .select({
      id: schema.quotationLead.id,
      status: schema.quotationLead.status,
      companyName: schema.quotationLead.companyName,
      contactName: schema.quotationLead.contactName,
      phone: schema.quotationLead.phone,
      presetId: schema.quotationLead.presetId,
      presetName: schema.quotationLead.presetName,
      phaseIndex: schema.quotationLead.phaseIndex,
      phaseLabel: schema.quotationLead.phaseLabel,
      estimatedSubtotal: schema.quotationLead.estimatedSubtotal,
      currency: schema.quotationLead.currency,
      source: schema.quotationLead.source,
      createdAt: schema.quotationLead.createdAt,
      updatedAt: schema.quotationLead.updatedAt,
      contactedAt: schema.quotationLead.contactedAt,
      convertedAt: schema.quotationLead.convertedAt,
      customerId: schema.quotationLead.customerId,
      quotationId: schema.quotationLead.quotationId,
    })
    .from(schema.quotationLead)
    .where(whereExpr);

  const ordered =
    orderBy && orderBy.length > 0 ? base.orderBy(...orderBy) : base;
  const rows = await ordered.limit(query.limit).offset(query.offset);

  return {
    data: rows,
    meta: { total, limit: query.limit, offset: query.offset },
  };
}
