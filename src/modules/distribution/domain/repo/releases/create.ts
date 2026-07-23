import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { CreateReleaseDTO } from "../../contracts";

export async function createRelease(
  input: CreateReleaseDTO & { createdByUserId?: string | null },
  client: DbTransaction,
) {
  const [row] = await client
    .insert(schema.distributionRelease)
    .values({
      appId: input.appId,
      platform: input.platform ?? "android",
      version: input.version,
      buildNumber: input.buildNumber,
      fileKey: input.fileKey,
      fileName: input.fileName,
      fileSize: input.fileSize,
      contentType: input.contentType ?? null,
      checksumSha256: input.checksumSha256 ?? null,
      changelog: input.changelog ?? null,
      status: "draft",
      createdByUserId: input.createdByUserId ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create release");
  return row;
}
