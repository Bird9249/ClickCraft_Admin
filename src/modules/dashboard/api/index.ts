import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { dashboardDetailRoutes } from "../domain/http/dashboard.routes";

export const dashboardRoutes = new Elysia()
  .use(serverContext)
  .use(
    new Elysia({ prefix: "/dashboard" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(dashboardDetailRoutes),
  );
