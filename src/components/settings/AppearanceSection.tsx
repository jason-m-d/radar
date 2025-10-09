"use client";

import { useState } from "react";

const CARD_BG = "rgba(35, 35, 35, 0.8)";
const TEXT_MAIN = "#E2E8DD";
const TEXT_DIM = "rgba(226, 232, 221, 0.6)";
const BORDER_COLOR = "rgba(255, 255, 255, 0.08)";
const ACCENT = "#636940";

type ThemeOption = "dark" | "light" | "auto";
type DensityOption = "compact" | "comfortable" | "spacious";

const THEME_CARDS: Array<{ id: ThemeOption; label: string; background: string }> = [
  {
    id: "dark",
    label: "Dark",
    background: "linear-gradient(135deg, #0F0E0E 0%, #2A2928 100%)",
  },
  {
    id: "light",
    label: "Light",
    background: "linear-gradient(135deg, #FEF3EA 0%, #E2E8DD 100%)",
  },
  {
    id: "auto",
    label: "Auto",
    background: "linear-gradient(135deg, #0F0E0E 0%, #0F0E0E 50%, #FEF3EA 50%, #E2E8DD 100%)",
  },
];

export default function AppearanceSection() {
  const [theme, setTheme] = useState<ThemeOption>("dark");
  const [density, setDensity] = useState<DensityOption>("comfortable");

  return (
    <div className="space-y-6 text-left" style={{ color: TEXT_MAIN }}>
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold">Appearance</h1>
      </header>

      <section className="space-y-4 rounded-xl p-6" style={{ background: CARD_BG }}>
        <div className="border-b pb-4" style={{ borderColor: BORDER_COLOR }}>
          <h2 className="text-[18px] font-medium">Theme</h2>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          {THEME_CARDS.map((option) => {
            const isActive = theme === option.id;
            return (
              <div key={option.id} className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTheme(option.id)}
                  className="rounded-lg transition-transform hover:-translate-y-0.5"
                  style={{
                    width: "120px",
                    height: "80px",
                    background: option.background,
                    border: isActive ? `2px solid ${ACCENT}` : `2px solid ${BORDER_COLOR}`,
                    boxShadow: isActive ? "0 6px 14px rgba(99, 105, 64, 0.28)" : "0 4px 10px rgba(0,0,0,0.25)",
                  }}
                  aria-pressed={isActive}
                />
                <span
                  className="text-[14px] font-medium"
                  style={{ color: isActive ? TEXT_MAIN : TEXT_DIM }}
                >
                  {option.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4 rounded-xl p-6" style={{ background: CARD_BG }}>
        <div className="border-b pb-4" style={{ borderColor: BORDER_COLOR }}>
          <h2 className="text-[18px] font-medium">Density</h2>
          <p className="mt-1 text-[14px]" style={{ color: TEXT_DIM }}>
            Affects spacing and font sizes throughout the app.
          </p>
        </div>
        <div className="space-y-3">
          {[
            { id: "compact", label: "Compact" },
            { id: "comfortable", label: "Comfortable" },
            { id: "spacious", label: "Spacious" },
          ].map((option) => (
            <label key={option.id} className="flex items-center justify-between">
              <span className="text-[16px]" style={{ color: TEXT_MAIN }}>
                {option.label}
              </span>
              <input
                type="radio"
                name="density"
                value={option.id}
                checked={density === option.id}
                onChange={(event) => setDensity(event.target.value as DensityOption)}
                style={{ accentColor: ACCENT }}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
