import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildBody } from "./anatomy.js";
import { buildRealBody, loadAnatomy } from "./realbody.js";
import { createContactShadowTexture } from "./textures.js";
import { buildAttachmentMarkers } from "./markers.js";
import { buildEquipment, GRIP_POINT } from "./props.js";
import { createOutlines } from "./outlines.js";
import { ATTACHMENTS } from "../data/attachments.js";

/**
 * The real muscle and bone shapes (src/data/zanatomy). Loaded with this module, so the page shows
 * the stage once they are here. A browser that cannot unpack them gets the drawn figure of
 * anatomy.js instead, which has the same structure.
 */
const ANATOMY = await loadAnatomy().catch((error) => {
  console.warn("Using the drawn figure:", error);
  return null;
});

const GOLD = new THREE.Color("#ecb75c");
const HOVER = new THREE.Color("#ffd9a3");
const SELECTED_BASE = new THREE.Color(0.6, 0.52, 0.46); // what is left of the red under the gold glow
const DIM = new THREE.Color(0.36, 0.34, 0.38);
const WHITE = new THREE.Color(1, 1, 1);
const FOV = 30;
const BODY_CENTRE_Y = 0.93;
/** Within a selected or hovered muscle, the heads that were not picked glow at this share. */
const SIBLING = 0.38;

/** In the exercise view, the helper muscles glow at this share of the main muscle. */
const HELPER = 0.34;

/** Everything a pose can turn: the whole body, then each segment of the limbs. */
const RIG = ["root", "arm", "forearm", "hand", "thigh", "shank", "foot"];
/** Turning any of these can take the feet off the floor. */
const LEGS = ["root", "thigh", "shank", "foot"];
/** The segments that carry muscles, which can bulge while a movement plays. */
const LIMBS = ["arm", "forearm", "thigh", "shank"];
const AXES = ["x", "y", "z"];

/**
 * The body positions on offer. Each lists the angles, in radians, that are added to the relaxed
 * stance. A pose only turns joints. Afterwards the body is set back on the floor (see
 * _plantFeet), so no pose has to say how far it sinks.
 *   root     x leans the whole body forward
 *   arm      x swings it forward (negative) or back, y twists it outward, z lifts it to the side
 *   forearm  x folds the elbow (negative), y turns the palm forward, z bends it toward the outer side
 *   hand     z bends the wrist back
 *   thigh    x swings it forward (negative), z spreads it to the side
 *   shank    x bends the knee
 *   foot     x and z tip it at the ankle: to keep the sole flat while the leg leans, or to rise on the toes
 * Both sides of the body take the same angles, unless the pose has an "other" block. That block
 * lists the segments that differ on the far side, the mirrored one, and replaces them whole.
 *
 * Every pose but the relaxed one is one position of a real exercise. What it holds, and how the
 * hands close around it, is in POSE_FRAME below.
 */
const POSES = {
  rest: {},

  // --- legs
  // The bottom of a squat: thighs level, knees over the toes, trunk leaning in, arms out for balance.
  squat: { root: { x: 0.6 }, arm: { x: -2.02, z: -0.14 }, forearm: { x: 0.1 }, thigh: { x: -2.03 }, shank: { x: 1.77 }, foot: { x: -0.34 } },
  // The bottom of a lunge. Near leg in front, thigh level and shin upright. Far leg behind, knee
  // low, standing on its toes. The bend of the far knee is the one that puts both feet on the floor.
  lunge: {
    thigh: { x: -1.56 },
    shank: { x: 1.56 },
    other: { thigh: { x: 0.22 }, shank: { x: 1.51 }, foot: { x: -0.46 } },
  },
  // The bottom of a Romanian deadlift: hips pushed back, knees soft, a long trunk, the weights
  // hanging straight down from the shoulders.
  deadlift: { root: { x: 0.95 }, arm: { x: -0.94 }, thigh: { x: -1.48 }, shank: { x: 0.5 }, foot: { x: 0.03 } },
  // The top of a hip thrust: the upper back on a bench, the body level from shoulders to knees,
  // shins upright, feet flat.
  thrust: { root: { x: -1.5708 }, arm: { x: 0.12 }, forearm: { x: -0.2 }, thigh: { x: -0.03 }, shank: { x: 1.5208 }, foot: { x: 0.08 } },
  calf: { foot: { x: 0.6 } }, // the top of a calf raise: up on the toes
  // A standing march: near knee lifted to hip height, far leg standing, arms swung the opposite way.
  march: {
    arm: { x: 0.45 },
    forearm: { x: -1.25 },
    thigh: { x: -1.5 },
    shank: { x: 1.45 },
    foot: { x: 0.25 },
    other: { arm: { x: -0.75 }, forearm: { x: -1.3 }, thigh: {}, shank: {}, foot: {} },
  },

  // --- floor
  // The top of a push-up: a straight body on the toes and the flat of the hands. The lean is
  // the one at which the hands reach the floor, and the arms are swung to stand upright under the shoulders.
  pushup: { root: { x: 1.2822 }, arm: { x: -1.2748 }, forearm: { x: 0.16, y: -1.5 }, hand: { z: 1.9 }, thigh: { x: -0.03 }, shank: { x: -0.05 } },
  // A front plank: the same straight body, lower, resting on the forearms. Again the lean is
  // the one that sets the elbows on the floor, with the upper arms upright.
  plank: { root: { x: 1.4531 }, arm: { x: -1.4496 }, forearm: { x: -1.41 }, thigh: { x: -0.03 }, shank: { x: -0.05 } },

  // --- arms
  // The top of a curl: upper arms by the sides, elbows folded, palms turned toward the shoulders.
  curl: { arm: { y: 0.25 }, forearm: { x: -1.94, y: 1.1 } },
  // A shoulder press at the start: upper arms out and just below level, forearms upright, palms
  // forward. The arm is twisted only halfway, so the shoulder muscle stays roughly where it
  // belongs, and the elbow folds in a slanted plane to make up for it.
  press: { arm: { y: 0.8, z: 1.13 }, forearm: { x: -1.687, y: -0.2, z: 0.752 } },
  // The top of a lateral raise: arms out to the sides, a little forward, elbows soft.
  raise: { arm: { x: -0.2, z: 1.2 }, forearm: { x: -0.12 } },
  // An overhead triceps extension at the bottom: elbows up beside the head, weights behind the neck.
  triceps: { arm: { x: -2.9, z: -0.34 }, forearm: { x: -2.2 } },
  // A bent-over row at the top: the deadlift's hinge, with the elbows pulled back past the ribs.
  row: { root: { x: 0.95 }, arm: { x: 0.5 }, forearm: { x: -1.29 }, thigh: { x: -1.48 }, shank: { x: 0.5 }, foot: { x: 0.03 } },
  // The top of a pull-up: elbows down and out, forearms upright to the bar, legs hanging.
  pullup: { arm: { z: 0.61 }, forearm: { x: 0.16, y: 1.5708, z: 2.29 }, shank: { x: 0.5 }, foot: { x: 0.4 } },
};
/** The angle a pose asks of one segment on one side of the body: 0 is the modeled side, 1 the far side. */
const poseAngle = (pose, name, side, axis) => ((side === 1 ? pose.other?.[name] : undefined) ?? pose[name])?.[axis] ?? 0;
/** A movement is played on the modeled side only: [group, axis, the angle at the far end]. */
const MOTIONS = {
  elbow: [["forearm", "x", -2.05]],
  knee: [["shank", "x", 1.8]],
  shoulder: [["arm", "z", 1.5]],
  hip: [
    ["thigh", "x", -1.3],
    ["shank", "x", 1.35],
  ],
};
const MOTION_PERIOD = 2.8; // seconds for one out-and-back
const POSE_TIME = 0.9; // seconds to move from one pose to the next
/**
 * How to frame the whole figure in each pose, in meters: the point to look at (y up, z toward
 * the front), half its height (h), and half its width seen from the front (wx) and from the side (wz).
 * turn: a pose that is bent forward reads badly from straight ahead, so it names the angle, in
 * degrees from the front, that the camera swings to.
 * floor: how much wider the pedestal has to be than usual to hold the pose.
 * slide: how far the body is moved forward, so that a pose that reaches out stays over the pedestal.
 * oneLeg: the body stands on the far foot alone; the near one is in the air.
 * under: which side of the body faces the floor, "front" or "back", in a pose that lies down.
 * hold: the equipment of the exercise: "dumbbells" in the hands, a "bar" to hang from, a "bench" to lie on.
 * grip: how far the hands close, from 0 (relaxed) to 1 (a fist around a handle).
 * lift: how high the feet hang above the floor.
 */
