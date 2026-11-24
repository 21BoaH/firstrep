import "@fontsource/barlow/400.css";
import "@fontsource/barlow/400-italic.css";
import "@fontsource/barlow/500.css";
import "@fontsource/barlow/600.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./styles.css";

import { MUSCLES, MUSCLE_BY_ID, REGIONS } from "./data/muscles.js";
import { FASCIA_PRIMER, LANDMARKS, TISSUE } from "./data/tissue.js";
import { PARTS, partOf, partsOf } from "./data/parts.js";
import { CARE, SORENESS_NOTE } from "./data/care.js";
import { MUSCLE_LINK_LABEL, STRUCTURES, STRUCTURE_GROUPS } from "./data/structures.js";
import { DEMOS, HELPERS, MOTIONS, VESSEL } from "./data/work.js";
import { MODEL_TO_REGION } from "./training/muscles.js";

/** The layers of the model, in order. */
const LAYERS = {
  surface: "Surface muscles",
  deep: "Deep muscles. The covering muscles are lifted away.",
  skeleton: "Skeleton. Muscles are shown as glass, with bones, ligaments and nerves inside.",
};

/** The tabs of the detail panel, in order. */
const TABS = [
  ["exercises", "Exercises"],
  ["mechanics", "How it works"],
  ["tissue", "Fascia & care"],
];

/** Every structure that has a page, in list order: bones, ligaments, nerves, then fascia and tendons. */
const STRUCTURE_LIST = STRUCTURE_GROUPS.flatMap((group) =>
  Object.keys(STRUCTURES).filter((id) => group.kinds.includes(LANDMARKS[id]?.kind)),
);
const hasStructure = (id) => STRUCTURE_LIST.includes(id);

/**
 * Camera angle in degrees for structures the automatic framing gets wrong: those on the outer side
 * of a limb are best seen from the side, and the knee's inner ligaments from the front.
 */
const STRUCTURE_AZIMUTH = { lcl: 62, fibula: 55, "peroneal-nerve": 58, "ankle-ligaments": 68, mcl: 0, cruciates: 0, "deltoid-ligament": 0 };

const LAYER_NAMES = { surface: "Surface", deep: "Deep", skeleton: "Skeleton" };

/**
 * The body positions in the Pose menu, in menu order:
 * [id, name, short name for the button, what the pose shows].
 * After the relaxed stance, each is one position of an exercise: legs first, then the floor, then the arms.
 * The joint angles and the equipment of each pose live in the viewer.
 */
const POSE_LIST = [
  ["rest", "Relaxed", "Pose", "Standing at ease. Every exercise starts and ends here."],
  ["squat", "Squat", "Squat", "The bottom of a squat, with the quads and glutes at work."],
  ["lunge", "Lunge", "Lunge", "The bottom of a lunge with dumbbells. One thigh level, the other knee low."],
  ["deadlift", "Deadlift", "Deadlift", "The bottom of a Romanian deadlift. Hips back, hamstrings on stretch."],
  ["thrust", "Hip thrust", "Hip thrust", "The top of a hip thrust, upper back on a bench. The glutes at work."],
  ["calf", "Calf raise", "Calf raise", "The top of a calf raise, with the heels off the floor."],
  ["march", "March", "March", "A standing march. One knee lifted, standing on the other leg."],
  ["pushup", "Push-up", "Push-up", "The top of a push-up. One straight line from head to heels."],
  ["plank", "Plank", "Plank", "A front plank on the forearms. The abs hold the body straight."],
  ["curl", "Curl", "Curl", "The top of a dumbbell curl. Elbows folded, palms toward the shoulders."],
  ["press", "Shoulder press", "Press", "The start of a shoulder press. Dumbbells beside the head, forearms upright."],
  ["raise", "Lateral raise", "Lat raise", "The top of a lateral raise. Arms out to the sides, elbows soft."],
  ["triceps", "Triceps ext.", "Triceps", "The bottom of an overhead triceps extension. Elbows up, dumbbells behind the neck."],
  ["row", "Row", "Row", "The top of a bent-over row, with the elbows pulled back."],
  ["pullup", "Pull-up", "Pull-up", "The top of a pull-up. Elbows down and out, chin at the bar."],
];
/** The menu lays its tiles out in rows of this many, which the arrow keys follow. */
const POSE_COLUMNS = 3;

