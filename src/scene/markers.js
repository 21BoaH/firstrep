import * as THREE from "three";

/** A round marker drawn on a canvas: a ring for an anchor, a filled dot for the end that pulls. */
function markerTexture(kind) {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d");
  const c = size / 2;
  // dark halo, so the marker reads against ivory bone
  g.beginPath();
  g.arc(c, c, 42, 0, Math.PI * 2);
  g.fillStyle = "rgba(10, 11, 13, 0.92)";
  g.fill();
  if (kind === "to") {
    g.beginPath();
    g.arc(c, c, 31, 0, Math.PI * 2);
    g.fillStyle = "#f2b84e";
    g.fill();
    g.beginPath();
    g.arc(c, c, 12, 0, Math.PI * 2);
    g.fillStyle = "#fff1cf";
    g.fill();
  } else {
    g.beginPath();
    g.arc(c, c, 26, 0, Math.PI * 2);
    g.lineWidth = 11;
    g.strokeStyle = "#f2b84e";
    g.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Builds the attachment markers for every muscle and hangs them on the skeleton, hidden.
 *
 * A point is given as [bone, u, v, w] (see src/data/attachments.js). It is resolved in the
 * frame of the group that holds the bone and snapped to the nearest spot on the bone's surface.
 * Because the marker is then added to that group, it follows the limb when the body is posed,
 * and the mirrored group gets the same marker on the other side of the body.
 *
 * Returns { byMuscle: Map(muscle id -> sprites), dispose }.
 */
export function buildAttachmentMarkers(body, attachments) {
  const textures = { from: markerTexture("from"), to: markerTexture("to") };
  const materials = {};
  for (const kind of ["from", "to"]) {
    materials[kind] = new THREE.SpriteMaterial({ map: textures[kind], depthTest: false, depthWrite: false, transparent: true, toneMapped: false });
  }
  const size = { from: 0.021, to: 0.026 };

  const mirrored = (object) => {
    for (let o = object; o; o = o.parent) if (o.scale.x < 0) return true;
    return false;
  };

  /** bone id -> { frame, points, min, max }: its surface points on the modeled side, in its group's frame */
  const bones = new Map();
  const boneOf = (id) => {
    if (bones.has(id)) return bones.get(id);
    const meshes = body.meshes.filter((m) => m.userData.landmark === id && m.userData.layer === "skeleton" && !mirrored(m));
    // the pelvis has a piece on the midline and pieces on the side: the side group wins
    const frame = meshes.find((m) => m.parent.name !== "centre")?.parent.name ?? "centre";
    const trunk = frame === "centre" || frame === "half";
    const points = [];
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    const v = new THREE.Vector3();
    // A bone may sit deeper than its frame group (the finger bones ride in the finger joints):
    // carry its points up to the frame. The trunk's two groups, centre and half, share one frame.
    const toFrame = (mesh) => {
      const m = new THREE.Matrix4();
      for (let o = mesh; o; o = o.parent) {
        if (o !== mesh && (o.name === frame || (trunk && (o.name === "centre" || o.name === "half")))) return m;
        o.updateMatrix();
        m.premultiply(o.matrix);
      }
      return null;
    };
    for (const mesh of meshes) {
      const matrix = toFrame(mesh);
      if (!matrix) continue;
      const position = mesh.geometry.attributes.position;
      for (let i = 0; i < position.count; i++) {
        v.fromBufferAttribute(position, i).applyMatrix4(matrix);
        if (trunk && v.x < 0) continue; // a bone on the midline: keep the modeled half of it
        points.push(v.x, v.y, v.z);
        min.min(v);
        max.max(v);
      }
    }
    const bone = points.length ? { frame, points, min, max } : null;
    bones.set(id, bone);
    return bone;
  };

  const place = ([id, u, v, w]) => {
    const bone = boneOf(id);
    if (!bone) return null;
    const { points, min, max } = bone;
    const tx = min.x + (max.x - min.x) * u;
    const ty = min.y + (max.y - min.y) * v;
    const tz = min.z + (max.z - min.z) * w;
    let best = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < points.length; i += 3) {
      const d = (points[i] - tx) ** 2 + (points[i + 1] - ty) ** 2 + (points[i + 2] - tz) ** 2;
      if (d < bestDistance) {
        bestDistance = d;
        best = i;
      }
    }
    return { frame: bone.frame, at: new THREE.Vector3(points[best], points[best + 1], points[best + 2]) };
  };

  const byMuscle = new Map();
  for (const [muscle, ends] of Object.entries(attachments)) {
    const sprites = [];
    const add = (group, kind, at) => {
      const sprite = new THREE.Sprite(materials[kind]);
      sprite.position.copy(at);
      sprite.scale.setScalar(size[kind]);
      sprite.renderOrder = 30;
      sprite.visible = false;
      sprite.userData.attachment = kind;
      group.add(sprite);
      sprites.push(sprite);
    };
    for (const kind of ["from", "to"]) {
      for (const spec of ends[kind] ?? []) {
        const spot = place(spec);
        if (!spot) continue;
        const groups = body.rig[spot.frame] ?? [];
        for (const group of groups) add(group, kind, spot.at);
        // a bone on the midline is not mirrored, so its marker is, unless it sits on the midline itself
        if (spot.frame === "centre" && spot.at.x > 0.004) add(groups[0], kind, spot.at.clone().setX(-spot.at.x));
      }
    }
    byMuscle.set(muscle, sprites);
  }

  const dispose = () => {
    for (const sprites of byMuscle.values()) for (const sprite of sprites) sprite.removeFromParent();
    for (const kind of ["from", "to"]) {
      materials[kind].dispose();
      textures[kind].dispose();
    }
  };

  return { byMuscle, dispose };
}
