# RADAR Development Roadmap

## Current Priority Order

### ✅ **#1 - Confidence Slider + VIP-only Toggle** 
- **Status**: COMPLETE ✅
- **Completed**: 2025-09-29
- **What works**: Settings API, UI controls, poller behavior changes, persistence

### 🎯 **#2 - Basic VIP/Suppression Rules**
- **Status**: COMPLETE ✅ (2025-09-30)
- **Why**: Current email-only system can't handle domains (@wingstop.com) or topics (newsletter)
- **Deliverables**: Natural-language parser + CSV import + poller exception-aware routing
- **Effort**: Medium, Risk: Low
- **Notes**: Rules cover email/domain/topic, optional `unless` exceptions, hybrid parsing, editable confirmations, and flexible CSV preview with overrides

### ✅ **#3 - Health Check Endpoint**
- **Status**: COMPLETE ✅ (2025-09-30)
- **Deliverables**: `/api/health` returns `{ ok, timestamp, version, uptimeSeconds, environment, checks }`
- **Notes**: Includes DB connectivity probe and JSON suitable for deploy monitoring

### 📋 **Remaining Queue**

**#4 - Error Handling & Redaction** (S effort)
- No email/subject leaks, count-only logs, user-safe error messages

**#5 - Simple Audit Trail** (M effort)
- AuditEvent table tracks who/what/when with reason

**#6 - Manual Task Status Updates** (M effort)
- Task row menus update state, filters work

**#7 - Daily Digest** (M effort)
- "What moved today" in main chat on command

**#8 - Gmail Deep-Links + Subchat Polish** (S-M effort)
- "View thread" links, 1-paragraph summaries

**#9 - Heuristic Tuning & Test Harness** (M effort)
- Sample message tests, negative cases, false-positive tracking

**#10 - Deploy Prep + CI** (S-M effort)
- GitHub Actions, build tests, DEPLOY.md docs

**#11 - VIP+Filtered Mode** (M effort)
- Keyword capture beyond VIPs, noise warnings

---

## Future Enhancements (Post-MVP)
- **Advanced VIP/Suppression**: AI parsing (`@abc.com unless overdue`), Tinder-style training
- **Complex rule exceptions**: "unless contains" logic
- **Natural language rule entry**: Smart parsing of user intent

---

## Roadmap Notes

- **Priority drives development**: Work items in order unless blocked
- **Effort estimates**: XS (<1hr), S (<4hr), M (<1day), L (<3days)
- **MVP focus**: Basic functionality before advanced features
- **Storage**: All data in local SQLite during development

---
*Last updated: 2025-09-30*
