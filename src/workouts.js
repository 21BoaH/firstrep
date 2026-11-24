import "@fontsource/barlow/400.css";
import "@fontsource/barlow/400-italic.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./styles.css";
import "./workouts.css";

import { KEY, load, save, uid, storageWorks, backupFile, readBackup } from "./training/store.js";
import { loadCatalog, searchCatalog, exerciseTitle } from "./training/catalog.js";
import { REGIONS, REGION_NAME, REGION_TO_MODEL, capitalize, muscleName, mainRegion, regionsOf, exerciseRegions } from "./training/muscles.js";
import { loadBodyMap, bodyMapMarkup, paintBodyMap, highlightRegion, heatColour } from "./training/bodymap.js";
import { sessionTotals, thisWeek, lastTime, bestSet, newBests, progress, regionSets, doneSets } from "./training/stats.js";
import { setsPerWeek, weekBars, sparkline } from "./training/charts.js";

/*
 * The Workouts page: four sections, one at a time, each with its own address so links and the
 * Back button work (design-system/first-rep/pages/workouts.md has the rules behind the layout).
 *
 *   Workouts    #/                 the workout in progress and the saved workouts
 *               #/workout/<id>     building one          #/session    logging one
 *   History     #/history          every logged session  #/log/<id>   one of them
 *   Exercises   #/exercises[/<muscle>]   the library      #/exercise/<id>   one exercise
 *   Progress    #/progress         the last 7 days, sets per week, muscles and personal bests
 *
 * Beside the main column, a rail shows the body map for what the main column shows, or, in
 * Exercises on a large screen, the exercise picked from the list.
 */

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (text) =>
  String(text ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}" /></svg>`;
const pad = (n) => String(n).padStart(2, "0");

const ws = $("#ws");
const desk = $("#desk");
const rail = $("#rail");
const announcer = $("#announcer");
const picker = $("#picker");
const settings = $("#settings");
/** Large screens show the section list as a sidebar and the exercise detail beside the list. */
const wide = window.matchMedia("(min-width: 1024px)");

/** Read a message to screen-reader users. */
function say(text) {
  announcer.textContent = "";
  setTimeout(() => (announcer.textContent = text), 40);
}

let state = load();
let catalog = null;
let geometry = null;
const PAGE = 60;
const ui = {
  route: { section: "workouts", view: "home" },
  justFinished: null,
  focusName: false,
  notice: null,
  showAllBests: false,
  /** the library keeps its search, filters and place while you look at an exercise */
  library: { query: "", muscle: "", equipment: "", limit: PAGE, scrollY: 0 },
};

let saveTimer = 0;
const persist = () => {
  clearTimeout(saveTimer);
  save(state);
};
/** Typing saves a moment after the last key, not on every key. */
const persistSoon = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(state), 300);
};
addEventListener("pagehide", persist);

// ------------------------------------------------------------- units, numbers and dates
const LB = 2.20462;
const unit = () => state.settings.unit;
const shown = (kg) => (kg == null ? null : unit() === "lb" ? kg * LB : kg);
const toKg = (value) => (value == null ? null : unit() === "lb" ? value / LB : value);
const trim = (n) => String(Math.round(n * 10) / 10);
const weight = (kg) => (kg == null ? "" : trim(shown(kg)));
const volume = (kg) => `${Math.round(shown(kg)).toLocaleString("en-GB")} ${unit()}`;
const readNumber = (text) => {
  const value = parseFloat(String(text).replace(",", "."));
  return Number.isFinite(value) && value >= 0 ? value : null;
};
/** Set counts on the body map are whole numbers. Secondary muscles count half, so they are rounded. */
const setsCount = (n) => {
  const value = Math.round(n);
  return `${value} ${value === 1 ? "set" : "sets"}`;
};
const setText = (set) => `${set.kg != null ? `${weight(set.kg)} ${unit()}` : "No weight"} × ${set.reps ?? "–"}`;
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short" });
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short" });
const dateFormat = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });
const startOfDay = (t) => new Date(t).setHours(0, 0, 0, 0);
/** When something last happened, always in the same voice: "today", "3 days ago", "on 15 Nov". */
function ago(t) {
  const days = Math.round((startOfDay(Date.now()) - startOfDay(t)) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 56) return `${Math.floor(days / 7)} ${days < 14 ? "week" : "weeks"} ago`;
  return `on ${dateFormat.format(t)}`;
}
const duration = (m) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${pad(m % 60)} min`);
function clock(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}
const REST_CHOICES = [30, 60, 90, 120, 180, 240];
const restLabel = (s) => (s < 60 ? `${s} s` : s % 60 ? `${Math.floor(s / 60)}:${pad(s % 60)} min` : `${s / 60} min`);

// ------------------------------------------------------------- lookups
const findRoutine = (id) => state.routines.find((routine) => routine.id === id);
const findSession = (id) => state.sessions.find((session) => session.id === id);
const exercise = (id) => catalog.byId.get(id);
const freshSets = (n) => Array.from({ length: n }, () => ({ kg: null, reps: null, done: false }));
const touch = (routine) => routine && (routine.updatedAt = Date.now());
const sortedRoutines = () => [...state.routines].sort((a, b) => b.updatedAt - a.updatedAt);
/** About how long a workout takes: each set is roughly 45 seconds of work plus its rest. */
const minutesFor = (routine) => Math.max(5, Math.round(routine.items.reduce((n, item) => n + item.sets * (item.rest + 45), 0) / 300) * 5);
/** The regions a list of exercises trains most, by sets. */
function topRegions(items, count, limit = 3) {
  const load = regionSets(items, catalog.byId, count);
  return Object.entries(load)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([region]) => region);
}
const isMuscleFilter = (value) => value === "cardio" || Object.hasOwn(REGION_NAME, value);
const libraryHref = () => (ui.library.muscle ? `#/exercises/${ui.library.muscle}` : "#/exercises");

