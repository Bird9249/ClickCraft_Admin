import { syncFromCode as syncFromCodeDb } from "../repo/sync-from-code";
import type { DbTransaction } from "@/shared/types";

export async function syncFromCodeService(client: DbTransaction) {
  await syncFromCodeDb(client);
  return { ok: true } as const;
}
