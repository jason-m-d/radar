import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import prisma from "@/lib/db";
import { getOAuthClient, loadSavedCredentials } from "@/lib/google";
import { RuleAction, RuleType, TaskStatus, type VipSuppressionRule } from "@prisma/client";
import { safeLog } from "@/server/redact";

const HISTORY_SETTING_KEY = "lastHistoryId";

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  sender: string;
  senderEmail: string;
  senderDomain: string | null;
  receivedAt: Date;
  historyId?: string;
  isVip: boolean;
  rule?: {
    id: string;
    action: RuleAction;
    type: RuleType;
    pattern: string;
    unlessContains?: string | null;
  };
};

export type DetectedTask = {
  title: string;
  status: TaskStatus;
  confidence: number;
};

function maskEmail(address: string): string {
  const trimmed = address.split("<").pop()?.replace(">", "").trim() ?? address;
  const [local = "", domain = "redacted"] = trimmed.toLowerCase().split("@");
  if (!local) {
    return `*@${domain}`;
  }
  return `${local.slice(0, 2)}***@${domain}`;
}

function parseHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string): string | undefined {
  const header = headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase());
  return header?.value ?? undefined;
}

function extractEmailAddress(value: string): string {
  const match = value.match(/<([^>]+)>/);
  const raw = (match ? match[1] : value).trim().toLowerCase();
  return raw;
}

function extractDomain(email: string): string | null {
  const atIndex = email.lastIndexOf("@");
  if (atIndex === -1) {
    return null;
  }
  return email.slice(atIndex + 1).toLowerCase();
}

function formatRulePattern(rule: Pick<VipSuppressionRule, "type" | "pattern">): string {
  if (rule.type === RuleType.DOMAIN) {
    return `@${rule.pattern}`;
  }
  return rule.pattern;
}

function matchesRule(
  rule: Pick<VipSuppressionRule, "type" | "pattern">,
  email: string,
  domain: string | null,
  text: string,
): boolean {
  if (rule.type === RuleType.EMAIL) {
    return email === rule.pattern;
  }

  if (rule.type === RuleType.DOMAIN) {
    return domain === rule.pattern;
  }

  return text.includes(rule.pattern);
}

async function collectCandidateMessageIds(
  gmail: gmail_v1.Gmail,
  startHistoryId?: string,
): Promise<Set<string>> {
  const messageIds = new Set<string>();

  if (startHistoryId) {
    const history = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
      labelId: "INBOX",
    });

    history.data.history?.forEach((entry) => {
      entry.messagesAdded?.forEach((added) => {
        const id = added.message?.id;
        if (id) {
          messageIds.add(id);
        }
      });
    });
  }

  if (!messageIds.size) {
    const recent = await gmail.users.messages.list({
      userId: "me",
      labelIds: ["INBOX"],
      maxResults: 25,
      q: "newer_than:7d",
    });

    recent.data.messages?.forEach((message) => {
      if (message.id) {
        messageIds.add(message.id);
      }
    });
  }

  return messageIds;
}

function toSummary(message: gmail_v1.Schema$Message): GmailMessageSummary | null {
  const headers = message.payload?.headers;
  const subject = parseHeader(headers, "Subject") ?? "(no subject)";
  const sender = parseHeader(headers, "From") ?? "unknown";
  const internalDate = message.internalDate ? Number(message.internalDate) : Date.now();
  const senderEmail = extractEmailAddress(sender);
  const senderDomain = extractDomain(senderEmail);

  if (!message.id || !message.threadId) {
    return null;
  }

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    snippet: message.snippet ?? "",
    sender,
    senderEmail,
    senderDomain,
    receivedAt: new Date(internalDate),
    historyId: message.historyId ?? undefined,
    isVip: false,
  };
}

