import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { TaskStatus } from "@prisma/client";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { message, threadId } = await req.json();

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    await prisma.message.create({
      data: { role: "user", content: message, threadId: threadId || null },
    });

    const [signalThreads, activeTasks, projects, messageHistory] = await Promise.all([
      prisma.emailThread.findMany({
        where: { isVip: true },
        orderBy: { lastMessageAt: "desc" },
        take: 10,
        include: { tasks: true },
      }),
      prisma.task.findMany({
        where: { status: { not: TaskStatus.DONE } },
        orderBy: { updatedAt: "desc" },
        take: 20,
        include: { thread: true, project: true },
      }),
      prisma.project.findMany({
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: { tasks: true },
      }),
      prisma.message.findMany({
        where: { threadId: threadId || null },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const contextSummary = `
CURRENT CONTEXT (as of ${new Date().toLocaleString()}):

SIGNAL THREADS (${signalThreads.length}):
${signalThreads
        .map(
          (t) =>
            `- ${t.subject || "(no subject)"} | Last: ${t.lastMessageAt.toLocaleString()} | Tasks: ${t.tasks.length}`,
        )
        .join("\n") || "None"}

ACTIVE TASKS (${activeTasks.length}):
${activeTasks
        .map(
          (t) =>
            `- [${t.status}] ${t.title}${t.project ? ` (Project: ${t.project.name})` : ""}${t.thread ? ` | From: ${t.thread.subject}` : ""}`,
        )
        .join("\n") || "None"}

PROJECTS (${projects.length}):
${projects
        .map((p) => `- ${p.name} (${p.state}) | ${p.tasks.length} tasks`)
        .join("\n") || "None"}
`.trim();

    const systemPrompt = `You are RADAR, Jason's proactive executive assistant. You have LIVE ACCESS to his signal threads (emails that passed VIP/suppression filters), tasks, and projects. This is REAL DATA pulled from his database right now.

${contextSummary}

IMPORTANT:
- This context is LIVE and CURRENT - treat it as real-time data
- Signals = email threads that passed your filter rules and need attention
- When Jason asks "what's new" or "what needs attention", proactively summarize urgent signals and pending tasks
- Be direct and action-oriented - no disclaimers about "not having access"
- Flag urgent items with clear priority
- Suggest specific next actions

You monitor signals across his restaurant businesses (DRG: Wingstop, HHG: Mr. Pickle's). Be concise, confident, and helpful.`;

    const messages = [
      ...messageHistory.reverse().map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0]?.type === "text" ? response.content[0].text : "No response generated.";

    await prisma.message.create({
      data: { role: "assistant", content: reply, threadId: threadId || null },
    });

    return NextResponse.json({ reply });
  } catch (error) {
    console.error("[api/chat] Error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
