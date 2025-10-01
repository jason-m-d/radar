import { NextResponse } from "next/server";
import { RuleAction, RuleType } from "@prisma/client";
import { parseRuleText, applyHeuristics, RuleDraft } from "@/server/rule-parser";
import { safeLog } from "@/server/redact";

type ColumnDescriptor = {
  index: number;
  header: string;
  role: "rule" | "exception" | "notes" | "action";
  typeHint?: RuleType;
  actionHint?: RuleAction;
};

type PreviewEntry = RuleDraft & {
  id: string;
  strategy: string;
  source: { row: number; column: string };
};

type Summary = {
  totalRows: number;
  totalRules: number;
  vipCount: number;
  suppressCount: number;
};

const ACTION_KEYWORDS: Record<string, RuleAction> = {
  suppress: RuleAction.SUPPRESS,
  block: RuleAction.SUPPRESS,
  exclude: RuleAction.SUPPRESS,
  ignore: RuleAction.SUPPRESS,
  spam: RuleAction.SUPPRESS,
  vip: RuleAction.VIP,
  allow: RuleAction.VIP,
  include: RuleAction.VIP,
  track: RuleAction.VIP,
};

function detectActionFromText(text: string | null | undefined): RuleAction | null {
  if (!text) return null;
  const lowered = text.toLowerCase();
  for (const [keyword, action] of Object.entries(ACTION_KEYWORDS)) {
    if (lowered.includes(keyword)) {
      return action;
    }
  }
  return null;
}

function detectTypeFromHeader(header: string): RuleType | null {
  const lowered = header.toLowerCase();
  if (/(email|sender)/.test(lowered)) {
    return RuleType.EMAIL;
  }
  if (/(domain|host)/.test(lowered)) {
    return RuleType.DOMAIN;
  }
  if (/(topic|keyword|subject|phrase|pattern)/.test(lowered)) {
    return RuleType.TOPIC;
  }
  return null;
}

function isExceptionHeader(header: string): boolean {
  const lowered = header.toLowerCase();
  return /(unless|exception|ignore|skip|if not)/.test(lowered);
}

function isNotesHeader(header: string): boolean {
  const lowered = header.toLowerCase();
  return /(note|comment|description|context)/.test(lowered);
}

function isActionHeader(header: string): boolean {
  const lowered = header.toLowerCase();
  return /(action|type|mode)/.test(lowered);
}

function splitCsv(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && char === ',') {
      row.push(current.trim());
      current = "";
      continue;
    }
    if (!inQuotes && (char === '\n' || char === '\r')) {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1;
      }
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  row.push(current.trim());
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }
  return rows;
}

async function analyzeCsv(
  text: string,
  defaultAction: RuleAction,
): Promise<{ preview: PreviewEntry[]; summary: Summary }> {
  const rows = splitCsv(text);
  if (!rows.length) {
    return {
      preview: [],
      summary: { totalRows: 0, totalRules: 0, vipCount: 0, suppressCount: 0 },
    };
  }

  let headers = rows[0];
  let dataRows = rows.slice(1);

  let headerDescriptors: ColumnDescriptor[] = headers.map((header, index) => {
    const typeHint = detectTypeFromHeader(header);
    const actionHint = detectActionFromText(header);
    if (isExceptionHeader(header)) {
      return { index, header, role: "exception" };
    }
    if (isNotesHeader(header)) {
      return { index, header, role: "notes" };
    }
    if (isActionHeader(header)) {
      return { index, header, role: "action" };
    }
    return { index, header, role: "rule", typeHint, actionHint };
  });

  const hasRuleColumn = headerDescriptors.some((descriptor) => descriptor.role === "rule");

  if (!hasRuleColumn) {
    dataRows = rows;
    headerDescriptors = rows[0].map((_, index) => ({ index, header: `Column ${index + 1}`, role: "rule" }));
  }

  const preview: PreviewEntry[] = [];
  const dedupe = new Set<string>();
  let vipCount = 0;
  let suppressCount = 0;

  for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex += 1) {
    const row = dataRows[rowIndex];
    if (!row || row.every((cell) => cell.trim().length === 0)) {
      continue;
    }

    const exceptionValues = headerDescriptors
      .filter((descriptor) => descriptor.role === "exception")
      .map((descriptor) => row[descriptor.index]?.trim())
      .filter((value): value is string => Boolean(value && value.length));

    const combinedException = exceptionValues.length ? exceptionValues.join("; ").toLowerCase() : null;

    const notesValues = headerDescriptors
      .filter((descriptor) => descriptor.role === "notes")
      .map((descriptor) => row[descriptor.index]?.trim())
      .filter((value): value is string => Boolean(value && value.length));
    const combinedNotes = notesValues.length ? notesValues.join("; ") : null;

    const rowActionOverride = headerDescriptors
      .filter((descriptor) => descriptor.role === "action")
      .map((descriptor) => detectActionFromText(row[descriptor.index]))
      .find((value): value is RuleAction => value !== null);

    for (const descriptor of headerDescriptors) {
      if (descriptor.role !== "rule") {
        continue;
      }

      const rawValue = row[descriptor.index]?.trim();
      if (!rawValue) {
        continue;
      }

      const columnAction = descriptor.actionHint ?? rowActionOverride ?? defaultAction;
      const heuristics = applyHeuristics(rawValue, columnAction);

      let draft: RuleDraft;
      let strategy: string;

      if (heuristics.needsAi) {
        const result = await parseRuleText(rawValue, { defaultAction: columnAction });
        draft = result.rule;
        strategy = result.strategy;
      } else {
        draft = heuristics.rule;
        strategy = "heuristic";
      }

      if (descriptor.typeHint && draft.type !== descriptor.typeHint) {
        draft = { ...draft, type: descriptor.typeHint };
      }

      if (draft.type === RuleType.DOMAIN) {
        draft = { ...draft, pattern: draft.pattern.replace(/^@/, "") };
      }

      draft = {
        ...draft,
        action: columnAction,
        unless_contains: draft.unless_contains ?? combinedException,
        notes: draft.notes ?? combinedNotes,
      };

      const key = `${draft.type}|${draft.pattern}|${draft.action}|${draft.unless_contains ?? ""}|${draft.notes ?? ""}`;
      if (dedupe.has(key)) {
        continue;
      }
      dedupe.add(key);

      if (draft.action === RuleAction.VIP) {
        vipCount += 1;
      } else {
        suppressCount += 1;
      }

      preview.push({
        ...draft,
        id: crypto.randomUUID(),
        strategy,
        source: { row: hasRuleColumn ? rowIndex + 2 : rowIndex + 1, column: descriptor.header },
      });
    }
  }

  return {
    preview,
    summary: {
      totalRows: dataRows.length,
      totalRules: preview.length,
      vipCount,
      suppressCount,
    },
  };
}

export async function POST(request: Request) {
  const form = await request.formData();
  const actionInput = String(form.get("action") ?? "VIP").toUpperCase();
  const defaultAction = actionInput === "SUPPRESS" ? RuleAction.SUPPRESS : RuleAction.VIP;

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Missing CSV file." }, { status: 400 });
  }

  const text = await file.text();

  try {
    const { preview, summary } = await analyzeCsv(text, defaultAction);
    return NextResponse.json({ preview, summary });
  } catch (error) {
    safeLog("[rules] csv analyze error", { message: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ message: "Unable to analyze CSV." }, { status: 400 });
  }
}
