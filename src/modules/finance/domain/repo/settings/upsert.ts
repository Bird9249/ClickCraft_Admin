import { schema } from "@/server/platform/db/client";
import type { DbClient } from "@/server/platform/db/client";
import type { DbTransaction } from "@/shared/types";
import { eq } from "drizzle-orm";
import type { UpdateFinanceSettingsDTO } from "../../contracts";
import { FINANCE_SETTINGS_ID, getFinanceSettings } from "./get";

export async function upsertFinanceSettings(
  input: UpdateFinanceSettingsDTO,
  client: DbTransaction | DbClient,
) {
  await getFinanceSettings(client);

  const [updated] = await client
    .update(schema.financeSettings)
    .set({
      bankName: input.bankName ?? null,
      accountName: input.accountName ?? null,
      accountNumber: input.accountNumber ?? null,
      qrImageKey: input.qrImageKey ?? null,
      updatedAt: new Date(),
    })
    .where(eq(schema.financeSettings.id, FINANCE_SETTINGS_ID))
    .returning();

  if (!updated) throw new Error("Failed to update finance settings");
  return updated;
}
