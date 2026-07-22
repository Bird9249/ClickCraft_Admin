import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import { IdParamSchema, UpdateLeadSchema } from "../contracts";
import { getLeadById } from "../repo/get-by-id";
import { listLeads } from "../repo/list";
import {
  convertLeadService,
  LeadAlreadyConvertedError,
} from "../service/convert";
import {
  markLeadContactedService,
  markLeadLostService,
  updateLeadService,
} from "../service/status";

export const leadsDetailRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => {
      return await listLeads(query, db);
    },
    {
      beforeHandle: requirePermission("leads:read"),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const lead = await getLeadById(params.id, db);
      if (!lead) return status(404, { error: "NOT_FOUND" });
      return lead;
    },
    {
      beforeHandle: requirePermission("leads:read"),
      params: IdParamSchema,
    },
  )
  .patch(
    "/:id",
    async ({ db, params, body, status, actorId }) => {
      try {
        const { updated } = await updateLeadService(db, {
          id: params.id,
          input: body,
          actorId,
        });
        if (!updated) return status(404, { error: "NOT_FOUND" });
        return updated;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Lead not found")
          return status(404, { error: "NOT_FOUND" });
        return status(400, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("leads:update"),
      params: IdParamSchema,
      body: UpdateLeadSchema,
    },
  )
  .post(
    "/:id/contacted",
    async ({ db, params, status, actorId }) => {
      try {
        const { updated } = await markLeadContactedService(db, {
          id: params.id,
          actorId,
        });
        if (!updated) return status(404, { error: "NOT_FOUND" });
        return updated;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Lead not found")
          return status(404, { error: "NOT_FOUND" });
        return status(400, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("leads:update"),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/lost",
    async ({ db, params, status, actorId }) => {
      try {
        const { updated } = await markLeadLostService(db, {
          id: params.id,
          actorId,
        });
        if (!updated) return status(404, { error: "NOT_FOUND" });
        return updated;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Lead not found")
          return status(404, { error: "NOT_FOUND" });
        return status(400, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("leads:update"),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/convert",
    async ({ db, params, status, actorId }) => {
      try {
        const result = await convertLeadService(db, {
          id: params.id,
          actorId,
        });
        return result;
      } catch (e) {
        if (e instanceof LeadAlreadyConvertedError) {
          return status(409, { error: "ALREADY_CONVERTED" });
        }
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Lead not found")
          return status(404, { error: "NOT_FOUND" });
        return status(400, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("leads:convert"),
      params: IdParamSchema,
    },
  );
