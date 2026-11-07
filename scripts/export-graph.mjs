#!/usr/bin/env node
/**
 * OKF Developer Docs + Collapsible Mind Map + Network Graph + Cmd+K Search Builder
 *
 * Features:
 * - 2-line Concept Cards (Main Title + Subheading) in Mind Map, Sidebar, and Doc Hero
 * - Rich Floating Glass Tooltip on hover in Mind Map and Network Graph
 * - Tokyo Night Storm Syntax Highlighting with line numbers & macOS window header
 * - Cmd+K / Ctrl+K Spotlight Search Modal
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORED_DIRS = new Set(['.git', '.vscode', '.foam', 'node_modules', 'scripts', 'site', 'dist']);

const TYPE_COLORS = {
  index: '#F0F6FC',
  note: '#7AA2F7',
  concept: '#9ECE6A',
  reference: '#BB9AF7',
  decision: '#E0AF68',
  playbook: '#F7768E',
  inbox: '#FF9E64',
  guideline: '#7DCFFF',
  log: '#8B949E'
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
    description,
    updated,
    tags,
    headings,
    sections,
    body,
    color: TYPE_COLORS[nodeType] || '#7AA2F7'
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

const BRANCH_PALETTE = ['#9ECE6A', '#7AA2F7', '#BB9AF7', '#E0AF68', '#F7768E', '#7DCFFF'];
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

function docToTreeNode(doc, branchColor, collapseHeadings = false, prefixId = '') {
  const h2Nodes = [];
  let currentH2 = null;
  for (const h of doc.headings || []) {
    if (h.level === 2) {
      currentH2 = {
        id: `${prefixId}sec:${doc.id}:${h.slug}`,
        docId: doc.id,
        sectionSlug: h.slug,
        label: h.text,
        subtitle: `Section in ${doc.title}`,
        sublabel: 'section',
        description: `Jump to "${h.text}" inside ${doc.title}`,
        tags: doc.tags || [],
        color: branchColor || doc.color,
        collapsed: true,
        children: []
      };
      h2Nodes.push(currentH2);
    } else if (h.level === 3 && currentH2) {
      currentH2.children.push({
        id: `${prefixId}subsec:${doc.id}:${h.slug}`,
        docId: doc.id,
        sectionSlug: h.slug,
        label: h.text,
        subtitle: currentH2.label,
        sublabel: 'section',
        description: `Jump to subsection "${h.text}" in ${doc.title}`,
        tags: doc.tags || [],
        color: branchColor || doc.color,
        collapsed: false,
        children: []
      });
    }
  }

  return {
    id: `${prefixId}doc:${doc.id}`,
    docId: doc.id,
    label: doc.title,
    subtitle: doc.subtitle || doc.type,
    sublabel: doc.type,
    description: doc.description || doc.id,
    tags: doc.tags || [],
    color: branchColor || doc.color,
    collapsed: collapseHeadings,
    children: h2Nodes
  };
}

const folderBranches = [];
const sidebarGroups = [];
let paletteIdx = 0;

for (const [dir, docs] of folderMap.entries()) {
  const color = BRANCH_PALETTE[paletteIdx % BRANCH_PALETTE.length];
  paletteIdx++;
  const dirIndexId = `${dir}/index.md`;
  const indexDoc = nodesMap.get(dirIndexId);
  const contentDocs = docs.filter(d => path.posix.basename(d.id) !== 'index.md');
  const folderTitle = formatFolderTitle(dir);

  sidebarGroups.push({
    title: folderTitle,
    dir,
    indexId: indexDoc ? dirIndexId : null,
    color
  });

  folderBranches.push({
    id: `branch:${dir}`,
    docId: indexDoc ? dirIndexId : (contentDocs[0]?.id || 'index.md'),
    label: folderTitle,
    subtitle: `${contentDocs.length} concept guides · ${dir}/`,
    sublabel: 'branch',
    description: indexDoc?.description || `Domain collection in ${dir}/ (${contentDocs.length} notes)`,
    tags: [],
    color,
    collapsed: false,
    children: contentDocs.map(d => docToTreeNode(d, color, false, `f:${dir}:`))
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
  color: '#7AA2F7',
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
      color: '#FF9E64',
      collapsed: false,
      children: captureDocs.map(d => docToTreeNode(d, '#FF9E64', true, 'f:cap:'))
    },
    {
      id: 'branch:system',
      docId: 'AGENTS.md',
      label: 'AI & Governance',
      subtitle: 'AGENTS.md & changelog',
      sublabel: 'branch',
      description: 'OKF agent operating guidelines and automatic audit log',
      tags: ['okf', 'ai-agents'],
      color: '#7DCFFF',
      collapsed: true,
      children: systemDocs.map(d => docToTreeNode(d, '#7DCFFF', true, 'f:sys:'))
    }
  ]
};

const sortedTags = Array.from(allTagsCount.entries()).sort((a, b) => b[1] - a[1]);
const tagBranches = sortedTags.map(([tag, count], idx) => {
  const color = BRANCH_PALETTE[idx % BRANCH_PALETTE.length];
  const matchingDocs = Array.from(nodesMap.values()).filter(d => (d.tags || []).includes(tag));
  return {
    id: `tagbranch:${tag}`,
    docId: matchingDocs[0]?.id || 'index.md',
    label: `#${tag}`,
    subtitle: `${count} linked note${count === 1 ? '' : 's'}`,
    sublabel: 'branch',
    description: `All concepts and notes tagged with #${tag}`,
    tags: [tag],
    color,
    collapsed: idx >= 4,
    children: matchingDocs.map(d => docToTreeNode(d, color, true, `t:${tag}:`))
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
  color: '#BB9AF7',
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
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Second Brain — Developer Docs, Mind Map & Search</title>
<style>
  :root {
    --bg-primary: #16161e;
    --bg-secondary: #1a1b26;
    --bg-tertiary: #24283b;
    --bg-code: #13141c;
    --border: #292e42;
    --border-subtle: #1f2335;
    --text-primary: #c0caf5;
    --text-bright: #f7f8fa;
    --text-secondary: #9aa5ce;
    --text-muted: #565f89;
    --accent: #7aa2f7;
    --accent-subtle: rgba(122, 162, 247, 0.15);
    --tag-bg: rgba(187, 154, 247, 0.14);
    --tag-text: #bb9af7;
    --tag-border: rgba(187, 154, 247, 0.32);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg-primary);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
    height: 100vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Top Header */
  header {
    height: 54px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 18px;
    flex-shrink: 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 15px;
    color: var(--text-bright);
    cursor: pointer;
  }
  .brand-badge {
    font-size: 11px;
    background: var(--accent-subtle);
    color: var(--accent);
    border: 1px solid rgba(122, 162, 247, 0.35);
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 500;
  }
  .header-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .btn {
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid var(--border);
    padding: 6px 11px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.15s;
  }
  .btn:hover {
    color: var(--text-bright);
    border-color: #414868;
  }
  .btn.active {
    border-color: var(--accent);
    background: var(--accent-subtle);
    color: var(--accent);
  }

  .workspace {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  /* Left Navigation Sidebar */
  aside.sidebar {
    width: 290px;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
  }
  .search-trigger-wrap {
    padding: 12px 12px 8px;
  }
  .search-trigger {
    width: 100%;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    color: var(--text-secondary);
    padding: 8px 11px;
    border-radius: 8px;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: 0.15s;
  }
  .search-trigger:hover {
    border-color: var(--accent);
    color: var(--text-bright);
  }
  .search-kbd {
    font-size: 11px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    padding: 1px 6px;
    border-radius: 4px;
    color: var(--text-secondary);
  }

  .sidebar-tags {
    padding: 4px 12px 10px;
    border-bottom: 1px solid var(--border-subtle);
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .tag-chip {
    font-size: 11px;
    padding: 2px 7px;
    border-radius: 999px;
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    border: 1px solid transparent;
    cursor: pointer;
    transition: 0.15s;
    user-select: none;
  }
  .tag-chip:hover {
    color: var(--text-bright);
    border-color: var(--border);
  }
  .tag-chip.active {
    background: var(--tag-bg);
    color: var(--tag-text);
    border-color: var(--tag-border);
    font-weight: 500;
  }

  .nav-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px 10px 24px;
  }
  .nav-folder { margin-bottom: 8px; }
  .nav-folder-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    color: var(--text-bright);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .nav-folder-header:hover { background: rgba(255, 255, 255, 0.04); }
  .folder-left { display: flex; align-items: center; gap: 7px; }
  .folder-chevron {
    font-size: 10px;
    color: var(--text-muted);
    transition: transform 0.15s ease;
    display: inline-block;
    width: 12px;
    text-align: center;
  }
  .nav-folder.collapsed .folder-chevron { transform: rotate(-90deg); }
  .folder-count {
    font-size: 10.5px;
    color: var(--text-secondary);
    background: var(--bg-tertiary);
    padding: 1px 6px;
    border-radius: 999px;
    font-weight: 500;
  }
  .nav-folder-items {
    margin-top: 3px;
    margin-left: 13px;
    padding-left: 10px;
    border-left: 1px solid var(--border);
  }
  .nav-folder.collapsed .nav-folder-items { display: none; }
  .nav-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 7px 10px;
    border-radius: 6px;
    cursor: pointer;
    user-select: none;
    margin-bottom: 3px;
    position: relative;
    transition: 0.12s;
  }
  .nav-item-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nav-item-sub {
    font-size: 11px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nav-item:hover { background: rgba(255, 255, 255, 0.04); }
  .nav-item:hover .nav-item-title { color: var(--text-bright); }
  .nav-item.active {
    background: var(--accent-subtle);
  }
  .nav-item.active .nav-item-title {
    color: var(--accent);
    font-weight: 600;
  }
  .nav-item.active .nav-item-sub {
    color: rgba(122, 162, 247, 0.8);
  }
  .nav-item.active::before {
    content: "";
    position: absolute;
    left: -11px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    background: var(--accent);
    border-radius: 2px;
  }
  .nav-subitems {
    margin: 2px 0 6px 12px;
    padding-left: 10px;
    border-left: 1px solid var(--border);
  }
  .nav-subitem {
    font-size: 11.5px;
    color: var(--text-muted);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .nav-subitem:hover {
    color: var(--accent);
    background: rgba(122, 162, 247, 0.08);
  }
  .nav-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* Center Document Reader */
  main.doc-pane {
    flex: 1;
    overflow-y: auto;
    padding: 36px 48px 64px;
    min-width: 0;
    scroll-behavior: smooth;
  }
  .doc-layout {
    display: flex;
    gap: 36px;
    max-width: 1040px;
    margin: 0 auto;
    align-items: flex-start;
  }
  .doc-inner {
    flex: 1;
    min-width: 0;
    max-width: 760px;
  }
  .doc-toc {
    width: 210px;
    position: sticky;
    top: 0;
    flex-shrink: 0;
    border-left: 1px solid var(--border);
    padding-left: 16px;
    display: none;
  }
  @media (min-width: 1280px) {
    .doc-toc.visible { display: block; }
  }
  .toc-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }
  .toc-link {
    display: block;
    font-size: 12.5px;
    color: var(--text-secondary);
    text-decoration: none;
    padding: 4px 0;
    line-height: 1.35;
    cursor: pointer;
  }
  .toc-link:hover { color: var(--accent); }
  .toc-link.toc-h3 { padding-left: 12px; font-size: 12px; }

  /* Document Hero Banner */
  .doc-hero {
    margin-bottom: 26px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .doc-meta-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    font-size: 12px;
    color: var(--text-secondary);
  }
  .type-pill {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
  }
  .doc-tag-pill {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 999px;
    background: var(--tag-bg);
    color: var(--tag-text);
    border: 1px solid var(--tag-border);
    cursor: pointer;
  }
  .doc-tag-pill:hover { background: rgba(187, 154, 247, 0.25); }
  .doc-path {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    color: var(--text-muted);
  }
  .doc-hero-title {
    font-size: 30px;
    font-weight: 700;
    color: var(--text-bright);
    line-height: 1.25;
    margin-bottom: 6px;
  }
  .doc-hero-subtitle {
    font-size: 16px;
    font-weight: 500;
    color: var(--accent);
    margin-bottom: 12px;
  }
  .doc-desc {
    background: rgba(26, 27, 38, 0.85);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    color: var(--text-secondary);
    font-size: 13.5px;
    line-height: 1.55;
  }

  /* Rich Developer Docs Markdown Styling */
  .md-body {
    line-height: 1.72;
    font-size: 15px;
    color: var(--text-primary);
  }
  .md-body h1 { display: none; } /* Rendered in Hero Header */
  .md-body h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-bright);
    margin: 30px 0 12px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
    scroll-margin-top: 20px;
  }
  .md-body h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-bright);
    margin: 22px 0 10px;
    scroll-margin-top: 20px;
  }
  .md-body p { margin-bottom: 14px; }
  .md-body strong { color: var(--text-bright); font-weight: 600; }
  .md-body ul, .md-body ol { margin: 0 0 16px 24px; }
  .md-body li { margin-bottom: 6px; }
  .md-body li > ul, .md-body li > ol { margin-top: 6px; margin-bottom: 8px; }
  .md-body code {
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 13px;
    background: var(--bg-tertiary);
    color: #7dcfff;
    padding: 2px 6px;
    border-radius: 4px;
  }
  .md-body kbd {
    display: inline-block;
    padding: 2px 6px;
    font-size: 11.5px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    line-height: 1.2;
    color: var(--text-bright);
    background-color: var(--bg-tertiary);
    border: 1px solid #414868;
    border-bottom-width: 2px;
    border-radius: 4px;
  }

  /* Tokyo Night Storm Code Blocks & Syntax Highlighting */
  .code-block-wrap {
    position: relative;
    background: var(--bg-code);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 18px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
  }
  .code-block-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    background: #1a1b26;
    border-bottom: 1px solid var(--border);
    font-size: 11.5px;
    font-family: ui-monospace, SFMono-Regular, monospace;
    color: var(--text-secondary);
  }
  .code-window-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .window-dots {
    display: flex;
    gap: 6px;
  }
  .w-dot { width: 10px; height: 10px; border-radius: 50%; }
  .lang-badge {
    text-transform: uppercase;
    font-weight: 600;
    font-size: 10.5px;
    letter-spacing: 0.06em;
    color: #7aa2f7;
    background: rgba(122, 162, 247, 0.12);
    padding: 2px 7px;
    border-radius: 4px;
  }
  .copy-btn {
    background: var(--bg-tertiary);
    color: var(--text-primary);
    border: 1px solid #414868;
    border-radius: 5px;
    padding: 3px 10px;
    font-size: 11px;
    font-weight: 500;
    cursor: pointer;
    transition: 0.15s;
  }
  .copy-btn:hover { border-color: var(--accent); color: var(--text-bright); background: var(--accent-subtle); }
  .code-table {
    width: 100%;
    border-collapse: collapse;
    font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px;
    line-height: 1.6;
  }
  .code-ln {
    width: 40px;
    text-align: right;
    padding: 0 12px 0 10px;
    color: #3b4261;
    user-select: none;
    vertical-align: top;
    border-right: 1px solid #1f2335;
  }
  .code-line {
    padding: 0 16px;
    white-space: pre;
    color: #c0caf5;
  }
  .code-scroll {
    padding: 12px 0;
    overflow-x: auto;
  }

  /* Tokyo Night Storm Syntax Token Colors */
  .tok-com { color: #565f89; font-style: italic; }
  .tok-str { color: #9ece6a; }
  .tok-key { color: #7dcfff; }
  .tok-kw  { color: #bb9af7; font-weight: 500; }
  .tok-cmd { color: #7aa2f7; font-weight: 500; }
  .tok-num { color: #ff9e64; }
  .tok-var { color: #e0af68; }

  .md-body hr { border: none; border-top: 1px solid var(--border); margin: 26px 0; }
  .md-body table.md-table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 14px; }
  .md-body table.md-table th, .md-body table.md-table td { border: 1px solid var(--border); padding: 8px 12px; text-align: left; }
  .md-body table.md-table th { background: var(--bg-secondary); color: var(--text-bright); font-weight: 600; }
  .md-body table.md-table tr:nth-child(even) td { background: rgba(26, 27, 38, 0.5); }
  .color-swatch {
    display: inline-block;
    width: 11px;
    height: 11px;
    border-radius: 3px;
    border: 1px solid rgba(255,255,255,0.25);
    vertical-align: middle;
    margin-right: 5px;
  }
  .md-body a.internal-link {
    color: var(--accent);
    text-decoration: none;
    background: var(--accent-subtle);
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 500;
    transition: 0.15s;
  }
  .md-body a.internal-link:hover {
    background: rgba(122, 162, 247, 0.28);
    text-decoration: underline;
  }
  .md-body a.external-link { color: var(--accent); }

  .backlinks-box {
    margin-top: 44px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }
  .backlinks-title {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-secondary);
    margin-bottom: 10px;
  }
  .backlink-cards { display: flex; flex-wrap: wrap; gap: 8px; }
  .backlink-card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 8px 12px;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: 0.15s;
  }
  .backlink-card:hover { border-color: var(--accent); color: var(--accent); }

  /* Right Visualizer Panel */
  aside.viz-pane {
    width: 560px;
    background: radial-gradient(circle at center, #1a1b26 0%, #101016 100%);
    border-left: 1px solid var(--border);
    position: relative;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    overflow: hidden;
  }
  aside.viz-pane.expanded { flex: 1; width: auto; border-left: none; }
  aside.viz-pane.hidden { display: none; }
  .viz-toolbar {
    position: absolute;
    top: 14px;
    left: 14px;
    right: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
    z-index: 5;
    gap: 8px;
  }
  .viz-hint {
    background: rgba(26, 27, 38, 0.92);
    border: 1px solid var(--border);
    padding: 6px 11px;
    border-radius: 6px;
    font-size: 11.5px;
    color: var(--text-secondary);
    backdrop-filter: blur(8px);
  }
  .viz-controls { display: flex; gap: 5px; pointer-events: auto; flex-wrap: wrap; }
  canvas#viz-canvas { width: 100%; height: 100%; display: block; cursor: grab; }
  canvas#viz-canvas:active { cursor: grabbing; }

  /* Rich Floating Concept Tooltip */
  .node-tooltip {
    position: absolute;
    pointer-events: none;
    display: none;
    width: 300px;
    background: rgba(22, 22, 30, 0.96);
    border: 1px solid #414868;
    border-radius: 10px;
    padding: 12px 14px;
    z-index: 30;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(10px);
  }
  .nt-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 2px 6px;
    border-radius: 4px;
    margin-bottom: 6px;
    background: rgba(122, 162, 247, 0.15);
  }
  .nt-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-bright);
    margin-bottom: 2px;
  }
  .nt-sub {
    font-size: 12px;
    font-weight: 500;
    color: #7dcfff;
    margin-bottom: 8px;
  }
  .nt-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.45;
    margin-bottom: 8px;
  }
  .nt-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .nt-tag {
    font-size: 10.5px;
    background: var(--tag-bg);
    color: var(--tag-text);
    padding: 1px 6px;
    border-radius: 999px;
  }

  /* Cmd+K Spotlight Search Modal */
  .search-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(10, 11, 16, 0.76);
    backdrop-filter: blur(6px);
    z-index: 100;
    display: none;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
  }
  .search-modal-backdrop.open { display: flex; }
  .search-modal {
    width: 660px;
    max-width: 92vw;
    max-height: 76vh;
    background: var(--bg-secondary);
    border: 1px solid #414868;
    border-radius: 12px;
    box-shadow: 0 22px 60px rgba(0, 0, 0, 0.65);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .search-modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }
  .search-modal-header input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--text-bright);
    font-size: 16px;
    outline: none;
  }
  .search-modal-results { flex: 1; overflow-y: auto; padding: 10px; }
  .search-result-item {
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    margin-bottom: 4px;
    border: 1px solid transparent;
  }
  .search-result-item:hover, .search-result-item.selected {
    background: var(--accent-subtle);
    border-color: rgba(122, 162, 247, 0.35);
  }
  .sr-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
  .sr-breadcrumb { font-size: 13.5px; font-weight: 600; color: var(--text-bright); }
  .sr-breadcrumb span.sr-sec { color: var(--accent); font-weight: 500; }
  .sr-snippet { font-size: 12.5px; color: var(--text-secondary); line-height: 1.45; }
  .sr-snippet mark, .sr-breadcrumb mark {
    background: rgba(224, 175, 104, 0.3);
    color: #e0af68;
    padding: 0 3px;
    border-radius: 3px;
  }
  .search-modal-footer {
    padding: 8px 16px;
    border-top: 1px solid var(--border);
    background: var(--bg-primary);
    font-size: 11.5px;
    color: var(--text-muted);
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>

<header>
  <div class="brand" onclick="openDoc('index.md')">
    <span>🧠 Second Brain</span>
    <span class="brand-badge">OKF v0.2 Developer Docs</span>
  </div>
  <div class="header-actions">
    <button class="btn" onclick="openSearchModal()">🔍 Search <span class="search-kbd">⌘K</span></button>
    <button class="btn active" id="btn-split-mm" onclick="setMode('split', 'mindmap')">📖 Docs + 🗺️ Mind Map</button>
    <button class="btn" id="btn-split-graph" onclick="setMode('split', 'graph')">📖 Docs + 🕸️ Network Graph</button>
    <button class="btn" id="btn-full-mm" onclick="setMode('full', 'mindmap')">🗺️ Full Mind Map</button>
    <button class="btn" id="btn-full-graph" onclick="setMode('full', 'graph')">🕸️ Full Graph</button>
    <button class="btn" id="btn-docsonly" onclick="setMode('hidden', vizType)">📄 Docs Only</button>
  </div>
</header>

<div class="workspace">
  <aside class="sidebar">
    <div class="search-trigger-wrap">
      <button class="search-trigger" onclick="openSearchModal()">
        <span>🔍 Search docs, headings, tags...</span>
        <span class="search-kbd">⌘K</span>
      </button>
    </div>
    <div class="sidebar-tags" id="sidebar-tags"></div>
    <div class="nav-list" id="nav-list"></div>
  </aside>

  <main class="doc-pane" id="doc-pane">
    <div class="doc-layout">
      <div class="doc-inner">
        <div class="doc-hero">
          <div class="doc-meta-bar">
            <span class="type-pill" id="doc-type"></span>
            <span class="doc-path" id="doc-path"></span>
            <span id="doc-updated"></span>
            <div id="doc-tags" style="display:flex;gap:5px;flex-wrap:wrap"></div>
          </div>
          <h1 class="doc-hero-title" id="doc-hero-title"></h1>
          <div class="doc-hero-subtitle" id="doc-hero-subtitle"></div>
          <div class="doc-desc" id="doc-desc" style="display:none"></div>
        </div>
        <article class="md-body" id="doc-body"></article>
        <section class="backlinks-box" id="backlinks-box">
          <div class="backlinks-title">Linked From (Backlinks)</div>
          <div class="backlink-cards" id="backlink-cards"></div>
        </section>
      </div>
      <nav class="doc-toc" id="doc-toc">
        <div class="toc-title">On This Page</div>
        <div id="toc-links"></div>
      </nav>
    </div>
  </main>

  <aside class="viz-pane" id="viz-pane">
    <div class="viz-toolbar">
      <div class="viz-hint" id="viz-hint">Hover for details &bull; Click card to open &bull; Click <b>+/-</b> to expand</div>
      <div class="viz-controls">
        <button class="btn active" id="btn-tree-folder" onclick="setTreeGrouping('folder')">By Folder</button>
        <button class="btn" id="btn-tree-tag" onclick="setTreeGrouping('tag')">By #Tag</button>
        <button class="btn" onclick="expandAll(true)">Expand All</button>
        <button class="btn" onclick="expandAll(false)">Collapse</button>
        <button class="btn" onclick="fitView()">Fit</button>
      </div>
    </div>
    <div class="node-tooltip" id="node-tooltip">
      <span class="nt-badge" id="nt-badge"></span>
      <div class="nt-title" id="nt-title"></div>
      <div class="nt-sub" id="nt-sub"></div>
      <div class="nt-desc" id="nt-desc"></div>
      <div class="nt-tags" id="nt-tags"></div>
    </div>
    <canvas id="viz-canvas"></canvas>
  </aside>
</div>

<!-- Cmd+K Spotlight Search Modal -->
<div class="search-modal-backdrop" id="search-backdrop" onclick="if(event.target===this)closeSearchModal()">
  <div class="search-modal">
    <div class="search-modal-header">
      <span>🔍</span>
      <input type="text" id="spotlight-input" placeholder="Search titles, #tags, ## sections, or code commands..." oninput="runSpotlightSearch()" />
      <span class="search-kbd" onclick="closeSearchModal()" style="cursor:pointer">ESC</span>
    </div>
    <div class="search-modal-results" id="spotlight-results"></div>
    <div class="search-modal-footer">
      <span><b>↑↓</b> to navigate &bull; <b>↵ Enter</b> to open section &bull; <b>#tag</b> to filter by tag</span>
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
const collapsedSidebarFolders = new Set();
const codeStore = [];

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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/* Tokyo Night Storm Syntax Highlighter */
function highlightLine(rawLine, lang) {
  const trimmed = rawLine.trim();
  if ((lang === 'bash' || lang === 'sh' || lang === 'yaml' || lang === 'py' || lang === 'python') && trimmed.startsWith('#')) {
    return \`<span class="tok-com">\${escapeHtml(rawLine)}</span>\`;
  }
  if (lang === 'json' && trimmed.startsWith('//')) {
    return \`<span class="tok-com">\${escapeHtml(rawLine)}</span>\`;
  }

  const tokens = [];
  function stash(htmlSpan) {
    tokens.push(htmlSpan);
    return \`@@TOK_\${tokens.length - 1}@@\`;
  }

  let work = escapeHtml(rawLine);

  // JSON key: "key":
  if (lang === 'json') {
    work = work.replace(/"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"(\\s*:)/g, (_, k, colon) =>
      stash(\`<span class="tok-key">"\${k}"</span>\`) + colon
    );
  }

  // Strings "..." or '...'
  work = work.replace(/("[^"\\\\]*(?:\\\\.[^"\\\\]*)*"|'[^'\\\\]*(?:\\\\.[^'\\\\]*)*')/g, m =>
    stash(\`<span class="tok-str">\${m}</span>\`)
  );

  // Inline comments (# ...)
  if (lang === 'bash' || lang === 'sh' || lang === 'yaml') {
    work = work.replace(/(\\s+#.*)$/g, m => stash(\`<span class="tok-com">\${m}</span>\`));
  }

  // Shell variables $VAR or \${VAR}
  work = work.replace(/(\\\$[A-Za-z_][A-Za-z0-9_]*|\\\$\{[^}]+\})/g, m =>
    stash(\`<span class="tok-var">\${m}</span>\`)
  );

  // CLI flags --flag or -x
  if (lang === 'bash' || lang === 'sh') {
    work = work.replace(/(\\s)(--?[A-Za-z0-9_-]+)/g, (_, sp, fl) =>
      sp + stash(\`<span class="tok-key">\${fl}</span>\`)
    );
  }

  // Language keywords & CLI commands
  work = work.replace(/\\b(import|from|def|return|if|else|elif|for|in|while|true|false|null|const|let|var|function|async|await)\\b/g, m =>
    stash(\`<span class="tok-kw">\${m}</span>\`)
  );
  work = work.replace(/\\b(python3|node|npm|git|code|agy|sudo|xattr|defaults|plutil|killall|open|mkdir|rm|cp|cat|echo|export|pip)\\b/g, m =>
    stash(\`<span class="tok-cmd">\${m}</span>\`)
  );

  // Numbers
  work = work.replace(/\\b(\\d+(?:\\.\\d+)?)\\b/g, m =>
    stash(\`<span class="tok-num">\${m}</span>\`)
  );

  return work.replace(/@@TOK_(\\d+)@@/g, (_, idx) => tokens[Number(idx)]);
}

function renderCodeBlock(rawCode, lang, idx) {
  const cleanLang = (lang || 'text').toLowerCase();
  const lines = rawCode.split('\\n');
  const rowsHtml = lines.map((line, i) => \`
    <tr>
      <td class="code-ln">\${i + 1}</td>
      <td class="code-line">\${highlightLine(line, cleanLang) || ' '}</td>
    </tr>
  \`).join('');

  return \`
    <div class="code-block-wrap">
      <div class="code-block-header">
        <div class="code-window-left">
          <div class="window-dots">
            <span class="w-dot" style="background:#f7768e"></span>
            <span class="w-dot" style="background:#e0af68"></span>
            <span class="w-dot" style="background:#9ece6a"></span>
          </div>
          <span class="lang-badge">\${escapeHtml(cleanLang)}</span>
        </div>
        <button class="copy-btn" onclick="copyCode(\${idx}, this)">Copy Code</button>
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
      return \`<a href="\${href}" target="_blank" class="external-link">\${renderedLabel} ↗</a>\`;
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
  const prev = btn.textContent;
  btn.textContent = '✓ Copied!';
  setTimeout(() => { btn.textContent = prev; }, 1400);
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

function toggleTagFilter(tag) {
  activeTagFilter = activeTagFilter === tag ? null : tag;
  renderTagStrip();
  renderSidebar();
}

function renderTagStrip() {
  const el = document.getElementById('sidebar-tags');
  if (!data.tags || !data.tags.length) { el.style.display = 'none'; return; }
  let html = \`<span class="tag-chip \${!activeTagFilter ? 'active' : ''}" onclick="toggleTagFilter(null)">All</span>\`;
  for (const t of data.tags) {
    const active = activeTagFilter === t.name ? 'active' : '';
    html += \`<span class="tag-chip \${active}" onclick="toggleTagFilter('\${t.name}')">#\${escapeHtml(t.name)} <span style="opacity:0.65">\${t.count}</span></span>\`;
  }
  el.innerHTML = html;
}

function toggleSidebarFolder(groupKey) {
  if (collapsedSidebarFolders.has(groupKey)) collapsedSidebarFolders.delete(groupKey);
  else collapsedSidebarFolders.add(groupKey);
  renderSidebar();
}

function renderSidebar() {
  const nav = document.getElementById('nav-list');
  const dynamicFolderGroups = (data.sidebarGroups || []).map(g => ({
    key: 'dir:' + g.dir,
    title: g.title,
    color: g.color,
    filter: n => n.id.startsWith(g.dir + '/')
  }));
  const groups = [
    { key: 'overview', title: 'Workspace Home', color: '#7AA2F7', filter: n => n.id === 'index.md' || n.id === 'inbox.md' },
    ...dynamicFolderGroups,
    { key: 'system', title: 'AI & Governance', color: '#7DCFFF', filter: n => n.id === 'AGENTS.md' || n.id === 'log.md' }
  ];

  let out = '';
  for (const g of groups) {
    const items = data.nodes.filter(n => g.filter(n) && (!activeTagFilter || (n.tags || []).includes(activeTagFilter)));
    if (!items.length) continue;
    const isCollapsed = collapsedSidebarFolders.has(g.key);
    out += \`
      <div class="nav-folder \${isCollapsed ? 'collapsed' : ''}">
        <div class="nav-folder-header" onclick="toggleSidebarFolder('\${g.key}')">
          <div class="folder-left">
            <span class="folder-chevron">▾</span>
            <span class="nav-dot" style="background:\${g.color}"></span>
            <span>\${escapeHtml(g.title)}</span>
          </div>
          <span class="folder-count">\${items.length}</span>
        </div>
        <div class="nav-folder-items">\`;

    for (const item of items) {
      const isActive = item.id === currentDocId;
      out += \`
        <div class="nav-item \${isActive ? 'active' : ''}" title="\${escapeHtml(item.description || item.subtitle)}" onclick="openDoc('\${item.id}')">
          <div class="nav-item-title">\${escapeHtml(item.title)}</div>
          <div class="nav-item-sub">\${escapeHtml(item.subtitle || item.id)}</div>
        </div>\`;
      if (isActive && item.headings && item.headings.length > 0) {
        const h2s = item.headings.filter(h => h.level === 2);
        if (h2s.length > 0) {
          out += \`<div class="nav-subitems">\`;
          for (const h of h2s) {
            out += \`<div class="nav-subitem" onclick="scrollToSection('\${h.slug}')">\${escapeHtml(h.text)}</div>\`;
          }
          out += \`</div>\`;
        }
      }
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

  const typeEl = document.getElementById('doc-type');
  typeEl.textContent = node.type;
  typeEl.style.color = node.color;
  typeEl.style.borderColor = node.color;

  document.getElementById('doc-path').textContent = node.id;
  document.getElementById('doc-updated').textContent = node.updated ? 'Updated ' + node.updated : '';
  document.getElementById('doc-hero-title').textContent = node.title;
  document.getElementById('doc-hero-subtitle').textContent = node.subtitle || '';

  const tagsEl = document.getElementById('doc-tags');
  tagsEl.innerHTML = (node.tags || []).map(t =>
    \`<span class="doc-tag-pill" onclick="toggleTagFilter('\${t}')">#\${escapeHtml(t)}</span>\`
  ).join('');

  const descEl = document.getElementById('doc-desc');
  if (node.description && node.description !== node.subtitle) {
    descEl.style.display = 'block';
    descEl.textContent = node.description;
  } else {
    descEl.style.display = 'none';
  }

  document.getElementById('doc-body').innerHTML = renderMarkdown(node.body, node.id);

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
    blCards.innerHTML = '<span style="font-size:13px;color:var(--text-secondary)">No incoming links yet.</span>';
  }

  renderSidebar();
  if (sectionSlug) {
    setTimeout(() => scrollToSection(sectionSlug), 40);
  } else {
    document.getElementById('doc-pane').scrollTop = 0;
  }
}

/* Cmd+K Spotlight Search Engine */
let spotlightHits = [];
let selectedHitIdx = 0;

function openSearchModal() {
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

  for (const doc of data.nodes) {
    const tagStr = (doc.tags || []).map(t => '#' + t).join(' ');
    if (!q) {
      results.push({
        docId: doc.id,
        sectionSlug: null,
        docTitle: doc.title,
        sectionTitle: doc.subtitle || null,
        snippet: doc.description || doc.id,
        score: doc.id === 'index.md' ? 100 : 50
      });
      continue;
    }

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
    container.innerHTML = '<div style="padding:28px;text-align:center;color:var(--text-muted)">No matching docs, sections, or #tags found.</div>';
    return;
  }
  container.innerHTML = spotlightHits.map((hit, idx) => \`
    <div class="search-result-item \${idx === selectedHitIdx ? 'selected' : ''}" onclick="selectSpotlightHit(\${idx})">
      <div class="sr-top">
        <div class="sr-breadcrumb">
          \${highlightText(hit.docTitle, rawQ)}
          \${hit.sectionTitle ? \` <span class="sr-sec">› \${highlightText(hit.sectionTitle, rawQ)}</span>\` : ''}
        </div>
        <span style="font-size:11px;font-family:monospace;color:var(--text-muted)">\${escapeHtml(hit.docId)}</span>
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

/* Mind Map (2-Line Title + Subheading Cards) & Force Graph Engine */
const vizPane = document.getElementById('viz-pane');
const canvas = document.getElementById('viz-canvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('node-tooltip');
let width = 560, height = 600;
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
  if (vizType !== 'mindmap') setMode(layoutMode, 'mindmap');
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

const LEVEL_X_GAP = 250;
const LEAF_Y_GAP = 62;

function computeTreeLayout(root) {
  visibleNodes = [];
  visibleLinks = [];
  let leafIndex = 0;

  function measure(node, depth) {
    node.depth = depth;
    ctx.font = '600 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const titleW = ctx.measureText(node.label).width;
    ctx.font = '400 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const subW = ctx.measureText(node.subtitle || '').width;
    node.w = Math.min(220, Math.max(135, Math.max(titleW, subW) + 30));
    node.h = node.sublabel === 'section' ? 34 : 46;
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
    maxX = Math.max(maxX, n.x + n.w + 28);
    minY = Math.min(minY, n.y - n.h / 2);
    maxY = Math.max(maxY, n.y + n.h / 2);
  }
  const treeW = Math.max(200, maxX - minX);
  const treeH = Math.max(160, maxY - minY);
  const padX = 70, padY = 105;
  zoom = Math.max(0.5, Math.min(1.2, Math.min((width - padX) / treeW, (height - padY) / treeH)));
  camX = (width - treeW * zoom) / 2 - minX * zoom;
  camY = height / 2 - ((minY + maxY) / 2) * zoom + 14;
}

function expandAll(expand) {
  function walk(node, depth) {
    if (depth >= 1 && node.children && node.children.length > 0) {
      node.collapsed = !expand && depth >= 2;
    }
    if (expand) node.collapsed = false;
    for (const c of node.children || []) walk(c, depth + 1);
  }
  walk(rootTree, 0);
  fitView();
}

function setMode(mode, type) {
  layoutMode = mode;
  vizType = type;

  document.getElementById('btn-split-mm').classList.toggle('active', mode === 'split' && type === 'mindmap');
  document.getElementById('btn-split-graph').classList.toggle('active', mode === 'split' && type === 'graph');
  document.getElementById('btn-full-mm').classList.toggle('active', mode === 'full' && type === 'mindmap');
  document.getElementById('btn-full-graph').classList.toggle('active', mode === 'full' && type === 'graph');
  document.getElementById('btn-docsonly').classList.toggle('active', mode === 'hidden');

  const docPane = document.getElementById('doc-pane');
  vizPane.classList.remove('expanded', 'hidden');
  docPane.style.display = 'block';

  if (mode === 'full') {
    vizPane.classList.add('expanded');
    docPane.style.display = 'none';
  } else if (mode === 'hidden') {
    vizPane.classList.add('hidden');
  }

  document.getElementById('viz-hint').innerHTML = type === 'mindmap'
    ? 'Hover for details &bull; Click card to open &bull; Click <b>+/-</b> to expand'
    : 'Hover for details &bull; Click node to open &bull; Drag nodes';

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

new ResizeObserver(() => { resizeCanvas(); fitView(); }).observe(vizPane);

function screenToWorld(sx, sy) {
  return { x: (sx - camX) / zoom, y: (sy - camY) / zoom };
}

function hitTestMindMap(wx, wy) {
  for (let i = visibleNodes.length - 1; i >= 0; i--) {
    const n = visibleNodes[i];
    const top = n.y - n.h / 2, bottom = n.y + n.h / 2;
    if (n.children && n.children.length > 0) {
      const tx = n.x + n.w + 10, ty = n.y;
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
    const rad = n.id === 'index.md' ? 16 : 12;
    if (Math.hypot(wx - n.gx, wy - n.gy) <= rad + 6) return { node: n, action: 'select' };
  }
  return null;
}

function showTooltip(item, sx, sy) {
  if (!item || !item.node || sx < 0 || sy < 0 || sx > width || sy > height) {
    tooltip.style.display = 'none';
    return;
  }
  const n = item.node;
  tooltip.style.display = 'block';
  tooltip.style.left = Math.min(sx + 18, width - 315) + 'px';
  tooltip.style.top = Math.min(sy + 18, height - 165) + 'px';

  const badge = document.getElementById('nt-badge');
  badge.textContent = n.sublabel || n.type || 'concept';
  badge.style.color = n.color || '#7aa2f7';

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
      if (layoutMode === 'full') setMode('split', 'graph');
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
      } else if (hit.node.docId) {
        openDoc(hit.node.docId, hit.node.sectionSlug || null);
        if (layoutMode === 'full' && hit.node.sublabel !== 'branch') {
          setMode('split', 'mindmap');
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

function drawGrid() {
  const step = 32 * zoom;
  if (step < 14) return;
  ctx.fillStyle = 'rgba(154, 165, 206, 0.11)';
  const ox = ((camX % step) + step) % step;
  const oy = ((camY % step) + step) % step;
  for (let x = ox; x < width; x += step) {
    for (let y = oy; y < height; y += step) {
      ctx.fillRect(x, y, 1.5, 1.5);
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
    ctx.clearRect(0, 0, width, height);
    drawGrid();
    ctx.save();
    ctx.translate(camX, camY);
    ctx.scale(zoom, zoom);

    if (vizType === 'mindmap') {
      computeTreeLayout(rootTree);
      for (const link of visibleLinks) {
        const s = link.source, t = link.target;
        const startX = s.x + s.w + (s.children && s.children.length ? 20 : 0);
        const startY = s.y, endX = t.x, endY = t.y;
        const midX = (startX + endX) / 2;
        const isHighlighted = t.docId === currentDocId && t.sublabel !== 'branch';
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
        ctx.strokeStyle = isHighlighted ? t.color : 'rgba(154, 165, 206, 0.35)';
        ctx.lineWidth = isHighlighted ? 2.4 : 1.6;
        ctx.stroke();
      }
      for (const n of visibleNodes) {
        const isActiveDoc = n.docId === currentDocId && n.sublabel !== 'branch' && n.sublabel !== 'section';
        const isHovered = hoveredItem && hoveredItem.node.id === n.id;
        const top = n.y - n.h / 2;

        // Card Box
        ctx.beginPath();
        ctx.roundRect(n.x, top, n.w, n.h, 8);
        ctx.fillStyle = n.depth === 0 ? '#283457' : (isActiveDoc ? 'rgba(122, 162, 247, 0.2)' : (n.sublabel === 'section' ? 'rgba(26, 27, 38, 0.78)' : '#1a1b26'));
        ctx.fill();

        // Left Accent Bar
        ctx.beginPath();
        ctx.roundRect(n.x, top, 5, n.h, [8, 0, 0, 8]);
        ctx.fillStyle = n.color;
        ctx.fill();

        // Border
        ctx.beginPath();
        ctx.roundRect(n.x, top, n.w, n.h, 8);
        ctx.strokeStyle = (isActiveDoc || isHovered) ? n.color : '#292e42';
        ctx.lineWidth = (isActiveDoc || isHovered) ? 1.8 : 1;
        ctx.stroke();

        if (n.sublabel === 'section') {
          ctx.font = '500 11.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = isHovered ? '#f7f8fa' : '#9aa5ce';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(truncateLabel(n.label, n.w - 22), n.x + 13, n.y);
        } else {
          // 2-Line Card: Main Title + Subheading
          ctx.font = '600 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = '#f7f8fa';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(truncateLabel(n.label, n.w - 22), n.x + 13, top + 15);

          ctx.font = '400 10.5px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = isActiveDoc ? '#7dcfff' : '#565f89';
          ctx.fillText(truncateLabel(n.subtitle || n.sublabel, n.w - 22), n.x + 13, top + 32);
        }

        if (n.children && n.children.length > 0) {
          const tx = n.x + n.w + 10, ty = n.y;
          ctx.beginPath();
          ctx.moveTo(n.x + n.w, ty);
          ctx.lineTo(tx - 8, ty);
          ctx.strokeStyle = 'rgba(154, 165, 206, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(tx, ty, 8.5, 0, Math.PI * 2);
          ctx.fillStyle = n.collapsed ? n.color : '#24283b';
          ctx.fill();
          ctx.strokeStyle = n.color;
          ctx.lineWidth = 1.4;
          ctx.stroke();

          ctx.font = '700 10.5px ui-monospace, SFMono-Regular, monospace';
          ctx.fillStyle = n.collapsed ? '#16161e' : '#f7f8fa';
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
        ctx.strokeStyle = active ? '#7aa2f7' : 'rgba(154, 165, 206, 0.32)';
        ctx.lineWidth = active ? 2.2 : 1.4;
        ctx.stroke();
      }
      for (const n of data.nodes) {
        const isCurrent = n.id === currentDocId;
        const isHover = hoveredItem && hoveredItem.node.id === n.id;
        const rad = n.id === 'index.md' ? 15 : 11;
        if (isCurrent || isHover) {
          ctx.beginPath();
          ctx.arc(n.gx, n.gy, rad + 6, 0, Math.PI * 2);
          ctx.fillStyle = isCurrent ? 'rgba(122, 162, 247, 0.22)' : 'rgba(255, 255, 255, 0.12)';
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(n.gx, n.gy, rad, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#16161e';
        ctx.stroke();

        ctx.font = '600 11.5px -apple-system, BlinkMacSystemFont, sans-serif';
        const tw = ctx.measureText(n.title).width;
        const px = n.gx - tw / 2 - 8, py = n.gy + rad + 8;
        ctx.fillStyle = isCurrent ? 'rgba(40, 52, 87, 0.95)' : 'rgba(26, 27, 38, 0.9)';
        ctx.beginPath();
        ctx.roundRect(px, py, tw + 16, 20, 6);
        ctx.fill();
        ctx.fillStyle = '#f7f8fa';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(n.title, n.gx, py + 10);
      }
    }
    ctx.restore();
  }
  requestAnimationFrame(renderFrame);
}

renderTagStrip();
const initialHash = decodeURIComponent(window.location.hash.slice(1));
openDoc(nodeById.has(initialHash) ? initialHash : 'index.md');
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

console.log(`Built OKF Developer Docs + Mind Map + Tokyo Night Syntax Highlighter at:`);
console.log(`  - ${siteOutPath}`);
console.log(`  - ${tmpOutPath}`);
