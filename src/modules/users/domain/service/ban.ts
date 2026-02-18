import { banUser as banUserDb } from "../repo/user-ban";
import type { DbTransaction } from "@/shared/types";

export async function banUserService(
  client: DbTransaction,
  params: {
    id: string;
    reason?: string;
    /** ISO 8601 datetime string – รับจาก API เป็น string ตลอดสาย */
    expires?: string | null;
  },
) {
  const { id, reason, expires } = params;
  await banUserDb(id, reason ?? "", expires ?? null, client);
  return { ok: true } as const;
}
