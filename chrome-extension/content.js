// Bridge: React <-> Extension

console.log("Focus Quest Companion Content Script Loaded");

// 1. Listen for messages from React App (Web Page)
window.addEventListener('message', (event) => {
    // Basic security check: source must be window
    if (event.source !== window) return;

    if (event.data.type && event.data.source === 'FOCUS_QUEST_APP') {
        // Forward to Background Script
        console.log("Forwarding message to extension:", event.data.payload);
        try {
            chrome.runtime.sendMessage(event.data.payload, (response) => {
                // Determine if we need to send a response back to React? 
                // Usually fire and forget, but logging is good
                if (chrome.runtime.lastError) {
                    console.error("Extension Error:", chrome.runtime.lastError);
                }
            });
        } catch (e) {
            console.error("Failed to contact extension backend:", e);
        }
    }
});

// 2. Listen for messages from Background Script (Extension)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'QUEST_VIOLATION') {
        console.log("Received Violation from Extension:", message.url);
        // Forward to React App via window event
        // We use '*' targetOrigin for localhost, but in prod should be specific
        window.postMessage({
            type: 'QUEST_VIOLATION_DETECTED',
            source: 'FOCUS_QUEST_EXTENSION',
            url: message.url
        }, '*');
    }
});

// 3. Mark the page as having the extension installed using a data attribute
// This avoids "unsafe-inline" CSP violations
document.documentElement.setAttribute('data-focus-quest-extension', 'installed');

// 4. Send a message to the React App
// We do this immediately and also listen for a ping if needed
const notifyApp = () => {
    window.postMessage({ 
        type: 'FOCUS_QUEST_EXTENSION_READY', 
        source: 'FOCUS_QUEST_EXTENSION' 
    }, '*');
};

// Notify on load and also respond to pings
notifyApp();

window.addEventListener('message', (event) => {
    if (event.data.type === 'PING_EXTENSION' && event.data.source === 'FOCUS_QUEST_APP') {
        notifyApp();
    }
});
console.log("Focus Quest extension active");