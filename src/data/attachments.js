/*
 * Where each muscle attaches to the skeleton, for the dots shown in the Skeleton layer.
 *
 * from   where the muscle anchors (its origin): the end that stays put
 * to     where it pulls (its insertion): the end that moves
 *
 * Each point is [bone, u, v, w]. The bone is a landmark id. u, v and w place the point inside
 * the box around that bone, on the modeled side of the body, with the body standing relaxed:
 *   u  0 = the edge nearest the midline, 1 = the outer edge
 *   v  0 = bottom, 1 = top
 *   w  0 = back, 1 = front
 * The viewer snaps each point to the nearest spot on the bone's surface, so these only need to
 * be roughly right. One muscle group often has several anchors; the main ones are listed.
 */
export const ATTACHMENTS = {
  chest: {
    from: [["collarbone", 0.3, 0.5, 1], ["breastbone", 1, 0.85, 1], ["breastbone", 1, 0.25, 1], ["ribs", 0.3, 0.6, 1]],
    to: [["humerus", 0.4, 0.8, 1]],
  },
  shoulders: {
    from: [["collarbone", 0.85, 0.5, 1], ["scapula", 1, 1, 0.7], ["scapula", 0.5, 0.86, 0]],
    to: [["humerus", 1, 0.55, 0.5]],
  },
  biceps: {
    from: [["scapula", 1, 0.95, 1], ["humerus", 0.5, 0.4, 1]],
    to: [["forearm-bones", 0.6, 0.92, 1], ["forearm-bones", 0.4, 0.94, 0.3]],
  },
  triceps: {
    from: [["scapula", 1, 0.78, 0.3], ["humerus", 0.7, 0.62, 0], ["humerus", 0.3, 0.3, 0]],
    to: [["forearm-bones", 0.5, 1, 0]],
  },
  forearms: {
    from: [["humerus", 0, 0.02, 0.5], ["humerus", 1, 0.06, 0.5]],
    to: [["hand-bones", 0.5, 0.92, 1], ["hand-bones", 0.5, 0.92, 0], ["forearm-bones", 0.9, 0.05, 1]],
  },
  traps: {
    from: [["skull", 0.15, 0.22, 0], ["vertebrae", 0, 0.9, 0], ["vertebrae", 0, 0.66, 0], ["vertebrae", 0, 0.42, 0]],
    to: [["collarbone", 0.9, 0.5, 0], ["scapula", 1, 1, 0.5], ["scapula", 0.4, 0.86, 0]],
  },
  lats: {
    from: [["vertebrae", 0, 0.4, 0], ["vertebrae", 0, 0.14, 0], ["pelvis", 0.4, 0.95, 0], ["ribs", 0.9, 0.12, 0.2]],
    to: [["humerus", 0.25, 0.82, 1]],
  },
  "rotator-cuff": {
    from: [["scapula", 0.3, 0.97, 0.2], ["scapula", 0.3, 0.55, 0], ["scapula", 0.75, 0.5, 0]],
    to: [["humerus", 0.7, 1, 0.5], ["humerus", 0.8, 0.94, 0]],
  },
  serratus: {
    from: [["ribs", 0.95, 0.74, 0.75], ["ribs", 1, 0.58, 0.65], ["ribs", 1, 0.42, 0.6]],
    to: [["scapula", 0, 0.6, 0.4], ["scapula", 0.1, 0.1, 0.3]],
  },
  abs: {
    from: [["pelvis", 0.06, 0.2, 1]],
    to: [["ribs", 0.25, 0.42, 1], ["breastbone", 0.5, 0, 1]],
  },
  obliques: {
    from: [["ribs", 0.95, 0.32, 0.7], ["ribs", 0.9, 0.16, 0.45]],
    to: [["pelvis", 0.85, 0.95, 0.8], ["pelvis", 0.06, 0.24, 1]],
  },
  "lower-back": {
    from: [["pelvis", 0.08, 0.55, 0], ["pelvis", 0.4, 0.92, 0]],
    to: [["ribs", 0.2, 0.5, 0], ["vertebrae", 1, 0.3, 0], ["vertebrae", 1, 0.7, 0]],
  },
  glutes: {
    from: [["pelvis", 0.4, 0.86, 0], ["pelvis", 0.06, 0.5, 0]],
    to: [["femur", 0.8, 0.8, 0], ["shin", 1, 0.97, 0.7]],
  },
  "hip-abductors": {
    from: [["pelvis", 0.9, 0.9, 0.4], ["pelvis", 0.85, 0.94, 0.9]],
    to: [["femur", 1, 0.93, 0.5]],
  },
  "hip-flexors": {
    from: [["vertebrae", 1, 0.16, 1], ["pelvis", 0.55, 0.8, 0.75], ["pelvis", 0.78, 0.9, 1]],
    to: [["femur", 0, 0.86, 0.3], ["shin", 0, 0.93, 0.8]],
  },
  quads: {
    from: [["pelvis", 0.7, 0.68, 1], ["femur", 0.5, 0.75, 1], ["femur", 1, 0.72, 0.5]],
    to: [["kneecap", 0.5, 0.9, 0.5], ["shin", 0.45, 0.9, 1]],
  },
  hamstrings: {
    from: [["pelvis", 0.4, 0, 0.2], ["femur", 0.6, 0.45, 0]],
    to: [["shin", 0, 0.93, 0.2], ["fibula", 0.5, 1, 0.5]],
  },
  adductors: {
    from: [["pelvis", 0.08, 0.16, 0.95], ["pelvis", 0.3, 0.02, 0.6]],
    to: [["femur", 0.3, 0.5, 0], ["femur", 0, 0.04, 0.5]],
  },
  calves: {
    from: [["femur", 0.15, 0.03, 0], ["femur", 0.9, 0.03, 0], ["shin", 0.5, 0.8, 0], ["fibula", 0.5, 0.85, 0]],
    to: [["foot-bones", 0.4, 0.35, 0]],
  },
  shins: {
    from: [["shin", 1, 0.8, 0.8]],
    to: [["foot-bones", 0.15, 0.5, 0.6]],
  },
  neck: {
    from: [["breastbone", 0.6, 1, 1], ["collarbone", 0.2, 0.6, 1]],
    to: [["skull", 0.9, 0.3, 0.3]],
  },
  rhomboids: {
    from: [["vertebrae", 0, 0.8, 0], ["vertebrae", 0, 0.68, 0]],
    to: [["scapula", 0, 0.7, 0.3], ["scapula", 0, 0.4, 0.3]],
  },
  "deep-core": {
    from: [["pelvis", 0.75, 0.95, 0.6], ["vertebrae", 1, 0.16, 0.5], ["ribs", 0.6, 0.1, 0.85]],
    to: [["breastbone", 0.5, 0, 1], ["pelvis", 0.06, 0.22, 1]],
  },
  piriformis: {
    from: [["pelvis", 0.08, 0.48, 0.3]],
    to: [["femur", 0.95, 0.97, 0.4]],
  },
  peroneals: {
    from: [["fibula", 0.8, 0.82, 0.5], ["fibula", 0.8, 0.45, 0.5]],
    to: [["foot-bones", 0.95, 0.4, 0.45], ["foot-bones", 0.2, 0.3, 0.55]],
  },
};
