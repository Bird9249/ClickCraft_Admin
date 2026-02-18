import { createCredentialAccount } from "@/modules/auth/domain/repo/create-account";
import { bcryptLikeHasher } from "@/modules/auth/domain/services/password.bcrypt";
import { USER_ROLES } from "@/modules/roles/domain/contracts/user-roles";
import { assignRoleToUser } from "@/modules/roles/domain/repo/assign-role-to-user";
import { nowDate } from "@/shared/lib/date-time";
import type { CreateUserDTO } from "../contracts";
import type { DbTransaction } from "@/shared/types";
import { createUser } from "../repo/create";

export async function createUserService(
  client: DbTransaction,
  params: { input: CreateUserDTO },
) {
  const { input } = params;
  const imageKey = input.image?.trim() || null;
  const now = nowDate();
  const created = await createUser(
    {
      email: input.email,
      name: input.name ?? undefined,
      image: imageKey,
      emailVerified: false,
      banned: false,
      createdAt: now,
      updatedAt: now,
      role: USER_ROLES.staff,
    },
    client,
  );

  if (!created) {
    throw new Error("Failed to create user");
  }

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
  return { created };
}
