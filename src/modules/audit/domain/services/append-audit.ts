import type { DbClient } from "@/server/platform/db/client";
import { auditLogs } from "@/server/platform/db/schema/audit";
import type { DbTransaction } from "@/shared/types";
import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";
import { randomUUIDv7 } from "bun";
import type { AuditEvent } from "../audit.types";
import { auditPolicy } from "./audit.policy.impl";

type Db = DbTransaction | DbClient;

function parseOccurredAt(raw: string | number | Date | undefined): Date {
  if (raw == null) return new Date();
  if (raw instanceof Date) return new Date(raw);
  if (Number.isFinite(raw)) return new Date(Number(raw));
  const d = new Date(raw as string);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function computeHash(payload: unknown, prevHash: string | null): string {
  const data = `${prevHash ?? "0"}|${JSON.stringify(payload)}`;
  const h = Bun.hash.xxHash64(data);
  return h.toString(16).padStart(16, "0");
}

export async function appendAudit(
  client: Db,
  events: AuditEvent[],
): Promise<void> {
  const redacted = events.map((e) => auditPolicy.redact(e));

  for (const payload of redacted) {
    const eventId = payload.id ?? randomUUIDv7();
    const occurredAt = parseOccurredAt(payload.occurredAt);
    const day = occurredAt.toISOString().slice(0, 10);
    const tenantId = (payload.tenantId as string | undefined) ?? null;
    const dayStart = new Date(`${day}T00:00:00.000Z`);
    const dayEnd = new Date(`${day}T23:59:59.999Z`);

    const lastLog = await client
      .select({ hash: auditLogs.hash })
      .from(auditLogs)
      .where(
        and(
          tenantId
            ? eq(auditLogs.tenantId, tenantId)
            : isNull(auditLogs.tenantId),
          gte(auditLogs.occurredAt, dayStart),
          lte(auditLogs.occurredAt, dayEnd),
        ),
      )
      .orderBy(desc(auditLogs.occurredAt))
      .limit(1);

    const prevHash: string | null = lastLog[0]?.hash ?? null;
    const nextHash = computeHash(payload, prevHash);

    const entityId = payload.entityId != null ? String(payload.entityId) : null;

    await client.insert(auditLogs).values({
      id: eventId,
      occurredAt,
      requestId: payload.requestId ?? null,
      traceId: payload.traceId ?? null,
      tenantId,
      actorId: payload.actorId ?? null,
      actorRole: payload.actorRole ?? null,
      action: payload.action,
      entityType: payload.entityType ?? null,
      entityId,
      result: payload.result ?? "success",
      error: payload.error ?? null,
      ip: payload.ip ?? null,
      userAgent: payload.userAgent ?? null,
      path: payload.path ?? null,
      method: payload.method ?? null,
      before: payload.before ?? null,
      after: payload.after ?? null,
      meta: payload.meta ?? null,
      prevHash,
      hash: nextHash,
    });
  }
}
