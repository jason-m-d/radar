import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(date);
}

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: { tasks: true },
    });

    const payload = projects.map((project) => ({
      id: project.id,
      name: project.name,
      taskCount: project.tasks.length,
      lastActivity: formatDate(project.updatedAt),
    }));

    return NextResponse.json({ projects: payload });
  } catch (error) {
    console.error("[api/projects]", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }
}
