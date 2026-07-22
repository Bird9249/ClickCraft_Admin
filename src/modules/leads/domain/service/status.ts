import type { DbTransaction } from "@/shared/types";
import type { LeadStatus, UpdateLeadDTO } from "../contracts";
import { getLeadById } from "../repo/get-by-id";
import { updateLead } from "../repo/update";

const ALLOWED: Record<LeadStatus, LeadStatus[]> = {
  new: ["contacted", "qualified", "lost", "converted"],
  contacted: ["qualified", "lost", "converted"],
  qualified: ["lost", "converted"],
  converted: [],
  lost: ["contacted", "qualified"],
};

export function canTransition(from: LeadStatus, to: LeadStatus): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

export async function updateLeadService(
  client: DbTransaction,
  params: { id: string; input: UpdateLeadDTO; actorId?: string | null },
) {
  const lead = await getLeadById(params.id, client);
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "converted") {
    // After convert, only notes may change
    if (params.input.status) throw new Error("Cannot change status of converted lead");
    const updated = await updateLead(
      params.id,
      { notes: params.input.notes ?? lead.notes },
      client,
    );
    return { updated };
  }

  if (params.input.status) {
    const next = params.input.status as LeadStatus;
    if (!canTransition(lead.status as LeadStatus, next)) {
      throw new Error(`Invalid status transition: ${lead.status} → ${next}`);
    }
  }

  const patch: Parameters<typeof updateLead>[1] = {};
  if (params.input.notes !== undefined) patch.notes = params.input.notes;
  if (params.input.status) {
    patch.status = params.input.status;
    if (params.input.status === "contacted" && !lead.contactedAt) {
      patch.contactedAt = new Date();
      patch.contactedBy = params.actorId ?? null;
    }
  }

  const updated = await updateLead(params.id, patch, client);
  return { updated };
}

export async function markLeadContactedService(
  client: DbTransaction,
  params: { id: string; actorId?: string | null },
) {
  return updateLeadService(client, {
    id: params.id,
    actorId: params.actorId,
    input: { status: "contacted" },
  });
}

export async function markLeadLostService(
  client: DbTransaction,
  params: { id: string; actorId?: string | null },
) {
  return updateLeadService(client, {
    id: params.id,
    actorId: params.actorId,
    input: { status: "lost" },
  });
}