// ------------------------------------------------------------- routes
function parseRoute() {
  const [view = "", raw = ""] = location.hash.replace(/^#\/?/, "").split("/");
  const id = decodeURIComponent(raw);
  switch (view) {
    case "workout":
      return id ? { section: "workouts", view: "editor", id } : { section: "workouts", view: "home" };
    case "session":
      return { section: "workouts", view: "session" };
    case "history":
      return { section: "history", view: "history" };
    case "log":
      return id ? { section: "history", view: "log", id } : { section: "history", view: "history" };
    case "exercises":
      return { section: "exercises", view: "library", muscle: id };
    case "exercise":
      return id ? { section: "exercises", view: "exercise", id } : { section: "exercises", view: "library", muscle: "" };
    case "progress":
      return { section: "progress", view: "progress" };
    default:
      return { section: "workouts", view: "home" };
  }
}
const go = (hash) => {
  if (location.hash === hash) render({ navigated: true });
  else location.hash = hash;
};
const replaceRoute = (hash) => history.replaceState(null, "", hash);
addEventListener("hashchange", () => render({ navigated: true }));
wide.addEventListener("change", () => render());

/** Draw the page for the current address. navigated: the address changed, so move focus to the new view. */
function render({ navigated = false } = {}) {
  if (!catalog) return;
  const route = parseRoute();
  const previous = ui.route;

  // the exercise library: a muscle in the address is the filter
  const filterBefore = ui.library.muscle;
  if (route.view === "library") ui.library.muscle = isMuscleFilter(route.muscle) ? route.muscle : "";
  if (route.view === "exercise" && !exercise(route.id)) {
    replaceRoute(libraryHref());
    return render({ navigated });
  }

  // on a large screen, picking another exercise only changes the rail: the list keeps its place
  const inLibrary = (view) => view === "library" || view === "exercise";
  const listStays = Boolean(
    wide.matches && inLibrary(previous.view) && inLibrary(route.view) && ui.library.muscle === filterBefore && desk.querySelector("#lib-list"),
  );
  if (previous.view === "library" && route.view === "exercise" && !wide.matches) ui.library.scrollY = scrollY;

  let html = null;
  let railMode = "map";
  let railOnPhone = false;
  switch (route.view) {
    case "editor": {
      const routine = findRoutine(route.id);
      if (routine) html = editorView(routine);
      railOnPhone = true;
      break;
    }
    case "session":
      if (state.active) html = sessionView(state.active);
      railOnPhone = true;
      break;
    case "log": {
      const session = findSession(route.id);
      if (session) html = logView(session);
      railOnPhone = true;
      break;
    }
    case "history":
      html = historyView();
      break;
    case "library":
      html = listStays ? "" : libraryView();
      break;
    case "exercise":
      if (wide.matches) {
        html = listStays ? "" : libraryView();
        railMode = "detail";
      } else html = exerciseView(exercise(route.id));
      break;
    case "progress":
      html = progressView();
      railMode = "none";
      break;
    default:
      html = homeView();
  }
  if (html === null) {
    // a workout that was deleted, or a session that has finished: go back to the start of its section
    replaceRoute(route.section === "history" ? "#/history" : "#/");
    return render({ navigated });
  }
  if (route.view !== "log") ui.justFinished = null;
  ui.route = route;

  const focused = desk.contains(document.activeElement) ? document.activeElement.id : "";
  if (!listStays) {
    desk.innerHTML = html;
    // a new view slides in; a redraw of the same view (a set checked off, a stepper) stays still
    if (navigated) desk.firstElementChild?.classList.add("is-new");
    desk.setAttribute("aria-label", deskLabel(route));
    if (route.view === "progress") fillProgressMap();
    if (route.view === "exercise" && !wide.matches) fillExerciseFigure(exercise(route.id));
  } else {
    for (const row of $$("#lib-list .ex-row", desk)) {
      if (row.dataset.ex === route.id) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    }
  }
  ws.dataset.rail = railMode;
  ws.dataset.railPhone = railOnPhone ? "show" : "hide";
  refreshChrome();

  if (navigated) {
    if (route.view === "exercise" && wide.matches) {
      $("#detail-title", rail)?.focus({ preventScroll: true });
    } else if (route.view === "library" && previous.view === "exercise") {
      // back from an exercise: the list is where you left it, and the keyboard is on the exercise you opened
      if (!wide.matches) scrollTo({ top: ui.library.scrollY, behavior: "instant" });
      (document.getElementById(`row-${previous.id}`) ?? $("#desk-title"))?.focus({ preventScroll: true });
    } else {
      // a new view starts at its top
      if (desk.getBoundingClientRect().top < 0) desk.scrollIntoView({ block: "start", behavior: "instant" });
      const name = ui.focusName && $("#routine-name");
      ui.focusName = false;
      if (name) {
        name.focus({ preventScroll: true });
        name.select();
      } else if (!listStays) (desk.querySelector("#desk-title") ?? desk.querySelector("#detail-title"))?.focus({ preventScroll: true });
    }
  } else if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
}

const deskLabel = (route) =>
  ({ home: "Your workouts", editor: "Edit workout", session: "Workout in progress", history: "History", log: "Logged workout", library: "Exercises", exercise: "Exercise", progress: "Progress" })[route.view];

/** Everything around the main column: the section list, the header counts, the clock and the rail. */
function refreshChrome() {
  $("#stat-logged").textContent = state.sessions.length;
  $("#stat-week").textContent = thisWeek(state.sessions).length;
  for (const link of $$(".sections__link")) {
    if (link.dataset.section === ui.route.section) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  }
  $('.sections__link[data-section="exercises"]').setAttribute("href", libraryHref());
  $("#live-dot").hidden = !state.active;
  $("#count-history").textContent = state.sessions.length || "";
  tick();
  refreshRail();
}

// ------------------------------------------------------------- shared pieces
function noticeMarkup() {
  const notes = [];
  if (!storageWorks) {
    notes.push(`<p class="banner banner--warn">${icon("alert")}<span>This browser is blocking storage, so your workouts last only until you close this tab.</span></p>`);
  }
  if (ui.notice) notes.push(`<p class="banner banner--warn">${icon("alert")}<span>${esc(ui.notice)}</span></p>`);
  ui.notice = null;
  return notes.join("");
}

const viewHead = (title, sub = "", action = "") => `<header class="view-head">
  <div class="view-head__text">
    <h2 class="view-head__title" id="desk-title" tabindex="-1">${esc(title)}</h2>
    ${sub ? `<p class="view-head__sub">${sub}</p>` : ""}
  </div>
  ${action}
</header>`;

const back = (href, label) => `<a class="back" href="${href}">${icon("chevron-left")}${esc(label)}</a>`;

// ------------------------------------------------------------- Workouts
function activeCard() {
  const session = state.active;
  if (!session) return "";
  const total = session.items.reduce((n, item) => n + item.sets.length, 0);
  const done = session.items.reduce((n, item) => n + doneSets(item).length, 0);
  return `<a class="active-card" href="#/session">
    <span class="live-dot" aria-hidden="true"></span>
    <span class="active-card__text">
      <span class="active-card__label">In progress</span>
      <b>${esc(session.name)}</b>
      <span class="active-card__meta"><span id="active-time">${clock(Date.now() - session.startedAt)}</span> · ${done} of ${plural(total, "set")}</span>
    </span>
    <span class="btn btn--gold">${icon("play")}Resume</span>
  </a>`;
}

function homeView() {
  const routines = sortedRoutines();
  return `<div class="view">
    ${noticeMarkup()}
    ${viewHead(
      "Your workouts",
      routines.length ? `${plural(routines.length, "workout")} saved` : "Build one, then start it when you train",
      `<button type="button" class="btn btn--gold" data-action="new-routine" id="new-routine">${icon("plus")}New workout</button>`,
    )}
    ${activeCard()}
    ${
      routines.length
        ? `<ul class="routine-grid">${routines.map(routineCard).join("")}</ul>`
        : `<div class="empty">
            <p class="empty__title">No workouts yet</p>
            <ol class="empty__steps">
              <li>Create a workout and add exercises from the list of 1,324.</li>
              <li>Press Start when you train and check off each set as you finish it.</li>
              <li>Your history fills in, and Progress shows what you worked.</li>
            </ol>
            <div class="empty__actions">
              <button type="button" class="btn btn--gold" data-action="new-routine" id="new-routine-empty">${icon("plus")}Create a workout</button>
              <a class="btn btn--ghost" href="#/exercises">${icon("list")}Browse exercises</a>
            </div>
          </div>`
    }
    <p class="view-foot">
      <button type="button" class="link-btn" data-action="start-empty" id="start-empty">${icon("play")}<span>Start an empty workout instead</span></button>
    </p>
  </div>`;
}

function routineCard(routine) {
  const sets = routine.items.reduce((n, item) => n + item.sets, 0);
  const last = state.sessions.find((session) => session.routineId === routine.id);
  const muscles = topRegions(routine.items, (item) => item.sets);
  const id = esc(routine.id);
  return `<li class="routine">
    <div class="routine__top">
      <h3 class="routine__name">${esc(routine.name)}</h3>
      <span class="routine__when">${last ? `Last done ${ago(last.endedAt)}` : "Not done yet"}</span>
    </div>
    ${muscles.length ? `<p class="routine__muscles">${muscles.map((region) => `<span class="tag">${esc(REGION_NAME[region])}</span>`).join("")}</p>` : ""}
    <p class="routine__meta">${routine.items.length ? `${plural(routine.items.length, "exercise")} · ${plural(sets, "set")} · about ${minutesFor(routine)} min` : "No exercises yet"}</p>
    <div class="routine__actions">
      <button type="button" class="btn btn--gold" data-action="start-routine" data-id="${id}" id="start-${id}" ${routine.items.length ? "" : "disabled"}>${icon("play")}Start<span class="sr-only"> ${esc(routine.name)}</span></button>
      <a class="btn btn--ghost" href="#/workout/${id}">${icon("pencil")}Edit<span class="sr-only"> ${esc(routine.name)}</span></a>
    </div>
  </li>`;
}

// ------------------------------------------------------------- building a workout
function editorView(routine) {
  const items = routine.items;
  const sets = items.reduce((n, item) => n + item.sets, 0);
  return `<div class="view">
    <header class="view-bar">
      ${back("#/", "Workouts")}
      <a class="btn btn--ghost btn--small" href="#/" id="editor-done">${icon("check")}Done</a>
    </header>
    <h2 class="sr-only" id="desk-title" tabindex="-1">Edit workout</h2>
    <label class="field">
      <span class="field__label">Workout name</span>
      <input class="field__input field__input--title" id="routine-name" data-bind="routine-name" value="${esc(routine.name)}" maxlength="60" autocomplete="off" />
    </label>
    <div class="section-head">
      <h3 class="section-title">Exercises</h3>
      <p class="section-head__meta" id="editor-meta">${items.length ? `${plural(items.length, "exercise")} · ${plural(sets, "set")} · about ${minutesFor(routine)} min` : ""}</p>
    </div>
    ${
      items.length
        ? `<ol class="plan">${items.map((item, i) => planItem(item, i, items.length)).join("")}</ol>`
        : `<div class="empty empty--small"><p>No exercises yet. Add a few to build the workout. Changes save as you go.</p></div>`
    }
    <button type="button" class="btn btn--wide btn--dashed" data-action="pick" id="add-exercises">${icon("plus")}Add exercises</button>
    <footer class="view-actions">
      <button type="button" class="btn btn--gold" data-action="start-routine" data-id="${esc(routine.id)}" id="start-routine" ${items.length ? "" : "disabled"}>${icon("play")}Start workout</button>
      <button type="button" class="btn btn--danger-ghost view-actions__end" data-action="delete-routine" data-id="${esc(routine.id)}" id="delete-routine">${icon("trash")}Delete workout</button>
    </footer>
  </div>`;
}

function planItem(item, i, count) {
  const ex = exercise(item.ex);
  const title = exerciseTitle(item.ex);
  return `<li class="plan__item" data-index="${i}">
    <div class="plan__head">
      <span class="plan__num" aria-hidden="true">${pad(i + 1)}</span>
      <div class="plan__what">
        <button type="button" class="plan__name" data-action="info" data-ex="${item.ex}" id="item-${i}-name">${esc(title)}</button>
        <span class="plan__muscle">${esc(ex ? `${muscleName(ex.target)} · ${capitalize(ex.equipment)}` : "")}</span>
      </div>
    </div>
    <div class="plan__fields">
      <div class="mini-field">
        <span id="item-${i}-sets-label">Sets</span>
        <div class="stepper" role="group" aria-labelledby="item-${i}-sets-label">
          <button type="button" class="stepper__btn" data-action="sets-down" id="item-${i}-fewer" ${item.sets <= 1 ? "disabled" : ""} aria-label="One set fewer">${icon("minus")}</button>
          <span class="stepper__value" aria-live="polite">${item.sets}</span>
          <button type="button" class="stepper__btn" data-action="sets-up" id="item-${i}-more" ${item.sets >= 20 ? "disabled" : ""} aria-label="One set more">${icon("plus")}</button>
        </div>
      </div>
      <label class="mini-field">
        <span>Reps</span>
        <input data-bind="reps" id="item-${i}-reps" value="${esc(item.reps)}" maxlength="12" autocomplete="off" />
      </label>
      <label class="mini-field">
        <span>Rest</span>
        <select data-bind="rest" id="item-${i}-rest">${REST_CHOICES.map((s) => `<option value="${s}"${s === item.rest ? " selected" : ""}>${restLabel(s)}</option>`).join("")}</select>
      </label>
      ${itemTools("item", i, count, title)}
    </div>
  </li>`;
}

/** Move up, move down and remove: the same three buttons on a planned and a logged exercise. */
const itemTools = (prefix, i, count, title) => `<div class="item-tools">
  <button type="button" class="icon-btn" data-action="move-up" id="${prefix}-${i}-up" ${i === 0 ? "disabled" : ""} aria-label="Move ${esc(title)} up">${icon("arrow-up")}</button>
  <button type="button" class="icon-btn" data-action="move-down" id="${prefix}-${i}-down" ${i === count - 1 ? "disabled" : ""} aria-label="Move ${esc(title)} down">${icon("arrow-down")}</button>
  <button type="button" class="icon-btn icon-btn--danger" data-action="remove-item" id="${prefix}-${i}-remove" aria-label="Remove ${esc(title)}">${icon("trash")}</button>
</div>`;

// ------------------------------------------------------------- the workout in progress
function sessionView(session) {
  const total = session.items.reduce((n, item) => n + item.sets.length, 0);
  const done = session.items.reduce((n, item) => n + doneSets(item).length, 0);
  return `<div class="view session">
    <div class="session-bar" role="group" aria-label="Workout in progress">
      <span class="live-dot" aria-hidden="true"></span>
      <p class="session-bar__info">
        <b class="session-bar__clock"><span class="sr-only">Time so far: </span><span id="timer">${clock(Date.now() - session.startedAt)}</span></b>
        <span class="session-bar__count" id="session-count">${done} of ${plural(total, "set")}</span>
      </p>
      <span class="session-bar__progress" aria-hidden="true"><span style="width:${total ? (done / total) * 100 : 0}%"></span></span>
      <button type="button" class="btn btn--gold" data-action="finish" id="finish">${icon("check")}Finish</button>
    </div>
    <header class="view-bar">${back("#/", "Workouts")}</header>
    <h2 class="sr-only" id="desk-title" tabindex="-1">Workout in progress</h2>
    <label class="field">
      <span class="sr-only">Workout name</span>
      <input class="field__input field__input--title" id="session-name" data-bind="session-name" value="${esc(session.name)}" maxlength="60" autocomplete="off" />
    </label>
    ${
      session.items.length
        ? `<ol class="log">${session.items.map((item, i) => logItem(item, i, session)).join("")}</ol>`
        : `<div class="empty empty--small"><p>Add the exercises you are doing, then check off each set as you finish it.</p></div>`
    }
    <button type="button" class="btn btn--wide btn--dashed" data-action="pick" id="add-exercises">${icon("plus")}Add exercise</button>
    <footer class="view-actions">
      <button type="button" class="btn btn--danger-ghost view-actions__end" data-action="discard" id="discard">${icon("trash")}Discard workout</button>
    </footer>
    <div class="rest" id="rest" role="timer" aria-label="Rest"${rest.end ? "" : " hidden"}>
      <span class="rest__fill" id="rest-fill" aria-hidden="true"></span>
      <span class="rest__label">Rest</span>
      <b class="rest__time" id="rest-time">0:00</b>
      <span class="rest__buttons">
        <button type="button" class="rest__btn" data-action="rest-less" aria-label="15 seconds less">−15</button>
        <button type="button" class="rest__btn" data-action="rest-more" aria-label="15 seconds more">+15</button>
        <button type="button" class="rest__btn" data-action="rest-skip">Skip</button>
      </span>
    </div>
  </div>`;
}

function logItem(item, i, session) {
  const ex = exercise(item.ex);
  const title = exerciseTitle(item.ex);
  const last = lastTime(state.sessions, item.ex, session.id);
  const previous = last?.sets ?? [];
  const done = doneSets(item).length;
  const facts = [ex && muscleName(ex.target), item.goal && `Goal ${item.goal}`, last && `Last time ${ago(last.session.endedAt)}`].filter(Boolean);
  return `<li class="log__item${done === item.sets.length && done ? " is-complete" : ""}" data-index="${i}">
    <div class="log__head">
      <div class="log__what">
        <button type="button" class="log__name" data-action="info" data-ex="${item.ex}" id="log-${i}-name">${esc(title)}</button>
        <p class="log__meta">${esc(facts.join(" · "))}</p>
      </div>
      <span class="log__done"><span aria-hidden="true">${done}/${item.sets.length}</span><span class="sr-only">${done} of ${item.sets.length} sets done</span></span>
    </div>
    <table class="sets">
      <thead><tr><th scope="col">Set</th><th scope="col">Last time</th><th scope="col">${unit()}</th><th scope="col">Reps</th><th scope="col"><span class="sr-only">Done</span></th></tr></thead>
      <tbody>${item.sets.map((set, j) => setRow(set, j, previous[j], i)).join("")}</tbody>
    </table>
    <div class="log__actions">
      <button type="button" class="btn btn--ghost btn--small" data-action="add-set" id="log-${i}-add-set">${icon("plus")}Add set</button>
      <button type="button" class="btn btn--ghost btn--small" data-action="remove-set" id="log-${i}-remove-set" ${item.sets.length <= 1 ? "disabled" : ""}>${icon("minus")}Remove set</button>
      ${itemTools("log", i, session.items.length, title)}
    </div>
  </li>`;
}

function setRow(set, j, previous, i) {
  return `<tr class="${set.done ? "is-done" : ""}">
    <th scope="row">${j + 1}</th>
    <td class="sets__last">${previous ? esc(`${weight(previous.kg) || "–"} × ${previous.reps ?? "–"}`) : "–"}</td>
    <td><input class="sets__input" id="s-${i}-${j}-kg" data-bind="kg" data-set="${j}" inputmode="decimal" value="${weight(set.kg)}" placeholder="${previous ? weight(previous.kg) : ""}" aria-label="Set ${j + 1} weight in ${unit()}" autocomplete="off" /></td>
    <td><input class="sets__input" id="s-${i}-${j}-reps" data-bind="set-reps" data-set="${j}" inputmode="numeric" value="${set.reps ?? ""}" placeholder="${previous?.reps ?? ""}" aria-label="Set ${j + 1} reps" autocomplete="off" /></td>
    <td><button type="button" class="check" id="s-${i}-${j}-done" data-action="toggle-set" data-set="${j}" aria-pressed="${set.done}" aria-label="Set ${j + 1} done">${icon("check")}</button></td>
  </tr>`;
}

// ------------------------------------------------------------- History
function historyView() {
  if (!state.sessions.length) {
    return `<div class="view">
      ${noticeMarkup()}
      ${viewHead("History")}
      <div class="empty">
        <p class="empty__title">Nothing logged yet</p>
        <p>Finish a workout and it appears here, with every set you did and any new bests.</p>
        <div class="empty__actions"><a class="btn btn--gold" href="#/">${icon("dumbbell")}Go to your workouts</a></div>
      </div>
    </div>`;
  }
  const groups = new Map();
  for (const session of state.sessions) {
    const month = monthFormat.format(session.startedAt);
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(session);
  }
  return `<div class="view">
    ${noticeMarkup()}
    ${viewHead("History", `${plural(state.sessions.length, "workout")} logged`)}
    ${[...groups]
      .map(
        ([month, sessions]) => `<section class="history" aria-labelledby="m-${esc(month.replace(/\s/g, "-"))}">
          <h3 class="history__month" id="m-${esc(month.replace(/\s/g, "-"))}">${esc(month)} <span>${plural(sessions.length, "workout")}</span></h3>
          <ul class="history__list">${sessions.map(historyRow).join("")}</ul>
        </section>`,
      )
      .join("")}
  </div>`;
}

function historyRow(session) {
  const totals = sessionTotals(session);
  const bests = newBests(state.sessions, session).length;
  const date = new Date(session.startedAt);
  return `<li><a class="log-row" href="#/log/${esc(session.id)}">
    <span class="log-row__date" aria-hidden="true"><b>${date.getDate()}</b><small>${esc(weekdayFormat.format(date))}</small></span>
    <span class="log-row__main">
      <b>${esc(session.name)}</b>
      <small><span class="sr-only">${esc(dayFormat.format(date))}. </span>${duration(totals.minutes)} · ${plural(totals.sets, "set")} · ${volume(totals.volume)}</small>
    </span>
    ${bests ? `<span class="tag tag--best">${icon("trophy")}${bests}<span class="sr-only"> new ${bests === 1 ? "best" : "bests"}</span></span>` : ""}
    ${icon("chevron-right")}
  </a></li>`;
}

function logView(session) {
  const totals = sessionTotals(session);
  const bests = newBests(state.sessions, session);
  const best = new Set(bests.map((b) => b.ex));
  const saved = session.routineId && findRoutine(session.routineId);
  return `<div class="view">
    <header class="view-bar">${back("#/history", "History")}</header>
    ${ui.justFinished === session.id ? `<p class="banner banner--ok">${icon("check")}<span>Workout saved. Nice work.</span></p>` : ""}
    ${viewHead(session.name, `${esc(dayFormat.format(session.startedAt))}, ${esc(timeFormat.format(session.startedAt))}`)}
    <dl class="tiles">
      <div><dt>Time</dt><dd>${duration(totals.minutes)}</dd></div>
      <div><dt>Sets</dt><dd>${totals.sets}</dd></div>
      <div><dt>Lifted</dt><dd>${volume(totals.volume)}</dd></div>
      <div><dt>New bests</dt><dd>${bests.length}</dd></div>
    </dl>
    ${
      bests.length
        ? `<section class="bests" aria-labelledby="bests-title"><h3 class="section-title" id="bests-title">New bests</h3><ul>${bests
            .map((b) => `<li>${icon("trophy")}<span><b>${esc(exerciseTitle(b.ex))}</b> ${esc(setText(b.set))}<small>Best before: ${esc(setText(b.before))}</small></span></li>`)
            .join("")}</ul></section>`
        : ""
    }
    <section aria-labelledby="done-title">
      <h3 class="section-title" id="done-title">Exercises</h3>
      <ol class="done-list">${session.items
        .map((item) => {
          const ex = exercise(item.ex);
          return `<li class="done-list__item">
            <div class="done-list__head">
              <a class="done-list__name" href="#/exercise/${item.ex}">${esc(exerciseTitle(item.ex))}</a>
              ${best.has(item.ex) ? `<span class="tag tag--best">${icon("trophy")}Best</span>` : ""}
            </div>
            <p class="done-list__muscle">${esc(ex ? `${muscleName(ex.target)} · ${capitalize(ex.equipment)}` : "")}</p>
            <ol class="done-sets">${item.sets.map((set, j) => `<li><span aria-hidden="true">${j + 1}</span>${esc(setText(set))}</li>`).join("")}</ol>
          </li>`;
        })
        .join("")}</ol>
    </section>
    <footer class="view-actions">
      <button type="button" class="btn btn--gold" data-action="repeat" data-id="${esc(session.id)}" id="repeat">${icon("play")}Do it again</button>
      ${saved ? "" : `<button type="button" class="btn" data-action="save-routine" data-id="${esc(session.id)}" id="save-routine">${icon("plus")}Save as a workout</button>`}
      <button type="button" class="btn btn--danger-ghost view-actions__end" data-action="delete-log" data-id="${esc(session.id)}" id="delete-log">${icon("trash")}Delete</button>
    </footer>
  </div>`;
}

// ------------------------------------------------------------- Exercises
const muscleOptions = (value) =>
  `<option value="">All muscles</option>${REGIONS.map(([id, name]) => `<option value="${id}"${id === value ? " selected" : ""}>${esc(name)}</option>`).join("")}<option value="cardio"${value === "cardio" ? " selected" : ""}>Cardio</option>`;
const equipmentOptions = (value) =>
  `<option value="">All equipment</option>${catalog.equipment.map((e) => `<option value="${esc(e)}"${e === value ? " selected" : ""}>${esc(capitalize(e))}</option>`).join("")}`;
const muscleLabel = (value) => (value === "cardio" ? "cardio" : REGION_NAME[value]?.toLowerCase());
const countText = (count, muscle) => `${count.toLocaleString("en-GB")} ${count === 1 ? "exercise" : "exercises"}${muscle ? ` for ${muscleLabel(muscle)}` : ""}`;

/** Does an exercise pass the muscle and equipment filters? */
const passes = (filters) => (ex) =>
  (!filters.muscle || (filters.muscle === "cardio" ? ex.target === "cardiovascular system" : regionsOf(ex.target).includes(filters.muscle))) &&
  (!filters.equipment || ex.equipment === filters.equipment);

const libraryMatches = () => searchCatalog(catalog, ui.library.query, passes(ui.library));

function libraryRows(list, selected) {
  return list
    .map(
      (ex) => `<li><a class="ex-row" href="#/exercise/${ex.id}" data-ex="${ex.id}" id="row-${ex.id}"${ex.id === selected ? ' aria-current="true"' : ""}>
        <span class="ex-row__text"><b>${esc(ex.title)}</b><span>${esc(muscleName(ex.target))} · ${esc(capitalize(ex.equipment))}</span></span>
        ${icon("chevron-right")}
      </a></li>`,
    )
    .join("");
}

function libraryList() {
  const all = libraryMatches();
  const shown = all.slice(0, ui.library.limit);
  const selected = ui.route.view === "exercise" ? ui.route.id : parseRoute().id;
  return {
    count: countText(all.length, ui.library.muscle),
    rows:
      libraryRows(shown, selected) +
      (all.length > shown.length
        ? `<li class="list-more"><button type="button" class="btn btn--ghost" data-action="more">Show ${Math.min(PAGE, all.length - shown.length)} more</button></li>`
        : "") +
      (all.length ? "" : `<li class="list-none">No exercise matches. Try fewer words, or clear the muscle and equipment filters.</li>`),
  };
}

function libraryView() {
  const { count, rows } = libraryList();
  return `<div class="view">
    ${viewHead("Exercises", `${catalog.list.length.toLocaleString("en-GB")} exercises, with steps and the muscles they train`)}
    <div class="filters">
      <div class="search" role="search">
        <label class="sr-only" for="lib-search">Search exercises</label>
        ${icon("search")}
        <input id="lib-search" type="search" value="${esc(ui.library.query)}" placeholder="Search 1,324 exercises" autocomplete="off" spellcheck="false" enterkeyhint="search" />
      </div>
      <div class="filters__selects">
        <label class="select"><span class="select__label">Muscle</span><select id="lib-muscle">${muscleOptions(ui.library.muscle)}</select></label>
        <label class="select"><span class="select__label">Equipment</span><select id="lib-equipment">${equipmentOptions(ui.library.equipment)}</select></label>
      </div>
    </div>
    <div class="list-bar">
      <p class="list-count" id="lib-count" aria-live="polite">${esc(count)}</p>
      <div class="active-filters" id="lib-active">${activeFilters()}</div>
    </div>
    <ul class="ex-list" id="lib-list">${rows}</ul>
  </div>`;
}

/** The filters in use, each a chip that removes it. */
function activeFilters() {
  const chips = [];
  if (ui.library.muscle) chips.push(["muscle", ui.library.muscle === "cardio" ? "Cardio" : REGION_NAME[ui.library.muscle]]);
  if (ui.library.equipment) chips.push(["equipment", capitalize(ui.library.equipment)]);
  return chips
    .map(
      ([filter, label]) =>
        `<button type="button" class="filter-chip" data-action="clear-filter" data-filter="${filter}"><span class="sr-only">Remove the filter </span>${esc(label)}${icon("close")}</button>`,
    )
    .join("");
}

/** Redraw only the list, so the search box keeps its cursor. */
function refreshLibrary() {
  const { count, rows } = libraryList();
  $("#lib-count").textContent = count;
  $("#lib-list").innerHTML = rows;
  $("#lib-active").innerHTML = activeFilters();
  $('.sections__link[data-section="exercises"]').setAttribute("href", libraryHref());
  refreshRail();
}

function exerciseView(ex) {
  return `<div class="view">${exerciseDetail(ex, { inRail: false })}</div>`;
}

function exerciseDetail(ex, { inRail }) {
  const points = progress(state.sessions, ex.id).slice(-12);
  const best = bestSet(state.sessions, ex.id);
  const region = mainRegion(ex);
  const model = region && REGION_TO_MODEL[region];
  const also = ex.secondary.map(capitalize);
  return `<article class="ex-detail" aria-labelledby="detail-title">
    <div class="ex-detail__bar">
      ${inRail ? `<p class="eyebrow">Exercise</p><a class="icon-btn" href="${libraryHref()}" aria-label="Close this exercise">${icon("close")}</a>` : back(libraryHref(), "Exercises")}
    </div>
    <h2 class="ex-detail__title" id="detail-title" tabindex="-1">${esc(ex.title)}</h2>
    <p class="ex-detail__sub">${esc(muscleName(ex.target))} · ${esc(capitalize(ex.equipment))}</p>
    <div class="ex-detail__figure" data-figure-for="${ex.id}"></div>
    <ul class="ex-detail__key">
      <li><span class="key" style="background:${heatColour(1)}" aria-hidden="true"></span><span>Works: <b>${esc(muscleName(ex.target))}</b></span></li>
      ${also.length ? `<li><span class="key" style="background:${heatColour(0.5)}" aria-hidden="true"></span><span>Also: ${esc(also.join(", "))}</span></li>` : ""}
    </ul>
    <div class="ex-detail__actions">
      ${addToMenu(ex)}
      ${model ? `<a class="link-btn" href="./?muscle=${model}">${icon("cube")}<span>See it on the 3D model</span></a>` : ""}
    </div>
    <h3 class="section-title">How to do it</h3>
    <ol class="ex-steps">${ex.steps.map((step) => `<li><span>${esc(step)}</span></li>`).join("")}</ol>
    <h3 class="section-title">Your progress</h3>
    ${
      points.length && best
        ? `${sparkline(points, { weight, unit: unit(), esc })}<dl class="ex-best">
            <div><dt>Best set</dt><dd>${esc(setText(best))}</dd></div>
            <div><dt>Estimated max</dt><dd>${weight(best.score)} ${unit()}</dd></div>
            <div><dt>Logged</dt><dd>${plural(points.length, "time")}</dd></div>
          </dl>`
        : `<p class="ex-detail__none">Not logged yet. Your best set and a progress line appear here once you log it.</p>`
    }
  </article>`;
}

/** The Add to a workout menu of an exercise: the workout in progress, each saved workout, or a new one. */
function addToMenu(ex) {
  const options = [];
  if (state.active) options.push(["session", "play", `${state.active.name} (in progress)`]);
  for (const routine of sortedRoutines()) options.push([routine.id, "dumbbell", routine.name]);
  options.push(["new", "plus", "A new workout"]);
  return `<details class="menu">
    <summary class="btn btn--gold">${icon("plus")}Add to a workout${icon("chevron-down")}</summary>
    <ul class="menu__list">${options
      .map(([target, glyph, label]) => `<li><button type="button" class="menu__item" data-action="add-to" data-target="${esc(target)}" data-ex="${ex.id}">${icon(glyph)}<span>${esc(label)}</span></button></li>`)
      .join("")}</ul>
  </details>`;
}

// ------------------------------------------------------------- Progress
function progressView() {
  if (!state.sessions.length) {
    return `<div class="view">
      ${viewHead("Progress")}
      <div class="empty">
        <p class="empty__title">No progress to show yet</p>
        <p>Log a workout and this page shows your weeks, the muscles you trained and your personal bests.</p>
        <div class="empty__actions"><a class="btn btn--gold" href="#/">${icon("dumbbell")}Go to your workouts</a></div>
      </div>
    </div>`;
  }
  const week = thisWeek(state.sessions);
  let sets = 0;
  let lifted = 0;
  let time = 0;
  for (const session of week) {
    const totals = sessionTotals(session);
    sets += totals.sets;
    lifted += totals.volume;
    time += totals.minutes;
  }
  const load = weekLoad();
  const rows = Object.entries(load)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1]);
  const missing = MAIN_REGIONS.filter((region) => !load[region]);
  const bests = allBests();
  const shownBests = ui.showAllBests ? bests : bests.slice(0, 8);
  return `<div class="view">
    ${viewHead("Progress", "Your last 7 days, your weeks and your bests")}
    <section class="stat-card"aria-labelledby="p-week">
      <h3 class="section-title" id="p-week">Last 7 days</h3>
      <dl class="tiles">
        <div><dt>Workouts</dt><dd>${week.length}</dd></div>
        <div><dt>Sets</dt><dd>${sets}</dd></div>
        <div><dt>Lifted</dt><dd>${volume(lifted)}</dd></div>
        <div><dt>Time</dt><dd>${duration(time)}</dd></div>
      </dl>
    </section>
    <div class="progress-grid">
      <section class="stat-card"aria-labelledby="p-sets">
        <h3 class="section-title" id="p-sets">Sets per week</h3>
        ${weekBars(setsPerWeek(state.sessions, 8), { esc })}
      </section>
      <section class="stat-card"aria-labelledby="p-muscles">
        <h3 class="section-title" id="p-muscles">Muscles, last 7 days</h3>
        <div class="pmap">
          <div class="pmap__figure" data-week-map></div>
          <ul class="pmap__list">${
            rows.length
              ? rows
                  .slice(0, 8)
                  .map(
                    ([region, n]) =>
                      `<li><a class="map-row" href="#/exercises/${region}"><span class="map-row__swatch" style="background:${heatColour(Math.min(1, n / 10))}"></span><span class="map-row__name">${esc(REGION_NAME[region])}</span><b>${setsCount(n)}</b></a></li>`,
                  )
                  .join("")
              : `<li class="map-empty">No sets in the last 7 days.</li>`
          }</ul>
        </div>
        <p class="bodymap__legend">Full colour at 10 sets in 7 days. Secondary muscles count half.</p>
        ${missing.length ? `<p class="map-missing"><span>Not worked in 7 days:</span> ${missing.map((region) => `<a class="map-chip" href="#/exercises/${region}">${esc(REGION_NAME[region])}</a>`).join("")}</p>` : ""}
      </section>
    </div>
    <section class="stat-card"aria-labelledby="p-bests">
      <h3 class="section-title" id="p-bests">Personal bests</h3>
      <ol class="pb-list">${shownBests
        .map(
          ({ ex, best }) => `<li><a class="pb-row" href="#/exercise/${ex}">
            <span class="pb-row__name"><b>${esc(exerciseTitle(ex))}</b><small>Set ${ago(best.at)}</small></span>
            <span class="pb-row__set">${esc(setText(best))}</span>
            <span class="pb-row__max"><small>Est. max</small>${weight(best.score)} ${unit()}</span>
          </a></li>`,
        )
        .join("")}</ol>
      ${bests.length > 8 ? `<button type="button" class="btn btn--ghost btn--small" data-action="all-bests" id="all-bests" aria-expanded="${ui.showAllBests}">${ui.showAllBests ? "Show fewer" : `Show all ${bests.length}`}</button>` : ""}
    </section>
  </div>`;
}