/** The muscles that help the main one in an exercise. */
const helpersOf = (m, ex) => (HELPERS[ex.name] ?? m.mechanics.partners).filter((id) => id !== m.id && MUSCLE_BY_ID.has(id));

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="#i-${name}" /></svg>`;
const pad = (n) => String(n).padStart(2, "0");
const regionLabel = (id) => REGIONS.find((r) => r.id === id).label;
const isPhone = () => window.matchMedia("(max-width: 799px)").matches;

const stageBlock = $("#stage-block");
const canvas = $("#stage");
const tooltip = $("#tooltip");
const panel = $("#panel");
const announcer = $("#announcer");
const jump = $("#jump");
const poseButton = $("#pose");
const poseMenu = $("#pose-menu");

const state = {
  selected: null,
  /** the head picked within the selected muscle, or null for the whole muscle */
  part: null,
  /** the bone, ligament, nerve, fascia or tendon whose page is open. Never set together with a muscle. */
  structure: null,
  /** what the list shows: "muscles" or "structures" */
  index: "muscles",
  /** exercise view: the index of the exercise of the selected muscle that is shown on the model, or null */
  exercise: null,
  /** is a movement playing on the model? */
  motion: false,
  pose: "rest",
  layer: "surface",
  tab: "exercises",
  viewer: null,
};

// ------------------------------------------------------------- static sections
function renderIndex() {
  const structures = state.index === "structures";
  const group = (id, label, items) =>
    `<div class="index__group"><h3 id="group-${id}">${esc(label)}</h3><ul class="index__list" aria-labelledby="group-${id}">${items}</ul></div>`;
  $("#index-groups").innerHTML = structures
    ? STRUCTURE_GROUPS.map((g) =>
        group(
          g.id,
          g.label,
          STRUCTURE_LIST.filter((id) => g.kinds.includes(LANDMARKS[id].kind))
            .map(
              (id) =>
                `<li><button type="button" class="chip chip--${LANDMARKS[id].kind.toLowerCase()}" data-structure="${id}" data-source="list" aria-pressed="${state.structure === id}">${esc(LANDMARKS[id].name)}</button></li>`,
            )
            .join(""),
        ),
      ).join("")
    : REGIONS.map((region) =>
        group(
          region.id,
          region.label,
          MUSCLES.filter((m) => m.region === region.id)
            .map(
              (m) =>
                `<li><button type="button" class="chip${m.deep ? " chip--deep" : ""}" data-muscle="${m.id}" data-source="list" aria-pressed="${state.selected === m.id}">${esc(m.name)}${m.deep ? '<span class="sr-only"> (deep layer)</span>' : ""}</button></li>`,
            )
            .join(""),
        ),
      ).join("");
  $("#index-title").textContent = structures ? "All structures" : "All muscles";
  for (const button of $$("[data-index]")) {
    const on = button.dataset.index === state.index;
    button.classList.toggle("is-active", on);
    button.setAttribute("aria-pressed", String(on));
  }
}

/** Show the muscles or the structures in the list. */
function setIndex(mode) {
  if (state.index === mode) return;
  state.index = mode;
  renderIndex();
  const box = $("#index-groups");
  box.scrollTop = 0;
  box.scrollLeft = 0;
}

function renderStats() {
  $("#stat-muscles").textContent = MUSCLES.length;
  $("#stat-exercises").textContent = MUSCLES.reduce((n, m) => n + m.exercises.length, 0);
}

// ------------------------------------------------------------- detail panel
function welcomeMarkup() {
  // (the exercise view and the movement demo are introduced on the muscle pages themselves)
  // one muscle for each of the four basic movement patterns
  const picks = [
    ["chest", "Your main push muscle"],
    ["lats", "Your main pull muscle"],
    ["quads", "They power the squat"],
    ["glutes", "They power the hinge"],
  ]
    .map(
      ([id, why]) =>
        `<button type="button" class="pick" data-muscle="${id}" data-source="list"><b>${esc(MUSCLE_BY_ID.get(id).name)}</b><span>${esc(why)}</span></button>`,
    )
    .join("");
  return `<div class="panel__inner welcome">
    <p class="eyebrow">Start here</p>
    <h2 id="panel-title" tabindex="-1">Pick a muscle</h2>
    <p class="welcome__lead">Knowing what a muscle does makes every exercise easier to learn. Choose one to see its job, how it moves the joint, its fascia, and three beginner exercises.</p>
    <ul class="tips">
      <li><span>${icon("pointer")}</span><p><strong>Drag</strong> the body to turn it, then <strong>click or tap</strong> any red muscle.</p></li>
      <li><span>${icon("list")}</span><p><strong>Prefer a list?</strong> Every muscle is in the muscle list too.</p></li>
      <li><span>${icon("layers")}</span><p><strong>Go deeper.</strong> Switch to Skeleton and click a bone, ligament or nerve to open its page.</p></li>
    </ul>
    <h3>Good first picks</h3>
    <div class="picks">${picks}</div>
  </div>`;
}

function chipList(ids) {
  return ids
    .map(
      (id) =>
        `<button type="button" class="chip" data-muscle="${id}" data-source="panel">${esc(MUSCLE_BY_ID.get(id).name)}</button>`,
    )
    .join("");
}

function detailMarkup(m) {
  const index = MUSCLES.indexOf(m);
  const exercises = m.exercises
    .map((ex, i) => {
      const helpers = helpersOf(m, ex);
      const on = state.exercise === i;
      return `<li class="ex${on ? " is-shown" : ""}" id="exercise-${i}">
        <div class="ex__head">
          <span class="ex__num" aria-hidden="true">${pad(i + 1)}</span>
          <h3 class="ex__name">${esc(ex.name)}</h3>
          <span class="ex__dose"><span class="sr-only">Sets and reps: </span>${esc(ex.dose)}</span>
        </div>
        <div class="ex__tags">
          <span class="tag ${ex.level === "Start here" ? "tag--start" : "tag--next"}">${esc(ex.level)}</span>
          <span class="tag">${esc(ex.equipment)}</span>
        </div>
        <ol class="ex__steps">${ex.steps.map((s) => `<li><span>${esc(s)}</span></li>`).join("")}</ol>
        <p class="ex__avoid">${icon("alert")}<span><strong>Avoid:</strong> ${esc(ex.avoid)}</span></p>
        <div class="ex__work">
          <button type="button" class="show-btn" data-exercise="${i}" aria-pressed="${on}">${icon("eye")}<span>${on ? "Showing on the model" : "Show on the model"}</span></button>
          <p class="ex__helpers">${
            helpers.length
              ? `<span>Also works</span>${helpers.map((id) => `<button type="button" class="chip" data-muscle="${id}" data-source="panel">${esc(MUSCLE_BY_ID.get(id).name)}</button>`).join("")}`
              : `<span>Works the ${esc(m.name.toLowerCase())} almost alone.</span>`
          }</p>
        </div>
      </li>`;
    })
    .join("");

  const mech = m.mechanics;
  const actions = mech.actions.map(([term, plain]) => `<div><dt>${esc(term)}</dt><dd>${esc(plain)}</dd></div>`).join("");
  const joints = mech.joints.map((j) => `<span class="tag">${esc(j)}</span>`).join("");
  const related = [
    mech.partners.length ? `<div class="related__row"><h4>Works with</h4><div class="related__chips">${chipList(mech.partners)}</div></div>` : "",
    mech.opposites.length ? `<div class="related__row"><h4>Works against</h4><div class="related__chips">${chipList(mech.opposites)}</div></div>` : "",
  ].join("");

  const tissue = TISSUE[m.id];
  const care = CARE[m.id];
  const seeNerve = LANDMARKS[care.supply.see];
  const seeVessel = LANDMARKS[VESSEL[m.id]];
  const demo = DEMOS[m.id];
  const demoBlock = demo
    ? `<div class="demo">
        <button type="button" class="show-btn show-btn--play" data-motion="${demo.motion}" data-works="${demo.works}" aria-pressed="false">${icon("play")}<span>Watch it work: ${esc(MOTIONS[demo.motion].label)}</span></button>
        <p>${esc(demo.say)}</p>
      </div>`
    : "";
  const hidden = (tab) => (state.tab === tab ? "" : "hidden");

  // the heads inside this muscle, each of which can be lit on its own
  const parts = partsOf(m.id);
  const partsBlock = parts.length
    ? `<div class="parts" role="group" aria-label="Parts of this muscle">
        <div class="parts__chips">${parts
          .map(
            (p) =>
              `<button type="button" class="chip${p.deep ? " chip--deep" : ""}" data-part="${p.id}" aria-pressed="${state.part === p.id}">${esc(p.name)}${p.deep ? '<span class="sr-only"> (deep layer)</span>' : ""}</button>`,
          )
          .join("")}</div>
        <p class="parts__note" id="part-note">${esc(partNote(m.id))}</p>
      </div>`
    : "";
  const tabs = TABS.map(([id, label]) => {
    const on = state.tab === id;
    return `<button type="button" class="tabs__tab" role="tab" id="tab-${id}" data-tab="${id}" aria-controls="tabpanel-${id}" aria-selected="${on}" tabindex="${on ? 0 : -1}">${esc(label)}</button>`;
  }).join("");

  return `<div class="panel__inner">
    <header class="panel__head">
      <div class="panel__meta">
        <span class="tag tag--region">${esc(regionLabel(m.region))}</span>
        <span class="panel__count" aria-label="Muscle ${index + 1} of ${MUSCLES.length}">${pad(index + 1)} / ${MUSCLES.length}</span>
        <div class="panel__nav">
          <button type="button" class="icon-btn" data-action="prev" aria-label="Previous muscle">${icon("chevron-left")}</button>
          <button type="button" class="icon-btn" data-action="next" aria-label="Next muscle">${icon("chevron-right")}</button>
          <button type="button" class="icon-btn" data-action="close" aria-label="Close and show the overview">${icon("close")}</button>
        </div>
      </div>
      <h2 class="panel__title" id="panel-title" tabindex="-1">${esc(m.name)}</h2>
      <p class="panel__latin">${esc(m.latin)}</p>
      <p class="panel__tagline">${esc(m.tagline)}</p>
    </header>
    ${partsBlock}
    <div class="tabs" role="tablist" aria-label="${esc(m.name)} details">${tabs}</div>
    <div class="panel__body">
      <section class="tabpanel" role="tabpanel" id="tabpanel-exercises" aria-labelledby="tab-exercises" tabindex="0" ${hidden("exercises")}>
        <p class="note"><strong>3 × 8–12</strong> means 3 sets of 8 to 12 repetitions. Rest one to two minutes between sets.</p>
        <ol class="ex-list">${exercises}</ol>
        ${
          MODEL_TO_REGION[m.id]
            ? `<a class="link-btn" href="./workouts.html#/exercises/${MODEL_TO_REGION[m.id]}">${icon("arrow-right")}<span>More ${esc(m.name.toLowerCase())} exercises, and log your sets</span></a>`
            : ""
        }
      </section>
      <section class="tabpanel" role="tabpanel" id="tabpanel-mechanics" aria-labelledby="tab-mechanics" tabindex="0" ${hidden("mechanics")}>
        <div class="job">
          <p class="job__label">Main job</p>
          <p class="job__text">${esc(mech.job)}</p>
        </div>
        ${demoBlock}
        <div class="mech">
          <h3 class="mech__title">Movements it produces</h3>
          <dl class="actions">${actions}</dl>
        </div>
        <div class="mech">
          <h3 class="mech__title">Where it attaches</h3>
          <div class="attach">
            <div class="attach__end"><b>Anchors on</b><span>${esc(mech.from)}</span></div>
            <div class="attach__arrow">${icon("arrow-right")}</div>
            <div class="attach__end"><b>Pulls on</b><span>${esc(mech.to)}</span></div>
          </div>
          <div class="joints"><span>Joints it crosses:</span>${joints}</div>
          <p class="dots-key"><span><i class="dot dot--from" aria-hidden="true"></i>Ring: where it anchors</span><span><i class="dot dot--to" aria-hidden="true"></i>Dot: where it pulls</span></p>
          <button type="button" class="link-btn" data-show-layer="skeleton">${icon("arrow-right")}<span>Show the attachment points on the skeleton</span></button>
        </div>
        <div class="mech">
          <h3 class="mech__title">How the pull works</h3>
          <p>${esc(mech.lever)}</p>
        </div>
        <div class="mech">
          <h3 class="mech__title">Feel it working</h3>
          <p class="spot">${icon("hand")}<span><strong>Touch test:</strong> ${esc(care.feel)}</span></p>
        </div>
        <div class="mech">
          <h3 class="mech__title">Nerve and blood supply</h3>
          <dl class="supply">
            <div><dt>Nerve</dt><dd>${esc(care.supply.nerve)}</dd></div>
            <div><dt>Blood</dt><dd>${esc(care.supply.blood)}</dd></div>
          </dl>
          ${
            seeNerve
              ? `<button type="button" class="link-btn" data-structure="${care.supply.see}" data-source="panel">${icon("arrow-right")}<span>Read about the ${esc(seeNerve.name.toLowerCase())}</span></button>`
              : ""
          }
          ${
            seeVessel
              ? `<button type="button" class="link-btn" data-structure="${VESSEL[m.id]}" data-source="panel">${icon("arrow-right")}<span>Read about the ${esc(seeVessel.name.toLowerCase())}</span></button>`
              : ""
          }
        </div>
        <div class="mech">
          <h3 class="mech__title">You use it when</h3>
          <p>${esc(mech.daily)}</p>
        </div>
        <div class="related">${related}</div>
      </section>
      <section class="tabpanel" role="tabpanel" id="tabpanel-tissue" aria-labelledby="tab-tissue" tabindex="0" ${hidden("tissue")}>
        <details class="primer">
          <summary>What is fascia? ${icon("chevron-right")}</summary>
          <p>${esc(FASCIA_PRIMER)}</p>
        </details>
        <div class="mech">
          <h3 class="mech__title">Fascia and tendons</h3>
          <p>${esc(tissue.fascia)}</p>
          ${tissue.spot ? `<p class="spot">${icon("pointer")}<span><strong>On the model:</strong> ${esc(tissue.spot)}</span></p>` : ""}
        </div>
        <div class="mech">
          <h3 class="mech__title">How it is built</h3>
          <p>${esc(tissue.design)}</p>
        </div>
        <div class="mech">
          <h3 class="mech__title">What beginners notice</h3>
          <p>${esc(tissue.notice)}</p>
        </div>
        <div class="mech">
          <h3 class="mech__title">Soreness after training</h3>
          <dl class="timeline">
            <div><dt>Starts</dt><dd>12 to 24 hours later</dd></div>
            <div><dt>Peaks</dt><dd>${esc(care.soreness.peak)}</dd></div>
            <div><dt>Fades in</dt><dd>${esc(care.soreness.lasts)}</dd></div>
          </dl>
          <p><strong>You notice it when:</strong> ${esc(care.soreness.tell)}</p>
          <p class="note">${esc(SORENESS_NOTE)}</p>
        </div>
        <div class="mech">
          <h3 class="mech__title">Common injuries</h3>
          <p>${esc(care.injury.common)}</p>
          <p class="warning">${icon("alert")}<span><strong>Get it checked if:</strong> ${esc(care.injury.warning)}</span></p>
        </div>
        <div class="mech">
          <h3 class="mech__title">A simple stretch</h3>
          <div class="stretch">
            <b>${esc(tissue.stretch[0])}</b>
            <span>${esc(tissue.stretch[1])}</span>
          </div>
          <p class="note">Stretch gently. You should feel a pull, never pain.</p>
        </div>
      </section>
    </div>
  </div>`;
}

/** The page of a bone, ligament, nerve, fascia or tendon. One scrolling page, no tabs. */
function structureMarkup(id) {
  const mark = LANDMARKS[id];
  const s = STRUCTURES[id];
  const index = STRUCTURE_LIST.indexOf(id);
  const facts = s.facts.map(([term, plain]) => `<div><dt>${esc(term)}</dt><dd>${esc(plain)}</dd></div>`).join("");
  const layers = (state.viewer?.layersOfLandmark(id) ?? []).map((layer) => LAYER_NAMES[layer]);
  const where = layers.length
    ? `<div class="mech"><p class="spot">${icon("pointer")}<span><strong>On the model:</strong> it is lit in gold, on both sides of the body. You can see it in the ${esc(
        layers.length > 1 ? `${layers.slice(0, -1).join(", ")} and ${layers.at(-1)} layers` : `${layers[0]} layer`,
      )}.</span></p></div>`
    : "";
  const muscles = s.muscles.length
    ? `<div class="mech">
        <h3 class="mech__title">${esc(MUSCLE_LINK_LABEL[mark.kind])}</h3>
        <div class="related__chips">${chipList(s.muscles)}</div>
      </div>`
    : "";
  const related = (s.related ?? []).filter(hasStructure);
  const relatedBlock = related.length
    ? `<div class="mech">
        <h3 class="mech__title">Related structures</h3>
        <div class="related__chips">${related
          .map(
            (other) =>
              `<button type="button" class="chip chip--${LANDMARKS[other].kind.toLowerCase()}" data-structure="${other}" data-source="panel">${esc(LANDMARKS[other].name)}</button>`,
          )
          .join("")}</div>
      </div>`
    : "";
  const demoBlock = MOTIONS[s.motion]
    ? `<div class="demo">
        <button type="button" class="show-btn show-btn--play" data-motion="${s.motion}" data-works="in" aria-pressed="false">${icon("play")}<span>Watch it move: ${esc(MOTIONS[s.motion].label)}</span></button>
        <p>The model plays the movement on one side, so you can compare it with the side at rest.</p>
      </div>`
    : "";

  return `<div class="panel__inner">
    <header class="panel__head">
      <div class="panel__meta">
        <span class="tag tag--region">${esc(mark.kind)}</span>
        <span class="panel__count" aria-label="Structure ${index + 1} of ${STRUCTURE_LIST.length}">${pad(index + 1)} / ${STRUCTURE_LIST.length}</span>
        <div class="panel__nav">
          <button type="button" class="icon-btn" data-action="prev" aria-label="Previous structure">${icon("chevron-left")}</button>
          <button type="button" class="icon-btn" data-action="next" aria-label="Next structure">${icon("chevron-right")}</button>
          <button type="button" class="icon-btn" data-action="close" aria-label="Close and show the overview">${icon("close")}</button>
        </div>
      </div>
      <h2 class="panel__title" id="panel-title" tabindex="-1">${esc(mark.name)}</h2>
      <p class="panel__latin">${esc(s.latin)}</p>
      <p class="panel__tagline">${esc(mark.note)}</p>
    </header>
    <div class="panel__body panel__body--plain">
      <div class="job job--long">
        <p class="job__label">What it is</p>
        <p class="job__text">${esc(s.about)}</p>
      </div>
      ${where}
      ${demoBlock}
      <div class="mech">
        <h3 class="mech__title">Key facts</h3>
        <dl class="actions">${facts}</dl>
      </div>
      ${muscles}
      ${relatedBlock}
      <div class="mech">
        <h3 class="mech__title">When it goes wrong</h3>
        <p>${esc(s.problem.common)}</p>
        <p class="warning">${icon("alert")}<span><strong>Get it checked if:</strong> ${esc(s.problem.warning)}</span></p>
      </div>
      <div class="mech">
        <h3 class="mech__title">Looking after it</h3>
        <p class="spot">${icon("hand")}<span>${esc(s.care)}</span></p>
        <p class="note">This is general education, not a diagnosis.</p>
      </div>
    </div>
  </div>`;
}

/** The line under the part picker: the picked head's note, or a hint when none is picked. */
function partNote(id) {
  const part = partOf(id, state.part);
  if (part) return part.note;
  const count = partsOf(id).length;
  return `${count} parts. Pick one to light it up on the body, or click it on the model.`;
}

function renderPanel() {
  const m = MUSCLE_BY_ID.get(state.selected);
  panel.innerHTML = m ? detailMarkup(m) : state.structure ? structureMarkup(state.structure) : welcomeMarkup();
  panel.scrollTop = 0;
}

function setTab(tab, { focus = false } = {}) {
  state.tab = tab;
  for (const button of $$('[role="tab"]', panel)) {
    const on = button.dataset.tab === tab;
    button.setAttribute("aria-selected", String(on));
    button.tabIndex = on ? 0 : -1;
    if (on && focus) button.focus();
  }
  for (const section of $$('[role="tabpanel"]', panel)) {
    section.hidden = section.id !== `tabpanel-${tab}`;
  }
  // the panel scrolls as one piece: bring the tab row back to the top if it had scrolled past
  const inner = $(".panel__inner", panel);
  const tabs = $(".tabs", panel);
  if (inner && tabs && inner.scrollTop > tabs.offsetTop - 8) inner.scrollTop = tabs.offsetTop - 8;
}

// ------------------------------------------------------------- selection
function viewFor(m) {
  const { azimuth, y, zoom } = m.view;
  // The saved views are for the relaxed stance. In any other pose the muscle has moved, so the
  // viewer frames it where it is now.
  if (state.pose !== "rest") return state.viewer.muscleView(m.id, state.part, azimuth);
  return { azimuth, y, distance: state.viewer.fitDistance() * zoom };
}

/** Switch the model to "surface", "deep" or "skeleton". */
function setLayer(layer, { announce = true } = {}) {
  if (!LAYERS[layer]) return;
  state.layer = layer;
  state.viewer?.setLayer(layer);
  for (const button of $$("[data-layer]")) {
    const on = button.dataset.layer === layer;
    button.classList.toggle("is-active", on);
    button.setAttribute("aria-pressed", String(on));
  }
  stageBlock.dataset.shown = layer;
  $("#legend").hidden = layer === "surface";
  tooltip.classList.remove("is-visible");
  if (announce) announcer.textContent = LAYERS[layer];
}

/** If the muscle (or head) cannot be seen in the current layer, switch to one where it can. */
function revealInLayer(id, part) {
  if (!state.viewer || !id) return;
  const wanted = state.viewer.layerFor(id, part);
  if (wanted !== state.layer) setLayer(wanted, { announce: false });
}

/**
 * source: "model" (picked on the canvas), "list", "panel" or "url".
 * Anything but "model" also turns the camera to the muscle.
 * part: one head within the muscle, or null for the whole muscle.
 */
function select(id, source = "list", part = null) {
  const m = MUSCLE_BY_ID.get(id) ?? null;
  state.selected = m ? m.id : null;
  state.part = m && partOf(m.id, part) ? part : null;
  state.structure = null;
  resetWork();
  if (m) setIndex("muscles");

  if (state.viewer) {
    if (m && source !== "model") revealInLayer(m.id, state.part);
    state.viewer.select(state.selected, { part: state.part, focus: source !== "model", view: m ? viewFor(m) : undefined });
    if (!m) state.viewer.resetView();
  }

  for (const chip of $$("#index-groups .chip")) {
    chip.setAttribute("aria-pressed", String(Boolean(m) && chip.dataset.muscle === m.id));
  }
  if (m) revealChip($(`#index-groups .chip[data-muscle="${m.id}"]`));

  renderPanel();
  stageBlock.classList.toggle("has-selection", Boolean(m));
  if (m) stageBlock.classList.add("is-used");
  jump.hidden = !m;
  if (m) $("#jump-label").textContent = m.name;
  $("#jump-cta").textContent = "See exercises";

  syncUrl();

  const partName = partOf(state.selected, state.part)?.name;
  announcer.textContent = m
    ? `${m.name}${partName ? `, ${partName}` : ""} selected. ${m.exercises.length} exercises, how it works and its fascia are shown in the details panel.`
    : "Selection cleared.";

  // keep keyboard focus somewhere sensible after the panel was rebuilt
  if (source === "panel") showPanelTop();
}

