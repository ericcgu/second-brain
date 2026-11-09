---
type: reference
title: "System Architecture"
subtitle: "OKF v0.2 knowledge tree, static graph compiler, and interactive portal internals"
description: "Comprehensive technical blueprint, design trade-offs, dependencies inventory, and AI agent reconstruction guide for Second Brain."
tags: [architecture, okf, ai-agents, mind-map, system-design]
updated: 2026-11-08
---

# System Architecture (`ARCHITECTURE.md`)

This document is the **definitive technical blueprint** for **Second Brain**. It documents every architectural decision, operational trade-off, data structure, mathematical model, and dependency in the system.

Any autonomous AI coding agent or human engineer reading this document possesses the exact specification needed to maintain, extend, or **rebuild the entire platform from scratch** in an empty directory without external instruction.

---

## 1. High-Level System Overview

Second Brain is an **AI-native personal and team knowledge engine** built on **[Google's Open Knowledge Format (OKF v0.2)](./reference/open-knowledge-format.md)**. It couples a human-readable Git Markdown repository with a **zero-dependency static site compiler** that produces an interactive, high-density documentation portal featuring an **HTML5 Canvas Mind Map**, a **Force-Directed Semantic Graph**, **Full-Text Instant Search**, and a **Dockable Developer Docs Reader**.

```
                           SOURCE REPOSITORY (OKF v0.2)
┌─────────────────────────────────────────────────────────────────────────────┐
│  index.md (Root Manifest — Lists Topics & Summary Descriptions)             │
│  ├── <topic>/index.md (Topic Manifests — Lists Notes in Topic)              │
│  ├── <topic>/<note>.md (Typed Concept/Playbook Notes with YAML Frontmatter)  │
│  ├── inbox.md (Frictionless Quick Capture Scratchpad)                       │
│  ├── AGENTS.md (Operational Manual & Autonomous Agent Guardrails)           │
│  ├── ARCHITECTURE.md (This Technical Architecture & Rebuilding Blueprint)   │
│  └── log.md (Chronological Audit Log of Repository Mutations)               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 1: VALIDATION — scripts/validate-okf.mjs (Node.js Built-ins)         │
│  • Enforces OKF v0.2 schema (okf_version on root index.md, typed notes)     │
│  • Verifies no frontmatter on subfolder index.md files (prevents duplicates)│
│  • Validates 100% of relative Markdown links ([label](./path.md)) on disk   │
│  • Exits with non-zero code on any broken link or schema violation          │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 2: STATIC COMPILATION — scripts/export-graph.mjs (Zero Dependencies) │
│  • Traverses repository; parses YAML frontmatter and Markdown headings      │
│  • Filters out log.md from semantic links (GRAPH_EXCLUDED = new Set)        │
│  • Builds bidirectional links, backlinksMap, and alphabetical tag indices   │
│  • Computes hierarchical trees: mindMapByFolder and mindMapByTag            │
│  • Inlines entire JSON bundle (const data = {...}) into static HTML shell   │
│  • Emits multi-page distribution:                                           │
│      - site/index.html (Default split view)                                 │
│      - site/mindmap/index.html (Full-screen interactive Mind Map)           │
│      - site/graph/index.html (Full-screen Force-Directed Graph)             │
│      - /tmp/okf-foam-graph.html (Instant local preview artifact)            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  PHASE 3: CI/CD DEPLOYMENT — .github/workflows/deploy.yml                   │
│  • Triggers automatically on push to main branch                            │
│  • Validates and builds with zero npm install overhead (< 3 seconds)        │
│  • Publishes site/ artifact directly to GitHub Pages                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Human Agentic Orchestrator & Multi-Model Delegation (`flash-runner`)

Modern engineering shifts developers from manual coders to **Human Agentic Orchestrators** directing autonomous agent swarms. In this paradigm, AI generates code, runbooks, and architectural artifacts at superhuman velocity, creating two acute operational bottlenecks:
1. **The Human Speed Bottleneck (Comprehension Gap):** AI agents generate and modify knowledge faster than any human can read through raw diffs, markdown files, or chat transcripts. Without an immediate spatial mental model, the orchestrator loses control of the system topology.
2. **The Agent Token & Cost Waste:** Using high-parameter frontier reasoning models to run shell scripts, format frontmatter, and update indexes is slow and exorbitantly expensive.

Second Brain resolves both bottlenecks through an explicit **3-Actor Loop**:

```
 ┌───────────────────────────────────────────────────────────────┐
 │               HUMAN AGENTIC ORCHESTRATOR                      │
 │  • Captures raw thoughts & scratchpad notes in inbox.md        │
 │  • Visually audits knowledge via Mind Map, Graph, & Search     │
 │  • Sets strategy, reviews pull requests, and directs agents   │
 └───────────────┬───────────────────────────────▲───────────────┘
                 │ Strategic Directives          │ Visual Verification
                 ▼                               │ (< 5 sec audit)
 ┌───────────────────────────────────────────────┴───────────────┐
 │                FRONTIER PLANNING MODEL (`pro`)                │
 │  • Frontier reasoning model for complex system design & ADRs  │
 │  • High-level reasoning, architecture trade-offs, synthesis   │
 │  • Resolves ambiguities & breaks tasks into deterministic work │
 └───────────────┬───────────────────────────────────────────────┘
                 │ Fast subagent delegation
                 ▼
 ┌───────────────────────────────────────────────────────────────┐
 │   FAST, LOW-COST EXECUTION SUBAGENT (flash-runner)            │
 │  • Fast, low-latency, low-cost execution engine                │
 │  • Validates schema: node scripts/validate-okf.mjs            │
 │  • Compiles portal:  node scripts/export-graph.mjs             │
 │  • Deterministic OKF frontmatter, topic index & log.md updates │
 └───────────────────────────────────────────────────────────────┘
```

### 2.1 The 3-Actor Division of Labor

1. **Human Agentic Orchestrator:**
   - **Capture:** Drops raw, unstructured links, terminal snippets, and thoughts into [`inbox.md`](./inbox.md).
   - **Audit & Verification:** Rather than reading walls of markdown text after an agent run, opens the **Zero-Sprawl Mind Map** or **Force-Directed Graph** to visually inspect how new notes link into existing topics and clusters in seconds.
   - **Orchestration:** Directs the primary agent with high-level architectural intent (e.g., *"Convert inbox notes into a deploy runbook and wire it to ADR-001"*).

2. **Frontier Planning Model (`pro`):**
   - **Deep Architectural Synthesis:** Operates on a high-parameter frontier reasoning model.
   - **Disambiguation & Hierarchy Design:** Reads relevant manifests via Progressive Disclosure (`index.md` → `<topic>/index.md`), synthesizes ADRs and playbooks, determines cross-concept graph edges, and formulates an execution plan.
   - **Subagent Coordination:** Instead of spending expensive tokens executing repetitive terminal tasks, delegates deterministic execution to `flash-runner`.

3. **Fast, Low-Cost Execution Subagent (`flash-runner`, `Model: "flash"` or equivalent fast tier):**
   - **Sub-Second Execution:** Runs on a fast, lightweight, low-latency execution tier (such as `Model: "flash"` in subagent-capable harnesses, a fast `haiku` / `mini` subagent in other ecosystems, or direct CLI execution in single-model setups).
   - **Deterministic CLI Execution:** Executes `node scripts/validate-okf.mjs` and `node scripts/export-graph.mjs` with zero hesitation.
   - **Schema & Hygiene Enforcement:** Formats YAML frontmatter, registers new notes in `<topic>/index.md`, and logs chronological records in [`log.md`](./log.md).

### 2.2 Model-, Vendor-, and Ecosystem-Agnostic Design

Second Brain does **not** require Gemini, Claude, OpenAI, or any specific AI CLI to operate. Because the entire knowledge base is plain Markdown governed by [`AGENTS.md`](./AGENTS.md) and compiled by zero-dependency Node.js scripts, **users can bring any AI coding tool or model provider—including single-model or local open-weights setups**.

When a user's coding harness supports multi-model routing or subagents, the **3-Actor Loop** maps naturally onto that ecosystem's planning and fast execution tiers. When a harness uses a single model, the same single agent executes all steps directly while still benefiting from OKF v0.2's **97% token reduction** via Progressive Disclosure (`index.md` → `<topic>/index.md` → target note):

| AI Ecosystem / Harness | Frontier Planning Tier (Architecture & ADRs) | Fast Execution Tier (Validation, Build & Filing) | Single-Model Fallback |
|---|---|---|---|
| **Claude Code** | Primary session (Frontier reasoning tier) | `Task` subagent on fast/lightweight tier | Primary agent runs `validate-okf.mjs` & `export-graph.mjs` directly |
| **Cursor / Windsurf** | Composer / Agent planning model | Fast background terminal agent / fast model toggle | Primary agent executes CLI build & frontmatter updates |
| **OpenAI Codex CLI / Aider** | Architect / Primary reasoning model | Fast editor / mini execution model (`--editor-model`) | Single model runs full 5-step maintenance checklist |
| **GitHub Copilot** | Copilot Chat / Workspace planner | Copilot terminal runner + GitHub Actions CI | Primary chat agent + automated CI build |
| **Gemini CLI** | Primary session (`pro` tier) | `flash-runner` subagent (`Model: "flash"`) | Primary agent runs build & validation scripts directly |
| **Local / Open-Weights (Ollama, vLLM)** | Local reasoning model | Fast quantized coder model or direct shell script | Single local model reads `index.md` tree (< 2,000 tokens) |

### 2.3 Token Economics & Latency Rationale

| Operation | Frontier Planning Model (`pro`) | Fast, Low-Cost Execution Subagent (`flash-runner`, `Model: "flash"`) | Benefit |
|---|---|---|---|
| **Architectural Decision (ADR Synthesis)** | Optimal (Deep system trade-offs) | Suboptimal (May miss edge cases) | Frontier reasoning utilized where critical |
| **Schema Validation (`validate-okf.mjs`)** | Expensive ($3-$15 / 1M tokens) + High Latency | Ultra-cheap (<$0.15 / 1M tokens) + Sub-second | **95%+ cost reduction** on repetitive tasks |
| **Site Compilation (`export-graph.mjs`)** | High token overhead | Deterministic, rapid execution | Preserves orchestrator session context |
| **Changelog & Frontmatter Formatting** | Prone to verbose output | Fast, strict schema adherence | Zero-drift compliance |

---

## 3. Design Decisions & Architectural Trade-offs

Every technical choice in Second Brain prioritizes **zero-friction human capture**, **low-token AI agent consumption**, **long-term data sovereignty**, and **instantaneous zero-maintenance execution**.

### 3.1 Plain Markdown + Google OKF v0.2 vs. Competing Knowledge Architectures

| System | Storage Format | Machine Readability (AI Agents) | Schema Enforcement | Build Dependencies | Portability & Longevity |
|---|---|---|---|---|---|
| **Second Brain (OKF v0.2)** | **Plain Git Markdown** | **Optimal** (Progressive disclosure via `index.md` trees) | **Strict** (`validate-okf.mjs`) | **Zero** (Pure Node.js standard library) | **100% Open & Portable** (Runs anywhere for decades) |
| **Notion / Confluence** | Proprietary Cloud Database | Poor (Rate-limited APIs, large JSON AST payloads, high token costs) | Loose / Vendor Managed | Heavy Cloud Infrastructure | Zero (Vendor lock-in, recurring SaaS cost, export friction) |
| **Raw Obsidian Vault** | Local Markdown (`[[wikilinks]]`) | Moderate (Flat vaults require brute-force directory scanning) | None (Unstructured sprawl, broken links allowed) | Depends on community plugins | High, but `[[wikilinks]]` break outside Obsidian tooling |
| **Docusaurus / MkDocs / Next.js** | Markdown + MDX / Config | Moderate (Configuration spread across YAML, JSON, and TSX) | Partial | Heavy (`node_modules`, npm dependencies, bundlers) | Moderate (Tied to framework lifecycle & breaking upgrades) |

#### Detailed Trade-Off Rationale:
1. **Why Not Notion or Confluence?** Proprietary cloud databases introduce network latency, API rate limits, authentication barriers, and unpredictable payload structures that waste agent context windows. They cannot be versioned via Git branches or diffed line-by-line during automated code reviews.
2. **Why Not Raw Obsidian Vaults?** Obsidian encourages flat directory sprawl and non-standard `[[wikilink]]` syntax that fails standard Markdown parsers without third-party plugins. Without automated schema enforcement, links decay rapidly as notes are renamed or moved.
3. **Why Not Heavy Documentation Frameworks (Docusaurus, MkDocs, Next.js, Astro)?** Modern static site generators ship with hundreds of megabytes of `node_modules`, complex Webpack/Vite bundlers, and configuration files that require frequent maintenance. Upgrading dependencies risks breaking builds. Second Brain replaces that entire stack with **two clean Node.js scripts** executed with standard library modules only.
4. **Why Google Open Knowledge Format (OKF v0.2)?** OKF establishes a strict two-tier hierarchy:
   - Root [`index.md`](./index.md) lists major domain topics with single-line abstracts.
   - Topic [`<topic>/index.md`](./onboarding/index.md) files list the typed notes inside that folder.
   - Typed content notes declare standard YAML metadata (`type`, `title`, `description`, `tags`, `updated`).
   This allows an AI agent to locate any concept in the repository using **Progressive Disclosure** (loading < 2,000 tokens) rather than dumping all notes into context (50,000+ tokens).

---

### 3.2 Zero-Dependency Node.js Standard Library (`node:fs`, `node:path`)

Both [`scripts/validate-okf.mjs`](./scripts/validate-okf.mjs) and [`scripts/export-graph.mjs`](./scripts/export-graph.mjs) import **exclusively** from Node.js built-ins:
```javascript
import fs from 'node:fs';
import path from 'node:path';
```

#### Trade-Off Rationale:
- **Zero Supply-Chain Risk:** No malicious npm packages, typosquatting vectors, or security audit vulnerabilities (`npm audit`).
- **Zero Installation Delay:** Developers and CI runners clone the repository and immediately execute `node scripts/validate-okf.mjs` without running `npm install` or waiting for package downloads.
- **Eternal Reproducibility:** The build pipeline will function identically 10 years from now on any POSIX environment with Node.js installed, immune to deprecated npm packages or abandoned registries.
- **Sub-50ms Execution:** The entire validator and compiler run in **under 45 milliseconds**, enabling continuous validation in pre-commit hooks and real-time live preview feedback loops.

---

### 3.3 Single-File Static HTML Output with Embedded JSON `data` Payload

Instead of building a Client-Side Single Page Application (SPA) that issues asynchronous `fetch('/api/graph.json')` requests, [`scripts/export-graph.mjs`](./scripts/export-graph.mjs) serializes the entire parsed repository into a JSON payload and directly embeds it into the HTML document:

```javascript
// Embedded directly inside the <script> block of the emitted HTML
const data = ${JSON.stringify(bundleData)};
```

The compiler writes this complete, standalone application to four destinations:
- `site/index.html` (Default split-screen view: Sidebar + Reader + Dockable Visualizer)
- `site/mindmap/index.html` (Full-screen interactive Mind Map)
- `site/graph/index.html` (Full-screen Force-Directed Semantic Graph)
- `/tmp/okf-foam-graph.html` (Instant local preview artifact on macOS/Linux)

#### Trade-Off Rationale:
- **CORS-Free Local Preview:** SPAs using `fetch()` fail immediately when opened from local disk via the `file:///` protocol due to browser Cross-Origin Resource Sharing (CORS) security restrictions. By inlining `const data = {...}`, Second Brain can be opened directly in Safari or Chrome via `open site/index.html` with zero local web server required.
- **Zero Network Latency / Zero Waterfall:** The initial HTML response contains 100% of the content, metadata, full-text search index, and graph topology. Navigation between notes, tag filtering, and canvas rendering is instant (0ms latency).
- **Universal Static Hosting:** The emitted `site/` folder can be hosted on GitHub Pages, Cloudflare Pages, Netlify, an Amazon S3 bucket, or an offline USB drive without server-side routing or URL rewrite rules.

---

### 3.4 Exclusion of `log.md` from Semantic Graph Edges

In [`scripts/export-graph.mjs`](./scripts/export-graph.mjs), `log.md` is explicitly isolated from the network graph:
```javascript
// The changelog links to whatever was edited. Those links describe edits, not
// relationships between ideas, so log.md is left out of the graph and backlinks.
const GRAPH_EXCLUDED = new Set(['log.md']);

function addEdge(sourceId, targetId) {
  if (!targetId || sourceId === targetId) return;
  if (GRAPH_EXCLUDED.has(sourceId)) return;
  if (!linkSet.has(key) && !GRAPH_EXCLUDED.has(targetId)) {
    linkSet.add(key);
    links.push({ source: sourceId, target: targetId });
  }
  const bl = backlinksMap.get(targetId);
  if (bl && !bl.includes(sourceId)) bl.push(sourceId);
}
```

#### Trade-Off Rationale:
- **Preventing Hub-and-Spoke Topology Pollution:** Every autonomous AI write prepends an entry to [`log.md`](./log.md) linking to the modified note (e.g., `- Updated [ADR-001](./decisions/adr-001-okf-markdown-knowledge-base.md)`). Over dozens of edits, `log.md` would accumulate edges to every single note in the repository.
- **Preserving Conceptual Topology:** If included, `log.md` would become a massive gravitational super-hub in the Force-Directed Graph, pulling unrelated concepts together simply because they were edited recently. Furthermore, every note's Backlinks box would be cluttered with repetitive `log.md` references. Excluding `log.md` preserves authentic semantic connections between ideas while keeping the changelog fully accessible in the reader.

---

### 3.5 Progressive Disclosure Branch Folding & Dynamic Unfolding (`expandPathToDoc`)

In the interactive Mind Map canvas, all topic folder branches (`branch:onboarding`, `branch:runbooks`, `branch:decisions`, `branch:reference`, `branch:dev-tools`) and subgroup branches (`subgroup:dev-tools:Themes`) are initialized with:
```javascript
collapsed: true
```

When a user or AI agent navigates to a note via direct URL hash, search modal result, or sidebar link, the client-side engine executes `expandPathToDoc(id)`:
```javascript
function expandPathToDoc(docId) {
  if (!rootTree) return;
  function walk(n) {
    if (!n.children || !n.children.length) return false;
    let found = false;
    for (const c of n.children) {
      if (c.docId === docId || walk(c)) found = true;
    }
    if (found && (n.sublabel === 'branch' || n.sublabel === 'subgroup')) {
      n.collapsed = false; // Unfold ancestor branch
    }
    return found;
  }
  walk(rootTree);
}
```

#### Trade-Off Rationale:
- **Zero Spatial Sprawl:** Fully expanding a 50+ note knowledge tree creates an enormous canvas (> 5,000 pixels high) requiring extensive panning and zooming. By collapsing branches by default, the Mind Map presents an immaculate, high-level structural overview resembling an executive mental model.
- **Contextual Reveal on Demand:** Users see the high-level taxonomy first. When a specific note is selected, only the relevant branch and its siblings unfold, spotlighting the exact location of the document within the knowledge tree without visual clutter.

---

### 3.6 Slide-Over Reader Panel (`.content-split.peek`) vs. Context-Destructive Navigation

When viewing the full-screen interactive Mind Map (`?view=mindmap`) or Force-Directed Graph (`?view=graph`), selecting a node, clicking a sidebar document, or pressing `Enter` on a search result does **not** switch views or navigate away from the canvas.

Instead, the UI dynamically applies the `.peek` class to `.content-split`, opening an in-place slide-over drawer from the right edge:
```css
.content-split.peek main.doc-pane {
  display: block !important;
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(640px, 92%);
  z-index: 40;
  padding: 0 36px 64px;
  border-left: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-lg);
  animation: peek-in 0.18s ease-out;
}
```

The slide-over header provides two controls:
1. **Split view:** Promotes the current note into standard side-by-side editing/reading layout (`setViewSwitch('split')`).
2. **Close &times; (`Esc`):** Dismisses the drawer (`closePeek()`), restoring full unobstructed canvas interaction.

#### Trade-Off Rationale:
- **Spatial Memory Preservation:** Forcing a full page navigation destroys the user's canvas zoom level, pan coordinates, and spatial memory. The slide-over reader lets researchers read deep documentation, verify code snippets, and cross-reference backlink connections while keeping the visual topology directly behind the drawer.

---

### 3.7 Three Architectural Themes & Zero-Emoji UI Chrome

Second Brain implements a bespoke multi-theme visual system tailored for deep technical work:

1. **`paper` (Default — Warm Editorial Linen):**
   - Canvas: `#faf9f5` | Surface: `#f3f1eb` | Elevated: `#eae6dd` | Text: `#1c1917` | Hairline: `#e4e1d6`
   - Inspired by Anthropic research interfaces, Readwise Reader, and fine editorial print typography.
   - Code blocks styled with warm Shiki Vitesse muted tokens.
2. **`light` (Crisp Daylight):**
   - Canvas: `#ffffff` | Surface: `#f8fafc` | Elevated: `#f1f5f9` | Text: `#0f172a` | Border: `#e2e8f0`
   - Modeled after Stripe Docs, Apple Developer, and GitHub Light documentation standards.
3. **`dark` (Neutral Carbon):**
   - Canvas: `#111110` | Surface: `#161615` | Elevated: `#1e1e1c` | Text: `#ededec` | Border: `#292927`
   - Pure neutral dark tone with zero neon saturation or blue/purple cast.
   - Code blocks paired with Tokyo Night Storm syntax highlighting and one-click SVG copy buttons.

#### Zero-Emoji Design Philosophy:
- **100% Crisp 1.5px Stroke Inline SVGs:** All UI controls, folder toggles, search glyphs, splitters, copy buttons, and status icons are rendered via lightweight, razor-sharp vector SVGs.
- **Elimination of Visual Noise:** Emojis render inconsistently across operating systems (Apple Color Emoji vs. Windows Segoe UI Emoji vs. Linux Noto) and distract from technical information. Standardized 1.5px stroke geometry ensures visual elegance and typographic rhythm across all screens.

---

## 4. Complete Dependencies Inventory

Second Brain is engineered with strict dependency hygiene. It distinguishes between **zero-dependency build requirements**, **progressive browser enhancements**, and **CI/CD infrastructure**.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. BUILD-TIME / CLI ENVIRONMENT                                             │
│    • Node.js >= 18.0.0 (Supports Node 18, 20 LTS, 22+)                      │
│    • Standard Library Modules Only: node:fs, node:path                      │
│    • Zero package.json, zero node_modules, zero third-party dependencies    │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. BROWSER RUNTIME CDN LIBRARIES (With Full Offline Fallbacks)              │
│    • Google Fonts CDN: Vercel Geist + JetBrains Mono                        │
│        Fallback: -apple-system, BlinkMacSystemFont, Segoe UI, Menlo         │
│    • MiniSearch v7.1.0 CDN: Fuzzy prefix full-text search                   │
│        Fallback: Native runSpotlightSearch() multi-field substring matcher  │
│    • highlight.js v11.9.0 CDN: Syntax highlighting runtime                  │
│        Fallback: Native highlightLineTokens() 12-token regex tokenizer      │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. CI/CD GITHUB ACTIONS RUNTIME                                             │
│    • actions/checkout@v4                                                    │
│    • actions/setup-node@v4 (node-version: 20)                               │
│    • actions/configure-pages@v5                                             │
│    • actions/upload-pages-artifact@v3 (path: site/)                         │
│    • actions/deploy-pages@v4                                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Build-Time Environment
- **Node.js Runtime:** Requires Node.js version 18.0.0 or higher (compatible with Node 20 LTS and Node 22+).
- **Native Modules:** Uses only `node:fs` (synchronous file tree traversal, reading, writing, and directory creation) and `node:path` (POSIX-normalized path resolution).
- **Execution Cost:** Zero network access required during compilation; builds run completely offline.

### 4.2 Browser CDN Enhancements & Built-in Offline Fallbacks
To provide top-tier typography, fuzzy search, and code highlighting without bundling Megabytes of vendor JavaScript, the static HTML shell includes asynchronous CDN scripts that fail gracefully to robust built-in fallbacks if the user is offline or air-gapped:

| Capability | Primary CDN Resource | Built-In Offline Fallback Mechanism | Behavior When Offline |
|---|---|---|---|
| **Typography** | Google Fonts: `Geist` (400-700) & `JetBrains Mono` (400-600) | `font-family: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;` | Renders immediately with native OS system sans and monospace fonts without layout shift. |
| **Full-Text Search** | `MiniSearch` v7.1.0 (`https://cdn.jsdelivr.net/npm/minisearch@7.1.0/dist/umd/index.min.js`) | Native substring & token search inside `runSpotlightSearch()` | If `window.MiniSearch` is undefined, searches title, subtitle, tags, and section lines using exact and tokenized substring matching. |
| **Code Highlighting** | `highlight.js` v11.9.0 (`https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js`) | Native `highlightLineTokens(rawLine, lang)` 12-token regex tokenizer | Highlights comments, strings, keys, keywords, functions, builtins, booleans, commands, flags, and numbers using CSS tokens. |

### 4.3 CI/CD Deployment Dependencies
Automated deployments are defined in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) using official, audited GitHub Actions:
- `actions/checkout@v4`: Checks out the repository main branch.
- `actions/setup-node@v4`: Provisions Node.js 20 on `ubuntu-latest`.
- `actions/configure-pages@v5`: Prepares GitHub Pages metadata and permissions.
- `actions/upload-pages-artifact@v3`: Packages the generated `site/` folder into a Pages deployment bundle.
- `actions/deploy-pages@v4`: Deploys the Pages bundle directly to GitHub Pages CDN.

