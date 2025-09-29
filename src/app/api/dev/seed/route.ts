/* DEV-ONLY. Do not enable in production. */
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { TaskStatus } from "@prisma/client";

const DEV_THREAD_GMAIL_ID = "dev-gmail-1";
const DEV_THREAD_ID = "dev-thread-1";
const DEV_TASK_ID = "dev-task-1";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const thread = await prisma.emailThread.upsert({
    where: { gmailId: DEV_THREAD_GMAIL_ID },
    create: {
      id: DEV_THREAD_ID,
      gmailId: DEV_THREAD_GMAIL_ID,
      threadId: DEV_THREAD_ID,
      subject: "Test: please send report",
      participants: JSON.stringify(["vip@example.com"]),
      lastMessageAt: now,
      isVip: true,
    },
    update: {
      subject: "Test: please send report",
      participants: JSON.stringify(["vip@example.com"]),
      lastMessageAt: now,
      isVip: true,
    },
  });

  const task = await prisma.task.upsert({
    where: { id: DEV_TASK_ID },
    create: {
      id: DEV_TASK_ID,
      title: "Follow up on test report",
      status: TaskStatus.TODO,
      priority: 1,
      thread: { connect: { id: thread.id } },
    },
    update: {
      status: TaskStatus.TODO,
      priority: 1,
      thread: { connect: { id: thread.id } },
    },
  });

  return NextResponse.json({ ok: true, threadId: thread.id, taskId: task.id });
}
