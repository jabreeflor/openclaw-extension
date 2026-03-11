# OpenClaw Chrome Extension

A Chrome extension (Manifest V3) that gives you instant access to OpenClaw from any tab.

---

## Features

- **🖱️ Toolbar button** — click to toggle the OpenClaw side panel
- **⌨️ Keyboard shortcut** — `Cmd+Shift+O` (Mac) / `Ctrl+Shift+O` (Windows/Linux)
- **🖱️ Right-click context menu** — select any text → "Ask OpenClaw" → injects text into chat
- **📡 Connection status** — live dot indicator (green = connected, red = offline)
- **↺ Reload button** — refresh the panel without losing your tab
- **⤢ Pop-out button** — open OpenClaw in a full tab

---

## Requirements

- OpenClaw Gateway running on `localhost:3457`
  ```bash
  openclaw gateway start
  ```
- Chrome 114+ (Side Panel API support)

---

## Installation (Developer Mode)

1. Clone or download this repo
2. Open Chrome → `chrome://extensions`
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the `openclaw-extension` folder
6. The OpenClaw icon appears in your toolbar

---

## Usage

### Side Panel
Click the toolbar icon → OpenClaw opens as a side panel alongside your current page.

### Keyboard Shortcut
`Cmd+Shift+O` (Mac) or `Ctrl+Shift+O` — toggles the panel instantly.

Customize at: `chrome://extensions/shortcuts`

### Ask OpenClaw (Context Menu)
1. Select any text on a webpage
2. Right-click → **Ask OpenClaw**
3. The side panel opens with the selected text pre-loaded in the chat input

---

## How It Works

```
manifest.json       — MV3 config, permissions, shortcuts
background.js       — Service worker: context menus, keyboard shortcuts, panel control
sidepanel/
  sidepanel.html    — Panel UI shell
  sidepanel.css     — Dark theme, gold accent
  sidepanel.js      — Health polling, iframe management, message injection
icons/              — 16/32/48/128px icons
```

### Message Injection
When "Ask OpenClaw" is triggered, the selected text is stored in `chrome.storage.session`. The side panel reads it on load and posts it to the OpenClaw iframe via `postMessage`. OpenClaw's web UI listens for `{ type: "OPENCLAW_INJECT_MESSAGE", text }`.

---

## Connection Health

The panel polls `http://localhost:3457` every 10 seconds and shows a status indicator:
- 🟢 Green dot — OpenClaw is reachable
- 🔴 Red dot — OpenClaw is offline (shows error screen with retry button)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Red dot / can't connect | Run `openclaw gateway start` |
| Side panel doesn't open | Chrome 114+ required; check `chrome://extensions` for errors |
| Keyboard shortcut conflicts | Remap at `chrome://extensions/shortcuts` |
| Selected text not injected | OpenClaw web UI must handle `postMessage` from extension |
