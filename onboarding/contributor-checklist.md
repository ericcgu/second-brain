---
type: playbook
title: "Contributor Checklist"
subtitle: "Add a note that passes validation on the first try"
description: "Step-by-step checklist for adding or updating a note so it passes OKF validation, links into the tree, and appears on the site."
tags: [onboarding, workflow, okf]
updated: 2026-11-08
---

# Contributor Checklist

Use this whenever you add or change knowledge, by hand or through an AI agent. An agent following [AGENTS.md](../AGENTS.md) does these steps automatically.

## 1. Pick the right folder

| If the note is... | Put it in | `type` |
|---|---|---|
| How to get started or contribute | `onboarding/` | `playbook` or `note` |
| A step-by-step procedure | `runbooks/` | `playbook` |
| A choice we made and why | `decisions/` | `decision` |
| A definition, spec, or explainer | `reference/` | `reference` or `concept` |
| A local tool or environment setup | `dev-tools/` | `concept` |

Not sure yet? Drop it in [inbox.md](../inbox.md) and file it later.

## 2. Add the frontmatter

```yaml
---
type: playbook
title: "Rotate the API Key"
description: "One sentence that says what this note is for."
tags: [security, oncall]
updated: 2026-11-08
---
```

## 3. Link it into the tree

- Add a line to the folder's `index.md`: `- [Title](./file.md) - one-sentence summary.`
- Link to related notes inside the body, so the graph shows real relationships.

## 4. Validate and preview

```bash
node scripts/validate-okf.mjs
node scripts/export-graph.mjs
open site/index.html
```

## 5. Log and push

Add one line to [log.md](../log.md), then commit and push. The [deploy runbook](../runbooks/deploy-docs-site.md) explains what happens next.
