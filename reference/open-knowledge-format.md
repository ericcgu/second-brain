---
type: concept
title: "Google Open Knowledge Format (OKF)"
subtitle: "Progressive disclosure tree for AI agents (OKF v0.2)"
description: "How Google's Open Knowledge Format (OKF) structures Markdown files as a progressive tree for AI agents and Mind Maps."
tags: [okf, ai-agents, mind-map]
updated: 2026-11-08
---

# What is Google Open Knowledge Format (OKF)?

**Google's Open Knowledge Format (OKF v0.2)** is a simple standard for organizing Markdown files so humans and AI agents never get lost.

## Progressive Disclosure Tree

Instead of a messy spiderweb of links, **Open Knowledge Format (OKF)** organizes knowledge like a **Mind Map tree**:

| Layer | File Pattern | Purpose in Open Knowledge Format (OKF) |
| :--- | :--- | :--- |
| **1. Root Index** | [`index.md`](../index.md) | Top-level table of contents listing every topic folder. |
| **2. Topic Manifest** | `<topic>/index.md` | Folder index summarizing the notes inside that branch. |
| **3. Concept & Note Cards** | `<topic>/<note>.md` | Typed Markdown notes (`concept`, `decision`, `playbook`, `reference`). |
| **4. Change Log** | [`log.md`](../log.md) | Chronological history maintained automatically by your AI agent. |

- **Root ([`index.md`](../index.md)):** The table of contents listing your topics with one-sentence summaries.
- **Topic folders (`onboarding/`, `runbooks/`, ...):** Each has its own `index.md` listing the notes inside it.
- **Typed Notes:** Each note has a small YAML header (`type`, `title`, `description`, `updated`) and clean `##` headings. See the [glossary](./glossary.md).

## Why Open Knowledge Format (OKF) Scales

- **For AI Agents:** The AI reads [`index.md`](../index.md) first and drills down only into the branch it needs, saving tokens and avoiding confusion.
- **For Humans:** The exact same tree renders as a collapsible **Mind Map** and clean **Developer Docs** (see the [Second Brain Quickstart](../onboarding/second-brain-quickstart.md)).
- **For Teams:** Why we chose this format is recorded in [ADR-001](../decisions/adr-001-okf-markdown-knowledge-base.md).
