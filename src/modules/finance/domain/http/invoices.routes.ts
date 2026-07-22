import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import {
  CreateFromQuotationSchema,
  CreateInvoiceSchema,
  IdParamSchema,
  UpdateInvoiceSchema,
} from "../contracts";
import { getInvoiceById } from "../repo/invoices/get-by-id";
import { listInvoices } from "../repo/invoices/list";
import {
  createInvoiceService,
  createInvoicesFromQuotationService,
  issueInvoiceService,
  updateInvoiceService,
  voidInvoiceService,
} from "../service/invoices";
import { loadBankQrDataUri } from "../service/bank-qr";
import { renderInvoiceHtml } from "../service/pdf";
import { getFinanceSettings } from "../repo/settings/get";

export const invoicesRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => listInvoices(query, db),
    {
      beforeHandle: requirePermission("finance:read"),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const inv = await getInvoiceById(params.id, db);
      if (!inv) return status(404, { error: "NOT_FOUND" });
      return inv;
    },
    {
      beforeHandle: requirePermission("finance:read"),
      params: IdParamSchema,
    },
  )
  .get(
    "/:id/pdf",
    async ({ db, params, status, set }) => {
      const inv = await getInvoiceById(params.id, db);
      if (!inv) return status(404, { error: "NOT_FOUND" });
      const settings = await getFinanceSettings(db);
      const qrDataUri = await loadBankQrDataUri(settings.qrImageKey);
      const html = renderInvoiceHtml({
        number: inv.number,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        milestoneLabel: inv.milestoneLabel,
        customerName: inv.customerName ?? "",
        customerAddress: inv.customerAddress,
        customerTaxId: inv.customerTaxId,
        customerPhone: inv.customerPhone,
        customerEmail: inv.customerEmail,
        currency: inv.currency,
        lines: inv.lines.map((l) => ({
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          amount: l.amount,
        })),
        subtotal: inv.subtotal,
        taxAmount: inv.taxAmount,
        total: inv.total,
        amountPaid: inv.amountPaid,
        taxNote: inv.taxNote,
        notes: inv.notes,
        showSignature: inv.showSignature ?? true,
        bank: {
          bankName: settings.bankName,
          accountName: settings.accountName,
          accountNumber: settings.accountNumber,
          qrDataUri,
        },
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
        const { created } = await createInvoiceService(db, {
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
      body: CreateInvoiceSchema,
    },
  )
  .post(
    "/from-quotation",
    async ({ db, body, status, actorId }) => {
      try {
        const { invoices } = await createInvoicesFromQuotationService(db, {
          input: body,
          actorId,
        });
        return status(201, { invoices });
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:issue"),
      body: CreateFromQuotationSchema,
    },
  )
  .put(
    "/:id",
    async ({ db, params, body, status }) => {
      try {
        const { updated } = await updateInvoiceService(db, {
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
      body: UpdateInvoiceSchema,
    },
  )
  .post(
    "/:id/issue",
    async ({ db, params, status }) => {
      try {
        return await issueInvoiceService(db, { id: params.id });
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
        return await voidInvoiceService(db, { id: params.id });
      } catch (e) {
        return status(400, { error: e instanceof Error ? e.message : String(e) });
      }
    },
    {
      beforeHandle: requirePermission("finance:void"),
      params: IdParamSchema,
    },
  );
