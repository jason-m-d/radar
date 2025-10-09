import { NextRequest, NextResponse } from "next/server";

import prisma from "@/lib/db";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_req: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Message id is required" }, { status: 400 });
    }

    const now = new Date();

    console.log("Ignore API called for message:", id);

    console.log("About to update message...");
    await prisma.message.update({
      where: { id },
      data: {
        ignoredAt: now,
        seenAt: now,
        isInteracted: true,
      },
    });
    console.log("Message updated successfully");

    console.log("Message updated with ignoredAt:", id);

    console.log("About to fetch message with task...");
    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        task: {
          select: { id: true },
        },
      },
    });
    console.log("Message fetched:", message?.id, "taskId:", message?.taskId);

    if (!message) {
      console.error("[ignore] Message not found after update", id);
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    let updatedTaskId: string | null = null;

    if (message.taskId) {
      console.log("Attempting to update task:", message.taskId);
      console.log("About to update task:", message.taskId);
      await prisma.task.update({
        where: { id: message.taskId },
        data: { ignoredAt: now },
      });
      console.log("Task updated successfully");
      console.log("Task updated with ignoredAt:", message.taskId);
      updatedTaskId = message.taskId;
    }

    return NextResponse.json({ success: true, messageId: id, taskId: updatedTaskId });
  } catch (error) {
    console.error("[api/messages/ignore] Full error details:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    if (error && typeof error === "object") {
      const err = error as { name?: string; message?: string; stack?: string };
      console.error("[api/messages/ignore] Error name:", err.name);
      console.error("[api/messages/ignore] Error message:", err.message);
      console.error("[api/messages/ignore] Error stack:", err.stack);
    }
    return NextResponse.json({ error: "Failed to mark as ignored" }, { status: 500 });
  }
}
