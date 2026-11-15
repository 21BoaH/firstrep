import * as THREE from "three";
import { buildSurface, smoothstep } from "./surface.js";
import { createFibreTextures } from "./textures.js";
import { addSkeleton } from "./skeleton.js";

/*
 * A stylised anatomical figure built entirely from parametric surfaces.
 *
 * Units are metres, the figure is 1.8 m tall, stands on y = 0 and faces +z.
 * Only the +x half is modelled; the other half is the same group mirrored.
 *
 * Layers, from the inside out:
 *   core    - torso and limb segments in a dark "deep tissue" colour, fading
 *             to tendon colour near the joints. Not selectable.
 *   sheets  - domed patches with a free-form outline, wrapped on to the core
 *             of the torso or of a limb. Outlines are [degrees around the
 *             core, height]: 0 = front, 90 = outer side, 180 = back.
 *   bellies - spindles between two points, for the few free-standing shapes.
 *
 * Every muscle mesh carries userData.muscle, an id from src/data/muscles.js, and
 * userData.part, the head within that muscle. Bones, ligaments and nerves are
 * added by skeleton.js.
 */

const DEG = Math.PI / 180;

// ----------------------------------------------------------------- colours
const TENDON = new THREE.Color("#d9cebd"); // pearl: tendons and fascia
const APONEUROSIS = new THREE.Color("#bdb19e"); // a calmer pearl for the large flat tendon of the abdomen
const BONE = new THREE.Color("#cdc3b2"); // ivory: collarbone
const PLATE = new THREE.Color("#6b6a6e"); // warm grey: shin and kneecap
const SHELL = new THREE.Color("#343841"); // graphite: head, hands, feet, joints
const DEEP = new THREE.Color("#35101a"); // dark wine: tissue under the surface muscles
const REDS = ["#96222a", "#851c25", "#a52b31", "#7c1823"].map((h) => new THREE.Color(h));

// ----------------------------------------------------------------- profiles
/** Smooth curve through evenly spaced samples: table[i] is the value at y0 + i * dy. */
function profile(table, y0, dy) {
  const n = table.length - 1;
  return (y) => {
    const f = Math.min(n, Math.max(0, (y - y0) / dy));
    const i = Math.min(n - 1, Math.floor(f));
    const t = f - i;
    const p0 = table[Math.max(i - 1, 0)];
    const p1 = table[i];
    const p2 = table[i + 1];
    const p3 = table[Math.min(i + 2, n)];
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t)
    );
  };
}

// Torso: half-width, half-depth and forward offset every 6 cm from y = 0.84 up.
const TORSO_Y0 = 0.84;
const TORSO_Y1 = 1.56;
// Sized for a 1.80 m athletic adult: about 0.34 m across the ribcage, 0.30 m at the waist
// and 0.36 m at the hips once the muscles are on.
const torsoA = profile([0.088, 0.14, 0.156, 0.152, 0.14, 0.135, 0.141, 0.151, 0.159, 0.162, 0.154, 0.108, 0.058], TORSO_Y0, 0.06);
const torsoB = profile([0.078, 0.098, 0.104, 0.098, 0.088, 0.086, 0.092, 0.1, 0.105, 0.104, 0.094, 0.074, 0.058], TORSO_Y0, 0.06);
// The spine's S-curve: pelvis set back, lower back drawn in, upper back rounded, neck leaning forward.
const torsoZ = profile([-0.004, -0.006, -0.004, 0.004, 0.012, 0.016, 0.016, 0.012, 0.006, 0, -0.004, 0.002, 0.012], TORSO_Y0, 0.06);
const TORSO_NOMINAL = 0.15;

/** Point on the torso core at angle phi, raised t along the surface normal. */
function torsoPoint(phi, y, t, target) {
  const e = 0.004;
  const a = torsoA(y);
  const b = torsoB(y);
  const z0 = torsoZ(y);
  const da = (torsoA(y + e) - torsoA(y - e)) / (2 * e);
  const db = (torsoB(y + e) - torsoB(y - e)) / (2 * e);
  const dz = (torsoZ(y + e) - torsoZ(y - e)) / (2 * e);
  const sp = Math.sin(phi);
  const cp = Math.cos(phi);
  let nx = b * sp;
  let ny = -(b * da * sp * sp + a * cp * (dz + db * cp));
  let nz = a * cp;
  const inv = 1 / Math.hypot(nx, ny, nz);
  nx *= inv;
  ny *= inv;
  nz *= inv;
  return target.set(a * sp + nx * t, y + ny * t, z0 + b * cp + nz * t);
}
const torso = {
  nominal: TORSO_NOMINAL,
  carrier: (s, y, t, target) => torsoPoint(s / TORSO_NOMINAL, y, t, target),
};

/** A limb segment: a surface of revolution about its own y axis (y = 0 at the upper joint, going down). */
function limbCore(table, nominal, cap = 0, bow = () => 0) {
  const body = profile(table, 0.06, -0.06);
  // cap > 0 closes the top of the segment with a dome of that height (the shoulder)
  const radius = cap > 0 ? (y) => (y > 0 ? body(0) * Math.sqrt(Math.max(1e-4, 1 - (y / cap) ** 2)) : body(y)) : body;
  const carrier = (s, y, t, target) => {
    const az = s / nominal;
    const e = 0.003;
    const r = radius(y);
    const dr = (radius(y + e) - radius(y - e)) / (2 * e);
    const inv = 1 / Math.hypot(1, dr);
    const sa = Math.sin(az);
    const ca = Math.cos(az);
    return target.set((r + t * inv) * sa, y - t * dr * inv, (r + t * inv) * ca + bow(y));
  };
  return { nominal, carrier, radius };
}
const upperArm = limbCore([0.044, 0.044, 0.043, 0.041, 0.039, 0.037, 0.034, 0.032], 0.045, 0.052);
const lowerArm = limbCore([0.035, 0.036, 0.039, 0.036, 0.03, 0.025, 0.022, 0.022], 0.035);
// the thigh bone bows forward a little, which gives the front of the thigh its curve in profile
const upperLeg = limbCore([0.058, 0.066, 0.069, 0.068, 0.065, 0.06, 0.054, 0.049, 0.045, 0.043], 0.07, 0, (y) => 0.012 * Math.sin(Math.PI * Math.min(1, Math.max(0, -y / 0.43))));
const lowerLeg = limbCore([0.05, 0.047, 0.046, 0.047, 0.045, 0.04, 0.034, 0.03, 0.028, 0.028], 0.045);

/** A patch of a vertical cylinder: used where the torso is the wrong base (glutes). */
function cylinderPatch({ origin, normal, radius }) {
  const O = new THREE.Vector3(...origin);
  const en = new THREE.Vector3(...normal).normalize();
  const ey = new THREE.Vector3(0, 1, 0);
  const ex = new THREE.Vector3().crossVectors(ey, en).normalize();
  const carrier = (s, y, t, target) => {
    const ang = s / radius;
    const r = radius + t;
    return target
      .copy(O)
      .addScaledVector(ey, y)
      .addScaledVector(ex, r * Math.sin(ang))
      .addScaledVector(en, r * Math.cos(ang) - radius);
  };
  return { nominal: 1 / DEG, carrier }; // outlines for this patch are given in metres
}

