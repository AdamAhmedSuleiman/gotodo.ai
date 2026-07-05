---
description: Send the current diff to GPT (Codex MCP) for a second-opinion review
---

Get an independent review of the current changes from GPT — the model that
wrote the code (Claude) is the worst one to catch its own mistakes.

1. Gather the diff to review. Prefer the uncommitted working changes; if the
   tree is clean, use the diff of this branch against `main`:
   - `git diff` (if there are unstaged/staged changes), else
   - `git diff main...HEAD`
2. Call the **`codex`** MCP tool. Ask GPT to review the diff as a critical
   second reviewer and to focus on: correctness bugs, missed edge cases,
   security issues, and anything the author likely overlooked. Pass the full
   diff as context.
3. Summarize GPT's findings back for me, grouped by severity. For each one,
   say whether you agree and — if it's a real issue — offer to fix it.

Do not treat GPT's output as authoritative; weigh it against the code. If GPT
is unavailable or rate-limited, say so plainly instead of skipping the review
silently.
