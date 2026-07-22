import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { UpdateFinanceSettingsSchema } from "../contracts";
import { getFinanceSettings } from "../repo/settings/get";
import { upsertFinanceSettings } from "../repo/settings/upsert";

export const financeSettingsRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db }) => getFinanceSettings(db),
    {
      beforeHandle: requirePermission("finance:read"),
    },
  )
  .put(
    "/",
    async ({ db, body, status }) => {
      try {
        const updated = await upsertFinanceSettings(body, db);
        return updated;
      } catch (e) {
        return status(400, {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      body: UpdateFinanceSettingsSchema,
    },
  );