/** After a link inside the panel replaced its content: move focus, and on a phone the page, to its top. */
function showPanelTop() {
  if (isPhone()) panel.scrollIntoView({ block: "start" });
  $("#panel-title", panel)?.focus({ preventScroll: true });
}

/**
 * Open the page of a bone, ligament, nerve, fascia or tendon and light it up on the model.
 * source: "model" (picked on the canvas), "list", "panel" or "url".
 */
function selectStructure(id, source = "list") {
  if (!hasStructure(id)) {
    select(null);
    return;
  }
  const mark = LANDMARKS[id];
  state.selected = null;
  state.part = null;
  state.structure = id;
  resetWork();

  if (state.viewer) {
    const wanted = state.viewer.layerForLandmark(id);
    if (wanted !== state.layer) setLayer(wanted, { announce: false });
    state.viewer.selectLandmark(id, { focus: source !== "model", azimuth: STRUCTURE_AZIMUTH[id] });
  }

  setIndex("structures");
  for (const chip of $$("#index-groups .chip")) {
    chip.setAttribute("aria-pressed", String(chip.dataset.structure === id));
  }
  revealChip($(`#index-groups .chip[data-structure="${id}"]`));

  renderPanel();
  stageBlock.classList.add("has-selection", "is-used");
  jump.hidden = false;
  $("#jump-label").textContent = mark.name;
  $("#jump-cta").textContent = "See details";
  clearTimeout(tooltipTimer);
  tooltip.classList.remove("is-visible");

  syncUrl();
  announcer.textContent = `${mark.name}, ${mark.kind.toLowerCase()}, selected. What it is, key facts and common problems are shown in the details panel.`;
  if (source === "panel") showPanelTop();
}

