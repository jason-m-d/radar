import prisma from "@/lib/db";
import { maskEmail } from "@/server/redact";

export type AuditAction =
  | "RULE_CREATED"
  | "RULE_UPDATED"
  | "RULE_DELETED"
  | "CONFIG_UPDATED"
  | "PARSER_FALLBACK";

type AuditOptions = {
  actor?: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
};

const SYSTEM_ACTOR = "system";

function sanitizeDetails(details: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!details) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, maskEmail(value)];
      }
      return [key, value];
    }),
  );
}

export async function recordAuditEvent(options: AuditOptions) {
  try {
    await prisma.auditEvent.create({
      data: {
        actor: options.actor ?? SYSTEM_ACTOR,
        action: options.action,
        entity: options.entity,
        entityId: options.entityId,
        details: sanitizeDetails(options.details),
      },
    });
  } catch (error) {
    console.error("[audit] failed", { message: (error as Error).message });
  }
}

export async function listAuditEvents(limit = 100) {
  return prisma.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
