import prisma from "@/lib/db";

async function main() {
  await prisma.setting.upsert({
    where: { key: "vipList" },
    update: { value: [] },
    create: { key: "vipList", value: [] },
  });

  await prisma.setting.upsert({
    where: { key: "confidence" },
    update: { value: 0.7 },
    create: { key: "confidence", value: 0.7 },
  });

  await prisma.setting.upsert({
    where: { key: "lastHistoryId" },
    update: { value: null },
    create: { key: "lastHistoryId", value: null },
  });

  console.info("Seed completed: settings initialized.");
}

main()
  .catch((error) => {
    console.error("Seed failed", { message: (error as Error).message });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