// ------------------------------------------------------------- exercise view, movement, pose
/** Forget the exercise view and stop any movement. The panel is about to be drawn again. */
function resetWork() {
  state.exercise = null;
  state.motion = false;
  state.viewer?.stopMotion();
  $("#stage-work").hidden = true;
  stageBlock.classList.remove("has-work");
}

/** The bar on the stage that says what the model is showing. */
function showWorkBar(name, detail) {
  $("#work-name").textContent = name;
  $("#work-detail").textContent = detail;
  $("#stage-work").hidden = false;
  stageBlock.classList.add("has-work", "is-used");
}

/** Bring the model into view on a phone, where it sits above the panel. */
function scrollToStage() {
  if (isPhone()) stageBlock.scrollIntoView({ block: "start" });
}

/**
 * Exercise view: light the main muscle bright and its helpers dim, for one exercise of the
 * selected muscle. Asking for the exercise that is already shown turns the view off.
 */
function showExercise(i, { scroll = true } = {}) {
  const m = MUSCLE_BY_ID.get(state.selected);
  const ex = m?.exercises[i];
  if (!ex) return;
  stopMotion();
  const off = state.exercise === i;
  state.exercise = off ? null : i;
  const helpers = off ? [] : helpersOf(m, ex);

  if (state.viewer) {
    // the whole muscle works, not one head of it
    state.part = null;
    for (const chip of $$("[data-part]", panel)) chip.setAttribute("aria-pressed", "false");
    const note = $("#part-note", panel);
    if (note) note.textContent = partNote(m.id);
    state.viewer.select(m.id, { part: null });
    state.viewer.setWork(off ? null : helpers);
    // step back to the whole body, seen from this muscle's side
    if (!off) state.viewer.flyTo({ azimuth: m.view.azimuth });
    syncUrl();
  }

  for (const card of $$(".ex", panel)) {
    const on = card.id === `exercise-${state.exercise}`;
    card.classList.toggle("is-shown", on);
    const button = $("[data-exercise]", card);
    button.setAttribute("aria-pressed", String(on));
    $("span", button).textContent = on ? "Showing on the model" : "Show on the model";
  }

  if (off) {
    $("#stage-work").hidden = true;
    stageBlock.classList.remove("has-work");
    announcer.textContent = `${m.name} alone is shown again.`;
    return;
  }
  const names = helpers.map((id) => MUSCLE_BY_ID.get(id).name);
  showWorkBar(ex.name, names.length ? `Bright: ${m.name}. Dim: ${names.join(", ")}.` : `Bright: ${m.name}. No real helpers.`);
  announcer.textContent = `${ex.name} on the model. Main muscle: ${m.name}.${names.length ? ` Helpers: ${names.join(", ")}.` : ""}`;
  if (scroll) scrollToStage();
}

