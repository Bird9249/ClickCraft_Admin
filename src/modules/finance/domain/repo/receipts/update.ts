import { schema } from "@/server/platform/db/client";
import type { DbClient } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { UpdateReceiptDTO } from "../../contracts";

export async function updateReceipt(
  id: string,
  input: UpdateReceiptDTO,
  client: DbTransaction | DbClient,
) {
  const [existing] = await client
    .select({ id: schema.receipt.id, status: schema.receipt.status })
    .from(schema.receipt)
    .where(eq(schema.receipt.id, id))
    .limit(1);

  if (!existing) return null;
  if (existing.status === "void")
    throw new Error("Cannot edit a voided receipt");

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (input.showSignature !== undefined)
    updates.showSignature = input.showSignature;
  if (input.notes !== undefined) updates.notes = input.notes;

  const [updated] = await client
    .update(schema.receipt)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .set(updates as any)
    .where(eq(schema.receipt.id, id))
    .returning();

  return updated ?? null;
}
