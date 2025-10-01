"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const PLACEHOLDER = "Enter VIP email addresses or domains (one per line)";
const DEFAULT_CONFIDENCE = 0.7;

type SettingsState = {
  vipValue: string;
  confidence: number;
  vipOnly: boolean;
  loading: boolean;
  error: string | null;
};

type RuleRecord = {
  id: string;
  type: "EMAIL" | "DOMAIN" | "TOPIC";
  pattern: string;
  action: "VIP" | "SUPPRESS";
  unlessContains: string | null;
  notes: string | null;
  confidence: number | null;
  createdAt: string;
};

type ParsedRulePreview = {
  type: "EMAIL" | "DOMAIN" | "TOPIC";
  pattern: string;
  action: "VIP" | "SUPPRESS";
  unless_contains?: string | null;
  notes?: string | null;
  confidence?: number | null;
};

type RuleDraft = {
  type: "EMAIL" | "DOMAIN" | "TOPIC";
  action: "VIP" | "SUPPRESS";
  pattern: string;
  unless_contains: string | null;
  notes: string | null;
  confidence: number | null;
};

type CsvPreviewEntry = {
  id: string;
  type: "EMAIL" | "DOMAIN" | "TOPIC";
  pattern: string;
  action: "VIP" | "SUPPRESS";
  unless_contains: string | null;
  notes: string | null;
  confidence: number | null;
  strategy: string;
  source: { row: number; column: string };
};

type CsvSummary = {
  totalRows: number;
  totalRules: number;
  vipCount: number;
  suppressCount: number;
};

type CsvSortColumn = "type" | "pattern" | "action" | "unless_contains" | "notes";
type CsvSortState = { column: CsvSortColumn; direction: "asc" | "desc" } | null;

