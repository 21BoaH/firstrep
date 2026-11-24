import * as THREE from "three";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { createFibreTextures } from "./textures.js";

/*
 * The anatomical figure, built from real muscle and bone shapes: Z-Anatomy's models (CC BY-SA 4.0,
 * from BodyParts3D, CC BY-SA 2.1 Japan), prepared by scripts/import-zanatomy.mjs into
 * src/data/zanatomy/anatomy.bin. See src/data/zanatomy/NOTICE.md.
 *
 * It returns the same structure as buildBody() in anatomy.js, so the viewer can pose, light,
 * pick and layer it the same way, plus update(), which bends the soft tissue to the pose.
 *
 * The pose rig is the one the viewer already drives: root, then per side arm, forearm, hand
 * (with two joints per finger), thigh, shank and foot. The joint centres come from the bones.
 * Bones ride rigidly on their segment. Muscles, nerves and vessels are skinned on the CPU: every
 * vertex follows up to three segments by its weights, and in the forearm also turns by its share
 * of the palm's turn (the radius rolls over the ulna; the ulna stays). A pose only changes a few
 * times a second, so the work is done only for the frames where the rig moves.
 *
 * Units are metres; the figure is 1.78 m tall, stands on y = 0 and faces +z. The modeled half
 * is +x, the figure's left; its mirror image is the other half.
 */

export const ANATOMY_URL = new URL("../data/zanatomy/anatomy.bin", import.meta.url);