/** The best set of every exercise ever logged, the most recent bests first. */
function allBests() {
  const ids = new Set(state.sessions.flatMap((session) => session.items.map((item) => item.ex)));
  return [...ids]
    .map((ex) => ({ ex, best: bestSet(state.sessions, ex) }))
    .filter(({ best }) => best)
    .sort((a, b) => b.best.at - a.best.at);
}

/** Sets per region over the last 7 days. */
function weekLoad() {
  const load = {};
  for (const session of thisWeek(state.sessions)) {
    for (const [region, sets] of Object.entries(regionSets(session.items, catalog.byId))) load[region] = (load[region] ?? 0) + sets;
  }
  return load;
}

// ------------------------------------------------------------- body maps
const figures = {};
/** A fresh copy of the body figure, made once per figure and copied after that. */
function figureCopy() {
  const figure = state.settings.figure;
  if (!figures[figure]) {
    const holder = document.createElement("div");
    holder.innerHTML = bodyMapMarkup(geometry, figure);
    figures[figure] = holder.firstElementChild;
  }
  return figures[figure].cloneNode(true);
}

function fillProgressMap() {
  const holder = $("[data-week-map]", desk);
  if (!holder) return;
  const svg = figureCopy();
  const load = weekLoad();
  paintBodyMap(svg, Object.fromEntries(Object.entries(load).map(([region, n]) => [region, Math.min(1, n / 10)])));
  holder.append(svg);
}

