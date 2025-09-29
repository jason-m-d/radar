import prisma from "@/lib/db";

async function main() {
  const tasks = await prisma.task.findMany({
    select: { id: true, title: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  console.log(
    JSON.stringify(
      tasks.map((task) => ({ id: task.id, title: task.title })),
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("list-tasks failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
