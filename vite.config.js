import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig } from "vite";

/**
 * Lets the built site run when dist/index.html is opened straight from disk (file://),
 * not only from a web server. Browsers block module scripts and `crossorigin` stylesheets
 * on file:// pages, so the script is written into the page and the attribute dropped.
 */
function openFromDisk() {
  let outDir = "dist";
  return {
    name: "open-from-disk",
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    writeBundle(_, bundle) {
      const htmlPath = join(outDir, "index.html");
      let html = readFileSync(htmlPath, "utf8");
      for (const chunk of Object.values(bundle)) {
        if (chunk.type !== "chunk" || !chunk.isEntry) continue;
        const tag = new RegExp(`<script type="module"[^>]*src="\\./${chunk.fileName}"></script>`);
        if (!tag.test(html)) continue;
        const code = chunk.code.replace(/<\/script/g, "<\\/script");
        html = html.replace(tag, () => `<script type="module">${code}</script>`);
        rmSync(join(outDir, chunk.fileName));
      }
      html = html.replace(/<link rel="stylesheet" crossorigin /g, '<link rel="stylesheet" ');
      writeFileSync(htmlPath, html);
    },
  };
}

export default defineConfig({
  base: "./",
  server: { port: 5173, strictPort: true, host: "localhost" },
  build: {
    target: "es2022",
    modulePreload: false,
    rolldownOptions: { output: { codeSplitting: false } },
  },
  plugins: [openFromDisk()],
});
