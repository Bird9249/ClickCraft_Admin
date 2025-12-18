import { getAuditContext } from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import { bunFileStorage } from "@/shared/files/bun-storage";
import { makeService } from "@/shared/service";
import { removeUser } from "../repo/remove";

export const deleteUserService = makeService<{ id: string }, boolean>({
  name: "userDelete",
  run: async (client, { id }) => {
    const user = await removeUser(id, client);

    if (user?.image) {
      await bunFileStorage.deleteByUrl(user.image);
    }

    return user !== null;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx || !output) return;
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "USER.DELETE",
        entityType: "user",
        entityId: input.id,
        result: "success",
        ...getAuditContext(ctx),
      },
    ]);
  },
});
