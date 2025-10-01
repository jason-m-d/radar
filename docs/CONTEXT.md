# RADAR – Context Snapshot (as of 2025-09-30)

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
- **Confidence slider implemented** on 2025-09-29.
  - Settings API with Zod validation
  - UI controls working (slider 0-1, VIP-only toggle)
  - Poller respects confidence thresholds and VIP-only mode
- **AI-powered VIP/Suppression rules shipped** on 2025-09-30.
  - VipSuppressionRule table with exception logic
  - Natural-language parser + CSV import endpoints
  - Poller honors VIP promotions and suppressions with logging

---

## Current VIPs
- `woodydemayo@gmail.com`  
- `jason@hungry.llc`  

---

## Features working
- Gmail poller (read-only scopes), cycles every 3 min.  
- Tasks auto-created from VIP mail with "tasky" phrases.  
- `/tasks` shows tasks (verified real email).  
- `/settings` allows VIP management and advanced rule controls.  
- **Confidence controls**: slider (0-1) and VIP-only toggle with real-time behavior changes
- **Hybrid VIP/Suppression rules**: regex-first parsing, editable confirmations, flexible CSV preview/override workflow, optional AI enrichment; poller applies rules + exceptions
- **Health endpoint**: `/api/health` exposes uptime, version, DB status for deploy checks
- Dev-seed harness working (`npm run dev-seed`).  
- Stable on **http://localhost:3000** with freeport script.  

---

## In Progress
- **Error Handling & Redaction** (#4 priority)
  - Ensure logs redact sensitive data, user-facing errors stay safe
  - Status: Not started; queued next

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
Currently working on: #3 Health Check Endpoint
Next up: #4 Error Handling & Redaction

---

*Last updated: 2025-09-30*
