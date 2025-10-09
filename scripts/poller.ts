import "dotenv/config";
import { pathToFileURL } from "node:url";
import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import prisma from "@/lib/db";
import { listRecentImportantThreads, extractTasksFromMessage, summarizeMessageForLog } from "@/server/gmail";
import Anthropic from "@anthropic-ai/sdk";
import { EmailDirection, MessageType, TaskStatus } from "@prisma/client";
import { safeLog } from "@/server/redact";
import { listRules } from "@/server/rules";
import { getVipList, getProcessingConfig } from "@/server/settings";
import { getOAuthClient, loadSavedCredentials } from "@/lib/google";

let gmailClient: gmail_v1.Gmail | null = null;
let processedLabelId: string | null = null;

async function getGmail(): Promise<gmail_v1.Gmail> {
  if (gmailClient) {
    return gmailClient;
  }

  const tokens = await loadSavedCredentials();
  if (!tokens) {
    throw new Error("Google OAuth tokens missing. Run scripts/google-auth-setup.ts first.");
  }

  const client = await getOAuthClient();
  client.setCredentials(tokens);
  gmailClient = google.gmail({ version: "v1", auth: client });
  return gmailClient;
}

async function ensureProcessedLabel(gmail: gmail_v1.Gmail): Promise<string | null> {
  try {
    const labelsRes = await gmail.users.labels.list({ userId: "me" });
    const existing = labelsRes.data.labels?.find((label) => label.name === "RADAR/Processed");
    if (existing?.id) {
      return existing.id;
    }

    const createRes = await gmail.users.labels.create({
      userId: "me",
      requestBody: {
        name: "RADAR/Processed",
        labelListVisibility: "labelShow",
        messageListVisibility: "show",
      },
    });

    safeLog("[poller] Created RADAR/Processed label", { labelId: createRes.data.id });
    return createRes.data.id ?? null;
  } catch (error) {
    console.error("[poller] Failed to create label:", error);
    return null;
  }
}

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds for testing
const HISTORY_SETTING_KEY = "lastHistoryId";

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropicClient = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

type CycleLogDetails = {
  cycle?: string;
  processedThreads?: number;
  newThreads?: number;
  newTasks?: number;
  vipCount?: number;
  vipOnly?: boolean;
  confidence?: number;
  updatedHistoryId?: string | null;
  askFirst?: number;
};

function logCycle(details: CycleLogDetails) {
  safeLog("[poller]", {
    cycle: details.cycle ?? "run",
    processed: details.processedThreads ?? 0,
    newThreads: details.newThreads ?? 0,
    newTasks: details.newTasks ?? 0,
    askFirst: details.askFirst ?? 0,
    vipOnly: details.vipOnly ?? null,
    confidence: typeof details.confidence === "number" ? Number(details.confidence.toFixed(2)) : null,
    vipCount: details.vipCount ?? 0,
    historyUpdated: details.updatedHistoryId ? "yes" : "no",
  });
}

async function updateHistoryId(historyId: string) {
  await prisma.setting.upsert({
    where: { key: HISTORY_SETTING_KEY },
    update: { value: historyId },
    create: { key: HISTORY_SETTING_KEY, value: historyId },
  });
}

async function moveIgnoredToBackBurner() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  const ignoredMessages = await prisma.message.findMany({
    where: {
      type: MessageType.ACTION,
      ignoredAt: { lte: twoDaysAgo },
      backBurneredAt: null,
      taskId: { not: null },
    },
    select: {
      id: true,
      taskId: true,
    },
  });

  if (!ignoredMessages.length) {
    return;
  }

  const now = new Date();

  for (const message of ignoredMessages) {
    if (!message.taskId) {
      continue;
    }

    await prisma.task.update({
      where: { id: message.taskId },
      data: { backBurneredAt: now },
    });

    await prisma.message.update({
      where: { id: message.id },
      data: { backBurneredAt: now },
    });
  }

  safeLog("[poller] moved ignored to back burner", {
    count: ignoredMessages.length,
  });
}

type CommitmentAnalysisResult = {
  needsTracking: boolean;
  taskTitle: string;
  dueDate: string | null;
  confidence: number;
  reason: string;
};

