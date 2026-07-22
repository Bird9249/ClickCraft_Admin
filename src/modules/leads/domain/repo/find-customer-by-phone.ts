import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { and, eq, isNull, sql } from "drizzle-orm";

/** Digits-only phone for loose matching. */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function findCustomerByPhone(
  phone: string,
  client: DbTransaction,
) {
  const digits = normalizePhone(phone);
  if (!digits) return null;

  const [row] = await client
    .select()
    .from(schema.customer)
    .where(
      and(
        isNull(schema.customer.deletedAt),
        sql`regexp_replace(coalesce(${schema.customer.phone}, ''), '\\D', '', 'g') = ${digits}`,
      ),
    )
    .limit(1);

  if (row) return row;

  const [exact] = await client
    .select()
    .from(schema.customer)
    .where(
      and(isNull(schema.customer.deletedAt), eq(schema.customer.phone, phone)),
    )
    .limit(1);
  return exact ?? null;
}
