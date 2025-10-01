import { NextResponse } from "next/server";
import { z } from "zod";
import { RuleAction, RuleType } from "@prisma/client";
import { createRulesBulk } from "@/server/rules";
import { safeLog } from "@/server/redact";

const schema = z.object({
  rules: z.array(
    z.object({
      type: z.nativeEnum(RuleType),
      pattern: z.string().min(1),
      action: z.nativeEnum(RuleAction),
      unless_contains: z.string().optional().nullable(),
      notes: z.string().optional().nullable(),
      confidence: z.number().optional().nullable(),
    }),
  ),
});

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid rules payload." }, { status: 400 });
  }

  if (!parsed.data.rules.length) {
    return NextResponse.json({ message: "Provide at least one rule." }, { status: 400 });
  }

  const dedup = new Map<string, ReturnType<typeof toInput>>();

  function toInput(rule: (typeof parsed.data.rules)[number]) {
    return {
      type: rule.type,
      pattern: rule.pattern,
      action: rule.action,
      unlessContains: rule.unless_contains ?? null,
      notes: rule.notes ?? null,
      confidence: rule.confidence ?? null,
    };
  }

  for (const rule of parsed.data.rules) {
    const key = `${rule.type}|${rule.pattern}|${rule.action}|${rule.unless_contains ?? ""}|${rule.notes ?? ""}`;
    if (!dedup.has(key)) {
      dedup.set(key, toInput(rule));
    }
  }

  try {
    const created = await createRulesBulk(Array.from(dedup.values()), {
      actor: "csv-import",
      reason: "bulk-import",
    });
    return NextResponse.json({ count: created.length });
  } catch (error) {
    safeLog("[rules] csv import error", { message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Unable to import rules." }, { status: 500 });
  }
}
