"use client";

import { useEffect, useState } from "react";

const PLACEHOLDER = "Enter VIP email addresses or domains (one per line)";

type FetchState = {
  value: string;
  loading: boolean;
  message: string | null;
  error: string | null;
};

export default function SettingsPage() {
  const [state, setState] = useState<FetchState>({
    value: "",
    loading: true,
    message: null,
    error: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/settings/vips");
        if (!response.ok) {
          throw new Error(`Failed to load VIPs (${response.status})`);
        }
        const data = (await response.json()) as { vips: string[] };
        if (!active) return;
        setState({
          value: (data.vips ?? []).join("\n"),
          loading: false,
          message: null,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load VIPs",
        }));
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((prev) => ({ ...prev, loading: true, message: null, error: null }));

    const form = new FormData(event.currentTarget);
    const raw = String(form.get("vipEntries") ?? "");
    const lines = raw
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0);

    try {
      const response = await fetch("/api/settings/vips", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vips: lines }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        throw new Error(payload.message ?? "Failed to save VIPs");
      }

      const data = (await response.json()) as { vips: string[] };
      setState({
        value: (data.vips ?? []).join("\n"),
        loading: false,
        message: "VIPs updated",
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to save VIPs",
      }));
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-8 pb-12 pt-10 text-slate-100">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-400">
          Manage VIP senders and domains. RADAR only surfaces proactive pings for entries listed below.
        </p>
      </header>

      <section className="max-w-2xl rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow">
        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-200" htmlFor="vipEntries">
            VIP senders / domains
          </label>
          <textarea
            id="vipEntries"
            name="vipEntries"
            disabled={state.loading}
            placeholder={PLACEHOLDER}
            className="h-56 w-full rounded-md border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            value={state.value}
            onChange={(event) => setState((prev) => ({ ...prev, value: event.target.value }))}
          />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={state.loading}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700"
            >
              {state.loading ? "Saving…" : "Save VIPs"}
            </button>
            {state.message ? <span className="text-sm text-emerald-300">{state.message}</span> : null}
            {state.error ? <span className="text-sm text-rose-300">{state.error}</span> : null}
          </div>
        </form>
      </section>
    </main>
  );
}
