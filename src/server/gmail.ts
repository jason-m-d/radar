import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import prisma from "@/lib/db";
import { getOAuthClient, loadSavedCredentials } from "@/lib/google";
import { TaskStatus } from "@prisma/client";

const HISTORY_SETTING_KEY = "lastHistoryId";

export type GmailMessageSummary = {
  id: string;
  threadId: string;
  subject: string;
  snippet: string;
  sender: string;
  receivedAt: Date;
  historyId?: string;
  isVip: boolean;
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

  if (!message.id || !message.threadId) {
    return null;
  }

  return {
    id: message.id,
    threadId: message.threadId,
    subject,
    snippet: message.snippet ?? "",
    sender,
    receivedAt: new Date(internalDate),
    historyId: message.historyId ?? undefined,
    isVip: false,
  };
}

export async function listRecentImportantThreads(options: {
  vipEntries: string[];
  includeKeywordMatches: boolean;
}): Promise<GmailMessageSummary[]> {
  const { vipEntries, includeKeywordMatches } = options;
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

  if (!messageIds.size) {
    return [];
  }

  const batches = Array.from(messageIds);
  const summaries: GmailMessageSummary[] = [];
  let vipMatches = 0;
  let keywordMatches = 0;

  for (const id of batches) {
    const response = await gmail.users.messages.get({ userId: "me", id, format: "metadata", metadataHeaders: ["From", "Subject", "Date"] });
    const summary = toSummary(response.data);
    if (!summary) {
      continue;
    }

    const senderKey = summary.sender.toLowerCase();
    const match = vipArray.some((vip) => senderKey.includes(vip));

    if (match) {
      summaries.push({ ...summary, isVip: true });
      vipMatches += 1;
      continue;
    }

    if (includeKeywordMatches) {
      const confidence = detectTaskConfidence(summary.subject, summary.snippet);
      if (confidence !== null) {
        summaries.push({ ...summary, isVip: false });
        keywordMatches += 1;
      }
    }
  }

  console.info(
    `[gmail] processed=${messageIds.size} vipMatches=${vipMatches} keywordMatches=${keywordMatches} includeKeywordMatches=${includeKeywordMatches}`,
  );

  return summaries;
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
