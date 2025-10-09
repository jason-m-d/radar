import fs from "fs";
import path from "path";
import prisma from "@/lib/db";

async function backup() {
  console.log("[backup] Creating backup of test data...");

  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `backup-${timestamp}.json`);

  const messages = await prisma.message.findMany({
    include: { task: true, project: true },
  });
  const tasks = await prisma.task.findMany({
    include: { thread: true, project: true },
  });
  const projects = await prisma.project.findMany({
    include: { threads: true, tasks: true },
  });

  const backupPayload = {
    timestamp,
    counts: {
      messages: messages.length,
      tasks: tasks.length,
      projects: projects.length,
    },
    data: {
      messages,
      tasks,
      projects,
    },
  };

  fs.writeFileSync(backupPath, JSON.stringify(backupPayload, null, 2));

  console.log(`[backup] ✅ Backup saved to: ${backupPath}`);
  console.log(
    `[backup] Backed up: ${messages.length} messages, ${tasks.length} tasks, ${projects.length} projects`,
  );
}

backup()
  .catch((error) => {
    console.error("[backup] Backup failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
