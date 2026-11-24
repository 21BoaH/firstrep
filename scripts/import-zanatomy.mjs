/*
 * Builds the 3D figure's anatomy from the Z-Anatomy Blender template (CC BY-SA 4.0, derived from
 * BodyParts3D, CC BY-SA 2.1 Japan). See src/data/zanatomy/NOTICE.md.
 *
 *   node scripts/import-zanatomy.mjs path/to/Z-Anatomy/Startup.blend
 *
 * Get Startup.blend from https://github.com/Z-Anatomy/Models-of-human-anatomy (unzip Z-Anatomy.zip).
 * Writes src/data/zanatomy/anatomy.bin: the meshes the site uses, simplified, placed on a figure
 * of the site's size and rigged to its pose skeleton. src/scene/realbody.js reads it.
 *
 * Steps
 *   1  take the objects listed in scripts/zanatomy/catalog.mjs; paired ones from the right side,
 *      mirrored onto the modeled half (+x), the figure's left
 *   2  turn Blender's z-up axes into the scene's y-up axes and scale the figure to 1.78 m
 *   3  simplify every mesh with meshoptimizer
 *   4  find the joint centres for the pose rig from the bones
 *   5  turn the forearm from the anatomical position (palm forward) to the site's relaxed stance
 *      (palm toward the thigh), the way the radius turns over the ulna
 *   6  give every soft-tissue vertex its weights on the segments of the rig
 *   7  merge what is drawn together, quantize, pack and compress
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateRawSync } from "node:zlib";
import * as THREE from "three";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { Blend } from "./zanatomy/blend.mjs";
import { ARTERIES, BONES, HEART, LIGAMENTS, MUSCLES, NERVES, SHELL, SURFACE, SURFACE_BONES, TISSUE, VEINS } from "./zanatomy/catalog.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/import-zanatomy.mjs path/to/Z-Anatomy/Startup.blend");
  process.exit(1);
}
await MeshoptSimplifier.ready;
await MeshoptEncoder.ready;
const started = Date.now();
const log = (...args) => console.log(`[${((Date.now() - started) / 1000).toFixed(1)}s]`, ...args);

const blend = new Blend(file);
log(`read ${file}: Blender ${blend.version}, ${blend.blocks.length} blocks`);

// ================================================================== 1. objects
const objects = new Map();
for (const block of blend.ids("OB")) {
  const at = block.data;
  objects.set(blend.idName(at, "Object"), { block, type: blend.field(at, "Object", "type"), data: blend.field(at, "Object", "data"), matrix: blend.field(at, "Object", "obmat") });
}
const missing = [];
const find = (name) => {
  if (objects.has(name + ".r")) return { object: objects.get(name + ".r"), paired: true };
  if (objects.has(name)) return { object: objects.get(name), paired: false };
  missing.push(name);
  return null;
};
const det3 = (e) => e[0] * (e[5] * e[10] - e[6] * e[9]) - e[4] * (e[1] * e[10] - e[2] * e[9]) + e[8] * (e[1] * e[6] - e[2] * e[5]);

/** Blender world space to the scene, before scaling: x stays (mirrored for paired parts), y = up, z = forward. */
function toScene(e, x, y, z, paired, out, i) {
  const wx = e[0] * x + e[4] * y + e[8] * z + e[12];
  const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
  const wz = e[2] * x + e[6] * y + e[10] * z + e[14];
  out[i] = paired ? -wx : wx;
  out[i + 1] = wz;
  out[i + 2] = -wy;
}

function materialNames(meshBlock) {
  const at = meshBlock.data;
  const n = blend.field(at, "Mesh", "totcol");
  const array = blend.block(blend.field(at, "Mesh", "mat"), meshBlock);
  const names = [];
  for (let i = 0; i < n; i++) {
    const material = array ? blend.block(blend.pointer(array.data + i * blend.ptr)) : null;
    names.push(material ? blend.idName(material.data, "Material") : "");
  }
  return names;
}

/** A mesh object in raw scene space: { positions, triangles, slots, slotNames, paired }. */
function extractMesh(name) {
  const found = find(name);
  if (!found) return null;
  const { object, paired } = found;
  if (object.type !== 1) throw new Error(`${name} is not a mesh`);
  const meshBlock = blend.block(object.data);
  const mesh = blend.mesh(meshBlock);
  const e = object.matrix;
  const n = mesh.positions.length / 3;
  const positions = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) toScene(e, mesh.positions[3 * i], mesh.positions[3 * i + 1], mesh.positions[3 * i + 2], paired, positions, 3 * i);
  const triangles = mesh.triangles.slice();
  if (det3(e) * (paired ? -1 : 1) < 0) {
    for (let t = 0; t < triangles.length; t += 3) [triangles[t + 1], triangles[t + 2]] = [triangles[t + 2], triangles[t + 1]];
  }
  return { name, paired, positions, triangles, slots: mesh.slots, slotNames: materialNames(meshBlock) };
}

/** A Bezier curve object as polylines in raw scene space: [{ points: [x,y,z...], radii: [...] }]. */
function extractCurve(name) {
  const found = find(name);
  if (!found) return null;
  const { object, paired } = found;
  if (object.type !== 2) throw new Error(`${name} is not a curve`);
  const curveBlock = blend.block(object.data);
  const at = curveBlock.data;
  const bevel = blend.field(at, "Curve", "ext2");
  const e = object.matrix;
  // the object's own scale enlarges the bevel too
  const scale = Math.cbrt(Math.abs(det3(e)));
  const lines = [];
  for (const nurbBlock of blend.list(at, "Curve", "nurb", curveBlock)) {
    const n = nurbBlock.data;
    const count = blend.field(n, "Nurb", "pntsu");
    const type = blend.field(n, "Nurb", "type");
    if (count < 2) continue;
    const pts = [];
    const radii = [];
    if (type === 1) {
      const bezt = blend.block(blend.field(n, "Nurb", "bezt"), curveBlock);
      const stride = blend.size("BezTriple");
      const ctrl = [];
      for (let i = 0; i < count; i++) {
        const v = blend.field(bezt.data + i * stride, "BezTriple", "vec");
        const r = blend.field(bezt.data + i * stride, "BezTriple", "radius");
        const p = new Float32Array(9);
        for (let k = 0; k < 3; k++) toScene(e, v[3 * k], v[3 * k + 1], v[3 * k + 2], paired, p, 3 * k);
        ctrl.push({ left: p.subarray(0, 3), point: p.subarray(3, 6), right: p.subarray(6, 9), r });
      }
      const STEPS = 8;
      for (let i = 0; i < count - 1; i++) {
        const a = ctrl[i];
        const b = ctrl[i + 1];
        for (let s = i === 0 ? 0 : 1; s <= STEPS; s++) {
          const t = s / STEPS;
          const u = 1 - t;
          const w0 = u * u * u;
          const w1 = 3 * u * u * t;
          const w2 = 3 * u * t * t;
          const w3 = t * t * t;
          for (let k = 0; k < 3; k++) pts.push(w0 * a.point[k] + w1 * a.right[k] + w2 * b.left[k] + w3 * b.point[k]);
          radii.push((a.r * u + b.r * t) * bevel * scale);
        }
      }
    } else {
      const bp = blend.block(blend.field(n, "Nurb", "bp"), curveBlock);
      const stride = blend.size("BPoint");
      for (let i = 0; i < count; i++) {
        const v = blend.field(bp.data + i * stride, "BPoint", "vec");
        const p = new Float32Array(3);
        toScene(e, v[0], v[1], v[2], paired, p, 0);
        pts.push(p[0], p[1], p[2]);
        radii.push(blend.field(bp.data + i * stride, "BPoint", "radius") * bevel * scale);
      }
    }
    lines.push({ points: pts, radii });
  }
  return { name, paired, lines };
}

