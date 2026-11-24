import { REGION_NAME } from "./muscles.js";

/*
 * The body muscle map: openGym's front and back outlines (the MuscleMap artwork, MIT) drawn as
 * one SVG. Each muscle region is filled from dark graphite, untrained, to bright gold, the most
 * trained. Head, hands, feet and joints are drawn as the silhouette and never take a colour.
 */

let geometry = null;

export async function loadBodyMap() {
  if (!geometry) ({ default: geometry } = await import("../data/opengym/body-paths.json"));
  return geometry;
}

const UNTRAINED = [43, 47, 56];
const LOW = [104, 86, 58];
const HIGH = [242, 219, 170];
const SILHOUETTE = "#1c1f25";
const HAIR = "#15171b";

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = ([r, g, b]) => `rgb(${r}, ${g}, ${b})`;

/** The fill for a region trained to a share between 0 (not at all) and 1 (the most). */
export const heatColour = (share) => (share > 0 ? rgb(mix(LOW, HIGH, Math.min(1, share) ** 0.75)) : rgb(UNTRAINED));

const box = (vb) => vb.split(" ").map(Number);

/** The SVG of one figure, front and back side by side, with every muscle untrained. */
export function bodyMapMarkup(geo, figure) {
  const views = geo[figure];
  const [fx, fy, fw, fh] = box(views.front.vb);
  const [bx, by, bw, bh] = box(views.back.vb);
  const x = Math.min(fx, bx);
  const y = Math.min(fy, by);
  const width = Math.max(fx + fw, bx + bw) - x;
  const height = Math.max(fy + fh, by + bh) - y;
  const side = (name) =>
    `<g class="bm-view" data-side="${name}">${Object.entries(views[name].p)
      .map(([part, paths]) => {
        const muscle = part in REGION_NAME;
        const attrs = muscle
          ? `class="bm-muscle" data-region="${part}" fill="${heatColour(0)}"`
          : `class="bm-inert" fill="${part === "hair" ? HAIR : SILHOUETTE}"`;
        return paths.map((d) => `<path ${attrs} d="${d}"></path>`).join("");
      })
      .join("")}</g>`;
  return `<svg class="bodymap__svg" viewBox="${x} ${y} ${width} ${height}" aria-hidden="true" focusable="false">${side("front")}${side("back")}</svg>`;
}

/** Colour every region by its share, from 0 to 1. */
export function paintBodyMap(svg, shares) {
  for (const path of svg.querySelectorAll(".bm-muscle")) {
    const share = shares[path.dataset.region] ?? 0;
    path.setAttribute("fill", heatColour(share));
    path.classList.toggle("is-trained", share > 0);
  }
}

/** Light up one region, as the pointer or the list points at it. */
export function highlightRegion(svg, region) {
  for (const path of svg.querySelectorAll(".bm-muscle")) path.classList.toggle("is-hover", path.dataset.region === region);
}
