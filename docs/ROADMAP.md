# RADAR Development Roadmap

## Current Priority Order

### 🎯 **#1 - Confidence Slider + VIP-only Toggle** 
- **Status**: ✅ COMPLETE (2025-09-30)
- **Why**: Feel aggression safely without code changes
- **Done when**: Slider (0-1) + toggle persist, poller behavior changes, logs prove it
- **Effort**: Small, Risk: Low

### 🚀 **#2 - Basic VIP/Suppression Rules**
- **Status**: UP NEXT (kickoff pending)
- **Why**: Current email-only system can't handle domains (@wingstop.com) or topics (newsletter)
- **Done when**: Support email, domain, and topic rules with VIP/Suppress actions
- **Effort**: Medium, Risk: Low
- **Scope**: Simple matching logic (contains/equals), dropdown UI (Email/Domain/Topic), no AI parsing
- **Future**: Complex rules like "unless contains" and Tinder-style training later

### 📋 **Remaining Queue**

**#3 - Health Check Endpoint** (XS effort)
- `/api/health` returns `{ ok: true, ts }`

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
- **Advanced VIP/Suppression**: AI parsing (`@abc.com unless overdue`), CSV import, Tinder-style training
- **Complex rule exceptions**: "unless contains" logic
- **Natural language rule entry**: Smart parsing of user intent

---

## Roadmap Notes

- **Priority drives development**: Work items in order unless blocked
- **Effort estimates**: XS (<1hr), S (<4hr), M (<1day), L (<3days)
- **MVP focus**: Basic functionality before advanced features
- **Flexibility**: Can adjust order based on learnings and blockers

---
*Last updated: 2025-09-30*
