import { exerciseRegions } from "./muscles.js";

/*
 * Numbers worked out from the logged sessions: volume, personal bests, last week's work.
 * A set counts once it is checked off.
 */

const DAY = 86400000;

/** Estimated one-rep max (Epley). A fair way to compare a heavy triple with a lighter set of ten. */
export const oneRepMax = (kg, reps) => (kg > 0 && reps > 0 ? (reps === 1 ? kg : kg * (1 + reps / 30)) : 0);

export const doneSets = (item) => item.sets.filter((set) => set.done);

export function sessionTotals(session) {
  let sets = 0;
  let volume = 0;
  for (const item of session.items) {
    for (const set of doneSets(item)) {
      sets += 1;
      volume += (set.kg ?? 0) * (set.reps ?? 0);
    }
  }
  const minutes = session.endedAt ? Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000)) : 0;
  return { sets, volume, minutes };
}

/** The sessions that ended within the last seven days. */
export const thisWeek = (sessions, now = Date.now()) => sessions.filter((session) => session.endedAt && now - session.endedAt < 7 * DAY);

/** The sets of an exercise the last time it was logged, before a given session. */
export function lastTime(sessions, exerciseId, excludeId = null) {
  for (const session of sessions) {
    if (session.id === excludeId) continue;
    const item = session.items.find((i) => i.ex === exerciseId && doneSets(i).length);
    if (item) return { session, sets: doneSets(item) };
  }
  return null;
}

/** The best set ever logged for an exercise, by estimated one-rep max, leaving one session out. */
export function bestSet(sessions, exerciseId, excludeId = null) {
  let best = null;
  for (const session of sessions) {
    if (session.id === excludeId) continue;
    for (const item of session.items) {
      if (item.ex !== exerciseId) continue;
      for (const set of doneSets(item)) {
        const score = oneRepMax(set.kg ?? 0, set.reps ?? 0);
        if (score > 0 && (!best || score > best.score)) best = { ...set, score, at: session.endedAt };
      }
    }
  }
  return best;
}

/** For each exercise in a session, a new best compared with every earlier session. */
export function newBests(sessions, session) {
  const earlier = sessions.filter((s) => s.id !== session.id && s.endedAt < session.startedAt + 1);
  const bests = [];
  for (const item of session.items) {
    let top = null;
    for (const set of doneSets(item)) {
      const score = oneRepMax(set.kg ?? 0, set.reps ?? 0);
      if (score > 0 && (!top || score > top.score)) top = { ...set, score };
    }
    if (!top) continue;
    const before = bestSet(earlier, item.ex);
    if (before && top.score > before.score + 0.01) bests.push({ ex: item.ex, set: top, before });
  }
  return bests;
}

/** Each logged session of one exercise with its best set, oldest first: for the progress line. */
export function progress(sessions, exerciseId) {
  const points = [];
  for (const session of sessions) {
    const item = session.items.find((i) => i.ex === exerciseId);
    if (!item) continue;
    let top = null;
    for (const set of doneSets(item)) {
      const score = oneRepMax(set.kg ?? 0, set.reps ?? 0);
      if (!top || score > top.score) top = { ...set, score };
    }
    if (top) points.push({ at: session.endedAt ?? session.startedAt, ...top });
  }
  return points.sort((a, b) => a.at - b.at);
}

/**
 * How many sets each region of the body did: a set of an exercise counts in full for its target
 * muscle and half for each secondary muscle.
 * count(item) says how many sets of that item to count: by default the checked ones.
 */
export function regionSets(items, byId, count = (item) => doneSets(item).length) {
  const load = {};
  for (const item of items) {
    const sets = count(item);
    if (!sets) continue;
    for (const [region, weight] of Object.entries(exerciseRegions(byId.get(item.ex)))) {
      load[region] = (load[region] ?? 0) + sets * weight;
    }
  }
  return load;
}
