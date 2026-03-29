```bash
# produces index.js (ES module, externalized deps)
pnpm --filter @my-project/core build

# produces dist with popup.html, popup.js, content.js, and manifest.json
pnpm --filter @my-project/extension build 

# Run
pnpm --filter @my-project/cli exec node index.js ~/Download/loho.html --heading-style atx
```
