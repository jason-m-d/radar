"use client";

import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PAGE_SIZE = 10;
const PRIMARY_TEXT = "#E2E8DD";
const MUTED_TEXT = "rgba(226, 232, 221, 0.65)";
const ACCENT = "#636940";
const DANGER = "#DB4C40";

const PLACEHOLDER = "e.g. suppress newsletters unless urgent";

const CSV_TYPE_OPTIONS = ["EMAIL", "DOMAIN", "TOPIC"] as const;
const CSV_ACTION_OPTIONS = ["VIP", "SUPPRESS"] as const;

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

type SortableColumn = "type" | "pattern" | "action" | "exception" | "notes";
type SortConfig = { column: SortableColumn; direction: "asc" | "desc" } | null;

export default function SignalRulesSection() {
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  const [ruleInput, setRuleInput] = useState("");
  const [parsePending, setParsePending] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<RuleDraft | null>(null);
  const [parseStrategy, setParseStrategy] = useState<string | null>(null);
  const [ruleError, setRuleError] = useState<string | null>(null);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
        const response = await fetch("/api/rules");
        const payload = (await response.json().catch(() => ({}))) as { rules?: RuleRecord[]; message?: string };
        if (!response.ok) {
          throw new Error(payload.message ?? "Failed to load rules");
        }
        if (!active) return;
        setRules(payload.rules ?? []);
        setRulesLoading(false);
        setPage(0);
      } catch (error) {
        if (!active) return;
        setRules([]);
        setRulesLoading(false);
        setToast({
          message: error instanceof Error ? error.message : "Unable to load rules",
          tone: "error",
        });
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!csvModalOpen) {
      return;
    }
    const { style } = document.body;
    const previousOverflow = style.overflow;
    style.overflow = "hidden";
    return () => {
      style.overflow = previousOverflow;
    };
  }, [csvModalOpen]);

  const filteredRules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return rules;
    }
    return rules.filter((rule) => {
      const haystacks = [
        rule.type,
        rule.pattern,
        rule.action,
        rule.unlessContains ?? "",
        rule.notes ?? "",
      ];
      return haystacks.some((value) => value?.toLowerCase().includes(query));
    });
  }, [rules, searchQuery]);

  const sortedRules = useMemo(() => {
    if (!sortConfig) {
      return filteredRules;
    }
    const directionFactor = sortConfig.direction === "asc" ? 1 : -1;
    const typeRank: Record<string, number> = { EMAIL: 0, DOMAIN: 1, TOPIC: 2 };
    const actionRank: Record<string, number> = { VIP: 0, SUPPRESS: 1 };
    const valueOf = (value: string | null | undefined) => (value ?? "").toLowerCase();

    return [...filteredRules].sort((a, b) => {
      switch (sortConfig.column) {
        case "type":
          return ((typeRank[a.type] ?? 99) - (typeRank[b.type] ?? 99)) * directionFactor;
        case "action":
          return ((actionRank[a.action] ?? 99) - (actionRank[b.action] ?? 99)) * directionFactor;
        case "pattern":
          return valueOf(a.pattern).localeCompare(valueOf(b.pattern)) * directionFactor;
        case "exception":
          return valueOf(a.unlessContains).localeCompare(valueOf(b.unlessContains)) * directionFactor;
        case "notes":
          return valueOf(a.notes).localeCompare(valueOf(b.notes)) * directionFactor;
        default:
          return 0;
      }
    });
  }, [filteredRules, sortConfig]);

  const pageCount = Math.max(1, Math.ceil(sortedRules.length / PAGE_SIZE));

  const paginatedRules = useMemo(() => {
    const start = page * PAGE_SIZE;
    return sortedRules.slice(start, start + PAGE_SIZE);
  }, [sortedRules, page]);

  const totalRuleCount = rules.length;
  const filteredRuleCount = filteredRules.length;

  const handleRulesSort = useCallback((column: SortableColumn) => {
    setSortConfig((prev) => {
      if (prev && prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { column, direction: "asc" };
    });
  }, []);

  const rulesSortIndicator = (column: SortableColumn) => {
    if (!sortConfig || sortConfig.column !== column) {
      return "↕";
    }
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };
  useEffect(() => {
    if (page >= pageCount) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, sortConfig]);

  async function refreshRules() {
    setRulesLoading(true);
    try {
      const response = await fetch("/api/rules");
      const payload = (await response.json().catch(() => ({}))) as { rules?: RuleRecord[]; message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to load rules");
      }
      setRules(payload.rules ?? []);
      setRulesLoading(false);
      setPage(0);
    } catch (error) {
      setRulesLoading(false);
      setToast({
        message: error instanceof Error ? error.message : "Unable to refresh rules",
        tone: "error",
      });
    }
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
    setCsvSelectedIds(new Set());
    setCsvSort({ column: "type", direction: "asc" });
    setCsvFilterType("ALL");
    setCsvFilterAction("ALL");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function beginCsvSelection() {
    fileInputRef.current?.click();
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
  const filterDescription = filterDescriptionParts.join(" • ");

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

  function overrideCsvAction(action: "VIP" | "SUPPRESS") {
    setCsvPreview((prev) => {
      const targetIds = new Set(filteredCsv.map((entry) => entry.id));
      const updated = prev.map((entry) => (targetIds.has(entry.id) ? { ...entry, action } : entry));
      const sorted = applyCsvSort(updated, csvSort);
      updateCsvSummary(sorted);
      return sorted;
    });
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
      const sorted = applyCsvSort(normalized, sortState);
      setCsvPreview(sorted);
      updateCsvSummary(sorted);
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
      setToast({ message: `Imported ${count} rule${count === 1 ? "" : "s"}`, tone: "success" });
      closeCsvModal();
    } catch (error) {
      setCsvError(error instanceof Error ? error.message : "Failed to import rules");
    } finally {
      setCsvImportPending(false);
    }
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

  return (
    <div className="space-y-10 text-[14px]" style={{ color: PRIMARY_TEXT }}>
      {toast ? (
        <div
          className="fixed right-6 top-6 rounded-xl px-4 py-2 text-sm font-semibold shadow-lg"
          style={{ background: toast.tone === "success" ? ACCENT : DANGER, color: "#0F0E0E" }}
        >
          {toast.message}
        </div>
      ) : null}

      <header className="space-y-1">
        <h1 className="text-[24px] font-semibold">Signal Rules</h1>
        <p className="text-[14px]" style={{ color: MUTED_TEXT }}>
          Type natural language instructions or upload a CSV to manage advanced routing.
        </p>
      </header>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          type="text"
          value={ruleInput}
          onChange={(event) => {
            setRuleInput(event.target.value);
            setRuleError(null);
          }}
          placeholder={PLACEHOLDER}
          className="flex-1 rounded-lg border border-white/10 bg-[#1E1E1E] px-4 py-3 text-sm transition focus:border-[#636940] focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void parseRuleText()}
            disabled={parsePending || !ruleInput.trim()}
            className="rounded-lg bg-[#E2E8DD] px-4 py-2 text-sm font-semibold text-[#0F0E0E] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {parsePending ? "Parsing…" : "Parse rule"}
          </button>
          <button
            type="button"
            onClick={triggerCsvUpload}
            className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold uppercase text-[#E2E8DD] transition hover:bg-white/10"
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

      {ruleError ? (
        <p className="text-sm" style={{ color: DANGER }}>
          {ruleError}
        </p>
      ) : null}

      {ruleDraft ? (
        <div className="space-y-4 rounded-xl border border-[#636940]/40 bg-[#151515] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: ACCENT }}>
              Rule editor
            </h3>
            {parseStrategy ? (
              <span className="text-xs uppercase" style={{ color: MUTED_TEXT }}>
                Source: {parseStrategy}
              </span>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wider" style={{ color: MUTED_TEXT }}>
              Type
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
                className="rounded-lg border border-[#636940]/40 bg-[#1E1E1E] px-3 py-2 text-sm focus:border-[#636940] focus:outline-none"
              >
                <option value="EMAIL">Email</option>
                <option value="DOMAIN">Domain</option>
                <option value="TOPIC">Topic</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wider" style={{ color: MUTED_TEXT }}>
              Action
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
                className="rounded-lg border border-[#636940]/40 bg-[#1E1E1E] px-3 py-2 text-sm focus:border-[#636940] focus:outline-none"
              >
                <option value="VIP">VIP</option>
                <option value="SUPPRESS">Suppress</option>
              </select>
            </label>
            <label className="md:col-span-2 flex flex-col gap-1 text-xs uppercase tracking-wider" style={{ color: MUTED_TEXT }}>
              Pattern
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
                className="rounded-lg border border-[#636940]/40 bg-[#1E1E1E] px-3 py-2 text-sm focus:border-[#636940] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wider" style={{ color: MUTED_TEXT }}>
              Exception (optional)
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
                className="rounded-lg border border-[#636940]/40 bg-[#1E1E1E] px-3 py-2 text-sm focus:border-[#636940] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wider" style={{ color: MUTED_TEXT }}>
              Notes (optional)
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
                className="rounded-lg border border-[#636940]/40 bg-[#1E1E1E] px-3 py-2 text-sm focus:border-[#636940] focus:outline-none"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-wider" style={{ color: MUTED_TEXT }}>
              Confidence
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
                className="rounded-lg border border-[#636940]/40 bg-[#1E1E1E] px-3 py-2 text-sm focus:border-[#636940] focus:outline-none"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void saveParsedRule()}
              disabled={ruleSaving || !ruleDraft.pattern.trim()}
              className="radar-primary-button disabled:cursor-not-allowed disabled:opacity-50"
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
              className="rounded-none border border-[rgba(232,227,216,0.15)] px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--accent-tropical-indigo)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
      </div>
    </div>
  ) : null}

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E2E8DD]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search rules by email address, domain, topic, type, exception, or notes..."
            className="w-full rounded-lg border border-white/10 bg-[#1E1E1E] px-10 py-2.5 text-sm text-[#E2E8DD] placeholder:text-[#E2E8DD]/40 focus:border-[#636940] focus:outline-none"
          />
        </div>
        {searchQuery ? (
          <span className="text-xs" style={{ color: MUTED_TEXT }}>
            Showing {filteredRuleCount} of {totalRuleCount} rules
          </span>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="min-w-full text-sm">
          <thead className="bg-white/10 text-left text-xs uppercase tracking-wide" style={{ color: PRIMARY_TEXT }}>
            <tr>
              <th className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => handleRulesSort("type")}
                  className="flex items-center gap-1"
                  style={{ color: sortConfig?.column === "type" ? ACCENT : PRIMARY_TEXT }}
                >
                  <span>Type</span>
                  <span className="text-[10px]">{rulesSortIndicator("type")}</span>
                </button>
              </th>
              <th className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => handleRulesSort("pattern")}
                  className="flex items-center gap-1"
                  style={{ color: sortConfig?.column === "pattern" ? ACCENT : PRIMARY_TEXT }}
                >
                  <span>Pattern</span>
                  <span className="text-[10px]">{rulesSortIndicator("pattern")}</span>
                </button>
              </th>
              <th className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => handleRulesSort("action")}
                  className="flex items-center gap-1"
                  style={{ color: sortConfig?.column === "action" ? ACCENT : PRIMARY_TEXT }}
                >
                  <span>Action</span>
                  <span className="text-[10px]">{rulesSortIndicator("action")}</span>
                </button>
              </th>
              <th className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => handleRulesSort("exception")}
                  className="flex items-center gap-1"
                  style={{ color: sortConfig?.column === "exception" ? ACCENT : PRIMARY_TEXT }}
                >
                  <span>Exception</span>
                  <span className="text-[10px]">{rulesSortIndicator("exception")}</span>
                </button>
              </th>
              <th className="px-3 py-3">
                <button
                  type="button"
                  onClick={() => handleRulesSort("notes")}
                  className="flex items-center gap-1"
                  style={{ color: sortConfig?.column === "notes" ? ACCENT : PRIMARY_TEXT }}
                >
                  <span>Notes</span>
                  <span className="text-[10px]">{rulesSortIndicator("notes")}</span>
                </button>
              </th>
              <th className="px-3 py-3">Confidence</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rulesLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center" style={{ color: MUTED_TEXT }}>
                  Loading rules…
                </td>
              </tr>
            ) : totalRuleCount === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center" style={{ color: MUTED_TEXT }}>
                  No rules yet. Parse text or import a CSV to get started.
                </td>
              </tr>
            ) : filteredRuleCount === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center" style={{ color: MUTED_TEXT }}>
                  No rules match your search.
                </td>
              </tr>
            ) : (
              paginatedRules.map((rule) => (
                <tr key={rule.id} className="border-b border-white/10">
                  <td className="px-3 py-3 font-mono uppercase" style={{ color: MUTED_TEXT }}>
                    {rule.type.toLowerCase()}
                  </td>
                  <td className="px-3 py-3 font-mono" style={{ color: PRIMARY_TEXT }}>
                    {rule.type === "DOMAIN" ? `@${rule.pattern}` : rule.pattern}
                  </td>
                  <td className="px-3 py-3" style={{ color: MUTED_TEXT }}>
                    {rule.action.toLowerCase()}
                  </td>
                  <td className="px-3 py-3" style={{ color: PRIMARY_TEXT }}>
                    {rule.unlessContains ?? "—"}
                  </td>
                  <td className="px-3 py-3" style={{ color: PRIMARY_TEXT }}>
                    {rule.notes ?? "—"}
                  </td>
                  <td className="px-3 py-3" style={{ color: PRIMARY_TEXT }}>
                    {typeof rule.confidence === "number" ? rule.confidence.toFixed(2) : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => void removeRule(rule.id)}
                      disabled={deletingId === rule.id}
                      className="rounded-md border border-[#DB4C40]/60 px-3 py-1 text-xs font-semibold uppercase text-[#DB4C40] transition hover:bg-[#DB4C40]/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === rule.id ? "Removing…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-4 text-sm md:flex-row md:items-center md:justify-between">
        <span style={{ color: MUTED_TEXT }}>
          {filteredRuleCount
            ? `Showing ${filteredRuleCount ? page * PAGE_SIZE + 1 : 0}-${Math.min((page + 1) * PAGE_SIZE, filteredRuleCount)} of ${filteredRuleCount}${searchQuery ? ` (filtered from ${totalRuleCount})` : ""}`
            : "No rules"}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
            className="rounded-lg border border-white/20 px-3 py-1 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(pageCount - 1, prev + 1))}
            disabled={page >= pageCount - 1}
            className="rounded-lg border border-white/20 px-3 py-1 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {csvModalOpen ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6 py-8 backdrop-blur"
          onWheelCapture={(event) => event.stopPropagation()}
        >
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col gap-4 overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/95 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: PRIMARY_TEXT }}>
                  Import rules from CSV
                </h3>
                <p className="text-sm" style={{ color: MUTED_TEXT }}>
                  Select the list type, review detected rules, adjust entries inline, then confirm the import.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCsvModal}
                className="rounded-lg border border-white/20 px-3 py-1 text-sm font-medium text-[#E2E8DD] transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium" style={{ color: PRIMARY_TEXT }}>
                  Is this a VIP list or Suppress list?
                </p>
                <div className="mt-2 flex flex-wrap gap-4 text-sm" style={{ color: PRIMARY_TEXT }}>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="csv-action"
                      value="VIP"
                      checked={csvSelectedAction === "VIP"}
                      onChange={() => setCsvSelectedAction("VIP")}
                      className="h-4 w-4 accent-[#636940]"
                    />
                    VIP list (promote entries)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="csv-action"
                      value="SUPPRESS"
                      checked={csvSelectedAction === "SUPPRESS"}
                      onChange={() => setCsvSelectedAction("SUPPRESS")}
                      className="h-4 w-4 accent-[#DB4C40]"
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
                  className="rounded-lg bg-[#E2E8DD] px-4 py-2 text-sm font-semibold text-[#0F0E0E] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {csvAnalyzePending ? "Analyzing…" : "Choose CSV file"}
                </button>
                {csvSummary ? (
                  <span className="text-sm" style={{ color: MUTED_TEXT }}>
                    {csvSummary.totalRules} rules detected • VIP {csvSummary.vipCount} • Suppress {csvSummary.suppressCount}
                  </span>
                ) : null}
              </div>

              {csvError ? (
                <p className="rounded-lg border border-[#DB4C40]/40 bg-[#2A1210] px-3 py-2 text-sm" style={{ color: DANGER }}>
                  {csvError}
                </p>
              ) : null}

              {csvPreview.length ? (
                <div className="flex h-full flex-1 min-h-0 flex-col gap-4 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm" style={{ color: PRIMARY_TEXT }}>
                    <div>
                      {totalRules ? (
                        <span>
                          Showing {filteredSummary.totalRules} of {totalRules} rules
                        </span>
                      ) : (
                        <span>No rules detected</span>
                      )}
                      {filterActive ? (
                        <span className="ml-2 text-xs uppercase tracking-wide" style={{ color: ACCENT }}>
                          Filtered by {filterDescription || "custom"}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: MUTED_TEXT }}>
                      <label className="flex items-center gap-1">
                        Type
                        <select
                          value={csvFilterType}
                          onChange={(event) => setCsvFilterType(event.target.value as typeof csvFilterType)}
                          className="rounded-lg border border-white/10 bg-[#1E1E1E] px-2 py-1 focus:border-[#636940] focus:outline-none"
                        >
                          <option value="ALL">All types</option>
                          <option value="EMAIL">Email</option>
                          <option value="DOMAIN">Domain</option>
                          <option value="TOPIC">Topic</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-1">
                        Action
                        <select
                          value={csvFilterAction}
                          onChange={(event) => setCsvFilterAction(event.target.value as typeof csvFilterAction)}
                          className="rounded-lg border border-white/10 bg-[#1E1E1E] px-2 py-1 focus:border-[#636940] focus:outline-none"
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
                          className="rounded-lg border border-white/20 px-2 py-1 text-[#E2E8DD] transition hover:bg-white/10"
                        >
                          Clear filters
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: MUTED_TEXT }}>
                    <button
                      type="button"
                      onClick={() => overrideCsvAction("VIP")}
                      className="rounded-lg border border-[#636940]/50 px-3 py-1 font-semibold uppercase text-[#E2E8DD] transition hover:bg-[#636940]/20"
                    >
                      Override all as VIP
                    </button>
                    <button
                      type="button"
                      onClick={() => overrideCsvAction("SUPPRESS")}
                      className="rounded-lg border border-[#DB4C40]/50 px-3 py-1 font-semibold uppercase text-[#DB4C40] transition hover:bg-[#DB4C40]/20"
                    >
                      Override all as Suppress
                    </button>
                    <span>
                      {visibleSelectedCount} visible selected
                      {totalSelectedCount !== visibleSelectedCount ? ` (${totalSelectedCount} total)` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkDelete}
                      disabled={!csvSelectedIds.size}
                      className="rounded-lg border border-[#DB4C40]/50 px-3 py-1 font-semibold uppercase text-[#DB4C40] transition hover:bg-[#DB4C40]/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete selected ({totalSelectedCount})
                    </button>
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-white/10">
                    <div className="h-full overflow-auto">
                      <table className="min-w-full text-sm">
                        <thead className="sticky top-0 bg-[#1A1A1A]/95 text-xs uppercase tracking-wide" style={{ color: PRIMARY_TEXT }}>
                          <tr>
                            <th className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={filteredCsv.length > 0 && filteredCsv.every((entry) => csvSelectedIds.has(entry.id))}
                                ref={(element) => {
                                  if (element) {
                                    const allSelected =
                                      filteredCsv.length > 0 && filteredCsv.every((entry) => csvSelectedIds.has(entry.id));
                                    const someSelected = filteredCsv.some((entry) => csvSelectedIds.has(entry.id));
                                    element.indeterminate = someSelected && !allSelected;
                                  }
                                }}
                                onChange={(event) => handleSelectAllVisible(event.target.checked)}
                                className="h-4 w-4 accent-[#636940]"
                              />
                            </th>
                            <th className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleSort("type")}
                                className="flex items-center gap-1 text-xs uppercase"
                                style={{ color: csvSort?.column === "type" ? ACCENT : PRIMARY_TEXT }}
                              >
                                Type <span className="text-[10px]">{sortIndicator("type")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleSort("pattern")}
                                className="flex items-center gap-1 text-xs uppercase"
                                style={{ color: csvSort?.column === "pattern" ? ACCENT : PRIMARY_TEXT }}
                              >
                                Pattern <span className="text-[10px]">{sortIndicator("pattern")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleSort("action")}
                                className="flex items-center gap-1 text-xs uppercase"
                                style={{ color: csvSort?.column === "action" ? ACCENT : PRIMARY_TEXT }}
                              >
                                Action <span className="text-[10px]">{sortIndicator("action")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleSort("unless_contains")}
                                className="flex items-center gap-1 text-xs uppercase"
                                style={{ color: csvSort?.column === "unless_contains" ? ACCENT : PRIMARY_TEXT }}
                              >
                                Exception <span className="text-[10px]">{sortIndicator("unless_contains")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => handleSort("notes")}
                                className="flex items-center gap-1 text-xs uppercase"
                                style={{ color: csvSort?.column === "notes" ? ACCENT : PRIMARY_TEXT }}
                              >
                                Notes <span className="text-[10px]">{sortIndicator("notes")}</span>
                              </button>
                            </th>
                            <th className="px-3 py-2">Source</th>
                            <th className="px-3 py-2">Strategy</th>
                            <th className="px-3 py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCsv.map((entry) => (
                            <tr key={entry.id} className="border-t border-white/10">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={csvSelectedIds.has(entry.id)}
                                  onChange={() => toggleCsvSelection(entry.id)}
                                  className="h-4 w-4 accent-[#636940]"
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
                                  className="w-32 rounded-lg border border-white/10 bg-[#1E1E1E] px-2 py-1 text-xs uppercase focus:border-[#636940] focus:outline-none"
                                >
                                  {CSV_TYPE_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
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
                                  className="w-full rounded-lg border border-white/10 bg-[#1E1E1E] px-2 py-1 text-xs text-[#E2E8DD] focus:border-[#636940] focus:outline-none"
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
                                  className="w-32 rounded-lg border border-white/10 bg-[#1E1E1E] px-2 py-1 text-xs uppercase focus:border-[#636940] focus:outline-none"
                                >
                                  {CSV_ACTION_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                      {option}
                                    </option>
                                  ))}
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
                                  className="w-full rounded-lg border border-white/10 bg-[#1E1E1E] px-2 py-1 text-xs text-[#E2E8DD] focus:border-[#636940] focus:outline-none"
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
                                  className="w-full rounded-lg border border-white/10 bg-[#1E1E1E] px-2 py-1 text-xs text-[#E2E8DD] focus:border-[#636940] focus:outline-none"
                                />
                              </td>
                              <td className="px-3 py-2 text-xs" style={{ color: MUTED_TEXT }}>
                                Row {entry.source.row}
                                <br />
                                {entry.source.column}
                              </td>
                              <td className="px-3 py-2 text-xs" style={{ color: MUTED_TEXT }}>
                                {entry.strategy}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  type="button"
                                  onClick={() => deleteCsvEntries([entry.id])}
                                  className="rounded-md border border-[#DB4C40]/60 px-3 py-1 text-xs font-semibold uppercase text-[#DB4C40] transition hover:bg-[#DB4C40]/10"
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
                      className="rounded-lg bg-[#E2E8DD] px-4 py-2 text-sm font-semibold text-[#0F0E0E] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {csvImportPending ? "Importing…" : `Import ${csvPreview.length} rule${csvPreview.length === 1 ? "" : "s"}`}
                    </button>
                    <button
                      type="button"
                      onClick={closeCsvModal}
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-[#E2E8DD] transition hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: MUTED_TEXT }}>
                  Choose a CSV after selecting the list type to see a preview of detected rules.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