---

## 5. Repository Directory Contract & OKF v0.2 Schema

```
/ (Repository Root)
├── index.md                 # Root OKF Manifest (Lists topics; no type)
├── inbox.md                 # Frictionless capture scratchpad (type: inbox)
├── AGENTS.md                # AI agent operational guidelines (type: guideline)
├── ARCHITECTURE.md          # Technical architecture reference (type: reference)
├── log.md                   # Chronological audit log (No type; excluded from graph)
├── README.md                # GitHub repository landing page (Exempt from site build)
├── scripts/
│   ├── validate-okf.mjs     # OKF frontmatter and link integrity validator
│   └── export-graph.mjs     # Static site compiler and HTML bundle generator
├── .github/workflows/
│   └── deploy.yml           # GitHub Pages CI/CD workflow
├── onboarding/              # Topic: Quickstarts & guides
│   ├── index.md             # Topic manifest (Lists onboarding notes; NO frontmatter)
│   ├── second-brain-quickstart.md
│   └── contributor-checklist.md
├── runbooks/                # Topic: Operational step-by-step procedures
│   ├── index.md             # Topic manifest (Lists runbooks; NO frontmatter)
│   └── deploy-docs-site.md
├── decisions/               # Topic: Architecture Decision Records (ADRs)
│   ├── index.md             # Topic manifest (Lists decisions; NO frontmatter)
│   └── adr-001-okf-markdown-knowledge-base.md
├── reference/               # Topic: Technical specs & terminology
│   ├── index.md             # Topic manifest (Lists reference specs; NO frontmatter)
│   ├── open-knowledge-format.md
│   └── glossary.md
└── dev-tools/               # Topic: Developer environment configurations
    ├── index.md             # Topic manifest (Lists dev tools; NO frontmatter)
    ├── macos-terminal-tokyo-glass.md
    └── tokyo-night-storm.md
```

