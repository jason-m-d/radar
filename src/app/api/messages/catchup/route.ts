import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { MessageType } from "@prisma/client";

import prisma from "@/lib/db";

const anthropicKey = process.env.ANTHROPIC_API_KEY;
const anthropic = anthropicKey ? new Anthropic({ apiKey: anthropicKey }) : null;

type RequestBody = {
  messageIds?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RequestBody;
    const requestedIds = Array.isArray(body.messageIds)
      ? body.messageIds.filter((value): value is string => typeof value === "string")
      : [];

    const actionMessages = await prisma.message.findMany({
      where: {
        type: MessageType.ACTION,
        isRead: false,
        ...(requestedIds.length ? { id: { in: requestedIds } } : {}),
      },
    });

    if (!actionMessages.length) {
      return NextResponse.json({ message: null });
    }

    const taskIds = new Set<string>();
    const projectIds = new Set<string>();

    for (const message of actionMessages) {
      if (message.taskId) {
        taskIds.add(message.taskId);
      }
      const metadata = message.metadata && typeof message.metadata === "object" ? message.metadata as { taskIds?: unknown; projectIds?: unknown } : null;
      if (metadata?.taskIds && Array.isArray(metadata.taskIds)) {
        for (const id of metadata.taskIds) {
          if (typeof id === "string") {
            taskIds.add(id);
          }
        }
      }
      if (metadata?.projectIds && Array.isArray(metadata.projectIds)) {
        for (const id of metadata.projectIds) {
          if (typeof id === "string") {
            projectIds.add(id);
          }
        }
      }
    }

    const taskList = await prisma.task.findMany({
      where: { id: { in: Array.from(taskIds) } },
      include: {
        thread: { select: { subject: true } },
        project: { select: { name: true } }
      }
    });

    const fallbackSummary = () => {
      if (!taskList.length) {
        return `You have ${actionMessages.length} unread action message${actionMessages.length === 1 ? "" : "s"}.`;
      }

      const bulletList = taskList
        .map((task) => `• ${task.title}${task.thread?.subject ? ` — ${task.thread.subject}` : ""}`)
        .join("\n");

      return `While you were away I spotted ${taskList.length} task${taskList.length === 1 ? "" : "s"} that need attention:\n${bulletList}`;
    };

    let content = fallbackSummary();

    if (anthropic && taskList.length) {
      try {
        const contextLines = taskList
          .map((task, index) => `${index + 1}. ${task.title}${task.thread?.subject ? ` (subject: ${task.thread.subject})` : ""}`)
          .join("\n");

        const prompt = `You are RADAR, generating a concise catch-up summary after the user was offline. Summarize these tasks:

${contextLines}

Keep it under 3 sentences, highlight urgency, and end with an encouraging call-to-action.`;

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-5-20250929",
          max_tokens: 300,
          system: "You are RADAR, Jason's proactive executive assistant.",
          messages: [{ role: "user", content: prompt }],
        });

        const reply = response.content[0]?.type === "text" ? response.content[0].text.trim() : null;
        if (reply) {
          content = reply;
        }
      } catch (error) {
        console.error("[api/messages/catchup] anthropic fallback", error);
        content = fallbackSummary();
      }
    }

    const metadata = {
      taskIds: Array.from(taskIds),
      projectIds: Array.from(projectIds),
    };

    const created = await prisma.message.create({
      data: {
        role: "assistant",
        content,
        type: MessageType.CATCHUP,
        metadata,
      },
    });

    await prisma.message.updateMany({
      where: { id: { in: actionMessages.map((msg) => msg.id) } },
      data: { isRead: true },
    });

    return NextResponse.json({ message: created });
  } catch (error) {
    console.error("[api/messages/catchup]", error);
    return NextResponse.json({ error: "Failed to generate catch-up message" }, { status: 500 });
  }
}