async function analyzeOutgoingCommitment(
  emailContent: string,
  subject: string,
  anthropic: Anthropic,
): Promise<CommitmentAnalysisResult | null> {
  try {
    const prompt = `Analyze this OUTGOING email from the user. Determine:
1. Did the user make a commitment or promise? (I'll send X, I'll do Y, I'll follow up by Z)
2. Did the user ask a question that needs tracking? (warranty inquiry, support request, waiting for response)
3. Is there a deadline or timeframe mentioned?

Subject: ${subject}

Email content:
${emailContent}

Return ONLY valid JSON (no markdown, no explanation):
{
  "needsTracking": true or false,
  "taskTitle": "Clear action item in 5-10 words",
  "dueDate": "ISO date string or null",
  "reason": "Brief reason why this needs tracking",
  "confidence": 1-10 number
}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      return null;
    }

    const cleaned = textContent.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned);

    console.log("[poller] AI commitment analysis result:", {
      subject,
      needsTracking: parsed.needsTracking,
      taskTitle: parsed.taskTitle,
      confidence: parsed.confidence,
      dueDate: parsed.dueDate,
      reason: parsed.reason,
    });

    return {
      needsTracking: Boolean(parsed.needsTracking),
      taskTitle: String(parsed.taskTitle || "Follow up on sent email"),
      dueDate: parsed.dueDate ? String(parsed.dueDate) : null,
      confidence: Number(parsed.confidence || 5),
      reason: String(parsed.reason || "Outgoing commitment"),
    };
  } catch (error) {
    safeLog("[poller] commitment analysis failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function handleThreads(gmail: gmail_v1.Gmail | null): Promise<{
  processed: number;
  createdTasks: number;
  createdThreads: number;
  updatedHistoryId: string | null;
  vipCount: number;
  vipOnly: boolean;
  confidence: number;
  askFirst: number;
}> {
  const [vipEntries, config, rules] = await Promise.all([getVipList(), getProcessingConfig(), listRules()]);
  const {
    threads,
    historyId: fetchedHistoryId,
    fallbackUsed,
    startHistoryId,
  } = await listRecentImportantThreads({
    vipEntries,
    includeKeywordMatches: !config.vipOnly,
    rules,
  });

  if (!threads.length) {
    if (startHistoryId && fallbackUsed) {
      await prisma.setting.deleteMany({ where: { key: HISTORY_SETTING_KEY } });
      safeLog("[poller] historyId may be stale, clearing for fresh start", {
        startHistoryId,
      });
    }
    logCycle({
      cycle: "run",
      processedThreads: 0,
      newThreads: 0,
      newTasks: 0,
      askFirst: 0,
      vipCount: vipEntries.length,
      vipOnly: config.vipOnly,
      confidence: config.confidence,
      updatedHistoryId: null,
    });
    return {
      processed: 0,
      createdTasks: 0,
      createdThreads: 0,
      updatedHistoryId: null,
      vipCount: vipEntries.length,
      vipOnly: config.vipOnly,
      confidence: config.confidence,
      askFirst: 0,
    };
  }

  let latestHistoryId: string | undefined = fetchedHistoryId ?? undefined;
  let createdTasks = 0;
  let createdThreads = 0;
  let askFirst = 0;
  const createdTaskSummaries: Array<{
    taskId: string;
    title: string;
    confidence: number;
    threadSubject: string | null;
  }> = [];

  for (const thread of threads) {
    const existingThread = await prisma.emailThread.findUnique({ where: { gmailId: thread.id } });

    const labels = thread.labelIds ?? [];
    const isSent = labels.includes("SENT");
    const isIncoming = labels.includes("INBOX");
    const direction: EmailDirection = (isSent && isIncoming)
      ? "BOTH"
      : isSent
        ? "OUTGOING"
        : "INCOMING";

    let isVip = thread.isVip;
    if (direction === "OUTGOING") {
      isVip = true;
    }

    const previousDirection = existingThread?.direction ?? null;
    const nextDirection: EmailDirection = direction === "BOTH"
      || previousDirection === "BOTH"
      || (previousDirection && previousDirection !== direction)
      ? "BOTH"
      : direction;

    const record = await prisma.emailThread.upsert({
      where: { gmailId: thread.id },
      create: {
        gmailId: thread.id,
        threadId: thread.threadId,
        subject: thread.subject,
        participants: JSON.stringify([thread.sender]),
        lastMessageAt: thread.receivedAt,
        isVip,
        direction: nextDirection,
      },
      update: {
        subject: thread.subject,
        participants: JSON.stringify([thread.sender]),
        lastMessageAt: thread.receivedAt,
        isVip,
        direction: nextDirection,
      },
    });

    if (!existingThread) {
      createdThreads += 1;
    }

    // Skip if already processed (has RADAR/Processed label)
    if (processedLabelId && gmail) {
      try {
        const msgDetails = await gmail.users.messages.get({
          userId: "me",
          id: thread.id,
          format: "metadata",
        });

        if (msgDetails.data.labelIds?.includes(processedLabelId)) {
          safeLog("[poller] Skipping processed thread", { gmailId: thread.id });
          if (thread.historyId) {
            if (!latestHistoryId || BigInt(thread.historyId) > BigInt(latestHistoryId)) {
              latestHistoryId = thread.historyId;
            }
          }
          continue;
        }
      } catch (error) {
        console.error("[poller] Failed to check labels:", error);
      }
    }

    if ((direction === EmailDirection.OUTGOING || direction === EmailDirection.BOTH) && anthropicClient) {
      const emailContent = thread.bodyText?.trim().length ? thread.bodyText : thread.snippet;
      if (emailContent?.trim().length) {
        console.log("[poller] analyzing outgoing email:", {
          subject: thread.subject,
          bodyPreview: emailContent.substring(0, 100),
          direction,
        });
        const commitment = await analyzeOutgoingCommitment(
          emailContent,
          thread.subject,
          anthropicClient,
        );

        if (commitment && commitment.needsTracking && commitment.confidence >= 5) {
          const normalizedTitle = commitment.taskTitle.trim() || "Follow up on sent email";
          const parsedDueDate = commitment.dueDate ? new Date(commitment.dueDate) : null;
          const dueDateValue = parsedDueDate && !Number.isNaN(parsedDueDate.getTime()) ? parsedDueDate : null;

          const existingCommitmentTask = await prisma.task.findFirst({
            where: {
              threadId: record.id,
              title: normalizedTitle,
            },
          });

          if (!existingCommitmentTask) {
            const createdTask = await prisma.task.create({
              data: {
                title: normalizedTitle,
                status: TaskStatus.TODO,
                priority: commitment.confidence >= 8 ? 1 : commitment.confidence >= 6 ? 2 : 3,
                dueAt: dueDateValue,
                thread: { connect: { id: record.id } },
              },
            });

            createdTasks += 1;

            await prisma.message.create({
              data: {
                role: "assistant",
                content: `You committed to: ${normalizedTitle}\n\nReason: ${commitment.reason}${dueDateValue ? `\n\nDue: ${dueDateValue.toLocaleDateString()}` : ""}`,
                type: MessageType.ACTION,
                confidence: commitment.confidence,
                taskId: createdTask.id,
                metadata: {
                  taskIds: [createdTask.id],
                },
              },
            });

            safeLog("[poller] detected outgoing commitment", {
              title: normalizedTitle,
              direction,
              thread: summarizeMessageForLog(thread),
            });

            // Apply RADAR/Processed label to prevent re-processing
            if (processedLabelId && gmail) {
              try {
                await gmail.users.messages.modify({
                  userId: "me",
                  id: thread.id,
                  requestBody: {
                    addLabelIds: [processedLabelId],
                  },
                });
                safeLog("[poller] Labeled as processed", { gmailId: thread.id });
              } catch (labelError) {
                console.error("[poller] Failed to label:", labelError);
              }
            }
          } else {
            console.log("[poller] commitment already tracked for thread:", {
              title: normalizedTitle,
              threadId: record.id,
            });
          }
        } else if (commitment) {
          console.log("[poller] commitment detected but not tracking:", {
            needsTracking: commitment.needsTracking,
            confidence: commitment.confidence,
            threshold: 5,
            reason: commitment.reason,
          });
        } else {
          console.log("[poller] no commitment detected or analysis failed");
        }
      }
    }

    const detectedTasks = extractTasksFromMessage(thread);

    for (const task of detectedTasks) {
      if (task.confidence < config.confidence) {
        askFirst += 1;
        safeLog("[poller] ask-first", {
          thread: summarizeMessageForLog(thread),
          confidence: task.confidence,
          threshold: config.confidence,
        });
        continue;
      }

      const existing = await prisma.task.findFirst({
        where: {
          threadId: record.id,
          title: task.title,
        },
      });

      if (existing) {
        continue;
      }

      const created = await prisma.task.create({
        data: {
          title: task.title,
          status: task.status,
          priority: Math.round(task.confidence * 10),
          thread: { connect: { id: record.id } },
        },
      });
      createdTasks += 1;
      // Apply RADAR/Processed label to prevent re-processing
      if (processedLabelId && gmail) {
        try {
          await gmail.users.messages.modify({
            userId: "me",
            id: thread.id,
            requestBody: {
              addLabelIds: [processedLabelId],
            },
          });
          safeLog("[poller] Labeled as processed", { gmailId: thread.id });
        } catch (labelError) {
          console.error("[poller] Failed to label:", labelError);
        }
      }
      createdTaskSummaries.push({
        taskId: created.id,
        title: created.title,
        confidence: task.confidence,
        threadSubject: record.subject,
      });
    }

    if (thread.historyId) {
      if (!latestHistoryId || BigInt(thread.historyId) > BigInt(latestHistoryId)) {
        latestHistoryId = thread.historyId;
      }
    }
  }

  if (latestHistoryId) {
    await updateHistoryId(latestHistoryId);
  }

  if (createdTaskSummaries.length) {
    const summaryText = createdTaskSummaries.length === 1
      ? `Heads up: ${createdTaskSummaries[0].title} needs attention${createdTaskSummaries[0].threadSubject ? ` ("${createdTaskSummaries[0].threadSubject}")` : ""}.`
      : `Heads up: ${createdTaskSummaries.length} new tasks need attention:\n${createdTaskSummaries
          .map((task, index) => `${index + 1}. ${task.title}${task.threadSubject ? ` — ${task.threadSubject}` : ""}`)
          .join("\n")}`;

    const averageConfidence = createdTaskSummaries.reduce((total, task) => total + task.confidence, 0) / createdTaskSummaries.length;
    const scaledConfidence = Math.min(10, Math.max(1, Math.round(averageConfidence * 10)));

    await prisma.message.create({
      data: {
        role: "assistant",
        content: summaryText,
        type: MessageType.ACTION,
        confidence: scaledConfidence,
        taskId: createdTaskSummaries.length === 1 ? createdTaskSummaries[0].taskId : null,
        metadata: {
          taskIds: createdTaskSummaries.map((task) => task.taskId),
        },
      },
    });
  }

  const summary: CycleLogDetails = {
    cycle: "run",
    processedThreads: threads.length,
    newThreads: createdThreads,
    newTasks: createdTasks,
    askFirst,
    vipCount: vipEntries.length,
    vipOnly: config.vipOnly,
    confidence: config.confidence,
    updatedHistoryId: latestHistoryId ?? null,
  };

  logCycle(summary);

  return {
    processed: threads.length,
    createdTasks,
    createdThreads,
    updatedHistoryId: latestHistoryId ?? null,
    vipCount: vipEntries.length,
    vipOnly: config.vipOnly,
    confidence: config.confidence,
    askFirst,
  };
}

export async function runPollerCycle(): Promise<{
  processed: number;
  createdTasks: number;
  createdThreads: number;
  updatedHistoryId: string | null;
  vipCount: number;
  vipOnly: boolean;
  confidence: number;
  askFirst: number;
}> {
  try {
    if (!gmailClient) {
      gmailClient = await getGmail();
    }

    if (!processedLabelId && gmailClient) {
      processedLabelId = await ensureProcessedLabel(gmailClient);
    }

    await moveIgnoredToBackBurner();
    return await handleThreads(gmailClient);
  } catch (error) {
    safeLog("[poller] cycle error", { message: (error as Error).message });
    const [vipEntries, config] = await Promise.all([
      getVipList(),
      getProcessingConfig().catch(() => ({ confidence: 0.7, vipOnly: true })),
    ]);

    return {
      processed: 0,
      createdTasks: 0,
      createdThreads: 0,
      updatedHistoryId: null,
      vipCount: vipEntries.length,
      vipOnly: config.vipOnly,
      confidence: config.confidence,
      askFirst: 0,
    };
  }
}

export async function startPoller() {
  await runPollerCycle();
  setInterval(() => {
    void runPollerCycle();
  }, POLL_INTERVAL_MS);
}

const argvPath = process.argv[1];
const moduleUrl = argvPath ? pathToFileURL(argvPath).href : undefined;

if (moduleUrl && import.meta.url === moduleUrl) {
  void startPoller();
}
