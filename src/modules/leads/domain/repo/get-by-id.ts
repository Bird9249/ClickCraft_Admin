import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

export async function getLeadById(id: string, client: DbTransaction) {
  const [row] = await client
    .select()
    .from(schema.quotationLead)
    .where(eq(schema.quotationLead.id, id))
    .limit(1);
  return row ?? null;
}
