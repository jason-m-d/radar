# RADAR – Context Snapshot (as of 2025-09-29)

This file exists to preserve important context between Codex sessions.  
Codex should read this file at session start to load current state.

---

## Milestones
- **Smoke test (real mail) passed** on 2025-09-29.  
  - Threads = 3  
  - Tasks = 3  
  - VIP count = 2  
- Repo pushed to GitHub: https://github.com/jason-m-d/radar  
- Local Node version = **22.x** (matches `.nvmrc`). Deps rebuilt.  

---

## Current VIPs
- `woodydemayo@gmail.com`  
- `jason@hungry.llc`  

---

## Features working
- Gmail poller (read-only scopes), cycles every 3 min.  
- Tasks auto-created from VIP mail with “tasky” phrases.  
- `/tasks` shows tasks (verified real email).  
- `/settings` allows VIP management.  
- Dev-seed harness working (`npm run dev-seed`).  
- Stable on **http://localhost:3000** with freeport script.  

---

## Rules & Guardrails
- Codex must treat Jason as a coding novice; no assumptions.  
- Always explain steps with [Terminal] / [Editor] / [Browser].  
- End every reply with “Next action for Jason” or “No action needed; ready for next step.”  
- No secrets in logs.  
- Ask before schema migrations or file moves.  
- Auto-apply safe commands, batch them when possible.  

---

## Next Priorities (open)
- Add confidence slider + “VIP-only” toggle in `/settings`.  
- Add `/api/health` endpoint for deploy checks.  
- Prep GitHub Actions CI (Node 22, build + tsc).  
- Prep Vercel deploy checklist.  

---

*Last updated: 2025-09-29*
