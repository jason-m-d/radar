import { NextResponse } from "next/server";
import OpenAI from "openai";
import prisma from "@/lib/db";
import { summarizeMessageForLog } from "@/server/gmail";
import { TaskStatus } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { prompt?: string } = {};
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const prompt = body.prompt?.trim() || "Summarize fresh signals and surface next actions.";
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ message: "OpenAI API key not configured." }, { status: 500 });
  }

  const [threads, tasks] = await Promise.all([
    prisma.emailThread.findMany({ orderBy: { lastMessageAt: "desc" }, take: 5 }),
    prisma.task.findMany({ where: { status: { not: TaskStatus.DONE } }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  const context = {
    prompt,
    threads: threads.map(summarizeMessageForLog),
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt?.toISOString() ?? null,
    })),
  };

  const client = new OpenAI({ apiKey });

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are RADAR, a proactive executive assistant. Consider VIP email threads, pending tasks, and environment settings to produce short nudges.",
        },
        {
          role: "user",
          content: JSON.stringify(context),
        },
      ],
    });

    const message = response.output_text ?? "No suggestions available yet.";
    return NextResponse.json({ message });
  } catch (error) {
    console.error("OpenAI call failed", { message: (error as Error).message });
    return NextResponse.json({ message: "Unable to generate nudges right now." }, { status: 502 });
  }
}
