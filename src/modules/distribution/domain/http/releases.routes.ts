import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import {
  CreateReleaseSchema,
  IdParamSchema,
  UpdateReleaseSchema,
} from "../contracts";
import { getReleaseById } from "../repo/releases/get-by-id";
import { listReleases } from "../repo/releases/list";
import {
  archiveReleaseService,
  createReleaseService,
  publishReleaseService,
  ReleaseConflictError,
  ReleaseValidationError,
  updateReleaseService,
} from "../service/releases";

function mapError(
  e: unknown,
  status: (code: number, body: unknown) => unknown,
) {
  if (e instanceof ReleaseConflictError) {
    return status(409, { error: "CONFLICT", message: e.message });
  }
  if (e instanceof ReleaseValidationError) {
    return status(400, { error: "VALIDATION", message: e.message });
  }
  const message = e instanceof Error ? e.message : String(e);
  return status(400, { error: message });
}

export const releasesRoutes = new Elysia({ prefix: "/releases" })
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => {
      return await listReleases(query, db);
    },
    {
      beforeHandle: requirePermission("distribution:read"),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const release = await getReleaseById(params.id, db);
      if (!release) return status(404, { error: "NOT_FOUND" });
      return release;
    },
    {
      beforeHandle: requirePermission("distribution:read"),
      params: IdParamSchema,
    },
  )
  .post(
    "/",
    async ({ db, body, status, actorId }) => {
      try {
        const created = await createReleaseService(db, body, actorId);
        return created;
      } catch (e) {
        return mapError(e, status);
      }
    },
    {
      beforeHandle: requirePermission("distribution:write"),
      body: CreateReleaseSchema,
    },
  )
  .patch(
    "/:id",
    async ({ db, params, body, status }) => {
      try {
        const updated = await updateReleaseService(db, params.id, body);
        if (!updated) return status(404, { error: "NOT_FOUND" });
        return updated;
      } catch (e) {
        return mapError(e, status);
      }
    },
    {
      beforeHandle: requirePermission("distribution:write"),
      params: IdParamSchema,
      body: UpdateReleaseSchema,
    },
  )
  .post(
    "/:id/publish",
    async ({ db, params, status }) => {
      try {
        const updated = await publishReleaseService(db, params.id);
        if (!updated) return status(404, { error: "NOT_FOUND" });
        return updated;
      } catch (e) {
        return mapError(e, status);
      }
    },
    {
      beforeHandle: requirePermission("distribution:write"),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/archive",
    async ({ db, params, status }) => {
      try {
        const updated = await archiveReleaseService(db, params.id);
        if (!updated) return status(404, { error: "NOT_FOUND" });
        return updated;
      } catch (e) {
        return mapError(e, status);
      }
    },
    {
      beforeHandle: requirePermission("distribution:write"),
      params: IdParamSchema,
    },
  );
