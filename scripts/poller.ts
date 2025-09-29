import { pathToFileURL } from "node:url";
import prisma from "@/lib/db";
import { listRecentImportantThreads, extractTasksFromMessage, summarizeMessageForLog } from "@/server/gmail";
import { getVipList, getProcessingConfig } from "@/server/settings";

const POLL_INTERVAL_MS = 3 * 60 * 1000;
const HISTORY_SETTING_KEY = "lastHistoryId";

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
  const parts = [
    `cycle=${details.cycle ?? "run"}`,
    `processed=${details.processedThreads ?? 0}`,
    `newThreads=${details.newThreads ?? 0}`,
    `newTasks=${details.newTasks ?? 0}`,
    `askFirst=${details.askFirst ?? 0}`,
    `vipOnly=${details.vipOnly === undefined ? "n/a" : details.vipOnly ? "true" : "false"}`,
    `confidence=${typeof details.confidence === "number" ? details.confidence.toFixed(2) : "n/a"}`,
    `vipCount=${details.vipCount ?? 0}`,
    `historyUpdated=${details.updatedHistoryId ? "yes" : "no"}`,
  ];

  console.info(`[poller] ${parts.join(" ")}`);
}

async function updateHistoryId(historyId: string) {
  await prisma.setting.upsert({
    where: { key: HISTORY_SETTING_KEY },
    update: { value: historyId },
    create: { key: HISTORY_SETTING_KEY, value: historyId },
  });
}

async function handleThreads(): Promise<{
  processed: number;
  createdTasks: number;
  createdThreads: number;
  updatedHistoryId: string | null;
  vipCount: number;
  vipOnly: boolean;
  confidence: number;
  askFirst: number;
}> {
  const [vipEntries, config] = await Promise.all([getVipList(), getProcessingConfig()]);
  const threads = await listRecentImportantThreads({
    vipEntries,
    includeKeywordMatches: !config.vipOnly,
  });

  if (!threads.length) {
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

  let latestHistoryId: string | undefined;
  let createdTasks = 0;
  let createdThreads = 0;
  let askFirst = 0;

  for (const thread of threads) {
    const existingThread = await prisma.emailThread.findUnique({ where: { gmailId: thread.id } });

    const record = await prisma.emailThread.upsert({
      where: { gmailId: thread.id },
      create: {
        gmailId: thread.id,
        threadId: thread.threadId,
        subject: thread.subject,
        participants: JSON.stringify([thread.sender]),
        lastMessageAt: thread.receivedAt,
        isVip: thread.isVip,
      },
      update: {
        subject: thread.subject,
        participants: JSON.stringify([thread.sender]),
        lastMessageAt: thread.receivedAt,
        isVip: thread.isVip,
      },
    });

    if (!existingThread) {
      createdThreads += 1;
    }

    const detectedTasks = extractTasksFromMessage(thread);

    for (const task of detectedTasks) {
      if (task.confidence < config.confidence) {
        askFirst += 1;
        console.info("[poller] ask-first", {
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

      await prisma.task.create({
        data: {
          title: task.title,
          status: task.status,
          priority: Math.round(task.confidence * 10),
          thread: { connect: { id: record.id } },
        },
      });
      createdTasks += 1;
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
    return await handleThreads();
  } catch (error) {
    console.error("[poller] cycle error", { message: (error as Error).message });
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