function fillExerciseFigure(ex, root = desk) {
  const holder = $(`[data-figure-for="${ex.id}"]`, root);
  if (!holder) return;
  const svg = figureCopy();
  svg.classList.add("bodymap__svg--static");
  paintBodyMap(svg, exerciseRegions(ex));
  holder.append(svg);
}

const MAIN_REGIONS = ["chest", "deltoids", "upper-back", "biceps", "triceps", "abs", "gluteal", "quadriceps", "hamstring", "calves"];
const relative = (load) => {
  const top = Math.max(0, ...Object.values(load));
  return Object.fromEntries(Object.entries(load).map(([region, sets]) => [region, top ? sets / top : 0]));
};

/** What the rail's map shows: the muscles of what the main column shows. */
function mapData() {
  const route = ui.route;
  const byId = catalog.byId;
  if (route.view === "editor") {
    const routine = findRoutine(route.id);
    const load = routine ? regionSets(routine.items, byId, (item) => item.sets) : {};
    return { context: "This workout", title: routine?.name || "New workout", load, shares: relative(load), legend: "Planned sets. Secondary muscles count half.", empty: "Add exercises to see which muscles this workout trains.", hint: "Tap a muscle to add exercises for it." };
  }
  if (route.view === "session" && state.active) {
    const planned = regionSets(state.active.items, byId, (item) => item.sets.length);
    const load = regionSets(state.active.items, byId);
    const top = Math.max(0, ...Object.values(planned));
    return {
      context: "Today",
      title: "Worked so far",
      load,
      shares: Object.fromEntries(Object.entries(load).map(([region, sets]) => [region, top ? sets / top : 0])),
      legend: "Fills in as you check off sets. Secondary muscles count half.",
      empty: "Check off a set and the muscles it trains light up.",
      hint: "Tap a muscle to add an exercise for it.",
    };
  }
  if (route.view === "log") {
    const session = findSession(route.id);
    const load = session ? regionSets(session.items, byId) : {};
    return { context: session ? dayFormat.format(session.startedAt) : "", title: "Muscles worked", load, shares: relative(load), legend: "Sets in this workout. Secondary muscles count half.", empty: "No sets in this workout.", hint: "Tap a muscle to see its exercises." };
  }
  if (route.view === "library" || route.view === "exercise") {
    const picked = ui.library.muscle;
    return {
      context: "Exercises",
      title: picked && picked !== "cardio" ? REGION_NAME[picked] : "Find by muscle",
      load: {},
      shares: picked && picked !== "cardio" ? { [picked]: 1 } : {},
      legend: "",
      empty: "",
      hint: picked ? "Tap another muscle, or the same one again to show every exercise." : "Tap a muscle to show its exercises.",
      filter: true,
    };
  }
  const load = weekLoad();
  return {
    context: "Last 7 days",
    title: "Muscles worked",
    load,
    shares: Object.fromEntries(Object.entries(load).map(([region, sets]) => [region, Math.min(1, sets / 10)])),
    legend: "Full colour at 10 sets in 7 days. Secondary muscles count half.",
    empty: "Log a workout and the muscles you trained light up here.",
    hint: "Tap a muscle to see its exercises.",
    week: true,
  };
}

