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

    await prisma.message.update({
      where: { id },
      data: {
        seenAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/messages/seen] Error:", error);
    return NextResponse.json({ error: "Failed to mark as seen" }, { status: 500 });
  }
}
