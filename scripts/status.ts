import prisma from "@/lib/db";
import { getVipList } from "@/server/settings";

async function main() {
  const [threads, tasks, history, vips] = await Promise.all([
    prisma.emailThread.count(),
    prisma.task.count(),
    prisma.setting.findUnique({ where: { key: "lastHistoryId" } }),
    getVipList(),
  ]);

  console.log(
    JSON.stringify({
      threads,
      tasks,
      lastHistoryId: history?.value ?? null,
      vipCount: vips.length,
    }),
  );
}

main()
  .catch((error) => {
    console.error("status failed", { message: (error as Error).message });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