// ------------------------------------------------------------------ take everything listed
/**
 * Every piece: { name, role, positions, triangles, tendon (per vertex 0..1), ...meta }.
 * role: muscle | tissue | shell | surface | bone | ligament | nerve | artery | vein | organ
 */
const pieces = [];

/** Per-vertex share of faces in the named material (tendon, cartilage). */
function slotShare(mesh, match) {
  const n = mesh.positions.length / 3;
  const hits = new Float32Array(n);
  const all = new Float32Array(n);
  const want = mesh.slotNames.map((s) => match.test(s));
  for (let t = 0; t < mesh.slots.length; t++) {
    const on = want[mesh.slots[t]] ? 1 : 0;
    for (let k = 0; k < 3; k++) {
      const v = mesh.triangles[3 * t + k];
      hits[v] += on;
      all[v] += 1;
    }
  }
  for (let i = 0; i < n; i++) hits[i] = all[i] ? hits[i] / all[i] : 0;
  return hits;
}

/** Split a mesh in two by material: the faces whose material matches, and the rest. */
function splitBySlot(mesh, match) {
  const want = mesh.slotNames.map((s) => match.test(s));
  const inside = [];
  const outside = [];
  for (let t = 0; t < mesh.slots.length; t++) (want[mesh.slots[t]] ? inside : outside).push(mesh.triangles[3 * t], mesh.triangles[3 * t + 1], mesh.triangles[3 * t + 2]);
  return [Uint32Array.from(inside), Uint32Array.from(outside)];
}

const TENDON = /tendon/i;
const CARTILAGE = /cartilage/i;

for (const [name, [muscle, part, layer = "surface", cover = false, tendonLandmark]] of Object.entries(MUSCLES)) {
  const mesh = extractMesh(name);
  if (!mesh) continue;
  if (tendonLandmark) {
    // the flat tendon becomes its own named structure; the muscle keeps its fleshy part
    const [tendonTris, muscleTris] = splitBySlot(mesh, TENDON);
    pieces.push({ ...mesh, triangles: muscleTris, role: "muscle", muscle, part, layer, cover, tendon: slotShare(mesh, TENDON).fill(0) });
    if (tendonTris.length) pieces.push({ ...mesh, name: `${name} (tendon)`, triangles: tendonTris, role: "surface", landmark: tendonLandmark, layer, cover: tendonLandmark === "rectus-sheath", tendon: new Float32Array(mesh.positions.length / 3).fill(1) });
  } else pieces.push({ ...mesh, role: "muscle", muscle, part, layer, cover, tendon: slotShare(mesh, TENDON) });
}
for (const [name, layer] of Object.entries(TISSUE)) {
  const mesh = extractMesh(name);
  if (mesh) pieces.push({ ...mesh, role: "tissue", layer, tendon: slotShare(mesh, TENDON) });
}
for (const name of SHELL) {
  const mesh = extractMesh(name);
  if (mesh) pieces.push({ ...mesh, role: "shell", layer: "surface", tendon: slotShare(mesh, TENDON) });
}
for (const [name, [landmark, layer, cover]] of Object.entries(SURFACE)) {
  const mesh = extractMesh(name);
  if (mesh) pieces.push({ ...mesh, role: "surface", landmark, layer, cover, tendon: new Float32Array(mesh.positions.length / 3).fill(1) });
}
for (const [name, landmark] of Object.entries(BONES)) {
  const mesh = extractMesh(name);
  if (mesh) pieces.push({ ...mesh, role: "bone", landmark, tendon: slotShare(mesh, CARTILAGE) });
}
for (const [name, landmark] of Object.entries(LIGAMENTS)) {
  const mesh = extractMesh(name);
  if (mesh) pieces.push({ ...mesh, role: "ligament", landmark, tendon: new Float32Array(mesh.positions.length / 3) });
}
for (const name of HEART) {
  const mesh = extractMesh(name);
  if (mesh) pieces.push({ ...mesh, role: "organ", landmark: "heart", tendon: new Float32Array(mesh.positions.length / 3) });
}
const curves = [];
for (const [name, [landmark, layer]] of Object.entries(NERVES)) {
  const c = extractCurve(name);
  if (c) curves.push({ ...c, role: "nerve", landmark, layer });
}
for (const [table, role] of [
  [ARTERIES, "artery"],
  [VEINS, "vein"],
]) {
  for (const [name, landmark] of Object.entries(table)) {
    const c = extractCurve(name);
    if (c) curves.push({ ...c, role, landmark, layer: "skeleton" });
  }
}
if (missing.length) console.warn("not found in the file:", missing.join(", "));
log(`took ${pieces.length} meshes and ${curves.length} curves`);

// ================================================================== 2. scale the figure
const pieceOf = (name) => pieces.find((p) => p.name === name);
const extent = (names, axis, pick) => {
  let best = pick === "max" ? -Infinity : Infinity;
  for (const name of names) {
    const p = pieceOf(name);
    for (let i = axis; i < p.positions.length; i += 3) best = pick === "max" ? Math.max(best, p.positions[i]) : Math.min(best, p.positions[i]);
  }
  return best;
};
const SOLE = ["Calcaneus", "First metatarsal bone", "Fifth metatarsal bone", "Sesamoid bones of foot", "Distal phalanx of first finger of foot", "Proximal phalanx of first finger of foot"];
const crown = extent(["Parietal bone", "Frontal bone"], 1, "max");
const sole = extent(SOLE, 1, "min");
// The bones stop short of the skin: about 7 mm of scalp above the skull and 12 mm of heel pad
// below the foot bones. The skin of the crown ends up at 1.78 m.
const SCALE = (1.78 - 0.007 - 0.012) / (crown - sole);
const LIFT = 0.012 - sole * SCALE;
log(`figure: crown ${crown.toFixed(3)}, sole ${sole.toFixed(3)}, scale ${SCALE.toFixed(4)}`);
const place = (arr) => {
  for (let i = 0; i < arr.length; i += 3) {
    arr[i] *= SCALE;
    arr[i + 1] = arr[i + 1] * SCALE + LIFT;
    arr[i + 2] *= SCALE;
  }
};
for (const p of pieces) place(p.positions);
for (const c of curves)
  for (const line of c.lines) {
    place(line.points);
    for (let i = 0; i < line.radii.length; i++) line.radii[i] *= SCALE;
  }

// ================================================================== 2b. uncover the abs
// Z-Anatomy's external oblique carries its aponeurosis, the sheet that runs over the rectus
// abdominis to the midline as the front of the rectus sheath, and models it as muscle. On a muscle
// map that sheet hides the abs and takes the clicks meant for them, so it is cut away in front of
// them. The cut follows the outer edge of the abs as seen from the front, a little inside it, so
// the oblique still overlaps that edge and nothing behind it shows through.
{
  const oblique = pieceOf("External abdominal oblique muscle");
  const abs = ["Rectus abdominis muscle", "Pyramidalis muscle"].map(pieceOf).filter(Boolean);
  const BAND = 0.005; // the abs are measured in bands of 5 mm of height
  const OVERLAP = 0.004; // how far the oblique still reaches over the edge of the abs
  // per band: how far out to the side the abs reach (+x on the modeled half), and how far back
  const raw = new Map();
  for (const p of abs) {
    for (let i = 0; i < p.positions.length; i += 3) {
      const band = Math.round(p.positions[i + 1] / BAND);
      const r = raw.get(band) ?? { side: -Infinity, back: Infinity };
      r.side = Math.max(r.side, p.positions[i]);
      r.back = Math.min(r.back, p.positions[i + 2]);
      raw.set(band, r);
    }
  }
  // averaged with the bands above and below, so the cut runs on without steps
  const outline = new Map();
  for (const band of raw.keys()) {
    const near = [band - 1, band, band + 1].map((b) => raw.get(b)).filter(Boolean);
    outline.set(band, { side: near.reduce((sum, r) => sum + r.side, 0) / near.length, back: Math.min(...near.map((r) => r.back)) });
  }
  /** The outline of the abs at height y, between bands. null above and below them. */
  const outlineAt = (y) => {
    const f = y / BAND;
    const lo = outline.get(Math.floor(f));
    const hi = outline.get(Math.ceil(f));
    if (!lo || !hi) return lo ?? hi ?? null;
    const t = f - Math.floor(f);
    return { side: lo.side + (hi.side - lo.side) * t, back: Math.min(lo.back, hi.back) };
  };
  const kept = [];
  const t3 = oblique.triangles;
  for (let t = 0; t < t3.length; t += 3) {
    let x = 0;
    let y = 0;
    let z = 0;
    for (let k = 0; k < 3; k++) {
      x += oblique.positions[3 * t3[t + k]] / 3;
      y += oblique.positions[3 * t3[t + k] + 1] / 3;
      z += oblique.positions[3 * t3[t + k] + 2] / 3;
    }
    const o = outlineAt(y);
    const overAbs = o && x < o.side - OVERLAP && z > o.back;
    if (!overAbs) kept.push(t3[t], t3[t + 1], t3[t + 2]);
  }
  log(`external oblique: cut ${(t3.length - kept.length) / 3} of ${t3.length / 3} triangles that lay over the abs`);
  oblique.triangles = Uint32Array.from(kept);
}

