import prisma from "@/lib/db";

async function cleanup() {
  console.log("[cleanup] Starting nuclear test cleanup...");

  const messages = await prisma.message.deleteMany({});
  console.log(`[cleanup] Deleted ${messages.count} messages`);

  const tasks = await prisma.task.deleteMany({});
  console.log(`[cleanup] Deleted ${tasks.count} tasks`);

  const projects = await prisma.project.deleteMany({});
  console.log(`[cleanup] Deleted ${projects.count} projects`);

  console.log("[cleanup] ✅ Cleanup complete. EmailThreads, VIP rules, and settings preserved.");
  console.log("[cleanup] Radar tab (signal threads) still intact.");
}

cleanup()
  .catch((error) => {
    console.error("[cleanup] Cleanup failed", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
