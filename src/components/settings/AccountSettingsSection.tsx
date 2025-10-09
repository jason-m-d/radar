"use client";

import { Calendar, Camera, CheckCircle, HardDrive, Mail, Pencil } from "lucide-react";

const CARDS_BG = "rgba(35, 35, 35, 0.8)";
const CARD_BORDER_RADIUS = "12px";
const ACCENT_BORDER = "rgba(255, 255, 255, 0.1)";
const BADGE_BG = "rgba(99, 105, 64, 0.3)";

const CONNECTED_ACCOUNTS = [
  { id: "gmail", name: "Gmail", icon: Mail, lastSync: "12 minutes ago" },
  { id: "drive", name: "Google Drive", icon: HardDrive, lastSync: "47 minutes ago" },
  { id: "calendar", name: "Calendar", icon: Calendar, lastSync: "2 hours ago" },
];

export default function AccountSettingsSection() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-[24px] font-semibold text-[#E2E8DD]">Account</h1>
      </header>

      <section
        className="mb-4 flex flex-col gap-6 p-6"
        style={{ background: CARDS_BG, borderRadius: CARD_BORDER_RADIUS }}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DB4C40] text-[24px] font-semibold text-[#E2E8DD]">
                JM
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border bg-[#1E1E1E]"
                style={{ borderColor: "rgba(255, 255, 255, 0.12)" }}
                aria-label="Change profile photo"
              >
                <Camera size={16} className="text-[#E2E8DD]" />
              </button>
            </div>
            <div>
              <div className="text-[18px] font-medium text-[#E2E8DD]">Jason Miller</div>
              <div className="text-[14px] text-[#E2E8DD]" style={{ opacity: 0.7 }}>
                jason@hungry.llc
              </div>
            </div>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border px-4 py-3 text-[14px] font-medium text-[#E2E8DD] transition-colors"
            style={{ borderColor: ACCENT_BORDER }}
          >
            <Pencil size={16} />
            Edit Profile
          </button>
        </div>
      </section>

      <section
        className="space-y-4 p-6"
        style={{ background: CARDS_BG, borderRadius: CARD_BORDER_RADIUS }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[18px] font-medium text-[#E2E8DD]">Connected Accounts</h2>
            <p className="text-[14px] text-[#E2E8DD]" style={{ opacity: 0.7 }}>
              Manage the services RADAR uses to curate your workspace.
            </p>
          </div>
        </div>
        <div className="space-y-4">
          {CONNECTED_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            return (
              <div
                key={account.id}
                className="flex items-center justify-between gap-6 border border-transparent rounded-lg px-4 py-4"
                style={{ borderColor: "rgba(255, 255, 255, 0.04)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ background: "rgba(255, 255, 255, 0.08)" }}
                  >
                    <Icon size={20} className="text-[#E2E8DD]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-[16px] font-medium text-[#E2E8DD]">{account.name}</span>
                      <span
                        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium"
                        style={{ background: BADGE_BG, color: "#636940" }}
                      >
                        <CheckCircle size={14} />
                        Connected
                      </span>
                    </div>
                    <div className="text-[12px] text-[#E2E8DD]" style={{ opacity: 0.5 }}>
                      Last sync: {account.lastSync}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-lg border px-4 py-2 text-[14px] font-medium text-[#E2E8DD] transition-colors"
                  style={{ borderColor: ACCENT_BORDER }}
                >
                  Reconnect
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
