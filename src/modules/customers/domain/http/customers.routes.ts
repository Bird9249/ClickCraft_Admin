import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import type { FilterConditionDTO } from "@/shared/contracts/base";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import {
  CreateCustomerSchema,
  CustomerLookupQuerySchema,
  IdParamSchema,
  UpdateCustomerSchema,
} from "../contracts";
import { getCustomerById } from "../repo/get-by-id";
import { listCustomers } from "../repo/list";
import { createCustomerService } from "../service/create";
import { deleteCustomerService } from "../service/delete";
import { updateCustomerService } from "../service/update";

export const customersRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => {
      return await listCustomers(query, db);
    },
    {
      beforeHandle: requirePermission("customers:read"),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/lookup",
    async ({ db, query }) => {
      const { q, limit, skip } = query;
      const filters: FilterConditionDTO[] | undefined = q
        ? [
            {
              field: "*",
              op: "or",
              value: [
                { field: "name", op: "contains", value: q },
                { field: "nameLocal", op: "contains", value: q },
                { field: "email", op: "contains", value: q },
                { field: "phone", op: "contains", value: q },
              ],
            } as FilterConditionDTO,
          ]
        : undefined;
      const result = await listCustomers(
        { limit, offset: skip, filters },
        db,
      );
      const items = result.data.map((c) => ({
        id: c.id,
        name: c.name,
      }));
      return { items, total: result.meta.total };
    },
    {
      beforeHandle: requirePermission("customers:read"),
      query: CustomerLookupQuerySchema,
    },
  )
  .get(
    "/lookup/:id",
    async ({ db, params }) => {
      const customer = await getCustomerById(params.id, db);
      if (!customer) return { item: null };
      return { item: { id: customer.id, name: customer.name } };
    },
    {
      beforeHandle: requirePermission("customers:read"),
      params: IdParamSchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const c = await getCustomerById(params.id, db);
      if (!c) return status(404, { error: "NOT_FOUND" });
      return c;
    },
    {
      beforeHandle: requirePermission("customers:read"),
      params: IdParamSchema,
    },
  )
  .post(
    "/",
    async ({ db, body, status, actorId }) => {
      try {
        const { created } = await createCustomerService(db, {
          input: body,
          actorId,
        });
        return status(201, created);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("customers:create"),
      body: CreateCustomerSchema,
    },
  )
  .put(
    "/:id",
    async ({ db, params, body, status }) => {
      try {
        const { updated } = await updateCustomerService(db, {
          id: params.id,
          input: body,
        });
        return updated;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Customer not found")
          return status(404, { error: "NOT_FOUND" });
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("customers:update"),
      params: IdParamSchema,
      body: UpdateCustomerSchema,
    },
  )
  .delete(
    "/:id",
    async ({ db, params, status }) => {
      try {
        const { deleted } = await deleteCustomerService(db, {
          id: params.id,
        });
        if (!deleted) return status(404, { error: "NOT_FOUND" });
        return deleted;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return status(500, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("customers:delete"),
      params: IdParamSchema,
    },
  );