// ================================================================== 3. simplify
const RATIO ={ muscle: 0.11, tissue: 0.06, shell: 0.075, surface: 0.18, bone: 0.14, ligament: 0.35, organ: 0.12 };
const MIN_TRIS = { muscle: 120, tissue: 60, shell: 40, surface: 50, bone: 40, ligament: 30, organ: 200 };
const PER_NAME_RATIO = {
  "External intercostal muscles": 0.035,
  "Iliotibial tract": 0.05,
  "Frontal bone": 0.09,
  "Parietal bone": 0.09,
  "Occipital bone": 0.09,
  "Temporal bone": 0.08,
  "Sphenoid bone": 0.06,
  Mandible: 0.09,
  Maxilla: 0.1,
  "Zygomatic bone": 0.12,
};

function simplify(piece) {
  const n = piece.positions.length / 3;
  // weld vertices that share a position, so the simplifier can collapse across them
  const remap = MeshoptSimplifier.generatePositionRemap(piece.positions, 3);
  let indices = new Uint32Array(piece.triangles.length);
  for (let i = 0; i < indices.length; i++) indices[i] = remap[piece.triangles[i]];
  // drop triangles that collapsed in the weld
  const kept = [];
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t], indices[t + 1], indices[t + 2]];
    if (a !== b && b !== c && a !== c) kept.push(a, b, c);
  }
  indices = Uint32Array.from(kept);
  const tris = indices.length / 3;
  const ratio = PER_NAME_RATIO[piece.name] ?? RATIO[piece.role];
  const target = Math.min(tris, Math.max(MIN_TRIS[piece.role], Math.round(tris * ratio)));
  let out = indices;
  if (target < tris) {
    [out] = MeshoptSimplifier.simplifyWithAttributes(indices, piece.positions, 3, piece.tendon, 1, [0.5], null, target * 3, 0.02, ["LockBorder"]);
  }
  // keep only the vertices still used
  const map = new Int32Array(n).fill(-1);
  let count = 0;
  for (const v of out) if (map[v] < 0) map[v] = count++;
  const positions = new Float32Array(count * 3);
  const tendon = new Float32Array(count);
  for (let v = 0; v < n; v++) {
    const m = map[v];
    if (m < 0) continue;
    positions.set(piece.positions.subarray(3 * v, 3 * v + 3), 3 * m);
    tendon[m] = piece.tendon[v];
  }
  const triangles = new Uint32Array(out.length);
  for (let i = 0; i < out.length; i++) triangles[i] = map[out[i]];
  piece.original = piece.positions; // dense, for measuring the joints
  piece.positions = positions;
  piece.triangles = triangles;
  piece.tendon = tendon;
}
let before = 0;
let after = 0;
for (const p of pieces) {
  before += p.triangles.length / 3;
  simplify(p);
  after += p.triangles.length / 3;
}
log(`simplified ${before} triangles to ${after}`);

// ================================================================== 4. joints
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const pointsOf = (name, { dense = true, filter } = {}) => {
  const p = pieceOf(name);
  const arr = dense ? p.original : p.positions;
  const out = [];
  for (let i = 0; i < arr.length; i += 3) {
    const v = V(arr[i], arr[i + 1], arr[i + 2]);
    if (!filter || filter(v)) out.push(v);
  }
  return out;
};
const centroid = (pts) => pts.reduce((s, p) => s.add(p), V()).multiplyScalar(1 / pts.length);
/** Least-squares sphere through points: its centre. */
function sphereCentre(pts) {
  const A = new Float64Array(16);
  const b = new Float64Array(4);
  for (const p of pts) {
    const row = [2 * p.x, 2 * p.y, 2 * p.z, 1];
    const rhs = p.x * p.x + p.y * p.y + p.z * p.z;
    for (let i = 0; i < 4; i++) {
      b[i] += row[i] * rhs;
      for (let j = 0; j < 4; j++) A[4 * i + j] += row[i] * row[j];
    }
  }
  // Gaussian elimination
  const M = [0, 1, 2, 3].map((i) => [...A.slice(4 * i, 4 * i + 4), b[i]]);
  for (let c = 0; c < 4; c++) {
    let pivot = c;
    for (let r = c + 1; r < 4; r++) if (Math.abs(M[r][c]) > Math.abs(M[pivot][c])) pivot = r;
    [M[c], M[pivot]] = [M[pivot], M[c]];
    for (let r = 0; r < 4; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k < 5; k++) M[r][k] -= f * M[c][k];
    }
  }
  return V(M[0][4] / M[0][0], M[1][4] / M[1][1], M[2][4] / M[2][2]);
}
/** Dense points of a bone that lie in its cartilage (joint surfaces). */
const cartilagePoints = (name, filter) => {
  const p = pieceOf(name);
  // map the dense vertices to the cartilage share computed before simplification
  const raw = extractMesh(name); // re-read: cheap enough for the few bones measured here
  const share = slotShare(raw, CARTILAGE);
  const out = [];
  for (let i = 0; i < p.original.length; i += 3) {
    const v = V(p.original[i], p.original[i + 1], p.original[i + 2]);
    if (share[i / 3] > 0.5 && (!filter || filter(v))) out.push(v);
  }
  return out;
};
const top = (pts) => Math.max(...pts.map((p) => p.y));
const bottom = (pts) => Math.min(...pts.map((p) => p.y));

const humerus = pointsOf("Humerus");
const hTop = top(humerus);
const hBottom = bottom(humerus);
const shoulder = sphereCentre(cartilagePoints("Humerus", (v) => v.y > hTop - 0.07));
const elbow = sphereCentre(cartilagePoints("Humerus", (v) => v.y < hBottom + 0.05));
const femur = pointsOf("Femur");
const fTop = top(femur);
const fBottom = bottom(femur);
const hip = sphereCentre(cartilagePoints("Femur", (v) => v.y > fTop - 0.09 && v.x < centroid(femur).x));
const knee = sphereCentre(cartilagePoints("Femur", (v) => v.y < fBottom + 0.06));
const talus = pointsOf("Talus");
const ankle = sphereCentre(cartilagePoints("Talus", (v) => v.y > centroid(talus).y));
const lunate = centroid([...pointsOf("Lunate bone"), ...pointsOf("Capitate bone")]);
const wrist = lunate;

