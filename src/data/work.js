/*
 * What the model needs to show muscles at work.
 *
 * HELPERS   for each exercise, by name: the muscles that assist the main one. In the exercise
 *           view the main muscle is lit bright and these are lit dim. An exercise that is
 *           missing here falls back to the main muscle's usual partners.
 * VESSEL    for each muscle: the artery on the model that its blood supply comes from.
 * MOTIONS   the movements the model can play, by joint.
 * DEMOS     for each muscle that has one: which movement shows it working, and in which half.
 */

export const HELPERS = {
  // chest
  "Machine chest press": ["shoulders", "triceps"],
  "Incline push-up": ["shoulders", "triceps", "serratus", "abs"],
  "Dumbbell bench press": ["shoulders", "triceps", "serratus"],
  // shoulders
  "Seated dumbbell shoulder press": ["triceps", "traps", "serratus"],
  "Dumbbell lateral raise": ["traps", "rotator-cuff"],
  "Reverse fly machine": ["rhomboids", "traps", "rotator-cuff"],
  // biceps
  "Dumbbell curl": ["forearms"],
  "Hammer curl": ["forearms"],
  "Underhand lat pulldown": ["lats", "forearms", "rhomboids"],
  // triceps
  "Cable pushdown": ["forearms"],
  "Close-grip incline push-up": ["chest", "shoulders", "abs"],
  "Overhead dumbbell extension": ["shoulders"],
  // forearms
  "Farmer's carry": ["traps", "obliques", "deep-core"],
  "Dead hang": ["lats", "traps"],
  "Wrist curl": [],
  // traps
  "Chest-supported row": ["lats", "rhomboids", "biceps"],
  "Dumbbell shrug": ["forearms"],
  "Prone Y raise": ["shoulders", "rhomboids", "rotator-cuff"],
  // lats
  "Lat pulldown": ["biceps", "rhomboids", "forearms"],
  "Seated cable row": ["rhomboids", "traps", "biceps"],
  "Assisted pull-up": ["biceps", "forearms", "traps"],
  // rotator cuff
  "Band external rotation": ["shoulders"],
  "Face pull": ["shoulders", "traps", "rhomboids"],
  "Side-lying external rotation": ["shoulders"],
  // serratus
  "Push-up plus": ["chest", "triceps", "abs"],
  "Wall slide": ["traps", "shoulders"],
  "Single-arm cable press": ["chest", "triceps", "obliques"],
  // abs
  "Dead bug": ["deep-core", "hip-flexors"],
  "Front plank": ["deep-core", "obliques", "shoulders"],
  Crunch: ["obliques"],
  // obliques
  "Side plank": ["deep-core", "hip-abductors", "shoulders"],
  "Pallof press": ["deep-core", "abs"],
  "Suitcase carry": ["forearms", "traps", "deep-core"],
  // lower back
  "Bird dog": ["glutes", "deep-core", "shoulders"],
  "Back extension": ["glutes", "hamstrings"],
  "Kettlebell deadlift": ["glutes", "hamstrings", "forearms", "traps"],
  // glutes
  "Glute bridge": ["hamstrings", "deep-core"],
  "Reverse lunge": ["quads", "hamstrings", "hip-abductors"],
  "Hip thrust": ["hamstrings", "quads"],
  // outer hips
  "Side-lying leg raise": ["obliques"],
  "Banded lateral walk": ["glutes", "quads"],
  "Hip abduction machine": ["glutes"],
  // hip flexors
  "Standing march": ["abs", "quads"],
  "Lying leg raise": ["abs", "quads"],
  "Hanging knee raise": ["abs", "forearms"],
  // quads
  "Leg press": ["glutes", "adductors"],
  "Goblet squat": ["glutes", "adductors", "abs"],
  "Leg extension": [],
  // hamstrings
  "Seated leg curl": ["calves"],
  "Dumbbell Romanian deadlift": ["glutes", "lower-back", "forearms"],
  "Single-leg Romanian deadlift": ["glutes", "lower-back", "hip-abductors"],
  // inner thighs
  "Hip adduction machine": [],
  "Lateral lunge": ["quads", "glutes"],
  "Copenhagen plank": ["obliques", "deep-core"],
  // calves
  "Standing calf raise": ["peroneals"],
  "Seated calf raise": [],
  "Single-leg calf raise": ["peroneals"],
  // shins
  "Wall tibialis raise": [],
  "Heel walk": [],
  "Banded dorsiflexion": [],
  // neck
  "Chin tuck": [],
  "Isometric neck hold": ["traps"],
  "Lying head lift": [],
  // rhomboids
  "Band pull-apart": ["traps", "shoulders", "rotator-cuff"],
  "Dumbbell row": ["lats", "traps", "biceps"],
  "Prone T raise": ["traps", "shoulders"],
  // deep core
  "Braced breathing": ["abs", "obliques"],
  "Heel slide": ["abs", "hip-flexors"],
  "Bear hold": ["abs", "shoulders", "quads"],
  // deep hip rotators
  Clamshell: ["hip-abductors", "glutes"],
  "Fire hydrant": ["hip-abductors", "glutes", "deep-core"],
  "Monster walk": ["hip-abductors", "glutes", "quads"],
  // outer shin
  "Single-leg balance": ["calves", "shins", "hip-abductors"],
  "Banded eversion": [],
  "Side-to-side line hop": ["calves", "quads", "glutes"],
};

