import { unbanUser as unbanUserDb } from "../repo/user-unban";
import type { DbTransaction } from "@/shared/types";

export async function unbanUserService(
  client: DbTransaction,
  params: { id: string },
) {
  await unbanUserDb(params.id, client);
  return { ok: true } as const;
}
