import { eq } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function getAppById(id: string, client: DbTransaction) {
  const [row] = await client
    .select({
      id: schema.distributionApp.id,
      name: schema.distributionApp.name,
      slug: schema.distributionApp.slug,
      createdAt: schema.distributionApp.createdAt,
      updatedAt: schema.distributionApp.updatedAt,
    })
    .from(schema.distributionApp)
    .where(eq(schema.distributionApp.id, id))
    .limit(1);
  return row ?? null;
}
