---
type: guideline
title: "AI Agent Guidelines"
subtitle: "Operational manual, multi-model delegation, and OKF v0.2 rules for AI coding agents"
description: "Complete operational instructions, architectural rationale, dependencies inventory, and reconstruction protocol for autonomous AI agents working in Second Brain."
tags: [okf, ai-agents, workflow, architecture, system-design]
updated: 2026-11-08
---

# AI Agent Guidelines (`AGENTS.md`)

This repository is an **AI-native Second Brain** built on **[Google's Open Knowledge Format (OKF v0.2)](./reference/open-knowledge-format.md)** with an interactive **Developer Docs + Mind Map + Force-Directed Graph** portal.

**Core Mission:** Make knowledge capture effortless for humans while enabling AI coding agents (Antigravity, Claude Code, Cursor, Gemini CLI) to navigate, update, validate, and compile structured knowledge with deterministic accuracy.

The human captures raw thoughts or ideas. The AI agent automatically handles YAML frontmatter, topic indexing, cross-linking, [`log.md`](./log.md) changelog entries, schema validation, and static site compilation.

For deep compiler, math, and layout internals, read [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## 1. Human Agentic Orchestrator & Multi-Model Delegation (`flash-runner`)

Modern engineering shifts developers from manual coders to **Human Agentic Orchestrators** directing autonomous agent swarms. In this paradigm, AI generates code and architectural artifacts at superhuman velocity, creating two acute operational challenges:
1. **The Human Speed Bottleneck:** Humans cannot track dozens of agent sessions, runbooks, and ADRs by reading walls of diffs or chat logs.
2. **Context Window & Cost Waste:** Running high-parameter frontier reasoning models to run shell scripts, format frontmatter, and update indexes is slow and exorbitantly expensive.

Second Brain resolves this with a deterministic **3-Actor Loop**:

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

### The 3-Actor Division of Labor & Vendor-Agnostic Model Routing

1. **Human Agentic Orchestrator:** Captures raw ideas in [`inbox.md`](./inbox.md), visually audits the knowledge base via the Mind Map, Force-Directed Graph, and Instant Search to keep up with fast-moving AI changes, and directs agents.
2. **Frontier Planning Model (`pro` or primary reasoning tier):** Designs architecture, resolves conceptual ambiguities, structures knowledge hierarchies, and coordinates multi-step workflows.
3. **Fast, Low-Cost Execution Subagent (`flash-runner`, `Model: "flash"` or equivalent fast tier):**
   - **Vendor-Agnostic:** Users may use any AI coding harness (Claude Code, Cursor, Windsurf, Codex CLI, GitHub Copilot, Antigravity, Gemini CLI, or local models). If your harness runs a single model without subagents, execute the validation and build commands directly.
   - **Explicit Fast Model Dictation:** Whenever invoking a subagent in harnesses that support model selection for deterministic CLI commands (`node scripts/validate-okf.mjs`, `node scripts/export-graph.mjs`), frontmatter formatting, `<topic>/index.md` updates, or [`log.md`](./log.md) changelog entries, **always dictate the fast tier (`Model: "flash"` or your harness's lightweight subagent tier)** rather than leaving `Model` as default/`inherit`:

```json
{
  "TypeName": "flash-runner",
  "Model": "flash",
  "Role": "OKF Validator & Site Builder",
  "Prompt": "Update <topic>/index.md, prepend log.md, and run node scripts/validate-okf.mjs && node scripts/export-graph.mjs"
}
```

---

## 2. Executable Commands (Run These — Do Not Guess)

The build and validation toolchains require **Node.js 18+** (Node 20 LTS recommended). The toolchain imports **exclusively** from the Node.js standard library (`node:fs`, `node:path`) — **zero `npm install` or third-party packages are required**.

```bash
# 1. Validate OKF v0.2 frontmatter, reserved files, and relative Markdown links
node scripts/validate-okf.mjs

# 2. Compile Markdown into site/index.html, site/mindmap/index.html, site/graph/index.html
node scripts/export-graph.mjs

# 3. Preview generated site locally on macOS (zero web server needed)
open site/index.html
```

> [!TIP]
> If your local environment has multiple Node versions installed or Homebrew path issues, ensure `/usr/local/bin` or a healthy Node 18+ binary is in your `PATH` (e.g. `export PATH="/usr/local/bin:$PATH"`).

---

## 3. Progressive Disclosure Protocol (How Agents Read This Repo)

To preserve your context window tokens and prevent hallucination, **never load every Markdown file in the repository at once**. Always traverse the repository using the 3-step **Progressive Disclosure Protocol**:

1. **Step 1: Start at root [`index.md`](./index.md):**
   Read the root table of contents to see all available high-level topic domains and their one-sentence descriptions.
2. **Step 2: Read the relevant `<topic>/index.md`:**
   Open only the topic folder manifest that matches your current task:
   - [`onboarding/index.md`](./onboarding/index.md) — Quickstarts and contributor checklists ([Second Brain Quickstart](./onboarding/second-brain-quickstart.md), [Contributor Checklist](./onboarding/contributor-checklist.md))
   - [`runbooks/index.md`](./runbooks/index.md) — Operational procedures and deployment guides ([Deploy the Docs Site](./runbooks/deploy-docs-site.md))
   - [`decisions/index.md`](./decisions/index.md) — Architecture Decision Records ([ADR-001](./decisions/adr-001-okf-markdown-knowledge-base.md))
   - [`reference/index.md`](./reference/index.md) — Specifications and glossaries ([Google Open Knowledge Format](./reference/open-knowledge-format.md), [Glossary](./reference/glossary.md))
   - [`dev-tools/index.md`](./dev-tools/index.md) — Local developer setups ([macOS Terminal TokyoGlass](./dev-tools/macos-terminal-tokyo-glass.md), [VS Code Tokyo Night Glass](./dev-tools/tokyo-night-storm.md))
3. **Step 3: Read only the target note(s):**
   Load only the specific document needed to fulfill the request. Traverse relative links only when deeper semantic context is required.

---

## 4. OKF v0.2 Schema & File Rules

Every file in Second Brain adheres to strict schema contracts enforced by [`scripts/validate-okf.mjs`](./scripts/validate-okf.mjs).

### 4.1 Content Notes (`<topic>/<slug>.md`)

Every content note inside a topic folder **must** begin with valid YAML frontmatter:

```yaml
---
type: playbook
title: "Note Title"
subtitle: "Short 4-8 word card subheading"
description: "One-sentence summary used in search and tooltips."
tags: [topic, keyword]
updated: YYYY-MM-DD
---
```

- **Allowed `type` values:** `concept`, `decision`, `playbook`, `reference`, `note`, `guideline`, `inbox`.
- **Optional `group` field:** Adding `group: "Subgroup Name"` (e.g., `group: "Themes"` in `dev-tools/`) nests those notes into a collapsible sub-branch on the Mind Map canvas and sidebar tree.
- **File naming:** Lowercase `kebab-case.md`. Never nest folders deeper than one topic level (`<topic>/<note>.md`).

### 4.2 Topic Index Files (`<topic>/index.md`)

Subfolder `index.md` files **must have NO YAML frontmatter** (`scripts/validate-okf.mjs` will fail if a subfolder `index.md` has frontmatter). Format them with a top-level `# Heading`, a one-sentence summary, and a bulleted list of relative links:

```markdown
# Topic Name

One-sentence description of what lives in this topic.

## Notes

- [Note Title](./note-slug.md) - One-sentence summary of the note.
```

### 4.3 Reserved Root Files

- [`index.md`](./index.md): Declares `okf_version: "0.2"`, `title`, and `description`, and must **not** declare `type`. Lists **topics**, not individual notes.
- [`inbox.md`](./inbox.md): User's quick capture scratchpad (`type: inbox`). When asked to organize the inbox, promote raw thoughts into typed notes inside the appropriate topic folders.
- [`log.md`](./log.md): Chronological changelog (`# Change Log`). Must **not** declare `type`. Links inside `log.md` are excluded from the knowledge graph (`GRAPH_EXCLUDED = new Set(['log.md'])`) so changelog history does not clutter conceptual graph topology.
- `README.md`: GitHub repository landing page (exempt from the compiled portal).

---

## 5. Key Architectural Design Decisions & Rationale

When creating or modifying notes and tools, agents must understand the architectural principles governing this codebase:

1. **Plain Markdown + Google OKF v0.2 over Heavy Tools:**
   We avoid proprietary databases (Notion, Confluence) and heavy doc frameworks (Docusaurus, MkDocs, Next.js). Markdown is Git-diffable, vendor-agnostic, and parsed natively by AI models. OKF v0.2's structured hierarchy reduces agent exploration from 50,000+ tokens to < 2,000 tokens per query.
2. **Zero-Dependency Standard Library (`node:fs`, `node:path`):**
   No `package.json` or `node_modules` are permitted in the build toolchain. This guarantees sub-50ms execution speed, zero supply-chain vulnerabilities, zero version drift, and guaranteed execution 10 years into the future.
3. **Single-File Static HTML Output with Embedded Data:**
   `scripts/export-graph.mjs` inlines `const data = ${JSON.stringify(bundleData)};` into the HTML shell. This eliminates CORS errors when viewing via `file:///` URLs, removes client-side network waterfalls, and makes the portal portable to any static host (GitHub Pages, S3, offline USB).
4. **Exclusion of `log.md` from Graph Topology:**
   Because every edit touches `log.md`, allowing links from `log.md` into the graph would turn it into a massive super-hub, creating an illegible hairball. `GRAPH_EXCLUDED = new Set(['log.md'])` ensures only genuine conceptual links populate graph edges and backlinks.
5. **Collapsed Branches by Default (`collapsed: true`):**
   Mind Map topic branches and subgroups start collapsed to avoid vertical visual sprawl. When navigating to any note, `expandPathToDoc(id)` automatically unrolls only the ancestor branch, keeping the user's mental model focused.
6. **Slide-Over Reader Panel (`.content-split.peek`):**
   Clicking a node in full-screen Mind Map or Graph views opens the document in a right-hand slide-over drawer (`width: min(640px, 92%)`) rather than switching views. This preserves the user's canvas zoom, pan position, and spatial memory.
7. **Three Architectural Themes & Zero-Emoji UI Chrome:**
   The portal provides three calibrated palettes: `paper` (warm editorial linen `#faf9f5`), `light` (crisp daylight `#ffffff`), and `dark` (neutral carbon `#111110` with Tokyo Night Storm code blocks). All UI chrome uses 100% 1.5px stroke inline SVGs for clean, professional developer documentation.

---

## 6. Dependencies Inventory

| Layer | Component | Specification | Offline Fallback |
|---|---|---|---|
| **Build-Time** | Node.js Runtime | Node.js >= 18 (`node:fs`, `node:path` only) | Fully offline; zero external network requests. |
| **Typography** | Google Fonts | `Geist` (400-700) & `JetBrains Mono` (400-600) | Falls back to system sans (`-apple-system`, `Segoe UI`) and monospace (`ui-monospace`, `Menlo`). |
| **Search Engine** | `MiniSearch` v7.1.0 | CDN fuzzy prefix index over titles, tags, sections | Built-in `runSpotlightSearch()` multi-field substring matcher. |
| **Code Highlighting**| `highlight.js` v11.9.0 | CDN syntax highlighter (Tokyo Night theme) | Built-in `highlightLineTokens()` 12-token regex semantic tokenizer. |
| **CI/CD** | GitHub Actions | `checkout@v4`, `setup-node@v4`, `deploy-pages@v4` | Deterministic Linux runners on GitHub Pages. |

---

## 7. System Reconstruction Protocol (Rebuilding From Scratch)

If an agent enters an empty directory with only this document and `ARCHITECTURE.md`, it can reconstruct the entire platform by following the **4-Phase Blueprint** in [`ARCHITECTURE.md` Section 8](./ARCHITECTURE.md):

1. **Phase 1: OKF Directory & Frontmatter Scaffolding:** Create `index.md`, `inbox.md`, `log.md`, topic folders (`onboarding/`, `runbooks/`, `decisions/`, `reference/`, `dev-tools/`), topic manifests, and typed content notes.
2. **Phase 2: Validator Implementation:** Create `scripts/validate-okf.mjs` using `node:fs` and `node:path` to enforce frontmatter schema and resolve relative Markdown links.
3. **Phase 3: Compiler Implementation:** Create `scripts/export-graph.mjs` to parse nodes, build links (excluding `log.md`), compute hierarchical Mind Map trees, evaluate Force-Directed Graph physics, embed the UI shell, and emit static HTML files (`site/index.html`, `site/mindmap/index.html`, `site/graph/index.html`, `/tmp/okf-foam-graph.html`).
4. **Phase 4: CI/CD Pipeline:** Create `.github/workflows/deploy.yml` to automatically validate, build, and deploy the `site/` folder to GitHub Pages.

---

## 8. Mandatory Maintenance Checklist on Every Write

Whenever you create, move, or update any note in this repository, execute all 5 steps before completing your turn:

1. **Frontmatter:** Ensure valid YAML frontmatter (`type`, `title`, `subtitle`, `description`, `tags`, `updated: YYYY-MM-DD`) on content notes, and **no** frontmatter on subfolder `index.md` files.
2. **Topic Index:** Add or update the note's link in `<topic>/index.md` (and in root [`index.md`](./index.md) if a new topic was created).
3. **Semantic Graph Links:** Link to genuinely related notes in the Markdown body using relative paths (`[Label](../topic/note.md)`). These links become edges in the Force-Directed Graph and populate automatic Backlinks.
4. **Changelog:** Prepend a concise 1-line entry under today's `## YYYY-MM-DD` heading in [`log.md`](./log.md).
5. **Validate & Compile:** Run both commands and verify `0 errors` and `0 warnings`:
   ```bash
   node scripts/validate-okf.mjs && node scripts/export-graph.mjs
   ```
