"use client";

import { useState } from "react";

const CARD_BG = "rgba(35, 35, 35, 0.8)";
const BORDER_COLOR = "rgba(255, 255, 255, 0.08)";
const TEXT_MAIN = "#E2E8DD";
const TEXT_DIM = "rgba(226, 232, 221, 0.6)";
const ACCENT = "#636940";

function Toggle({
  label,
  checked,
  onChange,
  showDivider,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  showDivider?: boolean;
}) {
  return (
    <label
      className="flex items-center justify-between gap-4 py-4"
      style={showDivider ? { borderBottom: `1px solid ${BORDER_COLOR}` } : undefined}
    >
      <span className="text-[16px]" style={{ color: TEXT_MAIN }}>
        {label}
      </span>
      <span className="relative inline-flex h-7 w-14 cursor-pointer items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-label={label}
        />
        <span
          className="absolute inset-0 rounded-full bg-[#1E1E1E] transition-colors peer-checked:bg-[#636940]"
          style={{ border: `1px solid ${BORDER_COLOR}` }}
        />
        <span
          className="relative left-1 h-5 w-5 rounded-full bg-[#E2E8DD] transition peer-checked:translate-x-7"
          style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
        />
      </span>
    </label>
  );
}

export default function NotificationsSection() {
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(false);
  const [badgeCount, setBadgeCount] = useState(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietFrom, setQuietFrom] = useState("21:00");
  const [quietTo, setQuietTo] = useState("07:00");
  const [deliveryMethod, setDeliveryMethod] = useState("in-app");

  return (
    <div className="space-y-6 text-left" style={{ color: TEXT_MAIN }}>
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold">Notifications</h1>
      </header>

      <section
        className="space-y-4 rounded-xl p-6"
        style={{ background: CARD_BG }}
      >
        <div className="border-b pb-4" style={{ borderColor: BORDER_COLOR }}>
          <h2 className="text-[18px] font-medium" style={{ color: TEXT_MAIN }}>
            Ping Preferences
          </h2>
        </div>
        <div>
          <Toggle
            label="Desktop notifications"
            checked={desktopNotifications}
            onChange={setDesktopNotifications}
            showDivider
          />
          <Toggle
            label="Sound alerts"
            checked={soundAlerts}
            onChange={setSoundAlerts}
            showDivider
          />
          <Toggle label="Badge count" checked={badgeCount} onChange={setBadgeCount} />
        </div>
      </section>

      <section
        className="space-y-4 rounded-xl p-6"
        style={{ background: CARD_BG }}
      >
        <div className="border-b pb-4" style={{ borderColor: BORDER_COLOR }}>
          <h2 className="text-[18px] font-medium" style={{ color: TEXT_MAIN }}>
            Quiet Hours
          </h2>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row">
          <label className="flex flex-col gap-2 text-[14px]" style={{ color: TEXT_DIM }}>
            From
            <input
              type="time"
              value={quietFrom}
              onChange={(event) => setQuietFrom(event.target.value)}
              className="rounded-lg border px-3 py-2 text-[14px]"
              style={{
                background: "#1E1E1E",
                borderColor: BORDER_COLOR,
                color: TEXT_MAIN,
              }}
            />
          </label>
          <label className="flex flex-col gap-2 text-[14px]" style={{ color: TEXT_DIM }}>
            To
            <input
              type="time"
              value={quietTo}
              onChange={(event) => setQuietTo(event.target.value)}
              className="rounded-lg border px-3 py-2 text-[14px]"
              style={{
                background: "#1E1E1E",
                borderColor: BORDER_COLOR,
                color: TEXT_MAIN,
              }}
            />
          </label>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[14px]" style={{ color: TEXT_DIM }}>
            Pause all pings during quiet hours
          </span>
          <span className="relative inline-flex h-7 w-14 cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={quietHoursEnabled}
              onChange={(event) => setQuietHoursEnabled(event.target.checked)}
              aria-label="Pause pings during quiet hours"
            />
            <span
              className="absolute inset-0 rounded-full bg-[#1E1E1E] transition-colors peer-checked:bg-[#636940]"
              style={{ border: `1px solid ${BORDER_COLOR}` }}
            />
            <span
              className="relative left-1 h-5 w-5 rounded-full bg-[#E2E8DD] transition peer-checked:translate-x-7"
              style={{ boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
            />
          </span>
        </div>
      </section>

      <section
        className="space-y-4 rounded-xl p-6"
        style={{ background: CARD_BG }}
      >
        <div className="border-b pb-4" style={{ borderColor: BORDER_COLOR }}>
          <h2 className="text-[18px] font-medium" style={{ color: TEXT_MAIN }}>
            Delivery Method
          </h2>
        </div>
        <div className="space-y-3 text-[14px]" style={{ color: TEXT_DIM }}>
          {[
            { id: "in-app", label: "In-app only" },
            { id: "email", label: "Email summaries" },
            { id: "both", label: "Both" },
          ].map((option) => (
            <label key={option.id} className="flex items-center justify-between gap-4">
              <span className="text-[16px]" style={{ color: TEXT_MAIN }}>
                {option.label}
              </span>
              <input
                type="radio"
                name="delivery"
                value={option.id}
                checked={deliveryMethod === option.id}
                onChange={(event) => setDeliveryMethod(event.target.value)}
                style={{ accentColor: ACCENT }}
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
