---
type: note
title: "Second Brain Quickstart"
subtitle: "How to capture notes, search, and explore the Mind Map"
description: "A 1-minute plain-English guide to using your Second Brain with AI, Developer Docs, and the interactive Mind Map."
tags: [guide, workflow, mind-map]
updated: 2026-11-08
---

# How to Use This Second Brain

You don't need any complicated VS Code extensions or rules. Everything here is plain Markdown organized as a clean tree.

## 1. Let the AI Do the Work (Easiest)

Just ask me in chat:
- *"Add a note about [topic]"*
- *"Summarize this article/code into a note"*
- *"Organize my [Inbox](../inbox.md) into clean notes"*

I automatically create the note in the right topic folder, add the [Google OKF](../reference/open-knowledge-format.md) header, link it from that folder's `index.md`, and update your Mind Map.

## 2. Browse Your Developer Docs & Mind Map

Run this command anytime (or ask me to open it):
```bash
/usr/local/bin/node scripts/export-graph.mjs && open /tmp/okf-foam-graph.html
```
- **Left Sidebar:** Search and jump to any note like real developer documentation.
- **Center Docs Pane:** Read your notes with clickable links between pages.
- **Interactive Mind Map:** Expand or collapse (`+` / `-`) branches from `My Second Brain` → `Sections` → `Notes` → `Headings inside each note`.

## 3. Write Notes Yourself

If you want to write by hand, just type in [`inbox.md`](../inbox.md) or create a `.md` file in the topic folder it belongs to (for example `runbooks/` or `decisions/`). See the [contributor checklist](./contributor-checklist.md) for the details.
