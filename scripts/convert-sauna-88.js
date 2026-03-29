/**
 * Convert a sauna-88 HTML file to Markdown.
 *
 * Extracts visible text from <font face="-apple-system, ..."> tags,
 * strips hidden <span style="display:none"> and <font style="font-size:0px"> noise,
 * converts <br> to newlines, and preserves the <h2> title.
 *
 * Usage:
 *   node scripts/convert-sauna-88.js <input.html> <output.md>
 */

import { readFileSync, writeFileSync } from 'fs';

function decode(buffer) {
    const decoder = new TextDecoder('big5');
    return decoder.decode(buffer);
}

const [inputFile, outputFile] = process.argv.slice(2);

if (!inputFile || !outputFile) {
    console.error('Usage: node scripts/convert-sauna-88.js <input.html> <output.md>');
    process.exit(1);
}

// Read the raw bytes and decode from Big5
const raw = readFileSync(inputFile);
const html = decode(raw);

// 1. Remove hidden spans: <span style="display:none">...</span>
let cleaned = html.replace(/<span[^>]*display\s*:\s*none[^>]*>[\s\S]*?<\/span>/gi, '');

// 2. Remove invisible font tags (font-size:0px or color:#FFF used as noise)
cleaned = cleaned.replace(/<font[^>]*font-size\s*:\s*0px[^>]*>[\s\S]*?<\/font>/gi, '');

// 3. Extract the h2 title
let title = '';
const h2Match = cleaned.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
if (h2Match) {
    title = h2Match[1].replace(/<[^>]*>/g, '').trim();
}

// 4. Extract ALL main content areas (inside div#postmessage_*)
let content = '';
const divRegex = /<div[^>]*id="postmessage[^"]*"[^>]*>([\s\S]*?)<\/div>/gi;
const matches = [...cleaned.matchAll(divRegex)];

if (matches.length > 0) {
    // Extract the inner HTML from every match and join them with newlines
    content = matches.map(match => match[1]).join('\n\n');
} else {
    // Fallback just in case nothing matched
    content = cleaned;
}

// 5. Convert <br> and <br/> to newline markers
content = content.replace(/<br\s*\/?>/gi, '\n');

// 6. Strip all remaining HTML tags
content = content.replace(/<[^>]*>/g, '');

// 7. Decode common HTML entities
content = content
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&nbsp;/g, ' ');

// 8. Clean up excessive blank lines (3+ consecutive newlines → 2)
content = content.replace(/\n{3,}/g, '\n\n');

// 9. Trim leading/trailing whitespace
content = content.trim();

// 10. Build the markdown
let md = '';
if (title) {
    md += `# ${title}\n\n`;
}
md += content + '\n';

// Write as UTF-8
writeFileSync(outputFile, md, 'utf-8');
console.log(`Converted: ${inputFile} → ${outputFile}`);
