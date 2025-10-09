import { NextResponse } from "next/server";
import { MessageType, TaskStatus } from "@prisma/client";
import prisma from "@/lib/db";

type TaskResponse = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: number;
  dueAt: string | null;
  updatedAt: string;
  backBurneredAt?: string | null;
  ignoredAt?: string | null;
  thread?: {
    id: string;
    subject: string | null;
    participants: string;
  } | null;
  project?: {
    id: string;
    name: string;
  } | null;
};

export async function GET() {
  try {
    const [openTasks, completedTasks] = await Promise.all([
      prisma.task.findMany({
        where: {
          status: { not: TaskStatus.DONE },
          messages: {
            some: {
              type: MessageType.ACTION,
              isInteracted: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          thread: true,
          project: true,
        },
      }),
      prisma.task.findMany({
        where: {
          status: TaskStatus.DONE,
          messages: {
            some: {
              type: MessageType.ACTION,
              isInteracted: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        include: {
          thread: true,
          project: true,
        },
        take: 50,
      }),
    ]);

    const allTasks = [...openTasks, ...completedTasks];

    const payload: TaskResponse[] = allTasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt ? task.dueAt.toISOString() : null,
      updatedAt: task.updatedAt.toISOString(),
      thread: task.thread
        ? {
            id: task.thread.id,
            subject: task.thread.subject,
            participants: task.thread.participants,
          }
        : null,
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
          }
        : null,
      backBurneredAt: task.backBurneredAt ? task.backBurneredAt.toISOString() : null,
      ignoredAt: task.ignoredAt ? task.ignoredAt.toISOString() : null,
    }));

    return NextResponse.json({ tasks: payload });
  } catch (error) {
    console.error("[api/tasks]", error);
    return NextResponse.json({ error: "Failed to load tasks" }, { status: 500 });
  }
}
