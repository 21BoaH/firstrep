import { doneSets } from "./stats.js";

/*
 * Two small charts for the Workouts page, drawn as inline SVG:
 *   weekBars   sets per week over the last weeks, one bar per week with its value on it
 *   sparkline  the estimated max of one exercise over its last sessions
 * Each comes with a text summary for screen readers; the week chart also has a table.
 */

const DAY = 86400000;

/** Monday 00:00 of the week a time falls in. */
export function weekStart(t) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}

/** Sets done in each of the last `count` weeks, oldest first. */
export function setsPerWeek(sessions, count = 8, now = Date.now()) {
  const thisWeek = weekStart(now);
  const weeks = Array.from({ length: count }, (_, i) => {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - 7 * (count - 1 - i));
    return { start: start.getTime(), sets: 0, workouts: 0 };
  });
  for (const session of sessions) {
    const start = weekStart(session.startedAt);
    const week = weeks.find((w) => w.start === start);
    if (!week) continue;
    week.workouts += 1;
    week.sets += session.items.reduce((n, item) => n + doneSets(item).length, 0);
  }
  return weeks;
}

const shortDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const shortMonth = new Intl.DateTimeFormat("en-GB", { month: "short" });
const sets = (n) => `${n} ${n === 1 ? "set" : "sets"}`;

/**
 * The bar chart of sets per week, one column per week with its value on the bar. Drawn with
 * HTML rather than SVG so the labels keep their size on a phone. Screen readers get the table.
 */
export function weekBars(weeks, { esc }) {
  const high = Math.max(1, ...weeks.map((week) => week.sets));
  const columns = weeks
    .map((week, i) => {
      const current = i === weeks.length - 1;
      const [top, bottom] = current ? ["This", "week"] : [String(new Date(week.start).getDate()), shortMonth.format(week.start)];
      return `<li class="weeks__col${current ? " is-current" : ""}${week.sets ? "" : " is-empty"}" style="--share:${(week.sets / high).toFixed(3)}">
        <span class="weeks__plot"><span class="weeks__value">${week.sets || ""}</span><span class="weeks__bar"></span></span>
        <span class="weeks__label">${esc(top)}<br />${esc(bottom)}</span>
      </li>`;
    })
    .join("");
  const last = weeks.at(-1);
  const best = weeks.reduce((a, b) => (b.sets > a.sets ? b : a), weeks[0]);
  const summary = best.sets
    ? `This week, since Monday: ${sets(last.sets)}. Most in a week: ${sets(best.sets)}, the week of ${shortDate.format(best.start)}.`
    : `No sets in the last ${weeks.length} weeks.`;
  const rows = weeks
    .map((week, i) => `<tr><th scope="row">${esc(i === weeks.length - 1 ? "This week" : `Week of ${shortDate.format(week.start)}`)}</th><td>${week.workouts}</td><td>${week.sets}</td></tr>`)
    .join("");
  return `<figure class="weeks">
    <ol class="weeks__chart" aria-hidden="true" style="--count:${weeks.length}">${columns}</ol>
    <figcaption class="weeks__summary">${esc(summary)}</figcaption>
    <table class="sr-only"><caption>Sets per week, last ${weeks.length} weeks</caption><thead><tr><th scope="col">Week</th><th scope="col">Workouts</th><th scope="col">Sets</th></tr></thead><tbody>${rows}</tbody></table>
  </figure>`;
}

/** A small line of the estimated max over the last sessions of one exercise. */
export function sparkline(points, { weight, unit, esc }) {
  if (points.length < 2) return "";
  const w = 300;
  const h = 70;
  const p = 8;
  const scores = points.map((point) => point.score);
  const low = Math.min(...scores);
  const high = Math.max(...scores);
  const span = high - low || 1;
  const xy = points.map((point, i) => [p + (i * (w - 2 * p)) / (points.length - 1), h - p - ((point.score - low) * (h - 2 * p)) / span]);
  const line = xy.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = xy.at(-1);
  const text = `Estimated max over your last ${points.length} sessions: ${weight(scores[0])} to ${weight(scores.at(-1))} ${unit}`;
  return `<figure class="spark">
    <svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(text)}">
      <polyline points="${line}"></polyline>
      <circle cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="4.5"></circle>
    </svg>
    <figcaption>${esc(text)}</figcaption>
  </figure>`;
}

export const days = (n) => n * DAY;
