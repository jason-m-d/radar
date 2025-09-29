import Link from "next/link";
import prisma from "@/lib/db";

async function getContext(id: string) {
  const thread = await prisma.emailThread.findUnique({ where: { id } });
  if (thread) {
    return { type: "thread" as const, thread };
  }

  const task = await prisma.task.findUnique({ where: { id }, include: { thread: true, project: true } });
  if (task) {
    return { type: "task" as const, task };
  }

  return null;
}

function parseParticipants(raw: string | null | undefined): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value) => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export default async function SubchatPage({ params }: { params: { id: string } }) {
  const context = await getContext(params.id);

  if (!context) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 p-6 text-slate-100">
        <p className="text-sm text-slate-400">No subchat context found. It may have been archived.</p>
        <Link href="/" className="mt-4 rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-200">
          ← Return to main chat
        </Link>
      </main>
    );
  }

  if (context.type === "thread") {
    const { thread } = context;
    return (
      <main className="min-h-screen bg-slate-950 px-8 pb-12 pt-10 text-slate-100">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Thread subchat</h1>
            <p className="text-sm text-slate-400">{thread.subject ?? "(no subject)"}</p>
          </div>
          <Link href="/" className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-200">
            ← Back to main chat
          </Link>
        </header>
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <article className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <h2 className="text-lg font-semibold text-slate-100">RADAR summary</h2>
            <p className="mt-2 text-sm text-slate-300">
              RADAR interpolates the latest emails and produces a summary here once the poller pulls in message content.
            </p>
          </article>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Participants</h3>
            <p className="mt-1 text-sm text-slate-300">{parseParticipants(thread.participants).join(", ") || "Unknown"}</p>
          </div>
        </section>
      </main>
    );
  }

  const { task } = context;
  return (
    <main className="min-h-screen bg-slate-950 px-8 pb-12 pt-10 text-slate-100">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Task subchat</h1>
          <p className="text-sm text-slate-400">{task.title}</p>
        </div>
        <Link href="/" className="rounded-md border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-200">
          ← Back to main chat
        </Link>
      </header>
      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <article className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <h2 className="text-lg font-semibold text-slate-100">RADAR next steps</h2>
          <p className="mt-2 text-sm text-slate-300">
            Autonomy level and confidence settings define whether RADAR drafts responses or awaits confirmation here.
          </p>
        </article>
        {task.thread ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <h3 className="text-sm font-semibold text-slate-100">Related thread</h3>
            <p className="mt-1 text-sm text-slate-300">{task.thread.subject ?? "(no subject)"}</p>
          </div>
        ) : null}
        {task.project ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <h3 className="text-sm font-semibold text-slate-100">Project</h3>
            <p className="mt-1">{task.project.name}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
