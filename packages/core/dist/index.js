import u from "turndown";
import { gfm as m } from "turndown-plugin-gfm";
function h(c = {}) {
  const {
    gfmTables: f = !0,
    removeSelectors: s = [],
    absoluteUrlBase: o,
    ...l
  } = c, n = new u({
    headingStyle: l.headingStyle || "atx",
    codeBlockStyle: l.codeBlockStyle || "fenced",
    emDelimiter: l.emDelimiter || "*",
    linkStyle: l.linkStyle || "inlined",
    ...l
  });
  f && n.use(m), n.addRule("latex", {
    filter: (r) => r.classList && r.classList.contains("mjx-chtml") || r.tagName === "MATH",
    replacement: (r, e) => `$${e.textContent}$`
  }), n.addRule("lazyImages", {
    filter: "img",
    replacement: (r, e) => {
      let t = e.getAttribute("data-src") || e.getAttribute("src");
      t && o && !t.startsWith("http") && (t = new URL(t, o).href);
      const i = e.getAttribute("alt") || "image";
      return t ? `![${i}](${t})` : "";
    }
  }), o && n.addRule("absoluteLinks", {
    filter: "a",
    replacement: (r, e) => {
      let t = e.getAttribute("href");
      t && !t.startsWith("http") && !t.startsWith("#") && (t = new URL(t, o).href);
      const i = e.textContent || "";
      return t ? `[${i}](${t})` : i;
    }
  });
  const a = n.turndown.bind(n);
  return n.turndown = (r) => {
    if (typeof r == "string" && s.length > 0 && typeof DOMParser < "u") {
      const e = new DOMParser().parseFromString(r, "text/html");
      for (const t of s)
        for (const i of e.querySelectorAll(t)) i.remove();
      return a(e.body.innerHTML);
    }
    return a(r);
  }, n;
}
export {
  h as createConverter
};