### 5.1 Schema Rules Table

| File Pattern | Role | Required Frontmatter | Disallowed Frontmatter | Graph Edge Status |
|---|---|---|---|---|
| `index.md` | Root catalog manifest | `okf_version: "0.2"`, `title`, `description` | `type` (Must not declare concept type) | Root node (`root-folder` / `root-tag`) |
| `<topic>/index.md` | Topic catalog manifest | **None** (Must begin with `# Heading`) | Any YAML frontmatter (`---`) | Included as topic index document |
| `<topic>/<slug>.md` | Content note | `type`, `title`, `description`, `updated` | Missing `type` | Included in graph & backlinks |
| `inbox.md` | Quick capture scratchpad | `type: inbox`, `title`, `description`, `updated` | None | Included in Quick Capture branch |
| `AGENTS.md` | Agent guidelines | `type: guideline`, `title`, `description`, `updated` | None | Included in AI & Governance branch |
| `ARCHITECTURE.md` | System blueprint | `type: reference`, `title`, `description`, `updated` | None | Included in AI & Governance branch |
| `log.md` | Changelog audit | `# Change Log` header | `type` | **Excluded** (`GRAPH_EXCLUDED = new Set(['log.md'])`) |
| `README.md` | GitHub landing page | None | None | **Excluded** from site build |

