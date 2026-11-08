---
type: concept
title: "Google Open Knowledge Format"
subtitle: "Progressive disclosure tree for AI agents (OKF v0.2)"
description: "How Google's Open Knowledge Format structures Markdown files as a progressive tree for AI agents and Mind Maps."
tags: [okf, ai-agents, mind-map]
updated: 2026-11-07
---

# What is Google OKF?

**Google's Open Knowledge Format (OKF v0.2)** is a simple standard for organizing Markdown files so AI agents never get lost.

## Progressive Disclosure Tree

Instead of a messy spiderweb of links, OKF organizes knowledge like a **Mind Map tree**:
- **Root ([`index.md`](../index.md)):** The table of contents listing your topics and notes with one-sentence summaries.
- **Typed Notes (`notes/*.md`):** Each note has a small YAML header (`type`, `title`, `description`, `updated`) and clean `##` headings.
- **Change Log ([`log.md`](../log.md)):** Automatic history maintained by your AI agent.

## Why It Scales

- **For AI Agents:** The AI reads [`index.md`](../index.md) first and drills down only into the branch it needs, saving tokens and avoiding confusion.
- **For Humans:** The /exact same tree renders as a collapsible **Mind Map** and clean **Developer Docs** (see [How to Use This Second Brain](./how-to-use-this.md)).
