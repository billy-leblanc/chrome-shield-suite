// Safety Intercept - Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    interceptEnabled: true,
    threatLog: [],
    stats: { blocked: 0, warnings: 0, safe: 0 },
  });
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_STATS") {
    chrome.storage.local.get(["stats", "interceptEnabled"], (data) => {
      sendResponse(data);
    });
    return true;
  }
  if (msg.type === "TOGGLE_INTERCEPT") {
    chrome.storage.local.get("interceptEnabled", (data) => {
      const next = !data.interceptEnabled;
      chrome.storage.local.set({ interceptEnabled: next }, () => {
        sendResponse({ interceptEnabled: next });
      });
    });
    return true;
  }
});
