"use client";

import { useMemo, useState } from "react";

const CARD_BG = "rgba(35, 35, 35, 0.8)";
const BORDER_COLOR = "rgba(255, 255, 255, 0.08)";
const TEXT_MAIN = "#E2E8DD";
const TEXT_DIM = "rgba(226, 232, 221, 0.6)";
const ACCENT = "#636940";

const AUTONOMY_LABELS = ["Conservative", "Balanced", "Aggressive"] as const;

export default function BehaviorSection() {
  const [autonomyLevel, setAutonomyLevel] = useState<number>(1);
  const [signalOnlyMode, setSignalOnlyMode] = useState<boolean>(false);

  const autonomyLabel = useMemo(() => AUTONOMY_LABELS[autonomyLevel] ?? "Balanced", [autonomyLevel]);

  return (
    <div className="space-y-6 text-left" style={{ color: TEXT_MAIN }}>
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold" style={{ color: TEXT_MAIN }}>
          Behavior
        </h1>
      </header>

      <section
        className="space-y-6 rounded-xl p-6"
        style={{ background: CARD_BG }}
      >
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[16px] font-medium" style={{ color: TEXT_MAIN }}>
                Autonomy Level
              </p>
              <span className="text-[14px]" style={{ color: TEXT_DIM }}>
                {autonomyLabel}
              </span>
            </div>
            <p className="text-[14px]" style={{ color: TEXT_DIM }}>
              Moderate inference: RADAR acts when confident, asks when uncertain.
            </p>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={1}
            value={autonomyLevel}
            onChange={(event) => setAutonomyLevel(Number(event.target.value))}
            className="w-full"
            style={{ accentColor: ACCENT }}
            aria-label="Autonomy level"
          />
          <div className="flex items-center justify-between text-[12px]" style={{ color: TEXT_DIM }}>
            {AUTONOMY_LABELS.map((label, index) => (
              <span
                key={label}
                style={{ opacity: autonomyLevel === index ? 1 : 0.7 }}
                className="uppercase tracking-wide"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="h-px w-full" style={{ background: BORDER_COLOR }} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[16px] font-medium" style={{ color: TEXT_MAIN }}>
              Signal-only mode
            </p>
            <p className="text-[14px]" style={{ color: TEXT_DIM }}>
              Only show emails that pass VIP rules.
            </p>
          </div>
          <label className="relative inline-flex h-7 w-14 cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={signalOnlyMode}
              onChange={(event) => setSignalOnlyMode(event.target.checked)}
              aria-label="Toggle signal-only mode"
            />
            <span
              className="absolute inset-0 rounded-full bg-[#1E1E1E] transition-colors peer-checked:bg-[#636940]"
              style={{ border: `1px solid ${BORDER_COLOR}` }}
            />
            <span
              className="relative left-1 h-5 w-5 rounded-full bg-[#E2E8DD] transition peer-checked:translate-x-7"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
