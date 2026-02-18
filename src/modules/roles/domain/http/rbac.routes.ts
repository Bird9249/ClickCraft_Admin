import type { FilterConditionDTO } from "@/shared/contracts/base";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import type { HonoContext } from "@/shared/types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  RoleCreateSchema,
  RoleIdParamSchema,
  RoleLookupQuerySchema,
  RoleUpdateSchema,
} from "../contracts";
import { Permissions } from "../contracts/permissions";
import { getRoleById } from "../repo/get-role-by-id";
import { listRoles } from "../repo/list-roles";
import { createRoleService } from "../service/create";
import { deleteRoleService } from "../service/delete";
import { updateRoleService } from "../service/update";
import { getEffectivePermissionsService } from "../service/user-permissions";
import { requirePermission } from "./middleware";

export function registerRbacRoutes() {
  const app = new Hono<HonoContext>();

  app.get("/my-permissions", async (c) => {
    const client = c.get("db");
    const user = c.get("session");
    const userId: string | undefined = user?.id;
    if (!userId) return c.json({ error: "Unauthorized" }, 401);
    const perms = await getEffectivePermissionsService(client, userId);
    return c.json({ permissions: perms.map((p: { id: string }) => p.id) });
  });

  app.get(
    "/roles",
    requirePermission(Permissions.users.read),
    zValidator("query", OffsetPageQuerySchema),
    async (c) => {
      const client = c.get("db");
      const q = c.req.valid("query");
      const result = await listRoles(q, client);
      return c.json(result);
    },
  );

  app.get(
    "/roles/lookup",
    requirePermission(Permissions.users.read),
    zValidator("query", RoleLookupQuerySchema),
    async (c) => {
      const client = c.get("db");
      const { q, limit, skip } = c.req.valid("query") as {
        q?: string;
        limit: number;
        skip: number;
      };
      const filters: FilterConditionDTO[] | undefined = q
        ? [{ field: "name", op: "contains", value: q }]
        : undefined;
      const result = await listRoles(
        {
          limit,
          offset: skip,
          filters,
        },
        client,
      );
      const items = result.data.map((r: { id: string; name: string }) => ({
        id: r.id,
        name: r.name,
      }));
      return c.json({ items, total: result.meta.total });
    },
  );

  app.get(
    "/roles/:id",
    requirePermission(Permissions.users.read),
    async (c) => {
      const client = c.get("db");
      const id = c.req.param("id");
      const item = await getRoleById(id, client);
      if (!item) return c.json({ error: "Not Found" }, 404);
      return c.json(item);
    },
  );

  app.get(
    "/roles/lookup/:id",
    requirePermission(Permissions.users.read),
    async (c) => {
      const client = c.get("db");
      const id = c.req.param("id");
      const role = await getRoleById(id, client);
      if (!role) return c.json({ item: null }, 200);
      return c.json({ item: { id: role.id, name: role.name } });
    },
  );

  app.post(
    "/roles",
    requirePermission(Permissions.users.ban),
    zValidator("json", RoleCreateSchema),
    async (c) => {
      const client = c.get("db");
      const body = c.req.valid("json");
      try {
        const out = await createRoleService(client, { input: body });
        return c.json(out.created, 201);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return c.json({ error: message }, 500);
      }
    },
  );

  app.patch(
    "/roles/:id",
    requirePermission(Permissions.users.ban),
    zValidator("param", RoleIdParamSchema),
    zValidator("json", RoleUpdateSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param") as { id: string };
      const body = c.req.valid("json");
      try {
        const { updated } = await updateRoleService(client, {
          id,
          input: body,
        });
        return c.json(updated);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Role not found" || message === "Failed to update role")
          return c.json({ error: "NOT_FOUND" }, 404);
        return c.json({ error: message }, 500);
      }
    },
  );

  app.delete(
    "/roles/:id",
    requirePermission(Permissions.users.ban),
    zValidator("param", RoleIdParamSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param") as { id: string };
      try {
        const { deleted } = await deleteRoleService(client, { id });
        if (!deleted) return c.json({ error: "NOT_FOUND" }, 404);
        return c.json(deleted);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Role not found")
          return c.json({ error: "NOT_FOUND" }, 404);
        return c.json({ error: message }, 500);
      }
    },
  );

  return app;
}