let drawnFigure = null;
let mapLoad = {};

function refreshRail() {
  if (!geometry || !catalog) return;
  const mode = ws.dataset.rail;
  const detail = $("#rail-detail");
  const map = $("#rail-map");
  if (mode === "detail") {
    const ex = exercise(ui.route.id);
    map.hidden = true;
    detail.hidden = false;
    // redraw when the exercise changes, or anything it shows: the unit, the figure, the workouts to add it to
    const drawn = [ex.id, unit(), state.settings.figure, state.active?.name ?? "", state.sessions.length, ...state.routines.map((r) => r.id + r.name)].join("|");
    if (detail.dataset.drawn !== drawn) {
      detail.innerHTML = exerciseDetail(ex, { inRail: true });
      detail.dataset.drawn = drawn;
      fillExerciseFigure(ex, detail);
    }
    rail.setAttribute("aria-labelledby", "detail-title");
    return;
  }
  // empty, not only hidden: the exercise dialog uses the same ids for its own detail
  detail.hidden = true;
  detail.dataset.drawn = "";
  detail.innerHTML = "";
  map.hidden = false;
  rail.setAttribute("aria-labelledby", "map-title");
  if (mode === "none") return;

  const holder = $("#map-figure");
  if (drawnFigure !== state.settings.figure) {
    holder.querySelector("svg")?.remove();
    holder.prepend(figureCopy());
    drawnFigure = state.settings.figure;
  }
  const data = mapData();
  mapLoad = data.load;
  paintBodyMap(holder.querySelector("svg"), data.shares);
  holder.classList.toggle("is-filter", Boolean(data.filter));
  $("#map-context").textContent = data.context;
  $("#map-title").textContent = data.title;
  $("#map-legend").textContent = data.legend;
  $("#map-legend").hidden = !data.legend;
  $("#map-hint").textContent = data.hint;

  const rows = Object.entries(data.load)
    .filter(([, sets]) => sets > 0)
    .sort((a, b) => b[1] - a[1]);
  let html = "";
  if (data.filter) {
    html = ui.library.muscle
      ? `<li><button type="button" class="map-chip" data-action="clear-muscle">${icon("close")}Show every muscle</button></li>`
      : "";
  } else if (rows.length) {
    html = rows
      .map(
        ([region, sets]) => `<li><button type="button" class="map-row" data-region="${region}">
          <span class="map-row__swatch" style="background:${heatColour(data.shares[region])}"></span>
          <span class="map-row__name">${esc(REGION_NAME[region])}</span><b>${setsCount(sets)}</b>
        </button></li>`,
      )
      .join("");
    if (data.week) {
      const missing = MAIN_REGIONS.filter((region) => !data.load[region]);
      if (missing.length) {
        html += `<li class="map-missing"><span>Not worked in 7 days:</span> ${missing
          .map((region) => `<button type="button" class="map-chip" data-region="${region}">${esc(REGION_NAME[region])}</button>`)
          .join("")}</li>`;
      }
    }
  } else html = `<li class="map-empty">${esc(data.empty)}</li>`;
  $("#map-list").innerHTML = html;
}

/** A muscle picked on the rail's map or its list: what it leads to depends on the view. */
function pickRegion(region) {
  const view = ui.route.view;
  if (view === "editor") openPicker({ mode: "routine", muscle: region });
  else if (view === "session") openPicker({ mode: "session", muscle: region });
  else if (view === "library" || view === "exercise") setLibraryMuscle(ui.library.muscle === region ? "" : region);
  else go(`#/exercises/${region}`);
}

function setLibraryMuscle(value) {
  ui.library.muscle = value;
  ui.library.limit = PAGE;
  const select = $("#lib-muscle");
  if (select) select.value = value;
  if (ui.route.view === "library") replaceRoute(libraryHref());
  refreshLibrary();
  say(countText(libraryMatches().length, value));
}

