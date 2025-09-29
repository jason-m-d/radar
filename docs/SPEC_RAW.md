RADAR — Proactive Chat-First Assistant (App Overview) ⸻ 1. High-Level Vision & Promise
Name: RADAR
Tagline / Elevator Pitch: The assistant you never have to hire, but always have.
Core Promise: RADAR doesn’t wait for you to dig through your inbox — it notices what matters, nudges you before things slip, and turns scattered email & documents into structured tasks, projects, and meaningful context. It aims to feel like a trusted teammate who watches your back, organizes your world, and speaks up when it matters — without taking control away from you.
⸻
2. Key Differentiators
• Proactivity first: RADAR initiates — it pings you when important things land (VIP emails, deadlines, shifts in conversations).
• Chat as primary UI, not a tool among tools: You live inside a conversation. Everything — tasks, projects, calendar, docs — orbits that chat.
• Autonomous structuring: RADAR creates tasks and projects on its own (when confident), not always waiting your command.
• Deep contextual grounding: Before generating suggestions, RADAR consults your email, Drive, calendar, and project memory.
• Adaptive, user-configurable behavior: You can tune aggressiveness, set suppression rules, adjust tone, control autonomy.
• Transparency & trust built in: Drafts require approval, undo paths exist, “why” explanations are available behind the scenes.
• Persistent memory + retrieval: Conversations, projects, and threads persist across sessions, with smart summarization + retrieval to overcome token limits.
⸻
3. Core Experience & Interaction Model
3.1 Chat-First Interface
• On launch, RADAR opens a single persistent chat window (your “home base”). You don’t toggle into separate email or task modules — the chat is always foreground.
• RADAR sends you messages (pings), you respond, you ask questions, all in one thread.
• You can also open subchats for specific threads, tasks, projects — but the flow is always conversational.
3.2 Navigation: Main Chat ↔ Subchats
• When RADAR pings you (e.g. “You have an overdue thread with John”), clicking that message causes the main chat to slide left, revealing a subchat tied to that topic. A visual line or connector traces from the original ping to show continuity.
• Subchats are focused dialogues about a given email thread, task, or project.
• You can swipe or click “Back” to return to main chat.
• You can also summon subchats by asking (e.g., “What’s going on with Project Remodel?”) at any time.
3.3 Tasks & Projects Tab (Secondary UI)
• A top-level second tab: Tasks / Projects — accessible from chat.
• Shows a list view of all tracked tasks and projects, with filters (e.g. “Due soon,” “Waiting on you,” “Waiting on them,” “Done”).
• Clicking a task or project in that tab opens the corresponding subchat (or context view).
• Users can manually create tasks/projects or intervene (merge, split, reassign) on items RADAR generated.
3.4 Ping / Nudge Behavior (Proactivity)
• RADAR pings you as soon as relevant email arrives (if thresholds are met) — not only in digest mode.
• You can configure:
• VIP-only pings (conservative) or
• VIP + filtered pings (more aggressive)
• Not every ping includes an “offer to draft next steps.” Only when RADAR judges further action is needed will it include a prompt like: “Do you want me to sketch a draft?” or even automatically generate a draft (with versioning) to review.
• For low-confidence cases, RADAR asks clarifying questions instead of acting.
• If a new ping arrives while you’re deep in another chat, it doesn’t yank focus. Instead, it appends a parenthetical note (e.g. “(By the way, Susie mentioned XYZ)”). Later, when appropriate (end of topic or inactivity), it follows up.
⸻
4. Data & Context Integration
4.1 Email + Metadata
• RADAR connects your Gmail (or another email provider) to read message content, metadata (senders, recipients, thread IDs), time stamps.
• Uses this as primary knowledge to detect tasks, relations, priorities, and conversation structure.
4.2 Google Drive & Documents
• RADAR reads (in MVP) your Google Drive documents for context: referencing existing files, scanning for relevant links.
• In longer term, RADAR can create / edit documents via Drive integration.
• When drafting something (e.g. an SOP, memo, report), RADAR pulls in relevant draft fragments from Drive so suggestions feel grounded.
4.3 Calendar Awareness
• RADAR parses emails for event info (dates, times, invite links).
• If it identifies an event not already on your calendar, it will add it (with your approval) — checking for duplicates/conflicts.
• If conflict arises, RADAR notifies you of overlap and suggests resolution paths.
• When new details arrive in a thread tied to an event, RADAR revisits that event (i.e. it doesn’t forget simply because the user is elsewhere).
4.4 Memory Store & Retrieval
• RADAR keeps a memory store of past conversations, task/project summaries, subchat contexts.
• It compresses older content into summaries so the chat prompt buffer stays manageable.
• On any user query or pivot, relevant memory is retrieved and injected to keep answers coherent.
• Anchors and context seeds (per project/subchat) help maintain continuity without flooding the prompt window.
⸻
5. Task & Project Logic
5.1 Task Detection & Extraction
• Uses explicit signal cues (“please send,” “due,” “complete by”) but also infers tasks from adjacent context in related messages.
• Evaluates metadata (sender importance, thread recency, subject) to assign confidence scores to candidate tasks.
• Each task gets a priority score (how urgent / important).
• Task states:
• To Do
• Waiting on Them
• Waiting on You
• Done
5.2 Projects & Grouping
• RADAR auto-groups tasks into projects when they share subject, participants, thread link, or semantic similarity.
• Projects have states: In Progress or Done
• Users may inject system prompts into subchat (e.g. “Track this vendor’s invoices; expect document from X”) to help RADAR focus.
• Manual controls: merge, split, reassign, rename, delete.
5.3 Versioning & Undo
• If RADAR creates tasks, projects, or drafts autonomously, the user can:
• Delete via UI or chat (“Hey RADAR, delete task”).
• Undo or revert that change.
• See version history for drafts or project descriptions.
• RADAR learns from user deletions / overrides — negative feedback influencing future behavior.
⸻
6. Ping / Draft Behavior & Confidence
• A confidence threshold (user-tunable) governs how aggressively RADAR acts.
• Below threshold: ask clarifying questions.
• Above threshold: autonomously generate drafts / tasks / projects.
• RADAR will include context in pings sometimes, revealing why it flagged something (“Because this message included these keywords and came from your CFO”).
• High-stakes actions (sending, booking, buying) are always gated behind explicit user approval.
⸻
7. Onboarding & Personalization
• Progressive onboarding flow:
1. RADAR introduces itself, explains capabilities.
2. It surfaces a few threads and asks “Do you care about these?” (forgotten threads).
3. It suggests VIPs (“You email John a lot — is he VIP?”).
4. It suggests suppression defaults for newsletters / low-value senders.
5. It asks tone preference, autonomy aggressiveness, and confidence sensitivity.
• It delivers value immediately in onboarding (one task, one ping, one project) to hook trust.
• It transparently requests permission scopes (email, drive, calendar) before use.
⸻
8. UI / Visual & Behavior Notes
• No separate message list — only the chat exists (main + subchats).
• Subchat visuals: connector line from ping, slide animation, breadcrumb or context header (project name / thread).
• Draft version button in subchat view (top corner) to access version history.
• Settings pane: toggles for confidence thresholds, autonomy level, tone presets, suppression/VIP settings.
• Long-press / menu: in chat messages, reveal “Why am I seeing this?” or “Delete / Undo / Archive” actions.
• Notification UI: lightweight banners or badges rather than full modal popups.
• Context injection: small contextual summaries (from memory) can appear as info snippets in chat (“Here’s summary of earlier part of this project”).
⸻
9. Edge Cases & Granular Policies
• Duplicate event protection: RADAR should generate a deterministic eventId or check existing events to avoid needless duplication.
• Mis-detection / hallucination: when RADAR’s confidence is uncertain, it’s responsible to ask rather than act.
• Ignored / deferred pings: if user doesn’t act, RADAR retries after inactivity or topic-end.
• Interruption management: RADAR won’t yank focus mid-subchat — uses parentheticals, defers full dives.
• Deleted auto-items: user deletions feed feedback loops; RADAR should not auto-recreate a repeatedly deleted task.
• Privacy mode switching: user can opt to read only VIP / selective threads rather than full inbox.
⸻
10. MVP Scope vs Future Phases
MVP (must-have features first):
• Gmail & metadata read access
• Chat-first interface (main chat + subchat)
• Realtime pinging under basic rules
• Autonomous task extraction (imperative / explicit)
• Basic project grouping
• Calendar add (safe duplicates)
• Onboarding flow
• Confidence threshold control
• Undo / delete and feedback learning
Future phases (once core is stable):
• Document editing / Drive write integration
• News or topic tracking (beyond email)
• Timeline / roadmap visualizations
• Slack / chat channel integrations
• Richer AI that anticipates multi-step workflows
• Export / share project dashboards
⸻
11. Sample “Day-in-the-Life” Narrative (Illustrative)
It’s 9:05 AM. You boot RADAR. Before reading email, a ping appears: “You have 2 unread emails from CFO and legal. Also, your thread with John’s vendor looks stale (5 days, no reply).” You click the second ping; subchat slides in, showing thread summary + relevant messages. RADAR surfaces an inferred task: “Ask for price quote from vendor by Thursday.” It’s confidence 0.82 (> your threshold), so the task is already created. You glance at it, tweak the title, then click Back.
Later, you get a message from corporate: “We need your input on the kitchen remodel design — fill survey.” RADAR automatically drafts a short memo outline (pulling context from a earlier Drive doc). It pings: “Here’s a draft I pulled together. Want me to import to Docs?” You click through, review, and press “Export to Docs.”
Midday, an email surfaces: “Meeting Thursday at 3:00 — dress code, agenda attached.” RADAR sees your calendar is free, adds the event (with you approval). Because it overlapped a meeting from a week ago, RADAR warns: “Overlap with your sales meeting — move or keep?”
In the Tasks tab, you see three active tasks, two projects in progress. You click into “Remodel Project,” tell RADAR: “Watch for invoices from Company A.” That becomes part of its internal system prompt.
In the afternoon, while working in another subchat, a VIP email arrives. RADAR doesn’t disrupt you — it appends in parentheses: “(By the way — client X emailed about contract)”. After you finish your reply, RADAR pings more fully. It does not re-ping if left ignored, but will revisit at topic end or after 10 minutes idle.
At 5:30 PM, you get your evening digest: “Here’s what moved today: 3 new VIP emails, your task from John is due tomorrow, and your remodel project got a new incoming thread.” You confirm or suppress a few. RADAR then sleeps — ready tomorrow.

