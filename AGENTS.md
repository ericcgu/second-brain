---
type: guideline
title: "AI Agent Guidelines"
subtitle: "Automatic OKF indexing, tagging, and Mind Map rules"
description: "Instructions for AI agents to handle all OKF formatting, indexing, and Mind Map rebuilds automatically."
tags: [okf, ai-agents, workflow]
updated: 2026-11-07
---

# AI Agent Guidelines (`AGENTS.md`)

This is a **simple, low-friction Second Brain** built on **Google's Open Knowledge Format (OKF v0.2)** with a **Developer Docs + Interactive Mind Map** viewer.
**Core rule:** Keep things effortless for the human. The AI handles all OKF metadata, indexing, logging, and Mind Map regeneration automatically.

## 1. Folder Structure (Keep It Flat)

- [`index.md`](./index.md) — Root table of contents (`okf_version: "0.2"`).
- [`inbox.md`](./inbox.md) — User's quick scratchpad (`type: inbox`).
- `notes/` — Single folder for all notes (`type: note`, `type: concept`, `type: reference`, etc.). Do not create extra subfolders unless the user asks for them.
- [`log.md`](./log.md) — Reserved OKF changelog updated automatically by the AI.

## 2. OKF Frontmatter (Handled by AI)

Every note in `notes/` starts with simple YAML frontmatter:
```yaml
---
type: note
title: "Note Title"
description: "One-sentence summary."
updated: YYYY-MM-DD
---
```

## 3. Maintenance Checklist on Every Write

Whenever you create or update a note:
1. Ensure valid YAML frontmatter (`type`, `title`, `description`, `updated`).
2. Add or update the link in [`index.md`](./index.md) under `## Notes`.
3. Append a 1-line entry in [`log.md`](./log.md).
4. Run `/usr/local/bin/node scripts/validate-okf.mjs` and `/usr/local/bin/node scripts/export-graph.mjs` to verify OKF compliance and update the Mind Map portal.
