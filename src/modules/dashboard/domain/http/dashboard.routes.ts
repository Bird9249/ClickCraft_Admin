import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { getDashboardSummary } from "../repo/get-summary";

export const dashboardDetailRoutes = new Elysia().use(serverContext).get(
  "/summary",
  async ({ db }) => {
    return await getDashboardSummary(db);
  },
  {
    beforeHandle: requirePermission("finance:read"),
  },
);
