---
type: concept
title: "macOS Terminal TokyoGlass"
subtitle: "Frosted-glass Terminal.app profile (TokyoGlass16_5)"
description: "Step-by-step concept guide and reusable AI prompt to replicate the custom TokyoGlass16_5 frosted-glass macOS Terminal profile on any Mac."
group: "Themes"
tags: [macos, terminal, tokyo-night, glass, ai-prompt]
updated: 2026-11-07
---

# macOS Terminal TokyoGlass Setup (`TokyoGlass16_5`)

This concept documents how the **`TokyoGlass16_5`** macOS `Terminal.app` profile works under the hood, along with a **copy-paste AI prompt** and **step-by-step instructions** to replicate the exact frosted Tokyo Night glass terminal on any Mac.

Related: [VS Code Tokyo Night Storm Glass Setup](./tokyo-night-storm.md) · [Second Brain Index](../index.md)

---

## 1. Concept: How the Frosted Glass Terminal Works

macOS `Terminal.app` stores custom profiles in `~/Library/Preferences/com.apple.Terminal.plist` under the `"Window Settings"` dictionary. Each color and font property is serialized as a binary `NSKeyedArchiver` (`NSColor` / `NSFont`) blob.

The **`TokyoGlass16_5`** aesthetic is built from four pillars:

1. **Frosted Dark Navy Glass Backdrop**
   - **Background RGB**: `0.086, 0.102, 0.157` (`#161A28`)
   - **Background Opacity (Alpha)**: `0.60` (60% opacity / 40% translucency)
   - **Active Window Blur (`BackgroundBlur`)**: `0.65` (65% Gaussian blur via macOS WindowServer)
   - **Inactive Window Blur (`BackgroundBlurInactive`)**: `0.0` (`BackgroundSettingsForInactiveWindows: false`)
2. **Typography & Geometry**
   - **Font**: `SFMonoTerminal-Regular` (`16pt`, antialiased)
   - **Line Height (`FontHeightSpacing`)**: `1.12`
   - **Character Width (`FontWidthSpacing`)**: `1.01`
   - **Window Grid**: `120` columns × `30` rows
3. **Cursor, Text & Selection**
   - **Normal Text (`TextColor`)**: `#D8E0F1` (`0.847, 0.878, 0.945`)
   - **Bold Text (`TextBoldColor`)**: `#F1F6FF` (`0.945, 0.965, 1.000`)
   - **Cursor**: Blinking vertical bar (`CursorType: 2`, `CursorBlink: true`) in Sky Cyan `#7DCFFF` (`0.490, 0.812, 1.000`)
   - **Selection (`SelectionColor`)**: `#374E79` at `0.75` alpha (`0.215, 0.305, 0.475, 0.75`)
   - **Input & Bell**: `useOptionAsMetaKey: true`, `Bell: false`, `VisualBell: false`, `ShowWindowSettingsNameInTitle: false`
4. **16-Color Tokyo Night ANSI Palette**

| ANSI Slot | Hex | Normalized `NSRGB` (`R G B`) |
| :--- | :--- | :--- |
| **Black** (`ANSIBlackColor`) | `#252A3C` | `0.145 0.165 0.235` |
| **Bright Black** (`ANSIBrightBlackColor`) | `#565F7E` | `0.337 0.373 0.494` |
| **Red** (`ANSIRedColor`) | `#F7768E` | `0.969 0.463 0.557` |
| **Bright Red** (`ANSIBrightRedColor`) | `#FF94A8` | `1.000 0.580 0.659` |
| **Green** (`ANSIGreenColor`) | `#9ECE6A` | `0.620 0.808 0.416` |
| **Bright Green** (`ANSIBrightGreenColor`) | `#B3E285` | `0.702 0.886 0.522` |
| **Yellow** (`ANSIYellowColor`) | `#E0AF68` | `0.878 0.686 0.408` |
| **Bright Yellow** (`ANSIBrightYellowColor`) | `#F2CB8A` | `0.949 0.796 0.541` |
| **Blue** (`ANSIBlueColor`) | `#7AA2F7` | `0.478 0.635 0.969` |
| **Bright Blue** (`ANSIBrightBlueColor`) | `#91B9FF` | `0.569 0.725 1.000` |
| **Magenta** (`ANSIMagentaColor`) | `#BB9AF7` | `0.733 0.604 0.969` |
| **Bright Magenta** (`ANSIBrightMagentaColor`) | `#D0B4FF` | `0.816 0.706 1.000` |
| **Cyan** (`ANSICyanColor`) | `#7DCFFF` | `0.490 0.812 1.000` |
| **Bright Cyan** (`ANSIBrightCyanColor`) | `#9BE2FF` | `0.608 0.886 1.000` |
| **White** (`ANSIWhiteColor`) | `#C0CAF5` | `0.753 0.792 0.898` |
| **Bright White** (`ANSIBrightWhiteColor`) | `#F1F6FF` | `0.945 0.965 1.000` |

