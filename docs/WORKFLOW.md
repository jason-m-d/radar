# RADAR Working Agreement

## Collaborating with Codex
- Review `PROJECT.md` and `STATE/TODAY.md` before starting work to align on current goals and constraints.
- Share a brief plan for multi-step tasks, track progress, and update STATE files when outcomes change scope or risk.
- Summarize command outputs instead of pasting raw logs; highlight failures or surprises immediately.

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
