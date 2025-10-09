import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawThreadId = searchParams.get("threadId");
    const threadId = rawThreadId && rawThreadId !== "null" && rawThreadId !== "undefined" ? rawThreadId : null;

    const messages = await prisma.message.findMany({
      where: threadId ? { threadId } : { threadId: null },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    const payload = messages.map((message) => {
      const metadata = message.metadata && typeof message.metadata === "object"
        ? message.metadata
        : null;

      return {
        id: message.id,
        message: message.content,
        content: message.content,
        isUser: message.role === "user",
        timestamp: formatDate(message.createdAt),
        type: message.type,
        confidence: message.confidence,
        taskId: message.taskId,
        projectId: message.projectId,
        metadata,
        isRead: message.isRead,
        isInteracted: message.isInteracted,
        seenAt: message.seenAt ? message.seenAt.toISOString() : null,
        ignoredAt: message.ignoredAt ? message.ignoredAt.toISOString() : null,
        snoozedUntil: message.snoozedUntil ? message.snoozedUntil.toISOString() : null,
      };
    });

    return NextResponse.json({ messages: payload });
  } catch (error) {
    console.error("[api/messages]", error);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}
