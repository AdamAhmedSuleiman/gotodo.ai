# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Multi-model dev setup (Claude + GPT + Gemini)

This repo is wired so Claude Code can call GPT (reviewer) and Gemini (reads the
big files) as MCP tools mid-task. One-time CLI login required — see
[docs/multi-model-setup.md](docs/multi-model-setup.md).
