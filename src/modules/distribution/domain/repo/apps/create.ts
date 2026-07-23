import { schema } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import type { CreateAppDTO } from "../../contracts";

export async function createApp(input: CreateAppDTO, client: DbTransaction) {
  const [row] = await client
    .insert(schema.distributionApp)
    .values({
      name: input.name,
      slug: input.slug,
    })
    .returning();
  if (!row) throw new Error("Failed to create app");
  return row;
}
