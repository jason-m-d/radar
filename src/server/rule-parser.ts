import OpenAI from "openai";
import { RuleAction, RuleType } from "@prisma/client";

export type RuleDraft = {
  type: RuleType;
  pattern: string;
  action: RuleAction;
  unless_contains: string | null;
  notes: string | null;
  confidence: number | null;
};

export type ParseStrategy = "heuristic" | "ai" | "fallback";

type HeuristicResult = {
  rule: RuleDraft;
  needsAi: boolean;
};

const SYSTEM_PROMPT = `You convert natural language VIP/suppression instructions into strict JSON.
- Only respond with a single JSON object.
- "type" must be one of: EMAIL, DOMAIN, TOPIC.
- "pattern" should be normalized (emails lower-case, domains without leading @).
- "action" must be VIP or SUPPRESS.
- If the instruction includes an exception phrase ("unless"), capture it in "unless_contains" as lowercase text.
- Provide short "notes" when helpful.
- "confidence" should be a float between 0 and 1 reflecting parsing certainty.
- If unsure, set type to TOPIC, pattern to the core phrase, and confidence <= 0.4.`;

function defaultDraft(pattern: string, action: RuleAction): RuleDraft {
  return {
    type: RuleType.TOPIC,
    pattern,
    action,
    unless_contains: null,
    notes: null,
    confidence: 0.9,
  };
}

function cleanupPattern(text: string): string {
  return text.trim().toLowerCase();
}

export function applyHeuristics(input: string, defaultAction: RuleAction): HeuristicResult {
  const trimmed = input.trim();
  const lowered = trimmed.toLowerCase();

  if (!trimmed) {
    return { rule: defaultDraft("", defaultAction), needsAi: false };
  }

  if (/^@[^\s@]+$/i.test(trimmed)) {
    return {
      rule: {
        type: RuleType.DOMAIN,
        pattern: trimmed.slice(1).toLowerCase(),
        action: defaultAction,
        unless_contains: null,
        notes: null,
        confidence: 0.95,
      },
      needsAi: false,
    };
  }

  if (/^[^\s@]+@[^\s@]+$/.test(trimmed)) {
    return {
      rule: {
        type: RuleType.EMAIL,
        pattern: lowered,
        action: defaultAction,
        unless_contains: null,
        notes: null,
        confidence: 0.95,
      },
      needsAi: false,
    };
  }

  if (!trimmed.includes("@")) {
    const condensed = trimmed.replace(/\s+/g, " ").toLowerCase();
    return {
      rule: {
        type: RuleType.TOPIC,
        pattern: condensed,
        action: defaultAction,
        unless_contains: null,
        notes: null,
        confidence: condensed === lowered ? 0.9 : 0.85,
      },
      needsAi: false,
    };
  }

  const emailLike = lowered.match(/[^\s@]+@[^\s@]+/);
  if (emailLike) {
    return {
      rule: {
        type: RuleType.EMAIL,
        pattern: emailLike[0],
        action: defaultAction,
        unless_contains: null,
        notes: null,
        confidence: 0.6,
      },
      needsAi: true,
    };
  }

  return { rule: defaultDraft(cleanupPattern(input), defaultAction), needsAi: true };
}

type ParseOptions = {
  defaultAction?: RuleAction;
};

export async function parseRuleText(input: string, options: ParseOptions = {}): Promise<{
  rule: RuleDraft;
  strategy: ParseStrategy;
}> {
  const defaultAction = options.defaultAction ?? RuleAction.VIP;
  const heuristics = applyHeuristics(input, defaultAction);

  if (!heuristics.needsAi) {
    return { rule: heuristics.rule, strategy: "heuristic" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { rule: heuristics.rule, strategy: "fallback" };
  }

  const client = new OpenAI({ apiKey });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input.trim() },
      ],
    });

    const raw = response.output_text ?? "{}";
    const parsed = JSON.parse(raw) as Partial<RuleDraft> & { type?: string; action?: string };

    const type = (parsed.type as RuleType | undefined) ?? heuristics.rule.type;
    const action = (parsed.action as RuleAction | undefined) ?? heuristics.rule.action;

    const rule: RuleDraft = {
      type,
      pattern: cleanupPattern(parsed.pattern ?? input),
      action,
      unless_contains: parsed.unless_contains ?? heuristics.rule.unless_contains,
      notes: parsed.notes ?? heuristics.rule.notes,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : heuristics.rule.confidence,
    };

    return { rule, strategy: "ai" };
  } catch (error) {
    console.error("[rule-parser] ai parse error", { message: (error as Error).message });
    return { rule: heuristics.rule, strategy: "fallback" };
  }
}
