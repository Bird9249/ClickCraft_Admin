import { Elysia } from "elysia";
import { requireAuth } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { appsRoutes } from "../domain/http/apps.routes";
import { publicDistributionRoutes } from "../domain/http/public.routes";
import { releasesRoutes } from "../domain/http/releases.routes";
import { shareLinksRoutes } from "../domain/http/share-links.routes";

export const distributionRoutes = new Elysia()
  .use(serverContext)
  .use(publicDistributionRoutes)
  .use(
    new Elysia({ prefix: "/distribution" })
      .use(serverContext)
      .onBeforeHandle(requireAuth)
      .use(appsRoutes)
      .use(releasesRoutes)
      .use(shareLinksRoutes),
  );
