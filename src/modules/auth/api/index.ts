import type { HonoContext } from "@/shared/types";
import type { Hono } from "hono";
import { auth } from "../domain/better-auth";
import { buildAuditEvent } from "@/modules/audit/domain/http/helpers";
import { appendAudit } from "@/modules/audit/domain/services/append-audit";

export function registerAuthRoutes(app: Hono<HonoContext>) {
  // better-auth handles its own subroutes
  app.on(["POST", "GET"], "/auth/*", async (c) => {
    const res = await auth.handler(c.req.raw);
    // Best-effort audit for auth actions without reading sensitive payloads
    try {
      const path = c.req.path;
      const status = res.status;
      const isSuccess = status >= 200 && status < 400;
      let action: string | null = null;
      if (path.includes("sign-in"))
        action = isSuccess ? "AUTH.LOGIN" : "AUTH.LOGIN_FAILED";
      else if (path.includes("sign-out") || path.includes("logout"))
        action = "AUTH.LOGOUT";
      else if (path.includes("sign-up") || path.includes("register"))
        action = isSuccess ? "AUTH.REGISTER" : "AUTH.REGISTER_FAILED";
      else if (path.includes("password") && path.includes("reset"))
        action = isSuccess
          ? "AUTH.PASSWORD.RESET"
          : "AUTH.PASSWORD.RESET_FAILED";
      else if (path.includes("password") && path.includes("forgot"))
        action = isSuccess
          ? "AUTH.PASSWORD.FORGOT"
          : "AUTH.PASSWORD.FORGOT_FAILED";
      if (action) {
        await appendAudit(c.get("db"), [
          buildAuditEvent(c, {
            action,
            result: isSuccess ? "success" : "failed",
          }),
        ]);
      }
    } catch {}
    return res;
  });

  return app;
}
