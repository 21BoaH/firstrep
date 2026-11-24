import { capitalize, muscleName } from "./muscles.js";

/*
 * The exercise list: 1,324 exercises with their names, muscles, equipment and steps.
 * It is about 100 KB compressed, so it is loaded once, when the Workouts page starts.
 */

let catalog = null;

/** Lower case, no accents, any dash or slash as a space: "Push-up" and "push up" match. */
export const normalize = (text) =>
  String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-–/·,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function loadCatalog() {
  if (catalog) return catalog;
  const { default: list } = await import("../data/opengym/exercises.json");
  for (const exercise of list) {
    exercise.title = capitalize(exercise.name);
    exercise.nameKey = normalize(exercise.name);
    exercise.searchKey = normalize(
      `${exercise.name} ${exercise.target} ${muscleName(exercise.target)} ${exercise.equipment} ${exercise.bodyPart} ${exercise.secondary.join(" ")}`,
    );
  }
  const byId = new Map(list.map((exercise) => [exercise.id, exercise]));
  const equipment = [...new Set(list.map((exercise) => exercise.equipment))].sort((a, b) => count(list, b) - count(list, a));
  catalog = { list, byId, equipment };
  return catalog;
}

const count = (list, equipment) => list.reduce((n, exercise) => n + (exercise.equipment === equipment), 0);

/** The name to show for an exercise id, even one that is no longer in the list. */
export const exerciseTitle = (id) => catalog?.byId.get(id)?.title ?? `Exercise ${id}`;

/**
 * Exercises that match a search. Every word typed has to appear somewhere in the exercise: its
 * name, its muscles or its equipment. Names that start with the search come first, then names
 * that contain it, then names with every word in them, and last the exercises that only match
 * through a muscle or a piece of equipment.
 */
export function searchCatalog({ list }, query, filter = () => true) {
  const q = normalize(query);
  const words = q.split(" ").filter(Boolean);
  const matches = list.filter((exercise) => filter(exercise) && words.every((word) => exercise.searchKey.includes(word)));
  // with nothing typed, the lifts come before the stretches, each in alphabetical order
  const stretch = (exercise) => (exercise.nameKey.includes("stretch") ? 1 : 0);
  if (!words.length) return matches.sort((a, b) => stretch(a) - stretch(b) || a.nameKey.localeCompare(b.nameKey));
  const rank = ({ nameKey }) => {
    if (nameKey.startsWith(q)) return 0;
    if (nameKey.includes(q)) return 1;
    if (words.every((word) => nameKey.includes(word))) return 2;
    return nameKey.split(" ").some((word) => word.startsWith(words[0])) ? 3 : 4;
  };
  return matches
    .map((exercise) => [rank(exercise), exercise])
    .sort((a, b) => a[0] - b[0] || a[1].nameKey.length - b[1].nameKey.length || a[1].nameKey.localeCompare(b[1].nameKey))
    .map(([, exercise]) => exercise);
}
