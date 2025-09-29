# RADAR

RADAR is a proactive, chat-first assistant that watches your inbox, surfaces VIP signals, and structures tasks before work slips through the cracks.

## Local Development

- Node 22 (see `.nvmrc`).
- Install dependencies with `npm install`.
- Start the stack with `npm run dev` (Next.js + poller on port 3000).
- Visit `/settings` to manage VIP senders/domains.
- Optional helpers:
  - `npm run dev-seed` — inserts a dev thread/task for smoke testing.
  - `npm run freeport` — interactively frees port 3000 if another process is bound.

Before starting, create `config/google.json` (see `config/README`) and run the OAuth helper:

```bash
npm run prisma
npx prisma generate
tsx scripts/google-auth-setup.ts
```

## MVP Acceptance Checks

1. VIP ping appears in main chat within ≤3 minutes of arrival.
2. “Tasky” phrasing triggers task creation with correct state.
3. Clicking a ping opens a subchat containing summary and thread link.
4. Calendar adds de-duplicate by threadId plus event fields.
5. Confidence slider flips between “ask first” and “act when confident.”

## Real-Mail Validation (Dev Flow)

1. Add your VIP sender via `/settings` (e.g., `jason@hungry.llc`).
2. Run a single poller cycle with `runPollerCycle()` to capture counts.
3. Send a real email from the VIP sender.
4. Run `runPollerCycle()` again; confirm counts increase and `/tasks` lists the new task by title.
