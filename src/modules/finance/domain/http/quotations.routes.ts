import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import {
  CreateQuotationSchema,
  IdParamSchema,
  UpdateQuotationSchema,
} from "../contracts";
import { getQuotationById } from "../repo/quotations/get-by-id";
import { listQuotations } from "../repo/quotations/list";
import {
  acceptQuotationService,
  createQuotationService,
  duplicateQuotationService,
  rejectQuotationService,
  sendQuotationService,
  updateQuotationService,
  voidQuotationService,
} from "../service/quotations";
import { renderQuotationHtml } from "../service/pdf";

export const quotationsRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => listQuotations(query, db),
    {
      beforeHandle: requirePermission("finance:read"),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const qt = await getQuotationById(params.id, db);
      if (!qt) return status(404, { error: "NOT_FOUND" });
      return qt;
    },
    {
      beforeHandle: requirePermission("finance:read"),
      params: IdParamSchema,
    },
  )
  .get(
    "/:id/pdf",
    async ({ db, params, status, set }) => {
      const qt = await getQuotationById(params.id, db);
      if (!qt) return status(404, { error: "NOT_FOUND" });
      const html = renderQuotationHtml({
        number: qt.number,
        issueDate: qt.issueDate,
        validUntil: qt.validUntil,
        customerName: qt.customerName ?? "",
        customerAddress: qt.customerAddress,
        customerTaxId: qt.customerTaxId,
        customerPhone: qt.customerPhone,
        customerEmail: qt.customerEmail,
        currency: qt.currency,
        lines: qt.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
        })),
        subtotal: qt.subtotal,
        taxAmount: qt.taxAmount,
        total: qt.total,
        taxNote: qt.taxNote,
        notes: qt.notes,
        paymentSchedule: qt.paymentSchedule,
        showSignature: qt.showSignature ?? true,
      });
      set.headers["Content-Type"] = "text/html; charset=utf-8";
      return html;
    },
    {
      beforeHandle: requirePermission("finance:read"),
      params: IdParamSchema,
    },
  )
  .post(
    "/",
    async ({ db, body, status, actorId }) => {
      try {
        const { created } = await createQuotationService(db, {
          input: body,
          actorId,
        });
        return status(201, created);
      } catch (e) {
        return status(500, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      body: CreateQuotationSchema,
    },
  )
  .put(
    "/:id",
    async ({ db, params, body, status }) => {
      try {
        const { updated } = await updateQuotationService(db, {
          id: params.id,
          input: body,
        });
        return updated;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return status(msg.includes("not found") ? 404 : 400, { error: msg });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      params: IdParamSchema,
      body: UpdateQuotationSchema,
    },
  )
  .post(
    "/:id/send",
    async ({ db, params, status }) => {
      try {
        return await sendQuotationService(db, { id: params.id });
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:issue"),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/accept",
    async ({ db, params, status }) => {
      try {
        return await acceptQuotationService(db, { id: params.id });
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:issue"),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/reject",
    async ({ db, params, status }) => {
      try {
        return await rejectQuotationService(db, { id: params.id });
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:issue"),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/void",
    async ({ db, params, status }) => {
      try {
        return await voidQuotationService(db, { id: params.id });
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:void"),
      params: IdParamSchema,
    },
  )
  .post(
    "/:id/duplicate",
    async ({ db, params, status, actorId }) => {
      try {
        const { created } = await duplicateQuotationService(db, {
          id: params.id,
          actorId,
        });
        return status(201, created);
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      params: IdParamSchema,
    },
  );
