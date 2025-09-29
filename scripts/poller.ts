import { pathToFileURL } from "node:url";
import prisma from "@/lib/db";
import { listRecentImportantThreads, extractTasksFromMessage } from "@/server/gmail";
import { getVipList } from "@/server/settings";

const POLL_INTERVAL_MS = 3 * 60 * 1000;
const HISTORY_SETTING_KEY = "lastHistoryId";

function logCycle(details: Record<string, unknown>) {
  console.info(
    `[poller] cycle=${details.cycle ?? "run"} processed=${details.processedThreads ?? 0} newTasks=${details.newTasks ?? 0} vipCount=${details.vipCount ?? 0} historyUpdated=${details.updatedHistoryId ? "yes" : "no"}`,
  );
}

async function updateHistoryId(historyId: string) {
  await prisma.setting.upsert({
    where: { key: HISTORY_SETTING_KEY },
    update: { value: historyId },
    create: { key: HISTORY_SETTING_KEY, value: historyId },
  });
}

async function handleThreads(): Promise<{ processed: number; createdTasks: number; updatedHistoryId: string | null; vipCount: number }> {
  const vipEntries = await getVipList();
  const threads = await listRecentImportantThreads();

  if (!threads.length) {
    logCycle({ cycle: "run", processedThreads: 0, newTasks: 0, vipCount: vipEntries.length, updatedHistoryId: null });
    return { processed: 0, createdTasks: 0, updatedHistoryId: null, vipCount: vipEntries.length };
  }

  let latestHistoryId: string | undefined;
  let createdTasks = 0;

  for (const thread of threads) {
    const record = await prisma.emailThread.upsert({
      where: { gmailId: thread.id },
      create: {
        gmailId: thread.id,
        threadId: thread.threadId,
        subject: thread.subject,
        participants: JSON.stringify([thread.sender]),
        lastMessageAt: thread.receivedAt,
        isVip: true,
      },
      update: {
        subject: thread.subject,
        participants: JSON.stringify([thread.sender]),
        lastMessageAt: thread.receivedAt,
        isVip: true,
      },
    });

    const detectedTasks = extractTasksFromMessage(thread);

    for (const task of detectedTasks) {
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

  const summary = {
    cycle: "run",
    processedThreads: threads.length,
    newTasks: createdTasks,
    vipCount: vipEntries.length,
    updatedHistoryId: latestHistoryId ?? null,
  };

  logCycle(summary);

  return {
    processed: threads.length,
    createdTasks,
    updatedHistoryId: latestHistoryId ?? null,
    vipCount: vipEntries.length,
  };
}

export async function runPollerCycle(): Promise<{
  processed: number;
  createdTasks: number;
  updatedHistoryId: string | null;
  vipCount: number;
}> {
  try {
    return await handleThreads();
  } catch (error) {
    console.error("[poller] cycle error", { message: (error as Error).message });
    return { processed: 0, createdTasks: 0, updatedHistoryId: null, vipCount: (await getVipList()).length };
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
