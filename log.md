# Change Log (`log.md`)

*(Maintained automatically by AI — you never need to edit this file manually.)*

## 2026-11-08

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
- **[ui & syntax]** Added `subtitle` frontmatter, 2-line Title + Subheading Mind Map cards, rich floating hover tooltips, Tokyo Night Storm syntax highlighting with line numbers, and [`dev-tools/agy-cli-permissions.md`](./dev-tools/agy-cli-permissions.md).
- **[themes & typography]** Grouped Tokyo Night setups ([`dev-tools/macos-terminal-tokyo-glass.md`](./dev-tools/macos-terminal-tokyo-glass.md) and [`dev-tools/tokyo-night-storm.md`](./dev-tools/tokyo-night-storm.md)) under a collapsible `Themes` subgroup in `Dev Tools`, increased default typography scale, and added branch-coded architectural Mind Map palettes.
- **[ux-layout]** Streamlined panel toggles to VS Code-style sidebar layout icons (`btn-toggle-sidebar` and `btn-toggle-viz`), eliminated redundant floating edge expand tabs, and fixed icon alignment in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs).
- **[mindmap-scale]** Removed heading section nodes from Mind Map trees (`docToTreeNode`) to focus exclusively on high-level Concepts, Pages, and Collections for horizontal scalability.
- **[typography]** Set Vercel Geist as the default typography standard, replaced serif/mono options with industry-standard doc fonts (Geist, Inter, and Plus Jakarta Sans), and synchronized Canvas Mind Map rendering.
- **[ux-refinements]** Sorted tags alphabetically (A-Z), removed font selector controls to standardize on Geist, enlarged topbar search button with vibrant query `<mark>` highlighting, and refined Mind Map color schemes across Paper, Light, and Dark modes.
- **[spotlight-canvas]** Expanded Spotlight search modal to a spacious 760px command palette with backdrop blur and enter cues, and eliminated stark white card backgrounds on the Mind Map canvas in favor of natural harmonized linen/slate surface tones.
- **[topbar-center]** Centered the search bar in the header with a highlighted focus border, active accent iconography, and enhanced hover micro-interactions in [`scripts/export-graph.mjs`](./scripts/export-graph.mjs).