const POSE_FRAME = {
  rest: { y: 0.93, z: 0, h: 1, wx: 0.52, wz: 0.52 },
  squat: { y: 0.66, z: 0.14, h: 0.74, wx: 0.5, wz: 0.66, turn: 55 },
  lunge: { y: 0.72, z: 0, h: 0.8, wx: 0.5, wz: 0.68, turn: 65, floor: 1.25, hold: "dumbbells", grip: 1 },
  deadlift: { y: 0.72, z: 0.07, h: 0.8, wx: 0.5, wz: 0.54, turn: 60, hold: "dumbbells", grip: 1 },
  thrust: { y: 0.34, z: 0, h: 0.5, wx: 0.6, wz: 0.8, turn: 75, floor: 1.3, slide: 0.61, under: "back", hold: "bench" },
  calf: { y: 0.975, z: 0, h: 1.05, wx: 0.52, wz: 0.52, turn: 65 },
  march: { y: 0.93, z: 0.2, h: 1, wx: 0.52, wz: 0.5, turn: 55, oneLeg: true },
  pushup: { y: 0.36, z: 0, h: 0.5, wx: 0.45, wz: 0.98, turn: 70, floor: 1.55, slide: -0.73, under: "front" },
  plank: { y: 0.26, z: 0, h: 0.44, wx: 0.45, wz: 0.98, turn: 70, floor: 1.6, slide: -0.77, under: "front", grip: 0.6 },
  curl: { y: 0.93, z: 0.1, h: 1, wx: 0.52, wz: 0.52, turn: 45, hold: "dumbbells", grip: 1 },
  press: { y: 0.97, z: 0, h: 1.04, wx: 0.64, wz: 0.52, hold: "dumbbells", grip: 1 },
  raise: { y: 0.93, z: 0, h: 1, wx: 0.96, wz: 0.52, hold: "dumbbells", grip: 1 },
  triceps: { y: 0.95, z: 0, h: 1.02, wx: 0.52, wz: 0.52, turn: 60, hold: "dumbbells", grip: 1 },
  row: { y: 0.72, z: 0.07, h: 0.8, wx: 0.5, wz: 0.54, turn: 60, hold: "dumbbells", grip: 1 },
  pullup: { y: 1.14, z: 0, h: 1.21, wx: 0.8, wz: 0.52, lift: 0.4, hold: "bar", grip: 1 },
};
const EQUIPMENT = ["dumbbells", "bar", "bench"];
/** A spot between the shoulder blades, in the trunk's own coordinates: where the back rests on a bench. */
const BENCH_REST = [0, 1.33, -0.118];
/** The difference between two angles in degrees, between -180 and 180. */
const wrapDegrees = (d) => ((((d % 360) + 540) % 360) - 180);

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * The 3D stage: renders the body, handles orbiting, hover and picking.
 *
 * Layers
 *   "surface"   the muscles you see under the skin
 *   "deep"      covering muscles are lifted away and the ones beneath are shown
 *   "skeleton"  muscles turn to glass; bones, ligaments and nerves are shown
 *
 * callbacks.onHover(id | null, clientX, clientY, landmarkId | null, part | null)
 * callbacks.onSelect(id, part)   a muscle picked on the canvas
 * callbacks.onLandmark(landmarkId, clientX, clientY)   a click or tap on fascia, a tendon, a bone, a ligament or a nerve.
 *                                                      The page answers by calling selectLandmark().
 * callbacks.onSideChange("front" | "back")   which side of the body faces the camera
 * callbacks.onMotionEnd()   a movement started with playMotion() has finished its repeats
 */
export class MuscleViewer {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    /** { muscle, part } or null. part is null when the whole muscle is meant. */
    this.selected = null;
    this.hovered = null;
    this.layer = "surface";
    this.tween = null;
    this.visible = true;
    this.side = "front";
    this.backdropDim = 0;
    this.lift = 0;
    this.landmark = null;
    /** the bone, ligament, nerve, fascia or tendon being studied, or null */
    this.structure = null;
    /** the meshes of that structure, wearing their lit materials */
    this.lit = [];
    /** plain material -> its gold-lit twin */
    this.litMaterials = new Map();
    this.structureDim = 0;
    /** exercise view: the helper muscles, lit dim beside the selected main muscle. null when off. */
    this.work = null;
    /** the body position, and how far each limb has got on its way there */
    this.pose = "rest";
    this.poseNow = Object.fromEntries(RIG.map((name) => [name, [0, 1].map(() => ({ x: 0, y: 0, z: 0 }))]));
    /** how far the body has slid forward and the pedestal has widened for the pose */
    this.slide = 0;
    this.floor = 1;
    /** where the body was when the pose last changed, and how far it has come since, 0 to 1 */
    this.poseFrom = null;
    this.poseProgress = 1;
    /** how far forward the body stood at the last frame, and stands in each pose once it has settled */
    this.rootZ = 0;
    this.standingZ = {};
    /** how far the hands have closed, how high the feet hang, and how far each piece of equipment has come in */
    this.grip = 0;
    this.lift = 0;
    this.held = Object.fromEntries(EQUIPMENT.map((kind) => [kind, 0]));
    /** where the bar hangs and the bench stands: for each pose once worked out, and as last used */
    this.propPlaces = {};
    this.propAt = { bar: { y: 2, z: 0 }, bench: { top: 0.4, z: 0 } };
    /** 0 to 1: how fully the body stands on the far foot because a movement is playing on the near side */
    this.oneFoot = 0;
    /** the movement being played: { name, works, time, repeats } or null */
    this.motion = null;
    /** 0 to 1 while a movement plays: how shortened the working muscle is. null otherwise. */
    this.contraction = null;
    /** the muscle whose attachment dots are showing */
    this.markersFor = null;
    const coarse = window.matchMedia("(pointer: coarse)").matches;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer = renderer;

