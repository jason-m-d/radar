import { NextResponse } from "next/server";
import { z } from "zod";
import { RuleAction, RuleType } from "@prisma/client";
import { applyHeuristics, parseRuleText } from "@/server/rule-parser";
import { safeLog } from "@/server/redact";

const requestSchema = z.object({
  input: z.string().min(1, "Provide text to parse."),
});

const responseSchema = z.object({
  type: z.nativeEnum(RuleType),
  pattern: z.string().min(1),
  action: z.nativeEnum(RuleAction),
  unless_contains: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  confidence: z.number().optional().nullable(),
});

export async function POST(request: Request) {
  let payload: z.infer<typeof requestSchema>;

  try {
    const body = await request.json();
    payload = requestSchema.parse(body);
  } catch (error) {
    const message =
      error instanceof z.ZodError ? error.issues.map((issue) => issue.message).join("; ") : "Invalid JSON payload.";
    return NextResponse.json({ message }, { status: 400 });
  }

  const heuristics = applyHeuristics(payload.input, RuleAction.VIP);

  if (!heuristics.needsAi) {
    return NextResponse.json({ rule: heuristics.rule, strategy: "heuristic" });
  }

  try {
    const { rule, strategy } = await parseRuleText(payload.input, { defaultAction: RuleAction.VIP });

    const safe = responseSchema.parse(rule);

    return NextResponse.json({ rule: safe, strategy });
  } catch (error) {
    safeLog("[rules] parse error", { message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Unable to parse rule." }, { status: 502 });
  }
}
