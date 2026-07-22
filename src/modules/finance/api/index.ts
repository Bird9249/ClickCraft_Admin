import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { invoicesRoutes } from "../domain/http/invoices.routes";
import { quotationsRoutes } from "../domain/http/quotations.routes";
import { receiptsRoutes } from "../domain/http/receipts.routes";
import { financeSettingsRoutes } from "../domain/http/settings.routes";

export const financeRoutes = new Elysia()
  .use(serverContext)
  .use(
    new Elysia({ prefix: "/quotations" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(quotationsRoutes),
  )
  .use(
    new Elysia({ prefix: "/invoices" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(invoicesRoutes),
  )
  .use(
    new Elysia({ prefix: "/receipts" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(receiptsRoutes),
  )
  .use(
    new Elysia({ prefix: "/finance-settings" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(financeSettingsRoutes),
  );
