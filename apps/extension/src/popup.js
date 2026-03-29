import { createConverter } from '@my-project/core';

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

        // 1. Get HTML from the page
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'getHTML' });

        // 2. Build options from the popup controls
        const options = {
            gfmTables: document.getElementById('optGfm').checked,
        };

        const removeValue = document.getElementById('optRemove').value.trim();
        if (removeValue) {
            options.removeSelectors = removeValue.split(',').map((s) => s.trim());
        }

        // 3. Run the Core Algorithm
        const converter = createConverter(options);
        const markdown = converter.turndown(response.html);

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
