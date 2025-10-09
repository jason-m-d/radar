import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";

import prisma from "@/lib/db";

function formatDueDate(dueAt: Date | null): string {
  if (!dueAt) {
    return "No due date";
  }

  const now = new Date();
  const dueDate = new Date(dueAt);
  const dayInMs = 24 * 60 * 60 * 1000;
  const diffMs = dueDate.getTime() - now.getTime();

  if (dueDate.toDateString() === now.toDateString() || (diffMs > 0 && diffMs <= dayInMs)) {
    return "Due today";
  }

  if (diffMs > dayInMs && diffMs <= dayInMs * 2) {
    return "Due tomorrow";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric"
  }).format(dueDate);
}

function mapStatus(status: TaskStatus): "action-needed" | "waiting" | "complete" {
  switch (status) {
    case TaskStatus.TODO:
      return "action-needed";
    case TaskStatus.WAITING_THEM:
    case TaskStatus.WAITING_YOU:
      return "waiting";
    case TaskStatus.DONE:
      return "complete";
    default:
      return "action-needed";
  }
}

function getFirstParticipantName(participants: string | null): string | undefined {
  if (!participants) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(participants);
    if (Array.isArray(parsed)) {
      for (const entry of parsed) {
        if (typeof entry === "string") {
          const match = entry.match(/"?([^"<]+)"?\s*<[^>]+>/);
          if (match) {
            return match[1].trim();
          }
        }
      }
    }
  } catch {
    // fall through and attempt plain extraction
  }

  const match = participants.match(/"?([^"<]+)"?\s*<[^>]+>/);
  return match ? match[1].trim() : undefined;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { ids?: unknown };
    const ids = Array.isArray(body.ids) ? body.ids.filter((id): id is string => typeof id === "string") : [];

    if (!ids.length) {
      return NextResponse.json({ tasks: [] });
    }

    const tasks = await prisma.task.findMany({
      where: { id: { in: ids } },
      include: {
        thread: { select: { participants: true, subject: true } }
      }
    });

    const payload = tasks.map((task) => {
      const status = mapStatus(task.status);
      const waitingOn = status === "waiting"
        ? getFirstParticipantName(task.thread?.participants ?? null)
        : undefined;

      return {
        id: task.id,
        title: task.title,
        status,
        dueDate: formatDueDate(task.dueAt ?? null),
        priority: Number.isFinite(task.priority) ? task.priority : 0,
        waitingOn,
        subject: task.thread?.subject ?? undefined,
        backBurneredAt: task.backBurneredAt ? task.backBurneredAt.toISOString() : null,
        gmailThreadId: task.thread?.threadId ?? null,
      };
    });

    return NextResponse.json({ tasks: payload });
  } catch (error) {
    console.error("[api/tasks/details]", error);
    return NextResponse.json({ error: "Failed to load task details" }, { status: 500 });
  }
}
