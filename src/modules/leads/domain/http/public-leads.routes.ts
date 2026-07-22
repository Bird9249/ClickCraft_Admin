import { Elysia } from "elysia";
import { serverContext } from "@/server/platform/http/context";
import { CreatePublicLeadSchema } from "../contracts";
import {
  createLeadFromWebsiteService,
  LeadHoneypotError,
  LeadRateLimitError,
} from "../service/create-from-website";

export const publicLeadsRoutes = new Elysia({ prefix: "/public" })
  .use(serverContext)
  .post(
    "/quotation-leads",
    async ({ db, body, request, set, ip, userAgent }) => {
      try {
        const result = await createLeadFromWebsiteService(db, {
          input: body,
          ip: ip ?? request.headers.get("x-forwarded-for"),
          userAgent: userAgent ?? request.headers.get("user-agent"),
        });
        set.status = 201;
        return result;
      } catch (e) {
        if (e instanceof LeadHoneypotError) {
          // Silent success for bots
          set.status = 204;
          return;
        }
        if (e instanceof LeadRateLimitError) {
          set.status = 429;
          set.headers["Retry-After"] = String(e.retryAfterSec);
          return { error: "RATE_LIMIT", retryAfterSec: e.retryAfterSec };
        }
        const message = e instanceof Error ? e.message : String(e);
        set.status = 500;
        return { error: message };
      }
    },
    {
      body: CreatePublicLeadSchema,
    },
  );