export async function listRecentImportantThreads(options: {
  vipEntries: string[];
  includeKeywordMatches: boolean;
  rules: VipSuppressionRule[];
}): Promise<GmailMessageSummary[]> {
  try {
    const { vipEntries, includeKeywordMatches, rules } = options;
  const tokens = await loadSavedCredentials();
  if (!tokens) {
    throw new Error("Google OAuth tokens missing. Run scripts/google-auth-setup.ts first.");
  }

  const client = await getOAuthClient();
  client.setCredentials(tokens);
  const gmail = google.gmail({ version: "v1", auth: client });

  const historySetting = await prisma.setting.findUnique({ where: { key: HISTORY_SETTING_KEY } });
  const startHistoryId =
    typeof historySetting?.value === "string" && historySetting.value.length > 0 ? historySetting.value : undefined;

  const messageIds = await collectCandidateMessageIds(gmail, startHistoryId);
  const vipArray = Array.from(new Set(vipEntries.map((entry) => entry.toLowerCase())));
  const ruleList = Array.isArray(rules) ? rules : [];

    if (!messageIds.size) {
      return [];
    }

  const batches = Array.from(messageIds);
  const summaries: GmailMessageSummary[] = [];
  let vipMatches = 0;
  let keywordMatches = 0;
  let rulePromotions = 0;
  let ruleSuppressions = 0;

    for (const id of batches) {
    const response = await gmail.users.messages.get({ userId: "me", id, format: "metadata", metadataHeaders: ["From", "Subject", "Date"] });
    const summary = toSummary(response.data);
    if (!summary) {
      continue;
    }

    const senderKey = summary.senderEmail;
    const domain = summary.senderDomain;
    const baseVipMatch = vipArray.some((vip) => senderKey.includes(vip));
    const text = `${summary.subject} ${summary.snippet}`.toLowerCase();

    let suppressed = false;
    let ruleAttachment: GmailMessageSummary["rule"] | undefined;

    for (const rule of ruleList) {
      if (!matchesRule(rule, senderKey, domain, text)) {
        continue;
      }

      const exceptionMatched = rule.unlessContains ? text.includes(rule.unlessContains.toLowerCase()) : false;

      if (exceptionMatched) {
        safeLog("[#rules] skipped", {
          ruleId: rule.id,
          rule: formatRulePattern(rule),
          exception: rule.unlessContains,
        });
        continue;
      }

      const suffix = rule.unlessContains
        ? `${rule.unlessContains} exception not found`
        : "no exception";

      if (rule.action === RuleAction.SUPPRESS) {
        ruleSuppressions += 1;
        safeLog("[gmail] suppress", {
          ruleId: rule.id,
          rule: formatRulePattern(rule),
          exceptionState: suffix,
        });
        suppressed = true;
        break;
      }

      rulePromotions += 1;
      ruleAttachment = {
        id: rule.id,
        action: rule.action,
        type: rule.type,
        pattern: rule.pattern,
        unlessContains: rule.unlessContains ?? null,
      };
      safeLog("[gmail] promote", {
        ruleId: rule.id,
        rule: formatRulePattern(rule),
        exceptionState: suffix,
      });
      break;
    }

    if (suppressed) {
      continue;
    }

    const keywordConfidence = includeKeywordMatches ? detectTaskConfidence(summary.subject, summary.snippet) : null;
    const include = baseVipMatch || ruleAttachment || (includeKeywordMatches && keywordConfidence !== null);

    if (!include) {
      continue;
    }

    if (baseVipMatch) {
      vipMatches += 1;
    } else if (keywordConfidence !== null) {
      keywordMatches += 1;
    }

    summaries.push({ ...summary, isVip: Boolean(baseVipMatch || ruleAttachment), rule: ruleAttachment });
  }

    safeLog("[gmail]", {
      processed: messageIds.size,
      vipMatches,
      keywordMatches,
      rulePromotions,
      ruleSuppressions,
      includeKeywordMatches,
    });

    return summaries;
  } catch (error) {
    safeLog("[gmail] error", { message: error instanceof Error ? error.message : String(error) });
    return [];
  }
}

const TASK_KEYWORDS = [
  { pattern: /\b(due|deadline|by\s+\w+)/i, weight: 0.9 },
  { pattern: /\b(follow up|follow-up|check in)/i, weight: 0.6 },
  { pattern: /\b(action required|please (?:send|review|confirm))/i, weight: 0.75 },
];

function detectTaskConfidence(subject: string, snippet: string): number | null {
  const text = `${subject} ${snippet}`.toLowerCase();
  const detected = TASK_KEYWORDS.filter(({ pattern }) => pattern.test(text));

  if (!detected.length) {
    return null;
  }

  return Math.max(...detected.map((entry) => entry.weight));
}

export function extractTasksFromMessage(message: GmailMessageSummary): DetectedTask[] {
  const confidence = detectTaskConfidence(message.subject, message.snippet);

  if (confidence === null) {
    return [];
  }

  return [
    {
      title: message.subject.trim() || "Follow up",
      status: TaskStatus.TODO,
      confidence: Number(confidence.toFixed(2)),
    },
  ];
}

type ThreadRecordForSummary = {
  threadId: string;
  subject: string | null;
  participants: string;
  lastMessageAt: Date;
  isVip: boolean;
};

function firstParticipant(participants: string): string | undefined {
  try {
    const parsed = JSON.parse(participants);
    if (Array.isArray(parsed)) {
      const entry = parsed.find((value) => typeof value === "string");
      if (typeof entry === "string") {
        return entry;
      }
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function summarizeMessageForLog(message: GmailMessageSummary | ThreadRecordForSummary): Record<string, unknown> {
  const subject = message.subject ?? "(no subject)";
  const sender =
    "sender" in message && typeof message.sender === "string"
      ? message.sender
      : firstParticipant((message as ThreadRecordForSummary).participants) ?? "unknown";
  const received =
    "receivedAt" in message && message.receivedAt instanceof Date
      ? message.receivedAt
      : (message as ThreadRecordForSummary).lastMessageAt;

  return {
    threadId: message.threadId,
    subject,
    sender: maskEmail(sender),
    receivedAt: received instanceof Date ? received.toISOString() : undefined,
    isVip: message.isVip,
  };
}
