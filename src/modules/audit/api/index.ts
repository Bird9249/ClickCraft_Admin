import { requireAuth } from "@/modules/roles/domain/http/middleware";
import type { HonoContext } from "@/shared/types";
import type { Hono } from "hono";
import { registerAuditRoutes } from "../domain/http/audit.routes";

export function registerAuditAPIRoutes(app: Hono<HonoContext>) {
  // protect API namespaces by default; concrete permissions handled in routes
  app.use("/audit/*", requireAuth());

  app.route("/audit", registerAuditRoutes());

  return app;
}
