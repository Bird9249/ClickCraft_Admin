import { Elysia } from "elysia";
import { requirePermission } from "@/modules/roles/domain/http/middleware";
import { serverContext } from "@/server/platform/http/context";
import { OffsetPageQuerySchema } from "@/shared/contracts/base";
import {
  CreateLedgerEntrySchema,
  ConvertLedgerPartySchema,
  IdParamSchema,
  LinkLedgerPaymentSchema,
  UpdateLedgerEntrySchema,
} from "../contracts";
import { getLedgerEntryById } from "../repo/ledger/get-by-id";
import {
  getLedgerSummary,
  listLedgerDistinctValues,
  listLedgerEntries,
} from "../repo/ledger/list";
import {
  createLedgerEntryService,
  deleteLedgerEntryService,
  updateLedgerEntryService,
} from "../service/ledger";
import { importLedgerCsvService } from "../service/ledger-import";
import {
  convertLedgerPartyService,
  listConvertibleRelatedPartiesService,
} from "../service/ledger-convert-party";
import {
  getLedgerReconciliationService,
  linkLedgerPaymentService,
} from "../service/ledger-reconcile";

export const ledgerRoutes = new Elysia()
  .use(serverContext)
  .get(
    "/",
    async ({ db, query }) => {
      const [list, summary] = await Promise.all([
        listLedgerEntries(query, db),
        getLedgerSummary(db),
      ]);
      return { ...list, summary };
    },
    {
      beforeHandle: requirePermission("finance:read"),
      query: OffsetPageQuerySchema,
    },
  )
  .get(
    "/summary",
    async ({ db }) => getLedgerSummary(db),
    {
      beforeHandle: requirePermission("finance:read"),
    },
  )
  .get(
    "/lookups",
    async ({ db }) => listLedgerDistinctValues(db),
    {
      beforeHandle: requirePermission("finance:read"),
    },
  )
  .get(
    "/reconciliation",
    async ({ db }) => getLedgerReconciliationService(db),
    {
      beforeHandle: requirePermission("finance:read"),
    },
  )
  .post(
    "/link-payment",
    async ({ db, body, status }) => {
      try {
        const result = await linkLedgerPaymentService(db, body);
        return status(200, result);
      } catch (e) {
        return status(400, {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      body: LinkLedgerPaymentSchema,
    },
  )
  .get(
    "/convertible-parties",
    async ({ db }) => listConvertibleRelatedPartiesService(db),
    {
      beforeHandle: requirePermission("finance:read"),
    },
  )
  .post(
    "/convert-party",
    async ({ db, body, status }) => {
      try {
        const result = await convertLedgerPartyService(db, body);
        return status(200, result);
      } catch (e) {
        return status(400, {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      body: ConvertLedgerPartySchema,
    },
  )
  .post(
    "/import",
    async ({ request, db, status, actorId }) => {
      try {
        const formData = await request.formData();
        const file = formData.get("file");
        const modeRaw = formData.get("mode");

        if (!(file instanceof File)) {
          return status(400, { error: "Missing CSV file" });
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
          return status(400, { error: "File must be a .csv file" });
        }

        const mode = modeRaw === "replace" ? "replace" : "append";
        const csvText = await file.text();
        const result = await importLedgerCsvService(db, {
          csvText,
          mode,
          actorId,
        });

        return status(201, result);
      } catch (e) {
        return status(400, {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
    },
  )
  .get(
    "/:id",
    async ({ db, params, status }) => {
      const entry = await getLedgerEntryById(params.id, db);
      if (!entry) return status(404, { error: "NOT_FOUND" });
      return entry;
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
        const { created } = await createLedgerEntryService(db, {
          input: body,
          actorId,
        });
        return status(201, created);
      } catch (e) {
        return status(400, {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      body: CreateLedgerEntrySchema,
    },
  )
  .put(
    "/:id",
    async ({ db, params, body, status }) => {
      try {
        const { updated } = await updateLedgerEntryService(db, {
          id: params.id,
          input: body,
        });
        return updated;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Ledger entry not found")
          return status(404, { error: "NOT_FOUND" });
        return status(400, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      params: IdParamSchema,
      body: UpdateLedgerEntrySchema,
    },
  )
  .delete(
    "/:id",
    async ({ db, params, status }) => {
      try {
        const { deleted } = await deleteLedgerEntryService(db, {
          id: params.id,
        });
        return deleted;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "Ledger entry not found")
          return status(404, { error: "NOT_FOUND" });
        return status(400, { error: message });
      }
    },
    {
      beforeHandle: requirePermission("finance:write"),
      params: IdParamSchema,
    },
  );
