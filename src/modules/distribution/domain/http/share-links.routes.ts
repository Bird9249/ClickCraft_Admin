import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { CreateShareLinkSchema, IdParamSchema } from "../contracts";
import {
  createShareLinkService,
  listShareLinksService,
  revokeShareLinkService,
  ShareLinkValidationError,
} from "../service/share-links";

export const shareLinksRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/releases/:id/share-links",
    async ({ db, params, status }) => {
      const data = await listShareLinksService(db, params.id);
      if (!data) return status(404, { error: "NOT_FOUND" });
      return { data };
    },
    {
      beforeHandle: requirePermission("distribution:read"),
      params: IdParamSchema,
    },
  )
  .post(
    "/releases/:id/share-links",
    async ({ db, params, body, status, actorId }) => {
      try {
        const created = await createShareLinkService(
          db,
          params.id,
          body,
          actorId,
        );
        return created;
      } catch (e) {
        if (e instanceof ShareLinkValidationError) {
          return status(400, { error: "VALIDATION", message: e.message });
        }
        const message = e instanceof Error ? e.message : String(e);
        return status(400, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("distribution:write"),
      params: IdParamSchema,
      body: CreateShareLinkSchema,
    },
  )
  .post(
    "/share-links/:id/revoke",
    async ({ db, params, status }) => {
      const updated = await revokeShareLinkService(db, params.id);
      if (!updated) return status(404, { error: "NOT_FOUND" });
      return updated;
    },
    {
      beforeHandle: requirePermission("distribution:write"),
      params: IdParamSchema,
    },
  );
