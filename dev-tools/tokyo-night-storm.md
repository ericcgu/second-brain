---
type: concept
title: "VS Code Tokyo Night Glass"
subtitle: "Vibrancy Continued + Tokyo Night Storm CSS"
description: "Step-by-step concept guide and reusable AI prompt to replicate the Tokyo Night Storm frosted-glass setup in VS Code on any Mac."
group: "Themes"
tags: [macos, vscode, tokyo-night, glass, ai-prompt]
updated: 2026-11-07
---

# VS Code Tokyo Night Storm Glass Setup (`tokyo-night-storm`)

This concept explains how the **Tokyo Night Storm** frosted-glass setup works in VS Code on macOS, why certain vibrancy defaults can look off, and how to replicate the exact setup cleanly on any Mac using either a **copy-paste AI prompt** or **step-by-step commands**.

Related: [macOS Terminal TokyoGlass Setup](./macos-terminal-tokyo-glass.md) · [Second Brain Index](../index.md)

---

## 1. Concept: How VS Code Glass / Vibrancy Works on macOS

Unlike `Terminal.app`, VS Code (an Electron app) uses opaque workbench layers by default. Achieving the **Tokyo Night Storm** glass look requires three layers working together:

1. **Syntax & UI Theme (`enkia.tokyo-night` + `pkief.material-icon-theme`)**
   - Sets `"workbench.colorTheme": "Tokyo Night Storm"` and `"workbench.iconTheme": "material-icon-theme"`.
2. **Native macOS Vibrancy Injection (`illixion.vscode-vibrancy-continued`)**
   - Patches VS Code's Electron `BrowserWindow` (`main.js` and `mainImpl.js`) with `visualEffectState: "active"`, `frame: false`, and `transparent: true`.
   - Calls Electron's `window.setVibrancy("under-window")` so macOS WindowServer blurs everything behind the VS Code window.
   - Injects a root `<style>` tag setting `html { background: rgba(R, G, B, opacity) !important; }` using `"vscode_vibrancy.backgroundOverride"` (`#181F31` or `#161A28`) and `"vscode_vibrancy.opacity"` (`0.42`–`0.60`).
3. **Transparent Surface Layering (`workbench.colorCustomizations` & Terminal DOM Renderer)**
   - Sets `"terminal.integrated.gpuAcceleration": "off"` so the integrated terminal uses the DOM renderer instead of an opaque WebGL canvas.
   - Replaces opaque workbench surfaces (`editorPane.background`, `editorGutter.background`, `panel.background`, `terminal.background`, `tab.activeBackground`) with `#181f3100` (transparent) or translucent tiers (`#181f316b` for sidebar/editor, `#181f31bf` for sticky scroll, `#181f31e6` for floating widgets/menus).

### Common Pitfalls & Why It Can Look Weird Out-of-the-Box

- **Neon Glow on Code Tokens**: The built-in `Tokyo Night Storm.css` inside `illixion.vscode-vibrancy-continued` includes a rule adding a blurry neon glow (`text-shadow: 0 0 8px, 0 0 2px #000;`) to `.mtk4, .mtk9.mtk10, .mtk11, ...`. Removing that rule keeps text crisp like `Terminal.app`.
- **Double-Tinted Panes**: Because `html` already has the base tint, setting `editor.background` to `#181f316b` while `editorGutter.background` is `#181f3100` can make the editor slightly darker than the line-number gutter. Setting `editor.background` to `#181f3100` (with `"vscode_vibrancy.disableColorCustomizations": true`) makes the entire editor and gutter share a single, uniform glass layer.

---

## 2. Copy-Paste AI Prompt (Replicate on Any Mac)

Paste this prompt into `agy` (or any AI coding agent) on a new Mac to install and configure the complete setup automatically:

```text
Set up my VS Code on macOS with the Tokyo Night Storm frosted-glass configuration:

1. Install required VS Code extensions via CLI:
   - enkia.tokyo-night
   - illixion.vscode-vibrancy-continued
   - pkief.material-icon-theme

2. Remove the blurry neon text-shadow rule (.mtk4,.mtk9.mtk10... { text-shadow: 0 0 8px, 0 0 2px #000; }) from ~/.vscode/extensions/illixion.vscode-vibrancy-continued-*/themes/Tokyo Night Storm.css so code tokens stay crisp.

3. Update ~/Library/Application Support/Code/User/settings.json with these theme, vibrancy, editor, and terminal settings (preserving any language-specific settings):
   - "workbench.colorTheme": "Tokyo Night Storm"
   - "workbench.iconTheme": "material-icon-theme"
   - "window.titleBarStyle": "custom"
   - "window.systemColorTheme": "dark"
   - "window.autoDetectColorScheme": false
   - "vscode_vibrancy.theme": "Tokyo Night Storm"
   - "vscode_vibrancy.type": "under-window"
   - "vscode_vibrancy.opacity": 0.42
   - "vscode_vibrancy.backgroundOverride": "#181F31"
   - "vscode_vibrancy.preventFlash": true
   - "editor.fontSize": 16
   - "editor.lineHeight": 24
   - "editor.minimap.enabled": false
   - "editor.cursorBlinking": "smooth"
   - "editor.cursorSmoothCaretAnimation": "on"
   - "editor.smoothScrolling": true
   - "terminal.integrated.fontSize": 16
   - "terminal.integrated.lineHeight": 1.25
   - "terminal.integrated.cursorStyle": "line"
   - "terminal.integrated.cursorBlinking": true
   - "terminal.integrated.gpuAcceleration": "off"
   - "workbench.colorCustomizations" configured for #181f31 vibrancy transparency.

4. Clear macOS quarantine on "/Applications/Visual Studio Code.app" if needed so Vibrancy Continued can patch main.js, then remind me to press Cmd+Shift+P -> "Reload Vibrancy" inside VS Code.
```

