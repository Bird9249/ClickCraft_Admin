import { getAuditContext } from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import { makeService } from "@/shared/service";
import { unbanUser as unbanUserDb } from "../repo/user-unban";

export const unbanUserService = makeService<{ id: string }, { ok: true }>({
  name: "userUnban",
  run: async (client, { id }) => {
    await unbanUserDb(id, client);
    return { ok: true } as const;
  },
  onSuccess: async ({ client, input, ctx }) => {
    if (!ctx) return;
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "USER.UNBAN",
        entityType: "user",
        entityId: input.id,
        result: "success",
        ...getAuditContext(ctx),
      },
    ]);
  },
});