/** Fetch, inflate and decode the anatomy file. */
export async function loadAnatomy(url = ANATOMY_URL) {
  if (typeof DecompressionStream === "undefined") throw new Error("This browser cannot inflate the anatomy file.");
  const response = await fetch(url);
  if (!response.ok) throw new Error(`The anatomy file could not load (${response.status}).`);
  const raw = new Uint8Array(await new Response(response.body.pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
  const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
  if (String.fromCharCode(raw[0], raw[1], raw[2], raw[3]) !== "ZANA") throw new Error("Not an anatomy file.");
  const length = dv.getUint32(8, true);
  const manifest = JSON.parse(new TextDecoder().decode(raw.subarray(12, 12 + length)));
  const base = 12 + length + ((4 - ((12 + length) % 4)) % 4);
  await MeshoptDecoder.ready;
  const bytes = (s) => raw.subarray(base + s.at, base + s.at + s.n);
  const meshes = manifest.meshes.map((m) => {
    const n = m.vertexCount;
    const a = new Uint8Array(n * 8);
    const b = new Uint8Array(n * 4);
    MeshoptDecoder.decodeVertexBuffer(a, n, 8, bytes(m.a));
    MeshoptDecoder.decodeVertexBuffer(b, n, 4, bytes(m.b));
    const av = new DataView(a.buffer);
    const bv = new DataView(b.buffer);
    const positions = new Float32Array(n * 3);
    const normals = new Float32Array(n * 3);
    const tendon = new Float32Array(n);
    const belly = new Float32Array(n);
    const twist = new Float32Array(n);
    const span = m.max.map((hi, k) => (hi - m.min[k]) / 65535);
    for (let v = 0; v < n; v++) {
      for (let k = 0; k < 3; k++) {
        positions[3 * v + k] = m.min[k] + av.getUint16(v * 8 + 2 * k, true) * span[k];
        normals[3 * v + k] = bv.getInt8(v * 4 + k) / 127;
      }
      tendon[v] = a[v * 8 + 6] / 255;
      belly[v] = a[v * 8 + 7] / 255;
      twist[v] = b[v * 4 + 3] / 255;
    }
    let uv = null;
    if (m.c) {
      const c = new Uint8Array(n * 4);
      MeshoptDecoder.decodeVertexBuffer(c, n, 4, bytes(m.c));
      const cv = new DataView(c.buffer);
      uv = new Float32Array(n * 2);
      for (let v = 0; v < n; v++) {
        uv[2 * v] = (cv.getUint16(v * 4, true) / 65535) * m.uMax;
        uv[2 * v + 1] = cv.getUint16(v * 4 + 2, true) / 65535;
      }
    }
    let joints = null;
    let weights = null;
    if (m.d) {
      const d = new Uint8Array(n * 8);
      MeshoptDecoder.decodeVertexBuffer(d, n, 8, bytes(m.d));
      joints = new Uint8Array(n * 3);
      weights = new Float32Array(n * 3);
      for (let v = 0; v < n; v++)
        for (let k = 0; k < 3; k++) {
          joints[3 * v + k] = d[v * 8 + k];
          weights[3 * v + k] = d[v * 8 + 4 + k] / 255;
        }
    }
    const index = m.index32 ? new Uint32Array(m.indexCount) : new Uint16Array(m.indexCount);
    MeshoptDecoder.decodeIndexBuffer(new Uint8Array(index.buffer), m.indexCount, m.index32 ? 4 : 2, bytes(m.index));
    return { ...m, positions, normals, tendon, belly, twist, uv, joints, weights, index };
  });
  return { ...manifest, meshes };
}

// ----------------------------------------------------------------- colours
const TENDON = new THREE.Color("#d9cebd"); // pearl: tendons and fascia
const SHELL = new THREE.Color("#343841"); // graphite: head, hands, feet, and the bones seen between muscles
const SHELL_TENDON = new THREE.Color("#4a4e58");
const TISSUE = new THREE.Color("#5a1820"); // muscles with no page of their own: a darker, quieter red
const REDS = ["#96222a", "#851c25", "#a52b31", "#7c1823"].map((h) => new THREE.Color(h));
const BONE = new THREE.Color("#ddd4c3");
const CARTILAGE = new THREE.Color("#a9c3cf");

/** The rest rotation of a limb segment whose local -y runs along `d` (in its parent's frame). */
function restRotation(d, order) {
  const e = new THREE.Euler(0, 0, 0, order);
  if (order === "ZXY") {
    e.x = -Math.asin(THREE.MathUtils.clamp(d.z, -1, 1));
    e.z = Math.atan2(d.x, -d.y);
  } else {
    e.z = Math.asin(THREE.MathUtils.clamp(d.x, -1, 1));
    e.x = Math.atan2(-d.z, -d.y);
  }
  return e;
}

/** How far each finger is curled when the hand hangs relaxed, and in a closed fist: [first joint, second joint]. */
const CURL = {
  thumb: { rest: [0.05, 0.15], grip: [0.75, 0.9] },
  index: { rest: [0.12, 0.25], grip: [1.25, 1.5] },
  middle: { rest: [0.15, 0.3], grip: [1.25, 1.5] },
  ring: { rest: [0.18, 0.35], grip: [1.25, 1.5] },
  little: { rest: [0.2, 0.4], grip: [1.25, 1.5] },
};

export function buildRealBody(asset) {
  const fibre = createFibreTextures();
  const root = new THREE.Group();
  root.name = "body";
  const v3 = (a) => new THREE.Vector3(...a);
  const R = asset.rig;

  // ------------------------------------------------------------ materials
  const shellMaterial = new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.48, metalness: 0.3, clearcoat: 0.25, clearcoatRoughness: 0.5 });
  const tissueMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    vertexColors: true,
    map: fibre.map,
    bumpMap: fibre.bumpMap,
    bumpScale: 1.2,
    roughness: 0.5,
    metalness: 0,
    sheen: 0.4,
    sheenColor: new THREE.Color("#c86a5c"),
    sheenRoughness: 0.5,
  });
  const fasciaMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.42, metalness: 0.05 });
  const backdropBoneMaterial = new THREE.MeshPhysicalMaterial({ color: SHELL, roughness: 0.5, metalness: 0.28, clearcoat: 0.2, clearcoatRoughness: 0.5 });
  const boneMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.55, metalness: 0 });
  const ligamentMaterial = new THREE.MeshStandardMaterial({ color: "#8fb9d1", roughness: 0.5, metalness: 0 });
  const nerveMaterial = new THREE.MeshPhysicalMaterial({ color: "#f6e6a2", roughness: 0.4, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: "#6a5412", emissiveIntensity: 0.4 });
  const arteryMaterial = new THREE.MeshPhysicalMaterial({ color: "#c2413b", roughness: 0.35, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3, emissive: "#3a0b09", emissiveIntensity: 0.5 });
  const veinMaterial = new THREE.MeshPhysicalMaterial({ color: "#4f74bd", roughness: 0.4, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.35, emissive: "#0c1a3c", emissiveIntensity: 0.5 });
  const heartMaterial = new THREE.MeshPhysicalMaterial({ color: "#b8403a", roughness: 0.38, metalness: 0, clearcoat: 0.45, clearcoatRoughness: 0.32, emissive: "#3a0b09", emissiveIntensity: 0.45 });
  const jointMaterial = new THREE.MeshStandardMaterial({ color: "#86d3c0", roughness: 0.4, metalness: 0, emissive: "#1d5a4c", emissiveIntensity: 0.5 });

  /** "muscle/part" -> { key, muscle, part, layer, cover, material, meshes[] } */
  const parts = new Map();
  let tint = 0;
  const partFor = (muscle, part) => {
    const key = `${muscle}/${part}`;
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
      parts.set(key, { key, muscle, part, layer: "deep", cover: true, material, meshes: [], red: REDS[tint++ % REDS.length] });
    }
    return parts.get(key);
  };

  // ------------------------------------------------------------ the rig
  const centre = new THREE.Group();
  centre.name = "centre";
  root.add(centre);
  const half = new THREE.Group();
  half.name = "half";

  const named = (name, parent, position, rotation) => {
    const g = new THREE.Group();
    g.name = name;
    if (rotation) g.rotation.copy(rotation);
    if (position) g.position.copy(position);
    parent.add(g);
    g.updateMatrix();
    g.updateMatrixWorld(true);
    return g;
  };
  const toLocal = (group, point) => group.worldToLocal(point.clone());
  const dirIn = (group, from, to) => {
    const q = group.getWorldQuaternion(new THREE.Quaternion()).invert();
    return to.clone().sub(from).normalize().applyQuaternion(q);
  };

  const shoulder = v3(R.shoulder);
  const elbow = v3(R.elbow);
  const wrist = v3(R.wrist);
  const hipJoint = v3(R.hip);
  const kneeJoint = v3(R.knee);
  const ankleJoint = v3(R.ankle);
  const middleKnuckle = v3(R.digits.find((d) => d.name === "middle").mcp);

  // The arm twists about its own length first, then swings forward, then out to the side.
  const arm = named("arm", half, shoulder, restRotation(elbow.clone().sub(shoulder).normalize(), "ZXY"));
  // The forearm also twists about its own length first, then bends sideways, then folds at the elbow.
  const forearm = named("forearm", arm, toLocal(arm, elbow), restRotation(dirIn(arm, elbow, wrist), "XZY"));
  // The ulna rides on the forearm but stays put when the palm turns: this group undoes the turn.
  const ulnaframe = named("ulnaframe", forearm);
  const hand = named("hand", forearm, toLocal(forearm, wrist), restRotation(dirIn(forearm, wrist, middleKnuckle), "XYZ"));
  const thigh = named("thigh", half, hipJoint, restRotation(kneeJoint.clone().sub(hipJoint).normalize(), "XYZ"));
  const shank = named("shank", thigh, toLocal(thigh, kneeJoint), restRotation(dirIn(thigh, kneeJoint, ankleJoint), "XYZ"));
  const foot = named("foot", shank, toLocal(shank, ankleJoint));
  half.updateMatrixWorld(true);

  // Each finger joint is a named group ("digit") that turns about its own z to curl the finger,
  // and remembers how far it turns in a closed fist (grip), as the viewer expects. A frame group
  // around it lines its z up with the real joint's axis.
  const segmentGroups = { torso: half, arm, forearm, hand, thigh, shank, foot, ulna: ulnaframe };
  const palm = new THREE.Vector3(-1, 0, 0); // the palm faces the thigh
  const knuckles = R.digits
    .filter((d) => d.name !== "thumb")
    .reduce((s, d) => s.add(v3(d.mcp)), new THREE.Vector3())
    .multiplyScalar(0.25);
  const frameFor = (parent, at, along, towardPalm) => {
    const f = along.clone().normalize();
    const p = towardPalm.clone().addScaledVector(f, -towardPalm.dot(f)).normalize();
    const y = f.clone().negate();
    const z = p.clone().cross(f).normalize();
    const x = y.clone().cross(z);
    const world = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    const group = new THREE.Group();
    group.name = "digitframe";
    parent.add(group);
    group.position.copy(toLocal(parent, at));
    group.quaternion.copy(parent.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(world));
    group.updateMatrixWorld(true);
    return group;
  };
  const digitGroups = [];
  for (const d of R.digits) {
    const mcp = v3(d.mcp);
    const pip = v3(d.pip);
    const tip = v3(d.tip);
    const towardPalm = d.name === "thumb" ? knuckles.clone().sub(mcp).add(palm.clone().multiplyScalar(0.02)) : palm;
    const frame1 = frameFor(hand, mcp, pip.clone().sub(mcp), towardPalm);
    const first = new THREE.Group();
    first.name = "digit";
    first.userData.grip = -CURL[d.name].grip[0];
    frame1.add(first);
    first.updateMatrixWorld(true);
    const frame2 = frameFor(first, pip, tip.clone().sub(pip), towardPalm);
    const second = new THREE.Group();
    second.name = "digit";
    second.userData.grip = -CURL[d.name].grip[1];
    frame2.add(second);
    second.updateMatrixWorld(true);
    segmentGroups[`${d.name}1`] = first;
    segmentGroups[`${d.name}2`] = second;
    digitGroups.push([d.name, first, second]);
  }
  half.updateMatrixWorld(true);

  /** Rest matrix of each segment in the half's frame, and its inverse. */
  const halfInverse = half.matrixWorld.clone().invert();
  const restOf = {};
  for (const [name, group] of Object.entries(segmentGroups)) {
    const rel = halfInverse.clone().multiply(group.matrixWorld);
    restOf[name] = { rel, inverse: rel.clone().invert() };
  }

  // ------------------------------------------------------------ meshes
  const meshes = [];
  const geometries = new Set();
  const segmentIndex = Object.fromEntries(asset.segments.map((s, i) => [s, i]));
  const LIMB = new Set(["arm", "forearm", "thigh", "shank"].map((s) => segmentIndex[s]));

  /** Vertex colours: the base colour, blended toward `alt` by the per-vertex share (tendon, cartilage). */
  const colours = (data, base, alt) => {
    const c = new Float32Array(data.vertexCount * 3);
    const tmp = new THREE.Color();
    for (let v = 0; v < data.vertexCount; v++) {
      tmp.copy(base).lerp(alt, data.tendon[v]);
      c[3 * v] = tmp.r;
      c[3 * v + 1] = tmp.g;
      c[3 * v + 2] = tmp.b;
    }
    return c;
  };
  const geometryOf = (data, colour, matrix) => {
    const g = new THREE.BufferGeometry();
    const positions = data.positions.slice();
    const normals = data.normals.slice();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    if (colour) g.setAttribute("color", new THREE.BufferAttribute(colour, 3));
    if (data.uv) g.setAttribute("uv", new THREE.BufferAttribute(data.uv, 2));
    g.setIndex(new THREE.BufferAttribute(data.index, 1));
    if (matrix) g.applyMatrix4(matrix);
    g.computeBoundingSphere();
    geometries.add(g);
    return g;
  };

  /**
   * The meshes that bend with the rig: { mesh, side, skin }. The rest data and the weights (skin) are
   * shared by a mesh and its mirror image. They live here, not in userData, which three.js copies
   * through JSON when it clones.
   */
  const skinned = [];
  const skinOf = new Map();
  const makeSkinned = (data, material, parent) => {
    const geometry = geometryOf(data, data.colour);
    const mesh = new THREE.Mesh(geometry, material);
    // rest data and weights are shared with the mirrored copy
    let { joints, weights } = data;
    if (!joints) {
      // a muscle that rides on one segment still bends (it swells when selected)
      joints = new Uint8Array(data.vertexCount * 3).fill(0);
      weights = new Float32Array(data.vertexCount * 3).fill(0);
      const s = segmentIndex[data.segment];
      for (let v = 0; v < data.vertexCount; v++) {
        joints[3 * v] = s;
        weights[3 * v] = 1;
      }
    }
    const used = new Set();
    for (let i = 0; i < joints.length; i++) if (weights[i] > 0) used.add(joints[i]);
    skinOf.set(mesh, { rest: data.positions, restNormal: data.normals, joints, weights, twist: data.twist, belly: data.belly, used: [...used] });
    mesh.userData.limb = [...used].some((s) => LIMB.has(s));
    mesh.userData.swell = 0;
    parent.add(mesh);
    return mesh;
  };
  const makeRigid = (data, material, colour) => {
    const paired = data.paired;
    const group = paired ? segmentGroups[data.segment] : centre;
    const matrix = paired && data.segment !== "torso" ? restOf[data.segment].inverse : null;
    const geometry = geometryOf(data, colour, matrix);
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    return mesh;
  };

  // userData.outline names a mesh's outline group (see outlines.js): a thin line is drawn where two
  // groups meet. Each muscle part is a group of its own; everything else is grouped by its kind.
  const tag = (mesh, fields) => Object.assign(mesh.userData, fields);
  const SURFACE_BONES = { collarbone: "collarbone", breastbone: "breastbone", kneecap: "kneecap", shin: "shin", vertebrae: "spine" };

  for (const data of asset.meshes) {
    const parent = data.paired ? half : centre;
    switch (data.role) {
      case "muscle": {
        const entry = partFor(data.muscle, data.part);
        data.colour = colours(data, entry.red, TENDON);
        const mesh = data.paired ? makeSkinned(data, entry.material, parent) : makeRigid(data, entry.material, data.colour);
        const layer = data.layer ?? "surface";
        tag(mesh, { muscle: data.muscle, part: data.part, key: entry.key, kind: "real", layer, outline: entry.key, ...(data.cover ? { cover: true } : {}) });
        entry.meshes.push(mesh);
        if (layer === "surface") {
          if (entry.layer !== "surface") entry.cover = true;
          entry.layer = "surface";
          if (!data.cover) entry.cover = false;
        }
        meshes.push(mesh);
        break;
      }
      case "tissue":
      case "shell": {
        const tissue = data.role === "tissue";
        data.colour = colours(data, tissue ? TISSUE : SHELL, tissue ? TENDON.clone().multiplyScalar(0.55) : SHELL_TENDON);
        const material = tissue ? tissueMaterial : shellMaterial;
        const mesh = data.paired && data.joints ? makeSkinned(data, material, parent) : makeRigid(data, material, data.colour);
        tag(mesh, { layer: data.layer ?? "surface", outline: data.role, ...(data.cover ? { cover: true } : {}) });
        meshes.push(mesh);
        break;
      }
      case "surface": {
        data.colour = colours(data, TENDON, TENDON);
        const mesh = data.joints ? makeSkinned(data, fasciaMaterial, parent) : makeRigid(data, fasciaMaterial, data.colour);
        tag(mesh, { layer: data.layer ?? "surface", landmark: data.landmark, outline: data.role, ...(data.cover ? { cover: true } : {}) });
        meshes.push(mesh);
        break;
      }
      case "bone": {
        // In the Surface and Deep layers bones are the graphite frame you see between the
        // muscles; in the Skeleton layer they are ivory, with their cartilage in blue-grey.
        const frame = makeRigid(data, backdropBoneMaterial, null);
        tag(frame, { layer: "backdrop", outline: "bone", ...(SURFACE_BONES[data.landmark] ? { landmark: SURFACE_BONES[data.landmark] } : {}) });
        if (data.sole) frame.userData.foot = true;
        meshes.push(frame);
        const ivory = new THREE.Mesh(frame.geometry, boneMaterial);
        frame.geometry.setAttribute("color", new THREE.BufferAttribute(colours(data, BONE, CARTILAGE), 3));
        frame.parent.add(ivory);
        tag(ivory, { layer: "skeleton", outline: "bone", ...(data.landmark ? { landmark: data.landmark } : {}) });
        ivory.visible = false;
        meshes.push(ivory);
        break;
      }
      case "ligament":
      case "organ":
      case "nerve":
      case "artery":
      case "vein": {
        const material = { ligament: ligamentMaterial, organ: heartMaterial, nerve: nerveMaterial, artery: arteryMaterial, vein: veinMaterial }[data.role];
        const mesh = data.paired && data.joints ? makeSkinned(data, material, parent) : makeRigid(data, material, null);
        tag(mesh, { layer: data.layer ?? "skeleton", outline: data.role, ...(data.landmark ? { landmark: data.landmark } : {}) });
        mesh.visible = false;
        meshes.push(mesh);
        break;
      }
    }
  }

  // ------------------------------------------------------------ joints
  // A ring around each joint: something to point at and click, since a joint is a place, not a part.
  const ring = new THREE.TorusGeometry(1, 0.11, 10, 48);
  geometries.add(ring);
  for (const [group, landmark, radius] of [
    [arm, "shoulder-joint", 0.036],
    [forearm, "elbow-joint", 0.034],
    [thigh, "hip-joint", 0.04],
    [shank, "knee-joint", 0.055],
    [foot, "ankle-joint", 0.04],
  ]) {
    const mesh = new THREE.Mesh(ring, jointMaterial);
    mesh.rotation.x = Math.PI / 2;
    mesh.scale.setScalar(radius);
    tag(mesh, { layer: "skeleton", landmark, outline: "joint" });
    mesh.visible = false;
    group.add(mesh);
    meshes.push(mesh);
  }

  // ------------------------------------------------------------ the relaxed hand
  for (const [name, first, second] of digitGroups) {
    first.rotation.z = -CURL[name].rest[0];
    second.rotation.z = -CURL[name].rest[1];
  }

  // ------------------------------------------------------------ mirror
  const mirrored = half.clone(true);
  mirrored.scale.x = -1;
  root.add(half, mirrored);
  // the mirrored copies of the bending meshes need their own buffers to bend
  const pairUp = (a, b) => {
    const skin = a.isMesh && skinOf.get(a);
    if (skin) {
      const geometry = a.geometry.clone();
      geometries.add(geometry);
      b.geometry = geometry;
      skinned.push({ mesh: a, side: 0, skin }, { mesh: b, side: 1, skin });
    }
    a.children.forEach((child, i) => pairUp(child, b.children[i]));
  };
  pairUp(half, mirrored);
  root.updateMatrixWorld(true);

  /** group name -> [the modeled side, its mirror image]. "centre" and "root", the whole body, have one entry. */
  const rig = {};
  root.traverse((o) => {
    if (o.isGroup && o.name && o !== root) (rig[o.name] ??= []).push(o);
  });
  rig.root = [root];

  const allMeshes = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = true;
    o.receiveShadow = true;
    allMeshes.push(o);
    if (o.userData.key) {
      const entry = parts.get(o.userData.key);
      if (!entry.meshes.includes(o)) entry.meshes.push(o);
    }
  });

  /** muscle id -> its parts */
  const groups = new Map();
  for (const entry of parts.values()) {
    if (!groups.has(entry.muscle)) groups.set(entry.muscle, []);
    groups.get(entry.muscle).push(entry);
  }

  // ------------------------------------------------------------ bending
  // For each side: the segments' current transforms relative to their rest, in the half's frame.
  const segmentsBySide = [0, 1].map((side) =>
    asset.segments.map((name) => {
      const g = rig[name === "torso" ? "half" : name]?.[side];
      return name === "torso" ? null : g;
    }),
  );
  // the digit groups are found by their place in the asset's order, not by name
  for (const side of [0, 1]) {
    for (const [name] of digitGroups) {
      const firsts = rig.digit.filter((g) => (side ? isMirrored(g) : !isMirrored(g)));
      const order = digitGroups.map(([n]) => n);
      const k = order.indexOf(name);
      segmentsBySide[side][segmentIndex[`${name}1`]] = firsts[2 * k];
      segmentsBySide[side][segmentIndex[`${name}2`]] = firsts[2 * k + 1];
    }
  }
  const restInverse = asset.segments.map((name) => restOf[name]?.inverse ?? new THREE.Matrix4());
  const current = [0, 1].map(() => asset.segments.map(() => new THREE.Matrix4()));
  const previous = [0, 1].map(() => asset.segments.map(() => new Float32Array(16)));
  const forearmIndex = segmentIndex.forearm;
  const forearmRestY = forearm.rotation.y;
  const forearmAt = [0, 1].map(() => ({ A: new THREE.Matrix4(), B: restOf.forearm.inverse, twist: 0 }));
  const halves = [half, mirrored];
  const ulnaframes = rig.ulnaframe;
  const forearms = rig.forearm;
  const inv = new THREE.Matrix4();

  /**
   * Bend every skinned mesh to the rig as it stands. Call after the rig has been posed and the
   * world matrices updated. Only meshes whose segments moved, or whose swell changed, are redone.
   */
  function update() {
    // the ulna stays when the palm turns
    for (let side = 0; side < 2; side++) ulnaframes[side].rotation.y = -(forearms[side].rotation.y - forearmRestY);
    root.updateMatrixWorld(true);
    const changed = [new Uint8Array(asset.segments.length), new Uint8Array(asset.segments.length)];
    for (let side = 0; side < 2; side++) {
      inv.copy(halves[side].matrixWorld).invert();
      const segs = segmentsBySide[side];
      for (let s = 0; s < segs.length; s++) {
        const m = current[side][s];
        if (!segs[s]) m.identity();
        else m.multiplyMatrices(inv, segs[s].matrixWorld).multiply(restInverse[s]);
        const e = m.elements;
        const prev = previous[side][s];
        for (let k = 0; k < 16; k++) {
          if (Math.abs(prev[k] - e[k]) > 1e-7) {
            changed[side][s] = 1;
            prev.set(e);
            break;
          }
        }
      }
      // the forearm's turn, to share out between the radius and the ulna
      const twist = forearms[side].rotation.y - forearmRestY;
      const fa = forearmAt[side];
      if (Math.abs(twist - fa.twist) > 1e-6) changed[side][forearmIndex] = 1;
      fa.twist = twist;
      fa.A.multiplyMatrices(inv, segs[forearmIndex].matrixWorld);
    }
    for (const { mesh, side, skin } of skinned) {
      const state = mesh.userData;
      const swell = state.swell ?? 0;
      if (state.bent && swell === state.bentSwell && !skin.used.some((s) => changed[side][s])) continue;
      state.bent = true;
      state.bentSwell = swell;
      bend(mesh, skin, current[side], forearmAt[side], swell);
    }
  }

  const _q = new THREE.Vector3();
  /** Linear blend of the segments' transforms, with the forearm's turn shared out by twist weight. */
  function bend(mesh, skin, K, fa, swell) {
    const position = mesh.geometry.attributes.position;
    const normal = mesh.geometry.attributes.normal;
    const out = position.array;
    const outN = normal.array;
    const { rest, restNormal, joints, weights, twist, belly } = skin;
    const n = rest.length / 3;
    const A = fa.A.elements;
    const B = fa.B.elements;
    for (let v = 0; v < n; v++) {
      const x = rest[3 * v];
      const y = rest[3 * v + 1];
      const z = rest[3 * v + 2];
      const nx = restNormal[3 * v];
      const ny = restNormal[3 * v + 1];
      const nz = restNormal[3 * v + 2];
      let px = 0;
      let py = 0;
      let pz = 0;
      let qx = 0;
      let qy = 0;
      let qz = 0;
      for (let k = 0; k < 3; k++) {
        const w = weights[3 * v + k];
        if (w <= 0) continue;
        const s = joints[3 * v + k];
        if (s === forearmIndex && fa.twist !== 0 && twist[v] < 0.999) {
          // into the forearm's rest frame, turn back by the share of the turn this vertex does not
          // follow, then out through the forearm as it stands now
          const b = B;
          const lx = b[0] * x + b[4] * y + b[8] * z + b[12];
          const ly = b[1] * x + b[5] * y + b[9] * z + b[13];
          const lz = b[2] * x + b[6] * y + b[10] * z + b[14];
          const lnx = b[0] * nx + b[4] * ny + b[8] * nz;
          const lny = b[1] * nx + b[5] * ny + b[9] * nz;
          const lnz = b[2] * nx + b[6] * ny + b[10] * nz;
          const angle = (twist[v] - 1) * fa.twist;
          const c = Math.cos(angle);
          const si = Math.sin(angle);
          const rx = c * lx + si * lz;
          const rz = -si * lx + c * lz;
          const rnx = c * lnx + si * lnz;
          const rnz = -si * lnx + c * lnz;
          px += w * (A[0] * rx + A[4] * ly + A[8] * rz + A[12]);
          py += w * (A[1] * rx + A[5] * ly + A[9] * rz + A[13]);
          pz += w * (A[2] * rx + A[6] * ly + A[10] * rz + A[14]);
          qx += w * (A[0] * rnx + A[4] * lny + A[8] * rnz);
          qy += w * (A[1] * rnx + A[5] * lny + A[9] * rnz);
          qz += w * (A[2] * rnx + A[6] * lny + A[10] * rnz);
        } else {
          const e = K[s].elements;
          px += w * (e[0] * x + e[4] * y + e[8] * z + e[12]);
          py += w * (e[1] * x + e[5] * y + e[9] * z + e[13]);
          pz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]);
          qx += w * (e[0] * nx + e[4] * ny + e[8] * nz);
          qy += w * (e[1] * nx + e[5] * ny + e[9] * nz);
          qz += w * (e[2] * nx + e[6] * ny + e[10] * nz);
        }
      }
      const l = Math.hypot(qx, qy, qz) || 1;
      qx /= l;
      qy /= l;
      qz /= l;
      if (swell) {
        // a working muscle thickens in its belly, not at its tendons
        const d = swell * (belly ? belly[v] : 1);
        px += qx * d;
        py += qy * d;
        pz += qz * d;
      }
      out[3 * v] = px;
      out[3 * v + 1] = py;
      out[3 * v + 2] = pz;
      outN[3 * v] = qx;
      outN[3 * v + 1] = qy;
      outN[3 * v + 2] = qz;
    }
    position.needsUpdate = true;
    normal.needsUpdate = true;
    mesh.geometry.boundingSphere = null;
    mesh.geometry.boundingBox = null;
  }
  update();

  const dispose = () => {
    for (const g of geometries) g.dispose();
    for (const { material } of parts.values()) material.dispose();
    for (const m of [shellMaterial, tissueMaterial, fasciaMaterial, backdropBoneMaterial, boneMaterial, ligamentMaterial, nerveMaterial, arteryMaterial, veinMaterial, heartMaterial, jointMaterial]) m.dispose();
    fibre.map.dispose();
    fibre.bumpMap.dispose();
  };

  return {
    root,
    parts,
    groups,
    meshes: allMeshes,
    rig,
    /** materials of everything that is not a muscle, bone, ligament or nerve. Index 1 is the graphite shell. */
    backdrop: [tissueMaterial, shellMaterial, fasciaMaterial, backdropBoneMaterial],
    /** where a handle sits in the hand, in the hand's own frame */
    gripPoint: hand.worldToLocal(v3(R.grip)).toArray(),
    /** a spot between the shoulder blades, in the trunk's frame: where the back rests on a bench */
    benchRest: R.benchRest,
    update,
    dispose,
  };
}

function isMirrored(object) {
  for (let o = object; o; o = o.parent) if (o.scale.x < 0) return true;
  return false;
}