const mapFigure = $("#map-figure");
const tip = $("#map-tip");
let hovered = null;

function pointAt(region, x, y) {
  const svg = mapFigure.querySelector("svg");
  if (region !== hovered) {
    hovered = region;
    if (svg) highlightRegion(svg, region);
  }
  if (!region) {
    tip.hidden = true;
    return;
  }
  const sets = mapLoad[region] ?? 0;
  tip.textContent = ui.route.view === "library" || ui.route.view === "exercise" ? REGION_NAME[region] : `${REGION_NAME[region]} · ${sets ? setsCount(sets) : "no sets"}`;
  tip.hidden = false;
  if (x != null) {
    const box = mapFigure.getBoundingClientRect();
    const left = Math.min(Math.max(8, x - box.left + 14), box.width - tip.offsetWidth - 8);
    const top = Math.max(8, y - box.top - tip.offsetHeight - 12);
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  }
}

mapFigure.addEventListener("pointermove", (event) => {
  if (event.pointerType !== "mouse") return;
  pointAt(event.target.closest?.(".bm-muscle")?.dataset.region ?? null, event.clientX, event.clientY);
});
mapFigure.addEventListener("pointerleave", () => pointAt(null));
mapFigure.addEventListener("click", (event) => {
  const region = event.target.closest?.(".bm-muscle")?.dataset.region;
  if (region) pickRegion(region);
});

const mapList = $("#map-list");
mapList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.action === "clear-muscle") setLibraryMuscle("");
  else if (button.dataset.region) pickRegion(button.dataset.region);
});
const listPoint = (event) => {
  const svg = mapFigure.querySelector("svg");
  if (svg) highlightRegion(svg, event.target.closest?.("[data-region]")?.dataset.region ?? null);
};
mapList.addEventListener("pointerover", listPoint);
mapList.addEventListener("focusin", listPoint);
const clearPoint = () => mapFigure.querySelector("svg") && highlightRegion(mapFigure.querySelector("svg"), null);
mapList.addEventListener("pointerleave", clearPoint);
mapList.addEventListener("focusout", clearPoint);

// ------------------------------------------------------------- toasts
/** A short note at the bottom of the screen, with an optional action such as Undo. */
function toast(text, { action = "", onAction = null } = {}) {
  const box = $("#toasts");
  const note = document.createElement("div");
  note.className = "toast";
  note.innerHTML = `<span class="toast__text">${esc(text)}</span>${action ? `<button type="button" class="toast__action">${esc(action)}</button>` : ""}`;
  let timer = 0;
  const close = () => {
    clearTimeout(timer);
    note.classList.add("is-leaving");
    setTimeout(() => note.remove(), 180);
  };
  note.querySelector(".toast__action")?.addEventListener("click", () => {
    onAction?.();
    close();
  });
  // keep the note while it is pointed at or focused, so there is time to press Undo
  note.addEventListener("pointerenter", () => clearTimeout(timer));
  note.addEventListener("pointerleave", () => (timer = setTimeout(close, 2500)));
  note.addEventListener("focusin", () => clearTimeout(timer));
  box.append(note);
  while (box.children.length > 3) box.firstElementChild.remove();
  timer = setTimeout(close, action ? 6000 : 3500);
}

// ------------------------------------------------------------- actions
function newRoutine(items = []) {
  const now = Date.now();
  const routine = { id: uid(), name: "New workout", items, createdAt: now, updatedAt: now };
  state.routines.push(routine);
  persist();
  return routine;
}

async function startSession({ routine = null, from = null } = {}) {
  if (state.active) {
    const discard = await confirmDialog({
      title: "A workout is already in progress",
      text: `Discard “${state.active.name}” and start a new one? Its sets will not be saved.`,
      ok: "Discard and start",
    });
    if (!discard) {
      go("#/session");
      return;
    }
  }
  let items = [];
  if (routine) {
    items = routine.items.map((item) => ({ ex: item.ex, rest: item.rest, goal: `${item.sets} × ${item.reps}`, sets: freshSets(item.sets) }));
  } else if (from) {
    items = from.items.map((item) => ({ ex: item.ex, rest: item.rest ?? 90, goal: null, sets: freshSets(item.sets.length || 3) }));
  }
  state.active = {
    id: uid(),
    routineId: routine?.id ?? from?.routineId ?? null,
    name: routine?.name ?? from?.name ?? "Workout",
    startedAt: Date.now(),
    endedAt: null,
    items,
  };
  persist();
  stopRest();
  go("#/session");
  say(`${state.active.name} started.`);
}

async function finishSession() {
  const session = state.active;
  if (!session) return;
  const done = session.items.reduce((n, item) => n + doneSets(item).length, 0);
  const waiting = session.items.reduce((n, item) => n + item.sets.filter((set) => !set.done && (set.kg != null || set.reps != null)).length, 0);
  if (!done) {
    const discard = await confirmDialog({ title: "No sets are checked off", text: "Only checked sets are saved, so there is nothing to save yet. Discard this workout?", ok: "Discard" });
    if (discard) discardSession();
    return;
  }
  if (waiting) {
    const finish = await confirmDialog({
      title: `${waiting} ${waiting === 1 ? "set is" : "sets are"} not checked off`,
      text: "Only checked sets are saved. Finish anyway?",
      ok: "Finish",
      danger: false,
    });
    if (!finish) return;
  }
  const finished = { ...session, endedAt: Date.now(), items: session.items.map((item) => ({ ...item, sets: doneSets(item) })).filter((item) => item.sets.length) };
  state.sessions.unshift(finished);
  state.active = null;
  persist();
  stopRest();
  ui.justFinished = finished.id;
  go(`#/log/${finished.id}`);
  say("Workout saved.");
}

function discardSession() {
  state.active = null;
  persist();
  stopRest();
  go("#/");
  say("Workout discarded.");
}

/** The list a moving or removing action works on: the workout being built or the one in progress. */
const currentItems = () => (ui.route.view === "editor" ? findRoutine(ui.route.id)?.items : ui.route.view === "session" ? state.active?.items : null);

function afterChange() {
  if (ui.route.view === "editor") touch(findRoutine(ui.route.id));
  persist();
  render();
}

function toggleSet(itemIndex, setIndex) {
  const item = state.active?.items[itemIndex];
  const set = item?.sets[setIndex];
  if (!set) return;
  if (!set.done) {
    // an empty set takes what was done last time, as the faint numbers in its boxes show
    const previous = lastTime(state.sessions, item.ex, state.active.id)?.sets[setIndex];
    if (set.kg == null && previous?.kg != null) set.kg = previous.kg;
    if (set.reps == null && previous?.reps != null) set.reps = previous.reps;
    if (set.reps == null) {
      say("Enter the reps first.");
      document.getElementById(`s-${itemIndex}-${setIndex}-reps`)?.focus();
      return;
    }
  }
  set.done = !set.done;
  persist();
  render();
  if (set.done) {
    say(`Set ${setIndex + 1} done.`);
    const more = state.active.items.some((i) => i.sets.some((s) => !s.done));
    if (more) startRest(item.rest);
  }
}

/** Add an exercise from the library to a workout: the one in progress, a saved one, or a new one. */
function addTo(target, exId) {
  const title = exerciseTitle(exId);
  if (target === "session" && state.active) {
    state.active.items.push({ ex: exId, rest: 90, goal: null, sets: freshSets(3) });
    persist();
    toast(`${title} added to the workout in progress.`, { action: "Open", onAction: () => go("#/session") });
  } else if (target === "new") {
    const routine = newRoutine([{ ex: exId, sets: 3, reps: "8-12", rest: 90 }]);
    ui.focusName = true;
    go(`#/workout/${routine.id}`);
    say(`New workout with ${title}.`);
  } else {
    const routine = findRoutine(target);
    if (!routine) return;
    routine.items.push({ ex: exId, sets: 3, reps: "8-12", rest: 90 });
    touch(routine);
    persist();
    toast(`${title} added to ${routine.name}.`, { action: "Open", onAction: () => go(`#/workout/${routine.id}`) });
  }
  for (const menu of $$("details.menu[open]")) menu.open = false;
}

