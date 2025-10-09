import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

/**
 * NOTE: Currently unused - reserved for future dock summary feature.
 * This endpoint generates natural language summaries of multiple tasks
 * with boundary markers for dynamic styling.
 */

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type SummaryTask = {
  id: string;
  title: string;
};

export async function POST(req: NextRequest) {
  try {
    const { tasks } = await req.json() as { tasks?: SummaryTask[] };

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "Tasks array required" }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
    }

    const prompt = `Given these tasks, create a natural summary sentence. Wrap each task reference in {curly braces}.

Tasks:
${tasks.map((task) => `ID: ${task.id}, Title: ${task.title}`).join("\n")}

Return ONLY a JSON object:
{
  "summary": "Natural sentence with {task references} in braces",
  "taskMap": {
${tasks.map((task, index) => `    "${task.id}": "text segment for task ${index + 1}${index === tasks.length - 1 ? "" : ","}`).join("\n")}
  }
}

The taskMap keys must be the exact task IDs provided above.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    const cleaned = textContent.text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleaned) as { summary: string; taskMap: Record<string, string> };

    return NextResponse.json({
      summary: parsed.summary,
      taskMap: parsed.taskMap,
    });
  } catch (error) {
    console.error("[api/carousel/summary] Error:", error);
    return NextResponse.json({ error: "Summary generation failed" }, { status: 500 });
  }
}