⸻
12. Signal Delivery & Reliability Addenda
12.1 Signal Pipeline (MVP)
• Poll Gmail every three minutes using the last stored `historyId` as the starting checkpoint.
• Apply exponential backoff with jitter when receiving 429 or 5xx responses.
• Redact PII in application logs; store only metadata necessary for debugging.
12.2 Push Upgrade Path (Phase 2)
• Subscribe to Gmail push via Pub/Sub topic delivering to an HTTPS webhook secured with an auth header.
• Renew `users.watch` subscriptions weekly to avoid expiry lapses.
• On webhook gaps or failures, replay events from the last stored `historyId`.
12.3 Idempotent Processing
• Deduplicate threads, tasks, and events using `threadId` plus normalized subject and sender metadata.
• Guard against double-creation when retries occur after transient errors.
12.4 Health & Metrics
• Track poll runs, messages processed, tasks created, ping latency, and error counts.
• Produce a nightly chat digest summarizing activity and system health signals.

## MVP Non-Goals / Privacy / Acceptance
- Non-Goals (MVP): no Slack integration, no Drive write/editing, no Gmail push (polling only), no payments; Google scopes read-only.
- Data & Privacy: store only metadata + minimal snippets; redact PII in logs; MCP memory stored locally as JSONL.
- Acceptance Checks:
  1) VIP email → ping shows in main chat within ≤3 minutes.
  2) “Tasky” phrase detected → Task created with correct state.
  3) Clicking a ping opens a subchat with summary & thread link.
  4) Calendar add avoids duplicates (de-dupe by threadId + event fields).
  5) Confidence slider changes behavior (ask vs act).
