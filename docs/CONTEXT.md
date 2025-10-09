# RADAR – Context Snapshot (as of 2025-10-01)

This file exists to preserve important context between Codex sessions.  
Codex should read this file at session start to load current state.

---

## Milestones
- **Action Messages system shipped** on 2025-10-06.  
  - Chat now renders ACTION and CATCHUP types with task/project cards, snooze + back-burner controls, catch-up summary on load.  
  - `/api/messages/catchup` aggregates unread action items, marks originals read, and surfaces summary at top of chat.  
- **Smoke test (real mail) passed** on 2025-09-29.  
  - Threads = 3  
  - Tasks = 3  
  - Signal count = 2  
- Repo pushed to GitHub: https://github.com/jason-m-d/radar  
- Local Node version = **22.x** (matches `.nvmrc`). Deps rebuilt.  
- **Confidence slider implemented** on 2025-09-29.
  - Settings API with Zod validation
  - UI controls working (slider 0-1, signal-only toggle)
  - Poller respects confidence thresholds and signal-only mode
- **AI-powered signal filtering (VIP/Suppression) shipped** on 2025-09-30.
  - VipSuppressionRule table with exception logic
  - Natural-language parser + CSV import endpoints
  - Poller surfaces signals (VIP action) and suppresses noise with logging

---

## Current signal sources
- `woodydemayo@gmail.com`  
- `jason@hungry.llc`  

---

## Features working

- Gmail poller (read-only scopes), cycles every 3 min.  
- Tasks auto-created from signal mail with "tasky" phrases.  
- `/tasks` shows tasks (verified real email).  
- `/settings` allows signal filter management and advanced rule controls.  
- **Confidence controls**: slider (0-1) and signal-only toggle with real-time behavior changes
- **Hybrid signal filtering rules (VIP/Suppression)**: regex-first parsing, editable confirmations, flexible CSV preview/override workflow, optional AI enrichment; poller applies rules + exceptions (VipSuppressionRule stores both surface-as-signal and suppress-as-noise actions)
- **Health endpoint**: `/api/health` exposes uptime, version, DB status for deploy checks
- Dev-seed harness working (`npm run dev-seed`).  
- Stable on **http://localhost:3000** with freeport script.  

## Email Direction & Commitment Tracking
- Poller watches both INBOX and SENT labels so every thread carries an `EmailDirection` of INCOMING, OUTGOING, or BOTH.
- Gmail Label System: Processed emails get RADAR/Processed label to prevent duplicate tasks.
- Outgoing threads auto-mark as VIP signals and feed body text through Claude Sonnet to detect commitments or follow-up questions.
- Confirmed commitments create TODO tasks with optional due dates and generate ACTION messages summarizing the promise and reasoning.

---

## In Progress
- **UI/UX Implementation** (Priority: High)
  - Design phase complete in Figma (main chat, subchat, settings)
  - Next: Create DESIGN.md with design tokens
  - Then: Begin Codex implementation of UI components
  - Status: Design complete, ready for implementation

