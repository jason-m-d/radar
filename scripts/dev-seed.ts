import { POST } from "@/app/api/dev/seed/route";

async function main() {
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = "development";
  }

  const response = await POST(new Request("http://localhost:3000/api/dev/seed", { method: "POST" }));
  console.log(await response.json());
}

main().catch((error) => {
  console.error("dev-seed failed", error);
  process.exitCode = 1;
});