/** Play a movement on the model, or stop it if it is the one playing. */
function toggleMotion(button) {
  if (!state.viewer) return;
  const name = button.dataset.motion;
  const wasOn = button.getAttribute("aria-pressed") === "true";
  stopMotion();
  if (wasOn) return;
  // one thing at a time on the model
  if (state.exercise !== null) showExercise(state.exercise, { scroll: false });
  // the movements are built on the relaxed stance
  if (state.pose !== "rest") setPose("rest", { announce: false });
  const motion = MOTIONS[name];
  if (!state.viewer.playMotion(name, { works: button.dataset.works })) return;
  state.motion = true;
  state.viewer.flyTo({ azimuth: motion.view.azimuth, y: motion.view.y, distance: state.viewer.fitDistance() * motion.view.zoom });
  button.setAttribute("aria-pressed", "true");
  $("use", button).setAttribute("href", "#i-stop");
  $("span", button).textContent = "Stop the movement";
  const title = $("#panel-title", panel)?.textContent ?? "";
  showWorkBar(title, `Playing: ${motion.label}, on one side.`);
  announcer.textContent = `The model plays the movement: ${motion.label}.`;
  scrollToStage();
}

/** Stop the movement and put its button back. Also runs when the movement ends by itself. */
function stopMotion() {
  if (!state.motion) return;
  state.motion = false;
  state.viewer?.stopMotion();
  for (const button of $$("[data-motion]", panel)) {
    if (button.getAttribute("aria-pressed") !== "true") continue;
    button.setAttribute("aria-pressed", "false");
    $("use", button).setAttribute("href", "#i-play");
    const label = MOTIONS[button.dataset.motion].label;
    $("span", button).textContent = `${state.structure ? "Watch it move" : "Watch it work"}: ${label}`;
  }
  if (state.exercise === null) {
    $("#stage-work").hidden = true;
    stageBlock.classList.remove("has-work");
  }
}

// ------------------------------------------------------------- pose menu
/** One tile for each pose: a stick figure and a name. The hint under the grid explains the tile in focus. */
function renderPoseMenu() {
  poseMenu.innerHTML = `<p class="pose-menu__title" id="pose-menu-title">Choose a pose</p>
    <div class="pose-menu__grid" role="menu" aria-labelledby="pose-menu-title">${POSE_LIST.map(
      ([id, name, , hint]) =>
        `<button type="button" class="pose-tile" role="menuitemradio" aria-checked="${id === state.pose}" aria-describedby="pose-about-${id}" data-pose="${id}" tabindex="-1">${icon(`pose-${id}`)}<span>${esc(name)}</span><span id="pose-about-${id}" hidden>${esc(hint)}</span></button>`,
    ).join("")}</div>
    <p class="pose-menu__hint" id="pose-hint" aria-hidden="true"></p>`;
}

function showPoseHint(id) {
  const hint = POSE_LIST.find(([pose]) => pose === id)?.[3];
  if (hint) $("#pose-hint").textContent = hint;
}

/**
 * The menu has to stay inside the stage. On a short stage it first drops its hint line, and if
 * that is not enough it scrolls.
 */
