import type { DbTransaction } from "@/shared/types";
import type { CreatePublicLeadDTO } from "../contracts";
import { createLead } from "../repo/create";
import { normalizePhone } from "../repo/find-customer-by-phone";
import { checkRateLimit } from "./rate-limit";

export class LeadHoneypotError extends Error {
  constructor() {
    super("HONEYPOT");
    this.name = "LeadHoneypotError";
  }
}

export class LeadRateLimitError extends Error {
  retryAfterSec: number;
  constructor(retryAfterSec: number) {
    super("RATE_LIMIT");
    this.name = "LeadRateLimitError";
    this.retryAfterSec = retryAfterSec;
  }
}

export async function createLeadFromWebsiteService(
  client: DbTransaction,
  params: {
    input: CreatePublicLeadDTO;
    ip?: string | null;
    userAgent?: string | null;
  },
) {
  const { input } = params;

  if (input.website && input.website.trim().length > 0) {
    throw new LeadHoneypotError();
  }

  const phoneKey = `phone:${normalizePhone(input.phone) || input.phone}`;
  const ipKey = params.ip ? `ip:${params.ip}` : null;

  const phoneLimit = checkRateLimit(phoneKey);
  if (!phoneLimit.ok) {
    throw new LeadRateLimitError(phoneLimit.retryAfterSec ?? 3600);
  }
  if (ipKey) {
    const ipLimit = checkRateLimit(ipKey);
    if (!ipLimit.ok) {
      throw new LeadRateLimitError(ipLimit.retryAfterSec ?? 3600);
    }
  }

  const { website: _honeypot, ...rest } = input;
  const created = await createLead(
    {
      ...rest,
      clientMeta: params.userAgent
        ? { userAgent: params.userAgent.slice(0, 300) }
        : null,
    },
    client,
  );

  return { id: created.id, status: created.status as "new" };
}
