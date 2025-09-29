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
- Guided flow introduces RADAR, re-surfaces forgotten threads, suggests VIPs, and calibrates suppression rules.
- Users set tone, autonomy aggressiveness, and confidence thresholds while granting email, Drive, and calendar scopes.
- Onboarding delivers immediate value by highlighting one task, one ping, and one project.

## UI & Interaction Notes
- Chat UI is the single surface; subchats animate in with breadcrumbing and connector lines to original pings.
- Drafts expose version history controls; settings host autonomy and tone adjustments.
- Long-press actions reveal reasons, undo/delete, and archival options; notifications stay lightweight and non-disruptive.

## Edge Cases & Policies
- Calendar additions must de-dupe via deterministic IDs or event field comparisons.
- Low-confidence detections prompt clarification instead of unilateral action.
- Ignored pings re-surface after inactivity or thread completion without hijacking focus.
- Deleted auto-generated items should not be recreated; privacy modes can narrow inbox scope.

## MVP Scope
- Must include Gmail read access, chat-first interface, real-time pings, autonomous task extraction, basic project grouping, safe calendar adds, onboarding, confidence controls, and undo/feedback loops.
- Future phases push into Drive editing, external integrations, richer automation, and shared dashboards.

## Day in the Life Snapshot
Morning pings highlight urgent VIP messages and stale threads, opening subchats with summaries and inferred tasks. Midday, RADAR drafts documents using Drive context and helps schedule events while flagging conflicts. Throughout the day, main chat and Tasks/Projects tab keep work visible, with non-disruptive VIP alerts and project-specific instructions. Evening digest summarizes movement, and the assistant resets for the next day.

## Non-Goals / Privacy / Acceptance
- Non-Goals (MVP): no Slack integration, Drive write/editing, Gmail push (polling only), payments; Google scopes remain read-only.
- Data & Privacy: persist only metadata and essential snippets, redact PII in logs, store MCP memory locally as JSONL.
- Acceptance Checks: VIP pings land in main chat within three minutes; “Tasky” phrasing generates correctly staged tasks; pings open subchats with summaries and thread links; calendar adds de-dupe by threadId plus event fields; confidence slider flips between asking and acting behaviors.
