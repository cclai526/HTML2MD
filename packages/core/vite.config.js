import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: './index.js',
            formats: ['es'],
            fileName: 'index',
        },
        rollupOptions: {
            // Externalize deps that shouldn't be bundled (for CLI usage).
            // For the extension build, Vite will re-bundle from source.
            external: ['turndown', 'turndown-plugin-gfm'],
        },
    },
});
