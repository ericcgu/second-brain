---
type: playbook
title: "Deploy the Docs Site"
subtitle: "From git push to a live GitHub Pages site"
description: "How a push to main becomes the live GitHub Pages site, how to check a deploy, and how to fix the common failures."
tags: [runbook, deploy, github-pages]
updated: 2026-11-08
---

# Deploy the Docs Site

Every push to `main` runs the [deploy workflow](../.github/workflows/deploy.yml). It validates the notes, builds `site/`, and publishes it to GitHub Pages.

## Normal deploy

```bash
git add -A
git commit -m "docs: describe the change"
git push origin main
```

Check the result:

```bash
gh run list --limit 3
gh run view --log-failed   # only if the latest run failed
```

The site updates about 30 seconds after the run turns green.

## Fix: "Get Pages site failed ... Not Found"

**Symptom:** the `Setup Pages` step fails with `HttpError: Not Found`.

**Cause:** GitHub Pages is not enabled for the repository yet, so there is no site to deploy to.

**Fix:** enable Pages with GitHub Actions as the source, then re-run:

```bash
gh api --method POST /repos/<owner>/<repo>/pages -f build_type=workflow
gh run rerun <run-id>
```

Or in the browser: **Settings → Pages → Source: GitHub Actions**.

## Fix: validation failed

**Symptom:** the `Validate OKF & Build Site` step fails.

**Cause:** a note is missing frontmatter, or a relative link points to a file that does not exist.

**Fix:** run the validator locally. It prints the file and the problem:

```bash
node scripts/validate-okf.mjs
```

Then follow the [contributor checklist](../onboarding/contributor-checklist.md).

## Related

- [ADR-001: OKF Markdown as our knowledge base](../decisions/adr-001-okf-markdown-knowledge-base.md), which explains why the site is built from plain Markdown.