async function onAction(button) {
  const action = button.dataset.action;
  const index = Number(button.closest("[data-index]")?.dataset.index);
  const id = button.dataset.id;
  const items = currentItems();

  switch (action) {
    case "new-routine":
      ui.focusName = true;
      go(`#/workout/${newRoutine().id}`);
      break;
    case "start-empty":
      startSession();
      break;
    case "start-routine": {
      const routine = findRoutine(id);
      if (routine?.items.length) startSession({ routine });
      break;
    }
    case "delete-routine": {
      const routine = findRoutine(id);
      if (!routine) break;
      const at = state.routines.indexOf(routine);
      state.routines.splice(at, 1);
      persist();
      go("#/");
      toast(`“${routine.name}” deleted.`, {
        action: "Undo",
        onAction: () => {
          state.routines.splice(at, 0, routine);
          persist();
          render();
          document.getElementById(`start-${routine.id}`)?.focus();
          say(`${routine.name} restored.`);
        },
      });
      break;
    }
    case "pick":
      openPicker({ mode: ui.route.view === "session" ? "session" : "routine" });
      break;
    case "info":
      openPicker({ mode: "browse", detail: button.dataset.ex, read: true });
      break;
    case "sets-up":
    case "sets-down": {
      const item = items?.[index];
      if (!item) break;
      item.sets = Math.min(20, Math.max(1, item.sets + (action === "sets-up" ? 1 : -1)));
      afterChange();
      break;
    }
    case "move-up":
    case "move-down": {
      const to = index + (action === "move-up" ? -1 : 1);
      if (!items || to < 0 || to >= items.length) break;
      [items[index], items[to]] = [items[to], items[index]];
      afterChange();
      // keep the keyboard on the item that moved: on the same arrow, or on the other one once it reaches an end
      const prefix = ui.route.view === "session" ? "log" : "item";
      const [same, other] = action === "move-up" ? ["up", "down"] : ["down", "up"];
      [same, other, "name"].map((what) => document.getElementById(`${prefix}-${to}-${what}`)).find((el) => el && !el.disabled)?.focus();
      say(`Moved to position ${to + 1}.`);
      break;
    }
    case "remove-item": {
      const item = items?.[index];
      if (!item) break;
      const prefix = ui.route.view === "session" ? "log" : "item";
      items.splice(index, 1);
      afterChange();
      // the button is gone: the keyboard goes to the next exercise, the one before, or Add
      [`${prefix}-${index}-remove`, `${prefix}-${index - 1}-remove`, "add-exercises"].map((id) => document.getElementById(id)).find(Boolean)?.focus();
      toast(`${exerciseTitle(item.ex)} removed.`, {
        action: "Undo",
        onAction: () => {
          const list = currentItems();
          if (!list) return;
          const at = Math.min(index, list.length);
          list.splice(at, 0, item);
          afterChange();
          document.getElementById(`${prefix}-${at}-name`)?.focus();
          say(`${exerciseTitle(item.ex)} is back.`);
        },
      });
      break;
    }
    case "toggle-set":
      toggleSet(index, Number(button.dataset.set));
      break;
    case "add-set": {
      const item = state.active?.items[index];
      if (!item) break;
      const last = item.sets.at(-1);
      item.sets.push({ kg: last?.kg ?? null, reps: last?.reps ?? null, done: false });
      afterChange();
      break;
    }
    case "remove-set": {
      const item = state.active?.items[index];
      if (!item || item.sets.length <= 1) break;
      item.sets.pop();
      afterChange();
      break;
    }
    case "finish":
      finishSession();
      break;
    case "discard": {
      const ok = await confirmDialog({ title: "Discard this workout?", text: "None of its sets will be saved." });
      if (ok) discardSession();
      break;
    }
    case "repeat": {
      const session = findSession(id);
      if (session) startSession({ from: session });
      break;
    }
    case "save-routine": {
      const session = findSession(id);
      if (!session) break;
      const routine = newRoutine(session.items.map((item) => ({ ex: item.ex, sets: item.sets.length || 3, reps: String(item.sets[0]?.reps ?? "8-12"), rest: item.rest ?? 90 })));
      routine.name = session.name;
      session.routineId = routine.id;
      persist();
      go(`#/workout/${routine.id}`);
      toast(`Saved as the workout “${routine.name}”.`);
      break;
    }
    case "delete-log": {
      const session = findSession(id);
      if (!session) break;
      const at = state.sessions.indexOf(session);
      state.sessions.splice(at, 1);
      persist();
      go("#/history");
      toast("Session deleted.", {
        action: "Undo",
        onAction: () => {
          state.sessions.splice(at, 0, session);
          persist();
          render();
          say("Session restored.");
        },
      });
      break;
    }
    case "more": {
      const first = ui.library.limit;
      ui.library.limit += PAGE;
      refreshLibrary();
      $$("#lib-list .ex-row")[first]?.focus();
      break;
    }
    case "add-to":
      addTo(button.dataset.target, button.dataset.ex);
      break;
    case "clear-filter":
      if (button.dataset.filter === "muscle") setLibraryMuscle("");
      else {
        ui.library.equipment = "";
        $("#lib-equipment").value = "";
        ui.library.limit = PAGE;
        refreshLibrary();
        say(countText(libraryMatches().length, ui.library.muscle));
      }
      // the chip is gone: keep the keyboard in the filters
      ($("#lib-active .filter-chip") ?? $("#lib-search"))?.focus();
      break;
    case "all-bests":
      ui.showAllBests = !ui.showAllBests;
      render();
      $("#all-bests")?.focus();
      break;
    case "rest-less":
      rest.end -= 15000;
      tickRest();
      break;
    case "rest-more":
      rest.end += 15000;
      rest.total += 15000;
      tickRest();
      break;
    case "rest-skip":
      stopRest();
      break;
  }
}

for (const root of [desk, rail]) {
  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (button && !button.disabled && button.tagName !== "A") onAction(button);
  });
}

// a menu closes when you press outside it, or Escape inside it
document.addEventListener("click", (event) => {
  for (const menu of $$("details.menu[open]")) if (!menu.contains(event.target)) menu.open = false;
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  const menu = event.target.closest?.("details.menu[open]");
  if (menu) {
    menu.open = false;
    menu.querySelector("summary").focus();
  }
});

// the Progress map leads to the exercises of a muscle
desk.addEventListener("click", (event) => {
  const region = event.target.closest?.("[data-week-map] .bm-muscle")?.dataset.region;
  if (region) go(`#/exercises/${region}`);
});

// typing into a field saves it, without redrawing the view under the cursor
desk.addEventListener("input", (event) => {
  if (event.target.id === "lib-search") {
    ui.library.query = event.target.value;
    ui.library.limit = PAGE;
    refreshLibrary();
    return;
  }
  const field = event.target.closest("[data-bind]");
  if (!field) return;
  const index = Number(field.closest("[data-index]")?.dataset.index);
  const value = field.value;
  switch (field.dataset.bind) {
    case "routine-name": {
      const routine = findRoutine(ui.route.id);
      if (!routine) return;
      routine.name = value.slice(0, 60);
      touch(routine);
      refreshRail();
      break;
    }
    case "reps": {
      const item = findRoutine(ui.route.id)?.items[index];
      if (item) item.reps = value.slice(0, 12);
      break;
    }
    case "session-name":
      if (state.active) state.active.name = value.slice(0, 60);
      break;
    case "kg":
    case "set-reps": {
      const set = state.active?.items[index]?.sets[Number(field.dataset.set)];
      if (!set) return;
      const number = readNumber(value);
      if (field.dataset.bind === "kg") set.kg = number == null ? null : Math.min(2000, toKg(number));
      else set.reps = number == null ? null : Math.min(1000, Math.round(number));
      break;
    }
    default:
      return;
  }
  persistSoon();
});

desk.addEventListener("change", (event) => {
  if (event.target.id === "lib-muscle") {
    setLibraryMuscle(event.target.value);
    return;
  }
  if (event.target.id === "lib-equipment") {
    ui.library.equipment = event.target.value;
    ui.library.limit = PAGE;
    refreshLibrary();
    say(countText(libraryMatches().length, ui.library.muscle));
    return;
  }
  const field = event.target.closest("[data-bind]");
  if (!field) return;
  const index = Number(field.closest("[data-index]")?.dataset.index);
  if (field.dataset.bind === "rest") {
    const item = findRoutine(ui.route.id)?.items[index];
    if (item) item.rest = Number(field.value) || 90;
    touch(findRoutine(ui.route.id));
    persist();
    const routine = findRoutine(ui.route.id);
    const meta = $("#editor-meta");
    if (meta && routine) meta.textContent = `${plural(routine.items.length, "exercise")} · ${plural(routine.items.reduce((n, i) => n + i.sets, 0), "set")} · about ${minutesFor(routine)} min`;
  } else if (field.dataset.bind === "routine-name" && !field.value.trim()) {
    const routine = findRoutine(ui.route.id);
    if (routine) routine.name = field.value = "New workout";
    persist();
  } else if (field.dataset.bind === "session-name" && !field.value.trim() && state.active) {
    state.active.name = field.value = "Workout";
    persist();
  }
});

desk.addEventListener("keydown", (event) => {
  // Enter in the library's search opens the first match
  if (event.target.id === "lib-search" && event.key === "Enter") {
    event.preventDefault();
    $("#lib-list .ex-row")?.click();
  }
});

// ------------------------------------------------------------- the clock and the rest timer
function tick() {
  if (!state.active) return;
  const time = clock(Date.now() - state.active.startedAt);
  const timer = $("#timer");
  if (timer) timer.textContent = time;
  const card = $("#active-time");
  if (card) card.textContent = time;
}
setInterval(tick, 1000);

const rest = { end: 0, total: 0, interval: 0, over: 0 };

function startRest(seconds) {
  if (!seconds) return;
  clearTimeout(rest.over);
  rest.total = seconds * 1000;
  rest.end = Date.now() + rest.total;
  clearInterval(rest.interval);
  rest.interval = setInterval(tickRest, 250);
  tickRest();
}

function stopRest() {
  clearInterval(rest.interval);
  clearTimeout(rest.over);
  rest.end = 0;
  const bar = $("#rest");
  if (bar) bar.hidden = true;
}

function tickRest() {
  const bar = $("#rest");
  const left = rest.end - Date.now();
  if (!rest.end) return;
  if (left <= 0) {
    clearInterval(rest.interval);
    rest.end = 0;
    if (bar) {
      bar.classList.add("is-over");
      $("#rest-time").textContent = "Go";
      $("#rest-fill").style.transform = "scaleX(0)";
    }
    navigator.vibrate?.(200);
    say("Rest over. Time for the next set.");
    rest.over = setTimeout(() => $("#rest") && ($("#rest").hidden = true), 4000);
    return;
  }
  if (!bar) return;
  bar.hidden = false;
  bar.classList.remove("is-over");
  $("#rest-time").textContent = clock(left + 999);
  $("#rest-fill").style.transform = `scaleX(${Math.min(1, left / rest.total)})`;
}

// ------------------------------------------------------------- adding exercises to a workout
const pick = { mode: "routine", query: "", muscle: "", equipment: "", limit: PAGE, detail: null, read: false, selected: [], scroll: 0 };

function setUpPicker() {
  $("#picker-muscle").innerHTML = muscleOptions("");
  $("#picker-equipment").innerHTML = equipmentOptions("");
}

const pickerMatches = () => searchCatalog(catalog, pick.query, passes(pick));

function openPicker({ mode = "routine", muscle = "", detail = null, read = false } = {}) {
  Object.assign(pick, { mode, query: "", muscle, equipment: "", limit: PAGE, detail, read, selected: [], scroll: 0 });
  $("#picker-search").value = "";
  $("#picker-muscle").value = muscle;
  $("#picker-equipment").value = "";
  renderPicker();
  if (!picker.open) picker.showModal();
  $("#picker-body").scrollTop = 0;
  (detail ? $("#detail-title", picker) : $("#picker-search"))?.focus();
}

