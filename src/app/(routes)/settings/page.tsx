"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import AccountSettingsSection from "@/components/settings/AccountSettingsSection";
import SignalRulesSection from "@/components/settings/SignalRulesSection";
import BehaviorSection from "@/components/settings/BehaviorSection";
import NotificationsSection from "@/components/settings/NotificationsSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import DataPrivacySection from "@/components/settings/DataPrivacySection";

const NAV_ITEMS = [
  { id: "account", label: "Account" },
  { id: "signal-rules", label: "Signal Rules" },
  { id: "behavior", label: "Behavior" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "data-privacy", label: "Data & Privacy" },
];

const NAV_LABEL_MAP = NAV_ITEMS.reduce<Record<string, string>>((acc, item) => {
  acc[item.id] = item.label;
  return acc;
}, {});

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState("account");
  const [contentOpacity, setContentOpacity] = useState(1);
  const router = useRouter();

  useEffect(() => {
    setContentOpacity(0);
    const timer = window.setTimeout(() => setContentOpacity(1), 20);
    return () => window.clearTimeout(timer);
  }, [activeSection]);

  const activeLabel = useMemo(() => NAV_LABEL_MAP[activeSection] ?? "", [activeSection]);

  const renderSection = () => {
    if (activeSection === "account") {
      return <AccountSettingsSection />;
    }

    if (activeSection === "signal-rules") {
      return <SignalRulesSection />;
    }

    if (activeSection === "behavior") {
      return <BehaviorSection />;
    }

    if (activeSection === "notifications") {
      return <NotificationsSection />;
    }

    if (activeSection === "appearance") {
      return <AppearanceSection />;
    }

    if (activeSection === "data-privacy") {
      return <DataPrivacySection />;
    }

    return (
      <div
        className="flex h-full flex-col items-center justify-center text-center text-[#E2E8DD]"
        style={{ opacity: 0.6 }}
      >
        <p className="text-[16px] font-medium">{activeLabel} settings coming soon.</p>
        <p className="mt-2 text-[14px]">Refer to docs/DESIGN.md before implementing this section.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#0F0E0E] p-4">
      <div className="flex w-full gap-4">
        <aside
          className="flex w-[280px] flex-col rounded-xl border bg-[#1E1E1E] p-4"
          style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
        >
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2 text-[14px] font-medium transition-colors hover:bg-white/10 hover:opacity-100"
            style={{ color: "#E2E8DD", opacity: 0.7 }}
          >
            <ArrowLeft size={16} />
            Back to Chat
          </button>
          <div className="mb-6 text-[20px] font-semibold text-[#E2E8DD]">Settings</div>
          <nav className="flex flex-col gap-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className="w-full rounded-lg px-3 py-3 text-left text-[16px] font-medium text-[#E2E8DD] transition-colors"
                  style={{
                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.05)" : "transparent",
                    color: "#E2E8DD",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div
            className="mt-auto flex items-center gap-3 rounded-lg border p-3"
            style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#DB4C40] text-[14px] font-medium text-[#E2E8DD]">
              JM
            </div>
            <div className="space-y-0.5">
              <div className="text-[14px] font-medium text-[#E2E8DD]">Jason Miller</div>
              <div className="text-[12px] text-[#E2E8DD]" style={{ opacity: 0.7 }}>
                jason@hungry.llc
              </div>
            </div>
          </div>
        </aside>
        <main
          className="flex-1 rounded-xl border bg-[#0F0E0E] p-8"
          style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
        >
          <div
            className="min-h-[460px] transition-opacity duration-200"
            style={{ opacity: contentOpacity }}
          >
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}
