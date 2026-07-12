#!/usr/bin/env bash
#
# One-time setup for the Claude + GPT + Gemini multi-model workflow.
# Run this ON YOUR OWN MACHINE (not in a remote/cloud session) — the logins
# open a browser and sign in with YOUR Google and ChatGPT accounts.
#
#   bash scripts/setup-multi-model.sh
#
set -euo pipefail

say()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m  ✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m  ! %s\033[0m\n' "$*"; }

# --- 0. Prerequisites -------------------------------------------------------
say "Checking prerequisites"
if ! command -v node >/dev/null 2>&1; then
  warn "Node.js is not installed. Install it first: https://nodejs.org (LTS)."
  exit 1
fi
if ! command -v npm >/dev/null 2>&1; then
  warn "npm is not installed (it ships with Node.js). Install Node.js first."
  exit 1
fi
ok "node $(node -v),  npm $(npm -v)"

# --- 1. Install the two CLIs ------------------------------------------------
say "Installing the Gemini CLI and the Codex (GPT) CLI"
npm install -g @google/gemini-cli @openai/codex
ok "CLIs installed"

# --- 2. Log into GPT (Codex / ChatGPT account) ------------------------------
say "Signing into GPT — a browser window will open; use your ChatGPT account"
if codex login status >/dev/null 2>&1; then
  ok "Codex already logged in"
else
  codex login || warn "Codex login didn't complete — rerun 'codex login' later."
fi

# --- 3. Log into Gemini (Google account) ------------------------------------
say "Signing into Gemini — pick 'Login with Google' when the CLI prompts"
warn "The Gemini CLI opens an interactive screen. Choose 'Login with Google',"
warn "finish in the browser, then type /quit to exit it."
echo
read -r -p "Press Enter to launch the Gemini CLI now..." _ || true
gemini || warn "Gemini didn't finish — just run 'gemini' again and log in."

# --- 4. Verify the MCP wiring -----------------------------------------------
say "Done. Verify inside this repo with:"
echo "    claude mcp list      # expect 'gemini' and 'codex' -> connected"
echo
ok "Setup complete. Full guide: docs/multi-model-setup.md"
