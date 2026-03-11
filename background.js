// background.js — OpenClaw Chrome Extension Service Worker
// Manifest V3 — handles context menus, shortcuts, and side panel logic

const OPENCLAW_URL = "http://localhost:3457";

// ── Startup ───────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
  // Enable side panel on all tabs by default
  chrome.sidePanel.setOptions({ enabled: true });
});

// ── Context Menu ──────────────────────────────────────────────────────────────

function setupContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "ask-openclaw",
      title: "Ask OpenClaw",
      contexts: ["selection"],
    });

    chrome.contextMenus.create({
      id: "open-openclaw",
      title: "Open OpenClaw",
      contexts: ["page", "frame"],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "ask-openclaw" && info.selectionText) {
    // Store selected text for side panel to pick up
    await chrome.storage.session.set({
      pendingMessage: info.selectionText.trim(),
      pendingMessageTs: Date.now(),
    });
    // Open side panel
    await openSidePanel(tab);
  } else if (info.menuItemId === "open-openclaw") {
    await openSidePanel(tab);
  }
});

// ── Toolbar Button ────────────────────────────────────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  await toggleSidePanel(tab);
});

// ── Keyboard Shortcut ─────────────────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === "toggle-panel") {
    await toggleSidePanel(tab);
  }
});

// ── Side Panel Helpers ────────────────────────────────────────────────────────

async function openSidePanel(tab) {
  try {
    await chrome.sidePanel.open({ tabId: tab.id });
  } catch (e) {
    console.error("openSidePanel failed:", e);
  }
}

async function toggleSidePanel(tab) {
  try {
    // Check if panel is open by querying options
    const options = await chrome.sidePanel.getOptions({ tabId: tab.id });
    if (options.enabled === false) {
      await chrome.sidePanel.setOptions({ tabId: tab.id, enabled: true });
      await chrome.sidePanel.open({ tabId: tab.id });
    } else {
      // Side Panel API doesn't have a direct "close" — open it (if already open, no-op)
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (e) {
    // Fallback: just open
    await openSidePanel(tab);
  }
}
