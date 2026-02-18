import type { RoleUpdateInput } from "../contracts";
import { getRoleById } from "../repo/get-role-by-id";
import { updateRole as updateRoleDb } from "../repo/update-role";
import type { DbTransaction } from "@/shared/types";

export async function updateRoleService(
  client: DbTransaction,
  params: { id: string; input: RoleUpdateInput },
) {
  const { id, input } = params;
  const before = await getRoleById(id, client);
  if (!before) throw new Error("Role not found");
  const updated = await updateRoleDb(id, input, client);
  if (!updated) throw new Error("Failed to update role");
  return { updated, before };
}