---

## 2. Copy-Paste AI Prompt (Replicate on Any Mac)

Paste the block below into any terminal AI coding agent on a new Mac to automatically create and activate the `TokyoGlass16_5` profile:

```text
Configure my macOS Terminal.app with a custom profile named "TokyoGlass16_5" and set it as both the Default and Startup Window Settings in ~/Library/Preferences/com.apple.Terminal.plist.

Use these exact specifications:
1. Glass & Window:
   - BackgroundColor: NSRGB "0.086 0.102 0.157 0.6" (#161A28 at 60% opacity)
   - BackgroundBlur: 0.65
   - BackgroundBlurInactive: 0.0
   - BackgroundSettingsForInactiveWindows: false
   - columnCount: 120, rowCount: 30
   - ShowWindowSettingsNameInTitle: false
   - Bell: false, VisualBell: false
   - useOptionAsMetaKey: true
   - DynamicANSIForegroundColors: false
2. Font:
   - Font: SFMonoTerminal-Regular, size 16.0
   - FontAntialias: true
   - FontHeightSpacing: 1.12
   - FontWidthSpacing: 1.01
3. Text, Cursor & Selection:
   - TextColor: NSRGB "0.847 0.878 0.945" (#D8E0F1)
   - TextBoldColor: NSRGB "0.945 0.965 1" (#F1F6FF)
   - CursorColor: NSRGB "0.49 0.812 1" (#7DCFFF)
   - CursorType: 2 (Vertical Bar), CursorBlink: true
   - SelectionColor: NSRGB "0.215 0.305 0.475 0.75" (#374E79 @ 75%)
4. ANSI Palette (NSKeyedArchiver NSColor blobs with NSColorSpace=1):
   - ANSIBlackColor: "0.145 0.165 0.235"
   - ANSIBrightBlackColor: "0.337 0.373 0.494"
   - ANSIRedColor: "0.969 0.463 0.557"
   - ANSIBrightRedColor: "1 0.58 0.659"
   - ANSIGreenColor: "0.62 0.808 0.416"
   - ANSIBrightGreenColor: "0.702 0.886 0.522"
   - ANSIYellowColor: "0.878 0.686 0.408"
   - ANSIBrightYellowColor: "0.949 0.796 0.541"
   - ANSIBlueColor: "0.478 0.635 0.969"
   - ANSIBrightBlueColor: "0.569 0.725 1"
   - ANSIMagentaColor: "0.733 0.604 0.969"
   - ANSIBrightMagentaColor: "0.816 0.706 1"
   - ANSICyanColor: "0.49 0.812 1"
   - ANSIBrightCyanColor: "0.608 0.886 1"
   - ANSIWhiteColor: "0.753 0.792 0.898"
   - ANSIBrightWhiteColor: "0.945 0.965 1"

Write a Python script using plistlib to encode the NSKeyedArchiver NSColor/NSFont objects, inject "TokyoGlass16_5" into ~/Library/Preferences/com.apple.Terminal.plist, set "Default Window Settings" and "Startup Window Settings" to "TokyoGlass16_5", and reload cfprefsd.
```

---

## 3. Step-by-Step Manual / Scripted Replication

### Step 1: Run the Self-Contained Installer Script

On any Mac, run the following Python script in Terminal to generate and activate `TokyoGlass16_5`:

```bash
python3 - <<'EOF'
import os, plistlib, subprocess

plist_path = os.path.expanduser("~/Library/Preferences/com.apple.Terminal.plist")
with open(plist_path, "rb") as f:
    prefs = plistlib.load(f)

def make_nscolor(nsrgb_str):
    archive = {
        "$version": 100000,
        "$archiver": "NSKeyedArchiver",
        "$top": {"root": plistlib.UID(1)},
        "$objects": [
            "$null",
            {
                "NSRGB": nsrgb_str.encode("ascii") + b"\x00",
                "NSColorSpace": 1,
                "$class": plistlib.UID(2),
            },
            {"$classname": "NSColor", "$classes": ["NSColor", "NSObject"]},
        ],
    }
    return plistlib.dumps(archive, fmt=plistlib.FMT_BINARY)

def make_nsfont(name, size):
    archive = {
        "$version": 100000,
        "$archiver": "NSKeyedArchiver",
        "$top": {"root": plistlib.UID(1)},
        "$objects": [
            "$null",
            {
                "NSSize": float(size),
                "NSfFlags": 16,
                "NSName": plistlib.UID(2),
                "$class": plistlib.UID(3),
            },
            name,
            {"$classname": "NSFont", "$classes": ["NSFont", "NSObject"]},
        ],
    }
    return plistlib.dumps(archive, fmt=plistlib.FMT_BINARY)

profile = {
    "name": "TokyoGlass16_5",
    "type": "Window Settings",
    "ProfileCurrentVersion": 2.09,
    "columnCount": 120,
    "rowCount": 30,
    "BackgroundBlur": 0.65,
    "BackgroundBlurInactive": 0.0,
    "BackgroundSettingsForInactiveWindows": False,
    "BackgroundColor": make_nscolor("0.086 0.102 0.157 0.6"),
    "TextColor": make_nscolor("0.847 0.878 0.945"),
    "TextBoldColor": make_nscolor("0.945 0.965 1"),
    "CursorColor": make_nscolor("0.49 0.812 1"),
    "CursorType": 2,
    "CursorBlink": True,
    "SelectionColor": make_nscolor("0.215 0.305 0.475 0.75"),
    "Font": make_nsfont("SFMonoTerminal-Regular", 16.0),
    "FontAntialias": True,
    "FontHeightSpacing": 1.12,
    "FontWidthSpacing": 1.01,
    "Bell": False,
    "VisualBell": False,
    "ShowWindowSettingsNameInTitle": False,
    "DynamicANSIForegroundColors": False,
    "useOptionAsMetaKey": True,
    "ANSIBlackColor": make_nscolor("0.145 0.165 0.235"),
    "ANSIBrightBlackColor": make_nscolor("0.337 0.373 0.494"),
    "ANSIRedColor": make_nscolor("0.969 0.463 0.557"),
    "ANSIBrightRedColor": make_nscolor("1 0.58 0.659"),
    "ANSIGreenColor": make_nscolor("0.62 0.808 0.416"),
    "ANSIBrightGreenColor": make_nscolor("0.702 0.886 0.522"),
    "ANSIYellowColor": make_nscolor("0.878 0.686 0.408"),
    "ANSIBrightYellowColor": make_nscolor("0.949 0.796 0.541"),
    "ANSIBlueColor": make_nscolor("0.478 0.635 0.969"),
    "ANSIBrightBlueColor": make_nscolor("0.569 0.725 1"),
    "ANSIMagentaColor": make_nscolor("0.733 0.604 0.969"),
    "ANSIBrightMagentaColor": make_nscolor("0.816 0.706 1"),
    "ANSICyanColor": make_nscolor("0.49 0.812 1"),
    "ANSIBrightCyanColor": make_nscolor("0.608 0.886 1"),
    "ANSIWhiteColor": make_nscolor("0.753 0.792 0.898"),
    "ANSIBrightWhiteColor": make_nscolor("0.945 0.965 1"),
}

prefs.setdefault("Window Settings", {})["TokyoGlass16_5"] = profile
prefs["Default Window Settings"] = "TokyoGlass16_5"
prefs["Startup Window Settings"] = "TokyoGlass16_5"

with open(plist_path, "wb") as f:
    plistlib.dump(prefs, f, fmt=plistlib.FMT_BINARY)

subprocess.run(["killall", "cfprefsd"], check=False)
print("✅ TokyoGlass16_5 installed and set as default!")
EOF
```

### Step 2: Export or Import as a `.terminal` File (Alternative)

If you want to export the profile as a portable `.terminal` file from an existing Mac:

```bash
plutil -extract "Window Settings.TokyoGlass16_5" xml1 -o ~/Desktop/TokyoGlass16_5.terminal ~/Library/Preferences/com.apple.Terminal.plist
```

On any new Mac, double-click `TokyoGlass16_5.terminal` and click **Shell → Use Settings as Default**.
