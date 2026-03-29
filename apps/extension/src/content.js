// Content script — injected into every page.
// Listens for a request from the popup and returns page HTML.
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'getHTML') {
        const mainContent = document.querySelector('article') || document.body;
        sendResponse({ html: mainContent.innerHTML });
    }
});