// ---------------------------------------------------------------- geometry
/** Outline of a tilted ellipse, in [degrees, height]. */
function ellipse(core, cDeg, cy, halfLength, halfWidth, tiltDeg, n = 12) {
  const k = DEG * core.nominal;
  const c = Math.cos(tiltDeg * DEG);
  const s = Math.sin(tiltDeg * DEG);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const x = Math.cos(a) * halfLength;
    const y = Math.sin(a) * halfWidth;
    pts.push([cDeg + (x * c - y * s) / k, cy + x * s + y * c]);
  }
  return pts;
}

function sheetGeometry(spec) {
  const {
    core = torso,
    outline,
    T,
    dome = 0.72, // below 1 = flat top with steep sides, 1 = round
    sink = 0.004, // how far the rim is tucked under the core surface
    fiber = { type: "parallel", angle: 90 },
    tendon = [0, 0], // share of the fibre length that is tendon at the start / end
    color,
    tension = 0.5,
    rimShade = 0.46,
    nu = 60,
    nv = 13,
  } = spec;
  const k = DEG * core.nominal;
  const curve = new THREE.CatmullRomCurve3(
    outline.map(([deg, y]) => new THREE.Vector3(deg * k, y, 0)),
    true,
    "catmullrom",
    tension,
  );
  const poly = curve.getPoints(180);

  let cx = 0;
  let cy = 0;
  for (const p of poly) {
    cx += p.x;
    cy += p.y;
  }
  cx /= poly.length;
  cy /= poly.length;

  // distance from the centre to the outline for every direction
  const N = 240;
  const reach = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2;
    const dx = Math.cos(ang);
    const dy = Math.sin(ang);
    let best = 0;
    for (let j = 0; j < poly.length - 1; j++) {
      const p = poly[j];
      const q = poly[j + 1];
      const ex = q.x - p.x;
      const ey = q.y - p.y;
      const denom = dx * ey - dy * ex;
      if (Math.abs(denom) < 1e-12) continue;
      const t = ((p.x - cx) * ey - (p.y - cy) * ex) / denom;
      const w = ((p.x - cx) * dy - (p.y - cy) * dx) / denom;
      if (t > 0 && w >= 0 && w <= 1) best = Math.max(best, t);
    }
    reach[i] = best;
  }
  const reachAt = (u) => {
    const f = (((u % 1) + 1) % 1) * N;
    const i = Math.floor(f) % N;
    const t = f - Math.floor(f);
    return reach[i] * (1 - t) + reach[(i + 1) % N] * t;
  };

  // fibre space: fu runs across the fibres, fv along them (0..1)
  let fibre;
  if (fiber.type === "fan") {
    const fx = fiber.point[0] * k;
    const fy = fiber.point[1];
    const rl = Math.hypot(cx - fx, cy - fy);
    const rx = (cx - fx) / rl;
    const ry = (cy - fy) / rl;
    let min = Infinity;
    let max = 0;
    for (const p of poly) {
      const d = Math.hypot(p.x - fx, p.y - fy);
      min = Math.min(min, d);
      max = Math.max(max, d);
    }
    fibre = (s, y, out) => {
      const dx = s - fx;
      const dy = y - fy;
      const ang = Math.atan2(rx * dy - ry * dx, rx * dx + ry * dy);
      out.set(ang * 2.4, (Math.hypot(dx, dy) - min) / (max - min));
    };
  } else {
    const dx = Math.cos(fiber.angle * DEG);
    const dy = Math.sin(fiber.angle * DEG);
    let min = Infinity;
    let max = -Infinity;
    for (const p of poly) {
      const d = (p.x - cx) * dx + (p.y - cy) * dy;
      min = Math.min(min, d);
      max = Math.max(max, d);
    }
    fibre = (s, y, out) => {
      const along = (s - cx) * dx + (y - cy) * dy;
      const across = -(s - cx) * dy + (y - cy) * dx;
      out.set(across / 0.06, (along - min) / (max - min));
    };
  }

  const fn = (u, v, o) => {
    const ang = u * Math.PI * 2;
    const theta = v * Math.PI * 0.5;
    const rho = Math.pow(Math.sin(theta), dome);
    const h = Math.pow(Math.max(0, Math.cos(theta)), dome);
    const r = reachAt(u) * rho;
    const s = cx + r * Math.cos(ang);
    const y = cy + r * Math.sin(ang);
    core.carrier(s, y, T * h - sink, o.p);
    fibre(s, y, o.uv);

    const fv = o.uv.y;
    let kt = 0;
    if (tendon[0] > 0) kt = Math.max(kt, 1 - smoothstep(tendon[0] * 0.35, tendon[0] * 1.5, fv));
    if (tendon[1] > 0) kt = Math.max(kt, smoothstep(1 - tendon[1] * 1.5, 1 - tendon[1] * 0.35, fv));
    o.c.copy(color).lerp(TENDON, kt * 0.92);
    // darken the rim so neighbouring muscles read as separate shapes
    o.c.multiplyScalar(1 - rimShade * smoothstep(0.62, 1, v));
  };
  return buildSurface(fn, nu, nv, { poleStart: true });
}

/**
 * A long thin muscle that follows a straight line across a core (sartorius).
 * A domed sheet cannot do this: its outline is sampled by angle from the centre,
 * which starves the far ends of a very elongated shape.
 */
function strapGeometry({ core, from, to, halfWidth, T, lift = 0, color, tendon = [0.08, 0.08] }) {
  const k = DEG * core.nominal;
  const ax = from[0] * k;
  const ay = from[1];
  const bx = to[0] * k;
  const by = to[1];
  const len = Math.hypot(bx - ax, by - ay);
  const nx = -(by - ay) / len;
  const ny = (bx - ax) / len;
  const fn = (u, v, o) => {
    const ang = u * Math.PI;
    const taper = Math.pow(Math.max(0, Math.sin(v * Math.PI)), 0.35);
    const off = halfWidth * taper * Math.cos(ang);
    const h = T * taper * Math.sin(ang);
    core.carrier(ax + (bx - ax) * v + nx * off, ay + (by - ay) * v + ny * off, lift * taper + h - 0.002, o.p);
    o.uv.set(off / 0.06, v);
    let kt = 0;
    if (tendon[0] > 0) kt = Math.max(kt, 1 - smoothstep(tendon[0] * 0.35, tendon[0] * 1.5, v));
    if (tendon[1] > 0) kt = Math.max(kt, smoothstep(1 - tendon[1] * 1.5, 1 - tendon[1] * 0.35, v));
    o.c.copy(color).lerp(TENDON, kt * 0.92);
    o.c.multiplyScalar(1 - 0.3 * Math.pow(Math.abs(Math.cos(ang)), 3));
  };
  return buildSurface(fn, 10, 40, { poleStart: true, poleEnd: true });
}

