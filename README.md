<div align="center">

# Second Brain

**Obsidian-style notes + MkDocs-style developer docs + instant search, in one plain-Markdown repo.**<br>
Organize your context and tribal knowledge with Google's Open Knowledge Format (OKF), and share it with your human and AI-agent teammates.

[**Live demo**](https://ericcgu.github.io/second-brain/) &nbsp;·&nbsp; [Graph](https://ericcgu.github.io/second-brain/graph/) &nbsp;·&nbsp; [Mind Map](https://ericcgu.github.io/second-brain/mindmap/) &nbsp;·&nbsp; [Quick start](#quick-start)

[![Deploy](https://github.com/ericcgu/second-brain/actions/workflows/deploy.yml/badge.svg)](https://github.com/ericcgu/second-brain/actions/workflows/deploy.yml)
[![Format: OKF v0.2](https://img.shields.io/badge/format-OKF_v0.2-4285F4?style=flat-square)](./reference/open-knowledge-format.md)
[![Live site](https://img.shields.io/badge/live-GitHub_Pages-22c55e?style=flat-square)](https://ericcgu.github.io/second-brain/)

<br>

<a href="https://ericcgu.github.io/second-brain/"><img src="./assets/demo.gif" alt="Demo: switching between mind map, graph, slide-over note, search, and themes" width="900"></a>

</div>

---

## Why use this

Most teams keep knowledge in three places that never stay in sync: personal notes (Obsidian, Notion), a docs site (MkDocs, Docusaurus), and people's heads. AI coding agents make the problem worse, because they can only use what they can find and read.

Second Brain keeps all of it in **one folder of Markdown files** and gives everyone a way in:

| You want to... | Second Brain gives you |
|---|---|
| Capture and connect notes like **Obsidian** | Plain `.md` files with links, a graph view, and a collapsible mind map |
| Publish them like **MkDocs** | A polished docs site with sidebar, table of contents, prev/next, and backlinks, deployed to GitHub Pages on every push |
| Find anything fast | A `Cmd+K` search across titles, headings, body text, and `#tags` |
| Give **AI agents** the same context | A predictable OKF tree: agents read [`index.md`](./index.md) first and open only the notes they need |
| Stop losing **tribal knowledge** | One reviewed, versioned place where setup guides, decisions, and how-tos live, readable by humans and agents alike |

There is nothing to install and no database or vendor lock-in. It's Git, Markdown, and one Node script.

## Easy to use

Open the [live demo](https://ericcgu.github.io/second-brain/) and start clicking. There's nothing to learn first.

### The mind map: your whole knowledge base at a glance

<a href="https://ericcgu.github.io/second-brain/mindmap/"><img src="./assets/mindmap.gif" alt="Annotated walkthrough: start folded, expand topics one at a time, read a note in place, regroup by tag, expand everything" width="100%"></a>

- **Start folded** to see just the topics, then **expand one branch at a time** with the `+` / `-` badges.
- **Click any card** to read the note in a slide-over panel. The map stays where it is.
- **Regroup by `#tag`** in one click to see the same notes through a different lens.
- **Expand all** when you want the full picture. [Try the mind map](https://ericcgu.github.io/second-brain/mindmap/)

### The graph and search

<table>
  <tr>
    <td width="50%"><a href="https://ericcgu.github.io/second-brain/graph/"><img src="./assets/graph.gif" alt="Annotated walkthrough: dragging nodes, panning, zooming, and opening a note from the graph"></a><br><sub><b>Graph</b>: drag a note and its neighbours follow. Pan, zoom, and click to read. <a href="https://ericcgu.github.io/second-brain/graph/">Try it</a></sub></td>
    <td width="50%"><a href="https://ericcgu.github.io/second-brain/?view=docs#runbooks%2Fdeploy-docs-site.md"><img src="./assets/code.gif" alt="Annotated walkthrough: searching for the deploy runbook and copying a highlighted command"></a><br><sub><b>Search and snippets</b>: find a runbook with <code>Cmd+K</code>, then copy its commands in one click. <a href="https://ericcgu.github.io/second-brain/?view=docs#runbooks%2Fdeploy-docs-site.md">Try it</a></sub></td>
  </tr>
</table>

Adding knowledge is just as simple: write a Markdown file, or ask your AI agent to *"add a note about X"*. The site rebuilds on every push.

## Who it's for

- **Engineering teams** that want onboarding docs, runbooks, and environment setups in one searchable place.
- **Developers using AI agents** (Antigravity, Gemini CLI, Claude Code, Cursor) who want the agent to work from curated project context rather than guesses.
- **Individuals** who want an Obsidian-like second brain that also publishes as a clean website.

## Screenshots

<table>
  <tr>
    <td width="50%"><img src="./assets/split-view.png" alt="Docs and mind map side by side"><br><sub><b>Split view</b>: read a note next to the mind map</sub></td>
    <td width="50%"><img src="./assets/mind-map.png" alt="Collapsible mind map"><br><sub><b>Mind map</b>: the knowledge tree, grouped by folder or tag</sub></td>
  </tr>
  <tr>
    <td width="50%"><img src="./assets/graph-slide-over.png" alt="Graph view with a note open in a slide-over panel"><br><sub><b>Graph</b>: click any node to read it without leaving the graph</sub></td>
    <td width="50%"><img src="./assets/search-dark.png" alt="Command palette search in dark theme"><br><sub><b>Search</b>: <code>Cmd+K</code> across every note, heading, and tag</sub></td>
  </tr>
</table>

## How it works

Everything is organized with **[Google's Open Knowledge Format (OKF v0.2)](./reference/open-knowledge-format.md)**: a simple convention for arranging Markdown as a tree.

```
second-brain/
├── index.md          Root table of contents: lists topics (start here, for humans and agents)
├── inbox.md          Scratchpad for quick, unsorted capture
├── log.md            Changelog, appended on every change
├── AGENTS.md         Rules AI agents follow when they edit this repo
├── onboarding/       Getting started and contributing
├── runbooks/         Step-by-step procedures
├── decisions/        Architecture Decision Records (ADRs)
├── reference/        Definitions, specs, glossary
├── dev-tools/        Environment setup guides and reusable prompts
├── scripts/
│   ├── validate-okf.mjs   Checks frontmatter and links
│   └── export-graph.mjs   Builds the website from the Markdown
└── site/             Generated website (docs, /graph/, /mindmap/)
```

Each topic folder has its own `index.md` listing its notes, and each topic becomes a branch in the mind map. The sample notes show one of each type: a [decision record](./decisions/adr-001-okf-markdown-knowledge-base.md), a [runbook](./runbooks/deploy-docs-site.md), a [checklist](./onboarding/contributor-checklist.md), and a [glossary](./reference/glossary.md).

Each note starts with a short YAML header. The `type` says what kind of knowledge it is (`concept`, `decision`, `playbook`, `reference`, `note`):

```yaml
---
type: playbook
title: "Incident Response Runbook"
description: "Who to page, where the dashboards are, and how to roll back."
tags: [oncall, runbook]
updated: 2026-11-08
---
```

Because every file has the same shape and is listed in an index, **people can browse it** like documentation and **agents can navigate it** without loading the whole repo into context. The graph is built from the links you write: indexes connect each topic to its notes, and links inside notes connect related ideas across topics. Changelog links are left out, so the graph shows how knowledge relates, not what was edited last.

### Working with AI agents

[`AGENTS.md`](./AGENTS.md) tells any agent how to maintain the knowledge base. When an agent adds or edits a note, it:

1. Writes valid OKF frontmatter.
2. Links the note from [`index.md`](./index.md).
3. Adds a line to [`log.md`](./log.md).
4. Runs the validator and rebuilds the site.

In practice you can say *"add a note about our deploy process"* or *"turn my inbox into proper notes"*, and the agent handles the filing.

## Quick start

**Use it as a template**

1. Click **Use this template** (or fork) on GitHub, then clone your copy.
2. Replace the sample notes in the topic folders with your own. Keep the folders that fit your team, delete the rest, and list your topics in `index.md`.
3. Build and preview locally (Node 18+, no `npm install` needed):

   ```bash
   node scripts/validate-okf.mjs
   node scripts/export-graph.mjs
   open site/index.html
   ```

**Publish to GitHub Pages**

1. In your repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`. The included [workflow](./.github/workflows/deploy.yml) validates your notes, builds the site, and deploys it.
3. Your site will be at `https://<user>.github.io/<repo>/`.

## Shareable links

Every view has its own URL, so you can link teammates straight to the graph or mind map:

| View | URL |
|---|---|
| Docs + mind map | [`/second-brain/`](https://ericcgu.github.io/second-brain/) |
| Graph | [`/second-brain/graph/`](https://ericcgu.github.io/second-brain/graph/) |
| Mind map | [`/second-brain/mindmap/`](https://ericcgu.github.io/second-brain/mindmap/) |

Any page also accepts `?view=graph|mindmap|docs|split`, plus a note in the hash, for example [`/second-brain/graph/#reference%2Fopen-knowledge-format.md`](https://ericcgu.github.io/second-brain/graph/#reference%2Fopen-knowledge-format.md).

## Features

- **Three ways to browse**: docs, collapsible mind map, and force-directed graph, side by side or full screen.
- **Slide-over reader**: open a note from the graph or mind map without losing your place.
- **Search**: `Cmd+K` command palette with fuzzy matching across titles, headings, body text, and `#tags`.
- **Docs essentials**: sidebar tree, on-page table of contents, prev/next links, backlinks, and syntax-highlighted code with copy buttons.
- **Tag filtering** in the sidebar and mind map.
- **Paper, Light, and Dark themes.**
- **Self-contained output**: one HTML file per view, so it can be hosted anywhere static.
- **Validation in CI**: broken links or missing frontmatter fail the build before they reach your site.

## Built with

Plain Markdown, Node.js (standard library only), HTML canvas for the mind map and graph, MiniSearch for search, highlight.js for code, and GitHub Actions + Pages for deployment.
