# RADAR

RADAR is a proactive, chat-first assistant that watches your inbox, surfaces VIP signals, and structures tasks before work slips through the cracks.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `config/google.json` (see `config/README`) and run the OAuth helper:
   ```bash
   npm run prisma
   npx prisma generate
   tsx scripts/google-auth-setup.ts
   ```
3. Start RADAR:
   ```bash
   npm run dev
   ```

`npm run dev` launches the Next.js app and the Gmail poller concurrently. Configure VIP senders by inserting a `gmail:vips` entry in the `Setting` table (array of lowercase email addresses).
