# Running Claude, GPT, and Gemini together in Claude Code

This project is wired so Claude Code can call **GPT** and **Gemini** as MCP
tools mid-task — no flipping between three tabs. This doc is the one-time
setup. The wiring (`.mcp.json`, `CLAUDE.md`, slash commands) is already
committed; you just install and log into the two CLIs.

## Who does what

| Model  | Role     | Best at                                            |
|--------|----------|----------------------------------------------------|
| Claude | Builder  | Writes the code, runs the terminal, makes changes  |
| GPT    | Reviewer | A second set of eyes on what Claude just wrote     |
| Gemini | Reader   | The giant stuff: long videos, 300-page PDFs, huge files |

The point isn't more power — it's **different blind spots**. The model that
wrote the code is the worst one to review it.

## Why "free" here

You're routing through CLIs tied to plans you already pay for, not per-call
APIs — so no new subscription and no surprise token bill:

- **Gemini** → Gemini CLI, logged in with your Google account (free tier).
- **GPT** → Codex CLI, signed in with your existing ChatGPT subscription.

Honest heads-up: these free/plan tiers **rate-limit**. Gemini's fast model
especially — on a heavy day you'll hit a wall and wait a bit. Real, not a
dealbreaker.

## Setup (about 10 minutes)

### Easiest path: one script

On **your own machine** (not a remote/cloud session), from the repo root:

```bash
bash scripts/setup-multi-model.sh
```

It installs both CLIs and walks you through the two logins. When it opens a
browser, sign in with your Google account (Gemini) and your ChatGPT account
(Codex). That's the whole thing — skip to "Verify" below. The manual steps
that follow are the same actions, spelled out, if you'd rather do them by hand.

### 1. Install and log into the Gemini CLI

```bash
npm install -g @google/gemini-cli
gemini            # run once; log in with your Google account when prompted
```

### 2. Install and log into the Codex CLI (GPT)

```bash
npm install -g @openai/codex
codex             # run once; sign in with your ChatGPT account when prompted
```

### 3. That's it — the MCP wiring is already here

`.mcp.json` (committed) registers both as MCP servers for Claude Code:

- `gemini` → `npx -y gemini-mcp-tool` (bridges the Gemini CLI into MCP)
- `codex`  → `codex mcp-server` (Codex CLI's built-in MCP server mode)

Start Claude Code in this repo and approve the two MCP servers when it asks.
Verify they're connected:

```bash
claude mcp list
```

You should see `gemini` and `codex` listed as connected.

## How Claude decides to hand off

The rules live in [`CLAUDE.md`](../CLAUDE.md), so Claude applies them on its
own:

- **After writing a feature** → send the diff to **GPT** for review before
  calling it done.
- **Any file over ~1,000 lines, or any PDF / video / audio** → send it to
  **Gemini** to read and summarize first.

You can also trigger a hand-off explicitly:

- `/review` — send the current diff to GPT.
- `/read-big <path-or-url>` — hand a big file to Gemini.

## Start here

Start with **Gemini for the big files** — that's the gap you'll feel first.

## Troubleshooting

- `claude mcp list` shows a server as failed → run the CLI (`gemini` or
  `codex`) directly once to confirm it's installed and logged in.
- Gemini calls stall or error on a heavy day → you're likely rate-limited on
  the free tier; wait and retry, or switch Gemini to a slower model.
- `npx gemini-mcp-tool` can't find the CLI → make sure `gemini` is on your
  `PATH` (global npm install), then restart Claude Code.
