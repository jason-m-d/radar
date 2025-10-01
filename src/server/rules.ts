import { RuleAction, RuleType } from "@prisma/client";
import prisma from "@/lib/db";
import { recordAuditEvent } from "@/server/audit";

export type RuleInput = {
  type: RuleType;
  pattern: string;
  action: RuleAction;
  unlessContains?: string | null;
  notes?: string | null;
  confidence?: number | null;
};

function normalizePattern(type: RuleType, pattern: string): string {
  const trimmed = pattern.trim();

  if (type === RuleType.EMAIL) {
    return trimmed.toLowerCase();
  }

  if (type === RuleType.DOMAIN) {
    return trimmed.replace(/^@/, "").toLowerCase();
  }

  return trimmed.toLowerCase();
}

export async function listRules() {
  return prisma.vipSuppressionRule.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createRule(input: RuleInput, context?: { actor?: string; reason?: string }) {
  const pattern = normalizePattern(input.type, input.pattern);

  const result = await prisma.vipSuppressionRule.create({
    data: {
      type: input.type,
      pattern,
      action: input.action,
      unlessContains: input.unlessContains?.trim() || null,
      notes: input.notes?.trim() || null,
      confidence: typeof input.confidence === "number" ? input.confidence : null,
    },
  });

  await recordAuditEvent({
    actor: context?.actor,
    action: "RULE_CREATED",
    entity: "VipSuppressionRule",
    entityId: result.id,
    details: {
      pattern: result.pattern,
      type: result.type,
      action: result.action,
      reason: context?.reason,
    },
  });

  return result;
}

export async function createRulesBulk(inputs: RuleInput[], context?: { actor?: string; reason?: string }) {
  if (!inputs.length) {
    return [];
  }

  const created = await prisma.$transaction(
    inputs.map((input) =>
      prisma.vipSuppressionRule.create({
        data: {
          type: input.type,
          pattern: normalizePattern(input.type, input.pattern),
          action: input.action,
          unlessContains: input.unlessContains?.trim() || null,
          notes: input.notes?.trim() || null,
          confidence: typeof input.confidence === "number" ? input.confidence : null,
        },
      }),
    ),
  );

  await Promise.all(
    created.map((entry) =>
      recordAuditEvent({
        actor: context?.actor,
        action: "RULE_CREATED",
        entity: "VipSuppressionRule",
        entityId: entry.id,
        details: {
          pattern: entry.pattern,
          type: entry.type,
          action: entry.action,
          reason: context?.reason,
        },
      }),
    ),
  );

  return created;
}

export async function deleteRule(id: string) {
  const deleted = await prisma.vipSuppressionRule.delete({ where: { id } });
  await recordAuditEvent({
    action: "RULE_DELETED",
    entity: "VipSuppressionRule",
    entityId: id,
    details: { pattern: deleted.pattern, type: deleted.type, action: deleted.action },
  });
}

export type ParsedRule = {
  type: RuleType;
  pattern: string;
  action: RuleAction;
  unless_contains?: string | null;
  notes?: string | null;
  confidence?: number | null;
};

export function toRuleInput(parsed: ParsedRule): RuleInput {
  return {
    type: parsed.type,
    pattern: parsed.pattern,
    action: parsed.action,
    unlessContains: parsed.unless_contains ?? null,
    notes: parsed.notes ?? null,
    confidence: parsed.confidence ?? null,
  };
}
