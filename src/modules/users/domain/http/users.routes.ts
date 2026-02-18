import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import type { HonoContext } from "@/shared/types";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  BanUserSchema,
  CreateUserFormSchema,
  IdParamSchema,
  UpdateUserFormSchema,
} from "../contracts";
import { getUserById } from "../repo/get-by-id";
import { listUsers } from "../repo/list";
import { banUserService } from "../service/ban";
import { createUserService } from "../service/create";
import { deleteUserService } from "../service/delete";
import { unbanUserService } from "../service/unban";
import { updateUserService } from "../service/update";

export function registerUsersRoutes() {
  const r = new Hono<HonoContext>();

  r.get(
    "/",
    requirePermission("users:read"),
    zValidator("query", OffsetPageQuerySchema),
    async (c) => {
      const client = c.get("db");
      const q = c.req.valid("query");
      const result = await listUsers(q, client);
      return c.json(result);
    },
  );

  r.get(
    "/:id",
    requirePermission("users:read"),
    zValidator("param", IdParamSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param");
      const user = await getUserById(id, client);
      if (!user) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json(user);
    },
  );

  r.post(
    "/",
    requirePermission("users:create"),
    zValidator("form", CreateUserFormSchema),
    async (c) => {
      const client = c.get("db");
      const input = c.req.valid("form");
      try {
        const out = await createUserService(client, {
          input: {
            email: input.email,
            name: input.name,
            password: input.password,
            roleId: input.roleId,
            image: input.image ?? undefined,
          },
        });
        return c.json(out.created, 201);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return c.json({ error: message }, 500);
      }
    },
  );

  r.put(
    "/:id",
    requirePermission("users:update"),
    zValidator("param", IdParamSchema),
    zValidator("form", UpdateUserFormSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param");
      const input = c.req.valid("form");
      try {
        const { updated } = await updateUserService(client, {
          id,
          input: {
            email: input.email,
            name: input.name,
            roleId: input.roleId,
            password: input.password,
            image: input.imageDelete ? null : (input.image ?? undefined),
          },
        });
        return c.json(updated);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "User not found")
          return c.json({ error: "NOT_FOUND" }, 404);
        return c.json({ error: message }, 500);
      }
    },
  );

  r.delete(
    "/:id",
    requirePermission("users:delete"),
    zValidator("param", IdParamSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param");
      try {
        const { deleted } = await deleteUserService(client, { id });
        if (!deleted) return c.json({ error: "NOT_FOUND" }, 404);
        return c.json(deleted);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return c.json({ error: message }, 500);
      }
    },
  );

  r.post(
    "/:id/ban",
    requirePermission("users:ban"),
    zValidator("param", IdParamSchema),
    zValidator("json", BanUserSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param");
      const body = c.req.valid("json");
      try {
        const result = await banUserService(client, {
          id,
          reason: body.reason ?? undefined,
          expires: body.expires ?? null,
        });
        return c.json(result);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return c.json({ error: message }, 500);
      }
    },
  );

  r.post(
    "/:id/unban",
    requirePermission("users:ban"),
    zValidator("param", IdParamSchema),
    async (c) => {
      const client = c.get("db");
      const { id } = c.req.valid("param");
      try {
        const result = await unbanUserService(client, { id });
        return c.json(result);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return c.json({ error: message }, 500);
      }
    },
  );

  return r;
}
