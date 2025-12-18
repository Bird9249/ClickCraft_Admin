import { requireAuth } from "@/modules/roles/domain/http/middleware";
import type { HonoContext } from "@/shared/types";
import type { Hono } from "hono";
import { registerMeRoutes } from "../domain/http/me.routes";
import { registerUsersRoutes } from "../domain/http/users.routes";

export function registerUsersAPIRoutes(app: Hono<HonoContext>) {
  // protect API namespaces by default; concrete permissions handled in routes
  app.use("/users/*", requireAuth());
  app.use("/me/*", requireAuth());

  app.route("/users", registerUsersRoutes());
  app.route("/me", registerMeRoutes());

  return app;
}