/** The far end of a bone along its long axis, as a joint centre: the middle of its last 12 %. */
function farEnd(name, from) {
  const pts = pointsOf(name);
  const c = centroid(pts);
  const axis = c.clone().sub(from).normalize();
  const proj = pts.map((p) => p.clone().sub(c).dot(axis));
  const hi = Math.max(...proj);
  const lo = Math.min(...proj);
  return centroid(pts.filter((_, i) => proj[i] > hi - (hi - lo) * 0.12));
}
const FINGERS = ["first", "second", "third", "fourth", "fifth"];
const DIGIT_NAMES = ["thumb", "index", "middle", "ring", "little"];
const digitJoints = FINGERS.map((f, i) => {
  const meta = `${["First", "Second", "Third", "Fourth", "Fifth"][i]} metacarpal bone`;
  const mcp = farEnd(meta, wrist);
  const proximal = `Proximal phalanx of ${f} finger of hand`;
  const pip = farEnd(proximal, mcp);
  const tip = farEnd(`Distal phalanx of ${f} finger of hand`, pip);
  return { name: DIGIT_NAMES[i], mcp, pip, tip };
});
log("joints", { shoulder, elbow, wrist, hip, knee, ankle });

// ================================================================== 5. relaxed forearm
// Anatomical position has the palm forward. The site's stance has it toward the thigh, with the
// thumb forward. The radius and the hand turn about the line from the elbow to the wrist; the ulna
// stays. Soft tissue turns by its share between the two (twist weight), measured from the bones.
const twistAxis = wrist.clone().sub(elbow).normalize();
const across = digitJoints[4].mcp.clone().sub(digitJoints[1].mcp); // index knuckle to little knuckle
across.addScaledVector(twistAxis, -across.dot(twistAxis)).normalize();
// relaxed: the knuckles run front to back, index in front
const wanted = V(0, 0, -1).addScaledVector(twistAxis, -twistAxis.z * -1).normalize();
let pronation = Math.acos(THREE.MathUtils.clamp(across.dot(wanted), -1, 1));
if (across.clone().cross(wanted).dot(twistAxis) < 0) pronation = -pronation;
log(`turning the forearm by ${THREE.MathUtils.radToDeg(pronation).toFixed(1)} degrees to the relaxed stance`);

const HAND_BONES = new Set(Object.entries(BONES).filter(([, l]) => l === "hand-bones").map(([n]) => n));
const RADIUS_SIDE = new Set(["Radius", ...HAND_BONES]);
const ULNA_SIDE = new Set(["Ulna", "Humerus"]);

/** A grid of points for nearest-point queries. */
class Grid {
  constructor(points, cell = 0.01) {
    this.cell = cell;
    this.map = new Map();
    for (let i = 0; i < points.length; i += 3) {
      const key = this.key(points[i], points[i + 1], points[i + 2]);
      if (!this.map.has(key)) this.map.set(key, []);
      this.map.get(key).push(points[i], points[i + 1], points[i + 2]);
    }
  }
  key(x, y, z) {
    return `${Math.floor(x / this.cell)},${Math.floor(y / this.cell)},${Math.floor(z / this.cell)}`;
  }
  /** Distance to the nearest point, searched out to `reach` metres (Infinity beyond). */
  distance(x, y, z, reach = 0.25) {
    const c = this.cell;
    const cx = Math.floor(x / c);
    const cy = Math.floor(y / c);
    const cz = Math.floor(z / c);
    let best = Infinity;
    const rings = Math.ceil(reach / c);
    for (let r = 0; r <= rings; r++) {
      if (best < (r - 1) * c) break;
      for (let i = -r; i <= r; i++)
        for (let j = -r; j <= r; j++)
          for (let k = -r; k <= r; k++) {
            if (Math.max(Math.abs(i), Math.abs(j), Math.abs(k)) !== r) continue;
            const list = this.map.get(`${cx + i},${cy + j},${cz + k}`);
            if (!list) continue;
            for (let m = 0; m < list.length; m += 3) {
              const d = (list[m] - x) ** 2 + (list[m + 1] - y) ** 2 + (list[m + 2] - z) ** 2;
              if (d < best * best) best = Math.sqrt(d);
            }
          }
    }
    return best;
  }
}
const gridOf = (names) => {
  const arrs = [...names].map((n) => pieceOf(n)?.positions).filter(Boolean);
  const all = new Float32Array(arrs.reduce((s, a) => s + a.length, 0));
  let o = 0;
  for (const a of arrs) {
    all.set(a, o);
    o += a.length;
  }
  return new Grid(all, 0.012);
};
const radiusGrid = gridOf(RADIUS_SIDE);
const ulnaGrid = gridOf(ULNA_SIDE);

const rotateAbout = (arr, i, origin, axis, angle) => {
  const v = V(arr[i], arr[i + 1], arr[i + 2]).sub(origin).applyAxisAngle(axis, angle).add(origin);
  arr[i] = v.x;
  arr[i + 1] = v.y;
  arr[i + 2] = v.z;
};
/** How far along the forearm a point is: 0 at the elbow, 1 at the wrist. */
const alongForearm = (x, y, z) => V(x, y, z).sub(elbow).dot(twistAxis) / wrist.distanceTo(elbow);

/**
 * The twist weight of a soft-tissue point of the arm: 1 where it rides with the radius and the
 * hand, 0 where it stays with the ulna and above the elbow.
 */
function twistWeight(x, y, z) {
  const t = alongForearm(x, y, z);
  if (t < -0.12) return 0;
  if (t > 1.02) return radiusGrid.distance(x, y, z, 0.06) < 0.04 ? 1 : 0; // the hand
  const rel = V(x, y, z).sub(elbow);
  if (rel.addScaledVector(twistAxis, -rel.dot(twistAxis)).length() > 0.075) return 0; // not in the forearm
  const dr = radiusGrid.distance(x, y, z);
  const du = ulnaGrid.distance(x, y, z);
  const w = (du * du) / (dr * dr + du * du + 1e-12);
  // above the elbow the turn fades out
  return w * THREE.MathUtils.smoothstep(t, -0.12, 0.02);
}

/** Does this piece reach the forearm or the hand? Only those take part in the turn. */
const forearmGrid = gridOf(new Set(["Radius", "Ulna", ...HAND_BONES]));
function reachesForearm(p) {
  const limit = ["nerve", "artery", "vein"].includes(p.role) ? 0.035 : 0.015;
  const n = p.positions.length / 3;
  const step = Math.max(1, Math.floor(n / 500));
  for (let v = 0; v < n; v += step) if (forearmGrid.distance(p.positions[3 * v], p.positions[3 * v + 1], p.positions[3 * v + 2], 0.05) < limit) return true;
  return false;
}
/** Turn one piece to the relaxed stance and record its twist weights. */
function relax(p) {
  const n = p.positions.length / 3;
  p.twist = new Uint8Array(n);
  if (!p.paired || !reachesForearm(p)) return;
  for (let v = 0; v < n; v++) {
    const i = 3 * v;
    const w = twistWeight(p.positions[i], p.positions[i + 1], p.positions[i + 2]);
    p.twist[v] = Math.round(w * 255);
    if (w > 0) rotateAbout(p.positions, i, elbow, twistAxis, pronation * w);
  }
}

for (const p of pieces) {
  if (p.role !== "bone") continue;
  p.twist = new Uint8Array(p.positions.length / 3);
  if (p.paired && RADIUS_SIDE.has(p.name)) {
    p.twist.fill(255);
    for (let i = 0; i < p.positions.length; i += 3) rotateAbout(p.positions, i, elbow, twistAxis, pronation);
    for (let i = 0; i < p.original.length; i += 3) rotateAbout(p.original, i, elbow, twistAxis, pronation);
  }
}
for (const p of pieces) if (p.role !== "bone") relax(p);
for (const d of digitJoints) for (const key of ["mcp", "pip", "tip"]) d[key].sub(elbow).applyAxisAngle(twistAxis, pronation).add(elbow);

