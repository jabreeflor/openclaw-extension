// sidepanel.js — OpenClaw Side Panel logic

const OPENCLAW_URL = "http://localhost:3457";
const HEALTH_ENDPOINT = `${OPENCLAW_URL}/api/health`;
const CHECK_INTERVAL_MS = 10_000; // check every 10s

const frame = document.getElementById("openclaw-frame");
const errorState = document.getElementById("error-state");
const iframeContainer = document.getElementById("iframe-container");
const statusDot = document.getElementById("status-dot");
const btnRetry = document.getElementById("btn-retry");
const btnReload = document.getElementById("btn-reload");
const btnPopout = document.getElementById("btn-popout");

let isOnline = false;
let healthTimer = null;

// ── Health check ──────────────────────────────────────────────────────────────

async function checkHealth() {
  statusDot.className = "dot checking";
  try {
    const res = await fetch(HEALTH_ENDPOINT, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    setOnline(res.ok || res.status < 500);
  } catch {
    // Fallback: try fetching the root (some setups don't have /api/health)
    try {
      await fetch(OPENCLAW_URL, {
        method: "HEAD",
        signal: AbortSignal.timeout(3000),
        mode: "no-cors", // allows opaque response
      });
      setOnline(true); // if no exception thrown, server is reachable
    } catch {
      setOnline(false);
    }
  }
}

function setOnline(online) {
  isOnline = online;
  statusDot.className = `dot ${online ? "online" : "offline"}`;
  statusDot.title = online ? "Connected" : "OpenClaw not reachable";

  if (online) {
    errorState.classList.add("hidden");
    iframeContainer.classList.remove("hidden");
    // Load iframe if not already loaded
    if (!frame.src || frame.src === "about:blank") {
      frame.src = OPENCLAW_URL;
    }
  } else {
    errorState.classList.remove("hidden");
    iframeContainer.classList.add("hidden");
  }
}

function startHealthPolling() {
  checkHealth();
  if (healthTimer) clearInterval(healthTimer);
  healthTimer = setInterval(checkHealth, CHECK_INTERVAL_MS);
}

// ── Pending message injection ─────────────────────────────────────────────────

async function checkPendingMessage() {
  try {
    const { pendingMessage, pendingMessageTs } = await chrome.storage.session.get([
      "pendingMessage",
      "pendingMessageTs",
    ]);

    // Only inject if message is fresh (< 10 seconds old)
    if (
      pendingMessage &&
      pendingMessageTs &&
      Date.now() - pendingMessageTs < 10_000
    ) {
      // Clear it so we don't inject again on reload
      await chrome.storage.session.remove(["pendingMessage", "pendingMessageTs"]);

      // Wait for iframe to load, then inject
      if (frame.contentWindow) {
        injectMessage(pendingMessage);
      } else {
        frame.addEventListener("load", () => injectMessage(pendingMessage), { once: true });
      }
    }
  } catch (e) {
    console.warn("checkPendingMessage:", e);
  }
}

function injectMessage(text) {
  // Post message to the OpenClaw web app
  // OpenClaw's web UI should listen for this event
  try {
    frame.contentWindow.postMessage(
      { type: "OPENCLAW_INJECT_MESSAGE", text },
      OPENCLAW_URL
    );
  } catch (e) {
    console.warn("Could not inject message (cross-origin?):", e);
  }
}

// ── Button handlers ───────────────────────────────────────────────────────────

btnRetry.addEventListener("click", () => {
  checkHealth();
});

btnReload.addEventListener("click", () => {
  frame.src = OPENCLAW_URL;
  checkHealth();
});

btnPopout.addEventListener("click", () => {
  chrome.tabs.create({ url: OPENCLAW_URL });
});

// ── Init ──────────────────────────────────────────────────────────────────────

startHealthPolling();

// Check for any pending message from context menu
frame.addEventListener("load", checkPendingMessage, { once: true });

// Also poll storage in case panel was already open
checkPendingMessage();
