import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { zValidator } from "@/server/platform/http/middleware/validator-wrapper";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import { Permissions } from "@/modules/roles/domain/contracts/permissions";
import { IdParamSchema } from "@/modules/users/domain/contracts";
import type { HonoContext } from "@/shared/types";
import { Hono } from "hono";
import { getAuditById } from "../repo/get-by-id";
import { queryAudit } from "../repo/query";

export function registerAuditRoutes() {
  const r = new Hono<HonoContext>();

  r.get(
    "/",
    requirePermission(Permissions.audit.read),
    zValidator("query", OffsetPageQuerySchema),
    async (c) => {
      const q = c.req.valid("query");
      const result = await queryAudit(q, c.get("db"));
      return c.json(result);
    },
  );

  r.get(
    "/:id",
    requirePermission(Permissions.audit.read),
    zValidator("param", IdParamSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const item = await getAuditById(id, c.get("db"));
      if (!item) return c.json({ error: "NOT_FOUND" }, 404);
      return c.json({ item });
    },
  );

  return r;
}
