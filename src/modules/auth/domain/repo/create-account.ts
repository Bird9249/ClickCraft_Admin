import type { DbClient } from "@/server/platform/db/client";
import { account } from "@/server/platform/db/schema/auth";
import { nowDate, parseISO } from "@/shared/lib/date-time";
import type { DbTransaction } from "@/shared/types";
import { randomUUIDv7 } from "bun";

export async function createCredentialAccount(
  params: { userId: string; passwordHash: string; now?: string | Date },
  client: DbTransaction | DbClient,
): Promise<void> {
  const now =
    params.now == null
      ? nowDate()
      : params.now instanceof Date
        ? params.now
        : parseISO(params.now);
  await client.insert(account).values({
    id: randomUUIDv7(),
    accountId: params.userId,
    providerId: "credential",
    userId: params.userId,
    password: params.passwordHash,
    createdAt: now,
    updatedAt: now,
  });
}
