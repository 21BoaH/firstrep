/*
 * Everything the Workouts page keeps: the workouts people build, every session they log, the
 * session in progress and two settings. It lives in this browser's local storage, so it stays on
 * this device. A backup file moves it to another one.
 *
 *   routine   { id, name, items: [{ ex, sets, reps, rest }], createdAt, updatedAt }
 *   session   { id, routineId, name, startedAt, endedAt, items: [{ ex, rest, goal, sets: [{ kg, reps, done }] }] }
 *
 * Weights are always stored in kilograms. Times are milliseconds since 1970.
 */

export const KEY = "firstrep.training.v1";
const VERSION = 1;

export const blank = () => ({
  version: VERSION,
  routines: [],
  sessions: [],
  active: null,
  settings: { unit: "kg", figure: "male" },
});

/** False when the browser blocks storage, as some private windows do. Data then lasts until the tab closes. */
export let storageWorks = true;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? clean(JSON.parse(raw)) : blank();
  } catch {
    storageWorks = false;
    return blank();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    storageWorks = true;
  } catch {
    storageWorks = false;
  }
}

export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// ------------------------------------------------------------- checking data
// Stored data and backup files are read with care: anything that is not the expected shape is dropped.
const isText = (value, max = 120) => typeof value === "string" && value.length <= max;
const isId = (value) => typeof value === "string" && /^\d{4}$/.test(value);
const number = (value, min, max) => (typeof value === "number" && Number.isFinite(value) && value >= min && value <= max ? value : null);
const time = (value) => number(value, 0, 8.64e15);

function cleanSet(set) {
  if (!set || typeof set !== "object") return null;
  return { kg: number(set.kg, 0, 2000), reps: number(set.reps, 0, 1000), done: set.done === true };
}

function cleanSessionItem(item) {
  if (!item || !isId(item.ex)) return null;
  const sets = Array.isArray(item.sets) ? item.sets.map(cleanSet).filter(Boolean).slice(0, 50) : [];
  return { ex: item.ex, rest: number(item.rest, 0, 900) ?? 90, goal: isText(item.goal, 30) ? item.goal : null, sets };
}

function cleanSession(session, { active = false } = {}) {
  if (!session || !isText(session.id, 80)) return null;
  const startedAt = time(session.startedAt);
  const endedAt = time(session.endedAt);
  if (startedAt === null || (!active && endedAt === null)) return null;
  return {
    id: session.id,
    routineId: isText(session.routineId, 80) ? session.routineId : null,
    name: isText(session.name) ? session.name : "Workout",
    startedAt,
    endedAt: active ? null : endedAt,
    items: Array.isArray(session.items) ? session.items.map(cleanSessionItem).filter(Boolean).slice(0, 60) : [],
  };
}

function cleanRoutine(routine) {
  if (!routine || !isText(routine.id, 80)) return null;
  const items = Array.isArray(routine.items)
    ? routine.items
        .filter((item) => item && isId(item.ex))
        .map((item) => ({
          ex: item.ex,
          sets: number(item.sets, 1, 20) ?? 3,
          reps: isText(item.reps, 20) ? item.reps : "8-12",
          rest: number(item.rest, 0, 900) ?? 90,
        }))
        .slice(0, 60)
    : [];
  return {
    id: routine.id,
    name: isText(routine.name) ? routine.name : "Workout",
    items,
    createdAt: time(routine.createdAt) ?? Date.now(),
    updatedAt: time(routine.updatedAt) ?? Date.now(),
  };
}

export function clean(data) {
  const state = blank();
  if (!data || typeof data !== "object") return state;
  state.routines = Array.isArray(data.routines) ? data.routines.map(cleanRoutine).filter(Boolean) : [];
  state.sessions = Array.isArray(data.sessions) ? data.sessions.map((s) => cleanSession(s)).filter(Boolean) : [];
  state.sessions.sort((a, b) => b.startedAt - a.startedAt);
  state.active = data.active ? cleanSession(data.active, { active: true }) : null;
  if (data.settings?.unit === "lb") state.settings.unit = "lb";
  if (data.settings?.figure === "female") state.settings.figure = "female";
  return state;
}

// ------------------------------------------------------------- backups
export function backupFile(state) {
  const data = { app: "First Rep", ...state, exportedAt: new Date().toISOString() };
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}

/** Reads a backup file. Throws if it is not one. */
export async function readBackup(file) {
  if (file.size > 20 * 1024 * 1024) throw new Error("That file is too large to be a backup.");
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    throw new Error("That file is not a First Rep backup.");
  }
  if (!data || (!Array.isArray(data.routines) && !Array.isArray(data.sessions))) throw new Error("That file is not a First Rep backup.");
  return clean(data);
}