// ================================================================== tubes for nerves and vessels
/** Resample a polyline every `step` metres. */
function resample(points, radii, step) {
  const out = [];
  const rOut = [];
  const P = (i) => V(points[3 * i], points[3 * i + 1], points[3 * i + 2]);
  let carry = 0;
  out.push(P(0));
  rOut.push(radii[0]);
  for (let i = 0; i + 1 < radii.length; i++) {
    const a = P(i);
    const b = P(i + 1);
    const len = a.distanceTo(b);
    let d = step - carry;
    while (d <= len) {
      const t = d / len;
      out.push(a.clone().lerp(b, t));
      rOut.push(radii[i] * (1 - t) + radii[i + 1] * t);
      d += step;
    }
    carry = len - (d - step);
  }
  const last = P(radii.length - 1);
  if (out[out.length - 1].distanceTo(last) > step * 0.3) {
    out.push(last);
    rOut.push(radii[radii.length - 1]);
  }
  return { pts: out, radii: rOut };
}
function tubeMesh(lines, sides, minRadius) {
  const positions = [];
  const triangles = [];
  for (const line of lines) {
    const { pts, radii } = resample(line.points, line.radii, 0.016);
    if (pts.length < 2) continue;
    const base = positions.length / 3;
    let normal = null;
    for (let i = 0; i < pts.length; i++) {
      const t = pts[Math.min(i + 1, pts.length - 1)].clone().sub(pts[Math.max(i - 1, 0)]).normalize();
      if (!normal) {
        normal = Math.abs(t.y) < 0.9 ? V(0, 1, 0) : V(1, 0, 0);
      }
      normal.addScaledVector(t, -normal.dot(t)).normalize();
      const binormal = t.clone().cross(normal);
      const r = Math.max(radii[i], minRadius);
      for (let s = 0; s < sides; s++) {
        const a = (s / sides) * Math.PI * 2;
        const p = pts[i].clone().addScaledVector(normal, Math.cos(a) * r).addScaledVector(binormal, Math.sin(a) * r);
        positions.push(p.x, p.y, p.z);
      }
    }
    for (let i = 0; i + 1 < pts.length; i++) {
      for (let s = 0; s < sides; s++) {
        const a = base + i * sides + s;
        const b = base + i * sides + ((s + 1) % sides);
        const c = a + sides;
        const d = b + sides;
        triangles.push(a, c, b, b, c, d);
      }
    }
    // close both ends
    for (const [ring, flip] of [
      [0, true],
      [pts.length - 1, false],
    ]) {
      const centre = positions.length / 3;
      const p = pts[ring];
      positions.push(p.x, p.y, p.z);
      for (let s = 0; s < sides; s++) {
        const a = base + ring * sides + s;
        const b = base + ring * sides + ((s + 1) % sides);
        if (flip) triangles.push(centre, a, b);
        else triangles.push(centre, b, a);
      }
    }
  }
  return { positions: Float32Array.from(positions), triangles: Uint32Array.from(triangles) };
}
for (const c of curves) {
  const sides = c.layer === "skeleton" && c.role === "nerve" ? 4 : 6;
  const minRadius = c.role === "nerve" ? (c.layer === "nerve" ? 0.0011 : 0.0006) : 0.0012;
  const { positions, triangles } = tubeMesh(c.lines, sides, minRadius);
  if (!triangles.length) continue;
  const n = positions.length / 3;
  const piece = { name: c.name, paired: c.paired, role: c.role, landmark: c.landmark, layer: c.layer, positions, triangles, tendon: new Float32Array(n) };
  relax(piece);
  pieces.push(piece);
}

// ------------------------------------------------------------------ patellar ligament
// Not in the Z-Anatomy joints: a flat band from the lower tip of the kneecap to the bump at the
// top of the shin, where the quadriceps tendon carries on.
{
  const patella = pointsOf("Patella", { dense: false });
  const low = Math.min(...patella.map((p) => p.y));
  const from = centroid(patella.filter((p) => p.y < low + 0.012));
  const tibia = pointsOf("Tibia", { dense: false });
  const tTop = top(tibia);
  const front = tibia.filter((p) => p.y > tTop - 0.09 && p.y < tTop - 0.04);
  const maxZ = Math.max(...front.map((p) => p.z));
  const to = centroid(front.filter((p) => p.z > maxZ - 0.006));
  const positions = [];
  const triangles = [];
  const dir = to.clone().sub(from);
  const side = V(1, 0, 0);
  const out = side.clone().cross(dir).normalize();
  if (out.z < 0) out.negate();
  const STEPS = 8;
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    const c = from.clone().lerp(to, t).addScaledVector(out, 0.003);
    const w = THREE.MathUtils.lerp(0.014, 0.011, t);
    const h = 0.0032;
    for (const [sx, sz] of [
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ])
      positions.push(c.x + sx * w, c.y, c.z + sz * h + (sz < 0 ? 0 : 0));
  }
  for (let i = 0; i < STEPS; i++)
    for (let s = 0; s < 4; s++) {
      const a = i * 4 + s;
      const b = i * 4 + ((s + 1) % 4);
      triangles.push(a, b, a + 4, b, b + 4, a + 4);
    }
  for (const [ring, flip] of [
    [0, true],
    [STEPS, false],
  ]) {
    const r = ring * 4;
    if (flip) triangles.push(r, r + 2, r + 1, r, r + 3, r + 2);
    else triangles.push(r, r + 1, r + 2, r, r + 2, r + 3);
  }
  const n = positions.length / 3;
  pieces.push({ name: "Patellar ligament", paired: true, role: "ligament", landmark: "patellar-ligament", positions: Float32Array.from(positions), triangles: Uint32Array.from(triangles), tendon: new Float32Array(n), twist: new Uint8Array(n) });
}

// ================================================================== 6. segments and weights
/**
 * The segments of the pose rig on the modeled half, in the order the skin data indexes them.
 * The forearm's own turn (pronation) is handled with each vertex's twist weight.
 */
const SEGMENTS = ["torso", "arm", "forearm", "hand", "thigh", "shank", "foot", ...DIGIT_NAMES.flatMap((d) => [`${d}1`, `${d}2`])];
const SEG = Object.fromEntries(SEGMENTS.map((s, i) => [s, i]));
const PARENT = { torso: null, arm: "torso", forearm: "arm", hand: "forearm", thigh: "torso", shank: "thigh", foot: "shank" };
for (const d of DIGIT_NAMES) {
  PARENT[`${d}1`] = "hand";
  PARENT[`${d}2`] = `${d}1`;
}
/**
 * Which segment each bone rides on. The ulna is "ulna": it rides on the forearm but does not
 * turn with the radius when the palm turns (see realbody.js).
 */
