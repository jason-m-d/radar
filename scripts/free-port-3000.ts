import { execSync } from "node:child_process";
import readline from "node:readline";

function run(command: string): string {
  try {
    return execSync(command, { stdio: "pipe" }).toString("utf8").trim();
  } catch (error) {
    if ((error as { status?: number }).status === 1) {
      return "";
    }
    throw error;
  }
}

async function prompt(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(/[yY]/.test(answer.trim()));
    });
  });
}

function main() {
  const output = run("lsof -i :3000");
  if (!output) {
    console.log("Port 3000 is already free.");
    return;
  }

  console.log("Current process using port 3000:\n" + output);

  const lines = output.split("\n").slice(1); // skip header
  const first = lines.find((line) => line.trim().length > 0);
  if (!first) {
    console.log("No actionable process found.");
    return;
  }

  const parts = first.trim().split(/\s+/);
  const pid = parts[1];

  if (!pid) {
    console.error("Unable to parse PID for process on port 3000.");
    process.exitCode = 1;
    return;
  }

  prompt(`Kill process ${pid} on port 3000?`).then((approved) => {
    if (!approved) {
      console.log("Aborted; port still in use.");
      return;
    }

    try {
      execSync(`kill -9 ${pid}`);
      console.log(`Process ${pid} terminated.`);
    } catch (error) {
      console.error("Failed to kill process", error);
      process.exitCode = 1;
      return;
    }

    const check = run("lsof -i :3000");
    if (!check) {
      console.log("Port 3000 is now free.");
    } else {
      console.warn("Port 3000 still occupied:\n" + check);
    }
  });
}

main();