- **Error Handling & Redaction** (#4 priority)
  - Ensure logs redact sensitive data, user-facing errors stay safe
  - Status: Queued after UI implementation

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
See **docs/ROADMAP.md** for the full prioritized roadmap.  
Currently working on: #5 UI/UX Implementation (action messages milestone is done)
Next up: #6 Error Handling & Redaction


## Chat System
Messages stored in Message table. Each chat request fetches last 10 signal threads (isVip=true), 20 active tasks, and 10 projects to provide context. System prompt includes formatted context summary so Claude can proactively surface what needs attention.

---

## Action Messages Architecture
- **Message Types**: `MessageType.REGULAR`, `MessageType.ACTION`, and `MessageType.CATCHUP`. ACTION rows can link directly to `taskId`/`projectId`, with additional IDs captured in `metadata.taskIds`/`metadata.projectIds`. `confidence`, `isRead`, and `snoozedUntil` track assistant certainty and follow-up state.
- **Creation Flow**: Poller writes ACTION messages whenever detections create or update tasks. On app load the client POSTs to `/api/messages/catchup`; if unread ACTION rows exist, the API creates a CATCHUP summary message, marks originals as read, and returns the structured payload.
- **Rendering**: `/src/components/ChatMessage.tsx` routes ACTION/CATCHUP messages into the `ActionMessage` component. That component fetches task/project summaries, displays the brown primary bubble, attaches embedded cards, shows a confidence chip, and exposes Open/Snooze/Back Burner controls.
- **Interaction Handlers**: `onRead`, `onSnooze`, and `onBackBurner` call REST endpoints to mark messages read, schedule follow-ups, or move tasks to Back Burner. A lightweight `animateDataFlow(messageId, taskId)` helper pulses the destination task card after actions.
- **User Experience**: CATCHUP messages pin to the top of chat after load, summarizing outstanding work with embedded task cards the user can open. Snooze prompts branch back into RADAR with canned timeframes or custom scheduling.

### Task Carousel Overview
- ACTION messages with two or more linked tasks now render a `TaskCarousel`, showing compact `MiniTaskCard` tiles in a horizontal scroll row.
- Selecting a tile reveals the purple `TaskCard` `action-expanded` variant beneath the carousel so users can read full task context without losing place.
- Completing a task from the carousel immediately updates local state and auto-selects the next incomplete card to keep momentum.
- Snooze, Reschedule, and Back Burner still rely on the existing vertical control stack until dedicated carousel controls are implemented.
- Interaction tracking: `Message.isInteracted` flips to `true` via `/api/messages/[id]/interact` once a user opens a carousel task, enabling UI to suppress repeat prompts.
- AI summaries: `/api/carousel/summary` posts task IDs/titles to Anthropic and returns a natural sentence with `{curly-brace}` task markers plus an ID→text map for highlighting.
- Commitment Dock: ACTION messages are suppressed from the main timeline; `/src/components/CommitmentDock.tsx` surfaces the queue above the input, calling `onTaskUpdate` to refresh sidebar data after interactions.
  - Flow: Email → Task + ACTION Message → Dock (uninteracted) → User acts → isInteracted=true → Task appears in sidebar
- New action messages (Oct 2025 onward) are handled exclusively by CommitmentDock above the chat input; `ActionMessage` remains for legacy records.
- `page.tsx` filters ACTION-type messages out of the main feed before rendering `ChatMessage` entries.
- Commitment lifecycle: unseen (green) ➜ seen (dark green) when expanded card closes via `/api/messages/[id]/seen`, ignored (dark gray) via `/api/messages/[id]/ignore`, and after 48 hours ignored tasks auto-move to Back Burner via `moveIgnoredToBackBurner` in `scripts/poller.ts`.

---

## Settings Architecture

**Layout Structure:**
- Full-width layout with 280px fixed sidebar + flex-1 main content area
- 16px gap between sidebar and main content
- Back navigation button at top of sidebar (returns to /chat)
- 6 navigation items: Account, Signal Rules, Behavior, Notifications, Appearance, Data & Privacy
- User profile (avatar, name, email) at bottom of sidebar
- Active section gets rgba(255,255,255,0.05) background highlight

**Section Components:**
- Each section is isolated React component in `/src/components/settings/`
- ActiveSection state controls which component renders
- 200ms opacity transition when switching sections
- All sections follow DESIGN.md glassmorphic styling:
  - Cards: rgba(35,35,35,0.8) background, 12px border-radius, 24px padding
  - Borders: rgba(255,255,255,0.1)
  - Text: #E2E8DD base, 0.6 opacity for descriptions
  - Accent color: #636940 for buttons, toggles, active states

**Section Details:**
1. **Account**: User profile card (avatar, name, email, Edit Profile button), Connected Accounts card (Gmail/Drive/Calendar with sync status and Reconnect buttons). UI-only, no backend yet.

2. **Signal Rules**: Simplified to rule management only. Natural language parser input + Parse rule button, Upload CSV button, rules table with delete. Fully functional with existing API endpoints (/api/rules, /api/rules/parse, /api/rules/import). CSV modal with preview, filters, bulk actions. NO VIP textarea or confidence slider (moved to Behavior).

3. **Behavior**: Autonomy Level slider (0=Conservative, 1=Balanced, 2=Aggressive) with description updates, Signal-only mode toggle. Replaced old confidence threshold. UI-only, needs new API endpoint.

4. **Notifications**: Ping Preferences (Desktop notifications, Sound alerts, Badge count toggles), Quiet Hours (From/To time pickers + toggle), Delivery Method (In-app only/Email summaries/Both radios). UI-only, needs backend.

5. **Appearance**: Theme selector (Dark/Light/Auto visual cards), Density radios (Compact/Comfortable/Spacious). UI-only, needs theme system.

6. **Data & Privacy**: Data Retention dropdowns (completed tasks 90 days, back burner 40 days), Export All Data button, Delete All Data button (destructive red). UI-only, needs export/delete APIs.

**Current State:**
- Settings UI complete and navigable
- Signal Rules section fully functional (maintains all existing rule management APIs)
- All other sections are UI-only shells awaiting backend integration
- No settings persist yet except Signal Rules

## Subchat Architecture

### Isolated Conversation Threads
- Each task/project has its own subchat with isolated conversation history
- Subchats maintain separate Message records linked to parent task/project
- Main chat and subchats share same message components but query different message sets
- URL structure: `/chat` for main, `/chat/task/[id]` for task subchats, `/chat/project/[id]` for projects

### State Persistence
- Subchat state persists across sessions:
  - Scroll position in message area
  - Collapsed/expanded state of side pane sections
  - Full conversation history
  - Last viewed timestamp
- State stored in browser localStorage or database depending on data type
- Reopening a subchat restores exact previous state (no "welcome back" interruption)

### Animation Patterns
- **Arrow Pull Animation**: 350ms smooth transition with momentum transfer effect
  - Arrow extends from action card to screen edge
  - Subchat slides in as arrow "pulls" it into view
  - Slight elastic deceleration at end (micro-settle)
  - Reverse animation when closing
- **Pulse Effect**: Used for due date updates
  - Scale: 1.0 → 1.05 → 1.0 over 600ms
  - Subtle highlight color fade over 300ms
- **Section Collapse**: 200ms ease transition with chevron rotation
- All animations use professional easing curves (cubic-bezier), never bouncy springs

### Component Patterns

**Collapsible Sections:**
- Chevron icon rotates 90° on expand
- Smooth height transition (200ms ease)
- Hover state on section headers
- Remember user preferences per section

**Undo Banners:**
- Appear at bottom of subchat after actions (Complete, Snooze, Back Burner)
- Persist for 30 seconds or until dismissed
- Include action description and undo button
- Clicking undo reverses action and triggers RADAR acknowledgment

**Typing Indicators:**
- Three animated dots that pulse in sequence
- Appears with RADAR icon while processing
- Replaces with actual message when ready
- Same pattern used in both main chat and subchats

**"Catch Me Up" Button:**
- Located in text input area (left side with other input controls)
- Icon: Circular arrows (⟳) or compass
- Provides contextual overview based on current view:
  - Main chat: Summary of action-needed tasks, meetings, recent signals
  - Task subchat: Task status, time since opened, blockers, suggested next steps
  - Project subchat: Progress summary, blocking tasks, upcoming milestones
- Click triggers RADAR to send proactive guidance message
- Helps users overcome decision paralysis and get oriented
- Shows loading spinner while RADAR composes response

**Action Cards:**
- Green message bubbles containing task/project metadata
- Include clickable arrow that triggers subchat animation
- Show inline preview: due date, stores, priority
- Part of RADAR's message stream but visually distinct

**RADAR Message Interactions:**
- Each RADAR message has persistent action buttons below (always visible, no hover)
- Four buttons: Copy (clipboard), Retry (refresh), Thumbs Up (feedback), Thumbs Down (feedback)
- Buttons: 20-24px icons, 32-36px touch targets, dimmed when idle (40% opacity)
- 8px gap between buttons, left-aligned below message
- Hover: brightness increase, accent color
- Only appear on RADAR messages (left side), not user messages

### Task Details Pane Transformation
- Sidebar morphs from task list to details pane when subchat opens
- Same 300ms animation timing as subchat entrance
- Collapsible with chevron button (48px collapsed width)
- Sections load data asynchronously as they expand
- Breadcrumb navigation shows path back to task list

### Smart Features Integration

**RADAR Suggestions:**
- Context-aware action suggestions based on task data and conversation
- 2-3 suggestions per task, updated as conversation progresses
- Click suggestion → populates input field
- Suggestions stored in database, generated by AI based on task context

**Smart Date Detection:**
- Natural language date parsing in user messages
- RADAR detects phrases like "next Friday", "in 2 weeks"
- Offers inline Yes/No buttons to confirm due date change
- Updates task with pulse animation on confirmation

**Project Linking:**
- Tasks can be linked to projects via dropdown in details pane
- If task already in project, shows clickable project name → opens project subchat
- If no project, shows "+Add to project" button
- Project relationship stored in Task.projectId

---

*Last updated: 2025-10-06*