    const scene = new THREE.Scene();
    this.scene = scene;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    this.environment = pmrem.fromScene(room, 0.04).texture;
    scene.environment = this.environment;
    scene.environmentIntensity = 0.42;
    room.dispose();
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
    this.camera = camera;
    scene.add(camera);

    // A studio rig that rides on the camera, so the body is lit the same from every side:
    // a warm key from the upper right, a cool fill from the left and two rim lights behind.
    const aim = new THREE.Object3D();
    camera.add(aim);
    this.aim = aim;

    const key = new THREE.DirectionalLight(0xfff2e4, 2.3);
    key.position.set(1.5, 1.9, 1.2);
    key.target = aim;
    key.castShadow = true;
    key.shadow.mapSize.setScalar(coarse ? 1024 : 2048);
    const sc = key.shadow.camera;
    sc.left = sc.bottom = -1.45;
    sc.right = sc.top = 1.45;
    sc.near = 0.5;
    sc.far = 14;
    sc.updateProjectionMatrix();
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.007;
    key.shadow.radius = 3.5;
    key.shadow.intensity = 0.8;
    camera.add(key);

    const fill = new THREE.DirectionalLight(0xb4c8ff, 0.55);
    fill.position.set(-2.2, 0.2, 1.5);
    fill.target = aim;
    camera.add(fill);

    const rimWarm = new THREE.DirectionalLight(0xffc98a, 2.4);
    rimWarm.target = aim;
    camera.add(rimWarm);
    const rimCool = new THREE.DirectionalLight(0x9db8ff, 1.7);
    rimCool.target = aim;
    camera.add(rimCool);
    this.rims = [rimWarm, rimCool];

    const body = ANATOMY ? buildRealBody(ANATOMY) : buildBody();
    this.body = body;
    scene.add(body.root);
    /** highlight state per part, keyed like body.parts */
    this.state = new Map();
    for (const key of body.parts.keys()) this.state.set(key, { glow: 0, dim: 0, hover: 0 });
    // everything that is not a selectable muscle fades back a little while one is selected
    this.backdrop = body.backdrop.map((material) => ({ material, base: material.color.clone() }));
    // bones, ligaments and nerves fade back while one of them is being studied
    this.inner = [...new Set(body.meshes.filter((m) => m.userData.layer === "skeleton" || m.userData.layer === "nerve").map((m) => m.material))].map(
      (material) => ({ material, base: material.color.clone() }),
    );
    this.rayTargets = [];

    this.rig = body.rig;
    // the relaxed stance, to pose from; and which side each mesh is on, for one-sided movements
    this.rest = Object.fromEntries(RIG.map((name) => [name, body.rig[name][0].rotation.clone()]));
    for (const mesh of body.meshes) {
      let mirror = false;
      for (let o = mesh; o; o = o.parent) if (o.scale.x < 0) mirror = true;
      mesh.userData.side = mirror ? 1 : 0;
    }
    body.root.updateMatrixWorld(true);
    this.markers = buildAttachmentMarkers(body, ATTACHMENTS);
    this.equipment = buildEquipment(body, scene);
    // every finger joint, with its relaxed turn and its turn in a closed fist
    this.digits = body.rig.digit.map((group) => ({ group, rest: group.rotation.z, grip: group.userData.grip }));
    // the soles, and where they stand when relaxed: poses that move the legs are set back down on this
    this.feet = body.meshes.filter((mesh) => mesh.userData.foot);
    const standing = this._footing();
    this.ground = { y: Math.min(...standing.map((f) => f.y)), z: standing.reduce((sum, f) => sum + f.z, 0) / standing.length };

