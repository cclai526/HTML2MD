#!/usr/bin/env node

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

import { createConverter } from '@html2md/core';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const input = process.argv[2];

if (!input) {
    console.error('Usage: html2md <input.html | URL> [--heading-style atx|setext] [--remove ".ads,footer,nav"] [--base-url https://example.com] [--charset big5] [--output file.md]');
    process.exit(1);
}

// Parse CLI flags
const args = process.argv.slice(3);
const options = {};
let outputFlag = null;

for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];
    switch (flag) {
        case '--heading-style':
            options.headingStyle = value;
            break;
        case '--code-block-style':
            options.codeBlockStyle = value;
            break;
        case '--link-style':
            options.linkStyle = value;
            break;
        case '--remove':
            options.removeSelectors = value.split(',').map((s) => s.trim());
            break;
        case '--base-url':
            options.absoluteUrlBase = value;
            break;
        case '--charset':
            options.charset = value;
            break;
        case '--output':
        case '-o':
            outputFlag = value;
            break;
        case '--no-gfm-tables':
            options.gfmTables = false;
            i--; // no value for this flag
            break;
    }
}

// Determine if input is a URL or a local file
const isUrl = /^https?:\/\//i.test(input);

let html;
let defaultOutputPath;

/**
 * Detect charset from HTML bytes by scanning for <meta> charset declarations.
 */
function detectCharset(bytes) {
    // Decode enough of the head as ASCII/latin1 to find the meta tag
    const head = new TextDecoder('latin1').decode(bytes.slice(0, 4096));
    // <meta charset="Big5">
    let m = head.match(/<meta[^>]+charset=["']?([^"';\s>]+)/i);
    if (m) return m[1].trim();
    // <meta http-equiv="Content-Type" content="text/html; charset=Big5">
    m = head.match(/content=["'][^"']*charset=([^"';\s]+)/i);
    if (m) return m[1].trim();
    return null;
}

if (isUrl) {
    console.log(`Fetching ${input}…`);
    const res = await fetch(input);
    if (!res.ok) {
        console.error(`HTTP ${res.status} ${res.statusText}`);
        process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const charset = options.charset || detectCharset(buf) || 'utf-8';
    html = new TextDecoder(charset).decode(buf);
    console.log(`Detected/using charset: ${charset}`);

    // Derive a filename from the URL hostname + pathname
    const urlObj = new URL(input);
    const slug = (urlObj.hostname + urlObj.pathname)
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    defaultOutputPath = path.resolve(`${slug}.md`);

    // Auto-set base URL so relative links resolve correctly
    if (!options.absoluteUrlBase) {
        options.absoluteUrlBase = urlObj.origin;
    }
} else {
    const resolved = path.resolve(input);
    const buf = fs.readFileSync(resolved);
    const charset = options.charset || detectCharset(buf) || 'utf-8';
    html = new TextDecoder(charset).decode(buf);
    console.log(`Detected/using charset: ${charset}`);
    defaultOutputPath = resolved.replace(/\.html?$/i, '.md');
}

// Use jsdom so the core algorithm's DOM-based rules work in Node
const dom = new JSDOM(html);
const { document } = dom.window;

// --- Destroy anti-scraping hidden elements ---
const allElements = document.querySelectorAll('*');
for (const el of allElements) {
    const styleAttr = el.getAttribute('style') || '';
    // Strip all spaces from the style string to catch variations like "display: none;"
    const cleanStyle = styleAttr.replace(/\s/g, '').toLowerCase();

    if (cleanStyle.includes('display:none') || cleanStyle.includes('font-size:0px')) {
        el.remove();
    }
}

// Strip unwanted selectors before conversion
if (options.removeSelectors) {
    for (const sel of options.removeSelectors) {
        for (const el of document.querySelectorAll(sel)) {
            el.remove();
        }
    }
    delete options.removeSelectors; // already handled
}

delete options.charset; // already handled above

const converter = createConverter(options);
const markdown = converter.turndown(document.body.innerHTML);

const outputPath = outputFlag ? path.resolve(outputFlag) : defaultOutputPath;
fs.writeFileSync(outputPath, markdown);
console.log(`Converted to ${outputPath}`);