### 5.2 Allowed OKF Document Types
Content notes must specify one of the following canonical OKF types:
- `concept`: Foundational theoretical knowledge, architecture definitions, or conceptual overviews.
- `decision`: Architecture Decision Records (ADRs) documenting context, options, and rationale.
- `playbook`: Prescriptive, step-by-step operational runbooks or tutorials.
- `reference`: Technical specifications, API contracts, glossaries, or cheatsheets.
- `note`: General atomic observations, reading summaries, or synthesis.
- `guideline`: Policy documents, AI agent instructions, or contributor rules.
- `inbox`: Ephemeral staging document for raw notes awaiting promotion.

---

## 6. Validator Internals (`scripts/validate-okf.mjs`)

The validator enforces structural integrity across all files in the repository. It scans all Markdown files recursively, skipping directories in `IGNORED_DIRS`:
```javascript
const IGNORED_DIRS = new Set([
  '.git', '.github', '.vscode', '.foam', 'node_modules',
  'scripts', 'site', 'dist', 'assets', 'videos'
]);
```

### Validation Pass Sequence:
1. **Root Manifest Check:** Asserts that root [`index.md`](./index.md) exists, contains `okf_version: "0.2"`, and does not specify a `type` attribute.
2. **Subfolder Index Checks:** For every file named `index.md` in subdirectories, verifies that `parseFrontmatter(content)` returns `null`. Under OKF v0.2, subfolder index files must have no frontmatter to prevent duplicate node registration.
3. **Changelog Isolation:** Asserts that [`log.md`](./log.md) does not specify a concept `type`.
4. **Content Note Schema Check:** For all standard notes, parses YAML frontmatter and verifies that `type` is present and non-empty. Warns if `title` or `description` are absent.
5. **Link Integrity Resolver (`validateLinks`):**
   - Strips all fenced code blocks (```...```) and inline code spans (`...`) to prevent false positives from code examples.
   - Extracts all Markdown links matching `/\[([^\]]+)\]\(([^)]+)\)/g`.
   - Filters out external protocols (`http://`, `https://`, `mailto:`) and pure anchor links (`#section`).
   - Resolves the target path relative to the current file using `path.resolve(path.dirname(filePath), cleanTarget)`.
   - Calls `fs.existsSync(resolved)` and logs an error if the file is missing.
