import { rmSync } from "node:fs";
import { defineConfig } from "vite";

/*
 * The live site (https://21boah.github.io/firstrep/) is served by GitHub Pages straight from the
 * root of the main branch, and Pages only serves files as they are. So the root of the repository
 * holds the BUILT site, and the source lives in src/:
 *
 *   src/index.html, src/*.js, src/*.css    the source, run by the dev server (npm run dev)
 *   index.html and assets/ at the root      the built site, written by npm run build
 *
 * To update the live site: npm run build, then commit the root index.html and assets/ with the
 * source change, and push to main.
 */

/** Each build gives its files new hashed names, so clear out the previous build's assets first. */
function clearOldAssets() {
  return {
    name: "clear-old-assets",
    apply: "build",
    buildStart() {
      rmSync(new URL("./assets", import.meta.url), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  root: "src",
  publicDir: false,
  // relative links, so the built site works at /firstrep/ on GitHub Pages, or at any other path
  base: "./",
  server: { port: 5173, strictPort: true, host: "localhost" },
  build: {
    target: "es2022",
    outDir: "..",
    // the output folder is the repository itself: never empty it
    emptyOutDir: false,
  },
  plugins: [clearOldAssets()],
});
