# RADAR Development Roadmap

## Current Priority Order

### ✅ **#1 - Confidence Slider + Signal-only Toggle** 
- **Status**: COMPLETE ✅
- **Completed**: 2025-09-29
- **What works**: Settings API, UI controls, poller behavior changes, persistence

### 🎯 **#2 - Smart Signal Filtering (VIP/Suppression Rules)**
- **Status**: COMPLETE ✅ (2025-09-30)
- **Why**: Current email-only system can't handle domains (@wingstop.com) or topics (newsletter)
- **Deliverables**: Natural-language parser + CSV import + poller exception-aware routing
- **Effort**: Medium, Risk: Low
- **Notes**: Rules surface priority signals (VIP action) and suppress noise (SUPPRESS action) using regex patterns, topic matching, optional `unless` exceptions, editable confirmations, hybrid parsing, and flexible CSV preview with overrides

### ✅ **#3 - Health Check Endpoint**
- **Status**: COMPLETE ✅ (2025-09-30)
- **Deliverables**: `/api/health` returns `{ ok, timestamp, version, uptimeSeconds, environment, checks }`
- **Notes**: Includes DB connectivity probe and JSON suitable for deploy monitoring

### ✅ **#4 - Action Messages System**
- **Status**: COMPLETE ✅ (2025-10-06)
- **Deliverables**:
  - ACTION and CATCHUP message rendering via `ActionMessage` component with embedded cards
  - Catch-up aggregation flow on app load that summarizes unread actions and marks originals read
  - Snooze/back-burner interactions connected to task/project metadata and confidence chip display
- **Post-MVP Enhancements**: Real-time push delivery, advanced liquid-style animation for data flow

### 🎯 **#5 - UI/UX Implementation** (CURRENT PRIORITY)
- **Status**: IN PROGRESS 🚧 (~75% complete)
- **Started**: 2025-10-03
- **Why**: Core user experience needs to be built - all backend exists, need frontend
- **Design**: Complete (Figma exports + DESIGN.md)
- **Deliverables**: 
  - ✅ Main chat interface with message components
  - ✅ Action cards with connecting lines
  - ✅ Sidebar with Tasks/Projects toggle
  - ✅ Subchat system (task + project) with overlay
  - ✅ Task details pane with collapsible sections
  - ✅ Settings page (all 6 sections)
  - ✅ Back Burner section
  - ✅ Ignored section (new)
  - ✅ All core dock interactions (Accept, Snooze, Back Burner, Ignore)
  - ✅ CommitmentDock redesign with untouched/expanded/snooze states
  - 🚧 Email thread expansion pane (open email button pending)
  - 🚧 RADAR Suggestions tiles (partial)
  - 🚧 Snooze cancellation UI
  - 🚧 Persistent action buttons (Copy, Retry, Thumbs up/down)
  - ✅ Core animations (subchat slide, pulse effects, hover states, width transitions)
- **Effort**: XL (multiple days, building component by component)
- **Risk**: Medium (complex UI, many moving parts)
- **Integration**: Connects to existing API routes and Prisma models
- **Notes**: Following DESIGN.md specs exactly, building in phases
- **CommitmentDock redesign** (COMPLETE ✅ 2025-10-08): 
  - New button layout: untouched (1 + button) → expanded (4 controls)
  - Snooze flow with inline prompt and confirmation
  - Width animations: 180px → 196px → 420px
  - Cards stay in queue when snoozed (grey + clock icon)
  - All actions working: Accept, Snooze, Back Burner, Ignore
  - Reset script for testing: `npm run reset-dock`

### 📋 **Remaining Queue**

**#6 - Error Handling & Redaction** (S effort)
- No email/subject leaks, count-only logs, user-safe error messages

**#7 - Simple Audit Trail** (M effort)
- AuditEvent table tracks who/what/when with reason

**#8 - Manual Task Status Updates** (M effort)
- Task row menus update state, filters work

**#9 - Daily Digest** (M effort)
- "What moved today" in main chat on command

**#10 - Gmail Deep-Links + Subchat Polish** (S-M effort)
- "View thread" links, 1-paragraph summaries

**#11 - Heuristic Tuning & Test Harness** (M effort)
- Sample message tests, negative cases, false-positive tracking

**#12 - Deploy Prep + CI** (S-M effort)
- GitHub Actions, build tests, DEPLOY.md docs

**#13 - Signal-First Mode** (M effort)
- Keyword capture beyond current rules, noise warnings

---

## Future Enhancements (Post-MVP)
- **Advanced Signal Filtering (VIP/Suppression)**: AI parsing (`@abc.com unless overdue`), Tinder-style training
- **Complex rule exceptions**: "unless contains" logic
- **Natural language rule entry**: Smart parsing of user intent

---

## Roadmap Notes

- **Priority drives development**: Work items in order unless blocked
- **Effort estimates**: XS (<1hr), S (<4hr), M (<1day), L (<3days)
- **MVP focus**: Basic functionality before advanced features
- **Storage**: All data in local SQLite during development

---
*Last updated: 2025-10-06*
