# Project guidance for Claude Code

## Multi-model setup (Claude + GPT + Gemini)

This project runs three models together inside Claude Code. Claude is the
builder; GPT and Gemini are wired in as MCP servers (see `.mcp.json`) so they
can be called mid-task instead of copy-pasting between apps.

| Model  | Role     | Called via        | Best at                                            |
|--------|----------|-------------------|----------------------------------------------------|
| Claude | Builder  | (you)             | Writing code, running the terminal, making changes |
| GPT    | Reviewer | `codex` MCP tool  | A second set of eyes on code Claude just wrote     |
| Gemini | Reader   | `gemini` MCP tool | Huge context: long files, big PDFs, video, audio   |

Why three beats one: it's not more power, it's **different blind spots**. The
model that wrote the code is the worst one to catch its own mistakes.

### Hand-off rules

**Review — hand off to GPT (`codex`):**
- After writing any new feature or non-trivial change, send the diff to GPT
  for review before calling it done. The author is the worst reviewer of its
  own work — get an independent set of eyes.

**Read — hand off to Gemini (`gemini`):**
- Any file over ~1,000 lines: have Gemini read and summarize it first.
- Any PDF, video, or audio input: send it to Gemini to read/transcribe/
  summarize before acting on it.
- Anything that won't fit in Claude's context: route it to Gemini first.

### Honest limits
- Both are on free/existing-plan tiers, so they **rate-limit** — Gemini's fast
  model especially. On a heavy day you may hit a wall and have to wait.
- The CLIs must be installed and logged in first. See
  [`docs/multi-model-setup.md`](docs/multi-model-setup.md).

## Slash commands
- `/review` — send the current diff to GPT for a second-opinion review.
- `/read-big <path-or-url>` — hand a large file/PDF/video to Gemini to summarize.
