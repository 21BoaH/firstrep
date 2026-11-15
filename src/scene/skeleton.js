import * as THREE from "three";

/** Deterministic pseudo-random numbers, so the nerves look the same on every load. */
function seeded(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fine lines running along a nerve: the bundles of fibers that show through its sheath. */
function nerveTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 8;
  const ctx = canvas.getContext("2d");
  const rand = seeded(3);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 64, 8);
  for (let i = 0; i < 22; i++) {
    ctx.fillStyle = "rgba(150, 110, 40, " + (0.06 + rand() * 0.14) + ")";
    ctx.fillRect(rand() * 64, 0, 1 + rand() * 2.5, 8);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * A nerve: a tube that tapers from r0 to r1 and wanders slightly between its fixed points,
 * the way a real nerve lies slack in the tissue. flat < 1 gives a ribbon-like cross-section.
 */
function nerveGeometry(points, r0, r1, flat, wander, rand) {
  const rough = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), false, "centripetal");
  const length = rough.getLength();
  const count = Math.max(3, Math.round(length / 0.03));
  const samples = [];
  for (let i = 0; i <= count; i++) {
    const p = rough.getPointAt(i / count);
    if (i > 0 && i < count) p.add(new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).multiplyScalar(2 * wander));
    samples.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(samples, false, "centripetal");
  const segments = Math.max(6, Math.round(length / 0.008));
  const radial = 7;
  const frames = curve.computeFrenetFrames(segments, false);
  const position = [];
  const normal = [];
  const uv = [];
  const index = [];
  const P = new THREE.Vector3();
  const N = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, P);
    const r = r0 + (r1 - r0) * t;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      N.copy(frames.normals[i]).multiplyScalar(Math.cos(a)).addScaledVector(frames.binormals[i], Math.sin(a) * flat);
      position.push(P.x + N.x * r, P.y + N.y * r, P.z + N.z * r);
      N.normalize();
      normal.push(N.x, N.y, N.z);
      uv.push(j / radial, (t * length) / 0.05);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  // close both ends with a rounded tip
  for (const end of [0, 1]) {
    const tangent = curve.getTangentAt(end);
    curve.getPointAt(end, P);
    const r = end === 0 ? r0 : r1;
    P.addScaledVector(tangent, (end === 0 ? -1 : 1) * r * 0.7);
    const tip = position.length / 3;
    position.push(P.x, P.y, P.z);
    normal.push(tangent.x * (end ? 1 : -1), tangent.y * (end ? 1 : -1), tangent.z * (end ? 1 : -1));
    uv.push(0.5, end * (length / 0.05));
    const ring = end * segments * (radial + 1);
    for (let j = 0; j < radial; j++) index.push(tip, ring + j, ring + j + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normal, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  return geometry;
}

/*
 * Bones, ligaments and the main nerves, built from tubes and rounded beads.
 *
 * Everything here is hidden until the viewer switches to the Skeleton layer
 * (nerves also show in the Deep layer). Each mesh carries:
 *   userData.layer     "skeleton" or "nerve"
 *   userData.landmark  an id from LANDMARKS in src/data/tissue.js, for its label
 *
 * Joints are marked with a thin ring around the place where two bones meet. The heart and the
 * main arteries and veins only show in the Skeleton layer.
 *
 * Parts that exist on both sides are added to `half`, which the body builder
 * mirrors afterwards. Limb bones are added to the limb groups, so they follow
 * the pose of the arm and leg. The bones of the hand and the foot, and the nerves that
 * run into the palm and the sole, are added inside the hand and foot groups.
 */
export function addSkeleton({ centre, half, arm, forearm, hand, thigh, shank, foot, ankle, onTorso, plate, headShape, headAt, footShape, footAt, footTurn }) {
  const boneMaterial = new THREE.MeshStandardMaterial({ color: "#ddd4c3", roughness: 0.55, metalness: 0 });
  const ligamentMaterial = new THREE.MeshStandardMaterial({ color: "#8fb9d1", roughness: 0.5, metalness: 0 });
  // Nerves are pale yellow-white and glisten. The colour is kept a little warmer than life
  // so that they still read apart from the ivory bones.
  const stripes = nerveTexture();
  const nerveMaterial = new THREE.MeshPhysicalMaterial({
    color: "#f6e6a2",
    map: stripes,
    bumpMap: stripes,
    bumpScale: 0.5,
    roughness: 0.4,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    emissive: "#6a5412",
    emissiveIntensity: 0.4,
    side: THREE.DoubleSide,
  });
  const sphere = new THREE.SphereGeometry(1, 16, 12);

  const add = (parent, geometry, material, landmark, layer) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.layer = layer;
    mesh.userData.landmark = landmark;
    mesh.visible = false;
    parent.add(mesh);
    return mesh;
  };

  const kit = (material, layer) => {
    const bead = (parent, landmark, position, scale) => {
      const mesh = add(parent, sphere, material, landmark, layer);
      mesh.position.set(...position);
      if (Array.isArray(scale)) mesh.scale.set(...scale);
      else mesh.scale.setScalar(scale);
      return mesh;
    };
    /** A round rod through the given points, closed with a bead at each end. */
    const rod = (parent, landmark, points, radius) => {
      const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
      add(parent, new THREE.TubeGeometry(curve, Math.max(8, points.length * 8), radius, 8, false), material, landmark, layer);
      bead(parent, landmark, points[0], radius);
      bead(parent, landmark, points[points.length - 1], radius);
    };
    return { bead, rod };
  };
  const bone = kit(boneMaterial, "skeleton");
  const ligament = kit(ligamentMaterial, "skeleton");

  // The bones and nerves of the hand and of the sole are given in the coordinates of the forearm
  // and the shank, like everything around them. These two groups keep those coordinates valid
  // inside the hand and the foot, which turn at the wrist and the ankle when the body is posed.
  const inside = (segment, name) => {
    const group = new THREE.Group();
    group.name = name;
    segment.updateMatrix();
    group.applyMatrix4(segment.matrix.clone().invert());
    segment.add(group);
    return group;
  };
  const inHand = inside(hand, "handframe");
  const inFoot = inside(foot, "footframe");

  const rand = seeded(11);
  /**
   * One nerve from the first point to the last, r0 thick at the start and r1 at the end.
   * layer "nerve" also shows in the Deep layer; "skeleton" only shows in the Skeleton layer,
   * and is used for fine branches that would poke out of the solid body.
   */
  const nerve = (parent, landmark, points, r0, r1 = r0 * 0.6, { layer = "nerve", flat = 1, wander = 0.0012 } = {}) =>
    add(parent, nerveGeometry(points, r0, r1, flat, wander, rand), nerveMaterial, landmark, layer);
  /** Small branches that leave a nerve along its length and run off into the muscles. */
  const twigs = (parent, landmark, points, count, length, radius) => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, "centripetal");
    for (let k = 0; k < count; k++) {
      const t = 0.12 + (0.76 * (k + rand() * 0.7)) / count;
      const start = curve.getPointAt(Math.min(0.98, t));
      const along = curve.getTangentAt(Math.min(0.98, t));
      const side = new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5);
      side.addScaledVector(along, -side.dot(along)).normalize();
      const reach = length * (0.7 + 0.6 * rand());
      const mid = start.clone().addScaledVector(along, reach * 0.45).addScaledVector(side, reach * 0.16);
      const end = start.clone().addScaledVector(along, reach * 0.8).addScaledVector(side, reach * 0.5);
      nerve(parent, landmark, [start, mid, end], radius, radius * 0.35, { layer: "skeleton", wander: 0.0006 });
    }
  };
  /** Height of the spinal column's centre line at y, for placing the nerve roots. */
  const spineZ = (y) => {
    for (let i = 0; i < spine.length - 1; i++) {
      const [, y0, z0] = spine[i];
      const [, y1, z1] = spine[i + 1];
      if (y <= y1) return z0 + ((z1 - z0) * Math.max(0, y - y0)) / (y1 - y0);
    }
    return spine[spine.length - 1][2];
  };

  // ------------------------------------------------------------ skull and spine
  {
    const skull = add(centre, headShape, boneMaterial, "skull", "skeleton");
    skull.position.set(headAt[0], headAt[1] + 0.004, headAt[2]);
    skull.scale.setScalar(0.9);
  }
  // the column follows the S-curve of the back: in at the waist, out at the ribs, forward at the neck
  const spine = [
    [0, 0.93, -0.07],
    [0, 0.96, -0.061],
    [0, 1.02, -0.05],
    [0, 1.08, -0.036],
    [0, 1.14, -0.031],
    [0, 1.2, -0.035],
    [0, 1.26, -0.043],
    [0, 1.32, -0.052],
    [0, 1.38, -0.057],
    [0, 1.44, -0.056],
    [0, 1.5, -0.04],
    [0, 1.56, -0.02],
    [0, 1.61, -0.006],
    [0, 1.65, 0.006],
  ];
  bone.rod(centre, "vertebrae", spine, 0.012);
  {
    const curve = new THREE.CatmullRomCurve3(spine.map((p) => new THREE.Vector3(...p)));
    const count = 24;
    for (let i = 0; i < count; i++) {
      const t = 0.06 + (i / (count - 1)) * 0.93;
      const p = curve.getPoint(t);
      const size = 1 - 0.45 * t; // vertebrae get smaller toward the neck
      bone.bead(centre, "vertebrae", [p.x, p.y, p.z], [0.027 * size, 0.011, 0.024 * size]);
    }
  }
  bone.bead(centre, "pelvis", [0, 0.952, -0.07], [0.05, 0.052, 0.02]); // sacrum

  // ------------------------------------------------------------ ribcage
  bone.rod(centre, "breastbone", [onTorso(0, 1.456, -0.012), onTorso(0, 1.38, -0.012), onTorso(0, 1.298, -0.012)], 0.012);
  const ribPath = (backY, frontY, frontDeg, sag) => {
    const points = [];
    const steps = 12;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const deg = 171 + (frontDeg - 171) * t;
      const y = backY + (frontY - backY) * t - sag * Math.sin(Math.PI * t);
      points.push(onTorso(deg, y, -0.013));
    }
    return points;
  };
  // seven ribs that reach the breastbone
  for (let i = 0; i < 7; i++) bone.rod(half, "ribs", ribPath(1.495 - i * 0.029, 1.452 - i * 0.026, 7, 0.012 + i * 0.004), 0.0062);
  // three that join the arch of cartilage below it
  const arch = [
    [22, 1.262],
    [34, 1.225],
    [48, 1.19],
  ];
  arch.forEach(([deg, y], i) => bone.rod(half, "ribs", ribPath(1.292 - i * 0.029, y, deg, 0.04), 0.006));
  bone.rod(half, "ribs", [onTorso(9, 1.296, -0.013), ...arch.map(([deg, y]) => onTorso(deg, y, -0.013))], 0.006);
  // two short floating ribs
  bone.rod(half, "ribs", ribPath(1.205, 1.165, 118, 0.01), 0.0055);
  bone.rod(half, "ribs", ribPath(1.176, 1.14, 138, 0.008), 0.0055);

  // ------------------------------------------------------------ shoulder girdle
  bone.rod(half, "collarbone", [[0.02, 1.474, 0.076], [0.07, 1.483, 0.068], [0.12, 1.492, 0.038], [0.164, 1.494, 0.006]], 0.008);
  add(half, plate([[152, 1.49], [130, 1.482], [108, 1.47], [103, 1.44], [108, 1.415], [128, 1.365], [148, 1.312], [154, 1.4]], 0.008, 0.009), boneMaterial, "scapula", "skeleton");
  bone.rod(half, "scapula", [onTorso(152, 1.44, 0.002), onTorso(128, 1.458, 0.006), onTorso(107, 1.478, 0.008)], 0.007);
  ligament.rod(half, "ac-ligament", [[0.156, 1.495, 0.008], [0.168, 1.492, -0.002], [0.176, 1.487, -0.012]], 0.005);

  // ------------------------------------------------------------ pelvis
  add(half, plate([[38, 1.035], [70, 1.05], [105, 1.052], [140, 1.04], [166, 1.0], [170, 0.95], [150, 0.925], [110, 0.93], [70, 0.94], [40, 0.96]], 0.008, 0.012), boneMaterial, "pelvis", "skeleton");
  bone.rod(half, "pelvis", [[0.006, 0.9, 0.082], [0.05, 0.915, 0.058], [0.085, 0.93, 0.02]], 0.012);
  bone.rod(half, "pelvis", [[0.085, 0.92, -0.002], [0.07, 0.87, -0.03], [0.04, 0.862, 0.02], [0.01, 0.893, 0.074]], 0.011);
  bone.bead(half, "pelvis", [0.09, 0.925, -0.004], 0.03); // hip socket

  // ------------------------------------------------------------ arm
  bone.rod(arm, "humerus", [[-0.008, 0.004, 0], [0, -0.03, 0], [0, -0.29, 0]], 0.013);
  bone.bead(arm, "humerus", [-0.014, 0.004, 0], 0.025); // the ball of the shoulder
  bone.bead(arm, "humerus", [0, -0.3, 0], [0.032, 0.017, 0.02]);
  ligament.rod(arm, "shoulder-capsule", [[-0.034, 0.014, 0.012], [-0.02, 0, 0.022], [-0.006, -0.014, 0.022]], 0.0045);
  ligament.rod(arm, "shoulder-capsule", [[-0.034, 0.002, -0.012], [-0.02, -0.01, -0.02], [-0.004, -0.022, -0.02]], 0.0045);
  ligament.rod(arm, "shoulder-capsule", [[-0.032, -0.014, 0], [-0.016, -0.026, 0.002], [0, -0.034, 0.004]], 0.0045);

  bone.rod(forearm, "forearm-bones", [[0.004, -0.004, 0.014], [0.002, -0.13, 0.016], [0, -0.258, 0.012]], 0.0085); // radius, thumb side
  bone.rod(forearm, "forearm-bones", [[-0.002, 0.012, -0.014], [-0.002, -0.13, -0.01], [0, -0.258, -0.01]], 0.008); // ulna
  bone.bead(forearm, "forearm-bones", [-0.002, 0.016, -0.02], 0.014); // the point of the elbow
  bone.bead(inHand, "hand-bones", [0, -0.318, 0.004], [0.008, 0.04, 0.03]);
  [
    [0.027, -0.43],
    [0.0095, -0.44],
    [-0.008, -0.432],
    [-0.0245, -0.415],
  ].forEach(([z, tip]) => bone.rod(inHand, "hand-bones", [[0, -0.352, z], [-0.004, -0.39, z + 0.002], [-0.014, tip, z + 0.006]], 0.0045));
  bone.rod(inHand, "hand-bones", [[-0.004, -0.3, 0.03], [-0.005, -0.325, 0.046], [-0.008, -0.348, 0.058]], 0.005);

  // ------------------------------------------------------------ leg
  bone.rod(thigh, "femur", [[0, 0, 0], [0.034, -0.012, 0], [0.05, -0.04, 0.002], [0.04, -0.12, 0.008], [0.02, -0.3, 0.014], [0.004, -0.412, 0.006]], 0.016);
  bone.bead(thigh, "femur", [0, 0, 0], 0.025); // the ball of the hip
  bone.bead(thigh, "femur", [0.054, -0.03, 0], 0.021); // the knob the hip muscles attach to
  bone.bead(thigh, "femur", [0.028, -0.425, -0.002], 0.022);
  bone.bead(thigh, "femur", [-0.02, -0.425, -0.002], 0.022);
  bone.bead(thigh, "kneecap", [0.002, -0.424, 0.046], [0.022, 0.026, 0.012]);

  bone.rod(shank, "shin", [[-0.004, -0.012, 0.004], [-0.004, -0.2, 0.006], [-0.004, -0.412, 0]], 0.015);
  bone.bead(shank, "shin", [0.002, -0.014, 0], [0.042, 0.016, 0.03]);
  bone.bead(shank, "shin", [-0.02, -0.42, 0], 0.014);
  bone.rod(shank, "fibula", [[0.032, -0.03, -0.012], [0.035, -0.2, -0.01], [0.03, -0.425, -0.006]], 0.007);
  bone.bead(shank, "fibula", [0.032, -0.03, -0.012], 0.011);
  bone.bead(shank, "fibula", [0.03, -0.428, -0.006], 0.012);
  {
    // the foot bones ride in the foot's own group, which turns at the ankle
    const bones = add(foot, footShape, boneMaterial, "foot-bones", "skeleton");
    bones.position.set(footAt[0] - ankle[0], footAt[1] + 0.005 - ankle[1], footAt[2] - ankle[2]);
    bones.rotation.set(...footTurn);
    bones.scale.set(0.78, 0.7, 0.9);
  }

  // knee and ankle ligaments (the shank's origin is the knee)
  ligament.rod(shank, "mcl", [[-0.038, 0.03, 0], [-0.04, 0, 0.002], [-0.03, -0.06, 0.006]], 0.005);
  ligament.rod(shank, "lcl", [[0.042, 0.028, -0.004], [0.042, 0, -0.008], [0.035, -0.032, -0.012]], 0.0045);
  ligament.rod(shank, "cruciates", [[0.012, 0.022, -0.012], [0.002, 0.004, 0.002], [-0.008, -0.012, 0.014]], 0.0045);
  ligament.rod(shank, "cruciates", [[-0.01, 0.022, 0.008], [-0.002, 0.004, -0.004], [0.006, -0.012, -0.016]], 0.0045);
  ligament.rod(shank, "patellar-ligament", [[0.002, -0.018, 0.05], [0, -0.04, 0.04], [-0.002, -0.064, 0.022]], 0.007);
  ligament.rod(shank, "ankle-ligaments", [[0.03, -0.43, -0.006], [0.036, -0.444, 0.012], [0.038, -0.458, 0.03]], 0.0045);
  ligament.rod(shank, "ankle-ligaments", [[0.03, -0.43, -0.008], [0.033, -0.448, -0.02], [0.03, -0.466, -0.034]], 0.0045);
  ligament.rod(shank, "deltoid-ligament", [[-0.022, -0.424, 0], [-0.028, -0.442, 0.01], [-0.03, -0.46, 0.022]], 0.007);

  // ------------------------------------------------------------ nerves
  // Every nerve starts as a root leaving the spine between two vertebrae. Roots merge into a
  // plexus, the plexus gives off named nerves, and each nerve thins as it sheds branches.
  const fine = { layer: "skeleton" };
  const root = (y) => [0.014, y, spineZ(y) + 0.012];

  // --- neck and arm: the brachial plexus, from five roots (C5 to T1)
  nerve(half, "nerve-roots", [root(1.6), [0.03, 1.576, 0.012], [0.048, 1.553, 0.014]], 0.0032, 0.0034);
  nerve(half, "nerve-roots", [root(1.585), [0.03, 1.566, 0.012], [0.048, 1.553, 0.014]], 0.0032, 0.0034);
  nerve(half, "nerve-roots", [root(1.568), [0.03, 1.55, 0.011], [0.05, 1.532, 0.013]], 0.0034, 0.0036);
  nerve(half, "nerve-roots", [root(1.552), [0.028, 1.536, 0.008], [0.045, 1.52, 0.008]], 0.0032, 0.0034);
  nerve(half, "nerve-roots", [root(1.535), [0.028, 1.526, 0.006], [0.045, 1.52, 0.008]], 0.0032, 0.0034);
  // three trunks pass over the first rib and under the collarbone
  nerve(half, "brachial-plexus", [[0.048, 1.553, 0.014], [0.075, 1.516, 0.02], [0.1, 1.486, 0.02]], 0.0044, 0.0042);
  nerve(half, "brachial-plexus", [[0.05, 1.532, 0.013], [0.076, 1.506, 0.016], [0.1, 1.48, 0.016]], 0.0038, 0.0038);
  nerve(half, "brachial-plexus", [[0.045, 1.52, 0.008], [0.074, 1.497, 0.012], [0.1, 1.474, 0.012]], 0.0042, 0.004);
  // three cords carry on into the armpit, where the nerves of the arm separate
  nerve(half, "brachial-plexus", [[0.1, 1.486, 0.02], [0.13, 1.463, 0.016], [0.156, 1.447, 0.01]], 0.0042, 0.0038);
  nerve(half, "brachial-plexus", [[0.1, 1.48, 0.016], [0.13, 1.458, 0.004], [0.158, 1.444, -0.006]], 0.004, 0.0038);
  nerve(half, "brachial-plexus", [[0.1, 1.474, 0.012], [0.13, 1.452, 0.008], [0.154, 1.44, 0.004]], 0.004, 0.0038);

  // axillary nerve: hooks behind the top of the arm bone to the shoulder muscle
  nerve(arm, "axillary-nerve", [[-0.016, 0, -0.008], [-0.008, -0.03, -0.022], [0.012, -0.045, -0.026], [0.03, -0.05, -0.012], [0.036, -0.056, 0.008]], 0.003, 0.0014);
  // musculocutaneous nerve: through the front of the upper arm, then a skin nerve down the forearm
  const musculocutaneous = [[-0.018, 0.004, 0.012], [-0.008, -0.06, 0.02], [0.004, -0.16, 0.024], [0.016, -0.27, 0.02], [0.02, -0.3, 0.016]];
  nerve(arm, "musculocutaneous-nerve", musculocutaneous, 0.003, 0.0018);
  twigs(arm, "musculocutaneous-nerve", musculocutaneous, 3, 0.035, 0.0012);
  nerve(forearm, "musculocutaneous-nerve", [[0.022, 0, 0.014], [0.024, -0.1, 0.016], [0.02, -0.22, 0.014]], 0.0018, 0.0009);
  // median nerve: down the inner arm, through the middle of the forearm, into the palm
  nerve(arm, "median-nerve", [[-0.018, 0.002, 0.008], [-0.02, -0.08, 0.01], [-0.016, -0.2, 0.012], [-0.006, -0.3, 0.016]], 0.0038, 0.0034);
  const medianForearm = [[-0.004, 0, 0.014], [-0.002, -0.1, 0.01], [0, -0.2, 0.006], [0, -0.262, 0.004]];
  nerve(forearm, "median-nerve", medianForearm, 0.0034, 0.0026);
  twigs(forearm, "median-nerve", medianForearm, 4, 0.04, 0.0012);
  nerve(inHand, "median-nerve", [[0, -0.262, 0.004], [-0.004, -0.29, 0.008], [-0.007, -0.318, 0.01]], 0.0026, 0.002, fine);
  for (const tip of [[-0.01, -0.345, 0.052], [-0.012, -0.405, 0.03], [-0.014, -0.412, 0.012]])
    nerve(inHand, "median-nerve", [[-0.007, -0.318, 0.01], [(tip[0] - 0.007) / 2, (tip[1] - 0.318) / 2, (tip[2] + 0.01) / 2], tip], 0.0013, 0.0006, fine);
  // ulnar nerve: behind the inner elbow (the "funny bone"), then down the little-finger side
  nerve(arm, "ulnar-nerve", [[-0.02, 0, 0.002], [-0.024, -0.1, -0.004], [-0.024, -0.22, -0.014], [-0.024, -0.296, -0.026]], 0.0034, 0.003);
  const ulnarForearm = [[-0.022, 0.004, -0.022], [-0.02, -0.06, -0.014], [-0.014, -0.18, -0.012], [-0.008, -0.262, -0.014]];
  nerve(forearm, "ulnar-nerve", ulnarForearm, 0.003, 0.0022);
  twigs(forearm, "ulnar-nerve", ulnarForearm, 2, 0.035, 0.0011);
  nerve(inHand, "ulnar-nerve", [[-0.008, -0.262, -0.014], [-0.008, -0.29, -0.015], [-0.008, -0.316, -0.016]], 0.0022, 0.0018, fine);
  for (const tip of [[-0.014, -0.398, -0.006], [-0.014, -0.39, -0.022]])
    nerve(inHand, "ulnar-nerve", [[-0.008, -0.316, -0.016], [(tip[0] - 0.008) / 2, (tip[1] - 0.316) / 2, (tip[2] - 0.016) / 2], tip], 0.0013, 0.0006, fine);
  // radial nerve: spirals around the back of the arm bone, then splits at the elbow
  const radialArm = [[-0.016, 0, -0.006], [-0.014, -0.05, -0.02], [0, -0.12, -0.026], [0.018, -0.2, -0.016], [0.024, -0.27, 0], [0.022, -0.3, 0.008]];
  nerve(arm, "radial-nerve", radialArm, 0.0038, 0.003);
  twigs(arm, "radial-nerve", radialArm, 3, 0.035, 0.0012);
  nerve(forearm, "radial-nerve", [[0.022, 0, 0.01], [0.022, -0.1, 0.012], [0.016, -0.24, 0.012]], 0.002, 0.001);
  nerve(forearm, "radial-nerve", [[0.022, -0.02, 0.008], [0.014, -0.06, -0.008], [0.006, -0.16, -0.014], [0.002, -0.24, -0.012]], 0.0022, 0.001);

  // --- trunk: one nerve under each rib
  for (let i = 0; i < 7; i++) nerve(half, "intercostal-nerves", ribPath(1.495 - i * 0.029 - 0.009, 1.452 - i * 0.026 - 0.009, 8, 0.012 + i * 0.004), 0.0019, 0.0009, { layer: "skeleton", wander: 0.0005 });
  arch.forEach(([deg, y], i) => nerve(half, "intercostal-nerves", ribPath(1.292 - i * 0.029 - 0.009, y - 0.016, deg - 10, 0.04), 0.0019, 0.0009, { layer: "skeleton", wander: 0.0005 }));
  nerve(half, "intercostal-nerves", ribPath(1.196, 1.14, 100, 0.012), 0.0019, 0.0009, { layer: "skeleton", wander: 0.0005 });
  nerve(half, "intercostal-nerves", ribPath(1.167, 1.1, 118, 0.01), 0.0019, 0.0009, { layer: "skeleton", wander: 0.0005 });

  // --- lower back: the lumbar plexus (L1 to L4) gives the nerves for the front and inside of the thigh
  for (const y of [1.15, 1.115, 1.08, 1.045]) nerve(half, "nerve-roots", [root(y), [0.03, y - 0.03, spineZ(y) + 0.022], [0.042, 1.035, 0.004]], 0.003, 0.0032);
  nerve(half, "lumbar-plexus", [[0.042, 1.035, 0.004], [0.058, 0.992, 0.036], [0.07, 0.957, 0.066]], 0.0046, 0.0044);
  // femoral nerve: enters the thigh at the groin and fans out almost at once
  nerve(thigh, "femoral-nerve", [[-0.02, 0.032, 0.068], [-0.016, 0, 0.064], [-0.012, -0.03, 0.058]], 0.0044, 0.004);
  nerve(thigh, "femoral-nerve", [[-0.012, -0.03, 0.058], [-0.002, -0.09, 0.056], [0.004, -0.17, 0.05]], 0.0022, 0.0009);
  nerve(thigh, "femoral-nerve", [[-0.012, -0.03, 0.058], [0.018, -0.08, 0.046], [0.036, -0.16, 0.034]], 0.0022, 0.0009);
  nerve(thigh, "femoral-nerve", [[-0.012, -0.03, 0.058], [-0.022, -0.12, 0.046], [-0.03, -0.25, 0.036]], 0.0022, 0.0009);
  nerve(thigh, "femoral-nerve", [[-0.012, -0.03, 0.058], [0.004, -0.06, 0.05], [0.014, -0.11, 0.04]], 0.0018, 0.0008);
  // saphenous nerve: its longest branch, a skin nerve down the inner side of the leg
  nerve(thigh, "saphenous-nerve", [[-0.012, -0.03, 0.058], [-0.03, -0.14, 0.036], [-0.042, -0.3, 0.012], [-0.04, -0.42, -0.004]], 0.002, 0.0015);
  nerve(shank, "saphenous-nerve", [[-0.036, 0.006, -0.004], [-0.034, -0.15, 0.004], [-0.024, -0.38, 0.008]], 0.0015, 0.0008, fine);
  // obturator nerve: through an opening in the pelvis to the inner-thigh muscles
  nerve(half, "obturator-nerve", [[0.042, 1.035, 0.004], [0.036, 0.97, -0.006], [0.042, 0.92, 0.014], [0.046, 0.89, 0.03]], 0.0028, 0.0026);
  const obturator = [[-0.045, -0.034, 0.034], [-0.05, -0.12, 0.02], [-0.044, -0.22, 0.012]];
  nerve(thigh, "obturator-nerve", obturator, 0.0026, 0.001);
  twigs(thigh, "obturator-nerve", obturator, 2, 0.04, 0.001);

  // --- base of the spine: the sacral plexus (L4 to S3) joins into the sciatic nerve
  for (const y of [1.045, 1.01]) nerve(half, "nerve-roots", [root(y), [0.03, y - 0.04, -0.05], [0.05, 0.962, -0.086]], 0.0032, 0.0036);
  for (const y of [0.98, 0.962, 0.946]) nerve(half, "nerve-roots", [[0.02, y, -0.062], [0.036, y - 0.006, -0.074], [0.05, 0.958, -0.088]], 0.003, 0.0036);
  nerve(half, "sacral-plexus", [[0.05, 0.96, -0.087], [0.056, 0.957, -0.096], [0.06, 0.954, -0.103]], 0.0066, 0.0068, { flat: 0.6 });
  // sciatic nerve: a thick, slightly flat band. It surfaces under the piriformis and runs down
  // inside the back of the thigh, giving branches to the hamstrings on the way.
  const sciatic = [[-0.03, 0.03, -0.1], [-0.014, -0.03, -0.092], [-0.004, -0.1, -0.07], [0, -0.2, -0.048], [0, -0.33, -0.034]];
  nerve(thigh, "sciatic", sciatic, 0.0072, 0.0058, { flat: 0.62, wander: 0.0016 });
  twigs(thigh, "sciatic", sciatic, 4, 0.05, 0.0014);
  // above the knee it divides in two
  nerve(thigh, "tibial-nerve", [[0, -0.33, -0.034], [-0.002, -0.38, -0.032], [0, -0.425, -0.03]], 0.0046, 0.0044);
  nerve(thigh, "peroneal-nerve", [[0, -0.33, -0.034], [0.016, -0.38, -0.034], [0.03, -0.422, -0.03]], 0.0038, 0.0034);
  // tibial nerve: down the middle of the calf, behind the inner ankle bone and into the sole
  const tibial = [[0, 0.008, -0.03], [0, -0.15, -0.024], [-0.008, -0.32, -0.018], [-0.018, -0.418, -0.014]];
  nerve(shank, "tibial-nerve", tibial, 0.0044, 0.003);
  twigs(shank, "tibial-nerve", tibial, 3, 0.04, 0.0013);
  nerve(inFoot, "tibial-nerve", [[-0.018, -0.418, -0.014], [-0.012, -0.468, 0.008], [0, -0.483, 0.06], [0.004, -0.486, 0.12]], 0.0028, 0.001, fine);
  // common peroneal nerve: winds around the outside of the knee, where it lies just under the skin
  nerve(shank, "peroneal-nerve", [[0.03, 0.01, -0.03], [0.04, -0.03, -0.016], [0.038, -0.06, 0]], 0.0034, 0.003);
  nerve(shank, "peroneal-nerve", [[0.038, -0.06, 0], [0.034, -0.2, 0.004], [0.026, -0.36, 0.01]], 0.002, 0.001, fine);
  nerve(shank, "peroneal-nerve", [[0.038, -0.06, 0], [0.022, -0.1, 0.018], [0.012, -0.25, 0.022], [0.008, -0.4, 0.024]], 0.0022, 0.001);

  // ------------------------------------------------------------ joints
  // A ring around each joint: something to point at and click, since a joint is a place, not a part.
  const jointMaterial = new THREE.MeshStandardMaterial({ color: "#86d3c0", roughness: 0.4, metalness: 0, emissive: "#1d5a4c", emissiveIntensity: 0.5 });
  const ring = new THREE.TorusGeometry(1, 0.11, 10, 48);
  const joint = (parent, landmark, position, radius, tilt = [Math.PI / 2, 0, 0]) => {
    const mesh = add(parent, ring, jointMaterial, landmark, "skeleton");
    mesh.position.set(...position);
    mesh.rotation.set(...tilt);
    mesh.scale.setScalar(radius);
    return mesh;
  };
  joint(arm, "shoulder-joint", [-0.012, 0.002, 0], 0.04, [Math.PI / 2, 0.5, 0]);
  joint(forearm, "elbow-joint", [0, 0.006, -0.004], 0.04);
  joint(thigh, "hip-joint", [0.004, -0.002, 0], 0.042, [Math.PI / 2, -0.45, 0]);
  joint(shank, "knee-joint", [0.002, 0.004, 0.004], 0.062);
  joint(shank, "ankle-joint", [0.004, -0.432, -0.004], 0.046);

  // ------------------------------------------------------------ heart, arteries and veins
  // Arteries are drawn red and veins blue, as in every atlas. Only the vessels a lifter hears
  // about are here: the trunk lines and the main line down each limb.
  const arteryMaterial = new THREE.MeshPhysicalMaterial({ color: "#c2413b", roughness: 0.35, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.3, emissive: "#3a0b09", emissiveIntensity: 0.5 });
  const veinMaterial = new THREE.MeshPhysicalMaterial({ color: "#4f74bd", roughness: 0.4, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.35, emissive: "#0c1a3c", emissiveIntensity: 0.5 });
  const vessel = (material) => (parent, landmark, points, r0, r1 = r0 * 0.8) =>
    add(parent, nerveGeometry(points, r0, r1, 1, 0.0005, rand), material, landmark, "skeleton");
  const artery = vessel(arteryMaterial);
  const vein = vessel(veinMaterial);

  {
    // the heart: a fist-sized cone behind the breastbone, its tip pointing to the body's left
    const heart = add(centre, sphere, arteryMaterial, "heart", "skeleton");
    heart.position.set(0.016, 1.342, 0.034);
    heart.rotation.z = 0.5;
    heart.scale.set(0.04, 0.05, 0.034);
  }
  // aorta: up from the heart, over in an arch, then down in front of the spine
  artery(centre, "aorta", [[0.004, 1.37, 0.04], [0.002, 1.42, 0.036], [0.006, 1.446, 0.012], [0.01, 1.42, -0.01], [0.01, 1.36, -0.02]], 0.0095, 0.009);
  artery(centre, "aorta", [[0.01, 1.36, -0.02], [0.008, 1.28, -0.014], [0.006, 1.2, 0.004], [0.004, 1.1, 0.008], [0.002, 1.03, -0.006]], 0.009, 0.0074);
  // carotid: up the side of the neck to the head
  artery(half, "carotid-artery", [[0.012, 1.44, 0.014], [0.022, 1.5, 0.022], [0.03, 1.56, 0.024], [0.034, 1.62, 0.018], [0.038, 1.662, 0.012]], 0.0044, 0.003);
  // subclavian: over the first rib and under the collarbone, into the armpit
  artery(half, "subclavian-artery", [[0.012, 1.44, 0.014], [0.05, 1.474, 0.032], [0.1, 1.466, 0.03], [0.152, 1.438, 0.016]], 0.005, 0.0044);
  // brachial: down the inner side of the upper arm, to the front of the elbow
  artery(arm, "brachial-artery", [[-0.02, -0.004, 0.014], [-0.025, -0.1, 0.017], [-0.021, -0.2, 0.02], [-0.008, -0.296, 0.024]], 0.0042, 0.0034);
  artery(arm, "brachial-artery", [[-0.023, -0.04, 0.014], [-0.016, -0.09, -0.012], [0.004, -0.17, -0.022], [0.016, -0.25, -0.01]], 0.0024, 0.0014); // the deep artery, with the radial nerve
  // radial and ulnar: the two arteries of the forearm
  artery(forearm, "forearm-arteries", [[0.002, -0.004, 0.022], [0.012, -0.1, 0.025], [0.01, -0.2, 0.023], [0.006, -0.264, 0.02]], 0.003, 0.002);
  artery(forearm, "forearm-arteries", [[-0.004, -0.004, 0.02], [-0.014, -0.08, 0.004], [-0.012, -0.2, -0.004], [-0.006, -0.264, -0.006]], 0.003, 0.002);
  // iliac: the aorta divides in two at the navel; each side sends one branch to the leg and one into the pelvis
  artery(half, "iliac-artery", [[0.003, 1.03, -0.006], [0.03, 0.992, 0.012], [0.055, 0.956, 0.046], [0.07, 0.93, 0.07]], 0.006, 0.0052);
  artery(half, "iliac-artery", [[0.03, 0.992, 0.012], [0.04, 0.955, -0.03], [0.052, 0.935, -0.064], [0.07, 0.93, -0.088]], 0.0036, 0.0022);
  // femoral: down the front of the thigh, then through to the back above the knee
  artery(thigh, "femoral-artery", [[-0.026, 0.006, 0.072], [-0.024, -0.05, 0.066], [-0.03, -0.16, 0.048], [-0.034, -0.27, 0.022], [-0.02, -0.36, -0.016]], 0.0054, 0.0042);
  artery(thigh, "femoral-artery", [[-0.024, -0.05, 0.066], [-0.01, -0.1, 0.04], [0, -0.2, 0.016], [0.004, -0.3, -0.006]], 0.0032, 0.0016); // the deep artery of the thigh
  // popliteal: behind the knee
  artery(thigh, "popliteal-artery", [[-0.02, -0.36, -0.016], [-0.01, -0.4, -0.03], [-0.006, -0.432, -0.034]], 0.0042, 0.004);
  artery(shank, "popliteal-artery", [[-0.006, 0, -0.032], [-0.006, -0.025, -0.03], [-0.005, -0.05, -0.027]], 0.004, 0.0036);
  // tibial arteries: one behind the shin bone to the sole, one through to the front and the top of the foot
  artery(shank, "tibial-arteries", [[-0.005, -0.05, -0.027], [-0.007, -0.2, -0.021], [-0.015, -0.36, -0.015], [-0.023, -0.426, -0.012]], 0.0032, 0.002);
  artery(shank, "tibial-arteries", [[-0.005, -0.05, -0.027], [0.012, -0.08, 0], [0.015, -0.2, 0.017], [0.009, -0.4, 0.023], [0.006, -0.456, 0.052]], 0.0028, 0.0016);

  // vena cava: the two great veins that return blood to the heart, on the body's right
  vein(centre, "vena-cava", [[-0.02, 1.47, 0.022], [-0.022, 1.42, 0.03], [-0.016, 1.375, 0.034]], 0.008, 0.008);
  vein(centre, "vena-cava", [[-0.014, 1.33, 0.024], [-0.018, 1.2, 0.01], [-0.016, 1.1, 0.01], [-0.008, 1.03, -0.004]], 0.0086, 0.0078);
  // jugular: down the side of the neck, outside the carotid artery
  vein(half, "jugular-vein", [[0.05, 1.658, 0.01], [0.048, 1.62, 0.022], [0.042, 1.55, 0.032], [0.032, 1.482, 0.032], [0.02, 1.468, 0.024]], 0.0036, 0.0046);
  // arm veins: the deep vein under the collarbone, the cephalic on the outside and the basilic on the inside
  vein(half, "arm-veins", [[0.152, 1.45, 0.026], [0.09, 1.478, 0.042], [0.032, 1.482, 0.032]], 0.004, 0.0046);
  vein(arm, "arm-veins", [[0.018, -0.3, 0.026], [0.023, -0.22, 0.03], [0.02, -0.1, 0.032], [0.002, -0.004, 0.03]], 0.0024, 0.003);
  vein(arm, "arm-veins", [[-0.02, -0.3, 0.012], [-0.03, -0.24, 0.006], [-0.032, -0.12, 0.004], [-0.027, -0.01, 0.006]], 0.0024, 0.003);
  vein(forearm, "arm-veins", [[0.012, -0.25, 0.024], [0.021, -0.12, 0.026], [0.02, 0, 0.024]], 0.0016, 0.0024);
  vein(forearm, "arm-veins", [[-0.012, -0.25, -0.002], [-0.021, -0.12, 0], [-0.02, 0, 0.01]], 0.0016, 0.0024);
  // femoral vein: beside the femoral artery, on its inner side
  vein(half, "femoral-vein", [[0.064, 0.93, 0.064], [0.058, 0.952, 0.04], [0.036, 0.986, 0.004], [0.008, 1.026, -0.006]], 0.0052, 0.006);
  vein(thigh, "femoral-vein", [[-0.012, -0.428, -0.038], [-0.028, -0.36, -0.022], [-0.042, -0.27, 0.014], [-0.039, -0.16, 0.04], [-0.033, -0.05, 0.06], [-0.035, 0.006, 0.066]], 0.004, 0.0052);
  // great saphenous vein: the long vein under the skin of the inner leg
  vein(thigh, "saphenous-vein", [[-0.046, -0.42, -0.01], [-0.053, -0.3, 0.006], [-0.055, -0.14, 0.03], [-0.04, -0.03, 0.058]], 0.0024, 0.0032);
  vein(shank, "saphenous-vein", [[-0.025, -0.44, 0.014], [-0.028, -0.38, 0.006], [-0.039, -0.15, -0.002], [-0.043, 0.004, -0.01]], 0.0016, 0.0024);

  return { materials: [boneMaterial, ligamentMaterial, nerveMaterial, stripes, jointMaterial, arteryMaterial, veinMaterial] };
}
