"use client";

import { useState } from "react";

type Nudge = {
  title: string;
  body: string;
};

export function NudgePanel() {
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState("Summarize fresh signals and surface next actions.");
  const [nudges, setNudges] = useState<Nudge[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function requestNudges() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }

      const payload = (await response.json()) as { message: string };
      const items = payload.message
        .split(/\n\n+/)
        .map((chunk) => chunk.trim())
        .filter(Boolean)
        .map((chunk, index) => ({
          title: `Nudge ${index + 1}`,
          body: chunk,
        }));

      setNudges(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-inner">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-100">Nudges</h2>
        <button
          type="button"
          onClick={requestNudges}
          disabled={loading}
          className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-emerald-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700"
        >
          {loading ? "Fetching…" : "Refresh"}
        </button>
      </header>
      <label className="flex flex-col gap-2 text-sm text-slate-300">
        Custom prompt
        <textarea
          className="min-h-[90px] rounded-md border border-slate-800 bg-slate-950/80 p-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
        />
      </label>
      {error ? (
        <p className="rounded-md border border-rose-700 bg-rose-950/60 p-3 text-sm text-rose-200">{error}</p>
      ) : null}
      <ul className="flex flex-col gap-3">
        {nudges.length === 0 ? (
          <li className="text-sm text-slate-400">Run a refresh to see suggested follow-ups.</li>
        ) : (
          nudges.map((nudge) => (
            <li key={nudge.title} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <h3 className="text-sm font-semibold text-slate-100">{nudge.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{nudge.body}</p>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
