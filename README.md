# HTML2MD — HTML to Markdown Converter

A monorepo containing a **shared conversion engine**, a **Node.js CLI tool**, and a **Chrome Extension** — all powered by [Turndown](https://github.com/mixmark-io/turndown) with GitHub Flavored Markdown support.

---

## Project Structure

```
html-to-md/
├── package.json              ← Root workspace config & dev scripts
├── pnpm-workspace.yaml       ← Declares workspace packages
├── packages/
│   └── core/                 ← @html2md/core — shared conversion algorithm
│       ├── index.js          ← createConverter() — the main export
│       ├── vite.config.js    ← Builds as ES module library
│       └── package.json
└── apps/
    ├── cli/                  ← @html2md/cli — command-line converter
    │   ├── index.js          ← CLI entrypoint (accepts files or URLs)
    │   └── package.json
    └── extension/            ← @html2md/extension — Chrome browser extension
        ├── popup.html        ← Extension popup UI
        ├── vite.config.js    ← Bundles popup + content script
        ├── public/
        │   ├── manifest.json ← Chrome Extension Manifest V3
        │   └── icons/        ← Extension icons (16/48/128px)
        └── src/
            ├── popup.js      ← Popup logic (uses @html2md/core)
            └── content.js    ← Injected into pages to extract HTML
```

### How the packages relate

- **`@html2md/core`** is the shared library. It wraps Turndown with custom rules (LaTeX, lazy images, GFM tables, element removal). Both the CLI and the extension depend on it.
- **`@html2md/cli`** is a standalone Node.js script. It uses [jsdom](https://github.com/jsdom/jsdom) to give Turndown a DOM environment in Node. It can read local `.html` files or fetch any URL.
- **`@html2md/extension`** is a Chrome Extension (Manifest V3). Vite bundles the popup and the core library together. The content script runs on the page to extract HTML; the popup converts it.

---

## Prerequisites

You need **Node.js ≥ 18** and **pnpm** installed.

### Install Node.js

If you don't have Node.js, install it via [nvm](https://github.com/nvm-sh/nvm) (recommended):

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# Restart your terminal, then:
nvm install --lts
```

### Install pnpm

pnpm is a fast, disk-efficient package manager. Install it globally:

```bash
npm install -g pnpm
```

> **Why pnpm?** This project is a *monorepo* — multiple packages in one repository. pnpm workspaces link them together so `@html2md/cli` and `@html2md/extension` can `import` from `@html2md/core` without publishing it to npm.

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/cclai526/HTML2MD.git
cd HTML2MD

# Install all dependencies for every package in the workspace
pnpm install
```

**What `pnpm install` does:** Reads `pnpm-workspace.yaml`, discovers all packages under `packages/` and `apps/`, installs their dependencies, and symlinks workspace packages (so `@html2md/core` is available to the CLI and extension without publishing).

### 2. Build everything

```bash
pnpm run build
```

This runs two commands in sequence:
1. `pnpm --filter @html2md/core build` — Compiles `packages/core/index.js` into `packages/core/dist/index.js` using Vite in **library mode**. The output is a clean ES module.
2. `pnpm --filter @html2md/extension build` — Bundles the extension popup + content script into `apps/extension/dist/`. Vite inlines `@html2md/core` into the popup bundle (so the extension is self-contained). Files from `public/` (manifest, icons) are copied as-is.

---

## Using the CLI

The CLI converts local HTML files **or** URLs directly to Markdown.

### Basic usage

```bash
# Convert a local HTML file → creates input.md next to it
node apps/cli/index.js path/to/page.html

# Convert a URL → creates a .md file in the current directory
node apps/cli/index.js https://example.com

# Specify output file
node apps/cli/index.js https://example.com -o output.md
```

### All CLI flags

| Flag | Value | Description |
|------|-------|-------------|
| `--heading-style` | `atx` or `setext` | `atx` uses `# Heading`, `setext` uses underlines. Default: `atx` |
| `--code-block-style` | `fenced` or `indented` | `fenced` uses triple backticks. Default: `fenced` |
| `--link-style` | `inlined` or `referenced` | `inlined`: `[text](url)`, `referenced`: `[text][1]`. Default: `inlined` |
| `--remove` | CSS selectors (comma-separated) | Strip elements before converting. e.g. `".ads,footer,nav"` |
| `--base-url` | URL | Prefix relative links with this origin |
| `--no-gfm-tables` | *(no value)* | Disable GitHub Flavored Markdown table support |
| `-o` / `--output` | file path | Write output to this file instead of auto-naming |

### Examples

```bash
# Convert a blog post, removing ads and navigation
node apps/cli/index.js https://blog.example.com/post \
  --remove ".sidebar,.ads,nav,footer" \
  -o post.md

# Convert a local file with setext-style headings
node apps/cli/index.js report.html --heading-style setext
```

---

## Using the Chrome Extension

### Loading in Development Mode

After building, load the extension from the `dist` folder:

1. **Build the extension:**
   ```bash
   pnpm run build:ext
   ```
   This creates `apps/extension/dist/` with all necessary files.

2. **Open Chrome** and navigate to:
   ```
   chrome://extensions
   ```

3. **Enable Developer mode** — toggle the switch in the top-right corner.

4. **Click "Load unpacked"** and select the folder:
   ```
   <project-root>/apps/extension/dist
   ```

5. The extension icon ("Md" on a blue background) appears in your toolbar. Click it on any page to convert.

### Using the Extension

1. Navigate to any web page you want to convert.
2. Click the extension icon in the toolbar.
3. (Optional) Adjust options:
   - **GFM Tables**: Toggle GitHub Flavored Markdown tables and strikethrough.
   - **Remove selectors**: Enter CSS selectors to strip (e.g. `.ads, footer, nav`).
4. Click **"Convert Page"**.
5. The Markdown appears in the text area. Use:
   - **Copy** — copies to clipboard
   - **Download .md** — saves as a file

### Reloading After Code Changes

When you change code and rebuild, Chrome does **not** auto-reload the extension. You must:
1. Run `pnpm run build:ext` (or use `pnpm run dev:ext` for watch mode).
2. Go to `chrome://extensions`.
3. Click the **reload icon** (↻) on the extension card.

### Production / Distribution

To distribute the extension:
1. Build it: `pnpm run build:ext`
2. Zip the `apps/extension/dist/` folder.
3. Upload to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

---

## Development Workflow

### Available Scripts

All scripts are run from the **project root**.

| Command | What it does |
|---------|-------------|
| `pnpm install` | Install all dependencies across all workspace packages. Run this once after cloning. |
| `pnpm run build` | Build the core library, then the extension. Full production build. |
| `pnpm run build:core` | Build only `@html2md/core` → outputs `packages/core/dist/index.js`. |
| `pnpm run build:ext` | Build only `@html2md/extension` → outputs `apps/extension/dist/`. |
| `pnpm run dev:core` | **Watch mode** for the core library. Rebuilds `packages/core/dist/` whenever you edit `packages/core/index.js`. |
| `pnpm run dev:ext` | **Watch mode** for the extension. Rebuilds `apps/extension/dist/` on every change. |
| `pnpm run dev` | Runs `dev:core` and `dev:ext` in parallel — full development watch mode. |

### Recommended dev setup

Open two terminals (or just run `pnpm run dev` which combines them):

```bash
# Terminal 1 — watch the core library for changes
pnpm run dev:core

# Terminal 2 — watch the extension for changes
pnpm run dev:ext
```

**How this works:**
- `dev:core` runs `vite build --watch` inside `packages/core/`. Every time you save `index.js`, Vite rebuilds `dist/index.js`.
- `dev:ext` runs `vite build --watch` inside `apps/extension/`. When files change (including the rebuilt core), Vite re-bundles the extension.
- After a rebuild, **reload the extension** in `chrome://extensions` to pick up changes.

### Developing the CLI

The CLI reads from `@html2md/core`'s source directly (via workspace linking), so no build step is needed during development. Just edit and run:

```bash
# Edit packages/core/index.js or apps/cli/index.js, then:
node apps/cli/index.js test.html
```

If you prefer auto-restart on changes, install [nodemon](https://www.npmjs.com/package/nodemon):

```bash
pnpm add -D -w nodemon

# Then run:
npx nodemon --watch apps/cli --watch packages/core apps/cli/index.js test.html
```

---

## Configuration Options

Both the CLI and the extension share the same conversion options via `@html2md/core`:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `headingStyle` | `'atx'` \| `'setext'` | `'atx'` | `# Heading` vs underlined headings |
| `codeBlockStyle` | `'fenced'` \| `'indented'` | `'fenced'` | Triple-backtick vs 4-space indent |
| `emDelimiter` | `'*'` \| `'_'` | `'*'` | `*italic*` vs `_italic_` |
| `linkStyle` | `'inlined'` \| `'referenced'` | `'inlined'` | `[text](url)` vs `[text][1]` with footnotes |
| `gfmTables` | `boolean` | `true` | Enable GFM tables and strikethrough |
| `removeSelectors` | `string[]` | `[]` | CSS selectors to remove before conversion |
| `absoluteUrlBase` | `string` | — | Base URL to resolve relative links against |

### Built-in edge-case handling

- **MathJax / LaTeX**: Elements with class `mjx-chtml` or `<math>` tags are converted to `$...$` inline math.
- **Lazy-loaded images**: Reads `data-src` when `src` is a placeholder.
- **Relative URLs**: When `absoluteUrlBase` is set, relative `href` and `src` values are resolved to absolute URLs.
