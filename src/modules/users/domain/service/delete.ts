import { deleteUserImage } from "@/server/utils/delete-user-image";
import { removeUser } from "../repo/remove";
import type { DbTransaction } from "@/shared/types";

export async function deleteUserService(
  client: DbTransaction,
  params: { id: string },
) {
  const { id } = params;
  const user = await removeUser(id, client);

  if (user?.image) {
    await deleteUserImage(user.image);
  }

  return { deleted: user };
}
