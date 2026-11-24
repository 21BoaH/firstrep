/*
 * Imports the exercise list and the body muscle map that the Workouts page uses.
 *
 *   node scripts/import-opengym.mjs
 *
 * Writes src/data/opengym/exercises.json and src/data/opengym/body-paths.json.
 *
 * Where the data comes from, and why from there (see src/data/opengym/NOTICE.md):
 *
 * - Exercises: openGym's catalogue starts from 1,324 exercises whose names, muscles and steps
 *   are MIT licensed. openGym's own later edits to that text are AGPL, so the text is taken from
 *   the MIT dataset openGym credits as its source, hasaneyldrm/exercises-dataset. The ids match
 *   openGym's. Only text fields are kept. The pictures and animations in that dataset belong to
 *   Gym visual and are licensed to it alone, so none of them, and no link to them, is copied.
 *
 * - Body map: openGym's muscle outlines, which are the MuscleMap artwork by Melih Colpan (MIT),
 *   converted to plain path data. The file is read as text and parsed as JSON. It is never run.
 *
 * To use files already on disk instead of downloading them, pass their paths:
 *   node scripts/import-opengym.mjs <exercises.json> <body-paths.js>
 */
import { readFile, writeFile } from "node:fs/promises";

const EXERCISES_URL = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";
const BODY_PATHS_URL = "https://raw.githubusercontent.com/DuarteSantos8/openGym/main/frontend/src/lib/body-paths.js";
const OUT = new URL("../src/data/opengym/", import.meta.url);

const [exercisesFile, bodyPathsFile] = process.argv.slice(2);

async function load(file, url) {
  if (file) return readFile(file, "utf8");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.text();
}

// ------------------------------------------------------------- exercises
// A few names in the source carry a degree sign that was decoded twice ("45в°"): put it right.
const text = (value) => (typeof value === "string" ? value.replace(/в°/g, "°").replace(/\s+/g, " ").trim() : "");
const words = (value) => (Array.isArray(value) ? value.map(text).filter(Boolean) : []);

const source = JSON.parse(await load(exercisesFile, EXERCISES_URL));
if (!Array.isArray(source)) throw new Error("exercises: expected an array");

const exercises = [];
const seen = new Set();
for (const entry of source) {
  const id = text(entry.id);
  const name = text(entry.name);
  const steps = words(entry.instruction_steps?.en);
  if (!/^\d{4}$/.test(id) || !name || seen.has(id)) continue;
  seen.add(id);
  // text fields only: image, gif_url, media_id and attribution belong to the media and stay out
  exercises.push({
    id,
    name,
    bodyPart: text(entry.body_part),
    equipment: text(entry.equipment),
    target: text(entry.target),
    secondary: words(entry.secondary_muscles),
    steps,
  });
}
exercises.sort((a, b) => a.id.localeCompare(b.id));

// ------------------------------------------------------------- body map
const SVG_PATH = /^[MmLlHhVvCcSsQqTtAaZz0-9.,\s-]+$/;
const VIEWBOX = /^-?[\d.]+ -?[\d.]+ [\d.]+ [\d.]+$/;
const raw = await load(bodyPathsFile, BODY_PATHS_URL);
const geometry = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1));

const bodyPaths = {};
for (const figure of ["male", "female"]) {
  bodyPaths[figure] = {};
  for (const side of ["front", "back"]) {
    const view = geometry[figure]?.[side];
    if (!view || !VIEWBOX.test(view.vb)) throw new Error(`body map: ${figure} ${side} is missing`);
    const parts = {};
    for (const [part, paths] of Object.entries(view.p)) {
      if (!/^[a-z-]+$/.test(part) || !Array.isArray(paths)) continue;
      const clean = paths.filter((d) => typeof d === "string" && SVG_PATH.test(d));
      if (clean.length) parts[part] = clean;
    }
    bodyPaths[figure][side] = { vb: view.vb, p: parts };
  }
}

await writeFile(new URL("exercises.json", OUT), JSON.stringify(exercises));
await writeFile(new URL("body-paths.json", OUT), JSON.stringify(bodyPaths));

// ------------------------------------------------------------- summary
const tally = (pick) => {
  const counts = {};
  for (const e of exercises) for (const v of [].concat(pick(e))) counts[v] = (counts[v] || 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
};
console.log(`exercises: ${exercises.length}`);
console.log("targets:", JSON.stringify(tally((e) => e.target)));
console.log("secondary:", JSON.stringify(tally((e) => e.secondary)));
console.log("body parts:", JSON.stringify(tally((e) => e.bodyPart)));
console.log("equipment:", JSON.stringify(tally((e) => e.equipment)));
for (const figure of Object.keys(bodyPaths)) {
  for (const side of ["front", "back"]) console.log(`${figure} ${side}:`, Object.keys(bodyPaths[figure][side].p).join(", "));
}