    // pedestal: a dark satin disc with a thin gold edge, catching the body's shadow
    this.props = [];
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.64, 0.05, 96),
      new THREE.MeshStandardMaterial({ color: 0x0d0e11, roughness: 0.68, metalness: 0.25 }),
    );
    disc.position.y = -0.0255;
    disc.receiveShadow = true;
    const edge = new THREE.Mesh(
      new THREE.TorusGeometry(0.6, 0.0035, 10, 160),
      new THREE.MeshStandardMaterial({ color: 0xd6b37c, emissive: 0xd6b37c, emissiveIntensity: 0.55, roughness: 0.3, metalness: 1 }),
    );
    edge.rotation.x = Math.PI / 2;
    edge.position.y = -0.001;
    this.shadowTexture = createContactShadowTexture();
    const contact = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({ map: this.shadowTexture, transparent: true, depthWrite: false, opacity: 0.55 }),
    );
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = 0.0015;
    scene.add(disc, edge, contact);
    this.props.push(disc, edge, contact);

    // thin dark lines where one muscle meets the next, on each side of the body (see outlines.js)
    this.outlines = createOutlines(renderer);
    for (const mesh of body.meshes) {
      if (mesh.userData.outline) this.outlines.add(mesh, `${mesh.userData.outline}|${mesh.userData.side}`);
    }

    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.rotateSpeed = 0.7;
    controls.zoomSpeed = 0.9;
    controls.minDistance = 1.3;
    controls.maxDistance = 8;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = Math.PI - 1.15;
    controls.target.set(0, BODY_CENTRE_Y, 0);
    controls.addEventListener("start", () => {
      this.tween = null;
    });
    this.controls = controls;
    // On touch screens a vertical swipe scrolls the page and a horizontal one turns the body.
    if (coarse) canvas.style.touchAction = "pan-y";

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.timer = new THREE.Timer();
    this.timer.connect(document);

    this.setLayer("surface");
    this._bind();
    this.resize();
    this._placeCamera(this.reducedMotion.matches ? 0 : -0.75, 82, this.fitDistance());
    if (!this.reducedMotion.matches) this.flyTo({ azimuth: 0, duration: 1500 });

    renderer.setAnimationLoop(() => this._frame());
  }

  // ------------------------------------------------------------ public API
  /** Highlight a muscle, or one head of it. focus: also turn the camera to its best side. */
  select(id, { part = null, focus = false, view } = {}) {
    this._unlight();
    this.work = null;
    this.selected = id && this.body.groups.has(id) ? { muscle: id, part } : null;
    if (focus && this.selected && view) this.flyTo(view);
  }

  /** Light a muscle (or one head) up as if the pointer were over it. Used by the lists. */
  setHover(id, part = null) {
    this.hovered = id && this.body.groups.has(id) ? { muscle: id, part } : null;
  }

  /**
   * Light up a bone, ligament, nerve, fascia or tendon by its landmark id, on both sides of the body.
   * It replaces any selected muscle. focus: also move the camera to it. azimuth: a fixed viewing angle.
   */
  selectLandmark(id, { focus = false, azimuth } = {}) {
    this._unlight();
    const meshes = id ? this.body.meshes.filter((m) => m.userData.landmark === id) : [];
    if (!meshes.length) return false;
    this.selected = null;
    this.work = null;
    this.structure = id;
    for (const mesh of meshes) {
      mesh.userData.plain = mesh.material;
      mesh.material = this._litMaterial(mesh.material);
    }
    this.lit = meshes;
    if (focus) this.flyTo(this.landmarkView(id, azimuth));
    return true;
  }

  /**
   * Exercise view: light these muscles dimly as helpers of the selected muscle.
   * Pass null to go back to showing the selected muscle alone.
   */
  setWork(helpers) {
    this.work = helpers ? new Set(helpers.filter((id) => this.body.groups.has(id))) : null;
  }

  /**
   * Put the body in a position: "rest", or one position of an exercise: "squat", "lunge",
   * "deadlift", "thrust" (hip thrust), "calf" (calf raise), "march", "pushup", "plank", "curl",
   * "press" (shoulder press), "raise" (lateral raise), "triceps" (overhead extension), "row" or "pullup".
   * frame: also move the camera so that the whole figure is in the picture in its new pose.
   */
  setPose(name, { frame = true } = {}) {
    if (!POSES[name] || name === this.pose) return false;
    this.poseFrom = {
      angles: Object.fromEntries(RIG.map((part) => [part, this.poseNow[part].map((side) => ({ ...side }))])),
      slide: this.slide,
      floor: this.floor,
      grip: this.grip,
      lift: this.lift,
      held: { ...this.held },
      z: this.rootZ,
      // Do the feet have to step? They do when either pose places the two feet differently, when
      // either pose hangs clear of the floor, or when such a change was still under way.
      steps: Boolean(
        POSES[this.pose].other ||
          POSES[name].other ||
          POSE_FRAME[this.pose].lift ||
          POSE_FRAME[name].lift ||
          (this.poseFrom?.steps && this.poseProgress < 1),
      ),
    };
    this.poseProgress = this.reducedMotion.matches ? 1 : 0;
    this.pose = name;
    if (frame) {
      // the camera stays on its side of the body, unless the pose reads badly from there
      const now = THREE.MathUtils.radToDeg(
        Math.atan2(this.camera.position.x - this.controls.target.x, this.camera.position.z - this.controls.target.z),
      );
      const headOn = Math.abs(Math.sin(THREE.MathUtils.degToRad(now))) < 0.5;
      this.flyTo({ azimuth: headOn ? this._threeQuarter(now) : now, duration: 900 });
    }
    return true;
  }

  /**
   * A camera position that frames a muscle (or one head of it) where it is in the current pose.
   * The views saved with the muscle data are for the relaxed stance; this serves every other pose.
   * A muscle whose two sides lie far apart, as on the arms, is framed on the modeled side only.
   */
  muscleView(id, part = null, azimuth = 0) {
    this._settle();
    const entries = (this.body.groups.get(id) ?? []).filter((e) => !part || e.part === part);
    const sides = [new THREE.Box3(), new THREE.Box3()];
    for (const entry of entries) {
      for (const mesh of entry.meshes) if (this._visibleIn(mesh, this.layer)) sides[mesh.userData.side].expandByObject(mesh);
    }
    const box = sides[0].clone();
    if (box.isEmpty()) box.copy(sides[1]);
    else if (!sides[1].isEmpty() && sides[0].min.x - sides[1].max.x < 0.14) box.union(sides[1]);
    if (box.isEmpty()) return { azimuth };
    const size = box.getSize(new THREE.Vector3());
    const centre = box.getCenter(new THREE.Vector3());

    const angle = this._threeQuarter(azimuth);
    const a = THREE.MathUtils.degToRad(angle);
    const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    // the muscle takes up to half the height of the picture and two thirds of its width
    const across = Math.abs(size.x * Math.cos(a)) + Math.abs(size.z * Math.sin(a));
    const forHeight = size.y / (2 * half * 0.5);
    const forWidth = across / (2 * half * this.camera.aspect * 0.66);
    const distance = THREE.MathUtils.clamp(Math.max(forHeight, forWidth), 1.7, this.fitDistance(angle));
    // When the body lies down, the muscles on the side that faces the floor are hidden from
    // above. The camera then looks from just under the horizon, which still keeps it above the pedestal.
    const side = Math.abs(wrapDegrees(azimuth)) < 90 ? "front" : "back";
    const polar = POSE_FRAME[this.pose].under === side ? 100 : 82;
    return { azimuth: angle, polar, x: centre.x, y: centre.y, z: centre.z, distance };
  }

  /**
   * Play a movement on the modeled side: "elbow", "knee", "shoulder" or "hip".
   * works: "in" if the selected muscle shortens as the joint moves away from rest, "back" if it
   * shortens on the way back. The muscle swells as it shortens.
   */
  playMotion(name, { works = "in", repeats = this.reducedMotion.matches ? 2 : 4 } = {}) {
    if (!MOTIONS[name]) return false;
    this.motion = { name, works, time: 0, repeats };
    // standing relaxed, the feet are side by side, so the weight can go onto the far foot at once
    if (this.pose === "rest" && this.poseProgress >= 1) this.oneFoot = 1;
    return true;
  }

  stopMotion() {
    this.motion = null;
  }

  /** The layers in which a structure is drawn, in the order surface, deep, skeleton. */
  layersOfLandmark(id) {
    const meshes = this.body.meshes.filter((m) => m.userData.landmark === id);
    return ["surface", "deep", "skeleton"].filter((layer) => meshes.some((mesh) => this._visibleIn(mesh, layer)));
  }

  /** The layer to switch to so that this structure can be seen. */
  layerForLandmark(id) {
    const layers = this.layersOfLandmark(id);
    if (!layers.length || layers.includes(this.layer)) return this.layer;
    // bones, ligaments and nerves read best inside the glass body
    return layers.includes("skeleton") ? "skeleton" : layers[0];
  }

  /** A camera position that frames a structure. Paired structures are framed on one side of the body. */
  landmarkView(id, azimuth) {
    this._settle();
    const layers = this.layersOfLandmark(id);
    const layer = layers.includes(this.layer) ? this.layer : (layers.includes("skeleton") ? "skeleton" : layers[0]);
    const boxes = this.body.meshes
      .filter((m) => m.userData.landmark === id && this._visibleIn(m, layer))
      .map((mesh) => new THREE.Box3().setFromObject(mesh));
    const centre = new THREE.Vector3();
    const oneSide = boxes.filter((b) => b.getCenter(centre).x > -0.02);
    const box = new THREE.Box3();
    for (const b of oneSide.length ? oneSide : boxes) box.union(b);
    if (box.isEmpty()) return { azimuth: 0 };
    const size = box.getSize(new THREE.Vector3());
    box.getCenter(centre);

    // look from the side of the body it lies on, turned a little toward its own side
    const back = centre.z < -0.012;
    const turn = centre.x > 0.07 ? 24 : 0;
    const angle = azimuth ?? (back ? 180 - turn : turn);

    // close enough to study it, far enough that it stays in frame although the camera aims at the midline
    const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    const a = THREE.MathUtils.degToRad(angle);
    const across = Math.abs(centre.x * Math.cos(a) - centre.z * Math.sin(a)) + Math.max(size.x, size.z) / 2 + 0.07;
    const forHeight = (size.y + 0.16) / (2 * half * 0.62);
    const forWidth = across / (half * this.camera.aspect * 0.86);
    const distance = THREE.MathUtils.clamp(Math.max(forHeight, forWidth), this.controls.minDistance, this.fitDistance());
    return { azimuth: angle, x: 0, y: THREE.MathUtils.clamp(centre.y, 0.16, 2), z: 0, distance };
  }

  /** Show one layer of the body: "surface", "deep" or "skeleton". */
  setLayer(layer) {
    this.layer = layer;
    const glass = layer === "skeleton";
    this.rayTargets = [];
    for (const mesh of this.body.meshes) {
      const kind = mesh.userData.layer; // undefined for the core and the graphite shell
      const visible = this._visibleIn(mesh, layer);
      mesh.visible = visible;
      const solid = !glass || kind === "skeleton" || kind === "nerve";
      mesh.castShadow = visible && solid;
      // glass muscles cannot be picked: the pointer goes through to the bones
      if (visible && solid) this.rayTargets.push(mesh);
    }
    // Opaque materials are compiled to ignore opacity, so switching to glass needs a recompile.
    const setGlass = (material, opacity) => {
      if (material.transparent !== glass) {
        material.transparent = glass;
        material.needsUpdate = true;
      }
      material.depthWrite = !glass;
      material.opacity = glass ? opacity : 1;
    };
    this.backdrop.forEach(({ material }, i) => setGlass(material, i === 1 ? 0.16 : 0.07)); // index 1 is the graphite shell
    for (const { material } of this.body.parts.values()) setGlass(material, 0.15);
    this.landmark = null;
  }

  /** Is this muscle (or this head of it) drawn in the given layer? */
  isShown(id, part = null, layer = this.layer) {
    const entries = (this.body.groups.get(id) ?? []).filter((e) => !part || e.part === part);
    return entries.some((e) => e.meshes.some((mesh) => this._visibleIn(mesh, layer)));
  }

  /** The layer to switch to so that this muscle (or head) can be seen. */
  layerFor(id, part = null) {
    if (this.isShown(id, part)) return this.layer;
    return this.isShown(id, part, "surface") ? "surface" : "deep";
  }

  /**
   * azimuth/polar in degrees (0 = front, 180 = back). x, y, z = the point to look at, which is
   * the middle of the figure in its current pose unless given. distance: the whole figure fits by default.
   */
  flyTo({ azimuth, polar = 82, distance, x = 0, y, z, duration = 800 } = {}) {
    const frame = POSE_FRAME[this.pose];
    const from = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    const to = from.clone();
    if (azimuth !== undefined) {
      let target = THREE.MathUtils.degToRad(azimuth);
      // take the short way round
      target = from.theta + (((((target - from.theta) % (2 * Math.PI)) + 3 * Math.PI) % (2 * Math.PI)) - Math.PI);
      to.theta = target;
    }
    to.phi = THREE.MathUtils.degToRad(polar);
    to.radius = distance ?? this.fitDistance(azimuth);
    const targetFrom = this.controls.target.clone();
    const targetTo = new THREE.Vector3(x, y ?? frame.y, z ?? frame.z);
    if (this.reducedMotion.matches || duration === 0) {
      this.controls.target.copy(targetTo);
      this.camera.position.setFromSpherical(to).add(targetTo);
      this.controls.update();
      this.tween = null;
      return;
    }
    this.tween = { from, to, targetFrom, targetTo, t: 0, duration: duration / 1000 };
  }

  resetView() {
    this.flyTo({ azimuth: 0 });
  }

  zoom(factor) {
    const offset = this.camera.position.clone().sub(this.controls.target);
    const radius = THREE.MathUtils.clamp(offset.length() * factor, this.controls.minDistance, this.controls.maxDistance);
    const s = new THREE.Spherical().setFromVector3(offset);
    this.flyTo({
      azimuth: THREE.MathUtils.radToDeg(s.theta),
      polar: THREE.MathUtils.radToDeg(s.phi),
      distance: radius,
      x: this.controls.target.x,
      y: this.controls.target.y,
      z: this.controls.target.z,
      duration: 250,
    });
  }

  rotate(deltaDegrees) {
    const s = new THREE.Spherical().setFromVector3(this.camera.position.clone().sub(this.controls.target));
    this.flyTo({
      azimuth: THREE.MathUtils.radToDeg(s.theta) + deltaDegrees,
      polar: THREE.MathUtils.radToDeg(s.phi),
      distance: s.radius,
      x: this.controls.target.x,
      y: this.controls.target.y,
      z: this.controls.target.z,
      duration: 250,
    });
  }

  /**
   * Distance at which the whole figure, in its current pose, fits the canvas.
   * azimuth: the angle it will be seen from, in degrees. The camera's own angle by default.
   */
  fitDistance(azimuth) {
    const half = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    // the view is lifted to clear the controls, so the usable height is a little smaller
    const h = this.canvas.clientHeight || 1;
    const frame = POSE_FRAME[this.pose];
    const a =
      azimuth === undefined
        ? Math.atan2(this.camera.position.x - this.controls.target.x, this.camera.position.z - this.controls.target.z)
        : THREE.MathUtils.degToRad(azimuth);
    // the figure is wider from one side than from the other in some poses
    const across = Math.hypot(frame.wx * Math.cos(a), frame.wz * Math.sin(a));
    const forHeight = (frame.h / half) * (h / Math.max(1, h - 2 * this.lift));
    const forWidth = across / (half * this.camera.aspect);
    return Math.max(forHeight, forWidth) * 1.05;
  }

  resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    // shift the picture up so the feet and pedestal sit above the view controls
    this.lift = Math.min(36, h * 0.05);
    this.camera.setViewOffset(w, h, 0, this.lift, w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this._unbind();
    this.controls.dispose();
    this.timer.dispose();
    this._unlight();
    this.markers.dispose();
    this.equipment.dispose();
    this.outlines.dispose();
    for (const material of this.litMaterials.values()) material.dispose();
    this.body.dispose();
    for (const mesh of this.props) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    this.shadowTexture.dispose();
    this.environment.dispose();
    this.renderer.dispose();
  }

  // ------------------------------------------------------------ internals
  /** Is this mesh drawn in the given layer? */
  _visibleIn(mesh, layer) {
    const kind = mesh.userData.layer; // undefined for the core and the graphite shell
    if (kind === "skeleton") return layer === "skeleton";
    if (kind === "backdrop") return layer !== "skeleton"; // the graphite bones between the muscles
    if (kind === "nerve") return layer !== "surface";
    if (kind === "deep") return layer === "deep";
    if (kind === "surface") return layer === "skeleton" ? !mesh.userData.landmark : !(layer === "deep" && mesh.userData.cover);
    return true;
  }

  /** Move the limbs toward the chosen pose and, on top of that, play the movement on the modeled side. */
  _applyRig(dt) {
    const pose = POSES[this.pose];
    const frame = POSE_FRAME[this.pose];
    let swing = 0;
    const motion = this.motion;
    if (motion) {
      motion.time += dt;
      const turns = motion.time / MOTION_PERIOD;
      if (turns >= motion.repeats) {
        this.motion = null;
        this.callbacks.onMotionEnd?.();
      } else swing = 0.5 - 0.5 * Math.cos(turns * Math.PI * 2);
    }
    this.contraction = this.motion ? (this.motion.works === "in" ? swing : 1 - swing) : null;
    // The change of pose eases in and out. Everything moves on the same clock, from where the
    // body was when the pose was picked to where the pose puts it.
    const from = this.poseFrom;
    if (this.poseProgress < 1) this.poseProgress = Math.min(1, this.poseProgress + dt / POSE_TIME);
    const k = from ? easeInOut(this.poseProgress) : 1;
    const between = (start, end) => (k >= 1 ? end : THREE.MathUtils.lerp(start, end, k));
    for (const name of RIG) {
      this.poseNow[name].forEach((now, side) => {
        for (const axis of AXES) now[axis] = between(from?.angles[name][side][axis], poseAngle(pose, name, side, axis));
      });
    }
    this.slide = between(from?.slide, frame.slide ?? 0);
    this.floor = between(from?.floor, frame.floor ?? 1);
    this.grip = between(from?.grip, frame.grip ?? 0);
    this.lift = between(from?.lift, frame.lift ?? 0);
    for (const kind of EQUIPMENT) this.held[kind] = between(from?.held[kind], frame.hold === kind ? 1 : 0);
    // a movement on the near side puts the weight on the far foot, a little slower than the limbs move
    const moving = this.motion ? 1 : 0;
    this.oneFoot =
      Math.abs(this.oneFoot - moving) < 0.0005 ? moving : THREE.MathUtils.damp(this.oneFoot, moving, this.reducedMotion.matches ? 1000 : 3, dt);
    // While the pose is still changing, the feet may be far apart, and shifting onto the far foot
    // for a movement would drag the body across the floor. So that shift waits for the pose (k).
    const stance = Math.max(frame.oneLeg ? 1 : 0, this.oneFoot * k);
    // Normally the body is placed over its feet at every frame, which keeps them still on the
    // floor. When the feet have to step, following them would carry the body there and back
    // again. Then it glides straight to where the new pose stands, and the feet do the moving.
    const glide = from?.steps && k < 1 ? THREE.MathUtils.lerp(from.z, this._standingZ(this.pose), k) : undefined;
    // the bar and the bench stand where the settled pose needs them, from the start of the change
    if (frame.hold === "bar" || frame.hold === "bench") this.propAt[frame.hold] = this._propPlace(this.pose);
    this._setRig((name, side, axis) => this.poseNow[name][side][axis], swing, { slide: this.slide, stance, z: glide, lift: this.lift });
    this.rootZ = this.body.root.position.z;
    for (const digit of this.digits) digit.group.rotation.z = THREE.MathUtils.lerp(digit.rest, digit.grip, this.grip);
    this.equipment.show(this.held, this.propAt);

    // the pedestal grows with the poses that need more floor
    const [disc, edge, contact] = this.props;
    disc.scale.set(this.floor, 1, this.floor);
    edge.scale.set(this.floor, this.floor, 1);
    contact.scale.set(1, this.floor, 1);
  }

  /**
   * Turn every joint to its angle, play the movement on top of that on the modeled side, and
   * set the body back on the floor.
   * angle(name, side, axis): what is added to the relaxed stance for that segment.
   * place: where the body goes afterwards, see _plantFeet.
   */
  _setRig(angle, swing = 0, place = {}) {
    let legsMoved = false;
    for (const name of RIG) {
      const rest = this.rest[name];
      this.rig[name].forEach((group, side) => {
        for (const axis of AXES) {
          let turned = rest[axis] + angle(name, side, axis);
          if (this.motion && side === 0) {
            for (const [limb, around, far] of MOTIONS[this.motion.name]) {
              if (limb === name && around === axis) turned = THREE.MathUtils.lerp(turned, far, swing);
            }
          }
          group.rotation[axis] = turned;
          if (LEGS.includes(name) && Math.abs(turned - rest[axis]) > 0.0001) legsMoved = true;
        }
      });
    }
    this._plantFeet(legsMoved, place);
  }

  /** Where each foot is: the height of the lowest point of its sole, and how far forward its ankle is. */
  _footing() {
    return this.feet.map((foot) => {
      const e = foot.matrixWorld.elements;
      const position = foot.geometry.attributes.position;
      let y = Infinity;
      for (let i = 0; i < position.count; i++) {
        const height = e[1] * position.getX(i) + e[5] * position.getY(i) + e[9] * position.getZ(i) + e[13];
        if (height < y) y = height;
      }
      return { y, z: foot.parent.matrixWorld.elements[14] };
    });
  }

  /**
   * Keep the body standing on the floor. Turning the joints of the legs or leaning the body
   * would leave the feet in the air or under the floor, so the whole body is shifted until the
   * lower foot is back at floor height. Front to back, the body is placed so that what it stands
   * on is where the feet are when relaxed: the point midway between the ankles, or the far ankle
   * alone when the body stands on one leg (stance: 0 for both feet, 1 for the far foot).
   * While a movement plays, the near foot may dip under the floor for a moment; the body does
   * not bob to follow it.
   *   slide   how far the body is moved forward afterwards
   *   stance  0 if the body stands on both feet, 1 if on the far foot alone
   *   z       a fixed place front to back, used in place of the feet while they are stepping
   *   lift    how high the feet hang above the floor, for a pose that hangs from a bar
   */
  _plantFeet(legsMoved, { slide = 0, stance = 0, z = undefined, lift = 0 } = {}) {
    const root = this.body.root;
    root.position.set(0, lift, z ?? slide);
    if (!legsMoved) return;
    root.position.set(0, 0, 0);
    root.updateMatrixWorld(true);
    const [near, far] = this._footing();
    const y = THREE.MathUtils.lerp(Math.min(near.y, far.y), far.y, this.oneFoot);
    // a body that hangs is not standing on anything: it stays over the middle of the pedestal
    const feet = lift ? this.ground.z : THREE.MathUtils.lerp((near.z + far.z) / 2, far.z, stance);
    root.position.set(0, this.ground.y - y + lift, z ?? this.ground.z - feet + slide);
  }

  /**
   * Where the bar or the bench of a pose has to be: the bar in the hands, the bench under the
   * shoulder blades. Worked out once for each pose, from the pose as it stands when settled.
   */
  _propPlace(name) {
    if (!this.propPlaces[name]) {
      const now = this.pose;
      this.pose = name;
      this._settle();
      this.pose = now;
      if (POSE_FRAME[name].hold === "bar") {
        const hands = this.rig.hand[0].localToWorld(new THREE.Vector3(...(this.body.gripPoint ?? GRIP_POINT)));
        this.propPlaces[name] = { y: hands.y, z: hands.z };
      } else {
        const back = this.rig.centre[0].localToWorld(new THREE.Vector3(...(this.body.benchRest ?? BENCH_REST)));
        this.propPlaces[name] = { top: back.y, z: back.z };
      }
    }
    return this.propPlaces[name];
  }

  /** How far forward the body stands in a pose once it has settled. Worked out once for each pose. */
  _standingZ(name) {
    if (!(name in this.standingZ)) {
      const now = this.pose;
      this.pose = name;
      this._settle();
      this.standingZ[name] = this.body.root.position.z;
      this.pose = now;
    }
    return this.standingZ[name];
  }

  /**
   * Put the body in the pose it is heading for at once, so that it can be measured before the
   * limbs have got there. The next frame puts it back on its way.
   */
  _settle() {
    const pose = POSES[this.pose];
    const frame = POSE_FRAME[this.pose];
    this._setRig((name, side, axis) => poseAngle(pose, name, side, axis), 0, {
      slide: frame.slide ?? 0,
      stance: frame.oneLeg ? 1 : 0,
      lift: frame.lift ?? 0,
    });
    this.body.root.updateMatrixWorld(true);
  }

  /**
   * A pose that is bent forward hides itself from straight ahead and from straight behind.
   * Returns the three-quarter view nearest to the given angle, or the angle itself for other poses.
   */
  _threeQuarter(azimuth) {
    const turn = POSE_FRAME[this.pose].turn;
    if (turn === undefined) return azimuth;
    const off = (candidate) => Math.abs(wrapDegrees(candidate - azimuth));
    return [turn, -turn, 180 - turn, turn - 180].reduce((best, candidate) => (off(candidate) < off(best) ? candidate : best));
  }

  /** Show the attachment dots of the selected muscle, in the Skeleton layer only. */
  _syncMarkers() {
    const want = this.layer === "skeleton" && this.selected ? this.selected.muscle : null;
    if (want === this.markersFor) return;
    for (const sprite of this.markers.byMuscle.get(this.markersFor) ?? []) sprite.visible = false;
    for (const sprite of this.markers.byMuscle.get(want) ?? []) sprite.visible = true;
    this.markersFor = want;
  }

  /** The gold-lit twin of a material, made once and shared. */
  _litMaterial(material) {
    let lit = this.litMaterials.get(material);
    if (!lit) {
      lit = material.clone();
      // the plain material may be faded back at this moment: start from its true color
      const base = [...this.backdrop, ...this.inner].find((entry) => entry.material === material)?.base;
      if (base) lit.color.copy(base);
      lit.color.lerp(GOLD, 0.6);
      lit.emissive = GOLD.clone();
      lit.emissiveIntensity = 0.6;
      lit.transparent = false;
      lit.opacity = 1;
      lit.depthWrite = true;
      this.litMaterials.set(material, lit);
    }
    return lit;
  }

  /** Give the studied structure its plain materials back. */
  _unlight() {
    for (const mesh of this.lit) {
      mesh.material = mesh.userData.plain;
      delete mesh.userData.plain;
    }
    this.lit = [];
    this.structure = null;
  }

  _placeCamera(azimuth, polarDeg, distance) {
    const s = new THREE.Spherical(distance, THREE.MathUtils.degToRad(polarDeg), azimuth);
    this.camera.position.setFromSpherical(s).add(this.controls.target);
    this.controls.update();
  }

  _bind() {
    const canvas = this.canvas;
    let down = null;
    const same = (a, b) => (a?.muscle ?? null) === (b?.muscle ?? null) && (a?.part ?? null) === (b?.part ?? null);

    this._onPointerDown = (e) => {
      down = { x: e.clientX, y: e.clientY, time: performance.now() };
    };
    this._onPointerUp = (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.time < 600;
      down = null;
      if (moved > 6 || !quick) return;
      const hit = this._pick(e);
      if (hit) {
        this.selected = hit;
        this.callbacks.onSelect?.(hit.muscle, hit.part);
      } else if (this.landmark) this.callbacks.onLandmark?.(this.landmark, e.clientX, e.clientY);
    };
    this._onPointerMove = (e) => {
      if (e.pointerType !== "mouse" || e.buttons !== 0) return;
      const hit = this._pick(e);
      if (!same(hit, this.hovered)) {
        this.hovered = hit;
        canvas.classList.toggle("is-over-muscle", Boolean(hit));
      }
      canvas.classList.toggle("is-over-landmark", !hit && Boolean(this.landmark));
      this.callbacks.onHover?.(hit?.muscle ?? null, e.clientX, e.clientY, hit ? null : this.landmark, hit?.part ?? null);
    };
    this._onPointerLeave = () => {
      this.hovered = null;
      canvas.classList.remove("is-over-muscle", "is-over-landmark");
      this.callbacks.onHover?.(null, 0, 0, null, null);
    };
    this._onKeyDown = (e) => {
      if (e.key === "ArrowLeft") this.rotate(-20);
      else if (e.key === "ArrowRight") this.rotate(20);
      else if (e.key === "+" || e.key === "=") this.zoom(0.85);
      else if (e.key === "-") this.zoom(1.18);
      else return;
      e.preventDefault();
    };
    // Plain wheel scrolls the page; ctrl/cmd + wheel (and trackpad pinch) zooms the model.
    this._onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) e.stopPropagation();
    };

    canvas.addEventListener("pointerdown", this._onPointerDown);
    canvas.addEventListener("pointerup", this._onPointerUp);
    canvas.addEventListener("pointermove", this._onPointerMove);
    canvas.addEventListener("pointerleave", this._onPointerLeave);
    canvas.addEventListener("keydown", this._onKeyDown);
    canvas.parentElement.addEventListener("wheel", this._onWheel, { capture: true });

    this._resizeObserver = new ResizeObserver(() => this.resize());
    this._resizeObserver.observe(canvas);
    this._intersection = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
    });
    this._intersection.observe(canvas);
  }

  _unbind() {
    const canvas = this.canvas;
    canvas.removeEventListener("pointerdown", this._onPointerDown);
    canvas.removeEventListener("pointerup", this._onPointerUp);
    canvas.removeEventListener("pointermove", this._onPointerMove);
    canvas.removeEventListener("pointerleave", this._onPointerLeave);
    canvas.removeEventListener("keydown", this._onKeyDown);
    canvas.parentElement?.removeEventListener("wheel", this._onWheel, { capture: true });
    this._resizeObserver.disconnect();
    this._intersection.disconnect();
  }

  /** The muscle under the pointer as { muscle, part }, or null. Also remembers this.landmark. */
  _pick(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.pointer, this.camera);
    // non-muscle meshes are in the list so they block muscles that sit behind them
    const data = this.raycaster.intersectObjects(this.rayTargets, false)[0]?.object.userData;
    this.landmark = data?.landmark ?? null;
    return data?.muscle ? { muscle: data.muscle, part: data.part } : null;
  }

  _frame() {
    this.timer.update();
    if (!this.visible) return;
    const dt = Math.min(this.timer.getDelta(), 0.1);
    const elapsed = this.timer.getElapsed();

    if (this.tween) {
      const tw = this.tween;
      tw.t = Math.min(1, tw.t + dt / tw.duration);
      const k = easeInOut(tw.t);
      const s = new THREE.Spherical(
        THREE.MathUtils.lerp(tw.from.radius, tw.to.radius, k),
        THREE.MathUtils.lerp(tw.from.phi, tw.to.phi, k),
        THREE.MathUtils.lerp(tw.from.theta, tw.to.theta, k),
      );
      this.controls.target.lerpVectors(tw.targetFrom, tw.targetTo, k);
      this.camera.position.setFromSpherical(s).add(this.controls.target);
      if (tw.t >= 1) this.tween = null;
    }
    this.controls.update(dt);
    this._applyRig(dt);
    this._syncMarkers();

    // keep the light rig pointed at whatever the camera orbits
    const distance = this.camera.position.distanceTo(this.controls.target);
    this.aim.position.set(0, 0, -distance);
    this.rims[0].position.set(-2.3, 1.5, -distance - 2.6);
    this.rims[1].position.set(2.3, 0.9, -distance - 2.6);

    const side = this.camera.position.z - this.controls.target.z >= 0 ? "front" : "back";
    if (side !== this.side) {
      this.side = side;
      this.callbacks.onSideChange?.(side);
    }

    const still = this.reducedMotion.matches;
    const lambda = still ? 1000 : 9;
    const pulse = still ? 0.5 : 0.5 + 0.5 * Math.sin(elapsed * 3.2);
    const glass = this.layer === "skeleton";
    const share = (pick, entry) => {
      if (!pick || pick.muscle !== entry.muscle) return 0;
      return !pick.part || pick.part === entry.part ? 1 : SIBLING;
    };
    for (const entry of this.body.parts.values()) {
      const st = this.state.get(entry.key);
      const glow = Math.max(share(this.selected, entry), this.work?.has(entry.muscle) ? HELPER : 0);
      const hover = glow >= 1 ? 0 : share(this.hovered, entry);
      const dim = (this.selected || this.structure) && glow === 0 && hover === 0 ? 1 : 0;
      st.glow = THREE.MathUtils.damp(st.glow, glow, lambda, dt);
      st.hover = THREE.MathUtils.damp(st.hover, hover, lambda * 1.6, dt);
      st.dim = THREE.MathUtils.damp(st.dim, dim, lambda, dt);

      const { material, meshes } = entry;
      material.color.copy(WHITE).lerp(DIM, st.dim).lerp(SELECTED_BASE, st.glow);
      material.emissive.copy(HOVER).lerp(GOLD, st.glow);
      material.emissiveIntensity = st.hover * 0.2 * (1 - st.glow) + st.glow * (0.5 + 0.16 * pulse);
      // as glass, a muscle is barely there unless it is the one being studied
      if (glass) material.opacity = Math.min(1, 0.15 + 0.6 * st.glow + 0.25 * st.hover);

      // The selected muscle swells a little on each pulse, like a contraction. While a movement
      // plays, it swells with the movement instead: thickest when it is shortest.
      const working = this.contraction !== null && this.selected?.muscle === entry.muscle;
      const swell = 1 + st.glow * 0.045 * pulse;
      const bulge = 1 + st.glow * 0.17 * (this.contraction ?? 0);
      for (const mesh of meshes) {
        if (mesh.userData.kind === "real") {
          // the real shapes thicken along their normals, most in the belly (see realbody.js)
          const amount = working && mesh.userData.side === 0 && mesh.userData.limb ? (bulge - 1) * 0.045 : working ? 0 : (swell - 1) * 0.035;
          mesh.userData.swell = Math.round(amount * 1e5) / 1e5;
          continue;
        }
        const b = mesh.userData.baseScale;
        if (working && mesh.userData.side === 0 && LIMBS.includes(mesh.parent.name)) mesh.scale.set(b.x * bulge, b.y, b.z * bulge);
        else if (working) mesh.scale.copy(b);
        else if (mesh.userData.kind === "belly") mesh.scale.set(b.x * swell, b.y, b.z * swell);
        else mesh.scale.setScalar(1 + (swell - 1) * 0.35);
      }
    }

    this.backdropDim = THREE.MathUtils.damp(this.backdropDim, this.selected || this.structure ? 1 : 0, lambda, dt);
    for (const { material, base } of this.backdrop) {
      material.color.copy(base).multiplyScalar(1 - 0.4 * this.backdropDim);
    }

    // the studied structure pulses in gold while the rest of the skeleton steps back
    this.structureDim = THREE.MathUtils.damp(this.structureDim, this.structure ? 1 : 0, lambda, dt);
    for (const { material, base } of this.inner) {
      material.color.copy(base).multiplyScalar(1 - 0.5 * this.structureDim);
    }
    for (const material of this.litMaterials.values()) material.emissiveIntensity = 0.62 + 0.3 * pulse;

    // the real figure bends its muscles, nerves and vessels to the pose
    this.body.update?.();
    this.renderer.render(this.scene, this.camera);
    // in the Skeleton layer the muscles are glass, and lines would cross the bones
    if (this.layer !== "skeleton") this.outlines.render(this.scene, this.camera);
  }
}
