import Link from "next/link";
import prisma from "@/lib/db";
import { NudgePanel } from "@/components/nudge-panel";
import { TaskStatus } from "@prisma/client";

async function getThreads() {
  return prisma.emailThread.findMany({
    orderBy: { lastMessageAt: "desc" },
    take: 10,
  });
}

async function getActiveTasks() {
  return prisma.task.findMany({
    where: { status: { not: TaskStatus.DONE } },
    orderBy: { updatedAt: "desc" },
    take: 8,
  });
}

function formatRelative(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function parseParticipants(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch (error) {
    console.warn("[ui] Unable to parse participants payload", { message: (error as Error).message });
    return [];
  }
}

export default async function HomePage() {
  const [threads, tasks] = await Promise.all([getThreads(), getActiveTasks()]);

  return (
    <main className="grid min-h-screen grid-rows-[auto_1fr] gap-6 bg-slate-950 px-8 pb-12 pt-8 text-slate-100">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">RADAR Command Center</h1>
          <p className="text-sm text-slate-400">
            Proactive chat-first workspace. Nudges, tasks, and VIP threads orbit this conversation.
          </p>
        </div>
        <nav className="flex gap-3 text-sm">
          <Link
            href="/"
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-200 shadow hover:border-emerald-500"
          >
            Main chat
          </Link>
          <Link
            href="/tasks"
            className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 font-medium text-slate-200 shadow hover:border-emerald-500"
          >
            Tasks & Projects
          </Link>
        </nav>
      </header>

      <section className="grid grid-cols-[320px_1fr_320px] gap-6">
        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold">Live pings</h2>
            <p className="mt-1 text-xs text-slate-400">Newest VIP signals are pinned here; click to open subchat.</p>
            <ul className="mt-4 flex flex-col gap-3">
              {threads.length === 0 ? (
                <li className="text-sm text-slate-500">No VIP activity yet. Poller will surface new threads shortly.</li>
              ) : (
                threads.map((thread) => (
                  <li key={thread.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 transition hover:border-emerald-500">
                    <Link href={`/subchat/${thread.id}`} className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-slate-100">{thread.subject ?? "(no subject)"}</span>
                      <span className="text-xs text-slate-400">{thread.isVip ? "VIP" : "Thread"} · {formatRelative(thread.lastMessageAt)}</span>
                      <span className="text-xs text-slate-500">
                        Participants: {parseParticipants(thread.participants).join(", ") || "unknown"}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
          <NudgePanel />
        </aside>

        <div className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-slate-100">Main chat</h2>
          <div className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-4">
            {threads.slice(0, 3).map((thread) => (
              <article key={thread.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <header className="flex items-center justify-between text-sm text-slate-300">
                  <span className="font-semibold text-slate-100">{thread.subject ?? "(no subject)"}</span>
                  <span>{formatRelative(thread.lastMessageAt)}</span>
                </header>
                <p className="mt-2 text-sm text-slate-300">
                  RADAR: “Detected priority movement from {parseParticipants(thread.participants)
                    .slice(0, 1)
                    .join(", ") || "unknown"}. Open the subchat to review context.”
                </p>
                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/subchat/${thread.id}`}
                    className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    Jump to subchat →
                  </Link>
                </div>
              </article>
            ))}
            {threads.length === 0 ? (
              <p className="text-sm text-slate-400">
                RADAR is standing by. Once signals arrive, this feed fills with proactive nudges.
              </p>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold text-slate-100">Priority tasks</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {tasks.length === 0 ? (
                <li className="text-sm text-slate-500">No open tasks. RADAR will add them as signals land.</li>
              ) : (
                tasks.map((task) => (
                  <li key={task.id} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <Link href={`/subchat/${task.threadId ?? task.id}`} className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-slate-100">{task.title}</span>
                      <span className="text-xs text-slate-400">{task.status.replace("_", " → ")}</span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            <h2 className="text-lg font-semibold text-slate-100">Confidence controls</h2>
            <p className="mt-2">
              The slider lives here in MVP. Adjust it to tell RADAR when to ask first vs. act autonomously.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
