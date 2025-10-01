import { RuleAction, RuleType } from "@prisma/client";
import prisma from "@/lib/db";

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

export async function createRule(input: RuleInput) {
  const pattern = normalizePattern(input.type, input.pattern);

  return prisma.vipSuppressionRule.create({
    data: {
      type: input.type,
      pattern,
      action: input.action,
      unlessContains: input.unlessContains?.trim() || null,
      notes: input.notes?.trim() || null,
      confidence: typeof input.confidence === "number" ? input.confidence : null,
    },
  });
}

export async function createRulesBulk(inputs: RuleInput[]) {
  if (!inputs.length) {
    return [];
  }

  return prisma.$transaction(
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
}

export async function deleteRule(id: string) {
  await prisma.vipSuppressionRule.delete({ where: { id } });
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