function boneSegment(name) {
  if (name === "Humerus") return "arm";
  if (name === "Radius") return "forearm";
  if (name === "Ulna") return "ulna";
  if (name === "Femur" || name === "Patella") return "thigh";
  if (name === "Tibia" || name === "Fibula") return "shank";
  if (BONES[name] === "foot-bones") return "foot";
  if (BONES[name] === "hand-bones") {
    const m = name.match(/^(Proximal|Middle|Distal) phalanx of (\w+) finger of hand$/);
    if (!m) return "hand";
    const digit = DIGIT_NAMES[FINGERS.indexOf(m[2])];
    return m[1] === "Proximal" ? `${digit}1` : `${digit}2`;
  }
  return "torso";
}
/** The skinning segment of a bone: the ulna counts as forearm there. */
const skinSegment = (name) => (boneSegment(name) === "ulna" ? "forearm" : boneSegment(name));
const bonesBySegment = Object.fromEntries(SEGMENTS.map((s) => [s, []]));
const BONE_NAMES = [];
for (const p of pieces) {
  if (p.role !== "bone") continue;
  bonesBySegment[p.paired ? skinSegment(p.name) : "torso"].push(p.name);
  BONE_NAMES.push(p.name);
}
const boxOf = (arr) => {
  const b = new THREE.Box3();
  for (let i = 0; i < arr.length; i += 3) b.expandByPoint(V(arr[i], arr[i + 1], arr[i + 2]));
  return b;
};
/** Points of a set of bones; midline bones are mirrored too, so the modeled half sees both sides of them. */
const gridCache = new Map();
function bonesGrid(names) {
  const key = [...names].sort().join("|");
  if (!gridCache.has(key)) {
    const arrs = [];
    for (const name of names) {
      const p = pieceOf(name);
      arrs.push(p.positions);
      if (!p.paired) {
        const m = p.positions.slice();
        for (let i = 0; i < m.length; i += 3) m[i] = -m[i];
        arrs.push(m);
      }
    }
    const all = new Float32Array(arrs.reduce((n, a) => n + a.length, 0));
    let o = 0;
    for (const a of arrs) {
      all.set(a, o);
      o += a.length;
    }
    gridCache.set(key, new Grid(all, 0.012));
  }
  return gridCache.get(key);
}
const boneBoxes = new Map(BONE_NAMES.map((name) => [name, boxOf(pieceOf(name).positions)]));
for (const name of BONE_NAMES) {
  // a midline bone's box covers both sides
  if (!pieceOf(name).paired) {
    const b = boneBoxes.get(name);
    b.min.x = -Math.max(Math.abs(b.min.x), Math.abs(b.max.x));
    b.max.x = -b.min.x;
  }
}
const chainUp = (s) => {
  const out = [];
  for (let x = s; x; x = PARENT[x]) out.push(x);
  return out;
};

/** Mesh adjacency, for smoothing weights over the surface. */
function neighbours(n, triangles) {
  const sets = Array.from({ length: n }, () => new Set());
  for (let t = 0; t < triangles.length; t += 3) {
    const [a, b, c] = [triangles[t], triangles[t + 1], triangles[t + 2]];
    sets[a].add(b).add(c);
    sets[b].add(a).add(c);
    sets[c].add(a).add(b);
  }
  return sets.map((s) => [...s]);
}

/** Weights of every vertex on the segments it may follow. Sets piece.segment or piece.skin. */
function rig(piece) {
  if (!piece.paired) {
    piece.segment = "torso";
    return;
  }
  if (piece.role === "bone") {
    piece.segment = boneSegment(piece.name);
    return;
  }
  const n = piece.positions.length / 3;
  const pos = piece.positions;
  // The bones this piece touches: a muscle or a ligament is fixed to them. A nerve or a vessel
  // runs along them, a little further off.
  const reach = ["nerve", "artery", "vein"].includes(piece.role) ? 0.035 : 0.012;
  const box = boxOf(pos).expandByScalar(reach);
  const step = Math.max(1, Math.floor(n / 600));
  const touched = [];
  for (const name of BONE_NAMES) {
    if (!box.intersectsBox(boneBoxes.get(name))) continue;
    const g = bonesGrid([name]);
    for (let v = 0; v < n; v += step) {
      if (g.distance(pos[3 * v], pos[3 * v + 1], pos[3 * v + 2], reach + 0.012) < reach) {
        touched.push(name);
        break;
      }
    }
  }
  const segOf = (name) => (pieceOf(name).paired ? skinSegment(name) : "torso");
  const touchedSegments = [...new Set(touched.map(segOf))];
  if (!touchedSegments.length) {
    // nothing close: ride with the nearest segment
    const c = boxOf(pos).getCenter(V());
    let best = "torso";
    let bestD = Infinity;
    for (const s of SEGMENTS) {
      if (!bonesBySegment[s].length) continue;
      const d = bonesGrid(bonesBySegment[s]).distance(c.x, c.y, c.z, 0.4);
      if (d < bestD) [best, bestD] = [s, d];
    }
    touchedSegments.push(best);
  }
  // A piece fixed to one segment can still lie along the next one, like the Achilles tendon along
  // the shin: it takes that segment too when a good share of it lies close to its bones. Never
  // the trunk, which a limb muscle only follows where it is fixed to it.
  for (const s of [...touchedSegments]) {
    for (const other of SEGMENTS) {
      if (other === "torso" || touchedSegments.includes(other) || (PARENT[other] !== s && PARENT[s] !== other)) continue;
      const g = bonesGrid(bonesBySegment[other]);
      let close = 0;
      let total = 0;
      for (let v = 0; v < n; v += step) {
        total++;
        if (g.distance(pos[3 * v], pos[3 * v + 1], pos[3 * v + 2], 0.04) < 0.035) close++;
      }
      if (close / total > 0.15) touchedSegments.push(other);
    }
  }
  // the segments between them: up from each to the deepest segment they share
  const paths = touchedSegments.map(chainUp);
  const shared = paths[0].find((s) => paths.every((p) => p.includes(s)));
  const set = new Set();
  for (const p of paths)
    for (const s of p) {
      set.add(s);
      if (s === shared) break;
    }
  const candidates = [...set];
  // A limb segment pulls by all its bones. The trunk pulls only by the bones the piece is fixed
  // to: the ribs beside a hanging arm must not hold on to the arm's muscles.
  const grids = candidates.map((s) => {
    const own = touched.filter((name) => segOf(name) === s);
    return bonesGrid(s === "torso" && own.length ? own : bonesBySegment[s]);
  });
  const varies = piece.twist?.some((t) => t > 3 && t < 252);
  if (candidates.length === 1 && !varies) {
    piece.segment = candidates[0];
    return;
  }
  const k = candidates.length;
  const w = new Float32Array(n * k);
  for (let v = 0; v < n; v++) {
    let sum = 0;
    for (let c = 0; c < k; c++) {
      const d = Math.max(grids[c].distance(pos[3 * v], pos[3 * v + 1], pos[3 * v + 2], 0.3), 0.004);
      const x = 1 / (d * d * d * d);
      w[v * k + c] = x;
      sum += x;
    }
    for (let c = 0; c < k; c++) w[v * k + c] /= sum;
  }
  // smooth over the surface so the blend runs evenly across each joint
  const nb = neighbours(n, piece.triangles);
  for (let pass = 0; pass < 4; pass++) {
    const next = new Float32Array(w.length);
    for (let v = 0; v < n; v++) {
      for (let c = 0; c < k; c++) {
        let s = w[v * k + c] * 2;
        for (const u of nb[v]) s += w[u * k + c];
        next[v * k + c] = s / (2 + nb[v].length);
      }
    }
    w.set(next);
  }
  // keep the three largest, quantized
  const joints = new Uint8Array(n * 3);
  const weights = new Uint8Array(n * 3);
  for (let v = 0; v < n; v++) {
    const order = [...Array(k).keys()].sort((a, b) => w[v * k + b] - w[v * k + a]).slice(0, 3);
    const total = order.reduce((s, c) => s + w[v * k + c], 0);
    let left = 255;
    order.forEach((c, i) => {
      joints[3 * v + i] = SEG[candidates[c]];
      const q = i === order.length - 1 ? left : Math.round((w[v * k + c] / total) * 255);
      weights[3 * v + i] = q;
      left -= q;
    });
  }
  piece.skin = { joints, weights };
  // one segment really carries it all, and no part of it turns with the radius: then it is rigid
  const used = new Set();
  for (let v = 0; v < n; v++) for (let i = 0; i < 3; i++) if (weights[3 * v + i] > 2) used.add(joints[3 * v + i]);
  if (used.size === 1 && !varies) {
    piece.segment = SEGMENTS[[...used][0]];
    delete piece.skin;
  }
}
for (const p of pieces) rig(p);
log(`rigged: ${pieces.filter((p) => p.skin).length} skinned, ${pieces.filter((p) => p.segment).length} rigid`);

