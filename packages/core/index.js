import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * Shared config schema — the same options are available in both the CLI and the Extension.
 *
 * @typedef {Object} ConverterOptions
 * @property {'atx'|'setext'}          [headingStyle='atx']
 * @property {'fenced'|'indented'}     [codeBlockStyle='fenced']
 * @property {'*'|'_'}                 [emDelimiter='*']
 * @property {'inlined'|'referenced'}  [linkStyle='inlined']
 * @property {boolean}                 [gfmTables=true]
 * @property {string[]}               [removeSelectors=[]]   CSS selectors to strip before conversion
 * @property {string}                  [absoluteUrlBase]      Prefix relative URLs with this origin
 */

export function createConverter(userOptions = {}) {
    const {
        gfmTables = true,
        removeSelectors = [],
        absoluteUrlBase,
        ...turndownOptions
    } = userOptions;

    // 1. Initialize with default user-facing options
    const turndownService = new TurndownService({
        headingStyle: turndownOptions.headingStyle || 'atx',
        codeBlockStyle: turndownOptions.codeBlockStyle || 'fenced',
        emDelimiter: turndownOptions.emDelimiter || '*',
        linkStyle: turndownOptions.linkStyle || 'inlined',
        ...turndownOptions,
    });

    // 2. Use GitHub Flavored Markdown (for tables/strikethrough)
    if (gfmTables) {
        turndownService.use(gfm);
    }

    // 3. Handle Edge Case: MathJax/LaTeX
    turndownService.addRule('latex', {
        filter: (node) =>
            (node.classList && node.classList.contains('mjx-chtml')) ||
            node.tagName === 'MATH',
        replacement: (_content, node) => `$${node.textContent}$`,
    });

    // 4. Handle Edge Case: Lazy-loaded Images
    turndownService.addRule('lazyImages', {
        filter: 'img',
        replacement: (_content, node) => {
            let src = node.getAttribute('data-src') || node.getAttribute('src');
            if (src && absoluteUrlBase && !src.startsWith('http')) {
                src = new URL(src, absoluteUrlBase).href;
            }
            const alt = node.getAttribute('alt') || 'image';
            return src ? `![${alt}](${src})` : '';
        },
    });

    // 5. Handle Edge Case: Absolute URLs for links
    if (absoluteUrlBase) {
        turndownService.addRule('absoluteLinks', {
            filter: 'a',
            replacement: (_content, node) => {
                let href = node.getAttribute('href');
                if (href && !href.startsWith('http') && !href.startsWith('#')) {
                    href = new URL(href, absoluteUrlBase).href;
                }
                const text = node.textContent || '';
                return href ? `[${text}](${href})` : text;
            },
        });
    }

    // Expose a helper that strips selectors before converting
    const originalTurndown = turndownService.turndown.bind(turndownService);

    turndownService.turndown = (htmlOrNode) => {
        // If the caller passed a string AND there are selectors to remove,
        // we need a DOM to manipulate. In the browser the DOMParser is
        // available natively; in Node the caller is expected to pass a
        // jsdom-created document or use the CLI wrapper that handles this.
        if (typeof htmlOrNode === 'string' && removeSelectors.length > 0) {
            if (typeof DOMParser !== 'undefined') {
                const doc = new DOMParser().parseFromString(htmlOrNode, 'text/html');
                for (const sel of removeSelectors) {
                    for (const el of doc.querySelectorAll(sel)) el.remove();
                }
                return originalTurndown(doc.body.innerHTML);
            }
        }
        return originalTurndown(htmlOrNode);
    };

    return turndownService;
}
