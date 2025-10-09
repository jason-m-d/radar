# RADAR Project Overview

## Vision
RADAR is a proactive, chat-first assistant that curates inbox and document chaos into actionable context. It promises to surface what matters, intervene before deadlines slip, and operate as a trusted teammate while leaving final control with the user.

## Differentiators
- Leads with autonomous pings and structuring instead of reactive commands.
- Puts a single conversation hub at the center of the product experience.
- Grounds decisions in live email, Drive, calendar, and persistent memory context.
- Allows fine-grained tuning of tone, autonomy, and suppression rules.
- Builds trust through transparency, undo paths, and explicit “why” explanations.

## Core Experience
- Main chat is the persistent home for pings, responses, and guidance.
- Subchats slide in from pings or user requests, keeping context linked visually.
- A secondary Tasks/Projects tab lists tracked work and opens into the same conversational flow.
- Pings arrive in real time when thresholds are met, with RADAR balancing proactive drafts vs clarifying questions based on confidence.

## Core Features
- **Action messages**: Poller-detected signals generate ACTION chat entries with embedded task/project cards, confidence scoring, and direct controls for open, snooze, or Back Burner. Opening the app triggers a catch-up POST to `/api/messages/catchup` that rolls unread actions into a CATCHUP summary pinned to the top of the conversation.

## Terminology
- **Signal** = Email thread that passed VIP/suppression filters and needs attention
- **Noise** = Email that was suppressed (filtered out)
- **Signal rules** = VipSuppressionRule table entries (VIP + SUPPRESS actions)
- **Signal thread** = EmailThread with isVip=true in the database

RADAR's job is to surface signals and hide noise, keeping Jason focused on what matters.

## Integrations & Data Sources
- Gmail (or equivalent) content and metadata power task detection and prioritization.
- Google Drive read access supplies supporting docs and references for drafts.
- Calendar awareness checks for missed events, conflicts, and new invite details.
- A persistent memory store summarizes prior chats, projects, and context snippets for retrieval.

## Signal & Push Strategy
- MVP polls Gmail every three minutes using the stored `historyId`, backing off exponentially with jitter on 429/5xx responses while redacting PII in logs.
- Phase 2 upgrades subscribe to Gmail push via Pub/Sub, secured HTTPS webhooks, and weekly `users.watch` renewals with replay from the last `historyId` on gaps.
- Idempotent processing uses `threadId` plus normalized subject/sender tuples to avoid duplicate tasks, projects, or calendar events.
- Health metrics track poll executions, processed messages, created tasks, ping latency, error counts, and the nightly chat digest generation.

## Task & Project Logic
- Tasks are inferred from explicit language and contextual cues, scored for priority and confidence, and kept in states: To Do, Waiting on Them, Waiting on You, Done.
- Projects group related tasks via participants, subjects, threads, or semantic similarity, and sit in In Progress or Done states.
- Users can merge, split, rename, or delete RADAR-created items, and feedback tunes future autonomy.
- Versioning and undo protect against unwanted autonomous actions.

## Onboarding & Personalization
- Guided flow introduces RADAR, re-surfaces forgotten threads, suggests signal candidates, and calibrates suppression rules.
- Users set tone, autonomy aggressiveness, and confidence thresholds while granting email, Drive, and calendar scopes.
- Onboarding delivers immediate value by highlighting one task, one ping, and one project.

## UI & Interaction Notes
**Implementation Note**: All measurements, colors, and styling specifications are documented in `docs/DESIGN.md`. Always reference that file for exact values when implementing UI components.

### Main Chat Interface
- Full-screen chat window with RADAR messages on left (with radar ping icon) and user messages on right (with avatar)
- **RADAR message interactions**: Each RADAR message has persistent action buttons below (always visible, no hover required):
  - Copy button (clipboard icon)
  - Retry button (refresh icon)
  - Thumbs up button (feedback)
  - Thumbs down button (feedback)
  - Buttons are small (20-24px icons), dimmed when idle, left-aligned below message
- Sidebar shows Tasks/Projects toggle with compact task cards
- Task cards display: status badge, due date with day of week, store numbers, priority, and assignee
- Settings and user profile at bottom of sidebar

