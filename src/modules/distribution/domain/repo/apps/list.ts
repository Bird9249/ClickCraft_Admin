import { asc } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function listApps(client: DbTransaction) {
  return client
    .select({
      id: schema.distributionApp.id,
      name: schema.distributionApp.name,
      slug: schema.distributionApp.slug,
      createdAt: schema.distributionApp.createdAt,
      updatedAt: schema.distributionApp.updatedAt,
    })
    .from(schema.distributionApp)
    .orderBy(asc(schema.distributionApp.name));
}
