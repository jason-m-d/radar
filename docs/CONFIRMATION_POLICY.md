# RADAR Confirmation Policy

## Core Principles
- Default to confirmation before any irreversible or user-visible change.
- Batch related actions into safe-run groupings and summarize planned impact prior to execution.
- Honor user-configured confidence thresholds; fall back to explicit approval when confidence is below threshold.

## Required Confirmations
1. Sending external communications (email replies, calendar invites, document shares).
2. Creating, editing, or deleting tasks, projects, or calendar events without explicit prior approval.
3. Applying configuration changes, migrations, or file moves.
4. Accessing new data sources or scopes beyond those previously authorized.

## Safe-Run Workflow
- Present a numbered list of intended actions with rationale and predicted outcomes.
- Request a clear approval response (e.g., “Confirm 1-3”) before execution.
- After completion, recap the actual results and flag any deviations or failures.

## Guardrails
- Never expose secrets or sensitive metadata in confirmations or logs.
- Respect privacy constraints: redact PII, limit retention to necessary metadata and minimal snippets.
- Stop and seek guidance if unexpected repository or environment changes appear.
- Document rationale and outcomes in STATE updates when actions materially affect the project.
