import type { DbTransaction } from "@/shared/types";
import { randomUUIDv7 } from "bun";
import type { RoleCreateInput } from "../contracts";
import { createRole as createRoleDb } from "../repo/create-role";

export async function createRoleService(
  client: DbTransaction,
  params: { input: RoleCreateInput },
) {
  const created = await createRoleDb(
    { ...params.input, id: randomUUIDv7() },
    client,
  );
  if (!created) throw new Error("Failed to create role");
  return { created };
}