function fitPoseMenu() {
  if (poseMenu.hidden) return;
  const room = $(".stage__controls").getBoundingClientRect().top - stageBlock.getBoundingClientRect().top - 16;
  poseMenu.classList.remove("is-tight");
  poseMenu.style.maxHeight = "none";
  if (poseMenu.offsetHeight > room) poseMenu.classList.add("is-tight");
  poseMenu.style.maxHeight = `${Math.max(150, Math.round(room))}px`;
}

/** Move the keyboard to a tile and, if the menu scrolls, bring the tile into view inside it. */
function focusPoseTile(tile) {
  if (!tile) return;
  tile.focus({ preventScroll: true });
  const top = tile.offsetTop;
  const bottom = top + tile.offsetHeight;
  if (top < poseMenu.scrollTop + 8) poseMenu.scrollTop = top - 8;
  else if (bottom > poseMenu.scrollTop + poseMenu.clientHeight - 8) poseMenu.scrollTop = bottom - poseMenu.clientHeight + 8;
}

function openPoseMenu() {
  if (!state.viewer || !poseMenu.hidden) return;
  poseMenu.hidden = false;
  poseButton.setAttribute("aria-expanded", "true");
  stageBlock.classList.add("is-used");
  showPoseHint(state.pose);
  fitPoseMenu();
  // start on the pose in use, as a menu of choices does
  focusPoseTile($(`[data-pose="${state.pose}"]`, poseMenu));
}

/** focus: hand the keyboard back to the Pose button, for when the menu was closed from inside. */
function closePoseMenu({ focus = false } = {}) {
  if (poseMenu.hidden) return;
  poseMenu.hidden = true;
  poseButton.setAttribute("aria-expanded", "false");
  if (focus) poseButton.focus({ preventScroll: true });
}

/** Put the model in a pose from the menu. */
function setPose(id, { announce = true } = {}) {
  const entry = POSE_LIST.find(([pose]) => pose === id);
  if (!entry || !state.viewer) return;
  const [, name, short, hint] = entry;
  if (id !== state.pose) {
    stopMotion(); // a movement starts from the relaxed stance, so a new pose ends it
    state.pose = id;
    // Keep what is being studied in the picture. With nothing selected, or with an exercise lit
    // up across the body, show the whole figure.
    const m = state.exercise === null ? MUSCLE_BY_ID.get(state.selected) : null;
    state.viewer.setPose(id, { frame: !m && !state.structure });
    if (m) state.viewer.flyTo(viewFor(m));
    else if (state.structure) state.viewer.flyTo(state.viewer.landmarkView(state.structure, STRUCTURE_AZIMUTH[state.structure]));
    syncUrl();
  }
  $("#pose-label").textContent = short;
  poseButton.classList.toggle("is-active", id !== "rest");
  poseButton.setAttribute("aria-label", `Pose: ${name}. Choose a pose.`);
  for (const tile of $$("[data-pose]", poseMenu)) tile.setAttribute("aria-checked", String(tile.dataset.pose === id));
  if (announce) announcer.textContent = `${name} pose. ${hint}`;
}

// arrow keys walk the grid of tiles, Home and End jump to its ends, Escape closes the menu
poseMenu.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePoseMenu({ focus: true });
    // do not let this Escape clear the selected muscle as well
    event.stopPropagation();
    event.preventDefault();
    return;
  }
  const tiles = $$("[data-pose]", poseMenu);
  const last = tiles.length - 1;
  const i = Math.max(0, tiles.indexOf(document.activeElement));
  let next = null;
  if (event.key === "ArrowRight") next = i === last ? 0 : i + 1;
  else if (event.key === "ArrowLeft") next = i === 0 ? last : i - 1;
  else if (event.key === "ArrowDown") next = i + POSE_COLUMNS <= last ? i + POSE_COLUMNS : i % POSE_COLUMNS;
  else if (event.key === "ArrowUp") next = i - POSE_COLUMNS >= 0 ? i - POSE_COLUMNS : i + POSE_COLUMNS * Math.floor((last - i) / POSE_COLUMNS);
  else if (event.key === "Home") next = 0;
  else if (event.key === "End") next = last;
  if (next === null) return;
  focusPoseTile(tiles[next]);
  event.preventDefault();
});

// the arrow keys open the menu from its button, as they do on a menu button
poseButton.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
  openPoseMenu();
  event.preventDefault();
});

// the hint follows the pointer and the keyboard
const hintFromTile = (event) => {
  const tile = event.target.closest?.("[data-pose]");
  if (tile) showPoseHint(tile.dataset.pose);
};
poseMenu.addEventListener("pointerover", hintFromTile);
poseMenu.addEventListener("focusin", hintFromTile);
poseMenu.addEventListener("pointerleave", () => showPoseHint(document.activeElement?.dataset?.pose ?? state.pose));

// a press anywhere else, or the keyboard moving on, closes the menu
document.addEventListener("pointerdown", (event) => {
  if (!poseMenu.hidden && !event.target.closest("#pose-menu, #pose")) closePoseMenu();
});
poseMenu.addEventListener("focusout", (event) => {
  if (event.relatedTarget && !event.relatedTarget.closest("#pose-menu, #pose")) closePoseMenu();
});
// the stage changes size with the window, and on phones as the address bar comes and goes
window.addEventListener("resize", fitPoseMenu);

function syncUrl() {
  const url = new URL(window.location.href);
  for (const [key, value] of [
    ["muscle", state.selected],
    ["part", state.part],
    ["structure", state.structure],
    ["pose", state.pose === "rest" ? null : state.pose],
  ]) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  history.replaceState(null, "", url);
}

/** Light up one head of the selected muscle. Picking the active head again goes back to the whole muscle. */
function selectPart(partId) {
  const m = MUSCLE_BY_ID.get(state.selected);
  if (!m) return;
  state.part = state.part === partId || !partOf(m.id, partId) ? null : partId;
  revealInLayer(m.id, state.part);
  state.viewer?.select(m.id, { part: state.part });
  for (const chip of $$("[data-part]", panel)) chip.setAttribute("aria-pressed", String(chip.dataset.part === state.part));
  const note = $("#part-note", panel);
  if (note) note.textContent = partNote(m.id);
  syncUrl();
  const part = partOf(m.id, state.part);
  announcer.textContent = part ? `${part.name}. ${part.note}` : `Whole ${m.name} selected.`;
}

/** Scroll the muscle list, and only the list, until the chip is in view. The page itself stays put. */
function revealChip(chip) {
  const box = $("#index-groups");
  if (!chip) return;
  const c = chip.getBoundingClientRect();
  const b = box.getBoundingClientRect();
  const pad = 16;
  if (c.left < b.left + pad) box.scrollLeft -= b.left + pad - c.left;
  else if (c.right > b.right - pad) box.scrollLeft += c.right - (b.right - pad);
  if (c.top < b.top) box.scrollTop -= b.top - c.top + pad;
  else if (c.bottom > b.bottom) box.scrollTop += c.bottom - b.bottom + pad;
}