const bellyCache = new Map();
function bellyGeometry({ sharp = 1.25, skew = 0, tendonTop = 0.16, tendonBottom = 0.2, color, repeat = 3 }) {
  const key = [sharp, skew, tendonTop, tendonBottom, color.getHexString(), repeat].join("|");
  if (bellyCache.has(key)) return bellyCache.get(key);
  const fn = (u, v, o) => {
    const phi = u * Math.PI * 2;
    const t = 1 - 2 * v;
    const tw = Math.min(1, Math.max(-1, t - skew * (1 - t * t)));
    const r = Math.pow(Math.max(0, 1 - tw * tw), sharp / 2);
    o.p.set(r * Math.cos(phi), t, r * Math.sin(phi));
    o.uv.set(u * repeat, v);
    let kt = 0;
    if (tendonTop > 0) kt = Math.max(kt, 1 - smoothstep(tendonTop * 0.4, tendonTop * 1.6, v));
    if (tendonBottom > 0) kt = Math.max(kt, smoothstep(1 - tendonBottom * 1.6, 1 - tendonBottom * 0.4, v));
    o.c.copy(color).lerp(TENDON, kt * 0.92);
  };
  const geometry = buildSurface(fn, 28, 20, { poleStart: true, poleEnd: true });
  bellyCache.set(key, geometry);
  return geometry;
}

/** A smooth mannequin head: wide cranium, narrower jaw, chin set slightly forward. */
function headGeometry() {
  const fn = (u, v, o) => {
    const phi = u * Math.PI * 2;
    const t = Math.cos(v * Math.PI);
    const s = Math.sin(v * Math.PI);
    const jaw = t >= 0 ? 0 : -t;
    const round = Math.pow(s, t >= 0 ? 1 : 0.86);
    const width = 0.079 * round * (1 - 0.3 * Math.pow(jaw, 1.5));
    const front = (0.093 - 0.014 * jaw) * round;
    const back = 0.097 * s * (1 - 0.5 * jaw);
    const cz = Math.cos(phi);
    const depth = back + (front - back) * smoothstep(-0.4, 0.4, cz);
    o.p.set(width * Math.sin(phi), (t >= 0 ? 0.104 : 0.124) * t, depth * cz + 0.022 * Math.pow(jaw, 1.5));
    o.uv.set(u, v);
    o.c.setRGB(1, 1, 1);
  };
  return buildSurface(fn, 44, 30, { poleStart: true, poleEnd: true });
}

/** A foot with a flat sole: rounded heel, high instep, wide ball, tapered toes. Sole at y = 0, ankle above z = 0. */
function footGeometry() {
  const halfWidth = profile([0.03, 0.036, 0.04, 0.044, 0.048, 0.045, 0.034], 0, 1 / 6);
  const height = profile([0.032, 0.052, 0.054, 0.04, 0.028, 0.021, 0.015], 0, 1 / 6);
  const fn = (u, v, o) => {
    const theta = u * Math.PI * 2;
    const s = Math.pow(Math.max(0, Math.sin(v * Math.PI)), 0.42);
    const w = halfWidth(v) * s;
    const h = height(v) * s;
    const sn = Math.sin(theta);
    o.p.set(w * Math.cos(theta), (sn >= 0 ? h * sn : 0.16 * h * sn) + 0.16 * height(v) * s, -0.064 + 0.252 * (0.5 - 0.5 * Math.cos(v * Math.PI)));
    o.uv.set(u, v);
    o.c.setRGB(1, 1, 1);
  };
  return buildSurface(fn, 28, 28, { poleStart: true, poleEnd: true });
}

// ----------------------------------------------------------------- builder
/*
 * Every muscle mesh is tagged with:
 *   muscle  the group id from src/data/muscles.js
 *   part    the head or sub-muscle within that group ("main" when it has only one)
 *   layer   "surface" or "deep". Deep muscles are hidden until the Deep layer is chosen.
 *   cover   true for surface muscles that are lifted away in the Deep layer
 * Each part has its own material, so one head can be lit on its own.
 */
