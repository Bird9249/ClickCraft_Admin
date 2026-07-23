import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { CreateAppSchema } from "../contracts";
import {
  AppConflictError,
  createAppService,
  listAppsService,
} from "../service/apps";

export const appsRoutes = new Elysia({ prefix: "/apps" })
  .use(serverContext)
  .get(
    "/",
    async ({ db }) => {
      const data = await listAppsService(db);
      return { data };
    },
    {
      beforeHandle: requirePermission("distribution:read"),
    },
  )
  .post(
    "/",
    async ({ db, body, status }) => {
      try {
        const created = await createAppService(db, body);
        return created;
      } catch (e) {
        if (e instanceof AppConflictError) {
          return status(409, { error: "CONFLICT", message: e.message });
        }
        const message = e instanceof Error ? e.message : String(e);
        return status(400, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("distribution:write"),
      body: CreateAppSchema,
    },
  );