function step(delta) {
  if (state.structure) {
    const n = STRUCTURE_LIST.length;
    selectStructure(STRUCTURE_LIST[(STRUCTURE_LIST.indexOf(state.structure) + delta + n) % n], "list");
  } else {
    const i = MUSCLES.findIndex((m) => m.id === state.selected);
    select(MUSCLES[(i + delta + MUSCLES.length) % MUSCLES.length].id, "list");
  }
  $(`[data-action="${delta > 0 ? "next" : "prev"}"]`, panel)?.focus({ preventScroll: true });
}

// ------------------------------------------------------------- events
document.addEventListener("click", (event) => {
  const muscleButton = event.target.closest("[data-muscle]");
  if (muscleButton) {
    const id = muscleButton.dataset.muscle;
    const source = muscleButton.dataset.source ?? "list";
    // clicking the active chip in the list clears it again
    if (source === "list" && id === state.selected && muscleButton.classList.contains("chip")) select(null);
    else select(id, source);
    return;
  }

  const structureButton = event.target.closest("[data-structure]");
  if (structureButton) {
    const id = structureButton.dataset.structure;
    const source = structureButton.dataset.source ?? "list";
    // clicking the active chip in the list clears it again
    if (source === "list" && id === state.structure) select(null);
    else selectStructure(id, source);
    return;
  }

  const poseTile = event.target.closest("[data-pose]");
  if (poseTile) {
    setPose(poseTile.dataset.pose);
    closePoseMenu({ focus: true });
    return;
  }

  const index = event.target.closest("[data-index]")?.dataset.index;
  if (index) setIndex(index);

  const exercise = event.target.closest("[data-exercise]")?.dataset.exercise;
  if (exercise !== undefined) showExercise(Number(exercise));

  const motion = event.target.closest("[data-motion]");
  if (motion) toggleMotion(motion);

  // a link in the panel that sends the reader to a layer of the model
  const showLayer = event.target.closest("[data-show-layer]")?.dataset.showLayer;
  if (showLayer) {
    setLayer(showLayer);
    stageBlock.classList.add("is-used");
    scrollToStage();
  }

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "prev") step(-1);
  else if (action === "next") step(1);
  else if (action === "close") {
    select(null);
    $("#panel-title", panel)?.focus({ preventScroll: true });
  } else if (action === "clear-work") {
    stopMotion();
    if (state.exercise !== null) showExercise(state.exercise, { scroll: false });
  }

  const tab = event.target.closest('[role="tab"]');
  if (tab) setTab(tab.dataset.tab);

  const part = event.target.closest("[data-part]")?.dataset.part;
  if (part) selectPart(part);

  const layer = event.target.closest("[data-layer]")?.dataset.layer;
  if (layer) {
    setLayer(layer);
    stageBlock.classList.add("is-used");
  }

  const result = event.target.closest("[data-result]");
  if (result) pickResult(searchState.results[Number(result.dataset.result)]);

  const view = event.target.closest("[data-view]")?.dataset.view;
  if (view && state.viewer) {
    state.viewer.flyTo({ azimuth: view === "front" ? 0 : 180 });
    stageBlock.classList.add("is-used");
  }

  const tool = event.target.closest("[data-tool]")?.dataset.tool;
  if (tool && state.viewer) {
    if (tool === "pose") {
      if (poseMenu.hidden) openPoseMenu();
      else closePoseMenu();
    } else if (tool === "zoom-in") state.viewer.zoom(0.8);
    else if (tool === "zoom-out") state.viewer.zoom(1.25);
    else state.viewer.resetView();
  }
});

// arrow keys move between the tabs, Home and End jump to the first and last
panel.addEventListener("keydown", (event) => {
  if (!event.target.matches('[role="tab"]')) return;
  const ids = TABS.map(([id]) => id);
  const i = ids.indexOf(state.tab);
  let next = null;
  if (event.key === "ArrowRight") next = ids[(i + 1) % ids.length];
  else if (event.key === "ArrowLeft") next = ids[(i - 1 + ids.length) % ids.length];
  else if (event.key === "Home") next = ids[0];
  else if (event.key === "End") next = ids[ids.length - 1];
  if (!next) return;
  setTab(next, { focus: true });
  event.preventDefault();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && (state.selected || state.structure) && event.target.closest("#map")) select(null);
});

// pointing at a name in a list lights the muscle up on the body
const hoverFromList = (event) => {
  if (!state.viewer) return;
  const button = event.target.closest?.("[data-muscle], [data-part]");
  if (!button) return;
  if (button.dataset.part) state.viewer.setHover(state.selected, button.dataset.part);
  else state.viewer.setHover(button.dataset.muscle);
};
const clearHoverFromList = (event) => {
  if (event.target.closest?.("[data-muscle], [data-part]") && state.viewer) state.viewer.setHover(null);
};
document.addEventListener("pointerover", hoverFromList);
document.addEventListener("pointerout", clearHoverFromList);
document.addEventListener("focusin", hoverFromList);
document.addEventListener("focusout", clearHoverFromList);

jump.addEventListener("click", () => {
  panel.scrollIntoView({ block: "start" });
  $("#panel-title", panel)?.focus({ preventScroll: true });
});

canvas.addEventListener("pointerdown", () => stageBlock.classList.add("is-used"), { once: true });

let tooltipTimer = 0;

function placeTooltip(clientX, clientY) {
  const rect = stageBlock.getBoundingClientRect();
  const x = Math.max(8, Math.min(clientX - rect.left + 16, rect.width - tooltip.offsetWidth - 8));
  const y = Math.max(8, Math.min(clientY - rect.top - tooltip.offsetHeight - 14, rect.height - tooltip.offsetHeight - 8));
  tooltip.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  tooltip.classList.add("is-visible");
}

/** Hover label. A muscle shows its name; fascia, tendons and bones show a short note as well. */
function showTooltip(id, clientX, clientY, landmarkId, partId) {
  clearTimeout(tooltipTimer);
  const landmark = LANDMARKS[landmarkId];
  if (!id && !landmark) {
    tooltip.classList.remove("is-visible");
    return;
  }
  tooltip.classList.toggle("tooltip--note", !id);
  if (id) {
    const partName = partOf(id, partId)?.name;
    tooltip.textContent = (MUSCLE_BY_ID.get(id)?.name ?? "") + (partName ? ` · ${partName}` : "");
  }
  else tooltip.innerHTML = `<small>${esc(landmark.kind)}</small><b>${esc(landmark.name)}</b><span>${esc(landmark.note)}</span>`;
  placeTooltip(clientX, clientY);
}

/** A click or tap on fascia, a tendon, a bone, a ligament or a nerve opens its page. */
function showLandmark(landmarkId, clientX, clientY) {
  if (hasStructure(landmarkId)) {
    selectStructure(landmarkId, "model");
    return;
  }
  // a label without a page: keep its note up for a few seconds, so touch users can read it
  const landmark = LANDMARKS[landmarkId];
  if (!landmark) return;
  showTooltip(null, clientX, clientY, landmarkId);
  announcer.textContent = `${landmark.name}. ${landmark.kind}. ${landmark.note}`;
  tooltipTimer = setTimeout(() => tooltip.classList.remove("is-visible"), 4500);
}

// ------------------------------------------------------------- search
const searchInput = $("#search");
const searchBox = $("#search-results");
const searchState = { results: [] };

