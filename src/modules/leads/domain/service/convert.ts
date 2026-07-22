import { createCustomerService } from "@/modules/customers/domain/service/create";
import { DEFAULT_PAYMENT_SCHEDULE } from "@/modules/finance/domain/payment-schedule";
import { createQuotationService } from "@/modules/finance/domain/service/quotations";
import type { DbTransaction } from "@/shared/types";
import type { LeadFeatureDTO } from "../contracts";
import { findCustomerByPhone } from "../repo/find-customer-by-phone";
import { getLeadById } from "../repo/get-by-id";
import { updateLead } from "../repo/update";
import { canTransition } from "./status";

export class LeadAlreadyConvertedError extends Error {
  constructor() {
    super("ALREADY_CONVERTED");
    this.name = "LeadAlreadyConvertedError";
  }
}

function featuresToLines(features: LeadFeatureDTO[]) {
  return features.map((f, i) => ({
    description: `[${f.phaseLabel}] ${f.label}`,
    quantity: 1,
    unitPrice: f.priceLak,
    sortOrder: i,
  }));
}

export async function convertLeadService(
  client: DbTransaction,
  params: { id: string; actorId?: string | null },
) {
  const lead = await getLeadById(params.id, client);
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "converted") throw new LeadAlreadyConvertedError();
  if (!canTransition(lead.status as never, "converted")) {
    throw new Error(`Cannot convert lead in status: ${lead.status}`);
  }

  const features = (lead.selectedFeatures ?? []) as LeadFeatureDTO[];
  if (!Array.isArray(features) || features.length === 0) {
    throw new Error("Lead has no selected features");
  }

  let customerId = lead.customerId;
  if (!customerId) {
    const existing = await findCustomerByPhone(lead.phone, client);
    if (existing) {
      customerId = existing.id;
    } else {
      const address = [
        lead.addressHouse,
        lead.addressCity,
        lead.addressProvince,
      ]
        .filter(Boolean)
        .join(", ") || lead.addressText;

      const { created } = await createCustomerService(client, {
        actorId: params.actorId,
        input: {
          type: "company",
          name: lead.companyName,
          nameLocal: lead.contactName,
          phone: lead.phone,
          whatsapp: lead.phone,
          email: lead.email ?? null,
          address,
          notes: `ຜູ້ຕິດຕໍ່: ${lead.contactName}\nLead: ${lead.id}`,
        },
      });
      customerId = created.id;
    }
  }

  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  const { created: quotation } = await createQuotationService(client, {
    actorId: params.actorId,
    input: {
      customerId,
      issueDate: new Date(),
      validUntil,
      currency: lead.currency || "LAK",
      taxNote: "VAT 0%",
      notes: lead.presetName
        ? `${lead.presetName}${lead.phaseLabel ? ` — ${lead.phaseLabel}` : ""}`
        : null,
      internalNotes: `Converted from website lead ${lead.id}`,
      sourcePresetId: lead.presetId,
      paymentSchedule: DEFAULT_PAYMENT_SCHEDULE,
      lines: featuresToLines(features),
    },
  });

  const updated = await updateLead(
    lead.id,
    {
      status: "converted",
      convertedAt: new Date(),
      convertedBy: params.actorId ?? null,
      customerId,
      quotationId: quotation.id,
      contactedAt: lead.contactedAt ?? new Date(),
      contactedBy: lead.contactedBy ?? params.actorId ?? null,
    },
    client,
  );

  return {
    lead: updated,
    customerId,
    quotationId: quotation.id,
  };
}
