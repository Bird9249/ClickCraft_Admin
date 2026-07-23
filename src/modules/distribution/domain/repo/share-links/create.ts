import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";

export async function createShareLink(
  input: {
    releaseId: string;
    token: string;
    label?: string | null;
    expiresAt: Date;
    maxDownloads?: number | null;
    createdByUserId?: string | null;
  },
  client: DbTransaction,
) {
  const [row] = await client
    .insert(schema.distributionShareLink)
    .values({
      releaseId: input.releaseId,
      token: input.token,
      label: input.label ?? null,
      expiresAt: input.expiresAt,
      maxDownloads: input.maxDownloads ?? null,
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create share link");
  return row;
}