/** Lower case, no accents, hyphens as spaces: "Push-up" and "push up" then match each other. */
const normalize = (text) =>
  String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[-–·]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Everything that can be found: every muscle, every head, every exercise and every structure.
 * A structure is also found by its common problem, so "ACL" or "sciatica" lead somewhere.
 */
const SEARCH_INDEX = [
  ...MUSCLES.flatMap((m) => [
    { type: "Muscle", muscle: m.id, part: null, label: m.name, sub: m.latin, extra: regionLabel(m.region) },
    ...(PARTS[m.id] ?? []).map((p) => ({ type: "Part", muscle: m.id, part: p.id, label: p.name, sub: `Part of ${m.name}`, extra: "" })),
    ...m.exercises.map((ex, i) => ({ type: "Exercise", muscle: m.id, exercise: i, label: ex.name, sub: `${m.name} · ${ex.equipment}`, extra: ex.level })),
  ]),
  ...STRUCTURE_LIST.map((id) => ({
    type: LANDMARKS[id].kind,
    structure: id,
    label: LANDMARKS[id].name,
    sub: STRUCTURES[id].latin,
    extra: `${LANDMARKS[id].kind} ${STRUCTURES[id].problem.common}`,
  })),
].map((entry) => ({ ...entry, key: normalize(entry.label), all: normalize(`${entry.label} ${entry.sub} ${entry.extra}`) }));

function findMatches(query) {
  const q = normalize(query);
  const tokens = q.split(" ").filter(Boolean);
  if (!tokens.length) return [];
  const order = { Muscle: 0, Part: 1, Exercise: 3 }; // structures sit between parts and exercises
  return SEARCH_INDEX.filter((entry) => tokens.every((token) => entry.all.includes(token)))
    .map((entry) => {
      // best: the name starts with what was typed; then a word in the name does; then anywhere in the name
      let score = 3;
      if (entry.key.startsWith(q)) score = 0;
      else if (entry.key.split(" ").some((word) => word.startsWith(tokens[0]))) score = 1;
      else if (entry.key.includes(tokens[0])) score = 2;
      // "sciatica" should still put the sciatic nerve ahead of structures that only mention it
      else if (entry.key.split(" ").some((word) => word.length > 3 && tokens[0].startsWith(word))) score = 2;
      return { entry, rank: score * 10 + (order[entry.type] ?? 2) };
    })
    .sort((a, b) => a.rank - b.rank || a.entry.label.localeCompare(b.entry.label))
    .map(({ entry }) => entry);
}

function renderSearch() {
  const query = searchInput.value.trim();
  const active = query.length > 0;
  $("#index-groups").hidden = active;
  searchBox.hidden = !active;
  if (!active) {
    searchState.results = [];
    searchBox.innerHTML = "";
    return;
  }
  const all = findMatches(query);
  const shown = all.slice(0, 30);
  searchState.results = shown;
  if (!all.length) {
    searchBox.innerHTML = `<p class="search__empty">No matches. Try a muscle, a bone, a nerve, an exercise, or equipment such as “dumbbell”.</p>`;
    announcer.textContent = "No matches.";
    return;
  }
  const count = `${all.length} ${all.length === 1 ? "match" : "matches"}${all.length > shown.length ? `, showing the first ${shown.length}` : ""}`;
  searchBox.innerHTML = `<p class="search__count">${count}</p><ul class="search__list">${shown
    .map(
      (entry, i) =>
        `<li><button type="button" class="result" data-result="${i}"><span class="result__type result__type--${entry.type.toLowerCase()}">${entry.type}</span><b>${esc(entry.label)}</b><span class="result__sub">${esc(entry.sub)}</span></button></li>`,
    )
    .join("")}</ul>`;
  announcer.textContent = count;
}

/** Open a search result: a muscle, one of its heads, a structure, or one exercise inside its muscle. */
function pickResult(entry) {
  if (!entry) return;
  if (entry.structure) {
    selectStructure(entry.structure, "list");
    return;
  }
  if (entry.type !== "Exercise") {
    select(entry.muscle, "list", entry.part);
    return;
  }
  state.tab = "exercises";
  select(entry.muscle, "list");
  const card = $(`#exercise-${entry.exercise}`, panel);
  if (!card) return;
  card.classList.add("is-found");
  showExercise(entry.exercise, { scroll: false });
  // On a phone the page itself scrolls to the card. On wider screens only the panel should
  // scroll, leaving the page where it is, so place the card just under the pinned tab row.
  const inner = $(".panel__inner", panel);
  if (isPhone() || !inner) card.scrollIntoView({ block: "center" });
  else inner.scrollTop = card.offsetTop - 76;
  announcer.textContent = `${entry.label}, an exercise for the ${MUSCLE_BY_ID.get(entry.muscle).name}, is highlighted in the details panel.`;
}

searchInput.addEventListener("input", renderSearch);
searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    pickResult(searchState.results[0]);
    event.preventDefault();
  } else if (event.key === "Escape" && searchInput.value) {
    // clear the search first; a second Escape then clears the selected muscle as usual
    searchInput.value = "";
    renderSearch();
    event.stopPropagation();
  }
});

function setSide(side) {
  for (const button of $$("[data-view]")) {
    const on = button.dataset.view === side;
    button.classList.toggle("is-active", on);
    button.setAttribute("aria-pressed", String(on));
  }
}

// ------------------------------------------------------------- start
const startParams = new URLSearchParams(window.location.search);
state.selected = MUSCLE_BY_ID.has(startParams.get("muscle")) ? startParams.get("muscle") : null;
state.part = partOf(state.selected, startParams.get("part")) ? startParams.get("part") : null;
state.structure = !state.selected && hasStructure(startParams.get("structure")) ? startParams.get("structure") : null;
if (state.structure) state.index = "structures";
const startPose = POSE_LIST.some(([id]) => id === startParams.get("pose")) ? startParams.get("pose") : "rest";
renderIndex();
renderStats();
renderPanel();
renderPoseMenu();

/** Light up whatever the link asked for, once the model is there (or has failed to start). */
const openFromUrl = () => {
  if (startPose !== "rest") setPose(startPose, { announce: false });
  if (state.selected) select(state.selected, "url", state.part);
  else if (state.structure) selectStructure(state.structure, "url");
};

// three.js is the heavy part of the page: load it after the interface is up
import("./scene/viewer.js")
  .then(({ MuscleViewer }) => {
    state.viewer = new MuscleViewer(canvas, {
      onHover: showTooltip,
      onSelect: (id, part) => select(id, "model", part),
      onLandmark: showLandmark,
      onSideChange: setSide,
      onMotionEnd: stopMotion,
    });
    stageBlock.classList.add("is-ready");
    $("#stage-loading").hidden = true;
    if (import.meta.env.DEV) window.__viewer = state.viewer; // handy in the console while developing
    openFromUrl();
  })
  .catch((error) => {
    console.error("The 3D viewer failed to start:", error);
    $("#stage-loading").hidden = true;
    $("#stage-error").hidden = false;
    $(".stage__controls").hidden = true;
    $(".stage__layers").hidden = true;
    $("#stage-hint").hidden = true;
    canvas.hidden = true;
    openFromUrl();
  });
