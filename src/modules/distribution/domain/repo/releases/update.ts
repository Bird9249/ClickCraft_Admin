import { eq } from "drizzle-orm";
import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function updateRelease(
  id: string,
  patch: {
    changelog?: string | null;
    status?: string;
    publishedAt?: Date | null;
    updatedAt?: Date;
  },
  client: DbTransaction,
) {
  const [row] = await client
    .update(schema.distributionRelease)
    .set({
      ...patch,
      updatedAt: patch.updatedAt ?? new Date(),
    })
    .where(eq(schema.distributionRelease.id, id))
    .returning();
  return row ?? null;
}
