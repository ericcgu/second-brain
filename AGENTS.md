---
type: guideline
title: "AI Agent Guidelines"
subtitle: "Automatic OKF indexing, tagging, and Mind Map rules"
description: "Instructions for AI agents to handle all OKF formatting, indexing, and Mind Map rebuilds automatically."
tags: [okf, ai-agents, workflow]
updated: 2026-11-08
---

# AI Agent Guidelines (`AGENTS.md`)

This is a **simple, low-friction Second Brain** built on **Google's Open Knowledge Format (OKF v0.2)** with a **Developer Docs + Interactive Mind Map** viewer.
**Core rule:** Keep things effortless for the human. The AI handles all OKF metadata, indexing, logging, and Mind Map regeneration automatically.

## 1. Folder Structure (One Folder per Topic)

- [`index.md`](./index.md) — Root table of contents (`okf_version: "0.2"`). Lists **topics**, not individual notes.
- [`inbox.md`](./inbox.md) — User's quick scratchpad (`type: inbox`).
- [`log.md`](./log.md) — Reserved OKF changelog updated automatically by the AI.
- **Topic folders**, one level deep, each with an `index.md` that lists its notes:
  - `onboarding/` — getting started and contributing (`playbook`, `note`)
  - `runbooks/` — step-by-step procedures (`playbook`)
  - `decisions/` — Architecture Decision Records (`decision`)
  - `reference/` — definitions, specs, explainers (`reference`, `concept`)
  - `dev-tools/` — local environment setups (`concept`)

Put each note in the topic it best fits. Only create a new topic folder when the user asks, or when several notes clearly don't fit any existing topic; then add it to the root `index.md`. Do not nest folders deeper than one level.

## 2. OKF Frontmatter (Handled by AI)

Every note in a topic folder starts with simple YAML frontmatter:
```yaml
---
type: playbook
title: "Note Title"
description: "One-sentence summary."
tags: [topic, keyword]
updated: YYYY-MM-DD
---
```

Topic `index.md` files have **no** frontmatter, just a `# Heading`, a one-line purpose, and a bulleted list of notes.

## 3. Maintenance Checklist on Every Write

Whenever you create or update a note:
1. Ensure valid YAML frontmatter (`type`, `title`, `description`, `updated`).
2. Add or update the link in the topic folder's `index.md` (and in the root [`index.md`](./index.md) if you created a new topic).
3. Link to genuinely related notes in the body. These links become the edges of the knowledge graph, so don't add links just for navigation.
4. Append a 1-line entry in [`log.md`](./log.md).
5. Run `node scripts/validate-okf.mjs` and `node scripts/export-graph.mjs` to verify OKF compliance and update the Mind Map portal.