---

## 3. Step-by-Step Manual Replication

### Step 1: Install the Extensions

Run in your terminal:

```bash
code --install-extension enkia.tokyo-night
code --install-extension illixion.vscode-vibrancy-continued
code --install-extension pkief.material-icon-theme
```

### Step 2: Remove the Blurry Neon Glow in Vibrancy's Tokyo Night Storm CSS (Optional but Recommended)

Strip the `text-shadow` glow rule from the extension's theme stylesheet before loading Vibrancy:

```bash
python3 - <<'EOF'
import glob, re

for path in glob.glob("/Users/*/.vscode/extensions/illixion.vscode-vibrancy-continued-*/themes/Tokyo Night Storm.css"):
    with open(path, "r") as f:
        css = f.read()
    cleaned = re.sub(r"\.mtk4,\.mtk9\.mtk10[^{]*\{[^}]*\}\s*", "", css)
    with open(path, "w") as f:
        f.write(cleaned)
    print(f"Cleaned neon text-shadow in: {path}")
EOF
```

### Step 3: Apply `settings.json`

Open `~/Library/Application Support/Code/User/settings.json` (<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> → **Preferences: Open User Settings (JSON)**) and include:

```json
{
  "editor.fontSize": 16,
  "editor.lineHeight": 24,
  "editor.minimap.enabled": false,
  "editor.stickyScroll.enabled": true,
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "editor.cursorBlinking": "smooth",
  "editor.cursorSmoothCaretAnimation": "on",
  "editor.smoothScrolling": true,
  "workbench.colorTheme": "Tokyo Night Storm",
  "workbench.iconTheme": "material-icon-theme",
  "window.titleBarStyle": "custom",
  "window.systemColorTheme": "dark",
  "window.autoDetectColorScheme": false,
  "vscode_vibrancy.theme": "Tokyo Night Storm",
  "vscode_vibrancy.type": "under-window",
  "vscode_vibrancy.opacity": 0.42,
  "vscode_vibrancy.backgroundOverride": "#181F31",
  "vscode_vibrancy.preventFlash": true,
  "terminal.integrated.fontSize": 16,
  "terminal.integrated.defaultProfile.osx": "zsh",
  "terminal.integrated.cursorStyle": "line",
  "terminal.integrated.lineHeight": 1.25,
  "terminal.integrated.cursorBlinking": true,
  "terminal.integrated.gpuAcceleration": "off",
  "workbench.colorCustomizations": {
    "terminal.background": "#00000000",
    "editorPane.background": "#181f3100",
    "editorGroupHeader.tabsBackground": "#181f3100",
    "editorGroupHeader.noTabsBackground": "#181f3100",
    "breadcrumb.background": "#181f3100",
    "editorGutter.background": "#181f3100",
    "panel.background": "#181f3100",
    "tab.activeBackground": "#181f3100",
    "tab.unfocusedActiveBackground": "#181f3100",
    "sideBar.background": "#181f316b",
    "sideBarTitle.background": "#181f316b",
    "activityBar.background": "#181f316b",
    "editor.background": "#181f316b",
    "tab.inactiveBackground": "#181f316b",
    "tab.unfocusedInactiveBackground": "#181f316b",
    "editorStickyScroll.background": "#181f31bf",
    "editorStickyScrollGutter.background": "#181f31bf",
    "sideBarStickyScroll.background": "#181f31bf",
    "panelStickyScroll.background": "#181f31bf",
    "terminalStickyScroll.background": "#181f31bf",
    "minimap.background": "#181f31bf",
    "inlineChat.background": "#181f31e6",
    "editorWidget.background": "#181f31e6",
    "editorHoverWidget.background": "#181f31e6",
    "editorSuggestWidget.background": "#181f31e6",
    "notifications.background": "#181f31e6",
    "notificationCenterHeader.background": "#181f31e6",
    "menu.background": "#181f31e6",
    "quickInput.background": "#181f31e6",
    "editor.lineHighlightBorder": "#00000000"
  }
}
```

### Step 4: Activate Vibrancy in VS Code

1. If macOS blocks VS Code from patching itself (`EROFS: read-only file system`), clear App Translocation quarantine first:
   ```bash
   sudo xattr -dr com.apple.quarantine "/Applications/Visual Studio Code.app"
   ```
2. Inside VS Code, press <kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd> (or <kbd>F1</kbd>) → run **`Reload Vibrancy`**.
3. Click **Restart** when prompted.
