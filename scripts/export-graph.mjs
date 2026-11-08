#!/usr/bin/env node
/**
 * OKF Developer Documentation & Interactive Mind Map Builder
 * Design System: Linear / Vercel Geist / Fumadocs / Mintlify Monochrome Dark
 *
 * Features:
 * - Zero emoji chrome — 100% crisp 1.5px stroke inline SVG iconography
 * - Linear / Vercel Geist Zinc 950 monochrome palette (#09090b / #0c0c0e / #121216)
 * - Interactive Drag-Resize Splitters (div.resizer) for Sidebar, Docs, and Visualizer (width & height)
 * - Dockable Visualizer Position Switcher (Dock Right | Dock Left | Dock Bottom)
 * - Unsquished Tag Filtering: Popover Dropdown with search + 1-row-per-tag collapsible Sidebar Tree section
 * - Real CDN Libraries (highlight.js Tokyo Night Dark + MiniSearch fuzzy engine) with automatic offline fallback
 * - Unified Segmented View Switcher (Split | Mind Map | Graph | Docs) + Header Breadcrumbs
 * - Shiki / Geist-style code blocks with SVG copy button & subtle line numbers
 * - Mintlify-style Previous / Next document navigation cards + Backlinks
 * - React Flow / Linear-style Mind Map cards with 6px status dots & 1.2px Bezier connectors
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORED_DIRS = new Set(['.git', '.vscode', '.foam', 'node_modules', 'scripts', 'site', 'dist']);

const TYPE_COLORS = {
  index: '#1c1917',
  note: '#44403c',
  concept: '#44403c',
  reference: '#57534e',
  decision: '#57534e',
  playbook: '#57534e',
  inbox: '#78716c',
  guideline: '#57534e',
  log: '#78716c'
};

function slugifyHeading(text) {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return { fm: null, body: content };
  }
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) return { fm: null, body: content };
  const raw = content.slice(4, endIdx).trim();
  const body = content.slice(endIdx + 4).replace(/^\r?\n/, '');
  const data = {};
  let currentListKey = null;

  for (const line of raw.split(/\r?\n/)) {
    const listItemMatch = line.match(/^\s*-\s+(.+)$/);
    if (listItemMatch && currentListKey) {
      data[currentListKey].push(listItemMatch[1].replace(/^["']|["']$/g, '').trim());
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (match) {
      const key = match[1];
      const val = match[2].trim();
      if (!val) {
        currentListKey = key;
        data[key] = [];
      } else if (val.startsWith('[') && val.endsWith(']')) {
        currentListKey = null;
        data[key] = val
          .slice(1, -1)
          .split(',')
          .map(s => s.replace(/^["'\s]+|["'\s]+$/g, ''))
          .filter(Boolean);
      } else {
        currentListKey = null;
        data[key] = val.replace(/^["']|["']$/g, '').trim();
      }
    }
  }
  return { fm: data, body };
}

function walkMarkdownFiles(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMarkdownFiles(fullPath, fileList);
    else if (entry.isFile() && entry.name.endsWith('.md')) fileList.push(fullPath);
  }
  return fileList;
}

function resolveDocTarget(sourceRelPath, rawHref, nodesMap) {
  const cleanHref = rawHref.split('#')[0].trim();
  if (!cleanHref) return null;
  const sourceDir = path.posix.dirname(sourceRelPath);
  let candidate = path.posix.normalize(path.posix.join(sourceDir, cleanHref));
  if (nodesMap.has(candidate)) return candidate;
  if (!candidate.endsWith('.md') && nodesMap.has(candidate + '.md')) return candidate + '.md';
  return null;
}

function extractSections(body) {
  const lines = body.split(/\r?\n/);
  const headings = [];
  const sections = [];
  let inCode = false;
  let currentSec = { level: 1, title: 'Overview', slug: '', lines: [] };

  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inCode = !inCode;
      currentSec.lines.push(line);
      continue;
    }
    if (!inCode) {
      const m = line.match(/^(#{2,3})\s+(.+)$/);
      if (m) {
        if (currentSec.lines.length > 0) sections.push(currentSec);
        const level = m[1].length;
        const cleanText = m[2].replace(/`([^`]+)`/g, '$1').trim();
        const slug = slugifyHeading(cleanText);
        headings.push({ level, text: cleanText, slug });
        currentSec = { level, title: cleanText, slug, lines: [] };
        continue;
      }
    }
    currentSec.lines.push(line);
  }
  if (currentSec.lines.length > 0) sections.push(currentSec);

  return {
    headings,
    sections: sections.map(s => ({
      level: s.level,
      title: s.title,
      slug: s.slug,
      text: s.lines.join(' ').replace(/\s+/g, ' ').trim()
    }))
  };
}

const files = walkMarkdownFiles(ROOT);
const nodesMap = new Map();
const links = [];
const linkSet = new Set();
const backlinksMap = new Map();
const allTagsCount = new Map();

for (const filePath of files) {
  const relPath = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const rawContent = fs.readFileSync(filePath, 'utf8');
  const { fm, body } = parseFrontmatter(rawContent);
  const headingMatch = body.match(/^#\s+(.+)$/m);

  let nodeType = fm?.type || 'index';
  if (relPath === 'log.md') nodeType = 'log';
  else if (path.basename(relPath) === 'index.md') nodeType = 'index';

  const rawTitle = fm?.title || (headingMatch ? headingMatch[1].replace(/`([^`]+)`/g, '$1').trim() : relPath);
  const subtitle = fm?.subtitle || (nodeType === 'index' ? 'OKF Knowledge Index' : `${nodeType.toUpperCase()} · ${relPath}`);
  const description = fm?.description || subtitle;
  const updated = fm?.updated || '';
  const group = fm?.group || null;
  const tags = Array.isArray(fm?.tags) ? fm.tags : [];
  for (const t of tags) {
    allTagsCount.set(t, (allTagsCount.get(t) || 0) + 1);
  }

  const { headings, sections } = extractSections(body);

  nodesMap.set(relPath, {
    id: relPath,
    title: rawTitle,
    subtitle,
    type: nodeType,
    group,
    description,
    updated,
    tags,
    headings,
    sections,
    body,
    color: TYPE_COLORS[nodeType] || '#44403c'
  });
  backlinksMap.set(relPath, []);
}

function addEdge(sourceId, targetId) {
  if (!targetId || sourceId === targetId) return;
  const key = `${sourceId}->${targetId}`;
  if (!linkSet.has(key)) {
    linkSet.add(key);
    links.push({ source: sourceId, target: targetId });
  }
  const bl = backlinksMap.get(targetId);
  if (bl && !bl.includes(sourceId)) bl.push(sourceId);
}

for (const [sourceId, node] of nodesMap.entries()) {
  const withoutCode = node.body.replace(/^\s*```[\s\S]*?^\s*```/gm, '');
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(withoutCode)) !== null) {
    const rawTarget = match[2].trim();
    if (/^(https?:|mailto:|#)/.test(rawTarget)) continue;
    const targetId = resolveDocTarget(sourceId, rawTarget, nodesMap);
    if (targetId) addEdge(sourceId, targetId);
  }
}

for (const [id, node] of nodesMap.entries()) {
  node.backlinks = backlinksMap.get(id) || [];
}

const rootDoc = nodesMap.get('index.md');
const captureDocs = Array.from(nodesMap.values()).filter(n => n.id === 'inbox.md');
const systemDocs = Array.from(nodesMap.values()).filter(n => n.id === 'AGENTS.md' || n.id === 'log.md');

const BRANCH_ACCENTS = ['cobalt', 'terracotta', 'sage', 'plum', 'teal'];
const folderMap = new Map();

for (const doc of nodesMap.values()) {
  if (doc.id.includes('/')) {
    const dir = doc.id.split('/')[0];
    if (!folderMap.has(dir)) folderMap.set(dir, []);
    folderMap.get(dir).push(doc);
  }
}

function formatFolderTitle(dir) {
  return dir
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function docToTreeNode(doc, accentKey, prefixId = '') {
  return {
    id: `${prefixId}doc:${doc.id}`,
    docId: doc.id,
    label: doc.title,
    subtitle: doc.subtitle || doc.type,
    sublabel: doc.type,
    description: doc.description || doc.id,
    tags: doc.tags || [],
    accentKey: accentKey || 'cobalt',
    collapsed: false,
    children: []
  };
}

const folderBranches = [];
const sidebarGroups = [];
let paletteIdx = 0;

for (const [dir, docs] of folderMap.entries()) {
  const accentKey = dir === 'dev-tools' ? 'cobalt' : (dir === 'notes' ? 'terracotta' : BRANCH_ACCENTS[paletteIdx % BRANCH_ACCENTS.length]);
  paletteIdx++;
  const dirIndexId = `${dir}/index.md`;
  const indexDoc = nodesMap.get(dirIndexId);
  const contentDocs = docs.filter(d => path.posix.basename(d.id) !== 'index.md');
  const folderTitle = formatFolderTitle(dir);

  sidebarGroups.push({
    title: folderTitle,
    dir,
    indexId: indexDoc ? dirIndexId : null,
    accentKey
  });

  // Separate ungrouped docs vs grouped docs (e.g. group: "Themes" under dev-tools)
  const ungroupedDocs = contentDocs.filter(d => !d.group);
  const subGroupsMap = new Map();
  for (const d of contentDocs) {
    if (d.group) {
      if (!subGroupsMap.has(d.group)) subGroupsMap.set(d.group, []);
      subGroupsMap.get(d.group).push(d);
    }
  }

  const branchChildren = ungroupedDocs.map(d => docToTreeNode(d, accentKey, `f:${dir}:`));
  for (const [groupName, groupDocs] of subGroupsMap.entries()) {
    const subAccent = groupName.toLowerCase().includes('theme') ? 'plum' : accentKey;
    branchChildren.push({
      id: `subgroup:${dir}:${groupName}`,
      docId: groupDocs[0]?.id || 'index.md',
      label: groupName,
      subtitle: `${groupDocs.length} theme guides · ${dir}/`,
      sublabel: 'subgroup',
      description: `Collapsible ${groupName} collection inside ${folderTitle} (${groupDocs.map(g => g.title).join(', ')})`,
      tags: Array.from(new Set(groupDocs.flatMap(g => g.tags || []))),
      accentKey: subAccent,
      collapsed: true, // Collapsed by default under Dev Tools!
      children: groupDocs.map(d => docToTreeNode(d, subAccent, `f:${dir}:${groupName}:`))
    });
  }

  folderBranches.push({
    id: `branch:${dir}`,
    docId: indexDoc ? dirIndexId : (contentDocs[0]?.id || 'index.md'),
    label: folderTitle,
    subtitle: `${contentDocs.length} concept guides · ${dir}/`,
    sublabel: 'branch',
    description: indexDoc?.description || `Domain collection in ${dir}/ (${contentDocs.length} notes)`,
    tags: [],
    accentKey,
    collapsed: false,
    children: branchChildren
  });
}

const mindMapByFolder = {
  id: 'root-folder',
  docId: 'index.md',
  label: rootDoc ? rootDoc.title : 'Second Brain',
  subtitle: 'OKF v0.2 Knowledge Bundle',
  sublabel: 'root',
  description: rootDoc?.description || 'Root index.md manifest for progressive disclosure',
  tags: ['okf', 'second-brain'],
  accentKey: 'root',
  collapsed: false,
  children: [
    ...folderBranches,
    {
      id: 'branch:capture',
      docId: 'inbox.md',
      label: 'Quick Capture',
      subtitle: 'Scratchpad & raw ideas',
      sublabel: 'branch',
      description: 'Dump unstructured thoughts in inbox.md before promoting to clean notes',
      tags: ['inbox'],
      accentKey: 'sage',
      collapsed: false,
      children: captureDocs.map(d => docToTreeNode(d, 'sage', 'f:cap:'))
    },
    {
      id: 'branch:system',
      docId: 'AGENTS.md',
      label: 'AI & Governance',
      subtitle: 'AGENTS.md & changelog',
      sublabel: 'branch',
      description: 'OKF agent operating guidelines and automatic audit log',
      tags: ['okf', 'ai-agents'],
      accentKey: 'teal',
      collapsed: true,
      children: systemDocs.map(d => docToTreeNode(d, 'teal', 'f:sys:'))
    }
  ]
};

// Sorted alphabetically (A to Z) for clean, predictable indexing across Mind Map and sidebar
const sortedTags = Array.from(allTagsCount.entries()).sort((a, b) => a[0].localeCompare(b[0]));
const tagBranches = sortedTags.map(([tag, count], idx) => {
  const accentKey = BRANCH_ACCENTS[idx % BRANCH_ACCENTS.length];
  const matchingDocs = Array.from(nodesMap.values()).filter(d => (d.tags || []).includes(tag));
  return {
    id: `tagbranch:${tag}`,
    docId: matchingDocs[0]?.id || 'index.md',
    label: `#${tag}`,
    subtitle: `${count} linked note${count === 1 ? '' : 's'}`,
    sublabel: 'branch',
    description: `All concepts and notes tagged with #${tag}`,
    tags: [tag],
    accentKey,
    collapsed: idx >= 4,
    children: matchingDocs.map(d => docToTreeNode(d, accentKey, `t:${tag}:`))
  };
});

const mindMapByTag = {
  id: 'root-tag',
  docId: 'index.md',
  label: 'Second Brain by #Tag',
  subtitle: `${sortedTags.length} cross-cutting tags`,
  sublabel: 'root',
  description: 'Knowledge base organized by cross-cutting #tags',
  tags: [],
  accentKey: 'root',
  collapsed: false,
  children: tagBranches
};

const bundleData = {
  nodes: Array.from(nodesMap.values()),
  links,
  sidebarGroups,
  tags: sortedTags.map(([name, count]) => ({ name, count })),
  mindMapByFolder,
  mindMapByTag
};

const html = `<!DOCTYPE html>
<html lang="en" data-theme="paper" data-font="geist" data-code-theme="tokyo">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Second Brain — OKF v0.2 Documentation & Mind Map</title>
<!-- Developer Docs Typography: Vercel Geist & JetBrains Mono -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
<!-- Real CDN Libraries (with automatic offline fallback) -->
<script defer src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/minisearch@7.1.0/dist/umd/index.min.js"></script>
<style>
  /* 1. Editorial Warm Paper (Default — Anthropic / Readwise / Notion Architectural Notebook) */
  :root, html[data-theme="paper"] {
    --bg-canvas: #faf9f5;
    --bg-surface: #f3f1eb;
    --bg-elevated: #eae6dd;
    --bg-card: #ffffff;
    --bg-card-hover: #f7f5ef;
    --bg-pill-active: #ffffff;
    --bg-code: #f4f1ea;
    --bg-code-header: #eae6dc;
    --bg-code-row-hover: rgba(28, 25, 23, 0.04);
    --bg-glass: rgba(250, 249, 245, 0.92);
    --bg-modal-backdrop: rgba(28, 25, 23, 0.35);
    --border-hairline: #e4e1d6;
    --border-subtle: #ece9e0;
    --border-hover: #c7c2b4;
    --border-active: #1c1917;
    --text-primary: #1c1917;
    --text-secondary: #44403c;
    --text-muted: #78716c;
    --text-dim: #a8a29e;
    --accent: #1c1917;
    --shadow-xs: 0 1px 2px rgba(28, 25, 23, 0.06);
    --shadow-md: 0 8px 24px rgba(28, 25, 23, 0.09);
    --shadow-lg: 0 20px 48px rgba(28, 25, 23, 0.16);
    /* Shiki Vitesse / Warm Editorial 12-Token Palette */
    --code-fg: #292524;
    --code-ln: #a8a29e;
    --code-border: #dedad0;
    --tok-com: #8c857b;
    --tok-str: #15803d;
    --tok-key: #1d4ed8;
    --tok-kw: #ab296a;
    --tok-fn: #6d28d9;
    --tok-builtin: #0369a1;
    --tok-bool: #c2410c;
    --tok-cmd: #0f766e;
    --tok-flag: #0284c7;
    --tok-num: #b45309;
    --tok-var: #be123c;
    --tok-op: #78716c;
    --tok-path: #4338ca;
    --sidebar-width: 260px;
    --viz-width: 540px;
    --viz-height: 360px;
  }

  /* Core Typography System: Vercel Geist + JetBrains Mono */
  :root, html {
    --font-display: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-sans: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-body: "Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    --hero-size: 32px;
    --hero-weight: 600;
    --hero-tracking: -0.028em;
    --h2-size: 21px;
    --h2-weight: 600;
    --h2-tracking: -0.02em;
    --search-highlight-bg: #fef08a;
    --search-highlight-text: #713f12;
    --search-highlight-border: #facc15;
  }

  /* 2. Crisp Daylight (Stripe Docs / Apple Developer / GitHub Light) */
  html[data-theme="light"] {
    --bg-canvas: #ffffff;
    --bg-surface: #f8fafc;
    --bg-elevated: #f1f5f9;
    --bg-card: #ffffff;
    --bg-card-hover: #f8fafc;
    --bg-pill-active: #ffffff;
    --bg-code: #f8fafc;
    --bg-code-header: #f1f5f9;
    --bg-code-row-hover: rgba(15, 23, 42, 0.035);
    --bg-glass: rgba(255, 255, 255, 0.92);
    --bg-modal-backdrop: rgba(15, 23, 42, 0.35);
    --border-hairline: #e2e8f0;
    --border-subtle: #f1f5f9;
    --border-hover: #cbd5e1;
    --border-active: #0f172a;
    --text-primary: #0f172a;
    --text-secondary: #334155;
    --text-muted: #64748b;
    --text-dim: #94a3b8;
    --accent: #0f172a;
    --shadow-xs: 0 1px 2px rgba(15, 23, 42, 0.05);
    --shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
    --shadow-lg: 0 20px 48px rgba(15, 23, 42, 0.14);
    --code-fg: #0f172a;
    --code-ln: #94a3b8;
    --code-border: #e2e8f0;
    --tok-com: #64748b;
    --tok-str: #0f766e;
    --tok-key: #1d4ed8;
    --tok-kw: #be123c;
    --tok-fn: #6d28d9;
    --tok-builtin: #0369a1;
    --tok-bool: #c2410c;
    --tok-cmd: #0f766e;
    --tok-flag: #0284c7;
    --tok-num: #b45309;
    --tok-var: #be185d;
    --tok-op: #64748b;
    --tok-path: #4338ca;
  }

  /* 3. Pure Neutral Carbon (Vercel Geist Monochrome Dark — Zero Neon/Purple) */
  html[data-theme="dark"] {
    --bg-canvas: #111110;
    --bg-surface: #161615;
    --bg-elevated: #1e1e1c;
    --bg-card: #191918;
    --bg-card-hover: #222220;
    --bg-pill-active: #292927;
    --bg-code: #141413;
    --bg-code-header: #1c1c1a;
    --bg-code-row-hover: rgba(255, 255, 255, 0.035);
    --bg-glass: rgba(22, 22, 21, 0.92);
    --bg-modal-backdrop: rgba(0, 0, 0, 0.65);
    --border-hairline: #292927;
    --border-subtle: #21211f;
    --border-hover: #3d3d3a;
    --border-active: #ededec;
    --text-primary: #ededec;
    --text-secondary: #a8a8a3;
    --text-muted: #787873;
    --text-dim: #52524e;
    --accent: #ededec;
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.35);
    --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.45);
    --shadow-lg: 0 20px 48px rgba(0, 0, 0, 0.65);
    --code-fg: #e5e5e0;
    --code-ln: #575752;
    --code-border: #292927;
    --tok-com: #6e6e68;
    --tok-str: #9ece6a;
    --tok-key: #7aa2f7;
    --tok-kw: #f7768e;
    --tok-fn: #bb9af7;
    --tok-builtin: #7dcfff;
    --tok-bool: #ff9e64;
    --tok-cmd: #73daca;
    --tok-flag: #7dcfff;
    --tok-num: #e0af68;
    --tok-var: #ff9e64;
    --tok-op: #89ddff;
    --tok-path: #91b9ff;
    --search-highlight-bg: rgba(250, 204, 21, 0.22);
    --search-highlight-text: #fde047;
    --search-highlight-border: rgba(250, 204, 21, 0.45);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    background: var(--bg-canvas);
    color: var(--text-primary);
    font-family: var(--font-sans);
    height: 100vh;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body {
    display: flex;
    flex-direction: column;
  }
  body.is-resizing {
    user-select: none !important;
  }

  /* Custom subtle scrollbars */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

  /* Top Navigation Header */
  header.topbar {
    height: 50px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border-hairline);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    flex-shrink: 0;
    gap: 14px;
    z-index: 30;
  }
  .topbar-left {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1 1 0%;
    min-width: 0;
  }
  .brand-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--text-primary);
    font-weight: 600;
    font-size: 13.5px;
    letter-spacing: -0.015em;
    user-select: none;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .brand-logo {
    width: 22px;
    height: 22px;
    border-radius: 5px;
    background: var(--bg-card);
    border: 1px solid var(--border-hairline);
    box-shadow: var(--shadow-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-primary);
  }
  .okf-badge {
    font-family: var(--font-mono);
    font-size: 10.5px;
    font-weight: 500;
    color: var(--text-muted);
    background: var(--bg-card);
    border: 1px solid var(--border-hairline);
    padding: 1.5px 6px;
    border-radius: 4px;
    letter-spacing: -0.01em;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .header-divider {
    color: var(--border-hover);
    font-size: 14px;
    user-select: none;
    flex-shrink: 0;
  }
  .header-breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }
  .header-breadcrumb .bc-folder {
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .header-breadcrumb .bc-sep {
    color: var(--text-dim);
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }
  .header-breadcrumb .bc-current {
    color: var(--text-primary);
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .topbar-center {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 0 10px;
  }
  .topbar-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    flex: 1 1 0%;
    flex-shrink: 0;
  }
  .header-search-btn {
    width: 340px;
    max-width: 380px;
    height: 32px;
    background: var(--bg-card);
    border: 1.5px solid var(--border-hover);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 0 0 1px var(--border-hairline);
    border-radius: 7px;
    padding: 0 10px 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-secondary);
    font-size: 12.5px;
    cursor: pointer;
    transition: all 0.16s ease;
  }
  .header-search-btn:hover {
    border-color: var(--accent);
    color: var(--text-primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.14), 0 2px 6px rgba(0, 0, 0, 0.08);
    transform: translateY(-0.5px);
  }
  .header-search-left {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
  }
  .header-search-left span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }
  .header-search-left svg {
    width: 15px;
    height: 15px;
    color: var(--accent);
    flex-shrink: 0;
  }
  .kbd-badge {
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-primary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-hover);
    padding: 1px 6px;
    border-radius: 4px;
    line-height: 1.3;
    flex-shrink: 0;
    box-shadow: var(--shadow-xs);
  }

  /* Unified Segmented Control */
  .segmented-control {
    display: inline-flex;
    align-items: center;
    background: var(--bg-elevated);
    border: 1px solid var(--border-hairline);
    border-radius: 7px;
    padding: 2px;
    gap: 2px;
  }
  .seg-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    height: 24px;
    padding: 0 8px;
    border-radius: 5px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.14s ease, background 0.14s ease;
    white-space: nowrap;
  }
  .seg-btn:hover {
    color: var(--text-primary);
  }
  .seg-btn.active {
    background: var(--bg-pill-active);
    color: var(--text-primary);
    box-shadow: var(--shadow-xs);
  }
  .seg-btn svg {
    width: 12.5px;
    height: 12.5px;
    flex-shrink: 0;
  }

  /* Main Workspace & Flexible Resizable Panes */
  .workspace {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
    position: relative;
  }
  .content-split {
    flex: 1;
    display: flex;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .content-split.dock-right {
    flex-direction: row;
  }
  .content-split.dock-left {
    flex-direction: row-reverse;
  }
  .content-split.dock-bottom {
    flex-direction: column;
  }

  /* Interactive Drag Resizers */
  div.resizer {
    flex-shrink: 0;
    background: var(--border-hairline);
    position: relative;
    z-index: 15;
    transition: background 0.15s ease;
  }
  div.resizer.resizer-x {
    width: 1px;
    cursor: col-resize;
  }
  div.resizer.resizer-x::after {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    left: -4px;
    right: -4px;
  }
  div.resizer.resizer-y {
    height: 1px;
    width: 100%;
    cursor: row-resize;
  }
  div.resizer.resizer-y::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: -4px;
    bottom: -4px;
  }
  div.resizer:hover, div.resizer.dragging {
    background: var(--text-primary);
  }
  div.resizer.hidden {
    display: none;
  }

  /* Left Sidebar (Stripe / Apple / Fumadocs Editorial Architecture) */
  aside.sidebar {
    width: var(--sidebar-width);
    min-width: 180px;
    max-width: 480px;
    background: var(--bg-surface);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    user-select: none;
  }
  aside.sidebar.collapsed {
    display: none;
  }

  /* Chrome-Style Topbar & In-Panel Drawer Toggle Buttons */
  .panel-toggle-btn {
    width: 30px;
    height: 30px;
    border-radius: 6px;
    border: 1px solid var(--border-hairline);
    background: var(--bg-card);
    color: var(--text-secondary);
    box-shadow: var(--shadow-xs);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.14s ease, color 0.14s ease, border-color 0.14s ease;
  }
  .panel-toggle-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border-color: var(--border-hover);
  }
  .panel-toggle-btn.active {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }
  .panel-toggle-btn svg {
    width: 15px;
    height: 15px;
    display: block;
  }

  /* Unsquished Tag Filter Dropdown / Popover Bar */
  .sidebar-filter-bar {
    padding: 10px 10px 8px;
    border-bottom: 1px solid var(--border-subtle);
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .tag-dropdown-btn {
    flex: 1;
    min-width: 0;
    height: 30px;
    background: var(--bg-card);
    border: 1px solid var(--border-hairline);
    box-shadow: var(--shadow-xs);
    border-radius: 6px;
    padding: 0 9px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--text-secondary);
    font-family: var(--font-sans);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.14s ease, color 0.14s ease;
  }
  .tag-dropdown-btn:hover, .tag-dropdown-btn.open {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }
  .tag-dropdown-left {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }
  .tag-dropdown-left svg {
    width: 13px;
    height: 13px;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .active-tag-badge {
    font-family: var(--font-mono);
    font-size: 11px;
    background: var(--bg-elevated);
    color: var(--text-primary);
    border: 1px solid var(--border-hairline);
    padding: 0 5px;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .tag-popover {
    position: absolute;
    top: 44px;
    left: 10px;
    right: 10px;
    background: var(--bg-card);
    border: 1px solid var(--border-hover);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    z-index: 40;
    display: none;
    flex-direction: column;
    max-height: 290px;
    overflow: hidden;
  }
  .tag-popover.open {
    display: flex;
  }
  .tag-popover-search {
    padding: 7px 9px;
    border-bottom: 1px solid var(--border-hairline);
    background: var(--bg-surface);
  }
  .tag-popover-search input {
    width: 100%;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 12px;
    outline: none;
  }
  .tag-popover-search input::placeholder {
    color: var(--text-muted);
  }
  .tag-popover-list {
    flex: 1;
    overflow-y: auto;
    padding: 4px;
  }
  .tag-row-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 8px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    color: var(--text-secondary);
    transition: background 0.12s ease, color 0.12s ease;
  }
  .tag-row-item:hover {
    background: var(--bg-surface);
    color: var(--text-primary);
  }
  .tag-row-item.active {
    background: var(--bg-elevated);
    color: var(--text-primary);
    font-weight: 500;
  }
  .tag-row-name {
    font-family: var(--font-mono);
    font-size: 11.5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .tag-row-count {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-muted);
    background: var(--bg-surface);
    border: 1px solid var(--border-hairline);
    padding: 0 5px;
    border-radius: 4px;
  }

  .nav-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px 10px 28px;
  }
  .nav-folder {
    margin-bottom: 14px;
  }
  .nav-folder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 5px 8px;
    border-radius: 5px;
    cursor: pointer;
    color: var(--text-muted);
    font-size: 11.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    transition: color 0.14s ease;
  }
  .nav-folder-header:hover {
    color: var(--text-primary);
  }
  .folder-left {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .folder-chevron {
    width: 12px;
    height: 12px;
    color: var(--text-muted);
    transition: transform 0.15s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .nav-folder.collapsed > .nav-folder-header .folder-chevron {
    transform: rotate(-90deg);
  }
  .folder-count {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-muted);
  }
  .nav-folder-items {
    margin-top: 3px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-folder.collapsed > .nav-folder-items {
    display: none;
  }

  /* Collapsible Subgroup inside a Folder (e.g., Themes under Dev Tools) */
  .nav-subgroup {
    margin-top: 2px;
  }
  .nav-subgroup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 13.5px;
    font-weight: 500;
    transition: background 0.12s ease, color 0.12s ease;
  }
  .nav-subgroup-header:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }
  .nav-subgroup.collapsed > .nav-subgroup-header .folder-chevron {
    transform: rotate(-90deg);
  }
  .nav-subgroup-items {
    margin: 2px 0 4px 12px;
    padding-left: 8px;
    border-left: 1.5px solid var(--border-hairline);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .nav-subgroup.collapsed > .nav-subgroup-items {
    display: none;
  }

  /* Compact 1-line Nav Item — Zero Vibe-Coded Dots */
  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6.5px 10px;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 400;
    border: 1px solid transparent;
    transition: background 0.12s ease, color 0.12s ease, border-color 0.12s ease;
  }
  .nav-item:hover {
    background: var(--bg-elevated);
    color: var(--text-primary);
  }
  .nav-item.active {
    background: var(--bg-pill-active);
    border-color: var(--border-hairline);
    box-shadow: var(--shadow-xs);
    color: var(--text-primary);
    font-weight: 500;
  }
  .nav-dot {
    display: none;
  }
  .nav-item-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
  .nav-item-badge {
    font-family: var(--font-mono);
    font-size: 10.5px;
    color: var(--text-muted);
    background: var(--bg-elevated);
    border: 1px solid var(--border-hairline);
    padding: 0 5px;
    border-radius: 4px;
  }
  .nav-subitems {
    margin: 2px 0 4px 12px;
    padding-left: 10px;
    border-left: 1px solid var(--border-hairline);
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .nav-subitem {
    font-size: 12.5px;
    color: var(--text-muted);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    transition: color 0.12s ease, background 0.12s ease;
  }
  .nav-subitem:hover {
    color: var(--text-primary);
    background: var(--bg-elevated);
  }

  /* Center Document Reader */
  main.doc-pane {
    flex: 1;
    overflow-y: auto;
    padding: 40px 52px 80px;
    min-width: 280px;
    min-height: 180px;
    background: var(--bg-canvas);
    scroll-behavior: smooth;
  }
  .doc-layout {
    display: flex;
    gap: 48px;
    max-width: 1080px;
    margin: 0 auto;
    align-items: flex-start;
  }
  .doc-inner {
    flex: 1;
    min-width: 0;
    max-width: 780px;
  }
  .doc-toc {
    width: 210px;
    position: sticky;
    top: 0;
    flex-shrink: 0;
    border-left: 1px solid var(--border-hairline);
    padding-left: 16px;
    display: none;
  }
  @media (min-width: 1320px) {
    .doc-toc.visible { display: block; }
  }
  .toc-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 8px;
  }
  .toc-link {
    display: block;
    font-size: 13px;
    color: var(--text-muted);
    text-decoration: none;
    padding: 4.5px 0;
    line-height: 1.4;
    cursor: pointer;
    transition: color 0.12s ease;
  }
  .toc-link:hover { color: var(--text-primary); }
  .toc-link.toc-h3 { padding-left: 10px; font-size: 12px; }

  /* Document Hero Header */
  .doc-hero {
    margin-bottom: 30px;
    padding-bottom: 24px;
    border-bottom: 1px solid var(--border-hairline);
  }
  .doc-eyebrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }
  .doc-breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
  }
  .doc-breadcrumb .bc-dot {
    display: none;
  }
  .doc-meta-right {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-muted);
  }
  .doc-hero-title {
    font-family: var(--font-display);
    font-optical-sizing: auto;
    font-size: var(--hero-size);
    font-weight: var(--hero-weight);
    letter-spacing: var(--hero-tracking);
    color: var(--text-primary);
    line-height: 1.16;
    margin-bottom: 10px;
  }
  .doc-hero-subtitle {
    font-family: var(--font-sans);
    font-size: 17px;
    font-weight: 400;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 12px;
  }
  .doc-tags-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
  }
  .doc-tag-pill {
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 2.5px 9px;
    border-radius: 4px;
    background: var(--bg-surface);
    color: var(--text-secondary);
    border: 1px solid var(--border-hairline);
    cursor: pointer;
    transition: border-color 0.14s ease, color 0.14s ease;
  }
  .doc-tag-pill:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }
  .doc-desc {
    margin-top: 14px;
    background: var(--bg-surface);
    border: 1px solid var(--border-hairline);
    padding: 12px 16px;
    border-radius: 6px;
    color: var(--text-secondary);
    font-size: 14.5px;
    line-height: 1.6;
  }

  /* Markdown Typography */
  .md-body {
    font-family: var(--font-body);
    line-height: 1.78;
    font-size: 16.5px;
    color: var(--text-secondary);
    font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  }
  .md-body h1 { display: none; }
  .md-body h2 {
    font-family: var(--font-display);
    font-optical-sizing: auto;
    font-size: var(--h2-size);
    font-weight: var(--h2-weight);
    letter-spacing: var(--h2-tracking);
    color: var(--text-primary);
    margin: 38px 0 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-hairline);
    scroll-margin-top: 20px;
  }
  .md-body h3 {
    font-family: var(--font-sans);
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.015em;
    color: var(--text-primary);
    margin: 26px 0 10px;
    scroll-margin-top: 20px;
  }
  .md-body p { margin-bottom: 16px; }
  .md-body strong { color: var(--text-primary); font-weight: 600; }
  .md-body ul, .md-body ol { margin: 0 0 18px 24px; }
  .md-body li { margin-bottom: 7px; }
  .md-body li > ul, .md-body li > ol { margin-top: 6px; margin-bottom: 8px; }
  .md-body code {
    font-family: var(--font-mono);
    font-size: 13.5px;
    background: var(--bg-code);
    border: 1px solid var(--border-hairline);
    color: var(--text-primary);
    padding: 1.5px 6px;
    border-radius: 4px;
  }
  .md-body kbd {
    display: inline-block;
    padding: 1.5px 6px;
    font-size: 11px;
    font-family: var(--font-mono);
    line-height: 1.25;
    color: var(--text-primary);
    background-color: var(--bg-card);
    border: 1px solid var(--border-hover);
    border-bottom-width: 2px;
    border-radius: 4px;
  }

  /* Expressive Code / Shiki / Tokyo Night IDE Code Blocks */
  .code-block-wrap {
    position: relative;
    background: var(--bg-code);
    border: 1px solid var(--code-border, var(--border-hairline));
    border-radius: 9px;
    margin-bottom: 20px;
    overflow: hidden;
    box-shadow: var(--shadow-xs);
  }
  /* Tokyo Night Storm IDE Code Frame (Default High-Contrast Code Window) */
  html[data-code-theme="tokyo"] .code-block-wrap {
    --bg-code: #161a28;
    --bg-code-header: #121521;
    --bg-code-row-hover: rgba(122, 162, 247, 0.07);
    --code-border: #262d45;
    --code-fg: #c0caf5;
    --code-ln: #4b5473;
    --tok-com: #636d93;
    --tok-str: #9ece6a;
    --tok-key: #7aa2f7;
    --tok-kw: #bb9af7;
    --tok-fn: #7dcfff;
    --tok-builtin: #2ac3de;
    --tok-bool: #ff9e64;
    --tok-cmd: #73daca;
    --tok-flag: #7dcfff;
    --tok-num: #ff9e64;
    --tok-var: #f7768e;
    --tok-op: #89ddff;
    --tok-path: #91b9ff;
    box-shadow: 0 6px 20px rgba(15, 18, 30, 0.14);
  }
  .code-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 36px;
    padding: 0 13px;
    background: var(--bg-code-header);
    border-bottom: 1px solid var(--code-border, var(--border-hairline));
    font-size: 11.5px;
    font-family: var(--font-mono);
    color: var(--code-ln, var(--text-muted));
  }
  .code-header-left {
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .code-window-dots {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-right: 2px;
  }
  .code-window-dot {
    width: 8.5px;
    height: 8.5px;
    border-radius: 50%;
    opacity: 0.75;
  }
  .code-window-dot.dot-r { background: #f7768e; }
  .code-window-dot.dot-y { background: #e0af68; }
  .code-window-dot.dot-g { background: #9ece6a; }
  .lang-label {
    font-size: 11px;
    color: var(--code-fg, var(--text-secondary));
    font-weight: 600;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    padding: 1.5px 6px;
    border-radius: 4px;
    background: rgba(125, 207, 255, 0.09);
    border: 1px solid var(--code-border, var(--border-hairline));
  }
  .code-header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .code-theme-btn, .copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background: transparent;
    color: var(--code-ln, var(--text-muted));
    border: 1px solid transparent;
    border-radius: 5px;
    padding: 3px 7px;
    font-family: var(--font-sans);
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: color 0.14s ease, background 0.14s ease, border-color 0.14s ease;
  }
  .code-theme-btn:hover, .copy-btn:hover {
    color: var(--code-fg, var(--text-primary));
    background: rgba(255, 255, 255, 0.06);
    border-color: var(--code-border, var(--border-hairline));
  }
  .copy-btn svg {
    width: 13px;
    height: 13px;
  }
  .code-scroll {
    padding: 12px 0;
    overflow-x: auto;
  }
  .code-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.68;
  }
  .code-table tr:hover td {
    background: var(--bg-code-row-hover);
  }
  .code-ln {
    width: 42px;
    text-align: right;
    padding: 0 12px 0 8px;
    color: var(--code-ln, var(--text-dim));
    border-right: 1px solid var(--code-border, var(--border-subtle));
    user-select: none;
    vertical-align: top;
    font-size: 11.5px;
  }
  .code-line {
    padding: 0 18px 0 14px;
    white-space: pre;
    color: var(--code-fg, var(--text-primary));
  }

  /* 12-Token Semantic Syntax Highlighting (Shiki / Tokyo Night + Highlight.js Unified) */
  .tok-com, .hljs-comment, .hljs-quote { color: var(--tok-com); font-style: italic; }
  .tok-str, .hljs-string, .hljs-regexp, .hljs-Addition { color: var(--tok-str); }
  .tok-key, .hljs-attr, .hljs-attribute, .hljs-property { color: var(--tok-key); }
  .tok-kw, .hljs-keyword, .hljs-selector-tag, .hljs-meta { color: var(--tok-kw); font-weight: 500; }
  .tok-fn, .hljs-title, .hljs-title.function_, .hljs-section { color: var(--tok-fn); font-weight: 500; }
  .tok-builtin, .hljs-built_in, .hljs-type, .hljs-class .hljs-title { color: var(--tok-builtin); }
  .tok-bool, .hljs-literal { color: var(--tok-bool); font-weight: 500; }
  .tok-cmd { color: var(--tok-cmd); font-weight: 600; }
  .tok-flag { color: var(--tok-flag); }
  .tok-num, .hljs-number { color: var(--tok-num); }
  .tok-var, .hljs-variable, .hljs-template-variable, .hljs-symbol { color: var(--tok-var); }
  .tok-op, .hljs-operator, .hljs-punctuation { color: var(--tok-op); }
  .tok-path { color: var(--tok-path); }
  .code-swatch {
    display: inline-block;
    width: 9.5px;
    height: 9.5px;
    border-radius: 2.5px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    vertical-align: middle;
    margin-right: 4px;
    margin-bottom: 1px;
  }

  .md-body hr { border: none; border-top: 1px solid var(--border-hairline); margin: 28px 0; }
  .md-body table.md-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 13.5px;
    border: 1px solid var(--border-hairline);
    border-radius: 6px;
    overflow: hidden;
  }
  .md-body table.md-table th, .md-body table.md-table td {
    border-bottom: 1px solid var(--border-hairline);
    padding: 8px 12px;
    text-align: left;
  }
  .md-body table.md-table th {
    background: var(--bg-surface);
    color: var(--text-primary);
    font-weight: 600;
    font-size: 12.5px;
  }
  .md-body table.md-table tr:last-child td { border-bottom: none; }
  .color-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    border: 1px solid var(--border-hover);
    vertical-align: middle;
    margin-right: 5px;
  }
  .md-body a.internal-link {
    color: var(--text-primary);
    text-decoration: underline;
    text-decoration-color: var(--border-hover);
    text-underline-offset: 3px;
    font-weight: 500;
    transition: text-decoration-color 0.14s ease;
  }
  .md-body a.internal-link:hover {
    text-decoration-color: var(--text-primary);
  }
  .md-body a.external-link {
    color: var(--text-primary);
    text-decoration: underline;
    text-decoration-color: var(--border-hover);
    text-underline-offset: 3px;
  }

  /* Prev & Next Navigation Cards */
  .doc-prev-next {
    margin-top: 44px;
    padding-top: 24px;
    border-top: 1px solid var(--border-hairline);
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .pn-card {
    background: var(--bg-card);
    border: 1px solid var(--border-hairline);
    box-shadow: var(--shadow-xs);
    border-radius: 8px;
    padding: 12px 16px;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .pn-card:hover {
    border-color: var(--border-hover);
    background: var(--bg-card-hover);
  }
  .pn-card.pn-next {
    text-align: right;
    align-items: flex-end;
  }
  .pn-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .pn-title {
    font-size: 13.5px;
    font-weight: 500;
    color: var(--text-primary);
  }
  .pn-sub {
    font-size: 11.5px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* Backlinks Section */
  .backlinks-box {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid var(--border-hairline);
  }
  .backlinks-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
    margin-bottom: 10px;
  }
  .backlink-cards { display: flex; flex-wrap: wrap; gap: 8px; }
  .backlink-card {
    background: var(--bg-card);
    border: 1px solid var(--border-hairline);
    box-shadow: var(--shadow-xs);
    border-radius: 6px;
    padding: 6px 11px;
    font-size: 12.5px;
    color: var(--text-secondary);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    transition: border-color 0.14s ease, color 0.14s ease, background 0.14s ease;
  }
  .backlink-card:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
    background: var(--bg-card-hover);
  }

  /* Interactive Visualizer Panel */
  aside.viz-pane {
    width: var(--viz-width);
    min-width: 240px;
    min-height: 180px;
    background: var(--bg-surface);
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
  }
  .content-split.dock-bottom aside.viz-pane {
    width: 100% !important;
    height: var(--viz-height);
  }
  aside.viz-pane.expanded {
    flex: 1;
    width: auto !important;
    height: auto !important;
  }
  aside.viz-pane.hidden {
    display: none;
  }

  .viz-toolbar-top {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    z-index: 5;
    gap: 8px;
    flex-wrap: wrap;
  }
  .viz-toolbar-bottom {
    position: absolute;
    bottom: 12px;
    left: 12px;
    right: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    z-index: 5;
    gap: 8px;
  }
  .viz-bar-group {
    display: inline-flex;
    align-items: center;
    background: var(--bg-glass);
    border: 1px solid var(--border-hairline);
    box-shadow: var(--shadow-xs);
    border-radius: 6px;
    padding: 2px;
    gap: 2px;
    pointer-events: auto;
    backdrop-filter: blur(8px);
  }
  .viz-ctrl-btn {
    height: 24px;
    padding: 0 8px;
    border-radius: 4px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-family: var(--font-sans);
    font-size: 11.5px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    transition: color 0.14s ease, background 0.14s ease;
  }
  .viz-ctrl-btn:hover {
    color: var(--text-primary);
  }
  .viz-ctrl-btn.active {
    background: var(--bg-pill-active);
    color: var(--text-primary);
    box-shadow: var(--shadow-xs);
  }
  .viz-ctrl-btn svg {
    width: 12.5px;
    height: 12.5px;
  }
  .viz-hint {
    background: var(--bg-glass);
    border: 1px solid var(--border-hairline);
    box-shadow: var(--shadow-xs);
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    color: var(--text-muted);
    backdrop-filter: blur(8px);
  }
  canvas#viz-canvas { width: 100%; height: 100%; display: block; cursor: grab; }
  canvas#viz-canvas:active { cursor: grabbing; }

  /* Floating Node Preview Popover */
  .node-tooltip {
    position: absolute;
    pointer-events: none;
    display: none;
    width: 280px;
    background: var(--bg-card);
    border: 1px solid var(--border-hover);
    border-radius: 8px;
    padding: 11px 13px;
    z-index: 30;
    box-shadow: var(--shadow-md);
  }
  .nt-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 5px;
  }
  .nt-dot {
    display: none;
  }
  .nt-badge {
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-muted);
  }
  .nt-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 2px;
  }
  .nt-sub {
    font-size: 11.5px;
    color: var(--text-secondary);
    margin-bottom: 6px;
  }
  .nt-desc {
    font-size: 11.5px;
    color: var(--text-muted);
    line-height: 1.45;
    margin-bottom: 8px;
  }
  .nt-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .nt-tag {
    font-family: var(--font-mono);
    font-size: 10px;
    background: var(--bg-surface);
    color: var(--text-secondary);
    border: 1px solid var(--border-hairline);
    padding: 1px 5px;
    border-radius: 3px;
  }

  /* Cmd+K Spotlight Search Modal */
  .search-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.48);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: 100;
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding-top: 9vh;
  }
  .search-modal-backdrop.open { display: flex; }
  .search-modal {
    width: 760px;
    max-width: 90vw;
    max-height: 78vh;
    background: var(--bg-card);
    border: 1px solid var(--border-hover);
    border-radius: 14px;
    box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.35), var(--shadow-lg);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .search-modal-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 18px 22px;
    border-bottom: 1px solid var(--border-hairline);
    color: var(--text-muted);
  }
  .search-modal-header svg {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--text-muted);
  }
  .search-modal-header input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: 17px;
    font-weight: 500;
    outline: none;
    letter-spacing: -0.01em;
  }
  .search-modal-header input::placeholder {
    color: var(--text-muted);
    font-weight: 400;
  }
  .search-modal-results { flex: 1; overflow-y: auto; padding: 12px 14px; }
  .search-result-item {
    padding: 11px 16px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 4px;
    border: 1px solid transparent;
    transition: background 0.12s ease, border-color 0.12s ease;
  }
  .search-result-item:hover, .search-result-item.selected {
    background: var(--bg-surface);
    border-color: var(--border-hover);
  }
  .sr-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 4px; }
  .sr-breadcrumb { font-size: 14px; font-weight: 600; color: var(--text-primary); letter-spacing: -0.01em; }
  .sr-breadcrumb span.sr-sec { color: var(--text-secondary); font-weight: 400; }
  .sr-meta { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .sr-path { font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); }
  .sr-enter {
    font-size: 11px;
    color: var(--text-muted);
    background: var(--bg-card);
    border: 1px solid var(--border-hairline);
    padding: 1px 5px;
    border-radius: 4px;
    display: none;
  }
  .search-result-item.selected .sr-enter,
  .search-result-item:hover .sr-enter {
    display: inline-block;
  }
  .sr-snippet { font-size: 13px; color: var(--text-muted); line-height: 1.5; }
  .sr-snippet mark, .sr-breadcrumb mark {
    background: var(--search-highlight-bg);
    color: var(--search-highlight-text);
    border: 1px solid var(--search-highlight-border);
    font-weight: 600;
    padding: 1px 5px;
    border-radius: 4px;
  }
  .search-modal-footer {
    padding: 10px 22px;
    border-top: 1px solid var(--border-hairline);
    background: var(--bg-surface);
    font-size: 12px;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
</head>
<body>

<header class="topbar">
  <div class="topbar-left">
    <button class="panel-toggle-btn active" id="btn-toggle-sidebar" onclick="toggleLeftSidebar()" title="Toggle Left Sidebar (⌘B)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
      </svg>
    </button>
    <div class="brand-trigger" onclick="openDoc('index.md')">
      <div class="brand-logo">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
          <polyline points="2 17 12 22 22 17"></polyline>
          <polyline points="2 12 12 17 22 12"></polyline>
        </svg>
      </div>
      <span>Second Brain</span>
    </div>
    <span class="okf-badge">OKF v0.2</span>
    <span class="header-divider">/</span>
    <div class="header-breadcrumb" id="header-breadcrumb"></div>
  </div>

  <div class="topbar-center">
    <button class="header-search-btn" onclick="openSearchModal()" title="Search concepts, notes, sections, and #tags (⌘K)">
      <span class="header-search-left">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span>Search concepts, notes, #tags...</span>
      </span>
      <kbd class="kbd-badge">⌘K</kbd>
    </button>
  </div>

  <div class="topbar-right">
    <div class="segmented-control" role="tablist" aria-label="Color Theme">
      <button class="seg-btn active" id="theme-paper" onclick="setTheme('paper')" title="Editorial Warm Paper">Paper</button>
      <button class="seg-btn" id="theme-light" onclick="setTheme('light')" title="Crisp Daylight">Light</button>
      <button class="seg-btn" id="theme-dark" onclick="setTheme('dark')" title="Neutral Carbon Dark">Dark</button>
    </div>

    <div class="segmented-control" role="tablist" aria-label="View Mode">
      <button class="seg-btn active" id="seg-split" onclick="setViewSwitch('split')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="12" y1="3" x2="12" y2="21"></line>
        </svg>
        <span>Split</span>
      </button>
      <button class="seg-btn" id="seg-mindmap" onclick="setViewSwitch('mindmap')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="6" r="3"></circle>
          <circle cx="6" cy="18" r="3"></circle>
          <path d="M20 4L8.12 15.88"></path>
          <circle cx="20" cy="16" r="3"></circle>
          <path d="M8.59 7.41L17.42 14.58"></path>
        </svg>
        <span>Mind Map</span>
      </button>
      <button class="seg-btn" id="seg-graph" onclick="setViewSwitch('graph')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3"></circle>
          <circle cx="6" cy="12" r="3"></circle>
          <circle cx="18" cy="19" r="3"></circle>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
        </svg>
        <span>Graph</span>
      </button>
      <button class="seg-btn" id="seg-docs" onclick="setViewSwitch('docs')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
        </svg>
        <span>Docs</span>
      </button>
    </div>

    <button class="panel-toggle-btn active" id="btn-toggle-viz" onclick="toggleRightViz()" title="Toggle Right Mind Map Panel (⌘\)">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"></rect>
        <line x1="15" y1="3" x2="15" y2="21"></line>
      </svg>
    </button>
  </div>
</header>

<div class="workspace" id="workspace">
  <!-- Left Sidebar -->
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-filter-bar" id="sidebar-filter-bar">
      <button class="tag-dropdown-btn" id="tag-dropdown-btn" onclick="toggleTagPopover(event)">
        <span class="tag-dropdown-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="9" x2="20" y2="9"></line>
            <line x1="4" y1="15" x2="20" y2="15"></line>
            <line x1="10" y1="3" x2="8" y2="21"></line>
            <line x1="16" y1="3" x2="14" y2="21"></line>
          </svg>
          <span id="tag-dropdown-label">Filter by tag</span>
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <button class="panel-toggle-btn" onclick="toggleLeftSidebar()" title="Collapse Left Sidebar (⌘B)">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2"></rect>
          <line x1="9" y1="3" x2="9" y2="21"></line>
        </svg>
      </button>

      <div class="tag-popover" id="tag-popover" onclick="event.stopPropagation()">
        <div class="tag-popover-search">
          <input type="text" id="tag-popover-input" placeholder="Filter tags..." oninput="renderTagPopoverList()" />
        </div>
        <div class="tag-popover-list" id="tag-popover-list"></div>
      </div>
    </div>

    <div class="nav-list" id="nav-list"></div>
  </aside>

  <!-- Resizer 1: Between Sidebar & Main Content -->
  <div class="resizer resizer-x" id="resizer-sidebar" title="Drag to resize sidebar"></div>

  <!-- Flexible Content Area (Docs + Resizer + Dockable Visualizer) -->
  <div class="content-split dock-right" id="content-split">
    <main class="doc-pane" id="doc-pane">
      <div class="doc-layout">
        <div class="doc-inner">
          <div class="doc-hero">
            <div class="doc-eyebrow">
              <div class="doc-breadcrumb" id="doc-breadcrumb"></div>
              <div class="doc-meta-right">
                <span id="doc-path"></span>
                <span id="doc-updated"></span>
              </div>
            </div>
            <h1 class="doc-hero-title" id="doc-hero-title"></h1>
            <div class="doc-hero-subtitle" id="doc-hero-subtitle"></div>
            <div class="doc-tags-row" id="doc-tags"></div>
            <div class="doc-desc" id="doc-desc" style="display:none"></div>
          </div>

          <article class="md-body" id="doc-body"></article>

          <nav class="doc-prev-next" id="doc-prev-next" aria-label="Pagination"></nav>

          <section class="backlinks-box" id="backlinks-box">
            <div class="backlinks-title">Referenced By</div>
            <div class="backlink-cards" id="backlink-cards"></div>
          </section>
        </div>

        <nav class="doc-toc" id="doc-toc">
          <div class="toc-title">On This Page</div>
          <div id="toc-links"></div>
        </nav>
      </div>
    </main>

    <!-- Resizer 2: Between Docs Pane & Visualizer Pane -->
    <div class="resizer resizer-x" id="resizer-viz" title="Drag to resize visualizer"></div>

    <!-- Interactive Visualizer Pane -->
    <aside class="viz-pane" id="viz-pane">
      <div class="viz-toolbar-top">
        <div class="viz-bar-group" id="viz-tree-group">
          <button class="viz-ctrl-btn active" id="btn-tree-folder" onclick="setTreeGrouping('folder')">By Folder</button>
          <button class="viz-ctrl-btn" id="btn-tree-tag" onclick="setTreeGrouping('tag')">By Tag</button>
        </div>

        <div class="viz-bar-group">
          <button class="viz-ctrl-btn" id="btn-expand-all" onclick="expandAll(true)">Expand</button>
          <button class="viz-ctrl-btn" id="btn-collapse-all" onclick="expandAll(false)">Collapse</button>
          <button class="viz-ctrl-btn" onclick="fitView()">Fit</button>
        </div>

        <!-- Dock Position Switcher (Left / Bottom / Right) + Collapse Drawer Button -->
        <div class="viz-bar-group" id="viz-dock-group" title="Dock Mind Map Position">
          <button class="viz-ctrl-btn" id="btn-dock-left" onclick="setDockPosition('left')" title="Dock Mind Map to Left">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
          <button class="viz-ctrl-btn" id="btn-dock-bottom" onclick="setDockPosition('bottom')" title="Dock Mind Map to Bottom">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="3" y1="15" x2="21" y2="15"></line>
            </svg>
          </button>
          <button class="viz-ctrl-btn active" id="btn-dock-right" onclick="setDockPosition('right')" title="Dock Mind Map to Right">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="15" y1="3" x2="15" y2="21"></line>
            </svg>
          </button>
          <button class="viz-ctrl-btn" onclick="toggleRightViz()" title="Collapse Mind Map Panel (⌘\)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"></rect>
              <line x1="15" y1="3" x2="15" y2="21"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="viz-toolbar-bottom">
        <div class="viz-hint" id="viz-hint">Click node to open &middot; Click +/- badge to toggle children &middot; Drag splitters to resize</div>
      </div>

      <div class="node-tooltip" id="node-tooltip">
        <div class="nt-header">
          <span class="nt-dot" id="nt-dot"></span>
          <span class="nt-badge" id="nt-badge"></span>
        </div>
        <div class="nt-title" id="nt-title"></div>
        <div class="nt-sub" id="nt-sub"></div>
        <div class="nt-desc" id="nt-desc"></div>
        <div class="nt-tags" id="nt-tags"></div>
      </div>
      <canvas id="viz-canvas"></canvas>
    </aside>
  </div>
</div>

<!-- Cmd+K Spotlight Search Modal -->
<div class="search-modal-backdrop" id="search-backdrop" onclick="if(event.target===this)closeSearchModal()">
  <div class="search-modal">
    <div class="search-modal-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input type="text" id="spotlight-input" placeholder="Search documentation, headings, #tags, or commands..." oninput="runSpotlightSearch()" />
      <kbd class="kbd-badge" onclick="closeSearchModal()" style="cursor:pointer">ESC</kbd>
    </div>
    <div class="search-modal-results" id="spotlight-results"></div>
    <div class="search-modal-footer">
      <span>Navigate with ↑↓ arrows &middot; Enter to open &middot; Prefix # for tags</span>
      <span id="spotlight-count"></span>
    </div>
  </div>
</div>

<script>
const data = ${JSON.stringify(bundleData)};
const nodeById = new Map(data.nodes.map(n => [n.id, n]));
let activeTreeMode = 'folder';
let rootTree = data.mindMapByFolder;
let currentDocId = 'index.md';
let activeTagFilter = null;
let layoutMode = 'split';
let vizType = 'mindmap';
let activeSegment = 'split';
let dockPosition = 'right';
const collapsedSidebarFolders = new Set(['tags-tree', 'subgroup:dir:dev-tools:Themes']); // Tags & Themes subgroup collapsed by default
const codeStore = [];
let miniSearchEngine = null;

const SVG_CHEVRON_RIGHT = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
const SVG_CHEVRON_DOWN = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';
const SVG_COPY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const SVG_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
const SVG_TERMINAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>';

function slugify(text) {
  return text.replace(/\`([^\`]+)\`/g, '$1').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function resolvePath(baseFile, relTarget) {
  const clean = relTarget.split('#')[0].trim();
  if (!clean) return currentDocId;
  const dir = baseFile.includes('/') ? baseFile.slice(0, baseFile.lastIndexOf('/')) : '';
  const parts = (dir ? dir + '/' + clean : clean).split('/');
  const stack = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  const joined = stack.join('/');
  if (nodeById.has(joined)) return joined;
  if (nodeById.has(joined + '.md')) return joined + '.md';
  return joined;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

let currentCodeTheme = localStorage.getItem('okf-code-theme') || 'tokyo';
document.documentElement.setAttribute('data-code-theme', currentCodeTheme);

function toggleCodeTheme() {
  currentCodeTheme = currentCodeTheme === 'tokyo' ? 'adaptive' : 'tokyo';
  document.documentElement.setAttribute('data-code-theme', currentCodeTheme);
  localStorage.setItem('okf-code-theme', currentCodeTheme);
  document.querySelectorAll('.code-theme-label').forEach(el => {
    el.textContent = currentCodeTheme === 'tokyo' ? 'Tokyo Night' : 'Match Page';
  });
}

function injectHexSwatches(escapedStr) {
  return escapedStr.replace(/#([0-9A-Fa-f]{6,8})\\b/g, (full, hex) => {
    const rgbHex = '#' + hex.slice(0, 6);
    return \`<span class="code-swatch" style="background:\${rgbHex}"></span>\${full}\`;
  });
}

/* Shiki / Expressive-Code 12-Token Multi-Grammar Line Highlighter */
function highlightLineTokens(rawLine, lang) {
  const trimmed = rawLine.trim();
  if (!trimmed) return ' ';

  // 1. Full-line comments
  if ((lang === 'bash' || lang === 'sh' || lang === 'yaml' || lang === 'py' || lang === 'python' || lang === 'text') && trimmed.startsWith('#')) {
    return \`<span class="tok-com">\${escapeHtml(rawLine)}</span>\`;
  }
  if ((lang === 'json' || lang === 'js' || lang === 'ts' || lang === 'css') && trimmed.startsWith('//')) {
    return \`<span class="tok-com">\${escapeHtml(rawLine)}</span>\`;
  }

  const tokens = [];
  function stash(htmlSpan) {
    tokens.push(htmlSpan);
    return \`@@TOK_\${tokens.length - 1}@@\`;
  }

  let work = escapeHtml(rawLine);

  // 2. Trailing comments (# in bash/yaml/python, // in js)
  if (lang === 'bash' || lang === 'sh' || lang === 'yaml' || lang === 'py' || lang === 'python') {
    work = work.replace(/(\\s+#[^"']*)$/g, m => stash(\`<span class="tok-com">\${m}</span>\`));
  }

  // 3. JSON / Dict / Object quoted keys ("key":)
  work = work.replace(/"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"(\\s*:)/g, (_, k, colon) => {
    if (k.startsWith('$')) {
      return stash(\`<span class="tok-var">"\${k}"</span>\`) + stash(\`<span class="tok-op">\${colon}</span>\`);
    }
    return stash(\`<span class="tok-key">"\${k}"</span>\`) + stash(\`<span class="tok-op">\${colon}</span>\`);
  });

  // 4. Unquoted YAML / Prompt Spec keys at start of line or bullet (e.g. "   - BackgroundColor: ")
  work = work.replace(/^(\\s*(?:[-*]\\s+|\\d+\\.\\s+)?)([A-Za-z_][A-Za-z0-9_.-]*)(\\s*:)(?=\\s|$)/, (_, pre, key, colon) =>
    pre + stash(\`<span class="tok-key">\${key}</span>\`) + stash(\`<span class="tok-op">\${colon}</span>\`)
  );

  // 5. Byte strings & regular strings (with inline hex color swatches!)
  work = work.replace(/(\\bb)?("[^"\\\\]*(?:\\\\.[^"\\\\]*)*"|'[^'\\\\]*(?:\\\\.[^'\\\\]*)*')/g, (full, bPrefix, strPart) => {
    const inner = injectHexSwatches(strPart);
    if (bPrefix) {
      return stash(\`<span class="tok-kw">b</span><span class="tok-str">\${inner}</span>\`);
    }
    return stash(\`<span class="tok-str">\${inner}</span>\`);
  });

  // 6. Inline hex colors outside strings (e.g. (#161A28 at 60% opacity))
  work = work.replace(/#([0-9A-Fa-f]{6,8})\\b/g, (full, hex) => {
    const rgbHex = '#' + hex.slice(0, 6);
    return stash(\`<span class="tok-num"><span class="code-swatch" style="background:\${rgbHex}"></span>\${full}</span>\`);
  });

  // 7. Shell & Environment Variables ($VAR)
  work = work.replace(/(\\\$[A-Za-z_][A-Za-z0-9_]*|\\\$\{[^}]+\})/g, m =>
    stash(\`<span class="tok-var">\${m}</span>\`)
  );

  // 8. CLI Flags (--install-extension, -dr)
  work = work.replace(/(\\s)(--?[A-Za-z0-9_-]+)/g, (_, sp, fl) =>
    sp + stash(\`<span class="tok-flag">\${fl}</span>\`)
  );

  // 9. File Paths & VS Code Extension IDs (~/Library/..., enkia.tokyo-night)
  work = work.replace(/(~\\/[A-Za-z0-9_./-]+|\\b(?:enkia\\.tokyo-night|illixion\\.vscode-vibrancy-continued|pkief\\.material-icon-theme|com\\.apple\\.[A-Za-z0-9_.-]+)\\b)/g, m =>
    stash(\`<span class="tok-path">\${m}</span>\`)
  );

  // 10. Function & Method calls: identifier followed by (
  work = work.replace(/\\b([A-Za-z_][A-Za-z0-9_]*)(?=\\s*\\()/g, (m) => {
    if (/^(if|for|while|with|return|def|class|import|from)$/.test(m)) {
      return stash(\`<span class="tok-kw">\${m}</span>\`);
    }
    return stash(\`<span class="tok-fn">\${m}</span>\`);
  });

  // 11. Booleans & Null/None
  work = work.replace(/\\b(True|False|None|true|false|null|undefined)\\b/g, m =>
    stash(\`<span class="tok-bool">\${m}</span>\`)
  );

  // 12. Language Keywords
  work = work.replace(/\\b(import|from|def|return|if|else|elif|for|in|while|with|as|try|except|finally|class|const|let|var|function|async|await|export|default)\\b/g, m =>
    stash(\`<span class="tok-kw">\${m}</span>\`)
  );

  // 13. Built-in Modules, Classes & Constants
  work = work.replace(/\\b(os|plistlib|subprocess|glob|re|path|FMT_BINARY|UID|NSKeyedArchiver|NSColor|NSFont|NSObject|NSRGB|NSColorSpace|NSSize|NSfFlags|NSName|WindowServer)\\b/g, m =>
    stash(\`<span class="tok-builtin">\${m}</span>\`)
  );

  // 14. CLI Commands & Binaries
  work = work.replace(/\\b(python3|python|node|npm|npx|git|code|agy|sudo|xattr|defaults|plutil|killall|cfprefsd|open|mkdir|rm|cp|cat|echo|export|pip|brew|curl|EOF)\\b/g, m =>
    stash(\`<span class="tok-cmd">\${m}</span>\`)
  );

  // 15. Numbers, Floats & Percentages
  work = work.replace(/\\b(\\d+(?:\\.\\d+)?%?)\\b/g, m =>
    stash(\`<span class="tok-num">\${m}</span>\`)
  );

  return work.replace(/@@TOK_(\\d+)@@/g, (_, idx) => tokens[Number(idx)]);
}

function dedentLines(lines) {
  let minIndent = Infinity;
  for (const l of lines) {
    if (!l.trim()) continue;
    const m = l.match(/^( +)/);
    const indent = m ? m[1].length : 0;
    if (indent < minIndent) minIndent = indent;
  }
  if (minIndent > 0 && minIndent < Infinity) {
    return lines.map(l => l.slice(minIndent));
  }
  return lines;
}

function renderCodeBlock(rawCode, lang, idx) {
  const cleanLang = (lang || 'text').toLowerCase();
  const rawLines = dedentLines(rawCode.split('\\n'));

  // Detect embedded Python heredoc inside bash (e.g., python3 - <<'EOF')
  let hasEmbeddedPython = false;
  let activeLineLang = cleanLang;
  const rowsHtml = rawLines.map((line, i) => {
    const trimmed = line.trim();
    if ((cleanLang === 'bash' || cleanLang === 'sh') && /python3?\\s+.*<<\\s*['"]?EOF['"]?/.test(trimmed)) {
      hasEmbeddedPython = true;
      const htmlLine = highlightLineTokens(line, 'bash');
      activeLineLang = 'python';
      return \`<tr><td class="code-ln">\${i + 1}</td><td class="code-line">\${htmlLine}</td></tr>\`;
    }
    if (activeLineLang === 'python' && trimmed === 'EOF') {
      activeLineLang = cleanLang;
      const htmlLine = highlightLineTokens(line, 'bash');
      return \`<tr><td class="code-ln">\${i + 1}</td><td class="code-line">\${htmlLine}</td></tr>\`;
    }
    const lineHtml = highlightLineTokens(line, activeLineLang);
    return \`<tr><td class="code-ln">\${i + 1}</td><td class="code-line">\${lineHtml}</td></tr>\`;
  }).join('');

  const displayLang = hasEmbeddedPython
    ? 'bash · python'
    : (cleanLang === 'text' ? 'prompt spec' : cleanLang);
  const themeLabel = currentCodeTheme === 'tokyo' ? 'Tokyo Night' : 'Match Page';

  return \`
    <div class="code-block-wrap">
      <div class="code-block-header">
        <div class="code-header-left">
          <span class="code-window-dots">
            <span class="code-window-dot dot-r"></span>
            <span class="code-window-dot dot-y"></span>
            <span class="code-window-dot dot-g"></span>
          </span>
          <span class="lang-label">\${escapeHtml(displayLang)}</span>
        </div>
        <div class="code-header-actions">
          <button class="code-theme-btn" onclick="toggleCodeTheme()" title="Switch code block syntax theme (Tokyo Night IDE vs Adaptive Page)">
            <span>🎨</span>
            <span class="code-theme-label">\${themeLabel}</span>
          </button>
          <button class="copy-btn" onclick="copyCode(\${idx}, this)" title="Copy to clipboard">
            \${SVG_COPY}
            <span>Copy</span>
          </button>
        </div>
      </div>
      <div class="code-scroll">
        <table class="code-table"><tbody>\${rowsHtml}</tbody></table>
      </div>
    </div>
  \`;
}

function renderInline(text, sourceId) {
  const kbdTokens = [];
  let working = text.replace(/<kbd>([^<]+)<\\/kbd>/gi, (_, k) => {
    kbdTokens.push(k);
    return \`@@KBD_\${kbdTokens.length - 1}@@\`;
  });

  const linkTokens = [];
  working = working.replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g, (_, label, href) => {
    linkTokens.push({ label, href });
    return \`@@LINK_\${linkTokens.length - 1}@@\`;
  });

  let out = escapeHtml(working);

  out = out.replace(/\`([^\`]+)\`/g, (_, code) => {
    const hexMatch = code.match(/^#([0-9A-Fa-f]{6})$/);
    if (hexMatch) {
      return \`<code><span class="color-swatch" style="background:\${code}"></span>\${code}</code>\`;
    }
    return \`<code>\${code}</code>\`;
  });

  out = out.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
  out = out.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');

  out = out.replace(/@@LINK_(\\d+)@@/g, (_, idx) => {
    const { label, href } = linkTokens[Number(idx)];
    const renderedLabel = escapeHtml(label).replace(/\`([^\`]+)\`/g, '<code>$1</code>');
    if (/^(https?:|mailto:)/.test(href)) {
      return \`<a href="\${href}" target="_blank" class="external-link">\${renderedLabel}</a>\`;
    }
    const targetId = resolvePath(sourceId, href);
    if (nodeById.has(targetId)) {
      return \`<a href="#\${encodeURIComponent(targetId)}" class="internal-link" onclick="openDoc('\${targetId}'); return false;">\${renderedLabel}</a>\`;
    }
    return \`<a href="#\${encodeURIComponent(targetId)}" class="internal-link">\${renderedLabel}</a>\`;
  });

  out = out.replace(/@@KBD_(\\d+)@@/g, (_, idx) => \`<kbd>\${escapeHtml(kbdTokens[Number(idx)])}</kbd>\`);
  return out;
}

function copyCode(idx, btn) {
  navigator.clipboard.writeText(codeStore[idx] || '');
  btn.innerHTML = \`\${SVG_CHECK}<span>Copied</span>\`;
  setTimeout(() => {
    btn.innerHTML = \`\${SVG_COPY}<span>Copy</span>\`;
  }, 1400);
}

function renderMarkdown(md, sourceId) {
  codeStore.length = 0;
  const lines = md.split(/\\r?\\n/);
  let html = '';
  let inCode = false, codeLang = '', codeBuf = [];
  let inTable = false, tableRows = [];
  let listStack = [];

  function closeListsTo(targetDepth = 0) {
    while (listStack.length > targetDepth) html += \`</\${listStack.pop()}>\`;
  }

  function flushTable() {
    if (!inTable) return;
    inTable = false;
    if (tableRows.length < 2) return;
    const headers = tableRows[0];
    const bodyRows = tableRows.slice(2);
    html += '<table class="md-table"><thead><tr>' + headers.map(h => \`<th>\${renderInline(h, sourceId)}</th>\`).join('') + '</tr></thead><tbody>';
    for (const r of bodyRows) {
      html += '<tr>' + r.map(c => \`<td>\${renderInline(c, sourceId)}</td>\`).join('') + '</tr>';
    }
    html += '</tbody></table>';
    tableRows = [];
  }

  for (const line of lines) {
    const fenceMatch = line.match(/^\\s*\`\`\`(.*)$/);
    if (fenceMatch) {
      flushTable();
      if (!inCode) {
        inCode = true;
        codeLang = (fenceMatch[1] || 'text').trim();
        codeBuf = [];
      } else {
        const rawCode = codeBuf.join('\\n');
        const idx = codeStore.push(rawCode) - 1;
        html += renderCodeBlock(rawCode, codeLang, idx);
        inCode = false;
      }
      continue;
    }
    if (inCode) { codeBuf.push(line); continue; }

    if (/^\\s*\\|.*\\|\\s*$/.test(line)) {
      closeListsTo(0);
      inTable = true;
      tableRows.push(line.trim().slice(1, -1).split('|').map(c => c.trim()));
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (/^---+$/.test(line.trim())) {
      closeListsTo(0);
      html += '<hr/>';
      continue;
    }

    const hMatch = line.match(/^(#{1,3})\\s+(.+)$/);
    if (hMatch) {
      closeListsTo(0);
      const level = hMatch[1].length;
      const idAttr = slugify(hMatch[2]);
      html += \`<h\${level} id="\${idAttr}">\${renderInline(hMatch[2], sourceId)}</h\${level}>\`;
      continue;
    }

    const ulMatch = line.match(/^(\\s*)[-*]\\s+(.+)$/);
    if (ulMatch) {
      const depth = ulMatch[1].length >= 2 ? 2 : 1;
      while (listStack.length < depth) { html += '<ul>'; listStack.push('ul'); }
      while (listStack.length > depth) html += \`</\${listStack.pop()}>\`;
      html += \`<li>\${renderInline(ulMatch[2], sourceId)}</li>\`;
      continue;
    }

    const olMatch = line.match(/^(\\s*)\\d+\\.\\s+(.+)$/);
    if (olMatch) {
      const depth = olMatch[1].length >= 2 ? 2 : 1;
      while (listStack.length < depth) { html += '<ol>'; listStack.push('ol'); }
      while (listStack.length > depth) html += \`</\${listStack.pop()}>\`;
      html += \`<li>\${renderInline(olMatch[2], sourceId)}</li>\`;
      continue;
    }

    if (!line.trim()) continue;
    closeListsTo(0);
    html += \`<p>\${renderInline(line, sourceId)}</p>\`;
  }
  flushTable();
  closeListsTo(0);
  return html;
}

function getSidebarGroups() {
  const dynamicFolderGroups = (data.sidebarGroups || []).map(g => ({
    key: 'dir:' + g.dir,
    title: g.title,
    color: g.color,
    filter: n => n.id.startsWith(g.dir + '/')
  }));
  return [
    { key: 'overview', title: 'Overview', color: '#6366f1', filter: n => n.id === 'index.md' || n.id === 'inbox.md' },
    ...dynamicFolderGroups,
    { key: 'system', title: 'Governance', color: '#38bdf8', filter: n => n.id === 'AGENTS.md' || n.id === 'log.md' }
  ];
}

function getOrderedDocs() {
  const groups = getSidebarGroups();
  const ordered = [];
  for (const g of groups) {
    const items = data.nodes.filter(n => g.filter(n));
    for (const item of items) {
      ordered.push({ doc: item, groupTitle: g.title, groupColor: g.color });
    }
  }
  return ordered;
}

/* Unsquished Tag Popover Dropdown + Collapsible Sidebar Tags Section */
function toggleTagPopover(e) {
  if (e) e.stopPropagation();
  const pop = document.getElementById('tag-popover');
  const btn = document.getElementById('tag-dropdown-btn');
  const isOpen = pop.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
  if (isOpen) {
    const inp = document.getElementById('tag-popover-input');
    inp.value = '';
    renderTagPopoverList();
    setTimeout(() => inp.focus(), 20);
  }
}

window.addEventListener('click', () => {
  const pop = document.getElementById('tag-popover');
  const btn = document.getElementById('tag-dropdown-btn');
  if (pop && pop.classList.contains('open')) {
    pop.classList.remove('open');
    btn.classList.remove('open');
  }
});

function selectTagFilter(tag) {
  activeTagFilter = activeTagFilter === tag ? null : tag;
  const pop = document.getElementById('tag-popover');
  const btn = document.getElementById('tag-dropdown-btn');
  if (pop) pop.classList.remove('open');
  if (btn) btn.classList.remove('open');
  updateTagDropdownTrigger();
  renderTagPopoverList();
  renderSidebar();
}

function updateTagDropdownTrigger() {
  const labelEl = document.getElementById('tag-dropdown-label');
  if (!activeTagFilter) {
    labelEl.innerHTML = \`Filter by tag <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:11px">(\${(data.tags || []).length})</span>\`;
  } else {
    labelEl.innerHTML = \`Tag: <span class="active-tag-badge">#\${escapeHtml(activeTagFilter)} <span onclick="event.stopPropagation();selectTagFilter(null)" title="Clear tag filter" style="cursor:pointer;opacity:0.75">×</span></span>\`;
  }
}

function renderTagPopoverList() {
  const listEl = document.getElementById('tag-popover-list');
  const q = (document.getElementById('tag-popover-input')?.value || '').trim().toLowerCase().replace(/^#/, '');
  const tags = (data.tags || []).filter(t => !q || t.name.toLowerCase().includes(q));

  let html = \`
    <div class="tag-row-item \${!activeTagFilter ? 'active' : ''}" onclick="selectTagFilter(null)">
      <span class="tag-row-name">All Documents</span>
      <span class="tag-row-count">\${data.nodes.length}</span>
    </div>
  \`;
  for (const t of tags) {
    const isActive = activeTagFilter === t.name;
    html += \`
      <div class="tag-row-item \${isActive ? 'active' : ''}" onclick="selectTagFilter('\${t.name}')">
        <span class="tag-row-name">#\${escapeHtml(t.name)}</span>
        <span class="tag-row-count">\${t.count}</span>
      </div>
    \`;
  }
  if (!tags.length) {
    html += '<div style="padding:10px;text-align:center;color:var(--text-muted);font-size:11.5px">No matching tags</div>';
  }
  listEl.innerHTML = html;
}

function toggleSidebarFolder(groupKey) {
  if (collapsedSidebarFolders.has(groupKey)) collapsedSidebarFolders.delete(groupKey);
  else collapsedSidebarFolders.add(groupKey);
  renderSidebar();
}

function renderNavDocItem(item) {
  const isActive = item.id === currentDocId;
  const tipText = item.subtitle ? \`\${item.subtitle} — \${item.description || ''}\` : (item.description || item.id);
  let html = \`
    <div class="nav-item \${isActive ? 'active' : ''}" title="\${escapeHtml(tipText)}" onclick="openDoc('\${item.id}')">
      <span class="nav-item-title">\${escapeHtml(item.title)}</span>
    </div>\`;
  if (isActive && item.headings && item.headings.length > 0) {
    const h2s = item.headings.filter(h => h.level === 2);
    if (h2s.length > 0) {
      html += \`<div class="nav-subitems">\`;
      for (const h of h2s) {
        html += \`<div class="nav-subitem" onclick="scrollToSection('\${h.slug}')">\${escapeHtml(h.text)}</div>\`;
      }
      html += \`</div>\`;
    }
  }
  return html;
}

function renderSidebar() {
  const nav = document.getElementById('nav-list');
  const groups = getSidebarGroups();

  let out = '';
  for (const g of groups) {
    const items = data.nodes.filter(n => g.filter(n) && (!activeTagFilter || (n.tags || []).includes(activeTagFilter)));
    if (!items.length) continue;
    const isCollapsed = collapsedSidebarFolders.has(g.key);
    out += \`
      <div class="nav-folder \${isCollapsed ? 'collapsed' : ''}">
        <div class="nav-folder-header" onclick="toggleSidebarFolder('\${g.key}')">
          <div class="folder-left">
            <span class="folder-chevron">\${SVG_CHEVRON_DOWN}</span>
            <span>\${escapeHtml(g.title)}</span>
          </div>
          <span class="folder-count">\${items.length}</span>
        </div>
        <div class="nav-folder-items">\`;

    const ungrouped = items.filter(i => !i.group);
    const subMap = new Map();
    for (const i of items) {
      if (i.group) {
        if (!subMap.has(i.group)) subMap.set(i.group, []);
        subMap.get(i.group).push(i);
      }
    }

    for (const item of ungrouped) {
      out += renderNavDocItem(item);
    }

    for (const [subName, subItems] of subMap.entries()) {
      const subKey = \`subgroup:\${g.key}:\${subName}\`;
      const hasActiveChild = subItems.some(si => si.id === currentDocId);
      if (hasActiveChild) collapsedSidebarFolders.delete(subKey);
      const isSubCollapsed = collapsedSidebarFolders.has(subKey);
      out += \`
        <div class="nav-subgroup \${isSubCollapsed ? 'collapsed' : ''}">
          <div class="nav-subgroup-header" onclick="toggleSidebarFolder('\${subKey}')">
            <div class="folder-left">
              <span class="folder-chevron">\${SVG_CHEVRON_DOWN}</span>
              <span>\${escapeHtml(subName)}</span>
            </div>
            <span class="folder-count">\${subItems.length}</span>
          </div>
          <div class="nav-subgroup-items">\`;
      for (const subItem of subItems) {
        out += renderNavDocItem(subItem);
      }
      out += \`</div></div>\`;
    }

    out += \`</div></div>\`;
  }

  // Collapsible 1-Row-Per-Tag Tree Section at Bottom of Sidebar
  if (data.tags && data.tags.length > 0) {
    const isTagsCollapsed = collapsedSidebarFolders.has('tags-tree');
    out += \`
      <div class="nav-folder \${isTagsCollapsed ? 'collapsed' : ''}">
        <div class="nav-folder-header" onclick="toggleSidebarFolder('tags-tree')">
          <div class="folder-left">
            <span class="folder-chevron">\${SVG_CHEVRON_DOWN}</span>
            <span>Tags</span>
          </div>
          <span class="folder-count">\${data.tags.length}</span>
        </div>
        <div class="nav-folder-items">\`;
    for (const t of data.tags) {
      const isTagActive = activeTagFilter === t.name;
      out += \`
        <div class="nav-item \${isTagActive ? 'active' : ''}" onclick="selectTagFilter('\${t.name}')">
          <span class="nav-item-title" style="font-family:var(--font-mono);font-size:12px">#\${escapeHtml(t.name)}</span>
          <span class="nav-item-badge">\${t.count}</span>
        </div>\`;
    }
    out += \`</div></div>\`;
  }

  nav.innerHTML = out;
}

function scrollToSection(slug) {
  const el = document.getElementById(slug);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openDoc(id, sectionSlug = null) {
  const node = nodeById.get(id);
  if (!node) return;
  currentDocId = id;
  window.location.hash = encodeURIComponent(id);

  const ordered = getOrderedDocs();
  const currentEntryIdx = ordered.findIndex(e => e.doc.id === id);
  const groupTitle = currentEntryIdx !== -1 ? ordered[currentEntryIdx].groupTitle : 'Workspace';

  // Header & Document Hero Breadcrumbs
  document.getElementById('header-breadcrumb').innerHTML = \`
    <span class="bc-folder">\${escapeHtml(groupTitle)}</span>
    <span class="bc-sep">\${SVG_CHEVRON_RIGHT}</span>
    <span class="bc-current">\${escapeHtml(node.title)}</span>
  \`;

  document.getElementById('doc-breadcrumb').innerHTML = \`
    <span class="bc-dot" style="background:\${node.color}"></span>
    <span>\${escapeHtml(groupTitle)}</span>
    <span style="opacity:0.4">/</span>
    <span style="color:var(--text-secondary)">\${escapeHtml(node.type)}</span>
  \`;

  document.getElementById('doc-path').textContent = node.id;
  document.getElementById('doc-updated').textContent = node.updated ? '· ' + node.updated : '';
  document.getElementById('doc-hero-title').textContent = node.title;
  document.getElementById('doc-hero-subtitle').textContent = node.subtitle || '';

  const tagsEl = document.getElementById('doc-tags');
  tagsEl.innerHTML = (node.tags || []).slice().sort().map(t =>
    \`<span class="doc-tag-pill" onclick="selectTagFilter('\${t}')">#\${escapeHtml(t)}</span>\`
  ).join('');
  tagsEl.style.display = (node.tags && node.tags.length) ? 'flex' : 'none';

  const descEl = document.getElementById('doc-desc');
  if (node.description && node.description !== node.subtitle) {
    descEl.style.display = 'block';
    descEl.textContent = node.description;
  } else {
    descEl.style.display = 'none';
  }

  document.getElementById('doc-body').innerHTML = renderMarkdown(node.body, node.id);

  // TOC
  const tocEl = document.getElementById('doc-toc');
  const tocLinks = document.getElementById('toc-links');
  if (node.headings && node.headings.length > 0) {
    tocEl.classList.add('visible');
    tocLinks.innerHTML = node.headings.map(h =>
      \`<a class="toc-link toc-h\${h.level}" onclick="scrollToSection('\${h.slug}')">\${escapeHtml(h.text)}</a>\`
    ).join('');
  } else {
    tocEl.classList.remove('visible');
  }

  // Mintlify / VitePress Prev / Next Cards
  const pnEl = document.getElementById('doc-prev-next');
  const prevEntry = currentEntryIdx > 0 ? ordered[currentEntryIdx - 1] : null;
  const nextEntry = (currentEntryIdx !== -1 && currentEntryIdx < ordered.length - 1) ? ordered[currentEntryIdx + 1] : null;

  let pnHtml = '';
  if (prevEntry) {
    pnHtml += \`
      <div class="pn-card pn-prev" onclick="openDoc('\${prevEntry.doc.id}')">
        <span class="pn-label">← Previous</span>
        <div class="pn-title">\${escapeHtml(prevEntry.doc.title)}</div>
        <div class="pn-sub">\${escapeHtml(prevEntry.doc.subtitle || prevEntry.groupTitle)}</div>
      </div>
    \`;
  } else {
    pnHtml += '<div></div>';
  }
  if (nextEntry) {
    pnHtml += \`
      <div class="pn-card pn-next" onclick="openDoc('\${nextEntry.doc.id}')">
        <span class="pn-label">Next →</span>
        <div class="pn-title">\${escapeHtml(nextEntry.doc.title)}</div>
        <div class="pn-sub">\${escapeHtml(nextEntry.doc.subtitle || nextEntry.groupTitle)}</div>
      </div>
    \`;
  } else {
    pnHtml += '<div></div>';
  }
  pnEl.innerHTML = pnHtml;

  // Backlinks
  const blCards = document.getElementById('backlink-cards');
  if (node.backlinks && node.backlinks.length) {
    blCards.innerHTML = node.backlinks.map(bid => {
      const bn = nodeById.get(bid);
      return \`<div class="backlink-card" title="\${escapeHtml(bn.subtitle || bn.description)}" onclick="openDoc('\${bid}')">
        <span class="nav-dot" style="background:\${bn.color}"></span>
        <span>\${escapeHtml(bn.title)}</span>
      </div>\`;
    }).join('');
  } else {
    blCards.innerHTML = '<span style="font-size:12.5px;color:var(--text-muted)">No incoming references.</span>';
  }

  renderSidebar();
  if (sectionSlug) {
    setTimeout(() => scrollToSection(sectionSlug), 40);
  } else {
    document.getElementById('doc-pane').scrollTop = 0;
  }
}

/* Interactive Drag-Resize Splitters & Dock Position Switcher */
function setDockPosition(pos) {
  dockPosition = pos;
  const splitEl = document.getElementById('content-split');
  const resizerViz = document.getElementById('resizer-viz');
  splitEl.classList.remove('dock-right', 'dock-left', 'dock-bottom');
  splitEl.classList.add('dock-' + pos);

  document.getElementById('btn-dock-left').classList.toggle('active', pos === 'left');
  document.getElementById('btn-dock-bottom').classList.toggle('active', pos === 'bottom');
  document.getElementById('btn-dock-right').classList.toggle('active', pos === 'right');

  if (pos === 'bottom') {
    resizerViz.classList.remove('resizer-x');
    resizerViz.classList.add('resizer-y');
  } else {
    resizerViz.classList.remove('resizer-y');
    resizerViz.classList.add('resizer-x');
  }

  setTimeout(() => { resizeCanvas(); fitView(); }, 25);
}

(function initResizers() {
  const resizerSidebar = document.getElementById('resizer-sidebar');
  const resizerViz = document.getElementById('resizer-viz');
  const contentSplit = document.getElementById('content-split');
  let activeResizer = null;

  resizerSidebar.addEventListener('mousedown', e => {
    e.preventDefault();
    activeResizer = 'sidebar';
    resizerSidebar.classList.add('dragging');
    document.body.classList.add('is-resizing');
  });

  resizerViz.addEventListener('mousedown', e => {
    e.preventDefault();
    activeResizer = 'viz';
    resizerViz.classList.add('dragging');
    document.body.classList.add('is-resizing');
  });

  window.addEventListener('mousemove', e => {
    if (!activeResizer) return;
    if (activeResizer === 'sidebar') {
      const newW = Math.max(180, Math.min(480, e.clientX));
      document.documentElement.style.setProperty('--sidebar-width', newW + 'px');
      resizeCanvas();
    } else if (activeResizer === 'viz') {
      const rect = contentSplit.getBoundingClientRect();
      if (dockPosition === 'right') {
        const newW = Math.max(240, Math.min(rect.width - 280, rect.right - e.clientX));
        document.documentElement.style.setProperty('--viz-width', newW + 'px');
      } else if (dockPosition === 'left') {
        const newW = Math.max(240, Math.min(rect.width - 280, e.clientX - rect.left));
        document.documentElement.style.setProperty('--viz-width', newW + 'px');
      } else if (dockPosition === 'bottom') {
        const newH = Math.max(180, Math.min(rect.height - 180, rect.bottom - e.clientY));
        document.documentElement.style.setProperty('--viz-height', newH + 'px');
      }
      resizeCanvas();
    }
  });

  window.addEventListener('mouseup', () => {
    if (!activeResizer) return;
    resizerSidebar.classList.remove('dragging');
    resizerViz.classList.remove('dragging');
    document.body.classList.remove('is-resizing');
    activeResizer = null;
    resizeCanvas();
  });
})();

/* Cmd+K Spotlight Search Engine (MiniSearch Fuzzy CDN + Built-in Fallback) */
let spotlightHits = [];
let selectedHitIdx = 0;

function ensureMiniSearch() {
  if (miniSearchEngine || !window.MiniSearch) return;
  try {
    miniSearchEngine = new window.MiniSearch({
      fields: ['docTitle', 'sectionTitle', 'text', 'tagsStr'],
      storeFields: ['docId', 'sectionSlug', 'docTitle', 'sectionTitle', 'text'],
      searchOptions: {
        boost: { docTitle: 3, sectionTitle: 2, tagsStr: 2 },
        fuzzy: 0.2,
        prefix: true
      }
    });
    const docsToIndex = [];
    let idCounter = 1;
    for (const doc of data.nodes) {
      const tagsStr = (doc.tags || []).join(' ');
      docsToIndex.push({
        id: idCounter++,
        docId: doc.id,
        sectionSlug: null,
        docTitle: doc.title,
        sectionTitle: doc.subtitle || '',
        text: doc.description || doc.id,
        tagsStr
      });
      for (const sec of doc.sections || []) {
        docsToIndex.push({
          id: idCounter++,
          docId: doc.id,
          sectionSlug: sec.slug || null,
          docTitle: doc.title,
          sectionTitle: sec.title,
          text: sec.text,
          tagsStr
        });
      }
    }
    miniSearchEngine.addAll(docsToIndex);
  } catch (_) {
    miniSearchEngine = null;
  }
}

function openSearchModal() {
  ensureMiniSearch();
  const bd = document.getElementById('search-backdrop');
  bd.classList.add('open');
  const inp = document.getElementById('spotlight-input');
  inp.value = '';
  inp.focus();
  runSpotlightSearch();
}

function closeSearchModal() {
  document.getElementById('search-backdrop').classList.remove('open');
}

function highlightText(text, query) {
  const safe = escapeHtml(text);
  if (!query) return safe;
  const cleanQ = query.replace(/^#/, '').replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
  if (!cleanQ) return safe;
  return safe.replace(new RegExp(\`(\${cleanQ})\`, 'gi'), '<mark>$1</mark>');
}

function runSpotlightSearch() {
  const rawQ = document.getElementById('spotlight-input').value.trim();
  const q = rawQ.toLowerCase();
  const results = [];

  if (!q) {
    for (const doc of data.nodes) {
      results.push({
        docId: doc.id,
        sectionSlug: null,
        docTitle: doc.title,
        sectionTitle: doc.subtitle || null,
        snippet: doc.description || doc.id,
        score: doc.id === 'index.md' ? 100 : 50
      });
    }
    results.sort((a, b) => b.score - a.score);
    spotlightHits = results.slice(0, 20);
    selectedHitIdx = 0;
    renderSpotlightHits(rawQ);
    return;
  }

  // Use MiniSearch fuzzy index when available and not a strict #tag prefix query
  if (miniSearchEngine && !q.startsWith('#')) {
    const msHits = miniSearchEngine.search(rawQ);
    if (msHits.length > 0) {
      spotlightHits = msHits.slice(0, 20).map(h => {
        const rawText = h.text || '';
        const idx = rawText.toLowerCase().indexOf(q);
        let snippet = rawText;
        if (idx !== -1) {
          const start = Math.max(0, idx - 45);
          const end = Math.min(rawText.length, idx + q.length + 75);
          snippet = (start > 0 ? '…' : '') + rawText.slice(start, end) + (end < rawText.length ? '…' : '');
        } else if (rawText.length > 120) {
          snippet = rawText.slice(0, 120) + '…';
        }
        return {
          docId: h.docId,
          sectionSlug: h.sectionSlug,
          docTitle: h.docTitle,
          sectionTitle: h.sectionTitle,
          snippet
        };
      });
      selectedHitIdx = 0;
      renderSpotlightHits(rawQ);
      return;
    }
  }

  for (const doc of data.nodes) {
    const tagStr = (doc.tags || []).map(t => '#' + t).join(' ');

    if (q.startsWith('#')) {
      const targetTag = q.slice(1);
      if ((doc.tags || []).some(t => t.toLowerCase().includes(targetTag))) {
        results.push({
          docId: doc.id,
          sectionSlug: null,
          docTitle: doc.title,
          sectionTitle: tagStr,
          snippet: doc.description || doc.id,
          score: 95
        });
      }
      continue;
    }

    const inTitle = doc.title.toLowerCase().includes(q);
    const inSub = (doc.subtitle || '').toLowerCase().includes(q);
    const inDesc = (doc.description || '').toLowerCase().includes(q);
    const inTag = (doc.tags || []).some(t => t.toLowerCase().includes(q));
    if (inTitle || inSub || inDesc || inTag) {
      results.push({
        docId: doc.id,
        sectionSlug: null,
        docTitle: doc.title,
        sectionTitle: doc.subtitle || (inTag ? tagStr : null),
        snippet: doc.description || doc.id,
        score: inTitle ? 95 : 80
      });
    }

    for (const sec of doc.sections || []) {
      const inSecTitle = sec.title.toLowerCase().includes(q);
      const idx = sec.text.toLowerCase().indexOf(q);
      if (inSecTitle || idx !== -1) {
        let snippet = sec.text;
        if (idx !== -1) {
          const start = Math.max(0, idx - 45);
          const end = Math.min(sec.text.length, idx + q.length + 75);
          snippet = (start > 0 ? '…' : '') + sec.text.slice(start, end) + (end < sec.text.length ? '…' : '');
        } else {
          snippet = sec.text.slice(0, 120) + (sec.text.length > 120 ? '…' : '');
        }
        results.push({
          docId: doc.id,
          sectionSlug: sec.slug || null,
          docTitle: doc.title,
          sectionTitle: sec.title,
          snippet,
          score: inSecTitle ? 85 : 60
        });
      }
    }
  }

  results.sort((a, b) => b.score - a.score);
  spotlightHits = results.slice(0, 20);
  selectedHitIdx = 0;
  renderSpotlightHits(rawQ);
}

function renderSpotlightHits(rawQ) {
  const container = document.getElementById('spotlight-results');
  document.getElementById('spotlight-count').textContent = \`\${spotlightHits.length} result(s)\`;
  if (!spotlightHits.length) {
    container.innerHTML = '<div style="padding:28px;text-align:center;color:var(--text-muted)">No matching documents, sections, or #tags found.</div>';
    return;
  }
  container.innerHTML = spotlightHits.map((hit, idx) => \`
    <div class="search-result-item \${idx === selectedHitIdx ? 'selected' : ''}" onclick="selectSpotlightHit(\${idx})">
      <div class="sr-top">
        <div class="sr-breadcrumb">
          \${highlightText(hit.docTitle, rawQ)}
          \${hit.sectionTitle ? \` <span class="sr-sec">/ \${highlightText(hit.sectionTitle, rawQ)}</span>\` : ''}
        </div>
        <div class="sr-meta">
          <span class="sr-path">\${escapeHtml(hit.docId)}</span>
          <span class="sr-enter">↵</span>
        </div>
      </div>
      <div class="sr-snippet">\${highlightText(hit.snippet, rawQ)}</div>
    </div>
  \`).join('');
}

function selectSpotlightHit(idx) {
  const hit = spotlightHits[idx];
  if (!hit) return;
  closeSearchModal();
  openDoc(hit.docId, hit.sectionSlug);
}

window.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    const bd = document.getElementById('search-backdrop');
    if (bd.classList.contains('open')) closeSearchModal();
    else openSearchModal();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
    e.preventDefault();
    toggleLeftSidebar();
    return;
  }
  if ((e.metaKey || e.ctrlKey) && e.code === 'Backslash') {
    e.preventDefault();
    toggleRightViz();
    return;
  }
  const bd = document.getElementById('search-backdrop');
  if (!bd.classList.contains('open')) return;
  if (e.key === 'Escape') { closeSearchModal(); return; }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedHitIdx = Math.min(spotlightHits.length - 1, selectedHitIdx + 1);
    renderSpotlightHits(document.getElementById('spotlight-input').value.trim());
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedHitIdx = Math.max(0, selectedHitIdx - 1);
    renderSpotlightHits(document.getElementById('spotlight-input').value.trim());
  } else if (e.key === 'Enter' && spotlightHits[selectedHitIdx]) {
    e.preventDefault();
    selectSpotlightHit(selectedHitIdx);
  }
});

/* React Flow / Linear Style Mind Map & Force Graph Engine */
const vizPane = document.getElementById('viz-pane');
const canvas = document.getElementById('viz-canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('node-tooltip');
let width = 540, height = 600;
const dpr = window.devicePixelRatio || 1;
let camX = 40, camY = 0, zoom = 0.9;
let visibleNodes = [];
let visibleLinks = [];
let hoveredItem = null;

function setTreeGrouping(mode) {
  activeTreeMode = mode;
  rootTree = mode === 'tag' ? data.mindMapByTag : data.mindMapByFolder;
  document.getElementById('btn-tree-folder').classList.toggle('active', mode === 'folder');
  document.getElementById('btn-tree-tag').classList.toggle('active', mode === 'tag');
  if (vizType !== 'mindmap') {
    vizType = 'mindmap';
  }
  fitView();
}

const nonRoot = data.nodes.filter(n => n.id !== 'index.md');
data.nodes.forEach(n => {
  if (n.id === 'index.md') { n.gx = 0; n.gy = 0; }
  else {
    const idx = nonRoot.indexOf(n);
    const angle = (idx / Math.max(1, nonRoot.length)) * Math.PI * 2 - Math.PI / 2;
    n.gx = Math.cos(angle) * 170;
    n.gy = Math.sin(angle) * 170;
  }
  n.vx = 0; n.vy = 0;
});

const LEVEL_X_GAP = 272;
const LEAF_Y_GAP = 66;

function getCanvasFontStack() {
  return {
    title: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    body: '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    titleSize: '13px',
    subSize: '11px'
  };
}

function computeTreeLayout(root) {
  visibleNodes = [];
  visibleLinks = [];
  let leafIndex = 0;
  const fStack = getCanvasFontStack();

  function measure(node, depth) {
    node.depth = depth;
    ctx.font = \`600 \${fStack.titleSize} \${fStack.title}\`;
    const titleW = ctx.measureText(node.label).width;
    ctx.font = \`400 \${fStack.subSize} \${fStack.body}\`;
    const subW = ctx.measureText(node.subtitle || '').width;
    node.w = Math.min(246, Math.max(154, Math.max(titleW, subW) + 38));
    node.h = node.sublabel === 'section' ? 34 : 52;
    node.x = depth * LEVEL_X_GAP;

    const hasKids = node.children && node.children.length > 0;
    if (!hasKids || node.collapsed) {
      node.y = leafIndex * LEAF_Y_GAP;
      leafIndex++;
    } else {
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
  for (const n of visibleNodes) n.y -= rootY;
}

function fitView() {
  if (vizType === 'graph') {
    camX = width / 2;
    camY = height / 2;
    zoom = layoutMode === 'full' ? 1.2 : 0.95;
    return;
  }
  computeTreeLayout(rootTree);
  if (!visibleNodes.length) return;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const n of visibleNodes) {
    minX = Math.min(minX, n.x);
    maxX = Math.max(maxX, n.x + n.w + 30);
    minY = Math.min(minY, n.y - n.h / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  }
  const treeW = Math.max(200, maxX - minX);
  const treeH = Math.max(160, maxY - minY);
  const padX = 76, padY = 110;
  zoom = Math.max(0.5, Math.min(1.18, Math.min((width - padX) / treeW, (height - padY) / treeH)));
  camX = (width - treeW * zoom) / 2 - minX * zoom;
  camY = height / 2 - ((minY + maxY) / 2) * zoom + 8;
}

function expandAll(expand) {
  function walk(node, depth) {
    if (depth >= 1 && node.children && node.children.length > 0) {
      node.collapsed = !expand;
    }
    for (const c of node.children || []) walk(c, depth + 1);
  }
  walk(rootTree, 0);
  fitView();
}

let sidebarCollapsed = false;

function toggleLeftSidebar(forceState) {
  sidebarCollapsed = typeof forceState === 'boolean' ? forceState : !sidebarCollapsed;
  const sidebar = document.getElementById('sidebar');
  const resizerSidebar = document.getElementById('resizer-sidebar');
  const btnSidebar = document.getElementById('btn-toggle-sidebar');

  if (sidebar) sidebar.classList.toggle('collapsed', sidebarCollapsed);
  if (resizerSidebar) resizerSidebar.classList.toggle('hidden', sidebarCollapsed);
  if (btnSidebar) btnSidebar.classList.toggle('active', !sidebarCollapsed);

  setTimeout(() => { resizeCanvas(); fitView(); }, 20);
}

function toggleRightViz() {
  if (layoutMode === 'hidden') {
    setViewSwitch('split');
  } else {
    setViewSwitch('docs');
  }
}

function setViewSwitch(seg) {
  activeSegment = seg;
  document.getElementById('seg-split').classList.toggle('active', seg === 'split');
  document.getElementById('seg-mindmap').classList.toggle('active', seg === 'mindmap');
  document.getElementById('seg-graph').classList.toggle('active', seg === 'graph');
  document.getElementById('seg-docs').classList.toggle('active', seg === 'docs');

  if (seg === 'split') {
    layoutMode = 'split';
    vizType = 'mindmap';
  } else if (seg === 'mindmap') {
    layoutMode = 'full';
    vizType = 'mindmap';
  } else if (seg === 'graph') {
    layoutMode = 'full';
    vizType = 'graph';
  } else if (seg === 'docs') {
    layoutMode = 'hidden';
  }

  const docPane = document.getElementById('doc-pane');
  const resizerViz = document.getElementById('resizer-viz');
  const dockGroup = document.getElementById('viz-dock-group');
  const btnViz = document.getElementById('btn-toggle-viz');

  vizPane.classList.remove('expanded', 'hidden');
  resizerViz.classList.remove('hidden');
  docPane.style.display = 'block';
  dockGroup.style.display = 'inline-flex';

  if (layoutMode === 'full') {
    vizPane.classList.add('expanded');
    resizerViz.classList.add('hidden');
    docPane.style.display = 'none';
    dockGroup.style.display = 'none';
  } else if (layoutMode === 'hidden') {
    vizPane.classList.add('hidden');
    resizerViz.classList.add('hidden');
  }

  const vizVisible = layoutMode !== 'hidden';
  if (btnViz) btnViz.classList.toggle('active', vizVisible);

  const treeGroup = document.getElementById('viz-tree-group');
  const expBtn = document.getElementById('btn-expand-all');
  const colBtn = document.getElementById('btn-collapse-all');
  if (vizType === 'mindmap') {
    treeGroup.style.display = 'inline-flex';
    expBtn.style.display = 'inline-flex';
    colBtn.style.display = 'inline-flex';
    document.getElementById('viz-hint').innerHTML = 'Click node to open &middot; Click +/- badge to toggle children &middot; Drag splitters to resize';
  } else {
    treeGroup.style.display = 'none';
    expBtn.style.display = 'none';
    colBtn.style.display = 'none';
    document.getElementById('viz-hint').innerHTML = 'Click node to open document &middot; Drag nodes to rearrange &middot; Scroll to zoom';
  }

  setTimeout(() => { resizeCanvas(); fitView(); }, 20);
}

function resizeCanvas() {
  const rect = vizPane.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;
  width = rect.width;
  height = rect.height;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

new ResizeObserver(() => { resizeCanvas(); }).observe(vizPane);

function screenToWorld(sx, sy) {
  return { x: (sx - camX) / zoom, y: (sy - camY) / zoom };
}

function hitTestMindMap(wx, wy) {
  for (let i = visibleNodes.length - 1; i >= 0; i--) {
    const n = visibleNodes[i];
    const top = n.y - n.h / 2, bottom = n.y + n.h / 2;
    if (n.children && n.children.length > 0) {
      const tx = n.x + n.w + 12, ty = n.y;
      if (Math.hypot(wx - tx, wy - ty) <= 11) return { node: n, action: 'toggle' };
    }
    if (wx >= n.x && wx <= n.x + n.w && wy >= top && wy <= bottom) {
      return { node: n, action: 'select' };
    }
  }
  return null;
}

function hitTestGraph(wx, wy) {
  for (let i = data.nodes.length - 1; i >= 0; i--) {
    const n = data.nodes[i];
    const rad = n.id === 'index.md' ? 14 : 10;
    if (Math.hypot(wx - n.gx, wy - n.gy) <= rad + 6) return { node: n, action: 'select' };
  }
  return null;
}

let currentTheme = localStorage.getItem('okf-theme') || 'paper';

function setTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('okf-theme', theme);
  const btnPaper = document.getElementById('theme-paper');
  const btnLight = document.getElementById('theme-light');
  const btnDark = document.getElementById('theme-dark');
  if (btnPaper) btnPaper.classList.toggle('active', theme === 'paper');
  if (btnLight) btnLight.classList.toggle('active', theme === 'light');
  if (btnDark) btnDark.classList.toggle('active', theme === 'dark');

  const hljsLink = document.getElementById('hljs-theme');
  if (hljsLink) {
    hljsLink.href = theme === 'dark'
      ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
      : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
  }
}

function getCanvasPalette() {
  if (currentTheme === 'light') {
    return {
      grid: 'rgba(15, 23, 42, 0.04)',
      edge: '#e2e8f0',
      edgeActive: '#0f172a',
      rootBg: '#0f172a',
      rootTitle: '#ffffff',
      rootSubtitle: '#94a3b8',
      cardBg: '#f8fafc',
      cardBgActive: '#f1f5f9',
      cardBgSection: '#f1f5f9',
      cardBorder: '#e2e8f0',
      cardBorderHover: '#0f172a',
      cardBorderActive: '#0f172a',
      shadow: 'rgba(15, 23, 42, 0.06)',
      title: '#0f172a',
      subtitle: '#64748b',
      badgeBg: '#f8fafc',
      badgeBorder: '#e2e8f0',
      badgeText: '#334155',
      accents: {
        cobalt:     { bar: '#2563eb', tint: '#eff6ff', border: '#bfdbfe', edge: '#93c5fd' },
        terracotta: { bar: '#ea580c', tint: '#fff7ed', border: '#fed7aa', edge: '#fdba74' },
        plum:       { bar: '#7c3aed', tint: '#f5f3ff', border: '#ddd6fe', edge: '#c4b5fd' },
        sage:       { bar: '#16a34a', tint: '#f0fdf4', border: '#bbf7d0', edge: '#86efac' },
        teal:       { bar: '#0d9488', tint: '#f0fdfa', border: '#99f6e4', edge: '#5eead4' }
      }
    };
  }
  if (currentTheme === 'dark') {
    return {
      grid: 'rgba(255, 255, 255, 0.035)',
      edge: '#27272a',
      edgeActive: '#fafafa',
      rootBg: '#f4f4f5',
      rootTitle: '#09090b',
      rootSubtitle: '#52525b',
      cardBg: '#18181b',
      cardBgActive: '#27272a',
      cardBgSection: '#141416',
      cardBorder: '#27272a',
      cardBorderHover: '#52525b',
      cardBorderActive: '#fafafa',
      shadow: 'rgba(0, 0, 0, 0.35)',
      title: '#f4f4f5',
      subtitle: '#a1a1aa',
      badgeBg: '#27272a',
      badgeBorder: '#3f3f46',
      badgeText: '#f4f4f5',
      accents: {
        cobalt:     { bar: '#60a5fa', tint: '#161d2b', border: '#1e293b', edge: '#3b82f6' },
        terracotta: { bar: '#fb923c', tint: '#281a14', border: '#431407', edge: '#f97316' },
        plum:       { bar: '#a78bfa', tint: '#22192e', border: '#2e1065', edge: '#8b5cf6' },
        sage:       { bar: '#4ade80', tint: '#14251a', border: '#052e16', edge: '#22c55e' },
        teal:       { bar: '#2dd4bf', tint: '#132524', border: '#042f2e', edge: '#14b8a6' }
      }
    };
  }
  // Default: 'paper' (Warm Editorial Paper)
  return {
    grid: 'rgba(28, 25, 23, 0.045)',
    edge: '#d8d2c4',
    edgeActive: '#1c1917',
    rootBg: '#1c1917',
    rootTitle: '#faf9f5',
    rootSubtitle: '#a8a29e',
    cardBg: '#f6f3eb',
    cardBgActive: '#eee8da',
    cardBgSection: '#eee8da',
    cardBorder: '#e0d8c8',
    cardBorderHover: '#1c1917',
    cardBorderActive: '#1c1917',
    shadow: 'rgba(28, 25, 23, 0.06)',
    title: '#1c1917',
    subtitle: '#78716c',
    badgeBg: '#faf9f5',
    badgeBorder: '#d8d2c4',
    badgeText: '#44403c',
    accents: {
      cobalt:     { bar: '#2563eb', tint: '#f0f4f9', border: '#cbd5e1', edge: '#94a3b8' },
      terracotta: { bar: '#ea580c', tint: '#faf4ee', border: '#fed7aa', edge: '#fdba74' },
      plum:       { bar: '#7c3aed', tint: '#f6f3fa', border: '#ddd6fe', edge: '#c4b5fd' },
      sage:       { bar: '#16a34a', tint: '#f1f7f3', border: '#bbf7d0', edge: '#86efac' },
      teal:       { bar: '#0d9488', tint: '#f0f7f6', border: '#99f6e4', edge: '#5eead4' }
    }
  };
}

function showTooltip(item, sx, sy) {
  if (!item || !item.node || sx < 0 || sy < 0 || sx > width || sy > height) {
    tooltip.style.display = 'none';
    return;
  }
  const n = item.node;
  tooltip.style.display = 'block';
  tooltip.style.left = Math.min(sx + 16, width - 295) + 'px';
  tooltip.style.top = Math.min(sy + 16, height - 155) + 'px';

  document.getElementById('nt-badge').textContent = n.sublabel || n.type || 'concept';
  document.getElementById('nt-title').textContent = n.label || n.title;
  document.getElementById('nt-sub').textContent = n.subtitle || n.id || '';
  document.getElementById('nt-desc').textContent = n.description || '';

  const tagsContainer = document.getElementById('nt-tags');
  const tags = n.tags || [];
  tagsContainer.innerHTML = tags.map(t => \`<span class="nt-tag">#\${escapeHtml(t)}</span>\`).join('');
}

let isPanning = false, draggingGraphNode = null, panStartX = 0, panStartY = 0, panMoved = false;

canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
  const w = screenToWorld(sx, sy);
  panMoved = false;
  panStartX = sx; panStartY = sy;

  if (vizType === 'graph') {
    const hit = hitTestGraph(w.x, w.y);
    if (hit) { draggingGraphNode = hit.node; return; }
  }
  isPanning = true;
});

window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
  const w = screenToWorld(sx, sy);

  if (draggingGraphNode) {
    if (Math.hypot(sx - panStartX, sy - panStartY) > 3) panMoved = true;
    draggingGraphNode.gx = w.x;
    draggingGraphNode.gy = w.y;
    draggingGraphNode.vx = 0; draggingGraphNode.vy = 0;
    tooltip.style.display = 'none';
    return;
  }
  if (isPanning) {
    if (Math.hypot(sx - panStartX, sy - panStartY) > 3) panMoved = true;
    camX += sx - panStartX;
    camY += sy - panStartY;
    panStartX = sx; panStartY = sy;
    tooltip.style.display = 'none';
    return;
  }

  hoveredItem = vizType === 'mindmap' ? hitTestMindMap(w.x, w.y) : hitTestGraph(w.x, w.y);
  canvas.style.cursor = hoveredItem ? 'pointer' : 'grab';
  showTooltip(hoveredItem, sx, sy);
});

window.addEventListener('mouseup', e => {
  if (draggingGraphNode) {
    if (!panMoved) {
      openDoc(draggingGraphNode.id);
      if (layoutMode === 'full') setViewSwitch('split');
    }
    draggingGraphNode = null;
    return;
  }
  if (!isPanning) return;
  isPanning = false;
  if (!panMoved && vizType === 'mindmap') {
    const rect = canvas.getBoundingClientRect();
    const w = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    const hit = hitTestMindMap(w.x, w.y);
    if (hit) {
      if (hit.action === 'toggle') {
        hit.node.collapsed = !hit.node.collapsed;
        computeTreeLayout(rootTree);
      } else if (hit.node.sublabel === 'subgroup') {
        // Clicking a subgroup card (like "Themes" under Dev Tools) toggles its children!
        hit.node.collapsed = !hit.node.collapsed;
        computeTreeLayout(rootTree);
      } else if (hit.node.docId) {
        openDoc(hit.node.docId, hit.node.sectionSlug || null);
        if (layoutMode === 'full' && hit.node.sublabel !== 'branch') {
          setViewSwitch('split');
        }
      }
    }
  }
});

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
  const wx = (sx - camX) / zoom, wy = (sy - camY) / zoom;
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  zoom = Math.max(0.4, Math.min(2.5, zoom * factor));
  camX = sx - wx * zoom;
  camY = sy - wy * zoom;
}, { passive: false });

function truncateLabel(str, maxW) {
  if (!str) return '';
  if (ctx.measureText(str).width <= maxW) return str;
  let s = str;
  while (s.length > 4 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

function drawGrid(pal) {
  const step = 26 * zoom;
  if (step < 12) return;
  ctx.fillStyle = pal.grid;
  const ox = ((camX % step) + step) % step;
  const oy = ((camY % step) + step) % step;
  for (let x = ox; x < width; x += step) {
    for (let y = oy; y < height; y += step) {
      ctx.fillRect(x, y, 1.3, 1.3);
    }
  }
}

function stepForceGraph() {
  for (let i = 0; i < data.nodes.length; i++) {
    for (let j = i + 1; j < data.nodes.length; j++) {
      const a = data.nodes[i], b = data.nodes[j];
      let dx = b.gx - a.gx, dy = b.gy - a.gy;
      let distSq = dx * dx + dy * dy + 1;
      let dist = Math.sqrt(distSq);
      let f = 11500 / distSq;
      a.vx -= (dx / dist) * f; a.vy -= (dy / dist) * f;
      b.vx += (dx / dist) * f; b.vy += (dy / dist) * f;
    }
  }
  for (const l of data.links) {
    const a = nodeById.get(l.source), b = nodeById.get(l.target);
    if (!a || !b) continue;
    let dx = b.gx - a.gx, dy = b.gy - a.gy;
    let dist = Math.sqrt(dx * dx + dy * dy) || 1;
    let f = (dist - 165) * 0.045;
    a.vx += (dx / dist) * f; a.vy += (dy / dist) * f;
    b.vx -= (dx / dist) * f; b.vy -= (dy / dist) * f;
  }
  for (const n of data.nodes) {
    if (n === draggingGraphNode) continue;
    const pull = n.id === 'index.md' ? 0.08 : 0.012;
    n.vx += (0 - n.gx) * pull;
    n.vy += (0 - n.gy) * pull;
    n.vx *= 0.78; n.vy *= 0.78;
    n.gx += n.vx; n.gy += n.vy;
  }
}

function renderFrame() {
  if (layoutMode !== 'hidden') {
    const pal = getCanvasPalette();
    const fStack = getCanvasFontStack();
    ctx.clearRect(0, 0, width, height);
    drawGrid(pal);
    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(zoom, zoom);

    if (vizType === 'mindmap') {
      computeTreeLayout(rootTree);

      // Architectural Branch-Colored Cubic Bezier Connectors
      for (const link of visibleLinks) {
        const s = link.source, t = link.target;
        const startX = s.x + s.w + (s.children && s.children.length ? 22 : 0);
        const startY = s.y, endX = t.x, endY = t.y;
        const midX = (startX + endX) / 2;
        const acc = pal.accents[t.accentKey] || pal.accents.cobalt;
        const isHighlighted = (t.docId === currentDocId && t.sublabel !== 'branch' && t.sublabel !== 'subgroup') || (s.docId === currentDocId && s.sublabel !== 'branch' && s.sublabel !== 'subgroup');
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
        ctx.strokeStyle = isHighlighted ? acc.bar : acc.edge;
        ctx.lineWidth = isHighlighted ? 2.1 : 1.4;
        ctx.stroke();
      }

      // Architectural Mind Map Nodes (Root Contrast + Branch Tints + Left Accent Bars)
      for (const n of visibleNodes) {
        const isRoot = n.sublabel === 'root';
        const isBranch = n.sublabel === 'branch' || n.sublabel === 'subgroup';
        const isSection = n.sublabel === 'section';
        const isActiveDoc = n.docId === currentDocId && !isRoot && !isBranch && !isSection;
        const isHovered = hoveredItem && hoveredItem.node.id === n.id;
        const top = n.y - n.h / 2;
        const acc = pal.accents[n.accentKey] || pal.accents.cobalt;

        // 1. Card Surface Fill with Subtle Architectural Shadow
        ctx.save();
        ctx.shadowColor = pal.shadow;
        ctx.shadowBlur = isActiveDoc || isRoot ? 12 : 5;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.roundRect(n.x, top, n.w, n.h, 7);
        if (isRoot) {
          ctx.fillStyle = pal.rootBg;
        } else if (isBranch) {
          ctx.fillStyle = acc.tint;
        } else if (isActiveDoc) {
          ctx.fillStyle = acc.tint;
        } else if (isSection) {
          ctx.fillStyle = pal.cardBgSection;
        } else {
          ctx.fillStyle = pal.cardBg;
        }
        ctx.fill();
        ctx.restore();

        // 2. Left Architectural Accent Bar (for Branch, Subgroup, and Document cards)
        if (!isRoot && !isSection) {
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(n.x, top, n.w, n.h, 7);
          ctx.clip();
          ctx.fillStyle = acc.bar;
          ctx.fillRect(n.x, top, isBranch || isActiveDoc ? 3.5 : 2.5, n.h);
          ctx.restore();
        }

        // 3. Crisp Card Border
        ctx.beginPath();
        ctx.roundRect(n.x, top, n.w, n.h, 7);
        if (isRoot) {
          ctx.strokeStyle = pal.rootBg;
          ctx.lineWidth = 1.5;
        } else if (isActiveDoc) {
          ctx.strokeStyle = acc.bar;
          ctx.lineWidth = 1.8;
        } else if (isBranch) {
          ctx.strokeStyle = isHovered ? acc.bar : acc.border;
          ctx.lineWidth = 1.3;
        } else {
          ctx.strokeStyle = isHovered ? acc.bar : pal.cardBorder;
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        // 4. Typography
        const textLeft = (!isRoot && !isSection) ? n.x + 14 : n.x + 13;
        const maxTextW = n.w - 26;

        if (isSection) {
          ctx.font = \`400 12px \${fStack.body}\`;
          ctx.fillStyle = isHovered ? pal.title : pal.subtitle;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(truncateLabel(n.label, maxTextW), textLeft, n.y);
        } else {
          ctx.font = \`\${isRoot || isBranch || isActiveDoc ? '600' : '500'} \${fStack.titleSize} \${fStack.title}\`;
          ctx.fillStyle = isRoot ? pal.rootTitle : pal.title;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(truncateLabel(n.label, maxTextW), textLeft, top + 18);

          ctx.font = \`400 \${fStack.subSize} \${fStack.body}\`;
          ctx.fillStyle = isRoot ? pal.rootSubtitle : pal.subtitle;
          ctx.fillText(truncateLabel(n.subtitle || n.sublabel, maxTextW), textLeft, top + 36);
        }

        // 5. Circular +/- Expand/Collapse Count Badge
        if (n.children && n.children.length > 0) {
          const tx = n.x + n.w + 12, ty = n.y;
          ctx.beginPath();
          ctx.moveTo(n.x + n.w, ty);
          ctx.lineTo(tx - 9.5, ty);
          ctx.strokeStyle = isRoot ? pal.edge : acc.edge;
          ctx.lineWidth = 1.3;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(tx, ty, 9.5, 0, Math.PI * 2);
          ctx.fillStyle = n.collapsed ? acc.tint : pal.badgeBg;
          ctx.fill();
          ctx.strokeStyle = n.collapsed ? acc.bar : acc.border;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.font = '600 10.5px "JetBrains Mono", ui-monospace, SFMono-Regular, monospace';
          ctx.fillStyle = n.collapsed ? acc.bar : pal.badgeText;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(n.collapsed ? '+' + n.children.length : '−', tx, ty + 0.5);
        }
      }
    } else {
      stepForceGraph();
      for (const l of data.links) {
        const a = nodeById.get(l.source), b = nodeById.get(l.target);
        if (!a || !b) continue;
        const active = a.id === currentDocId || b.id === currentDocId;
        ctx.beginPath();
        ctx.moveTo(a.gx, a.gy);
        ctx.lineTo(b.gx, b.gy);
        ctx.strokeStyle = active ? pal.edgeActive : pal.edge;
        ctx.lineWidth = active ? 1.5 : 1.15;
        ctx.stroke();
      }
      for (const n of data.nodes) {
        const isCurrent = n.id === currentDocId;
        const isHover = hoveredItem && hoveredItem.node.id === n.id;
        const rad = n.id === 'index.md' ? 11 : 8;

        ctx.beginPath();
        ctx.arc(n.gx, n.gy, rad, 0, Math.PI * 2);
        ctx.fillStyle = isCurrent ? pal.title : pal.cardBg;
        ctx.fill();
        ctx.lineWidth = isCurrent || isHover ? 2 : 1.5;
        ctx.strokeStyle = isCurrent || isHover ? pal.title : pal.cardBorderHover;
        ctx.stroke();

        ctx.font = \`\${isCurrent ? '600' : '500'} 11.5px \${fStack.title}\`;
        const tw = ctx.measureText(n.title).width;
        const px = n.gx - tw / 2 - 8, py = n.gy + rad + 6;
        ctx.fillStyle = pal.cardBg;
        ctx.beginPath();
        ctx.roundRect(px, py, tw + 16, 20, 4);
        ctx.fill();
        ctx.strokeStyle = isCurrent ? pal.cardBorderActive : pal.cardBorder;
        ctx.lineWidth = isCurrent ? 1.4 : 1;
        ctx.stroke();

        ctx.fillStyle = isCurrent ? pal.title : pal.subtitle;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.title, n.gx, py + 10);
      }
    }
    ctx.restore();
  }
  requestAnimationFrame(renderFrame);
}

setTheme(currentTheme);
updateTagDropdownTrigger();
renderTagPopoverList();
const initialHash = decodeURIComponent(window.location.hash.slice(1));
openDoc(nodeById.has(initialHash) ? initialHash : 'index.md');
window.addEventListener('load', () => {
  // Re-render current doc once highlight.js and web fonts finish loading
  openDoc(currentDocId);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { computeTreeLayout(rootTree); fitView(); });
  }
});
setTimeout(() => { resizeCanvas(); fitView(); }, 30);
renderFrame();
</script>
</body>
</html>`;

const siteDir = path.join(ROOT, 'site');
fs.mkdirSync(siteDir, { recursive: true });
const siteOutPath = path.join(siteDir, 'index.html');
fs.writeFileSync(siteOutPath, html, 'utf8');

const tmpOutPath = '/tmp/okf-foam-graph.html';
fs.writeFileSync(tmpOutPath, html, 'utf8');

console.log(`Built OKF Developer Docs + Mind Map (Editorial Paper / Daylight / Carbon Edition) at:`);
console.log(`  - ${siteOutPath}`);
console.log(`  - ${tmpOutPath}`);