export function buildBody() {
  const fibre = createFibreTextures();
  const root = new THREE.Group();
  root.name = "body";

  // core surfaces carry their colour per vertex; simple primitives use the flat materials
  const coreMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.5, metalness: 0 });
  // satin graphite shell for everything that is not muscle, tendon or bone
  const boneMaterial = new THREE.MeshPhysicalMaterial({ color: SHELL, roughness: 0.48, metalness: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const ivoryMaterial = new THREE.MeshStandardMaterial({ color: PLATE, roughness: 0.45, metalness: 0.15 });
  const deepMaterial = new THREE.MeshStandardMaterial({ color: DEEP, roughness: 0.6, metalness: 0 });

  /** "muscle/part" -> { key, muscle, part, layer, cover, material, meshes[] } */
  const parts = new Map();
  const partFor = (id, spec) => {
    const part = spec.part ?? "main";
    const key = id + "/" + part;
    if (!parts.has(key)) {
      // living tissue: a soft sheen at grazing angles and a thin wet coat on top
      const material = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        vertexColors: true,
        map: fibre.map,
        bumpMap: fibre.bumpMap,
        bumpScale: 1.4,
        roughness: 0.44,
        metalness: 0,
        sheen: 0.7,
        sheenColor: new THREE.Color("#ff8f7d"),
        sheenRoughness: 0.45,
        clearcoat: 0.3,
        clearcoatRoughness: 0.38,
        emissive: 0x000000,
        emissiveMap: fibre.map, // the glow of a selected muscle keeps its fibres
      });
      material.name = key;
      parts.set(key, { key, muscle: id, part, layer: spec.layer ?? "surface", cover: Boolean(spec.cover), material, meshes: [] });
    }
    return parts.get(key);
  };
  const tagMuscle = (mesh, id, spec, kind) => {
    const entry = partFor(id, spec);
    mesh.material = entry.material;
    mesh.userData.muscle = id;
    mesh.userData.part = entry.part;
    mesh.userData.key = entry.key;
    mesh.userData.kind = kind;
    mesh.userData.layer = entry.layer;
    if (entry.cover) mesh.userData.cover = true;
  };
  /** A named, non-selectable structure on the surface (fascia, tendon, bone landmark). */
  const tagLandmark = (mesh, spec) => {
    mesh.userData.layer = "surface";
    if (spec.landmark) mesh.userData.landmark = spec.landmark;
    if (spec.cover) mesh.userData.cover = true;
  };
  let tint = 0;
  const nextRed = () => REDS[tint++ % REDS.length];

  const bone = (parent, geometry, position, scale, material = boneMaterial) => {
    const mesh = new THREE.Mesh(geometry, material);
    if (position) mesh.position.set(...position);
    if (scale) mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  };

  /** id = null makes a non-selectable tendon or bone patch; give it a `landmark` to label it. */
  const sheet = (parent, id, spec) => {
    const isMuscle = id !== null;
    const geometry = sheetGeometry({
      color: isMuscle ? nextRed() : TENDON,
      ...(isMuscle ? {} : { rimShade: 0.18 }),
      ...spec,
    });
    // recentre so the mesh can be scaled about its own middle
    const c = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-c.x, -c.y, -c.z);
    const mesh = new THREE.Mesh(geometry, coreMaterial);
    mesh.position.copy(c);
    if (isMuscle) tagMuscle(mesh, id, spec, "sheet");
    else tagLandmark(mesh, spec);
    parent.add(mesh);
    return mesh;
  };

  /** A long, narrow muscle that follows a line across a core (see strapGeometry). */
  const strap = (parent, id, spec) => {
    const geometry = strapGeometry({ color: nextRed(), ...spec });
    const c = geometry.boundingBox.getCenter(new THREE.Vector3());
    geometry.translate(-c.x, -c.y, -c.z);
    const mesh = new THREE.Mesh(geometry, coreMaterial);
    mesh.position.copy(c);
    tagMuscle(mesh, id, spec, "sheet");
    parent.add(mesh);
    return mesh;
  };

  const _y = new THREE.Vector3();
  const _x = new THREE.Vector3();
  const _z = new THREE.Vector3();
  const _m = new THREE.Matrix4();
  /** A spindle between two points; `out` is the direction its depth axis faces. */
  const belly = (parent, id, spec) => {
    const { from, to, w, d, out, color, part, layer, cover, landmark, ...shape } = spec;
    const A = new THREE.Vector3(...from);
    const B = new THREE.Vector3(...to);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    _y.subVectors(A, B);
    const len = _y.length();
    _y.normalize();
    _z.set(...out);
    _z.addScaledVector(_y, -_z.dot(_y)).normalize();
    _x.crossVectors(_y, _z).normalize();
    _m.makeBasis(_x, _y, _z);

    const isMuscle = id !== null;
    const geometry = bellyGeometry({
      color: isMuscle ? nextRed() : (color ?? TENDON),
      ...(isMuscle ? {} : { tendonTop: 0, tendonBottom: 0 }),
      ...shape,
    });
    const mesh = new THREE.Mesh(geometry, coreMaterial);
    mesh.quaternion.setFromRotationMatrix(_m);
    mesh.position.copy(mid);
    mesh.scale.set(w / 2, len / 2, d / 2);
    if (isMuscle) tagMuscle(mesh, id, spec, "belly");
    else tagLandmark(mesh, spec);
    parent.add(mesh);
    return mesh;
  };

  /** The core of a limb segment. tendonFrom..tendonTo: where deep tissue fades to the joint shell. */
  const limbSurface = (parent, core, yTop, yBottom, tendonFrom, tendonTo) => {
    const colour = new THREE.Color();
    const geometry = buildSurface(
      (u, v, o) => {
        const y = yTop + (yBottom - yTop) * v;
        core.carrier(u * Math.PI * 2 * core.nominal, y, -0.002, o.p);
        o.uv.set(u, v);
        const k = tendonFrom === undefined ? 0 : smoothstep(tendonFrom, tendonTo, y);
        o.c.copy(colour.copy(DEEP).lerp(SHELL, k)); // the segment turns into the graphite shell toward the joint
      },
      28,
      22,
    );
    const mesh = new THREE.Mesh(geometry, coreMaterial);
    parent.add(mesh);
    return mesh;
  };

  const sphere = new THREE.SphereGeometry(1, 24, 16);
  const headShape = headGeometry();
  const footShape = footGeometry();
  const HEAD_AT = [0, 1.698, 0.03];
  const FOOT_AT = [0.003, -0.4945, 0];
  const FOOT_TURN = [-0.08, 0.14, 0];

  // ------------------------------------------------------------ centre line
  const centre = new THREE.Group();
  root.add(centre);

  const torsoGeometry = buildSurface(
    (u, v, o) => {
      torsoPoint(u * Math.PI * 2, TORSO_Y0 + (TORSO_Y1 - TORSO_Y0) * v, 0, o.p);
      o.uv.set(u, v);
      o.c.copy(DEEP);
    },
    56,
    40,
  );
  centre.add(new THREE.Mesh(torsoGeometry, coreMaterial));
  bone(centre, sphere, [0, 0.852, 0], [0.1, 0.05, 0.078], deepMaterial); // pelvic floor
  bone(centre, new THREE.CylinderGeometry(0.054, 0.062, 0.17, 28), [0, 1.578, 0.012]).rotation.x = 0.2; // neck, leaning forward
  bone(centre, headShape, HEAD_AT); // carried slightly ahead of the shoulders

  // tendon sheets that span the midline
  // rectus sheath, continuing below the navel into the flat tendon of the obliques. Its lower
  // edge is the groin line, from the front point of each hip bone down to the pubic bone.
  sheet(centre, null, {
    outline: [[0, 1.296], [28.5, 1.294], [29.5, 1.12], [41, 1.035], [58, 0.992], [31, 0.94], [9, 0.9], [0, 0.893], [-9, 0.9], [-31, 0.94], [-58, 0.992], [-41, 1.035], [-29.5, 1.12], [-28.5, 1.294]],
    T: 0.006,
    sink: 0.002,
    tension: 0.4,
    nu: 96,
    color: APONEUROSIS,
    landmark: "rectus-sheath",
    cover: true,
  });
  sheet(centre, null, { outline: [[-4, 1.455], [4, 1.455], [4.5, 1.37], [3, 1.285], [-3, 1.285], [-4.5, 1.37]], T: 0.008, sink: 0.002, landmark: "breastbone" });
  sheet(centre, null, { outline: [[177.6, 1.57], [182.4, 1.57], [182.6, 1.4], [182.4, 1.2], [177.6, 1.2], [177.4, 1.4]], T: 0.006, sink: 0.002, landmark: "spine" });
  sheet(centre, null, { outline: [[180, 1.31], [190, 1.21], [198, 1.09], [204, 1.02], [196, 0.955], [180, 0.925], [164, 0.955], [156, 1.02], [162, 1.09], [170, 1.21]], T: 0.007, sink: 0.002, nu: 72, landmark: "lumbar-fascia", cover: true });

  // ------------------------------------------------------------ right half
  const half = new THREE.Group();

  // collarbone: a landmark, not selectable
  belly(half, null, { from: [0.018, 1.478, 0.086], to: [0.164, 1.494, 0.012], w: 0.017, d: 0.017, out: [0, 0.5, 1], sharp: 0.6, color: BONE, landmark: "collarbone" });
  // sternocleidomastoid: the strap from behind the ear to the top of the breastbone
  belly(half, "neck", { from: [0.056, 1.655, 0.012], to: [0.014, 1.487, 0.08], w: 0.032, d: 0.027, out: [0.6, 0, 0.8], sharp: 1.0, tendonTop: 0.12, tendonBottom: 0.22 });

  // --- front of the torso
  // Pectoralis major in its two portions. Both converge on the same spot on the upper arm.
  const pec = { fiber: { type: "fan", point: [94, 1.41] }, tendon: [0.14, 0] };
  sheet(half, "chest", { ...pec, part: "upper", outline: [[3, 1.449], [32, 1.463], [60, 1.463], [84, 1.428], [80, 1.403], [50, 1.412], [20, 1.418], [4, 1.42]], T: 0.028 });
  sheet(half, "chest", { ...pec, part: "lower", outline: [[3.5, 1.413], [20, 1.41], [50, 1.403], [82, 1.398], [72, 1.335], [44, 1.292], [16, 1.29], [4, 1.32]], T: 0.032 });

  // Rectus abdominis. Each side is widest under the ribs (about 6.5 cm) and narrows toward
  // the pubic bone. Three tendon bands split it: at the tip of the breastbone, at the navel
  // (y = 1.09) and half-way between. Below the navel it runs on as one long segment.
  const abBlock = { T: 0.017, dome: 0.62, tension: 0.35, nu: 40, nv: 9, cover: true };
  // top block: its outer corner is cut away by the edge of the ribcage
  sheet(half, "abs", { ...abBlock, outline: [[2.2, 1.286], [12, 1.288], [23, 1.279], [26.5, 1.259], [25.6, 1.234], [12, 1.23], [2.2, 1.232], [1.8, 1.259]] });
  sheet(half, "abs", { ...abBlock, outline: [[2.2, 1.224], [13, 1.226], [26, 1.222], [27, 1.195], [26, 1.168], [13, 1.164], [2.2, 1.166], [1.8, 1.195]] });
  sheet(half, "abs", { ...abBlock, outline: [[2.2, 1.158], [13, 1.16], [25.5, 1.156], [26.2, 1.126], [25, 1.096], [13, 1.092], [2.2, 1.094], [1.8, 1.126]] });
  sheet(half, "abs", {
    ...abBlock,
    T: 0.016,
    outline: [[2.2, 1.086], [12, 1.088], [23.5, 1.084], [23, 1.03], [19.5, 0.972], [13.5, 0.926], [6.5, 0.902], [2.2, 0.9], [1.8, 1.0]],
    tendon: [0.12, 0],
  });
  // External oblique. Its upper edge steps down along the ribs under the serratus slips, its
  // back edge meets the lats, and its lower edge sits on the rim of the pelvis. Toward the
  // front the fibers end on a line that runs down beside the abs and then swings out to the
  // front point of the hip bone. Everything in front of that line is flat tendon.
  sheet(half, "obliques", {
    outline: [[30, 1.278], [46, 1.276], [57, 1.268], [63, 1.236], [68, 1.2], [82, 1.186], [96, 1.168], [104, 1.13], [104, 1.052], [86, 1.012], [60, 0.998], [44, 1.04], [31.5, 1.12], [30, 1.2]],
    T: 0.017,
    fiber: { type: "parallel", angle: 50 },
    tendon: [0.12, 0],
    nu: 72,
    cover: true,
  });
  const serratusSlips = [
    [67, 1.318],
    [73, 1.282],
    [78, 1.246],
    [82, 1.21],
  ];
  for (const [phi, y] of serratusSlips) {
    sheet(half, "serratus", {
      outline: ellipse(torso, phi, y, 0.04, 0.019, -24),
      T: 0.015,
      dome: 0.85,
      fiber: { type: "parallel", angle: -24 },
      tendon: [0, 0.2],
      nu: 28,
      nv: 7,
    });
  }

  // --- deep layer of the trunk, shown once the abs and obliques are lifted away
  // Transversus abdominis: the innermost belt of the waist, with level fibers.
  sheet(half, "deep-core", {
    part: "transversus",
    layer: "deep",
    outline: [[36, 1.262], [60, 1.25], [84, 1.2], [104, 1.15], [116, 1.1], [114, 1.04], [90, 1.015], [62, 1.0], [42, 1.0], [33, 1.1]],
    T: 0.013,
    fiber: { type: "parallel", angle: 0 },
    tendon: [0.12, 0.04],
    nu: 72,
  });
  // Psoas major: from the side of the lower spine down to the groin.
  strap(half, "hip-flexors", { part: "psoas", layer: "deep", core: torso, from: [7, 1.2], to: [26, 0.958], halfWidth: 0.02, T: 0.02, tendon: [0.06, 0.16] });
  // Iliacus: fans across the inside of the hip bone and joins the psoas.
  sheet(half, "hip-flexors", {
    part: "iliacus",
    layer: "deep",
    outline: [[30, 1.04], [50, 1.03], [62, 1.0], [46, 0.96], [30, 0.95], [24, 0.99]],
    T: 0.014,
    fiber: { type: "fan", point: [27, 0.935] },
    tendon: [0.14, 0],
  });

  // --- back of the torso
  // Trapezius, upper and middle parts: one sheet from the back of the skull, down the neck,
  // over the top of the shoulder to the outer collarbone, and along the ridge of the shoulder
  // blade. Its fibers converge on the point of the shoulder.
  sheet(half, "traps", {
    part: "upper",
    cover: true,
    outline: [[178.6, 1.612], [158, 1.61], [146, 1.59], [133, 1.558], [120, 1.543], [100, 1.512], [84, 1.492], [98, 1.468], [112, 1.46], [130, 1.445], [150, 1.425], [165, 1.4], [178.6, 1.385]],
    T: 0.025,
    fiber: { type: "fan", point: [98, 1.476] },
    tendon: [0.07, 0.05],
    nu: 80,
    nv: 14,
  });
  // Trapezius, lower part: a triangle whose fibers run up and out from the spine (down to the
  // last rib) to the inner end of the shoulder blade's ridge.
  sheet(half, "traps", {
    part: "lower",
    cover: true,
    outline: [[178.6, 1.405], [166, 1.418], [152, 1.436], [149, 1.412], [158, 1.35], [168, 1.27], [177.6, 1.185], [178.6, 1.29]],
    T: 0.02,
    fiber: { type: "fan", point: [148, 1.44] },
    tendon: [0.14, 0.05],
  });
  // Rhomboids: under the traps, sloping down and out from the spine to the shoulder blade.
  sheet(half, "rhomboids", {
    layer: "deep",
    outline: [[177.6, 1.52], [166, 1.49], [153.5, 1.445], [153, 1.34], [166, 1.36], [177.6, 1.395]],
    T: 0.016,
    fiber: { type: "parallel", angle: 50 },
    tendon: [0.1, 0.08],
  });
  // Supraspinatus: the cuff muscle above the ridge of the shoulder blade, under the traps.
  sheet(half, "rotator-cuff", {
    part: "supraspinatus",
    layer: "deep",
    outline: [[152, 1.452], [150, 1.484], [132, 1.497], [114, 1.492], [106, 1.476], [126, 1.464], [140, 1.455]],
    T: 0.014,
    fiber: { type: "fan", point: [102, 1.478] },
    tendon: [0.14, 0],
  });
  // Infraspinatus: fills the shoulder blade below its ridge and narrows toward the arm.
  sheet(half, "rotator-cuff", {
    part: "infraspinatus",
    outline: [[151, 1.428], [130, 1.441], [112, 1.452], [101, 1.44], [103, 1.414], [118, 1.384], [135, 1.352], [150, 1.336], [153.5, 1.38]],
    T: 0.02,
    fiber: { type: "fan", point: [96, 1.445] },
    tendon: [0.12, 0],
  });
  // Teres minor: the slim cuff muscle along the outer edge of the shoulder blade.
  strap(half, "rotator-cuff", { part: "teres-minor", core: torso, from: [143, 1.337], to: [102, 1.408], halfWidth: 0.012, T: 0.013, tendon: [0.06, 0.16] });
  // Teres major: the thicker strap below it. It is not part of the cuff. It does the same
  // job as the lats, so it belongs to that group.
  strap(half, "lats", { part: "teres", core: torso, from: [148, 1.312], to: [100, 1.384], halfWidth: 0.018, T: 0.017, tendon: [0.05, 0.18] });
  // Latissimus dorsi. Its upper edge runs almost level from the mid-back across the tip of
  // the shoulder blade and then climbs to the armpit. The front edge forms the side of the
  // torso and the lower edge reaches the rim of the pelvis. Toward the spine the fibers give
  // way to tendon, which is the pale zone that blends into the lumbar fascia.
  sheet(half, "lats", {
    part: "lat",
    outline: [[170, 1.31], [158, 1.304], [146, 1.302], [128, 1.326], [110, 1.362], [99, 1.392], [93, 1.366], [93, 1.3], [96, 1.22], [104, 1.14], [118, 1.07], [134, 1.036], [150, 1.022], [160, 1.03], [165, 1.09], [169, 1.17], [169.5, 1.25]],
    T: 0.027,
    fiber: { type: "fan", point: [95, 1.4] },
    tendon: [0.06, 0.26],
    nu: 80,
    nv: 13,
  });
  sheet(half, "lower-back", {
    cover: true,
    outline: [[178.4, 1.215], [170.5, 1.2], [166, 1.1], [167, 1.0], [173, 0.962], [178.4, 0.962]],
    T: 0.024,
    dome: 0.8,
    tendon: [0.2, 0],
  });
  // Multifidus: short bundles packed against the spine, under the erectors.
  sheet(half, "deep-core", {
    part: "multifidus",
    layer: "deep",
    outline: [[178.4, 1.5], [175, 1.49], [172, 1.3], [168, 1.12], [168, 1.0], [173, 0.95], [178.4, 0.945]],
    T: 0.015,
    fiber: { type: "parallel", angle: 84 },
    tendon: [0.1, 0.06],
  });

  // --- hips
  sheet(half, "hip-abductors", {
    part: "medius",
    cover: true,
    outline: [[92, 1.03], [112, 1.04], [132, 1.02], [140, 0.975], [122, 0.925], [104, 0.905], [90, 0.94], [86, 0.99]],
    T: 0.024,
    fiber: { type: "fan", point: [104, 0.88] },
    tendon: [0.12, 0],
  });
  // Gluteus minimus: the smaller fan underneath the medius.
  sheet(half, "hip-abductors", {
    part: "minimus",
    layer: "deep",
    outline: [[96, 1.0], [112, 1.012], [127, 0.99], [122, 0.935], [105, 0.915], [92, 0.948]],
    T: 0.018,
    fiber: { type: "fan", point: [104, 0.89] },
    tendon: [0.14, 0],
  });
  sheet(half, "glutes", {
    cover: true,
    core: cylinderPatch({ origin: [0.085, 0.925, -0.074], normal: [0.3, 0, -1], radius: 0.16 }),
    outline: [[0.075, 0.075], [0, 0.105], [-0.075, 0.07], [-0.095, -0.02], [-0.06, -0.095], [0.01, -0.115], [0.07, -0.07], [0.085, 0]],
    T: 0.058,
    dome: 0.88,
    sink: 0,
    fiber: { type: "parallel", angle: 38 },
    tendon: [0.08, 0.1],
    nu: 48,
    nv: 12,
  });
  // Piriformis: runs almost level from the base of the spine to the top of the thigh bone.
  strap(half, "piriformis", { layer: "deep", core: torso, from: [171, 0.958], to: [107, 0.925], halfWidth: 0.017, T: 0.016, tendon: [0.06, 0.2] });

  // --- arm
  const arm = new THREE.Group();
  arm.position.set(0.174, 1.445, -0.002);
  arm.rotation.z = 0.24;
  half.add(arm);
  limbSurface(arm, upperArm, 0.0515, -0.31, -0.24, -0.3);
  bone(arm, sphere, [0, -0.302, -0.006], [0.034, 0.036, 0.037]); // elbow

  // deltoid: three heads that share one insertion half-way down the arm
  const deltoid = { T: 0.025, dome: 0.8, fiber: { type: "fan", point: [90, -0.19] }, tendon: [0.16, 0], core: upperArm };
  sheet(arm, "shoulders", { ...deltoid, part: "side", outline: [[56, 0.041], [90, 0.046], [124, 0.041], [127, -0.03], [104, -0.135], [90, -0.152], [76, -0.135], [53, -0.03]] });
  sheet(arm, "shoulders", { ...deltoid, part: "front", outline: [[-10, 0.016], [22, 0.038], [52, 0.041], [50, -0.03], [72, -0.128], [58, -0.14], [20, -0.075], [-12, -0.03]] });
  sheet(arm, "shoulders", { ...deltoid, part: "rear", outline: [[190, 0.016], [158, 0.038], [128, 0.041], [130, -0.03], [108, -0.128], [122, -0.14], [160, -0.075], [192, -0.03]] });

  sheet(arm, "biceps", { part: "biceps", core: upperArm, outline: [[-40, -0.075], [0, -0.058], [40, -0.075], [52, -0.16], [38, -0.265], [0, -0.288], [-38, -0.265], [-52, -0.16]], T: 0.03, dome: 0.95, tendon: [0.16, 0.14] });
  sheet(arm, "biceps", { part: "brachialis", core: upperArm, outline: ellipse(upperArm, 74, -0.225, 0.062, 0.014, 86), T: 0.015, dome: 0.9, tendon: [0.2, 0] });
  sheet(arm, null, { core: upperArm, outline: [[140, -0.2], [180, -0.185], [220, -0.2], [212, -0.3], [180, -0.315], [148, -0.3]], T: 0.008, landmark: "triceps-tendon" });
  sheet(arm, "triceps", { part: "lateral", core: upperArm, outline: [[98, -0.105], [130, -0.075], [166, -0.09], [170, -0.17], [152, -0.235], [116, -0.225], [96, -0.165]], T: 0.024, dome: 0.85, tendon: [0.18, 0] });
  sheet(arm, "triceps", { part: "long", core: upperArm, outline: [[173, -0.06], [212, -0.04], [252, -0.07], [258, -0.16], [238, -0.245], [196, -0.255], [173, -0.19]], T: 0.027, dome: 0.85, tendon: [0.2, 0] });
  // medial head: the deepest of the three, showing low on the inner side of the arm
  sheet(arm, "triceps", { part: "medial", core: upperArm, outline: [[234, -0.205], [262, -0.19], [284, -0.215], [282, -0.268], [258, -0.292], [237, -0.276]], T: 0.014, dome: 0.85, tendon: [0.2, 0] });

  const forearm = new THREE.Group();
  forearm.position.set(0, -0.3, 0);
  forearm.rotation.x = -0.16;
  arm.add(forearm);
  limbSurface(forearm, lowerArm, 0.03, -0.265, -0.14, -0.21);
  bone(forearm, sphere, [0, -0.265, 0], [0.024, 0.02, 0.021]); // wrist
  // The hand hangs from its own group at the wrist, so a pose can bend it.
  const hand = new THREE.Group();
  hand.name = "hand";
  {
    // a relaxed hand: palm facing the thigh, fingers slightly curled, thumb forward
    hand.position.set(0, -0.272, 0.002);
    hand.rotation.x = 0.08;
    forearm.add(hand);
    bone(hand, sphere, [0, -0.046, 0.002], [0.0135, 0.05, 0.04]); // palm
    // Each joint of a finger is a named group, and remembers how far it turns in a closed
    // fist (grip), so the viewer can close the hand around a handle.
    const digit = (base, length, r, curl, splay = 0, grip = [1.25, 1.5]) => {
      const first = new THREE.Group();
      first.name = "digit";
      first.userData.grip = -grip[0];
      first.position.set(...base);
      first.rotation.set(-splay, 0, -curl[0]);
      hand.add(first);
      const l1 = length * 0.56;
      const l2 = length * 0.5;
      bone(first, new THREE.CapsuleGeometry(r, l1 - r, 4, 10), [0, -l1 / 2, 0]);
      const second = new THREE.Group();
      second.name = "digit";
      second.userData.grip = -grip[1];
      second.position.set(0, -l1, 0);
      second.rotation.z = -curl[1];
      first.add(second);
      bone(second, new THREE.CapsuleGeometry(r * 0.9, l2 - r, 4, 10), [0, -l2 / 2, 0]);
    };
    digit([0, -0.086, 0.0275], 0.07, 0.0088, [0.14, 0.4]);
    digit([0, -0.09, 0.0095], 0.078, 0.0092, [0.18, 0.45]);
    digit([0, -0.087, -0.008], 0.072, 0.0088, [0.22, 0.5]);
    digit([0, -0.08, -0.0245], 0.056, 0.008, [0.26, 0.55]);
    digit([-0.004, -0.03, 0.034], 0.066, 0.0105, [0.1, 0.3], 0.62, [0.75, 0.9]); // thumb
  }
  sheet(forearm, "forearms", { part: "brachioradialis", core: lowerArm, outline: [[34, 0.055], [70, 0.062], [96, 0.02], [93, -0.08], [76, -0.17], [54, -0.18], [35, -0.08]], T: 0.018, dome: 0.85, tendon: [0.32, 0] });
  sheet(forearm, "forearms", { part: "flexors", core: lowerArm, outline: [[22, 0.0], [-40, 0.022], [-96, 0.0], [-106, -0.08], [-80, -0.185], [-30, -0.2], [10, -0.17], [28, -0.08]], T: 0.02, dome: 0.85, tendon: [0.32, 0] });
  sheet(forearm, "forearms", { part: "extensors", core: lowerArm, outline: [[100, 0.0], [175, 0.018], [248, 0.0], [254, -0.08], [226, -0.18], [175, -0.2], [124, -0.18], [97, -0.08]], T: 0.016, dome: 0.85, tendon: [0.32, 0] });

  // --- leg
  const thigh = new THREE.Group();
  thigh.position.set(0.09, 0.925, -0.004);
  thigh.rotation.z = -0.012;
  thigh.rotation.x = 0.03; // knee a little behind the hip
  half.add(thigh);
  limbSurface(thigh, upperLeg, 0.07, -0.45, -0.37, -0.43);
  bone(thigh, sphere, [0, -0.43, 0.008], [0.046, 0.048, 0.047]); // knee
  {
    const kneecap = bone(thigh, sphere, [0.002, -0.424, 0.046], [0.027, 0.031, 0.016], ivoryMaterial);
    kneecap.userData.landmark = "kneecap";
    kneecap.userData.layer = "surface";
  }

  sheet(thigh, "hip-flexors", { part: "lower", core: upperLeg, outline: [[-4, 0.03], [-27, 0.028], [-31, -0.02], [-25, -0.1], [-17, -0.11], [-13, -0.04], [-2, 0.0]], T: 0.02, tendon: [0.14, 0] }); // iliopsoas and pectineus
  // the four quads: rectus femoris on top, the two vasti either side, and vastus intermedius underneath
  sheet(thigh, "quads", { part: "intermedius", layer: "deep", core: upperLeg, outline: [[-18, -0.07], [4, -0.06], [27, -0.075], [31, -0.2], [21, -0.34], [4, -0.372], [-12, -0.34], [-23, -0.2]], T: 0.014, dome: 0.85, tendon: [0.16, 0.06] });
  sheet(thigh, "quads", { part: "rectus", cover: true, core: upperLeg, outline: [[-13, -0.03], [4, -0.012], [21, -0.03], [24, -0.18], [16, -0.34], [4, -0.376], [-8, -0.34], [-15, -0.18]], T: 0.029, dome: 0.85, tendon: [0.2, 0.06] });
  sheet(thigh, "quads", { part: "lateralis", core: upperLeg, outline: [[29, -0.06], [62, -0.035], [99, -0.08], [104, -0.22], [92, -0.36], [60, -0.405], [30, -0.385], [26.5, -0.2]], T: 0.026, fiber: { type: "parallel", angle: 100 }, tendon: [0.1, 0] });
  sheet(thigh, "quads", { part: "medialis", core: upperLeg, outline: [[-19, -0.2], [-50, -0.165], [-84, -0.24], [-88, -0.34], [-62, -0.405], [-30, -0.412], [-18, -0.38]], T: 0.026, dome: 0.85, fiber: { type: "parallel", angle: 72 }, tendon: [0.1, 0] });
  sheet(thigh, "adductors", { core: upperLeg, outline: [[-33, 0.0], [-62, 0.04], [-100, 0.035], [-119, -0.02], [-117, -0.22], [-104, -0.36], [-91, -0.33], [-87, -0.2], [-54, -0.14], [-28, -0.11]], T: 0.026, fiber: { type: "parallel", angle: 78 }, tendon: [0.12, 0] });
  // the three hamstrings: biceps femoris on the outside, semitendinosus and semimembranosus on the inside
  sheet(thigh, "hamstrings", { part: "biceps-femoris", core: upperLeg, outline: [[107, -0.07], [140, -0.05], [171, -0.07], [174, -0.25], [160, -0.4], [130, -0.42], [108, -0.38], [105.5, -0.2]], T: 0.03, dome: 0.85, tendon: [0.2, 0.08] });
  sheet(thigh, "hamstrings", { part: "semitendinosus", core: upperLeg, outline: [[177, -0.07], [200, -0.05], [217, -0.08], [219, -0.22], [214, -0.36], [200, -0.4], [180, -0.4], [176.5, -0.25]], T: 0.03, dome: 0.85, tendon: [0.3, 0.08] });
  sheet(thigh, "hamstrings", { part: "semimembranosus", core: upperLeg, outline: [[219, -0.12], [232, -0.1], [240, -0.14], [241, -0.25], [237, -0.4], [224, -0.425], [216, -0.4], [217, -0.25]], T: 0.026, dome: 0.85, tendon: [0.18, 0.1] });
  sheet(thigh, "hip-abductors", { part: "tfl", core: upperLeg, outline: [[55, 0.065], [90, 0.065], [98, -0.02], [86, -0.115], [66, -0.105], [51, -0.02]], T: 0.018, tendon: [0.3, 0] }); // tensor fasciae latae
  // sartorius: a strap that spirals from the outer hip to the inner knee, lying on top of the others
  strap(thigh, "hip-flexors", { part: "sartorius", core: upperLeg, from: [41, 0.085], to: [-70, -0.37], halfWidth: 0.014, T: 0.012, lift: 0.014 });

  const shank = new THREE.Group();
  shank.position.set(0, -0.43, 0);
  shank.rotation.z = 0.012;
  shank.rotation.x = 0.05; // ankle further back again, as in a relaxed stance
  thigh.add(shank);
  limbSurface(shank, lowerLeg, 0.03, -0.43, -0.3, -0.38);
  bone(shank, sphere, [0, -0.424, -0.002], [0.031, 0.032, 0.035]); // ankle
  // The foot hangs from its own group at the ankle, so a pose can bend the leg and still keep the sole flat.
  const ANKLE = [0, -0.424, -0.002];
  const foot = new THREE.Group();
  foot.position.set(...ANKLE);
  shank.add(foot);
  // the foot undoes the lean of the leg so the sole stays flat; toes turned slightly out
  const sole = bone(foot, footShape, FOOT_AT.map((value, i) => value - ANKLE[i]));
  sole.rotation.set(...FOOT_TURN);
  sole.userData.foot = true; // the viewer keeps these on the floor
  sheet(shank, null, { core: lowerLeg, outline: [[-30, -0.03], [4, -0.03], [7, -0.2], [2, -0.39], [-16, -0.4], [-32, -0.2]], T: 0.005, sink: 0.002, color: PLATE, landmark: "shin" });
  sheet(shank, null, { core: lowerLeg, outline: [[160, -0.24], [200, -0.24], [196, -0.43], [164, -0.43]], T: 0.012, sink: 0.002, landmark: "achilles" });
  sheet(shank, "calves", { part: "soleus", core: lowerLeg, outline: [[101, -0.11], [259, -0.11], [262, -0.24], [226, -0.31], [180, -0.33], [134, -0.31], [98, -0.24]], T: 0.015, tendon: [0.26, 0], nu: 56 });
  sheet(shank, "calves", { part: "gastrocnemius", core: lowerLeg, outline: [[176, 0.012], [146, 0.022], [114, 0.0], [109, -0.09], [124, -0.18], [154, -0.2], [177, -0.17]], T: 0.028, dome: 0.9, tendon: [0.18, 0] });
  sheet(shank, "calves", { part: "gastrocnemius", core: lowerLeg, outline: [[184, 0.012], [214, 0.022], [246, 0.0], [251, -0.1], [236, -0.2], [206, -0.222], [183, -0.19]], T: 0.035, dome: 0.9, tendon: [0.18, 0] });
  sheet(shank, "shins", { core: lowerLeg, outline: [[12, -0.03], [40, -0.02], [64, -0.06], [62, -0.2], [44, -0.3], [22, -0.31], [10, -0.18]], T: 0.018, dome: 0.85, tendon: [0.3, 0] });
  // fibularis (peroneus) longus and brevis: the outer compartment of the lower leg
  sheet(shank, "peroneals", { core: lowerLeg, outline: [[67, -0.035], [84, -0.02], [102, -0.05], [103, -0.2], [96, -0.3], [80, -0.33], [69, -0.28], [66, -0.15]], T: 0.016, dome: 0.85, tendon: [0.32, 0] });

  // ------------------------------------------------------------ bones, ligaments, nerves
  const skeleton = addSkeleton({
    centre,
    half,
    arm,
    forearm,
    hand,
    thigh,
    shank,
    foot,
    ankle: ANKLE,
    onTorso: (deg, y, t = 0) => torsoPoint(deg * DEG, y, t, new THREE.Vector3()).toArray(),
    plate: (outline, T, sink) => sheetGeometry({ outline, T, sink, color: new THREE.Color(1, 1, 1), rimShade: 0, nu: 72, nv: 6 }),
    headShape,
    headAt: HEAD_AT,
    footShape,
    footAt: FOOT_AT,
    footTurn: FOOT_TURN,
  });

  // ------------------------------------------------------------ mirror
  // Named before cloning, so both sides can be found again and posed.
  centre.name = "centre";
  half.name = "half";
  arm.name = "arm";
  forearm.name = "forearm";
  thigh.name = "thigh";
  shank.name = "shank";
  foot.name = "foot";
  // The arm twists about its own length first, then swings forward, then out to the side.
  arm.rotation.order = "ZXY";
  // The forearm also twists about its own length first, then bends sideways, then folds at the elbow.
  forearm.rotation.order = "XZY";
  const mirrored = half.clone(true);
  mirrored.scale.x = -1;
  root.add(half, mirrored);

  /** group name -> [the modeled side, its mirror image]. "centre" and "root", the whole body, have one entry. */
  const rig = {};
  root.traverse((o) => {
    if (o.isGroup && o.name && o !== root) (rig[o.name] ??= []).push(o);
  });
  rig.root = [root];

  /** every mesh, for the viewer to show, hide and pick by layer */
  const meshes = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    meshes.push(o);
    if (o.userData.key) {
      o.userData.baseScale = o.scale.clone();
      parts.get(o.userData.key).meshes.push(o);
    }
  });

  /** muscle id -> its parts */
  const groups = new Map();
  for (const entry of parts.values()) {
    if (!groups.has(entry.muscle)) groups.set(entry.muscle, []);
    groups.get(entry.muscle).push(entry);
  }

  const dispose = () => {
    const geometries = new Set();
    root.traverse((o) => o.isMesh && geometries.add(o.geometry));
    for (const g of geometries) g.dispose();
    for (const { material } of parts.values()) material.dispose();
    for (const material of [coreMaterial, boneMaterial, ivoryMaterial, deepMaterial, ...skeleton.materials]) material.dispose();
    fibre.map.dispose();
    fibre.bumpMap.dispose();
    bellyCache.clear();
  };

  return {
    root,
    parts,
    groups,
    meshes,
    rig,
    /** materials of everything that is not a muscle, bone, ligament or nerve */
    backdrop: [coreMaterial, boneMaterial, ivoryMaterial, deepMaterial],
    dispose,
  };
}
