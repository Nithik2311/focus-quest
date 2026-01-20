let questActive = false;
let allowedUrls = [];
let focusAppTabId = null;

// Initialize state from storage
const initState = async () => {
    const data = await chrome.storage.local.get(['questActive', 'allowedUrls', 'focusAppTabId']);
    questActive = data.questActive || false;
    allowedUrls = data.allowedUrls || [];
    focusAppTabId = data.focusAppTabId || null;
    console.log("[Focus Extension] State Restored:", { questActive, allowedUrls, focusAppTabId });

    // Re-enable bypass if quest was active before reload
    if (questActive) {
        enableIframeBypass();
    }
};
initState();

// Listen for messages from Content Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'START_QUEST') {
        questActive = true;
        allowedUrls = message.allowedUrls || [];
        // Extract domain from allowed URLs to make matching more robust (case-insensitive)
        allowedUrls = allowedUrls.map(url => {
            try {
                return new URL(url).hostname.toLowerCase();
            } catch (e) {
                return url.toLowerCase();
            }
        });

        focusAppTabId = sender.tab.id;

        // Persist state
        chrome.storage.local.set({ questActive, allowedUrls, focusAppTabId });

        console.log('[Focus Extension] Quest Started. Monitoring...', allowedUrls);
        enableIframeBypass();
        sendResponse({ success: true });
    } else if (message.type === 'STOP_QUEST') {
        questActive = false;
        allowedUrls = [];
        focusAppTabId = null;

        // Clear state
        chrome.storage.local.set({ questActive, allowedUrls, focusAppTabId });

        console.log('[Focus Extension] Quest Stopped.');
        disableIframeBypass();
        sendResponse({ success: true });
    } else if (message.type === 'CHECK_EXTENSION') {
        sendResponse({ success: true, installed: true });
    }
    return true; // Keep channel open for async response
});

// Check URL function
const checkUrl = (tabId, url) => {
    if (!questActive) return;

    // Safety check: If we lost the focusAppTabId but a quest is supposedly active,
    // we should try to find it or stop. But for now, we rely on the ID.
    if (!focusAppTabId) return;

    if (tabId === focusAppTabId) return; // Ignore the app itself
    if (!url || url.startsWith('chrome://') || url.startsWith('edge://') || url.startsWith('about:')) return;

    try {
        const urlObj = new URL(url);
        const hostname = urlObj.hostname;

        // Skip extension-related pages
        if (urlObj.protocol === 'chrome-extension:') return;

        // Check against allowed domains
        const isAllowed = allowedUrls.some(allowed => {
            const cleanAllowed = allowed.toLowerCase().trim();
            const cleanHostname = hostname.toLowerCase().trim();
            return cleanHostname.includes(cleanAllowed) || cleanAllowed.includes(cleanHostname);
        });

        if (!isAllowed) {
            console.log(`[Focus Extension] VIOLATION: ${hostname} is not allowed.`);
            // Report Violation to the Focus App
            chrome.tabs.sendMessage(focusAppTabId, {
                type: 'QUEST_VIOLATION',
                url: hostname
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.warn("[Focus Extension] Failed to send message to app tab. Was it closed?", chrome.runtime.lastError);
                }
            });
        }
    } catch (e) {
        console.error("[Focus Extension] URL Check Error:", e);
    }
};

// Listen for tab activation (switching tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    await initState(); // Ensure state is fresh
    if (!questActive) return;
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab.url) checkUrl(activeInfo.tabId, tab.url);
    } catch (e) {
        // Tab might be inaccessible
    }
});

// Listen for tab updates (navigating within a tab)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url) {
        await initState(); // Ensure state is fresh
        if (!questActive) return;
        checkUrl(tabId, changeInfo.url);
    }
});

// --- IFRAME BYPASS LOGIC ---

const enableIframeBypass = () => {
    if (!chrome.declarativeNetRequest) {
        console.error("[Focus Extension] Critical Error: declarativeNetRequest API is not available. Please ensure the extension is reloaded and permissions are accepted.");
        return;
    }
    
    const rules = [
        {
            id: 1,
            priority: 1,
            action: {
                type: 'modifyHeaders',
                responseHeaders: [
                    { header: 'X-Frame-Options', operation: 'remove' },
                    { header: 'x-frame-options', operation: 'remove' },
                    { header: 'Frame-Options', operation: 'remove' },
                    { header: 'Content-Security-Policy', operation: 'remove' },
                    { header: 'content-security-policy', operation: 'remove' },
                    { header: 'X-Content-Security-Policy', operation: 'remove' }
                ]
            },
            condition: {
                resourceTypes: ['sub_frame']
            }
        }
    ];

    try {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1],
            addRules: rules
        });
        console.log("Iframe Bypass Enabled");
    } catch (err) {
        console.error("Failed to update dynamic rules:", err);
    }
};

const disableIframeBypass = () => {
    if (!chrome.declarativeNetRequest) return;
    
    try {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [1]
        });
        console.log("Iframe Bypass Disabled");
    } catch (err) {
        console.error("Failed to disable dynamic rules:", err);
    }
};
