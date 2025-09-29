import Link from "next/link";
import prisma from "@/lib/db";
import { TaskStatus } from "@prisma/client";

const STATUS_LABEL: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.WAITING_THEM]: "Waiting on Them",
  [TaskStatus.WAITING_YOU]: "Waiting on You",
  [TaskStatus.DONE]: "Done",
};

function statusTone(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.DONE:
      return "text-emerald-400";
    case TaskStatus.WAITING_THEM:
      return "text-amber-300";
    case TaskStatus.WAITING_YOU:
      return "text-rose-300";
    default:
      return "text-sky-300";
  }
}

export default async function TasksPage() {
  const tasks = await prisma.task.findMany({
    orderBy: { updatedAt: "desc" },
    include: { thread: true, project: true },
  });

  const describeParticipants = (raw: string | null | undefined): string => {
    if (!raw) return "Unknown";
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const entries = parsed.filter((value) => typeof value === "string");
        return entries.length ? entries.join(", ") : "Unknown";
      }
      return "Unknown";
    } catch {
      return "Unknown";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 px-8 pb-12 pt-10 text-slate-100">
      <header className="mb-6 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Tasks & Projects</h1>
          <p className="text-sm text-slate-400">Everything RADAR is tracking. Click to open the focused subchat.</p>
        </div>
        <Link
          href="/"
          className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-200 shadow hover:border-emerald-500"
        >
          ← Back to main chat
        </Link>
      </header>

      <section className="grid gap-4">
        {tasks.length === 0 ? (
          <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            No tasks yet. Once the poller processes VIP threads, tasks will appear here with state and related subchats.
          </p>
        ) : (
          tasks.map((task) => (
            <article key={task.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">{task.title}</h2>
                  <p className="text-xs text-slate-400">
                    {task.project ? `Project: ${task.project.name}` : "Ungrouped"}
                  </p>
                  {task.thread ? (
                    <p className="text-xs text-slate-500">
                      Participants: {describeParticipants(task.thread.participants)}
                    </p>
                  ) : null}
                </div>
                <span className={`text-xs font-semibold ${statusTone(task.status)}`}>{STATUS_LABEL[task.status]}</span>
              </header>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <span>Priority: {task.priority}</span>
                {task.dueAt ? <span>Due {new Date(task.dueAt).toLocaleDateString()}</span> : <span>No due date</span>}
                <span>Last updated {new Date(task.updatedAt).toLocaleString()}</span>
              </div>
              <div className="mt-4 flex justify-end">
                <Link
                  href={`/subchat/${task.threadId ?? task.id}`}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  Open subchat →
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
