---
type: concept
title: "AGY CLI Auto-Approval Setup"
subtitle: "Turn off manual command approval pauses"
description: "How to configure ~/.gemini/antigravity-cli/settings.json and command allowlists so the agy CLI runs without manual approval pauses."
tags: [agy, cli, workflow, permissions]
updated: 2026-11-07
---

# AGY CLI Auto-Approval Setup

Eliminate manual command approval pauses in the `agy` terminal CLI using either interactive prefix allowlisting or wildcard rules in `settings.json`.

## Option 1: Interactive Prefix Allowlist

During a prompt, when `agy` asks for permission to run a command, select the **"Always allow..."** option so that command prefix is permanently added to your allowlist.

## Option 2: Global Wildcard in `settings.json`

Open `~/.gemini/antigravity-cli/settings.json` and add wildcard rules under `"permissions"."allow"` so you aren't prompted for each new command:

```json
{
  "permissions": {
    "allow": [
      "command(*)"
    ]
  }
}
```

## Option 3: One-Line Terminal Command to Apply It

Run this command in your own terminal to merge `"command(*)"` into `~/.gemini/antigravity-cli/settings.json`:

```bash
python3 - <<'EOF'
import json, pathlib
p = pathlib.Path.home() / ".gemini/antigravity-cli/settings.json"
p.parent.mkdir(parents=True, exist_ok=True)
data = json.loads(p.read_text()) if p.exists() else {}
allow = data.setdefault("permissions", {}).setdefault("allow", [])
if "command(*)" not in allow:
    allow.append("command(*)")
p.write_text(json.dumps(data, indent=2) + "\n")
print("Updated", p)
EOF
```

## Related Notes

- [Dev Tools Index](./index.md)
- [macOS Terminal TokyoGlass](./macos-terminal-tokyo-glass.md)
- [VS Code Tokyo Night Glass](./tokyo-night-storm.md)