// ================================================================== the rig itself
const S = SCALE;
const rigOut = {
  shoulder: shoulder.toArray(),
  elbow: elbow.toArray(),
  wrist: wrist.toArray(),
  hip: hip.toArray(),
  knee: knee.toArray(),
  ankle: ankle.toArray(),
  digits: digitJoints.map((d) => ({ name: d.name, mcp: d.mcp.toArray(), pip: d.pip.toArray(), tip: d.tip.toArray() })),
};
// where a handle sits in the closed hand: under the knuckles, on the palm side
{
  const knuckles = centroid(digitJoints.slice(1).map((d) => d.mcp));
  const pips = centroid(digitJoints.slice(1).map((d) => d.pip));
  rigOut.grip = knuckles.clone().lerp(pips, 0.35).add(V(-0.022, 0, 0)).toArray();
}
// a spot between the shoulder blades, on the back: where the back rests on a bench
{
  const scap = pointsOf("Scapula", { dense: false });
  const midY = (top(scap) + bottom(scap)) / 2;
  let back = 0;
  for (const p of pieces) {
    if (!["muscle", "tissue", "surface"].includes(p.role) || p.layer === "deep") continue;
    for (let i = 0; i < p.positions.length; i += 3) {
      if (Math.abs(p.positions[i]) < 0.03 && Math.abs(p.positions[i + 1] - midY) < 0.02) back = Math.min(back, p.positions[i + 2]);
    }
  }
  rigOut.benchRest = [0, midY, back];
}

// ================================================================== 7. merge, quantize, pack
const KEY_FIELDS = ["role", "muscle", "part", "landmark", "layer", "cover", "segment", "paired"];
const groups = new Map();
for (const p of pieces) {
  const key = KEY_FIELDS.map((f) => p[f] ?? "").join("|") + (p.skin ? "|skin" : "");
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(p);
}

/** Smooth vertex normals, weighted by face area. */
function normalsOf(positions, triangles) {
  const n = new Float32Array(positions.length);
  const a = V();
  const b = V();
  const c = V();
  for (let t = 0; t < triangles.length; t += 3) {
    const [i, j, k] = [triangles[t] * 3, triangles[t + 1] * 3, triangles[t + 2] * 3];
    a.fromArray(positions, i);
    b.fromArray(positions, j).sub(a);
    c.fromArray(positions, k).sub(a);
    b.cross(c);
    for (const v of [i, j, k]) {
      n[v] += b.x;
      n[v + 1] += b.y;
      n[v + 2] += b.z;
    }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1;
    n[i] /= l;
    n[i + 1] /= l;
    n[i + 2] /= l;
  }
  return n;
}

/** Fibre coordinates for a muscle: v along its long axis, u around it. Seam vertices are split. */
function fibreUV(mesh) {
  const { positions, triangles } = mesh;
  const n = positions.length / 3;
  const c = V();
  for (let i = 0; i < positions.length; i += 3) c.add(V(positions[i], positions[i + 1], positions[i + 2]));
  c.multiplyScalar(1 / n);
  // principal axis by power iteration on the covariance
  const cov = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < positions.length; i += 3) {
    const d = [positions[i] - c.x, positions[i + 1] - c.y, positions[i + 2] - c.z];
    for (let r = 0; r < 3; r++) for (let q = 0; q < 3; q++) cov[3 * r + q] += d[r] * d[q];
  }
  let axis = V(0.3, 1, 0.2).normalize();
  for (let it = 0; it < 30; it++) axis = V(cov[0] * axis.x + cov[1] * axis.y + cov[2] * axis.z, cov[3] * axis.x + cov[4] * axis.y + cov[5] * axis.z, cov[6] * axis.x + cov[7] * axis.y + cov[8] * axis.z).normalize();
  const ref = Math.abs(axis.z) < 0.9 ? V(0, 0, 1) : V(1, 0, 0);
  const e1 = ref.addScaledVector(axis, -ref.dot(axis)).normalize();
  const e2 = axis.clone().cross(e1);
  const along = new Float32Array(n);
  const angle = new Float32Array(n);
  let lo = Infinity;
  let hi = -Infinity;
  let radius = 0;
  for (let v = 0; v < n; v++) {
    const d = V(positions[3 * v] - c.x, positions[3 * v + 1] - c.y, positions[3 * v + 2] - c.z);
    along[v] = d.dot(axis);
    lo = Math.min(lo, along[v]);
    hi = Math.max(hi, along[v]);
    const x = d.dot(e1);
    const y = d.dot(e2);
    angle[v] = (Math.atan2(y, x) / (2 * Math.PI) + 1) % 1;
    radius += Math.hypot(x, y);
  }
  radius /= n;
  // streaks about 1.6 cm apart on average: the number of repeats around the muscle
  const turns = Math.max(1, Math.round((2 * Math.PI * radius) / 0.07));
  const length = hi - lo || 1;
  const uv = new Float32Array(n * 2);
  for (let v = 0; v < n; v++) {
    uv[2 * v] = angle[v] * turns;
    uv[2 * v + 1] = (along[v] - lo) / length;
  }
  // a belly factor: 1 in the middle of the muscle, 0 at its ends
  const belly = new Float32Array(n);
  for (let v = 0; v < n; v++) belly[v] = Math.pow(Math.sin(Math.PI * uv[2 * v + 1]), 0.8);
  // split the vertices of triangles that wrap around the seam
  const extra = [];
  const tri = triangles.slice();
  const copyOf = new Map();
  for (let t = 0; t < tri.length; t += 3) {
    const us = [0, 1, 2].map((k) => uv[2 * tri[t + k]]);
    const max = Math.max(...us);
    if (max - Math.min(...us) < turns * 0.5) continue;
    for (let k = 0; k < 3; k++) {
      const v = tri[t + k];
      if (uv[2 * v] < turns * 0.5) {
        if (!copyOf.has(v)) {
          copyOf.set(v, n + extra.length);
          extra.push(v);
        }
        tri[t + k] = copyOf.get(v);
      }
    }
  }
  return { uv, belly, extra, triangles: tri, turns };
}

const OUT_DIR = new URL("../src/data/zanatomy/", import.meta.url);
mkdirSync(OUT_DIR, { recursive: true });
const chunks = [];
let offset = 0;
const push = (typed) => {
  const bytes = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
  const at = offset;
  chunks.push(bytes);
  offset += bytes.byteLength;
  const pad = (4 - (offset % 4)) % 4;
  if (pad) {
    chunks.push(new Uint8Array(pad));
    offset += pad;
  }
  return at;
};

