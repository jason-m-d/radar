import prisma from "@/lib/db";

async function resetHistory() {
  await prisma.setting.deleteMany({
    where: { key: "lastHistoryId" },
  });
  console.log("✓ Cleared stale historyId");
  await prisma.$disconnect();
}

resetHistory().catch((error) => {
  console.error("Failed to reset historyId", error);
  return prisma.$disconnect();
});
