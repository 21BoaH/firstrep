/*
 * How the words the exercise data uses for muscles ("pectorals", "rear deltoids", "core" ...)
 * map onto the regions of the body map, and onto the muscles of the 3D model page.
 */

/** The regions of the body map that light up, in list order. Other parts are drawn as the silhouette. */
export const REGIONS = [
  ["chest", "Chest"],
  ["deltoids", "Shoulders"],
  ["biceps", "Biceps"],
  ["triceps", "Triceps"],
  ["forearm", "Forearms"],
  ["trapezius", "Traps"],
  ["upper-back", "Lats and upper back"],
  ["lower-back", "Lower back"],
  ["abs", "Abs"],
  ["obliques", "Obliques"],
  ["serratus", "Serratus"],
  ["hip-flexors", "Hip flexors"],
  ["gluteal", "Glutes"],
  ["quadriceps", "Quads"],
  ["hamstring", "Hamstrings"],
  ["adductors", "Inner thighs"],
  ["calves", "Calves"],
  ["tibialis", "Shins"],
  ["neck", "Neck"],
];
export const REGION_NAME = Object.fromEntries(REGIONS);

/** The muscle on the 3D model page that each region opens. */
export const REGION_TO_MODEL = {
  chest: "chest",
  deltoids: "shoulders",
  biceps: "biceps",
  triceps: "triceps",
  forearm: "forearms",
  trapezius: "traps",
  "upper-back": "lats",
  "lower-back": "lower-back",
  abs: "abs",
  obliques: "obliques",
  serratus: "serratus",
  "hip-flexors": "hip-flexors",
  gluteal: "glutes",
  quadriceps: "quads",
  hamstring: "hamstrings",
  adductors: "adductors",
  calves: "calves",
  tibialis: "shins",
  neck: "neck",
};

/** The other way: a muscle of the 3D model page and the region that finds exercises for it. */
export const MODEL_TO_REGION = {
  ...Object.fromEntries(Object.entries(REGION_TO_MODEL).map(([region, muscle]) => [muscle, region])),
  "rotator-cuff": "deltoids",
  rhomboids: "upper-back",
  "deep-core": "abs",
  "hip-abductors": "gluteal",
  piriformis: "gluteal",
  peroneals: "calves",
};

/** Every muscle word in the data, and the regions it works. */
const WORDS = {
  // the words used as an exercise's target
  abs: ["abs"],
  pectorals: ["chest"],
  biceps: ["biceps"],
  glutes: ["gluteal"],
  delts: ["deltoids"],
  triceps: ["triceps"],
  "upper back": ["upper-back"],
  lats: ["upper-back"],
  calves: ["calves"],
  quads: ["quadriceps"],
  forearms: ["forearm"],
  "cardiovascular system": [],
  hamstrings: ["hamstring"],
  spine: ["lower-back"],
  traps: ["trapezius"],
  adductors: ["adductors"],
  "serratus anterior": ["serratus"],
  abductors: ["gluteal"],
  "levator scapulae": ["neck"],
  // the words used for secondary muscles
  shoulders: ["deltoids"],
  quadriceps: ["quadriceps"],
  core: ["abs", "obliques"],
  chest: ["chest"],
  "upper chest": ["chest"],
  "hip flexors": ["hip-flexors"],
  obliques: ["obliques"],
  "lower back": ["lower-back"],
  rhomboids: ["upper-back"],
  trapezius: ["trapezius"],
  back: ["upper-back"],
  deltoids: ["deltoids"],
  "rear deltoids": ["deltoids"],
  "rotator cuff": ["deltoids"],
  "latissimus dorsi": ["upper-back"],
  brachialis: ["biceps"],
  soleus: ["calves"],
  "ankle stabilizers": ["tibialis"],
  shins: ["tibialis"],
  wrists: ["forearm"],
  "wrist extensors": ["forearm"],
  "wrist flexors": ["forearm"],
  "grip muscles": ["forearm"],
  hands: ["forearm"],
  sternocleidomastoid: ["neck"],
  abdominals: ["abs"],
  "lower abs": ["abs"],
  "inner thighs": ["adductors"],
  groin: ["adductors"],
  ankles: [],
  feet: [],
};

/** The regions a muscle word works. */
export const regionsOf = (word) => WORDS[word] ?? [];

/** Friendlier names for the data's target words. Others are shown with a capital letter. */
const NAMES = {
  pectorals: "Chest",
  delts: "Shoulders",
  "upper back": "Upper back",
  spine: "Lower back",
  "cardiovascular system": "Cardio",
  "serratus anterior": "Serratus",
  "levator scapulae": "Neck",
  abductors: "Outer hips",
  adductors: "Inner thighs",
};
export const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "");
export const muscleName = (word) => NAMES[word] ?? capitalize(word);

/** How hard an exercise works each region: 1 for its target muscle, 0.5 for each secondary one. */
export function exerciseRegions(exercise) {
  const weights = {};
  if (!exercise) return weights;
  for (const region of regionsOf(exercise.target)) weights[region] = 1;
  for (const word of exercise.secondary) {
    for (const region of regionsOf(word)) weights[region] = Math.max(weights[region] ?? 0, 0.5);
  }
  return weights;
}

/** The region an exercise mainly trains, or null for cardio. */
export const mainRegion = (exercise) => regionsOf(exercise?.target)[0] ?? null;