const meshesOut = [];
let triangleTotal = 0;
for (const list of groups.values()) {
  const first = list[0];
  // merge the pieces
  let vertexCount = 0;
  let indexCount = 0;
  for (const p of list) {
    vertexCount += p.positions.length / 3;
    indexCount += p.triangles.length;
  }
  let positions = new Float32Array(vertexCount * 3);
  let triangles = new Uint32Array(indexCount);
  let tendon = new Float32Array(vertexCount);
  let twist = first.paired && first.role !== "bone" ? new Uint8Array(vertexCount) : null;
  let joints = first.skin ? new Uint8Array(vertexCount * 3) : null;
  let weights = first.skin ? new Uint8Array(vertexCount * 3) : null;
  let vo = 0;
  let io = 0;
  for (const p of list) {
    const n = p.positions.length / 3;
    positions.set(p.positions, vo * 3);
    tendon.set(p.tendon, vo);
    if (twist && p.twist) twist.set(p.twist, vo);
    if (joints) {
      joints.set(p.skin.joints, vo * 3);
      weights.set(p.skin.weights, vo * 3);
    }
    for (let i = 0; i < p.triangles.length; i++) triangles[io + i] = p.triangles[i] + vo;
    vo += n;
    io += p.triangles.length;
  }
  let normals = normalsOf(positions, triangles);
  let uv = null;
  let belly = null;
  const fibrous = first.role === "muscle" || first.role === "tissue";
  if (fibrous) {
    // fibres are worked out per original muscle, then the seam copies are appended
    const uvAll = [];
    const bellyAll = [];
    const extraAll = [];
    const triAll = [];
    let base = 0;
    let extraBase = vertexCount;
    for (const p of list) {
      const n = p.positions.length / 3;
      const local = fibreUV({ positions: positions.subarray(base * 3, (base + n) * 3), triangles: p.triangles });
      for (let v = 0; v < n; v++) {
        uvAll.push(local.uv[2 * v], local.uv[2 * v + 1]);
        bellyAll.push(local.belly[v]);
      }
      for (let t = 0; t < local.triangles.length; t++) {
        const v = local.triangles[t];
        triAll.push(v < n ? v + base : extraBase + (v - n));
      }
      for (const v of local.extra) extraAll.push({ from: base + v, u: local.uv[2 * v] + local.turns, v: local.uv[2 * v + 1], belly: local.belly[v] });
      extraBase += local.extra.length;
      base += n;
    }
    const total = vertexCount + extraAll.length;
    const grow = (arr, size) => {
      const out = new arr.constructor(total * size);
      out.set(arr);
      return out;
    };
    positions = grow(positions, 3);
    normals = grow(normals, 3);
    tendon = grow(tendon, 1);
    if (twist) twist = grow(twist, 1);
    if (joints) {
      joints = grow(joints, 3);
      weights = grow(weights, 3);
    }
    uv = new Float32Array(total * 2);
    uv.set(uvAll);
    belly = new Float32Array(total);
    belly.set(bellyAll);
    extraAll.forEach((x, i) => {
      const v = vertexCount + i;
      for (const [arr, size] of [
        [positions, 3],
        [normals, 3],
        [tendon, 1],
        ...(twist ? [[twist, 1]] : []),
        ...(joints
          ? [
              [joints, 3],
              [weights, 3],
            ]
          : []),
      ])
        for (let k = 0; k < size; k++) arr[v * size + k] = arr[x.from * size + k];
      uv[2 * v] = x.u;
      uv[2 * v + 1] = x.v;
      belly[v] = x.belly;
    });
    triangles = Uint32Array.from(triAll);
    vertexCount = total;
  }

  // reorder for the vertex cache and for compression
  const [remap] = MeshoptEncoder.reorderMesh(triangles, true, false);
  const reorder = (arr, size) => {
    if (!arr) return arr;
    const out = new arr.constructor(arr.length);
    for (let v = 0; v < vertexCount; v++) {
      const to = remap[v];
      if (to === 0xffffffff) continue;
      for (let k = 0; k < size; k++) out[to * size + k] = arr[v * size + k];
    }
    return out;
  };
  positions = reorder(positions, 3);
  normals = reorder(normals, 3);
  tendon = reorder(tendon, 1);
  twist = reorder(twist, 1);
  joints = reorder(joints, 3);
  weights = reorder(weights, 3);
  uv = reorder(uv, 2);
  belly = reorder(belly, 1);

  // quantize into streams of 4-byte multiples, then let meshoptimizer encode them
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < positions.length; i += 3)
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], positions[i + k]);
      max[k] = Math.max(max[k], positions[i + k]);
    }
  // A: x, y, z as uint16 in the mesh's box, tendon share, belly factor
  const a = new DataView(new ArrayBuffer(vertexCount * 8));
  // B: the normal as int8, the twist weight
  const b = new DataView(new ArrayBuffer(vertexCount * 4));
  for (let v = 0; v < vertexCount; v++) {
    for (let k = 0; k < 3; k++) a.setUint16(v * 8 + 2 * k, Math.round(((positions[3 * v + k] - min[k]) / (max[k] - min[k] || 1)) * 65535), true);
    a.setUint8(v * 8 + 6, Math.round(tendon[v] * 255));
    a.setUint8(v * 8 + 7, belly ? Math.round(belly[v] * 255) : 0);
    for (let k = 0; k < 3; k++) b.setInt8(v * 4 + k, Math.round(normals[3 * v + k] * 127));
    b.setUint8(v * 4 + 3, twist ? twist[v] : 0);
  }
  /** A stream: where its encoded bytes start in the file and how many there are. */
  const put = (bytes) => ({ at: push(bytes), n: bytes.byteLength });
  const encode = (view, size) => put(MeshoptEncoder.encodeVertexBuffer(new Uint8Array(view.buffer), vertexCount, size));
  const index32 = vertexCount >= 65536;
  const index = index32 ? triangles : Uint16Array.from(triangles);
  const indexBytes = MeshoptEncoder.encodeIndexBuffer(new Uint8Array(index.buffer, index.byteOffset, index.byteLength), triangles.length, index32 ? 4 : 2);

  const out = {
    name: list.length === 1 ? first.name : `${list.length} pieces: ${list.map((p) => p.name).join(", ")}`.slice(0, 160),
    role: first.role,
    paired: first.paired,
    vertexCount,
    indexCount: triangles.length,
    min,
    max,
    a: encode(a, 8),
    b: encode(b, 4),
    index: put(indexBytes),
    index32,
  };
  for (const f of ["muscle", "part", "landmark", "layer", "cover", "segment"]) if (first[f] !== undefined && first[f] !== null && first[f] !== false) out[f] = first[f];
  // C: fibre coordinates, uint16 u (scaled by uMax) and v
  if (uv) {
    let uMax = 0;
    for (let i = 0; i < uv.length; i += 2) uMax = Math.max(uMax, uv[i]);
    const c = new DataView(new ArrayBuffer(vertexCount * 4));
    for (let v = 0; v < vertexCount; v++) {
      c.setUint16(v * 4, Math.round((uv[2 * v] / uMax) * 65535), true);
      c.setUint16(v * 4 + 2, Math.round(uv[2 * v + 1] * 65535), true);
    }
    out.c = encode(c, 4);
    out.uMax = uMax;
  }
  // D: up to three segments and their weights
  if (joints) {
    const d = new DataView(new ArrayBuffer(vertexCount * 8));
    for (let v = 0; v < vertexCount; v++)
      for (let k = 0; k < 3; k++) {
        d.setUint8(v * 8 + k, joints[3 * v + k]);
        d.setUint8(v * 8 + 4 + k, weights[3 * v + k]);
      }
    out.d = encode(d, 8);
  }
  // the sole of each foot keeps the body on the floor
  if (first.role === "bone" && first.segment === "foot") out.sole = true;
  meshesOut.push(out);
  triangleTotal += triangles.length / 3;
}

const manifest = {
  version: 2,
  source: "Z-Anatomy (CC BY-SA 4.0), from BodyParts3D (CC BY-SA 2.1 JP). See NOTICE.md.",
  scale: S,
  segments: SEGMENTS,
  parents: PARENT,
  rig: rigOut,
  meshes: meshesOut,
};
const json = Buffer.from(JSON.stringify(manifest));
const head = Buffer.alloc(12);
head.write("ZANA", 0, "latin1");
head.writeUInt32LE(1, 4);
head.writeUInt32LE(json.length, 8);
const jsonPad = Buffer.alloc((4 - ((12 + json.length) % 4)) % 4);
const raw = Buffer.concat([head, json, jsonPad, ...chunks.map((c) => Buffer.from(c.buffer, c.byteOffset, c.byteLength))]);
const packed = deflateRawSync(raw, { level: 9 });
writeFileSync(new URL("anatomy.bin", OUT_DIR), packed);
log(`wrote ${meshesOut.length} meshes, ${triangleTotal} triangles: ${(raw.length / 1e6).toFixed(2)} MB raw, ${(packed.length / 1e6).toFixed(2)} MB compressed`);
