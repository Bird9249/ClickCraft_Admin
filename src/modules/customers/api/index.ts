import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { customersRoutes as customersDetailRoutes } from "../domain/http/customers.routes";

export const customersRoutes = new Elysia()
  .use(serverContext)
  .use(
    new Elysia({ prefix: "/customers" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(customersDetailRoutes),
  );
