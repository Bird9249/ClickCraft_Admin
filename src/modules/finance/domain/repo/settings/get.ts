import { schema } from "@/server/platform/db/client";
import type { DbClient } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";

export const FINANCE_SETTINGS_ID = "default";

export type FinanceSettingsRow = typeof schema.financeSettings.$inferSelect;

export async function getFinanceSettings(
  client: DbTransaction | DbClient,
): Promise<FinanceSettingsRow> {
  const [row] = await client
    .select()
    .from(schema.financeSettings)
    .where(eq(schema.financeSettings.id, FINANCE_SETTINGS_ID))
    .limit(1);

  if (row) return row;

  const [created] = await client
    .insert(schema.financeSettings)
    .values({ id: FINANCE_SETTINGS_ID, updatedAt: new Date() })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [again] = await client
    .select()
    .from(schema.financeSettings)
    .where(eq(schema.financeSettings.id, FINANCE_SETTINGS_ID))
    .limit(1);

  if (!again) throw new Error("Failed to load finance settings");
  return again;
}
