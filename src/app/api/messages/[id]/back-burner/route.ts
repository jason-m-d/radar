import { NextResponse } from "next/server";

import prisma from "@/lib/db";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteParams) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: "Message id is required" }, { status: 400 });
  }

  try {
    const message = await prisma.message.findUnique({
      where: { id },
      select: {
        taskId: true,
        metadata: true,
      }
    });

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const taskIds = new Set<string>();
    if (message.taskId) {
      taskIds.add(message.taskId);
    }

    if (message.metadata && typeof message.metadata === "object" && "taskIds" in message.metadata) {
      const maybeTaskIds = (message.metadata as { taskIds?: unknown }).taskIds;
      if (Array.isArray(maybeTaskIds)) {
        for (const value of maybeTaskIds) {
          if (typeof value === "string") {
            taskIds.add(value);
          }
        }
      }
    }

    const ids = Array.from(taskIds);

    await prisma.$transaction([
      ...(ids.length
        ? [
            prisma.task.updateMany({
              where: { id: { in: ids } },
              data: { backBurneredAt: new Date() }
            })
          ]
        : []),
      prisma.message.update({
        where: { id },
        data: { isRead: true }
      })
    ]);

    return NextResponse.json({ success: true, taskIds: ids });
  } catch (error) {
    console.error("[api/messages/:id/back-burner]", error);
    return NextResponse.json({ error: "Failed to move to back burner" }, { status: 500 });
  }
}
