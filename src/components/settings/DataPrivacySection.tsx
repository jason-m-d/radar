"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";

const CARD_BG = "rgba(35, 35, 35, 0.8)";
const TEXT_MAIN = "#E2E8DD";
const TEXT_DIM = "rgba(226, 232, 221, 0.6)";
const BORDER_COLOR = "rgba(255, 255, 255, 0.08)";
const ACCENT = "#636940";
const DANGER = "#DB4C40";

export default function DataPrivacySection() {
  const [completedTaskRetention, setCompletedTaskRetention] = useState("90");
  const [backBurnerRetention, setBackBurnerRetention] = useState("40");

  return (
    <div className="space-y-6 text-left" style={{ color: TEXT_MAIN }}>
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold">Data & Privacy</h1>
      </header>

      <section className="space-y-4 rounded-xl p-6" style={{ background: CARD_BG }}>
        <div className="border-b pb-4" style={{ borderColor: BORDER_COLOR }}>
          <h2 className="text-[18px] font-medium">Data Retention</h2>
        </div>
        <div className="space-y-4 text-[14px]" style={{ color: TEXT_DIM }}>
          <label className="flex flex-col gap-2">
            <span style={{ color: TEXT_MAIN }}>Keep completed tasks for:</span>
            <select
              value={completedTaskRetention}
              onChange={(event) => setCompletedTaskRetention(event.target.value)}
              className="rounded-lg border px-3 py-2 text-[14px]"
              style={{
                background: "#1E1E1E",
                borderColor: BORDER_COLOR,
                color: TEXT_MAIN,
              }}
            >
              { ["30", "60", "90", "180"].map((value) => (
                <option key={value} value={value}>
                  {value} days
                </option>
              )) }
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <span style={{ color: TEXT_MAIN }}>Keep back burner tasks for:</span>
            <select
              value={backBurnerRetention}
              onChange={(event) => setBackBurnerRetention(event.target.value)}
              className="rounded-lg border px-3 py-2 text-[14px]"
              style={{
                background: "#1E1E1E",
                borderColor: BORDER_COLOR,
                color: TEXT_MAIN,
              }}
            >
              { ["30", "40", "60", "90"].map((value) => (
                <option key={value} value={value}>
                  {value} days
                </option>
              )) }
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl p-6" style={{ background: CARD_BG }}>
        <h2 className="text-[18px] font-medium" style={{ color: TEXT_MAIN }}>
          Export Your Data
        </h2>
        <p className="text-[14px]" style={{ color: TEXT_DIM }}>
          Download your tasks, projects, and settings as JSON.
        </p>
        <button
          type="button"
          className="rounded-lg px-4 py-3 text-[14px] font-medium transition-colors"
          style={{ background: ACCENT, color: "#FEF3EA" }}
        >
          Export All Data
        </button>
      </section>

      <section className="space-y-4 rounded-xl p-6" style={{ background: CARD_BG }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={20} color={DANGER} className="mt-0.5" />
          <p className="text-[14px]" style={{ color: DANGER }}>
            Permanently delete all your RADAR data. This cannot be undone.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg px-4 py-3 text-[14px] font-medium transition-colors"
          style={{ background: DANGER, color: "#FEF3EA" }}
        >
          Delete All Data
        </button>
      </section>
    </div>
  );
}