function renderPicker() {
  const titles = { routine: "Add exercises", session: "Add to this workout", browse: "Exercise" };
  $("#picker-title").textContent = pick.read ? "Exercise" : titles[pick.mode];
  const detail = pick.detail ? exercise(pick.detail) : null;
  $("#picker-filters").hidden = Boolean(detail);
  $("#picker-count").hidden = $("#picker-list").hidden = Boolean(detail);
  $("#picker-detail").hidden = !detail;
  if (detail) {
    $("#picker-detail").innerHTML = pickerDetail(detail);
    fillExerciseFigure(detail, $("#picker-detail"));
  } else {
    const all = pickerMatches();
    const shown = all.slice(0, pick.limit);
    $("#picker-count").textContent = countText(all.length, pick.muscle);
    $("#picker-list").innerHTML =
      shown.map(pickRow).join("") +
      (all.length > shown.length ? `<li class="list-more"><button type="button" class="btn btn--ghost" data-action="more">Show ${Math.min(PAGE, all.length - shown.length)} more</button></li>` : "") +
      (all.length ? "" : `<li class="list-none">No exercise matches. Try fewer words, or clear the muscle and equipment filters.</li>`);
  }
  const count = pick.selected.length;
  $(".picker__foot").hidden = pick.read;
  $("#picker-picked").textContent = count ? `${count} selected` : "Select the exercises to add.";
  const done = $("#picker-done");
  done.disabled = !count;
  done.textContent = count ? `Add ${count}` : "Add";
}

function pickRow(ex) {
  const on = pick.selected.includes(ex.id);
  return `<li class="pick-row${on ? " is-selected" : ""}">
    <button type="button" class="ex-row" data-action="detail" data-ex="${ex.id}" id="pick-${ex.id}"><span class="ex-row__text"><b>${esc(ex.title)}</b><span>${esc(muscleName(ex.target))} · ${esc(capitalize(ex.equipment))}</span></span></button>
    <button type="button" class="pick-row__toggle" data-action="toggle-pick" data-ex="${ex.id}" id="toggle-${ex.id}" aria-pressed="${on}" aria-label="Select ${esc(ex.title)}">${icon(on ? "check" : "plus")}</button>
  </li>`;
}

/** An exercise inside the dialog: how to do it, and a Select button unless it is only being read. */
function pickerDetail(ex) {
  const on = pick.selected.includes(ex.id);
  const points = progress(state.sessions, ex.id).slice(-12);
  const best = bestSet(state.sessions, ex.id);
  return `<article class="ex-detail" aria-labelledby="detail-title">
    ${pick.read ? "" : `<button type="button" class="back" data-action="detail-back">${icon("chevron-left")}All exercises</button>`}
    <h3 class="ex-detail__title" id="detail-title" tabindex="-1">${esc(ex.title)}</h3>
    <p class="ex-detail__sub">${esc(muscleName(ex.target))} · ${esc(capitalize(ex.equipment))}</p>
    <div class="ex-detail__figure ex-detail__figure--small" data-figure-for="${ex.id}"></div>
    <h4 class="section-title">How to do it</h4>
    <ol class="ex-steps">${ex.steps.map((step) => `<li><span>${esc(step)}</span></li>`).join("")}</ol>
    ${points.length && best ? `<h4 class="section-title">Your progress</h4>${sparkline(points, { weight, unit: unit(), esc })}<p class="ex-detail__sub">Best set: ${esc(setText(best))}</p>` : ""}
    ${pick.read ? "" : `<button type="button" class="btn ${on ? "btn--selected" : "btn--gold"} btn--wide" data-action="toggle-pick" data-ex="${ex.id}" id="detail-toggle" aria-pressed="${on}">${icon(on ? "check" : "plus")}${on ? "Selected" : "Select"}</button>`}
  </article>`;
}

function applyPicked() {
  const ids = [...pick.selected];
  if (!ids.length) return;
  let focus = null;
  if (pick.mode === "routine") {
    const routine = findRoutine(ui.route.id);
    if (!routine) return;
    focus = `item-${routine.items.length}-name`;
    routine.items.push(...ids.map((ex) => ({ ex, sets: 3, reps: "8-12", rest: 90 })));
    touch(routine);
  } else if (pick.mode === "session" && state.active) {
    focus = `s-${state.active.items.length}-0-kg`;
    state.active.items.push(...ids.map((ex) => ({ ex, rest: 90, goal: null, sets: freshSets(3) })));
  } else return;
  pick.selected = [];
  persist();
  picker.close();
  render();
  document.getElementById(focus)?.focus();
  toast(`${plural(ids.length, "exercise")} added.`);
}

/** Closing with exercises selected asks first, so a stray tap does not lose them. */
async function closePicker() {
  if (pick.selected.length && !pick.read) {
    const discard = await confirmDialog({ title: `Discard ${plural(pick.selected.length, "selected exercise")}?`, text: "They have not been added to the workout yet.", ok: "Discard" });
    if (!discard) return;
  }
  pick.selected = [];
  picker.close();
}

$("#picker-search").addEventListener("input", (event) => {
  pick.query = event.target.value;
  pick.limit = PAGE;
  renderPicker();
  $("#picker-body").scrollTop = 0;
});
$("#picker-search").addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  $("#picker-list .ex-row")?.click();
});
for (const id of ["#picker-muscle", "#picker-equipment"]) {
  $(id).addEventListener("change", () => {
    pick.muscle = $("#picker-muscle").value;
    pick.equipment = $("#picker-equipment").value;
    pick.limit = PAGE;
    renderPicker();
    $("#picker-body").scrollTop = 0;
  });
}
picker.addEventListener("cancel", (event) => {
  // Escape: same as the close button
  event.preventDefault();
  closePicker();
});

picker.addEventListener("click", (event) => {
  // a click on the dimmed page around the dialog closes it
  if (event.target === picker) {
    closePicker();
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const id = button.dataset.ex;
  switch (button.dataset.action) {
    case "close-picker":
      closePicker();
      break;
    case "detail":
      pick.scroll = $("#picker-body").scrollTop;
      pick.detail = id;
      renderPicker();
      $("#picker-body").scrollTop = 0;
      $("#detail-title", picker)?.focus();
      break;
    case "detail-back": {
      const from = pick.detail;
      pick.detail = null;
      renderPicker();
      $("#picker-body").scrollTop = pick.scroll;
      document.getElementById(`pick-${from}`)?.focus({ preventScroll: true });
      break;
    }
    case "toggle-pick": {
      const at = pick.selected.indexOf(id);
      if (at >= 0) pick.selected.splice(at, 1);
      else pick.selected.push(id);
      const scroll = $("#picker-body").scrollTop;
      renderPicker();
      $("#picker-body").scrollTop = scroll;
      document.getElementById(pick.detail ? "detail-toggle" : `toggle-${id}`)?.focus({ preventScroll: true });
      say(`${exerciseTitle(id)} ${at >= 0 ? "unselected" : "selected"}. ${pick.selected.length} selected.`);
      break;
    }
    case "more": {
      const first = pick.limit;
      pick.limit += PAGE;
      renderPicker();
      $$("#picker-list .ex-row")[first]?.focus();
      break;
    }
    case "picker-done":
      applyPicked();
      break;
  }
});

// ------------------------------------------------------------- settings
function refreshSettings() {
  for (const button of $$("[data-unit]", settings)) button.setAttribute("aria-pressed", String(button.dataset.unit === unit()));
  for (const button of $$("[data-figure]", settings)) button.setAttribute("aria-pressed", String(button.dataset.figure === state.settings.figure));
  for (const button of $$("[aria-pressed]", settings)) button.classList.toggle("is-active", button.getAttribute("aria-pressed") === "true");
}

$("#open-settings").addEventListener("click", () => {
  refreshSettings();
  settings.showModal();
});
settings.addEventListener("click", (event) => {
  if (event.target === settings) {
    settings.close();
    return;
  }
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.action === "close-settings") settings.close();
  else if (button.dataset.unit) {
    state.settings.unit = button.dataset.unit === "lb" ? "lb" : "kg";
    persist();
    refreshSettings();
    render();
    say(state.settings.unit === "lb" ? "Weights in pounds." : "Weights in kilograms.");
  } else if (button.dataset.figure) {
    state.settings.figure = button.dataset.figure === "female" ? "female" : "male";
    persist();
    refreshSettings();
    render();
    say(`Body map shows the ${state.settings.figure} figure.`);
  } else if (button.dataset.action === "backup") downloadBackup();
  else if (button.dataset.action === "restore") $("#restore-file").click();
});

// ------------------------------------------------------------- confirming
function confirmDialog({ title, text, ok = "Delete", danger = true }) {
  const dialog = $("#confirm");
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  const okButton = $("#confirm-ok");
  okButton.textContent = ok;
  okButton.className = `btn ${danger ? "btn--danger" : "btn--gold"}`;
  dialog.returnValue = "";
  dialog.showModal();
  $("#confirm-cancel").focus();
  return new Promise((resolve) => dialog.addEventListener("close", () => resolve(dialog.returnValue === "ok"), { once: true }));
}

// ------------------------------------------------------------- backups
function downloadBackup() {
  const url = URL.createObjectURL(backupFile(state));
  const link = document.createElement("a");
  link.href = url;
  link.download = `first-rep-workouts-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast("Backup file saved.");
}

$("#restore-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    const data = await readBackup(file);
    const ok = await confirmDialog({
      title: "Restore this backup?",
      text: `It holds ${plural(data.routines.length, "workout")} and ${plural(data.sessions.length, "logged session")}. They replace everything saved in this browser now.`,
      ok: "Replace",
    });
    if (!ok) return;
    state = data;
    persist();
    stopRest();
    settings.close();
    go("#/");
    toast("Backup restored.");
  } catch (error) {
    settings.close();
    ui.notice = error.message;
    go("#/");
  }
});

// another tab of this page changed the data: show the same
addEventListener("storage", (event) => {
  if (event.key !== KEY) return;
  state = load();
  render();
});

// ------------------------------------------------------------- start
Promise.all([loadCatalog(), loadBodyMap()])
  .then(([loadedCatalog, loadedGeometry]) => {
    catalog = loadedCatalog;
    geometry = loadedGeometry;
    setUpPicker();
    render();
  })
  .catch((error) => {
    console.error("The exercise list could not load:", error);
    desk.innerHTML = `<p class="desk__loading">The exercise list could not load. Check your connection and reload the page.</p>`;
  });
