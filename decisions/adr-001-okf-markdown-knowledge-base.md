---
type: decision
title: "ADR-001: OKF Markdown as Our Knowledge Base"
subtitle: "Accepted · plain Markdown + OKF + generated site"
description: "Why team knowledge lives in plain Markdown organized with Google's Open Knowledge Format, published as a static docs site."
tags: [adr, okf, ai-agents]
updated: 2026-11-08
---

# ADR-001: OKF Markdown as Our Knowledge Base

**Status:** Accepted

## Context

Knowledge was spread across personal notes, chat threads, and people's memory. New teammates could not find it, and AI agents could not use it at all. We wanted one place that:

- people can browse and search like documentation,
- AI agents can read without loading everything into context,
- is versioned and reviewed like code.

## Options considered

| Option | Why not |
|---|---|
| Wiki or Notion | Hard for agents to read; edits are not reviewed like code |
| Obsidian vault only | Great for one person; no shared, published site |
| MkDocs / Docusaurus only | Great site; no graph or mind map, and no rules for agents |
| **Markdown + OKF + generated site** | Chosen |

## Decision

Keep all knowledge as Markdown files in Git, organized with the [Open Knowledge Format](../reference/open-knowledge-format.md):

- a root `index.md`, one folder per topic, each with its own `index.md`,
- YAML frontmatter on every note (`type`, `title`, `description`, `updated`),
- [AGENTS.md](../AGENTS.md) rules so AI agents maintain the structure,
- a generated site (docs, graph, mind map, search) deployed on every push.

## Consequences

- **Good:** one source of truth for people and agents; changes are reviewed in pull requests; no vendor lock-in.
- **Cost:** every note needs frontmatter and an index entry. The [validator](../onboarding/contributor-checklist.md) catches mistakes, and agents do most of this work.
- **Follow-up:** deploys are documented in the [deploy runbook](../runbooks/deploy-docs-site.md).
