# Change Log (`log.md`)

*(Maintained automatically by AI — you never need to edit this file manually.)*

## 2026-11-09

- **[launch-video]** Refined launch video and preview with humanized copy, varied motion styles, and identical cover and outro lockups with trailing hold.

## 2026-11-08

- Upgrade launch video and interactive preview with 3D sculpted anatomical/digital brain (5.5s full 360-degree rotation), typewriter subnotes, animated HUD callouts, live search typing, and Made in New York footer in [videos/build-demos.mjs](./videos/build-demos.mjs), [videos/build-preview.mjs](./videos/build-preview.mjs), and [README.md](./README.md).
- **[video-upgrade]** Upgraded launch video with a 3D rotisserie half-human / half-digital AI brain, shifted slide layouts up, humanized Mind Map slide copy, and added 4-pillar brand header to README.
- **[launch-assets]** Rendered and committed kinetic typography launch video and demo assets (`videos/second-brain-launch.mp4`, `videos/second-brain-launch.gif`, `assets/demo.gif`, `assets/mindmap.gif`, `assets/graph.gif`, `assets/code.gif`).
- **[okf-concept]** Updated [`reference/open-knowledge-format.md`](./reference/open-knowledge-format.md) to explicitly title **Google Open Knowledge Format (OKF)** with a structured 4-layer progressive disclosure table, and humanized [`README.md`](./README.md).
- **[vendor-agnostic]** Documented full AI model, vendor, and CLI ecosystem agnosticism in [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`AGENTS.md`](./AGENTS.md), and removed personal CLI permission notes from Git.
- **[responsive-touch]** Made docs portal fully responsive and touch-enabled on mobile/tablet (1-finger pan/drag, 2-finger pinch-to-zoom, auto-collapsed sidebars, 100dvh layout) and added "Dead Simple to Use" section in README.
- **[docs-orchestration]** Upgraded README, AGENTS.md, and ARCHITECTURE.md with cognitive funneling, model-agnostic 3-actor loop, benchmark matrix, and instant full-text search positioning.
- **[agentic-orchestrator]** Featured the Human Agentic Orchestrator thesis and 3-actor multi-model delegation workflow (Frontier Planning Model + fast execution subagent `flash-runner`) across [`README.md`](./README.md), [`AGENTS.md`](./AGENTS.md), and [`ARCHITECTURE.md`](./ARCHITECTURE.md).
- **[docs-upgrade]** Expanded [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`AGENTS.md`](./AGENTS.md) with comprehensive design decisions & trade-offs, complete dependencies inventory, and a 4-phase deterministic blueprint enabling any AI agent to rebuild the entire Second Brain platform from scratch.

- **[architecture & agents]** Added [`ARCHITECTURE.md`](./ARCHITECTURE.md) and expanded [`AGENTS.md`](./AGENTS.md) with a complete technical blueprint, progressive disclosure protocol, and compiler documentation so any AI agent can immediately operate this repo.
- **[kinetic-marketing]** Added big kinetic movie trailer title cards with cut-to-live-action beats across all demos, updated README.md with high-impact positioning ("Build a Second Brain Knowledge Base to Align Human and Agentic Teams"), and generated lightweight LinkedIn/Slack-ready GIFs & MP4s.
- **[typewriter-hud]** Implemented kinetic Typewriter HUD and Callout badges, optimized GIF and MP4 assets (< 5.5MB) for seamless sharing and inline autoplay on LinkedIn and Slack.
- **[mindmap-gifs]** Collapsed topic branches by default to eliminate vertical clutter in the Mind Map, added automatic ancestor branch unfolding on doc navigation, and regenerated crisp cinematic movie-style demo GIFs with live Paper-to-Dark-mode transitions in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs).
- **[structure]** Replaced flat `notes/` with topic folders ([`onboarding/`](./onboarding/index.md), [`runbooks/`](./runbooks/index.md), [`decisions/`](./decisions/index.md), [`reference/`](./reference/index.md)); added sample [ADR](./decisions/adr-001-okf-markdown-knowledge-base.md), [deploy runbook](./runbooks/deploy-docs-site.md), [contributor checklist](./onboarding/contributor-checklist.md), and [glossary](./reference/glossary.md); root [`index.md`](./index.md) now lists topics; [`AGENTS.md`](./AGENTS.md) updated to match; graph no longer includes changelog links.
- **[readme]** Rewrote [`README.md`](./README.md) as an emoji-free landing page (why/who, Obsidian + MkDocs + search positioning, live links, demo GIF, retina screenshots in `assets/`), and excluded README from the site build in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs).
- **[slide-over]** Clicking a node, sidebar item, or search result in full-screen Graph / Mind Map now opens the note in a slide-over panel (Esc / Close / Split view) instead of leaving full-screen; the address bar now tracks the active view (`?view=`) in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs).
- **[graph-url]** Added dedicated shareable `/graph/` and `/mindmap/` pages plus `?view=` deep links in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs); fixed README live links and removed the unchosen license section.
- **[readme & pages]** Created comprehensive architecture [`README.md`](./README.md), added automated GitHub Pages CI/CD workflow ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)), and configured repository for public GitHub Pages deployment.

