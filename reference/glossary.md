---
type: reference
title: "Glossary"
subtitle: "Terms used across this knowledge base"
description: "Short definitions of OKF, frontmatter, note types, progressive disclosure, and the other terms used across this knowledge base."
tags: [reference, okf, onboarding]
updated: 2026-11-08
---

# Glossary

## Format

- **OKF (Open Knowledge Format):** Google's convention for organizing Markdown as a tree with typed notes. See [Google Open Knowledge Format](./open-knowledge-format.md).
- **Frontmatter:** The YAML block between `---` lines at the top of a note. Holds `type`, `title`, `description`, `tags`, and `updated`.
- **Progressive disclosure:** Reading the root index first and opening only the branch you need, instead of everything at once. It saves AI agents tokens and keeps humans oriented.
- **Topic folder:** A folder such as `runbooks/` with its own `index.md` listing the notes inside.

## Note types

- **`concept`:** Explains an idea or how something works.
- **`decision`:** Records a choice and why it was made. See [ADR-001](../decisions/adr-001-okf-markdown-knowledge-base.md).
- **`playbook`:** Step-by-step procedure. See the [deploy runbook](../runbooks/deploy-docs-site.md).
- **`reference`:** Facts to look up, like this glossary.
- **`note`:** Anything that doesn't fit the above yet.

## Site

- **Graph:** Shows how notes link to each other. Drag nodes, pan, zoom, and click to read.
- **Mind map:** Shows the folder tree. Use the `+` / `-` badges to expand and collapse branches.
- **Slide-over:** The panel that opens when you click a note in full-screen graph or mind map view.
- **Tribal knowledge:** What a team knows but has never written down. The point of this repo is to write it down.