### Action Cards & Signal Messages
- RADAR sends proactive "action messages" (green cards) within chat when signals require attention
- Action message design: unified message bubble with embedded task card
- Main bubble color: #5b4842 (brown) with #fef3ea (cream) text
- Task card connected via thick vertical line (4-6px, #5b4842)
- Task card uses linear gradient (130°): #5b4842 → #425b48
- Layout: checkmark icon (left), task details (center), arrow icon (right)
- Single cohesive visual unit, not nested containers
- Click task card or arrow to open subchat

### Subchat Pattern
- Clicking an action card triggers arrow animation that "pulls" subchat into view (350ms smooth transition)
- Subchat slides in from right, leaving ~80px of main chat visible (with dim overlay)
- Each subchat maintains isolated conversation thread specific to that task/project
- Subchat persists: scroll position, conversation history, and collapsed section states preserved across sessions

### Task Details Pane
- When subchat opens, sidebar transforms into collapsible task details pane
- Task info section (always visible):
  - Task title (large, bold)
  - Status badge: colored dot + text (separate line)
  - Due date: "Due [day-of-week] [month] [day]" format
  - Generic tag pills (can be any category: locations, stores, departments, etc.)
  - Priority + Assignee on one line
  - Project link (if applicable): "Project: [name]" with arrow
- Collapsible sections with hover-to-open behavior:
  - Hover: auto-opens after 200ms, auto-closes after 300ms when hover ends
  - Click while hovering: pins section open (stays open without hover)
  - Click pinned section: unpins (returns to hover behavior)
  - Sections: Original Email, Attached Files (with count), Related Content, Activity Timeline
- Action buttons:
  - Complete Task: primary button (olive/green), animates to checkmark
  - Snooze: secondary button (outline), triggers timeframe tile selection
  - Back Burner: text link (dimmed), soft-archives task for 40 days
  - All confirmations appear as RADAR messages (left side), not user messages
- RADAR Suggestions: 3 contextual suggestion tiles above chat input (not in sidebar)
- Back Burner section: collapsible at bottom of sidebar (collapsed by default), shows count, dimmed styling

### Task Actions & Workflows
- **Complete Task**: Button animates to checkmark, RADAR confirms and preserves context for 40 days
- **Snooze**: RADAR offers interactive timeframe tiles (Later today, Tomorrow, Next week, Custom)
- **Back Burner**: Soft-archives task with RADAR note about retrieval; moves to Back Burner section
- All actions show undo banner for 30 seconds
- Due date updates trigger subtle pulse animation (scale + highlight)

### Smart Features
- RADAR typing indicator (animated dots) appears while processing
- Smart date detection: when user mentions dates, RADAR offers to update due date with Yes/No buttons
- Project linking: tasks can be added to projects from details pane dropdown
- Subtask creation: checklist button in input area for quick child task generation
- **"Catch me up" feature**: Button in input area provides contextual overview and direction
  - Main chat: Summary of action-needed tasks, upcoming meetings, recent activity
  - Task subchat: Context about task status, blockers, next steps
  - Project subchat: Project progress, blocking tasks, upcoming milestones
  - Helps overcome blank screen paralysis with proactive guidance

### Navigation & States
- Back arrow or ESC closes subchat and restores main view
- URL updates to /chat/task/[id] for shareable links
- Active task in sidebar gets subtle highlight
- All animations are smooth (200-350ms) with professional easing, never bouncy

### Design Philosophy
- Dark theme with glassmorphic elements and subtle depth
- Separate containers for sidebar and chat area with rounded corners and borders
- Consistent spacing (16px margins, controlled padding)
- Professional animations that feel connected and purposeful
- Focus on reducing visual clutter while maintaining information density

### Settings Interface
- Full-screen view with sidebar navigation (Account, Signal Rules, Behavior, Notifications, Appearance, Data & Privacy)
- Settings organized in cards with clear hierarchy
- **Account**: Profile management, connected services (Gmail, Drive, Calendar) with sync status
- **Signal Rules**: Natural language input + CSV upload, spreadsheet-style table for rule management, search and filters
- **Behavior**: Single autonomy slider (Conservative/Balanced/Aggressive), signal-only mode toggle
- **Notifications**: Ping preferences, quiet hours, delivery method (in-app/email/both)
- **Appearance**: Theme selector (Dark/Light/Auto), density options (Compact/Comfortable/Spacious)
- **Data & Privacy**: Retention settings (completed tasks, back burner), export data, delete data
- All settings auto-save with subtle confirmation

## Edge Cases & Policies
- Calendar additions must de-dupe via deterministic IDs or event field comparisons.
- Low-confidence detections prompt clarification instead of unilateral action.
- Ignored pings re-surface after inactivity or thread completion without hijacking focus.
- Deleted auto-generated items should not be recreated; privacy modes can narrow inbox scope.

## MVP Scope
- Must include Gmail read access, chat-first interface, real-time pings, autonomous task extraction, basic project grouping, safe calendar adds, onboarding, confidence controls, and undo/feedback loops.
- Future phases push into Drive editing, external integrations, richer automation, and shared dashboards.

## Day in the Life Snapshot
Morning pings highlight urgent signal threads and stale conversations, opening subchats with summaries and inferred tasks. Midday, RADAR drafts documents using Drive context and helps schedule events while flagging conflicts. Throughout the day, main chat and Tasks/Projects tab keep work visible, with non-disruptive signal alerts and project-specific instructions. Evening digest summarizes movement, and the assistant resets for the next day.

## Non-Goals / Privacy / Acceptance
- Non-Goals (MVP): no Slack integration, Drive write/editing, Gmail push (polling only), payments; Google scopes remain read-only.
- Data & Privacy: persist only metadata and essential snippets, redact PII in logs, store MCP memory locally as JSONL.
- Acceptance Checks: Signal pings land in main chat within three minutes; “Tasky” phrasing generates correctly staged tasks; pings open subchats with summaries and thread links; calendar adds de-dupe by threadId plus event fields; confidence slider flips between asking and acting behaviors.
