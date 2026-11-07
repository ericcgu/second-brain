#!/usr/bin/env node
/**
 * Open Knowledge Format (OKF v0.2) + Foam Bundle Validator
 *
 * Validates:
 * 1. Root `index.md` exists and declares `okf_version` in YAML frontmatter.
 * 2. Nested `index.md` files and `log.md` do NOT declare concept `type:` frontmatter
 *    (nested `index.md` files should have no YAML frontmatter per OKF spec).
 * 3. Every content `.md` file (excluding `.foam/templates/`) starts with YAML frontmatter
 *    containing a non-empty `type:` field.
 * 4. Every relative Markdown link (`[text](./path.md)`) in all `.md` files resolves to an existing file.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORED_DIRS = new Set(['.git', '.vscode', '.foam', 'node_modules', 'scripts', 'site', 'dist']);

let errors = 0;
let warnings = 0;
let checkedFiles = 0;

function parseFrontmatter(content) {
  if (!content.startsWith('---\n') && !content.startsWith('---\r\n')) {
    return null;
  }
  const endIdx = content.indexOf('\n---', 3);
  if (endIdx === -1) return null;
  const raw = content.slice(4, endIdx).trim();
  const data = {};
  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/);
    if (match) {
      data[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return data;
}

function walkMarkdownFiles(dir, fileList = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkMarkdownFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function validateLinks(filePath, content) {
  const relFile = path.relative(ROOT, filePath);
  // Strip fenced code blocks and inline code spans before checking links
  const withoutCode = content
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\r\n]+`/g, '');
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = linkRegex.exec(withoutCode)) !== null) {
    const target = match[2].trim();
    if (
      target.startsWith('http://') ||
      target.startsWith('https://') ||
      target.startsWith('mailto:') ||
      target.startsWith('#')
    ) {
      continue;
    }
    const cleanTarget = target.split('#')[0];
    if (!cleanTarget) continue;
    const resolved = path.resolve(path.dirname(filePath), cleanTarget);
    if (!fs.existsSync(resolved)) {
      console.error(`❌ [${relFile}] Broken relative link: (${target})`);
      errors++;
    }
  }
}

const rootIndex = path.join(ROOT, 'index.md');
if (!fs.existsSync(rootIndex)) {
  console.error('❌ Missing root index.md required by OKF specification.');
  process.exit(1);
}

const files = walkMarkdownFiles(ROOT);

for (const filePath of files) {
  checkedFiles++;
  const relPath = path.relative(ROOT, filePath);
  const baseName = path.basename(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const fm = parseFrontmatter(content);

  if (relPath === 'index.md') {
    if (!fm || !fm.okf_version) {
      console.warn(`⚠️  [${relPath}] Root index.md does not declare 'okf_version' in frontmatter.`);
      warnings++;
    }
    if (fm && fm.type) {
      console.error(`❌ [${relPath}] Reserved file index.md must not declare a concept 'type' field.`);
      errors++;
    }
  } else if (baseName === 'index.md') {
    if (fm !== null) {
      console.error(`❌ [${relPath}] Subfolder index.md must not contain YAML frontmatter per OKF spec.`);
      errors++;
    }
  } else if (relPath === 'log.md') {
    if (fm && fm.type) {
      console.error(`❌ [${relPath}] Reserved file log.md must not declare a concept 'type' field.`);
      errors++;
    }
  } else {
    if (!fm) {
      console.error(`❌ [${relPath}] Content document is missing YAML frontmatter.`);
      errors++;
    } else {
      if (!fm.type) {
        console.error(`❌ [${relPath}] Content document frontmatter is missing required 'type' field.`);
        errors++;
      }
      if (!fm.title) {
        console.warn(`⚠️  [${relPath}] Recommended 'title' field missing in frontmatter.`);
        warnings++;
      }
      if (!fm.description) {
        console.warn(`⚠️  [${relPath}] Recommended 'description' field missing in frontmatter.`);
        warnings++;
      }
    }
  }

  validateLinks(filePath, content);
}

console.log(`✅ Checked ${checkedFiles} Markdown files in OKF + Foam bundle.`);
if (warnings > 0) {
  console.log(`⚠️  ${warnings} warning(s).`);
}
if (errors > 0) {
  console.error(`❌ Validation failed with ${errors} error(s).`);
  process.exit(1);
} else {
  console.log('🎉 All OKF v0.2 frontmatter, reserved files, and graph links are valid!');
}