6. **Exit Code Contract:** If any error is encountered (`errors > 0`), the script terminates immediately with `process.exit(1)`.

---

## 7. Static Compiler & Portal Internals (`scripts/export-graph.mjs`)

The static compiler transforms the repository into an interactive, high-density documentation portal.

### 7.1 Section Extraction & Search Pre-Indexing
For each Markdown file, `extractSections(body)` walks through the body line by line, maintaining code fence state. It builds:
- `headings`: Array of `{ level, text, slug }` used to construct the right-hand scrollspy Table of Contents (`.doc-toc`).
- `sections`: Array of `{ level, title, slug, text }` indexing the body paragraphs under each heading for high-relevance search snippets.

### 7.2 Data Aggregation (`bundleData`)
The compiler constructs a unified JavaScript data bundle containing:
- `nodes`: Array of all parsed documents with title, subtitle, type, group, description, updated date, tags, sections, body, backlinks, and node colors.
- `links`: Array of directed edges `{ source, target }` representing relative Markdown links (excluding `log.md`).
- `sidebarGroups`: Ordered topic folders with assigned branch palette accents (`cobalt`, `terracotta`, `sage`, `plum`, `teal`).
- `tags`: Alphabetically sorted array of `{ name, count }` pairs.
- `mindMapByFolder`: Hierarchical tree grouped by directory path and optional `group` frontmatter.
- `mindMapByTag`: Hierarchical tree grouped by cross-cutting `#tags`.

