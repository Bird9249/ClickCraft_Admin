import { deleteRole as deleteRoleDb } from "../repo/delete-role";
import { getRoleById } from "../repo/get-role-by-id";
import type { DbTransaction } from "@/shared/types";

export async function deleteRoleService(
  client: DbTransaction,
  params: { id: string },
) {
  const before = await getRoleById(params.id, client);
  if (!before) throw new Error("Role not found");
  await deleteRoleDb(params.id, client);
  return { deleted: before };
}
