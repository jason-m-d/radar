import { listAuditEvents } from "@/server/audit";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const events = await listAuditEvents();

  return (
    <main className="min-h-screen bg-slate-950 px-8 pb-12 pt-10 text-slate-100">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-sm text-slate-400">Recent rule and configuration activity is recorded here for review.</p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow">
        <div className="max-h-[70vh] overflow-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/60 text-slate-300">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Time</th>
                <th className="px-3 py-2 text-left font-semibold">Actor</th>
                <th className="px-3 py-2 text-left font-semibold">Action</th>
                <th className="px-3 py-2 text-left font-semibold">Entity</th>
                <th className="px-3 py-2 text-left font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {events.map((event) => (
                <tr key={event.id}>
                  <td className="px-3 py-2 text-xs text-slate-400">
                    {new Date(event.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs uppercase">{event.actor}</td>
                  <td className="px-3 py-2 font-mono text-xs uppercase">{event.action}</td>
                  <td className="px-3 py-2 text-xs text-slate-300">
                    {event.entity} • {event.entityId}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-300">
                    <pre className="whitespace-pre-wrap break-words text-[11px] text-slate-400">
                      {JSON.stringify(event.details ?? {}, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
