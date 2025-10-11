/**
 * ────────────────────────────────────────────────────────────────
 * Time Compass — background.js
 * ────────────────────────────────────────────────────────────────
 *
 * This file defines the background logic for the extension.
 * It separates pure and impure functions for readability and testing,
 * following a Haskell-inspired functional programming style.
 *
 * ────────────────────────────────────────────────────────────────
 *  PURE FUNCTIONS  → do not cause side effects
 *  IMPURE FUNCTIONS → interact with browser APIs
 * ────────────────────────────────────────────────────────────────
 */

/*───────────────────────────────────────────────────────────────*
 * 1. PURE FUNCTION: buildDashboardUrl
 *───────────────────────────────────────────────────────────────*/
/**
 * Return the URL of the dashboard page bundled with the extension.
 * This is a pure computation (no side effects).
 */
const buildDashboardUrl = () => browser.runtime.getURL("dashboard.html");


/*───────────────────────────────────────────────────────────────*
 * 2. IMPURE FUNCTION: openDashboardTab
 *───────────────────────────────────────────────────────────────*/
/**
 * Open a new tab with the dashboard.
 * Impure: performs I/O through the browser API.
 */
const openDashboardTab = async () => {
  const url = buildDashboardUrl();
  await browser.tabs.create({ url });
  console.log(`[Time Compass] Dashboard opened at ${url}`);
};


/*───────────────────────────────────────────────────────────────*
 * 3. PURE FUNCTION: handleInstallReason
 *───────────────────────────────────────────────────────────────*/
/**
 * Decide what to do depending on the installation reason.
 *
 * @param {string} reason     - Why onInstalled triggered
 * @param {boolean} temporary - Whether this is a temporary load
 *
 * Returns:
 *   - "welcome" to show a welcome page (open dashboard for fresh install)
 *   - "upgrade" to show upgrade info
 *   - "temp" if temporary install, but still do open dashboard
 *   - "none" to do nothing
 */
const handleInstallReason = (reason, temporary) => {
  //if (temporary) return "none"; // Skip actions during dev mode
  if (temporary) return "temp"; // now also open dashboard for dev loads
  switch (reason) {
    case "install":
      return "welcome";
    case "update":
      return "upgrade";
    case "browser_update":
      return "none";
    default:
      return "none";
  }
};


/*───────────────────────────────────────────────────────────────*
 * 4. IMPURE FUNCTION: handleInstallEvent
 *───────────────────────────────────────────────────────────────*/
/**
 * Handle the extension installation event.
 * Uses the pure helper to decide the next action.
 */
const handleInstallEvent = async ({ reason, temporary }) => {
  const action = handleInstallReason(reason, temporary);

  //if (action === "welcome") {
    //console.log("[Time Compass] Fresh install detected — opening dashboard...");
  if (action === "welcome" || action === "temp") {
    console.log("[Time Compass] Opening dashboard after install/load...");
    await openDashboardTab();
  } else if (action === "upgrade") {
    console.log("[Time Compass] Extension updated — optionally show changelog.");
    // Example future use:
    // await openChangelogTab();
  } else {
    console.log("[Time Compass] No action for install reason:", reason);
  }
};


/*───────────────────────────────────────────────────────────────*
 * 5. IMPURE FUNCTION: handleToolbarClick
 *───────────────────────────────────────────────────────────────*/
/**
 * Handle clicks on the extension toolbar button.
 */
const handleToolbarClick = async () => {
  await openDashboardTab();
};


/*───────────────────────────────────────────────────────────────*
 * 6. EVENT REGISTRATION (Impure I/O)
 *───────────────────────────────────────────────────────────────*/
/**
 * Register event listeners. This section is impure because
 * it interacts with the browser event system.
 */
browser.runtime.onInstalled.addListener(handleInstallEvent);

// For Firefox, use `browser.action` instead of `browser.browserAction`
if (browser.action) {
  browser.action.onClicked.addListener(handleToolbarClick);
} else if (browser.browserAction) {
  browser.browserAction.onClicked.addListener(handleToolbarClick);
}

console.log("[Time Compass] Background script loaded successfully.");