### 7.3 Canvas Mind Map Layout Engine (`computeTreeLayout`)
The interactive Mind Map canvas calculates node coordinates using a deterministic hierarchical tree algorithm:

```javascript
const LEVEL_X_GAP = 272; // Horizontal column separation between tree levels
const LEAF_Y_GAP = 66;   // Vertical spacing between adjacent leaf nodes

function computeTreeLayout(root) {
  visibleNodes = [];
  visibleLinks = [];
  let leafIndex = 0;

  function measure(node, depth) {
    node.depth = depth;
    // Calculate node dimensions based on text length
    const titleW = ctx.measureText(node.label).width;
    const subW = ctx.measureText(node.subtitle || '').width;
    node.w = Math.min(246, Math.max(154, Math.max(titleW, subW) + 38));
    node.h = node.sublabel === 'section' ? 34 : 52;
    node.x = depth * LEVEL_X_GAP;

    const hasKids = node.children && node.children.length > 0;
    if (!hasKids || node.collapsed) {
      // Leaf node or folded branch gets sequential leaf Y slot
      node.y = leafIndex * LEAF_Y_GAP;
      leafIndex++;
    } else {
      // Recurse children and position parent vertically centered between first and last child
      for (const child of node.children) {
        measure(child, depth + 1);
        visibleLinks.push({ source: node, target: child });
      }
      node.y = (node.children[0].y + node.children[node.children.length - 1].y) / 2;
    }
    visibleNodes.push(node);
  }

  measure(root, 0);
  const rootY = root.y;
  for (const n of visibleNodes) n.y -= rootY; // Normalize tree relative to root
}
```

