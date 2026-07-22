import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import {
  CreatePaymentSchema,
  IdParamSchema,
  UpdateReceiptSchema,
} from "../contracts";
import { getReceiptById } from "../repo/receipts/get-by-id";
import { listReceipts } from "../repo/receipts/list";
import { updateReceipt } from "../repo/receipts/update";
import { createPaymentService, voidReceiptService } from "../service/payments";
import { renderReceiptHtml } from "../service/pdf";
import { schema } from "@/server/platform/db/client";
import { eq } from "drizzle-orm";

export const receiptsRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => listReceipts(query, db),
    {
      beforeHandle: requirePermission("finance:read"),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const rc = await getReceiptById(params.id, db);
      if (!rc) return status(404, { error: "NOT_FOUND" });
      return rc;
    },
    {
      beforeHandle: requirePermission("finance:read"),
      params: IdParamSchema,
    },
  )
  .get(
    "/:id/pdf",
    async ({ db, params, status, set }) => {
      const rc = await getReceiptById(params.id, db);
      if (!rc) return status(404, { error: "NOT_FOUND" });

      const [pmt] = await db
        .select()
        .from(schema.payment)
        .where(eq(schema.payment.id, rc.paymentId));

      const [inv] = await db
        .select()
        .from(schema.invoice)
        .where(eq(schema.invoice.id, rc.invoiceId));

      const html = renderReceiptHtml({
        number: rc.number,
        issueDate: rc.issueDate,
        customerName: rc.customerName ?? "",
        customerAddress: rc.customerAddress,
        customerTaxId: rc.customerTaxId,
        customerPhone: rc.customerPhone,
        customerEmail: rc.customerEmail,
        currency: rc.currency,
        paymentMethod: pmt?.method,
        reference: pmt?.reference,
        lines: [
          {
            description: `ຊໍາລະໃບເກັບເງິນ ${rc.invoiceNumber ?? rc.invoiceId}`,
            quantity: 1,
            unitPrice: rc.amount,
            amount: rc.amount,
          },
        ],
        subtotal: rc.amount,
        taxAmount: 0,
        total: rc.amount,
        notes: rc.notes,
        showSignature: rc.showSignature ?? true,
      });
      set.headers["Content-Type"] = "text/html; charset=utf-8";
      return html;
    },
    {
      beforeHandle: requirePermission("finance:read"),
      params: IdParamSchema,
    },
  )
  .patch(
    "/:id",
    async ({ db, params, body, status }) => {
      try {
        const updated = await updateReceipt(params.id, body, db);
        if (!updated) return status(404, { error: "NOT_FOUND" });
        return updated;
      } catch (e) {
        return status(400, {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      params: IdParamSchema,
      body: UpdateReceiptSchema,
    },
  )
  .post(
    "/",
    async ({ db, body, status, actorId }) => {
      try {
        const result = await createPaymentService(db, {
          input: body,
          actorId,
        });
        return status(201, result);
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:issue"),
      body: CreatePaymentSchema,
    },
  )
  .post(
    "/:id/void",
    async ({ db, params, status }) => {
      try {
        return await voidReceiptService(db, { id: params.id });
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:void"),
      params: IdParamSchema,
    },
  );