export const VESSEL = {
  chest: "subclavian-artery",
  shoulders: "subclavian-artery",
  biceps: "brachial-artery",
  triceps: "brachial-artery",
  forearms: "forearm-arteries",
  traps: "subclavian-artery",
  lats: "subclavian-artery",
  "rotator-cuff": "subclavian-artery",
  serratus: "subclavian-artery",
  neck: "carotid-artery",
  rhomboids: "subclavian-artery",
  abs: "iliac-artery",
  obliques: "aorta",
  "lower-back": "aorta",
  "deep-core": "aorta",
  glutes: "iliac-artery",
  "hip-abductors": "iliac-artery",
  piriformis: "iliac-artery",
  "hip-flexors": "femoral-artery",
  quads: "femoral-artery",
  hamstrings: "femoral-artery",
  adductors: "femoral-artery",
  calves: "popliteal-artery",
  shins: "tibial-arteries",
  peroneals: "tibial-arteries",
};

/**
 * label   names the movement on its button
 * view    where the camera goes to watch it: angle in degrees, height, and zoom (1 = whole body)
 */
export const MOTIONS = {
  elbow: { label: "bend the elbow", view: { azimuth: 68, y: 1.2, zoom: 0.62 } },
  knee: { label: "bend the knee", view: { azimuth: 78, y: 0.62, zoom: 0.7 } },
  shoulder: { label: "raise the arm", view: { azimuth: 8, y: 1.38, zoom: 0.78 } },
  hip: { label: "lift the knee", view: { azimuth: 72, y: 0.8, zoom: 0.74 } },
};

/**
 * works "in": the muscle shortens and swells as the joint moves away from rest.
 * works "back": it does its work on the way back, so it is thickest at the start position.
 */
export const DEMOS = {
  biceps: { motion: "elbow", works: "in", say: "The biceps shortens and thickens as the elbow bends." },
  triceps: { motion: "elbow", works: "back", say: "The triceps tightens as the elbow straightens, and lengthens as it bends." },
  quads: { motion: "knee", works: "back", say: "The quads tighten as the knee straightens, and lengthen as it bends." },
  hamstrings: { motion: "knee", works: "in", say: "The hamstrings shorten and thicken as the knee bends." },
  shoulders: { motion: "shoulder", works: "in", say: "The shoulder muscle lifts the arm away from the side." },
  lats: { motion: "shoulder", works: "back", say: "The lats pull the raised arm back down to the side." },
  "hip-flexors": { motion: "hip", works: "in", say: "The hip flexors lift the thigh toward the chest." },
  glutes: { motion: "hip", works: "back", say: "The glutes drive the lifted thigh back down and behind you." },
};