export default function SettingsPage() {
  const [state, setState] = useState<SettingsState>({
    vipValue: "",
    confidence: DEFAULT_CONFIDENCE,
    vipOnly: true,
    loading: true,
    error: null,
  });
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [ruleInput, setRuleInput] = useState("");
  const [parsePending, setParsePending] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft | null>(null);
  const [parseStrategy, setParseStrategy] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [csvSelectedAction, setCsvSelectedAction] = useState<"VIP" | "SUPPRESS">("VIP");
  const [csvPreview, setCsvPreview] = useState<CsvPreviewEntry[]>([]);
  const [csvSummary, setCsvSummary] = useState<CsvSummary | null>(null);
  const [csvAnalyzePending, setCsvAnalyzePending] = useState(false);
  const [csvImportPending, setCsvImportPending] = useState(false);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvSelectedIds, setCsvSelectedIds] = useState<Set<string>>(new Set());
  const [csvSort, setCsvSort] = useState<CsvSortState>({ column: "type", direction: "asc" });
  const [csvFilterType, setCsvFilterType] = useState<"ALL" | "EMAIL" | "DOMAIN" | "TOPIC">("ALL");
  const [csvFilterAction, setCsvFilterAction] = useState<"ALL" | "VIP" | "SUPPRESS">("ALL");
  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [vipResponse, configResponse, rulesResponse] = await Promise.all([
          fetch("/api/settings/vips"),
          fetch("/api/settings/config"),
          fetch("/api/rules"),
        ]);

        if (!vipResponse.ok) {
          throw new Error(`Failed to load VIPs (${vipResponse.status})`);
        }

        if (!configResponse.ok) {
          throw new Error(`Failed to load config (${configResponse.status})`);
        }

        if (!rulesResponse.ok) {
          throw new Error(`Failed to load rules (${rulesResponse.status})`);
        }

        const vipData = (await vipResponse.json()) as { vips: string[] };
        const configData = (await configResponse.json()) as { confidence?: number; vipOnly?: boolean };
        const rulesData = (await rulesResponse.json()) as { rules: RuleRecord[] };

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
          error: null,
        });
        setRules(rulesData.rules ?? []);
        setRulesLoading(false);
      } catch (error) {
        if (!active) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Unable to load settings",
        }));
        setRulesLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!csvModalOpen) {
      return undefined;
    }

    const { style } = document.body;
    const previousOverflow = style.overflow;
    const previousPaddingRight = style.paddingRight;
    const scrollbarGap = window.innerWidth - document.documentElement.clientWidth;

    style.overflow = "hidden";
    if (scrollbarGap > 0) {
      style.paddingRight = `${scrollbarGap}px`;
    }

    return () => {
      style.overflow = previousOverflow;
      style.paddingRight = previousPaddingRight;
    };
  }, [csvModalOpen]);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const confidenceLabel = useMemo(() => state.confidence.toFixed(2), [state.confidence]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState((prev) => ({ ...prev, loading: true, error: null }));

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
        error: null,
      });
      setToast({ message: "Settings saved", tone: "success" });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to save settings",
      }));
    }
  }

  async function refreshRules() {
    setRulesLoading(true);
    try {
      const response = await fetch("/api/rules");
      const payload = (await response.json().catch(() => ({}))) as { rules?: RuleRecord[]; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load rules");
      }

      setRules(payload.rules ?? []);
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Unable to refresh rules",
        tone: "error",
      });
    } finally {
      setRulesLoading(false);
    }
  }

  function computeCsvSummary(entries: CsvPreviewEntry[], totalRows: number): CsvSummary {
    const vipCount = entries.filter((entry) => entry.action === "VIP").length;
    const suppressCount = entries.filter((entry) => entry.action === "SUPPRESS").length;
    return {
      totalRows,
      totalRules: entries.length,
      vipCount,
      suppressCount,
    };
  }

  function applyCsvSort(entries: CsvPreviewEntry[], sort: CsvSortState): CsvPreviewEntry[] {
    if (!sort) {
      return [...entries];
    }

    const direction = sort.direction === "asc" ? 1 : -1;
    const typeRank: Record<string, number> = { EMAIL: 0, DOMAIN: 1, TOPIC: 2 };
    const actionRank: Record<string, number> = { VIP: 0, SUPPRESS: 1 };

    return [...entries].sort((a, b) => {
      const valueFor = (entry: CsvPreviewEntry): string => {
        switch (sort.column) {
          case "type":
            return entry.type;
          case "action":
            return entry.action;
          case "pattern":
            return entry.pattern;
          case "unless_contains":
            return entry.unless_contains ?? "";
          case "notes":
            return entry.notes ?? "";
          default:
            return "";
        }
      };

      const valueA = valueFor(a);
      const valueB = valueFor(b);

      if (sort.column === "type") {
        return ((typeRank[valueA.toUpperCase()] ?? 99) - (typeRank[valueB.toUpperCase()] ?? 99)) * direction;
      }

      if (sort.column === "action") {
        return ((actionRank[valueA.toUpperCase()] ?? 99) - (actionRank[valueB.toUpperCase()] ?? 99)) * direction;
      }

      return valueA.localeCompare(valueB) * direction;
    });
  }

  function updateCsvSummary(entries: CsvPreviewEntry[]) {
    setCsvSummary(computeCsvSummary(entries, entries.length));
  }

  const filteredCsv = useMemo(() => {
    return csvPreview.filter((entry) => {
      const typeMatch = csvFilterType === "ALL" || entry.type === csvFilterType;
      const actionMatch = csvFilterAction === "ALL" || entry.action === csvFilterAction;
      return typeMatch && actionMatch;
    });
  }, [csvPreview, csvFilterType, csvFilterAction]);

  const filteredSummary = useMemo(
    () => computeCsvSummary(filteredCsv, filteredCsv.length),
    [filteredCsv],
  );

  const filterActive = csvFilterType !== "ALL" || csvFilterAction !== "ALL";

  const totalRules = csvSummary?.totalRules ?? csvPreview.length;
  const visibleSelectedCount = filteredCsv.filter((entry) => csvSelectedIds.has(entry.id)).length;
  const totalSelectedCount = csvSelectedIds.size;
  const filterDescriptionParts: string[] = [];
  if (csvFilterType !== "ALL") {
    filterDescriptionParts.push(csvFilterType.toLowerCase());
  }
  if (csvFilterAction !== "ALL") {
    filterDescriptionParts.push(csvFilterAction.toLowerCase());
  }
  const filterDescription = filterDescriptionParts.join(" · ");

  function applySortAndSet(entries: CsvPreviewEntry[], sortState: CsvSortState = csvSort) {
    const sorted = applyCsvSort(entries, sortState);
    updateCsvSummary(sorted);
    setCsvPreview(sorted);
  }

  async function parseRuleText() {
    if (!ruleInput.trim()) {
      setRuleError("Enter rule text to parse.");
      return;
    }

    setParsePending(true);
    setRuleError(null);
    setRuleDraft(null);

    try {
      const response = await fetch("/api/rules/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: ruleInput }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        rule?: ParsedRulePreview;
        message?: string;
        strategy?: string;
      };

      if (!response.ok || !payload.rule) {
        throw new Error(payload.message ?? "Unable to parse rule automatically.");
      }

      setRuleDraft({
        type: payload.rule.type,
        action: payload.rule.action ?? "VIP",
        pattern: payload.rule.pattern,
        unless_contains: payload.rule.unless_contains ?? null,
        notes: payload.rule.notes ?? null,
        confidence: payload.rule.confidence ?? null,
      });
      setParseStrategy(payload.strategy ?? "heuristic");
    } catch (error) {
      setRuleError(error instanceof Error ? error.message : "Unable to parse rule.");
    } finally {
      setParsePending(false);
    }
  }

  async function saveParsedRule() {
    if (!ruleDraft) {
      return;
    }

    setRuleSaving(true);
    setRuleError(null);

    try {
      const response = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: ruleDraft.type,
          action: ruleDraft.action,
          pattern: ruleDraft.pattern,
          unless_contains: ruleDraft.unless_contains,
          notes: ruleDraft.notes,
          confidence: ruleDraft.confidence,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        rule?: RuleRecord;
        message?: string;
      };

      if (!response.ok || !payload.rule) {
        throw new Error(payload.message ?? "Failed to save rule");
      }

      await refreshRules();
      setRuleDraft(null);
      setParseStrategy(null);
      setRuleInput("");
      setToast({ message: "Rule added", tone: "success" });
    } catch (error) {
      setRuleError(error instanceof Error ? error.message : "Failed to save rule");
    } finally {
      setRuleSaving(false);
    }
  }

  async function handleCsvChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setCsvAnalyzePending(true);
    setCsvError(null);
    clearCsvFilters();
    setCsvSort({ column: "type", direction: "asc" });

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("action", csvSelectedAction);

      const response = await fetch("/api/rules/import/analyze", {
        method: "POST",
        body: form,
      });

      const payload = (await response.json().catch(() => ({}))) as {
        preview?: CsvPreviewEntry[];
        summary?: CsvSummary;
        message?: string;
      };

      if (!response.ok || !payload.preview) {
        throw new Error(payload.message ?? "Failed to analyze CSV");
      }

      const normalized = payload.preview.map((entry) => ({
        ...entry,
        unless_contains: entry.unless_contains ?? null,
        notes: entry.notes ?? null,
        confidence: entry.confidence ?? null,
      }));
      setCsvSelectedIds(new Set());
      const sortState = csvSort ?? { column: "type", direction: "asc" };
      setCsvSort(sortState);
      applySortAndSet(normalized, sortState);
    } catch (error) {
      setCsvPreview([]);
      setCsvSummary(null);
      setCsvSelectedIds(new Set());
      setCsvError(error instanceof Error ? error.message : "Failed to analyze CSV");
    } finally {
      setCsvAnalyzePending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function confirmCsvImport() {
    if (!csvPreview.length) {
      setCsvError("No rules detected. Upload a CSV to continue.");
      return;
    }

    setCsvImportPending(true);
    setCsvError(null);

    try {
      const response = await fetch("/api/rules/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules: csvPreview.map((entry) => ({
            type: entry.type,
            pattern: entry.pattern,
            action: entry.action,
            unless_contains: entry.unless_contains,
            notes: entry.notes,
            confidence: entry.confidence,
          })),
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { count?: number; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to import rules");
      }

      await refreshRules();
      const count = payload.count ?? csvPreview.length;
      setToast({
        message: `Imported ${count} rule${count === 1 ? "" : "s"}`,
        tone: "success",
      });
      closeCsvModal();
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "Failed to import rules");
    } finally {
      setCsvImportPending(false);
    }
  }

  function overrideCsvAction(action: "VIP" | "SUPPRESS") {
    setCsvPreview((prev) => {
      const targetIds = new Set(filteredCsv.map((entry) => entry.id));
      const updated = prev.map((entry) => (targetIds.has(entry.id) ? { ...entry, action } : entry));
      const sorted = applyCsvSort(updated, csvSort);
      updateCsvSummary(sorted);
      return sorted;
    });
  }

  function closeCsvModal() {
    setCsvModalOpen(false);
    setCsvPreview([]);
    setCsvSummary(null);
    setCsvError(null);
    setCsvAnalyzePending(false);
    setCsvImportPending(false);
    setCsvSelectedIds(new Set());
    setCsvFilterType("ALL");
    setCsvFilterAction("ALL");
    setCsvSort({ column: "type", direction: "asc" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function clearCsvFilters() {
    setCsvFilterType("ALL");
    setCsvFilterAction("ALL");
  }

  function toggleCsvSelection(id: string) {
    setCsvSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleSelectAllVisible(checked: boolean) {
    setCsvSelectedIds((prev) => {
      if (!checked) {
        const next = new Set(prev);
        filteredCsv.forEach((entry) => next.delete(entry.id));
        return next;
      }
      return new Set([...prev, ...filteredCsv.map((entry) => entry.id)]);
    });
  }

  function deleteCsvEntries(ids: string[]) {
    if (!ids.length) {
      return;
    }
    setCsvPreview((prev) => {
      const updated = prev.filter((entry) => !ids.includes(entry.id));
      updateCsvSummary(updated);
      return updated;
    });
    setCsvSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }

  function handleBulkDelete() {
    const ids = Array.from(csvSelectedIds);
    if (!ids.length) {
      return;
    }
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(`Delete ${ids.length} selected row${ids.length === 1 ? "" : "s"}?`);
      if (!confirmed) {
        return;
      }
    }
    deleteCsvEntries(ids);
  }

  function handleSort(column: CsvSortColumn) {
    setCsvSort((prev) => {
      const next: CsvSortState = prev && prev.column === column
        ? { column, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { column, direction: "asc" };

      setCsvPreview((current) => {
        const sorted = applyCsvSort(current, next);
        updateCsvSummary(sorted);
        return sorted;
      });

      return next;
    });
  }

  const sortIndicator = (column: CsvSortColumn) => {
    if (!csvSort || csvSort.column !== column) {
      return "↕";
    }
    return csvSort.direction === "asc" ? "▲" : "▼";
  };

  async function removeRule(id: string) {
    setDeletingId(id);
    try {
      const response = await fetch("/api/rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "Failed to delete rule");
      }

      setRules((prev) => prev.filter((rule) => rule.id !== id));
      setToast({ message: "Rule removed", tone: "success" });
    } catch (error) {
      setToast({ message: error instanceof Error ? error.message : "Failed to delete rule", tone: "error" });
    } finally {
      setDeletingId(null);
    }
  }

  function triggerCsvUpload() {
    setCsvModalOpen(true);
    setCsvError(null);
    setCsvPreview([]);
    setCsvSummary(null);
    setCsvAnalyzePending(false);
    setCsvImportPending(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function beginCsvSelection() {
    fileInputRef.current?.click();
  }

  return (
    <ErrorBoundary>
    <main className="min-h-screen bg-slate-950 px-8 pb-12 pt-10 text-slate-100">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-slate-400">Configure VIP filtering, detection confidence, and sender controls.</p>
      </header>

      <section className="relative max-w-2xl rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow">
        {toast ? (
          <div
            className={`fixed right-6 top-6 rounded-md px-4 py-2 text-sm font-semibold shadow-lg ${
              toast.tone === "success"
                ? "bg-emerald-500 text-emerald-950"
                : "bg-rose-500 text-rose-950"
            }`}
          >
            {toast.message}
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
                setState((prev) => ({ ...prev, vipValue: event.target.value, error: null }))
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

      <section className="mt-8 max-w-4xl rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow">
        <header className="mb-4 space-y-1">
          <h2 className="text-xl font-semibold text-slate-100">VIP/Suppression Rules</h2>
          <p className="text-sm text-slate-400">
            Type natural language instructions (e.g., "@wingstop.com unless overdue") or upload a CSV to manage advanced
            routing.
          </p>
        </header>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start">
            <input
              type="text"
              value={ruleInput}
              onChange={(event) => {
                setRuleInput(event.target.value);
                setRuleError(null);
              }}
              placeholder="e.g. suppress newsletters unless urgent"
              className="flex-1 rounded-md border border-slate-800 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void parseRuleText()}
                disabled={parsePending || !ruleInput.trim()}
                className="rounded-md bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 shadow hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {parsePending ? "Parsing…" : "Parse rule"}
              </button>
              <button
                type="button"
                onClick={triggerCsvUpload}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-semibold uppercase text-slate-300 hover:border-emerald-500 hover:text-emerald-400"
              >
                Upload CSV
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(event) => void handleCsvChange(event)}
              />
            </div>
          </div>

          {ruleError ? <p className="text-sm text-rose-300">{ruleError}</p> : null}

          {ruleDraft ? (
            <div className="space-y-4 rounded-lg border border-emerald-600/60 bg-emerald-950/20 p-4 text-sm text-emerald-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold uppercase tracking-wide text-emerald-200">Rule editor</h3>
                {parseStrategy ? (
                  <span className="text-xs uppercase text-emerald-400">Source: {parseStrategy}</span>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-emerald-400">Type</span>
                  <select
                    value={ruleDraft.type}
                    onChange={(event) =>
                      setRuleDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              type: event.target.value as RuleDraft["type"],
                              pattern:
                                event.target.value === "DOMAIN"
                                  ? prev.pattern.replace(/^@/, "")
                                  : prev.pattern,
                            }
                          : prev,
                      )
                    }
                    className="rounded-md border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="DOMAIN">Domain</option>
                    <option value="TOPIC">Topic</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-emerald-400">Action</span>
                  <select
                    value={ruleDraft.action}
                    onChange={(event) =>
                      setRuleDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              action: event.target.value as RuleDraft["action"],
                            }
                          : prev,
                      )
                    }
                    className="rounded-md border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="VIP">VIP</option>
                    <option value="SUPPRESS">Suppress</option>
                  </select>
                </label>
                <label className="md:col-span-2 flex flex-col gap-1">
                  <span className="text-xs uppercase text-emerald-400">Pattern</span>
                  <input
                    type="text"
                    value={ruleDraft.type === "DOMAIN" ? `@${ruleDraft.pattern}` : ruleDraft.pattern}
                    onChange={(event) =>
                      setRuleDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              pattern:
                                prev.type === "DOMAIN"
                                  ? event.target.value.replace(/^@/, "").toLowerCase()
                                  : event.target.value.toLowerCase(),
                            }
                          : prev,
                      )
                    }
                    className="rounded-md border border-emerald-500/40 bg-emerald-900/40 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-emerald-400">Exception (optional)</span>
                  <input
                    type="text"
                    value={ruleDraft.unless_contains ?? ""}
                    onChange={(event) =>
                      setRuleDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              unless_contains: event.target.value.trim().length
                                ? event.target.value.trim().toLowerCase()
                                : null,
                            }
                          : prev,
                      )
                    }
                    className="rounded-md border border-emerald-500/40 bg-emerald-900/40 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-emerald-400">Notes (optional)</span>
                  <input
                    type="text"
                    value={ruleDraft.notes ?? ""}
                    onChange={(event) =>
                      setRuleDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              notes: event.target.value.trim().length ? event.target.value.trim() : null,
                            }
                          : prev,
                      )
                    }
                    className="rounded-md border border-emerald-500/40 bg-emerald-900/40 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs uppercase text-emerald-400">Confidence</span>
                  <input
                    type="number"
                    step={0.05}
                    min={0}
                    max={1}
                    value={ruleDraft.confidence ?? ""}
                    onChange={(event) =>
                      setRuleDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              confidence:
                                event.target.value === ""
                                  ? null
                                  : Math.min(1, Math.max(0, Number(event.target.value))),
                            }
                          : prev,
                      )
                    }
                    className="rounded-md border border-emerald-500/40 bg-emerald-900/40 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-400 focus:outline-none"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void saveParsedRule()}
                  disabled={ruleSaving || !ruleDraft.pattern.trim()}
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {ruleSaving ? "Saving…" : "Save rule"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRuleDraft(null);
                    setParseStrategy(null);
                    setRuleError(null);
                  }}
                  className="rounded-md border border-emerald-400/50 px-3 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-900/60 text-slate-300">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Type</th>
                  <th className="px-3 py-2 text-left font-semibold">Pattern</th>
                  <th className="px-3 py-2 text-left font-semibold">Action</th>
                  <th className="px-3 py-2 text-left font-semibold">Exception</th>
                  <th className="px-3 py-2 text-left font-semibold">Notes</th>
                  <th className="px-3 py-2 text-left font-semibold">Confidence</th>
                  <th className="px-3 py-2 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rulesLoading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                      Loading rules…
                    </td>
                  </tr>
                ) : rules.length ? (
                  rules.map((rule) => (
                    <tr key={rule.id}>
                      <td className="px-3 py-2 font-mono uppercase text-slate-300">{rule.type.toLowerCase()}</td>
                      <td className="px-3 py-2 font-mono text-slate-100">{rule.type === "DOMAIN" ? `@${rule.pattern}` : rule.pattern}</td>
                      <td className="px-3 py-2 font-mono text-slate-300">{rule.action.toLowerCase()}</td>
                      <td className="px-3 py-2 text-slate-300">{rule.unlessContains ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-300">{rule.notes ?? "—"}</td>
                      <td className="px-3 py-2 text-slate-300">
                        {typeof rule.confidence === "number" ? rule.confidence.toFixed(2) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => void removeRule(rule.id)}
                          disabled={deletingId === rule.id}
                          className="rounded-md border border-rose-500/50 px-3 py-1 text-xs font-semibold uppercase text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === rule.id ? "Removing…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
                      No rules yet. Add one above or import from CSV.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {csvModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/80 px-6 py-8"
          onWheelCapture={(event) => event.stopPropagation()}
        >
          <div className="flex h-full w-full max-h-[90vh] max-w-6xl flex-col space-y-4 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-100">Import rules from CSV</h3>
                <p className="text-sm text-slate-400">
                  Select the list type, review detected rules, adjust anything inline, then confirm the import.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCsvModal}
                className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-rose-500 hover:text-rose-300"
              >
                Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-slate-200">Is this a VIP list or Suppress list?</p>
                <div className="mt-2 flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="csv-action"
                      value="VIP"
                      checked={csvSelectedAction === "VIP"}
                      onChange={() => setCsvSelectedAction("VIP")}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    VIP list (promote entries)
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="csv-action"
                      value="SUPPRESS"
                      checked={csvSelectedAction === "SUPPRESS"}
                      onChange={() => setCsvSelectedAction("SUPPRESS")}
                      className="h-4 w-4 accent-rose-500"
                    />
                    Suppress list (mute entries)
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={beginCsvSelection}
                  disabled={csvAnalyzePending}
                  className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {csvAnalyzePending ? "Analyzing…" : "Choose CSV file"}
                </button>
                {csvSummary ? (
                  <span className="text-sm text-slate-300">
                    {csvSummary.totalRules} rules detected • VIP {csvSummary.vipCount} • Suppress {csvSummary.suppressCount}
                  </span>
                ) : null}
              </div>

              {csvError ? <p className="rounded-md border border-rose-500/40 bg-rose-900/30 p-3 text-sm text-rose-200">{csvError}</p> : null}

              {csvPreview.length ? (
                <div className="flex h-full flex-1 min-h-0 flex-col gap-4 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2">
                    <div className="text-sm text-slate-300">
                      {totalRules ? (
                        <span>
                          Showing {filteredSummary.totalRules} of {totalRules} rules
                        </span>
                      ) : (
                        <span>No rules detected</span>
                      )}
                      {filterActive ? (
                        <span className="ml-2 text-xs uppercase tracking-wide text-emerald-300">
                          Filtered by {filterDescription || "custom"}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <label className="flex items-center gap-1 text-slate-400">
                        Type
                        <select
                          value={csvFilterType}
                          onChange={(event) => setCsvFilterType(event.target.value as typeof csvFilterType)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="ALL">All types</option>
                          <option value="EMAIL">Email</option>
                          <option value="DOMAIN">Domain</option>
                          <option value="TOPIC">Topic</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-1 text-slate-400">
                        Action
                        <select
                          value={csvFilterAction}
                          onChange={(event) => setCsvFilterAction(event.target.value as typeof csvFilterAction)}
                          className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100 focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="ALL">All actions</option>
                          <option value="VIP">VIP</option>
                          <option value="SUPPRESS">Suppress</option>
                        </select>
                      </label>
                      {filterActive ? (
                        <button
                          type="button"
                          onClick={clearCsvFilters}
                          className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
                        >
                          Clear filters
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => overrideCsvAction("VIP")}
                      className="rounded-md border border-emerald-500/60 px-3 py-1 text-xs font-semibold uppercase text-emerald-300 hover:bg-emerald-500/10"
                    >
                      Override all as VIP
                    </button>
                    <button
                      type="button"
                      onClick={() => overrideCsvAction("SUPPRESS")}
                      className="rounded-md border border-rose-500/60 px-3 py-1 text-xs font-semibold uppercase text-rose-300 hover:bg-rose-500/10"
                    >
                      Override all as Suppress
                    </button>
                    <span className="text-xs text-slate-400">
                      {visibleSelectedCount} visible selected
                      {totalSelectedCount !== visibleSelectedCount
                        ? ` (${totalSelectedCount} total)`
                        : ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={!csvSelectedIds.size}
                      className="rounded-md border border-rose-500/60 px-3 py-1 text-xs font-semibold uppercase text-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete selected ({totalSelectedCount})
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden rounded-lg border border-slate-800">
                    <div className="h-full overflow-auto">
                      <table className="min-w-full divide-y divide-slate-800 text-sm">
                        <thead className="sticky top-0 z-10 bg-slate-900/90 text-slate-300 backdrop-blur">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">
                              <input
                                type="checkbox"
                                checked={filteredCsv.length > 0 && filteredCsv.every((entry) => csvSelectedIds.has(entry.id))}
                                ref={(element) => {
                                  if (element) {
                                    const allSelected = filteredCsv.length > 0 && filteredCsv.every((entry) => csvSelectedIds.has(entry.id));
                                    const someSelected = filteredCsv.some((entry) => csvSelectedIds.has(entry.id));
                                    element.indeterminate = someSelected && !allSelected;
                                  }
                                }}
                                onChange={(event) => handleSelectAllVisible(event.target.checked)}
                                className="h-4 w-4 accent-emerald-500"
                              />
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              <button
                                type="button"
                                onClick={() => handleSort("type")}
                                className={`flex items-center gap-1 text-xs uppercase ${
                                  csvSort?.column === "type" ? "text-emerald-300" : "text-slate-300"
                                }`}
                              >
                                Type <span className="text-[10px]">{sortIndicator("type")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              <button
                                type="button"
                                onClick={() => handleSort("pattern")}
                                className={`flex items-center gap-1 text-xs uppercase ${
                                  csvSort?.column === "pattern" ? "text-emerald-300" : "text-slate-300"
                                }`}
                              >
                                Pattern <span className="text-[10px]">{sortIndicator("pattern")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              <button
                                type="button"
                                onClick={() => handleSort("action")}
                                className={`flex items-center gap-1 text-xs uppercase ${
                                  csvSort?.column === "action" ? "text-emerald-300" : "text-slate-300"
                                }`}
                              >
                                Action <span className="text-[10px]">{sortIndicator("action")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              <button
                                type="button"
                                onClick={() => handleSort("unless_contains")}
                                className={`flex items-center gap-1 text-xs uppercase ${
                                  csvSort?.column === "unless_contains" ? "text-emerald-300" : "text-slate-300"
                                }`}
                              >
                                Exception <span className="text-[10px]">{sortIndicator("unless_contains")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">
                              <button
                                type="button"
                                onClick={() => handleSort("notes")}
                                className={`flex items-center gap-1 text-xs uppercase ${
                                  csvSort?.column === "notes" ? "text-emerald-300" : "text-slate-300"
                                }`}
                              >
                                Notes <span className="text-[10px]">{sortIndicator("notes")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2 text-left font-semibold">Source</th>
                            <th className="px-3 py-2 text-left font-semibold">Strategy</th>
                            <th className="px-3 py-2 text-left font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {filteredCsv.map((entry) => (
                            <tr key={entry.id}>
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={csvSelectedIds.has(entry.id)}
                                  onChange={() => toggleCsvSelection(entry.id)}
                                  className="h-4 w-4 accent-emerald-500"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={entry.type}
                                  onChange={(event) =>
                                    setCsvPreview((prev) => {
                                      const updated = prev.map((item) =>
                                        item.id === entry.id
                                          ? { ...item, type: event.target.value as RuleDraft["type"] }
                                          : item,
                                      );
                                      const sorted = applyCsvSort(updated, csvSort);
                                      updateCsvSummary(sorted);
                                      return sorted;
                                    })
                                  }
                                  className="w-28 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs uppercase text-slate-100 focus:border-emerald-500 focus:outline-none"
                                >
                                  <option value="EMAIL">Email</option>
                                  <option value="DOMAIN">Domain</option>
                                  <option value="TOPIC">Topic</option>
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={entry.type === "DOMAIN" ? `@${entry.pattern}` : entry.pattern}
                                  onChange={(event) =>
                                    setCsvPreview((prev) => {
                                      const updated = prev.map((item) =>
                                        item.id === entry.id
                                          ? {
                                              ...item,
                                              pattern:
                                                entry.type === "DOMAIN"
                                                  ? event.target.value.replace(/^@/, "").toLowerCase()
                                                  : event.target.value.toLowerCase(),
                                            }
                                          : item,
                                      );
                                      const sorted = applyCsvSort(updated, csvSort);
                                      updateCsvSummary(sorted);
                                      return sorted;
                                    })
                                  }
                                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <select
                                  value={entry.action}
                                  onChange={(event) =>
                                    setCsvPreview((prev) => {
                                      const updated = prev.map((item) =>
                                        item.id === entry.id
                                          ? { ...item, action: event.target.value as RuleDraft["action"] }
                                          : item,
                                      );
                                      const sorted = applyCsvSort(updated, csvSort);
                                      updateCsvSummary(sorted);
                                      return sorted;
                                    })
                                  }
                                  className="w-32 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs uppercase text-slate-100 focus:border-emerald-500 focus:outline-none"
                                >
                                  <option value="VIP">VIP</option>
                                  <option value="SUPPRESS">Suppress</option>
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={entry.unless_contains ?? ""}
                                  onChange={(event) =>
                                    setCsvPreview((prev) => {
                                      const updated = prev.map((item) =>
                                        item.id === entry.id
                                          ? {
                                              ...item,
                                              unless_contains: event.target.value.trim().length
                                                ? event.target.value.trim().toLowerCase()
                                                : null,
                                            }
                                          : item,
                                      );
                                      const sorted = applyCsvSort(updated, csvSort);
                                      updateCsvSummary(sorted);
                                      return sorted;
                                    })
                                  }
                                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={entry.notes ?? ""}
                                  onChange={(event) =>
                                    setCsvPreview((prev) => {
                                      const updated = prev.map((item) =>
                                        item.id === entry.id
                                          ? {
                                              ...item,
                                              notes: event.target.value.trim().length
                                                ? event.target.value.trim()
                                                : null,
                                            }
                                          : item,
                                      );
                                      const sorted = applyCsvSort(updated, csvSort);
                                      updateCsvSummary(sorted);
                                      return sorted;
                                    })
                                  }
                                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-400">
                                Row {entry.source.row}
                                <br />
                                {entry.source.column}
                              </td>
                              <td className="px-3 py-2 text-xs text-slate-400">{entry.strategy}</td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => deleteCsvEntries([entry.id])}
                                  className="rounded-md border border-rose-500/60 px-3 py-1 text-xs font-semibold uppercase text-rose-300 hover:bg-rose-500/10"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void confirmCsvImport()}
                      disabled={csvImportPending}
                      className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {csvImportPending ? "Importing…" : `Import ${csvPreview.length} rule${csvPreview.length === 1 ? "" : "s"}`}
                    </button>
                    <button
                      type="button"
                      onClick={closeCsvModal}
                      className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:border-rose-500 hover:text-rose-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  Choose a CSV after selecting the list type to see a preview of detected rules.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
    </ErrorBoundary>
  );
}
