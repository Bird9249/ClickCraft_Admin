import type { HonoContext } from "@/shared/types";
import type { Hono } from "hono";
import { registerRbacRoutes } from "../domain/http/rbac.routes";
import { requireAuth } from "../domain/http/middleware";

export function registerRolesAPIRoutes(app: Hono<HonoContext>) {
  // protect API namespaces by default; concrete permissions handled in routes
  app.use("/rbac/*", requireAuth());

  app.route("/rbac", registerRbacRoutes());

  return app;
}
