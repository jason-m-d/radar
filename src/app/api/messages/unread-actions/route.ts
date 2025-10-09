import { NextResponse } from "next/server";

import prisma from "@/lib/db";

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      where: { type: "ACTION", isRead: false },
      orderBy: { createdAt: "asc" },
      include: {
        task: {
          include: {
            thread: true,
            project: true,
          }
        },
        project: true,
      }
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[api/messages/unread-actions]", error);
    return NextResponse.json({ error: "Failed to load unread action messages" }, { status: 500 });
  }
}
