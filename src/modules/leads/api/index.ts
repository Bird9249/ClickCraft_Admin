import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { leadsDetailRoutes } from "../domain/http/leads.routes";
import { publicLeadsRoutes } from "../domain/http/public-leads.routes";

export const leadsRoutes = new Elysia()
  .use(serverContext)
  .use(publicLeadsRoutes)
  .use(
    new Elysia({ prefix: "/leads" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(leadsDetailRoutes),
  );
