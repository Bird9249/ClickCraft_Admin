import { getAuditContext } from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";
import { createCredentialAccount } from "@/modules/auth/domain/repo/create-account";
import { bcryptLikeHasher } from "@/modules/auth/domain/services/password.bcrypt";
import { assignRoleToUser } from "@/modules/roles/domain/repo/assign-role-to-user";
import { USER_ROLES } from "@/modules/roles/domain/contracts/user-roles";
import { bunFileStorage } from "@/shared/files/bun-storage";
import { makeService } from "@/shared/service";
import { createUser } from "../repo/create";
import type { CreateUserDTO } from "../contracts";

export const createUserService = makeService<
  { input: CreateUserDTO; imageFile?: File | null },
  { id: string }
>({
  name: "userCreate",
  run: async (client, { input, imageFile }) => {
    let imageUrl = input.image ?? null;
    if (imageFile && imageFile.size > 0) {
      const saved = await bunFileStorage.save(imageFile, "uploads");
      imageUrl = saved.url;
    }
    const now = new Date().toISOString();
    const created = await createUser(
      {
        email: input.email,
        name: input.name ?? undefined,
        image: imageUrl ?? null,
        emailVerified: false,
        banned: false,
        createdAt: now,
        updatedAt: now,
        role: USER_ROLES.staff,
      },
      client,
    );
    if (input.password) {
      const passwordHash = await bcryptLikeHasher.hash(input.password);
      await createCredentialAccount(
        { userId: created.id, passwordHash, now },
        client,
      );
    }
    if (input.roleId) {
      await assignRoleToUser(created.id, input.roleId, client);
    }
    return created;
  },
  onSuccess: async ({ client, input, output, ctx }) => {
    if (!ctx) return;
    await appendAudit(client, [
      {
        occurredAt: new Date().toISOString(),
        action: "USER.CREATE",
        entityType: "user",
        entityId: output.id,
        result: "success",
        after: { ...output, ...input.input },
        ...getAuditContext(ctx),
      },
    ]);
  },
});