#### Cubic Bezier Connector Math:
Links between parent nodes and child cards are rendered with cubic Bezier curves matching the branch's architectural color palette:
```javascript
const startX = s.x + s.w + (s.children?.length ? 22 : 0);
const startY = s.y;
const endX = t.x;
const endY = t.y;
const midX = (startX + endX) / 2;

ctx.beginPath();
ctx.moveTo(startX, startY);
ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
ctx.strokeStyle = isHighlighted ? accent.bar : accent.edge;
ctx.lineWidth = isHighlighted ? 2.1 : 1.4;
ctx.stroke();
```

---

### 7.4 Force-Directed Semantic Graph Physics Engine (`stepForceGraph`)
The full-screen semantic graph calculates real-time physics using an n-body force simulation:

```javascript
function stepForceGraph() {
  // 1. Coulomb Repulsion (All node pairs repel each other inversely by distance squared)
  for (let i = 0; i < graphNodes.length; i++) {
    for (let j = i + 1; j < graphNodes.length; j++) {
      const a = graphNodes[i], b = graphNodes[j];
      let dx = b.gx - a.gx, dy = b.gy - a.gy;
      let distSq = dx * dx + dy * dy + 1;
      let dist = Math.sqrt(distSq);
      let f = 11500 / distSq; // Repulsion constant = 11,500
      a.vx -= (dx / dist) * f; a.vy -= (dy / dist) * f;
      b.vx += (dx / dist) * f; b.vy += (dy / dist) * f;
    }
  }

  // 2. Hooke's Law Spring Attraction (Connected nodes pull toward rest distance 165px)
  for (const l of data.links) {
    const a = nodeById.get(l.source), b = nodeById.get(l.target);
    if (!a || !b) continue;
    let dx = b.gx - a.gx, dy = b.gy - a.gy;
    let dist = Math.sqrt(dx * dx + dy * dy) || 1;
    let f = (dist - 165) * 0.045; // Spring constant = 0.045
    a.vx += (dx / dist) * f; a.vy += (dy / dist) * f;
    b.vx -= (dx / dist) * f; b.vy -= (dy / dist) * f;
  }

  // 3. Central Gravitational Pull and Velocity Damping
  for (const n of graphNodes) {
    if (n === draggingGraphNode) continue;
    // index.md experiences stronger center gravity to anchor the visualization
    const pull = n.id === 'index.md' ? 0.08 : 0.012;
    n.vx += (0 - n.gx) * pull;
    n.vy += (0 - n.gy) * pull;
    n.vx *= 0.78; // Velocity damping factor (78% retained per frame)
    n.vy *= 0.78;
    n.gx += n.vx;
    n.gy += n.vy;
  }
}
```

---

### 7.5 Search Engine & Offline Fallback Architecture
The search palette (`Cmd+K` / `Ctrl+K`) operates in two distinct modes:

1. **CDN Mode (`MiniSearch`):** When the CDN script loads successfully, an in-memory index is constructed across `docTitle`, `sectionTitle`, `text`, and `tagsStr` with fuzzy matching (`fuzzy: 0.2`), prefix matching (`prefix: true`), and title weighting (`boost: { docTitle: 3, sectionTitle: 2 }`).
2. **Offline Fallback Mode:** If the user is offline or air-gapped, `runSpotlightSearch()` executes a native multi-field substring search across all node titles, subtitles, descriptions, `#tags`, and section paragraphs. Matching substrings are safely highlighted using `<mark>` tags via `highlightText(text, query)`.

---

### 7.6 Code Highlighting & 12-Token Semantic Tokenizer
When `highlight.js` CDN is unreachable, the portal uses `highlightLineTokens(rawLine, lang)` to tokenize code blocks into 12 semantic CSS classes:
- `tok-com`: Comments (`# ...` in Bash/Python/YAML, `// ...` in JS/TS).
- `tok-str`: Quoted string literals (`"..."`, `'...'`).
- `tok-key`: Object keys and YAML properties (`"key":` or `key:`).
- `tok-kw`: Reserved keywords (`export`, `const`, `function`, `return`, `import`).
- `tok-fn`: Invoked function names (`myFunction(...)`).
- `tok-builtin`: System built-ins (`process`, `console`, `Math`, `JSON`).
- `tok-bool`: Boolean literals (`true`, `false`, `null`).
- `tok-cmd`: Terminal command binaries (`npm`, `git`, `node`, `open`, `mkdir`).
- `tok-flag`: CLI flags (`-v`, `--recursive`, `-p`).
- `tok-num`: Numeric literals (`0`, `123`, `0.78`).
- `tok-var`: Variable expansions (`$VAR`, `${VAR}`).
- `tok-op`: Operators and punctuation (`=`, `=>`, `:`, `;`).

---

## 8. Step-by-Step "How an AI Agent Can Rebuild This Entire System From Scratch" Blueprint

If an autonomous AI coding agent is initialized inside an **empty directory** with only `ARCHITECTURE.md` and `AGENTS.md`, it can deterministically reconstruct the entire working Second Brain repository by executing the four phases below.

### Phase 1: OKF Directory & Frontmatter Scaffolding
1. **Initialize Git Repository:**
   ```bash
   git init
   ```