## 2026-11-07

- **[simplify]** Simplified workspace to a flat layout: [`index.md`](./index.md), [`inbox.md`](./inbox.md), and a single `notes/` folder ([`notes/how-to-use-this.md`](./notes/how-to-use-this.md)).
- **[add]** Added `dev-tools/` concept notes ([`dev-tools/macos-terminal-tokyo-glass.md`](./dev-tools/macos-terminal-tokyo-glass.md) and [`dev-tools/tokyo-night-storm.md`](./dev-tools/tokyo-night-storm.md)) with step-by-step guides and reusable AI prompts.
- **[mindmap]** Removed Foam VS Code extension clutter, added [`notes/open-knowledge-format.md`](./notes/open-knowledge-format.md), and switched viewer to a collapsible **OKF Mind Map + Developer Docs** portal.
- **[tags & search]** Added OKF `tags` metadata across all notes, collapsible tree sidebar UI, tag filtering, and a `Cmd+K` Spotlight full-text/section search engine in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs).
- **[ui & syntax]** Added `subtitle` frontmatter, 2-line Title + Subheading Mind Map cards, rich floating hover tooltips, and Tokyo Night Storm syntax highlighting with line numbers.
- **[themes & typography]** Grouped Tokyo Night setups ([`dev-tools/macos-terminal-tokyo-glass.md`](./dev-tools/macos-terminal-tokyo-glass.md) and [`dev-tools/tokyo-night-storm.md`](./dev-tools/tokyo-night-storm.md)) under a collapsible `Themes` subgroup in `Dev Tools`, increased default typography scale, and added branch-coded architectural Mind Map palettes.
- **[ux-layout]** Streamlined panel toggles to VS Code-style sidebar layout icons (`btn-toggle-sidebar` and `btn-toggle-viz`), eliminated redundant floating edge expand tabs, and fixed icon alignment in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs).
- **[mindmap-scale]** Removed heading section nodes from Mind Map trees (`docToTreeNode`) to focus exclusively on high-level Concepts, Pages, and Collections for horizontal scalability.
- **[typography]** Set Vercel Geist as the default typography standard, replaced serif/mono options with industry-standard doc fonts (Geist, Inter, and Plus Jakarta Sans), and synchronized Canvas Mind Map rendering.
- **[ux-refinements]** Sorted tags alphabetically (A-Z), removed font selector controls to standardize on Geist, enlarged topbar search button with vibrant query `<mark>` highlighting, and refined Mind Map color schemes across Paper, Light, and Dark modes.
- **[spotlight-canvas]** Expanded Spotlight search modal to a spacious 760px command palette with backdrop blur and enter cues, and eliminated stark white card backgrounds on the Mind Map canvas in favor of natural harmonized linen/slate surface tones.
- **[topbar-center]** Centered the search bar in the header with a highlighted focus border, active accent iconography, and enhanced hover micro-interactions in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs).
