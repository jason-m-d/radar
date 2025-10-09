# RADAR Working Agreement

## Collaborating with Codex
- Review `PROJECT.md` and `STATE/TODAY.md` before starting work to align on current goals and constraints.
- Share a brief plan for multi-step tasks, track progress, and update STATE files when outcomes change scope or risk.
- Summarize command outputs instead of pasting raw logs; highlight failures or surprises immediately.

## Design System Adherence
- Always reference `docs/DESIGN.md` for any UI/UX implementation work.
- Use exact values from `DESIGN.md`: colors (hex codes), spacing (px values), typography (font sizes/weights), shadows, border radius, and component specs.
- Never guess at styling values - if it's not in `DESIGN.md`, ask Jason before implementing.
- When making UI decisions or establishing new patterns not covered in `DESIGN.md`, document them back into `DESIGN.md` immediately so future work stays consistent.
- Cite specific `DESIGN.md` sections in implementation summaries (e.g., "Used Task Card specs from DESIGN.md Components section").

## Using Rules & Guardrails
- Follow `.cursor/rules` and `.cursorrules` voice guidelines: keep messages brief, numbered, and end with either “Next action for Jason” or “No action needed; ready for next step.”
- Enforce the Confirmation Policy and Safe-Run batching before impactful changes.
- Ask before moving or renaming files, running migrations, or accessing new integrations.

## MCP & Memory Practices
- Persist MCP memory as local JSONL files only; never sync to external services.
- Redact PII and minimize captured content when storing snippets for retrieval.
- Refresh context regularly to ensure prompt windows stay focused on the active project or subchat.

## State Updates
- Update `STATE/TODAY.md` when decisions shift, risks emerge, or blockers clear.
- Log confirmations and outcomes that affect schedule, scope, or integrations.
- If unexpected repo changes appear, pause work and escalate for guidance.