2. **Create Reserved Root Files:**
   - Create [`index.md`](./index.md):
     ```yaml
     ---
     okf_version: "0.2"
     title: "Second Brain"
     description: "AI-native personal knowledge base and static documentation portal."
     ---

     # Second Brain

     A developer knowledge engine built on Google's Open Knowledge Format.

     ## Topics

     - [Onboarding](./onboarding/index.md) - Guides and checklists for new contributors.
     - [Runbooks](./runbooks/index.md) - Operational playbooks and deployment procedures.
     - [Decisions](./decisions/index.md) - Architecture Decision Records (ADRs).
     - [Reference](./reference/index.md) - Technical specifications and glossaries.
     - [Dev Tools](./dev-tools/index.md) - Local CLI setups and environment configs.
     ```
   - Create [`inbox.md`](./inbox.md):
     ```yaml
     ---
     type: inbox
     title: "Quick Capture"
     subtitle: "Scratchpad & raw ideas"
     description: "Unstructured thoughts awaiting review and promotion."
     tags: [inbox]
     updated: YYYY-MM-DD
     ---

     # Quick Capture
     ```
   - Create [`log.md`](./log.md):
     ```markdown
     # Change Log (`log.md`)

     *(Maintained automatically by AI — you never need to edit this file manually.)*

     ## YYYY-MM-DD

     - **[init]** Initialized repository structure and core documentation.
     ```
3. **Scaffold Topic Folders:**
   - For each topic (`onboarding`, `runbooks`, `decisions`, `reference`, `dev-tools`), create `<topic>/index.md` containing **NO YAML frontmatter**, a top-level `# Heading`, a one-line description, and a `## Notes` section.
   - Populate content notes (`<topic>/<slug>.md`) with valid YAML frontmatter declaring `type`, `title`, `subtitle`, `description`, `tags`, and `updated: YYYY-MM-DD`.

---

### Phase 2: Implement the Validator (`scripts/validate-okf.mjs`)
1. Create directory `scripts/`.
2. Write `scripts/validate-okf.mjs` using only `node:fs` and `node:path`:
   - Set up `IGNORED_DIRS = new Set(['.git', '.github', '.vscode', '.foam', 'node_modules', 'scripts', 'site', 'dist', 'assets', 'videos'])`.
   - Implement `parseFrontmatter(content)`: detect `^---\r?\n`, locate next `\n---`, parse key-value lines into a plain object.
   - Implement `walkMarkdownFiles(dir)`: recursively scan for `.md` files outside `IGNORED_DIRS`.
   - Implement `validateLinks(filePath, content)`: strip fenced code blocks and inline code spans; extract Markdown links; skip external URLs (`http`, `mailto`) and anchor tags (`#`); resolve relative paths; verify `fs.existsSync(resolvedPath)`.
   - Verify root `index.md` has `okf_version` and no `type`.
   - Verify subfolder `index.md` files have no frontmatter.
   - Verify `log.md` has no `type`.
   - Verify all content notes have `type`, `title`, and `description`.
   - Exit with `process.exit(1)` if `errors > 0`.
3. Test validator execution:
   ```bash
   node scripts/validate-okf.mjs
   ```

---

### Phase 3: Implement the Static Compiler (`scripts/export-graph.mjs`)
1. Write `scripts/export-graph.mjs` using only `node:fs` and `node:path`:
   - Parse all `.md` files into node objects with YAML metadata, headings, and section-level text paragraphs.
   - Set `GRAPH_EXCLUDED = new Set(['log.md'])`. Exclude `log.md` from directed edges and incoming backlinks.
   - Construct `links` array from relative links between notes.
   - Build `mindMapByFolder` and `mindMapByTag` tree objects with `collapsed: true` on all branch nodes.
   - Bundle all parsed objects into `bundleData`.
2. Embed the UI Application Shell:
   - Construct the HTML string containing:
     - Topbar with Search trigger, view switcher (`Split | Mind Map | Graph | Docs`), and theme toggle.
     - Collapsible left navigation sidebar (`aside#sidebar`).
     - Split content area (`div#content-split`) containing Markdown doc reader (`main#doc-pane`), interactive drag-splitter (`div#resizer-viz`), and Visualizer canvas pane (`div#viz-pane`).
     - Slide-over reader panel styles (`.content-split.peek main.doc-pane`).
     - Canvas rendering engine with `computeTreeLayout()` and `stepForceGraph()`.
     - Inlined JSON bundle: `const data = ${JSON.stringify(bundleData)};`.
     - Search modal with `MiniSearch` and built-in substring fallback.
     - Theme engine managing `data-theme="paper|light|dark"`.
3. Emit Distribution Files:
   - Ensure `site/`, `site/graph/`, and `site/mindmap/` directories exist.
   - Write `site/index.html` with default view `'split'`.
   - Write `site/graph/index.html` with default view `'graph'`.
   - Write `site/mindmap/index.html` with default view `'mindmap'`.
   - Write `/tmp/okf-foam-graph.html` for instant macOS preview.
4. Test compiler execution:
   ```bash
   node scripts/export-graph.mjs
   ```

---

### Phase 4: Configure CI/CD Deployment (`.github/workflows/deploy.yml`)
Create `.github/workflows/deploy.yml` with automated deployment permissions:
```yaml
name: Deploy Second Brain to GitHub Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Validate OKF & Build Site
        run: |
          node scripts/validate-okf.mjs
          node scripts/export-graph.mjs

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: site/

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 9. Operational Verification

To confirm that the Second Brain system is operating at 100% compliance:

```bash
# Run both validation and compilation in sequence:
node scripts/validate-okf.mjs && node scripts/export-graph.mjs
```

**Passing Criteria:**
- `validate-okf.mjs` outputs `0 errors` and `0 warnings`.
- `export-graph.mjs` emits all static HTML bundles in under 50ms.
- All internal Markdown relative links resolve to real files on disk.
