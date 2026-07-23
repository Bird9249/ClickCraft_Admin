import { Elysia } from "elysia";
import { serverContext } from "@/server/platform/http/context";
import { TokenParamSchema } from "../contracts";
import { checkPublicRateLimit } from "../service/rate-limit";
import {
  createPublicDownloadRedirectService,
  getPublicShareMetaService,
  ShareLinkAccessError,
  ShareLinkValidationError,
} from "../service/share-links";

function denialStatus(code: string): number {
  if (code === "NOT_FOUND" || code === "UNAVAILABLE") return 404;
  if (code === "REVOKED" || code === "EXPIRED" || code === "QUOTA") return 410;
  return 400;
}

export const publicDistributionRoutes = new Elysia({
  prefix: "/distribution/public",
})
  .use(serverContext)
  .get(
    "/:token",
    async ({ db, params, status, request, ip }) => {
      const ipKey = `dist-meta:${ip ?? request.headers.get("x-forwarded-for") ?? "unknown"}`;
      const limit = checkPublicRateLimit(ipKey);
      if (!limit.ok) {
        return status(429, {
          error: "RATE_LIMIT",
          retryAfterSec: limit.retryAfterSec,
        });
      }

      try {
        return await getPublicShareMetaService(db, params.token);
      } catch (e) {
        if (e instanceof ShareLinkAccessError) {
          return status(denialStatus(e.code), { error: e.code });
        }
        const message = e instanceof Error ? e.message : String(e);
        return status(400, { error: message });
      }
    },
    {
      params: TokenParamSchema,
    },
  )
  .get(
    "/:token/download",
    async ({ db, params, status, request, ip }) => {
      const ipKey = `dist-dl:${ip ?? request.headers.get("x-forwarded-for") ?? "unknown"}`;
      const limit = checkPublicRateLimit(ipKey);
      if (!limit.ok) {
        return status(429, {
          error: "RATE_LIMIT",
          retryAfterSec: limit.retryAfterSec,
        });
      }

      try {
        const { downloadUrl } = await createPublicDownloadRedirectService(
          db,
          params.token,
        );
        return new Response(null, {
          status: 302,
          headers: {
            Location: downloadUrl,
            "Cache-Control": "no-store",
          },
        });
      } catch (e) {
        if (e instanceof ShareLinkAccessError) {
          return status(denialStatus(e.code), { error: e.code });
        }
        if (e instanceof ShareLinkValidationError) {
          return status(503, {
            error: "STORAGE_UNAVAILABLE",
            message: e.message,
          });
        }
        const message = e instanceof Error ? e.message : String(e);
        return status(400, { error: message });
      }
    },
    {
      params: TokenParamSchema,
    },
  );
