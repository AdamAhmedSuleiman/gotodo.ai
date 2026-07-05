---
description: Hand a large file, PDF, video, or audio to Gemini to read and summarize
argument-hint: <path-or-url>
---

Route large content to Gemini (its ~1M-token context handles what Claude's
window would cut off halfway).

Target: `$ARGUMENTS`

1. If no target was given, ask me which file/URL to read.
2. Call the **`gemini`** MCP tool and ask it to read `$ARGUMENTS` in full and
   return a structured summary: what it is, the key points, and anything that
   matters for the task at hand. For code files, also ask for the important
   structures, entry points, and any risks. For a PDF/video/audio, ask for a
   sectioned summary with the notable details called out.
3. Relay Gemini's summary back to me, then continue the original task using it
   as context — I don't need the raw content re-dumped.

If Gemini is unavailable or rate-limited, tell me directly rather than falling
back to reading a giant file into Claude's context without flagging it.
