"use client";

import { useEffect, useMemo, useState } from "react";

const PLACEHOLDER = "Enter VIP email addresses or domains (one per line)";
const DEFAULT_CONFIDENCE = 0.7;

type SettingsState = {
  vipValue: string;
  confidence: number;
  vipOnly: boolean;
  loading: boolean;
  message: string | null;
  error: string | null;
};

export default function SettingsPage() {
  const [state, setState] = useState<SettingsState>({
    vipValue: "",
    confidence: DEFAULT_CONFIDENCE,
    vipOnly: true,
    loading: true,
    message: null,
    error: null,
  });
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [vipResponse, configResponse] = await Promise.all([
          fetch("/api/settings/vips"),
          fetch("/api/settings/config"),
        ]);

        if (!vipResponse.ok) {
          throw new Error(`Failed to load VIPs (${vipResponse.status})`);
        }

        if (!configResponse.ok) {
          throw new Error(`Failed to load config (${configResponse.status})`);
        }

        const vipData = (await vipResponse.json()) as { vips: string[] };
        const configData = (await configResponse.json()) as { confidence?: number; vipOnly?: boolean };

        const loadedConfidence =
          typeof configData.confidence === "number" && configData.confidence >= 0 && configData.confidence <= 1
            ? configData.confidence
            : DEFAULT_CONFIDENCE;
        const loadedVipOnly = typeof configData.vipOnly === "boolean" ? configData.vipOnly : true;

        if (!active) return;

        setState({
          vipValue: (vipData.vips ?? []).join("\n"),
          confidence: loadedConfidence,
          vipOnly: loadedVipOnly,
          loading: false,
          message: null,
          error: null,
        });
      } catch (error) {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load settings",
        }));
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!state.message) {
      setShowToast(false);
      return;
    }

    setShowToast(true);
    const timeout = setTimeout(() => setShowToast(false), 2400);
    return () => clearTimeout(timeout);
  }, [state.message]);

  const confidenceLabel = useMemo(() => state.confidence.toFixed(2), [state.confidence]);

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
      const [vipResponse, configResponse] = await Promise.all([
        fetch("/api/settings/vips", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vips: lines }),
        }),
        fetch("/api/settings/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confidence: state.confidence, vipOnly: state.vipOnly }),
        }),
      ]);

      if (!vipResponse.ok) {
        const payload = (await vipResponse.json()) as { message?: string };
        throw new Error(payload.message ?? "Failed to save VIPs");
      }

      if (!configResponse.ok) {
        const payload = (await configResponse.json()) as { message?: string };
        throw new Error(payload.message ?? "Failed to save processing config");
      }

      const vipData = (await vipResponse.json()) as { vips: string[] };
      const configPayload = (await configResponse.json()) as {
        ok?: boolean;
        config?: { confidence: number; vipOnly: boolean };
      };

      const updatedConfig = configPayload.config ?? { confidence: state.confidence, vipOnly: state.vipOnly };

      setState({
        vipValue: (vipData.vips ?? []).join("\n"),
        confidence:
          typeof updatedConfig.confidence === "number"
            ? Math.min(1, Math.max(0, updatedConfig.confidence))
            : state.confidence,
        vipOnly: typeof updatedConfig.vipOnly === "boolean" ? updatedConfig.vipOnly : state.vipOnly,
        loading: false,
        message: "Settings saved",
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to save settings",
      }));
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-8 pb-12 pt-10 text-slate-100">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-400">Configure VIP filtering, detection confidence, and sender controls.</p>
      </header>

      <section className="relative max-w-2xl rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow">
        {showToast && state.message ? (
          <div className="fixed right-6 top-6 rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-lg">
            {state.message}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-200" htmlFor="vipEntries">
              VIP senders / domains
            </label>
            <textarea
              id="vipEntries"
              name="vipEntries"
              disabled={state.loading}
              placeholder={PLACEHOLDER}
              className="h-56 w-full rounded-md border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
              value={state.vipValue}
              onChange={(event) =>
                setState((prev) => ({ ...prev, vipValue: event.target.value, message: null, error: null }))
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-slate-200">
              <span className="font-medium">Confidence threshold</span>
              <span className="font-mono text-slate-400">{confidenceLabel}</span>
            </div>
            <input
              type="range"
              name="confidence"
              min={0}
              max={1}
              step={0.05}
              value={state.confidence}
              disabled={state.loading}
              onChange={(event) =>
                setState((prev) => ({
                  ...prev,
                  confidence: Number(event.target.value),
                  message: null,
                  error: null,
                }))
              }
              className="w-full accent-emerald-500 disabled:opacity-50"
            />
            <p className="text-xs text-slate-500">
              Tasks below this confidence will be held for review instead of auto-creating tasks.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/80 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-200">VIP-only processing</p>
              <p className="text-xs text-slate-500">
                When disabled, RADAR will include keyword matches from non-VIP senders.
              </p>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                name="vipOnly"
                checked={state.vipOnly}
                disabled={state.loading}
                onChange={(event) =>
                  setState((prev) => ({
                    ...prev,
                    vipOnly: event.target.checked,
                    message: null,
                    error: null,
                  }))
                }
                className="h-5 w-5 rounded border border-slate-700 bg-slate-950 accent-emerald-500"
              />
              <span>{state.vipOnly ? "Enabled" : "Disabled"}</span>
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={state.loading}
              className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700"
            >
              {state.loading ? "Saving…" : "Save settings"}
            </button>
            {state.error ? <span className="text-sm text-rose-300">{state.error}</span> : null}
          </div>
        </form>
      </section>
    </main>
  );
}
