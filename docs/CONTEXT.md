# RADAR – Context Snapshot (as of 2025-09-29)

This file exists to preserve important context between Codex sessions.  
Codex should read this file at session start to load current state.

---

## Milestones
- **Smoke test (real mail) passed** on 2025-09-29.  
  - Threads = 3  
  - Tasks = 3  
  - VIP count = 2  
- 2025-09-30: Confidence slider + VIP-only toggle shipped with poller "ask-first" gating.
- Repo pushed to GitHub: https://github.com/jason-m-d/radar  
- Local Node version = **22.x** (matches `.nvmrc`). Deps rebuilt.  

---

## Current VIPs
- `woodydemayo@gmail.com`  
- `jason@hungry.llc`  

---

## Features working
- Gmail poller (read-only scopes), cycles every 3 min with confidence + VIP-only controls.  
- Tasks auto-created from VIP mail with "tasky" phrases, with ask-first logging below threshold.  
- `/tasks` shows tasks (verified real email).  
- `/settings` manages VIP list plus confidence slider (0-1) and VIP-only toggle.  
- Dev-seed harness working (`npm run dev-seed`).  
- Stable on **http://localhost:3000** with freeport script.  

---

## In Progress
- Queuing roadmap #2: Smart VIP/Suppression Management (design pending)  
- Monitoring confidence/vip-only telemetry after launch  

---

## Rules & Guardrails
- Codex must treat Jason as a coding novice; no assumptions.  
- Always explain steps with [Terminal] / [Editor] / [Browser].  
- End every reply with "Next action for Jason" or "No action needed; ready for next step."  
- No secrets in logs.  
- Ask before schema migrations or file moves.  
- Auto-apply safe commands, batch them when possible.  

---

## Development Priorities
See **docs/ROADMAP.md** for the full 11-item prioritized roadmap.  
Next up: #2 Smart VIP/Suppression Management (after confidence slider completes).

---

*Last updated: 2025-09-30*
