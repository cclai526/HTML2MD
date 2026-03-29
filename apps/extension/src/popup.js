import { createConverter } from '@html2md/core';

const convertBtn = document.getElementById('convertBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const output = document.getElementById('output');
const status = document.getElementById('status');

convertBtn.addEventListener('click', async () => {
    status.textContent = 'Converting…';
    output.value = '';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Read charset override from popup
        const charsetOverride = document.getElementById('optCharset').value.trim();

        // 1. Get HTML from the page using on-demand injection
        const injectionResults = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (charset) => {
                // If no charset override, the browser already decoded correctly
                if (!charset) {
                    const mainContent = document.querySelector('article') || document.body;
                    return { html: mainContent.innerHTML, detectedCharset: document.characterSet };
                }
                // With a charset override, return the page URL so we can re-fetch
                return { url: location.href, charset };
            },
            args: [charsetOverride || null]
        });

        const result = injectionResults[0].result;
        let pageHTML;

        if (result.url && result.charset) {
            // Re-fetch the page with the correct charset
            const refetchResults = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: async (url, charset) => {
                    const res = await fetch(url);
                    const buf = await res.arrayBuffer();
                    const decoded = new TextDecoder(charset).decode(buf);
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(decoded, 'text/html');
                    const mainContent = doc.querySelector('article') || doc.body;
                    return mainContent.innerHTML;
                },
                args: [result.url, result.charset]
            });
            pageHTML = refetchResults[0].result;
        } else {
            pageHTML = result.html;
        }

        // 2. Build options from the popup controls
        const options = {
            gfmTables: document.getElementById('optGfm').checked,
        };

        // 3. Run the Core Algorithm
        const converter = createConverter(options);
        const markdown = converter.turndown(pageHTML);

        output.value = markdown;
        copyBtn.disabled = false;
        downloadBtn.disabled = false;
        status.textContent = 'Done!';
    } catch (err) {
        status.textContent = `Error: ${err.message}`;
    }
});

copyBtn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(output.value);
    status.textContent = 'Copied to clipboard!';
});

downloadBtn.addEventListener('click', () => {
    const blob = new Blob([output.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'page.md';
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = 'Downloaded!';
});
