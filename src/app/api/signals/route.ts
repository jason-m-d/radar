import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function parseParticipant(participants: string | null | undefined) {
  if (!participants) {
    return { sender: "Unknown", senderEmail: "unknown" };
  }
  try {
    const parsed = JSON.parse(participants);
    if (Array.isArray(parsed) && parsed.length) {
      const raw = String(parsed[0]);
      return extractSender(raw);
    }
    return { sender: "Unknown", senderEmail: "unknown" };
  } catch {
    return extractSender(participants);
  }
}

function extractSender(raw: string) {
  const match = raw.match(/"?([^"<]+)"?\s*<([^>]+)>/);
  if (match) {
    return { sender: match[1].trim(), senderEmail: match[2].trim().toLowerCase() };
  }
  const emailMatch = raw.match(/<([^>]+)>/);
  if (emailMatch) {
    return { sender: emailMatch[1].trim().toLowerCase(), senderEmail: emailMatch[1].trim().toLowerCase() };
  }
  const value = raw.trim();
  return { sender: value, senderEmail: value.toLowerCase() };
}

export async function GET() {
  try {
    const threads = await prisma.emailThread.findMany({
      where: { isVip: true },
      orderBy: { lastMessageAt: "desc" },
      take: 50,
      include: { tasks: true },
    });

    const signals = threads.map((thread) => {
      const { sender, senderEmail } = parseParticipant(thread.participants as string | null | undefined);
      return {
        id: thread.id,
        subject: thread.subject ?? "(no subject)",
        sender,
        senderEmail,
        receivedAt: thread.lastMessageAt.toISOString(),
        hasTask: thread.tasks.length > 0,
        taskCount: thread.tasks.length,
      };
    });

    return NextResponse.json({ signals });
  } catch (error) {
    console.error("[api/signals]", error);
    return NextResponse.json({ error: "Failed to load signals" }, { status: 500 });
  }
}
