#!/usr/bin/env node

import { createConverter } from '@my-project/core';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

const inputPath = process.argv[2];

if (!inputPath) {
    console.error('Usage: html2md <input.html> [--heading-style atx|setext] [--remove ".ads,footer,nav"] [--base-url https://example.com]');
    process.exit(1);
}

// Parse CLI flags
const args = process.argv.slice(3);
const options = {};

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
        case '--no-gfm-tables':
            options.gfmTables = false;
            i--; // no value for this flag
            break;
    }
}

const resolved = path.resolve(inputPath);
const html = fs.readFileSync(resolved, 'utf-8');

// Use jsdom so the core algorithm's DOM-based rules work in Node
const dom = new JSDOM(html);
const { document } = dom.window;

// Strip unwanted selectors before conversion
if (options.removeSelectors) {
    for (const sel of options.removeSelectors) {
        for (const el of document.querySelectorAll(sel)) {
            el.remove();
        }
    }
    delete options.removeSelectors; // already handled
}

const converter = createConverter(options);
const markdown = converter.turndown(document.body.innerHTML);

const outputPath = resolved.replace(/\.html?$/i, '.md');
fs.writeFileSync(outputPath, markdown);
console.log(`Converted to ${outputPath}`);
