import * as THREE from "three";

/**
 * Builds an indexed BufferGeometry from a parametric function.
 *
 * fn(u, v, out) must be periodic in u (it is called slightly outside 0..1 for
 * normals) and writes:
 *   out.p  THREE.Vector3  position
 *   out.uv THREE.Vector2  fibre-space UV (u across the fibres, v along them)
 *   out.c  THREE.Color    linear vertex colour
 *
 * Normals come from finite differences of fn itself, not from the mesh, so the
 * u seam and the poles shade smoothly.
 */
export function buildSurface(fn, nu, nv, { poleStart = false, poleEnd = false } = {}) {
  const cols = nu + 1;
  const rows = nv + 1;
  const count = cols * rows;
  const pos = new Float32Array(count * 3);
  const nor = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const col = new Float32Array(count * 3);

  const s = { p: new THREE.Vector3(), uv: new THREE.Vector2(), c: new THREE.Color(1, 1, 1) };
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const du = new THREE.Vector3();
  const dv = new THREE.Vector3();
  const n = new THREE.Vector3();
  const eps = 1e-3;

  const normalAt = (u, v, target) => {
    fn(u + eps, v, s);
    a.copy(s.p);
    fn(u - eps, v, s);
    du.subVectors(a, s.p);
    fn(u, Math.min(v + eps, 1), s);
    b.copy(s.p);
    fn(u, Math.max(v - eps, 0), s);
    dv.subVectors(b, s.p);
    return target.crossVectors(du, dv).normalize();
  };

  const centroid = new THREE.Vector3();
  for (let j = 0; j < rows; j++) {
    const v = j / nv;
    const atPole = (poleStart && j === 0) || (poleEnd && j === nv);
    for (let i = 0; i < cols; i++) {
      const u = i / nu;
      const k = j * cols + i;
      // a pole has no u derivative: sample the normal a hair inside instead
      const vn = atPole ? (j === 0 ? eps * 3 : 1 - eps * 3) : v;
      normalAt(u, vn, n);
      nor[k * 3] = n.x;
      nor[k * 3 + 1] = n.y;
      nor[k * 3 + 2] = n.z;

      fn(u, v, s);
      pos[k * 3] = s.p.x;
      pos[k * 3 + 1] = s.p.y;
      pos[k * 3 + 2] = s.p.z;
      uv[k * 2] = s.uv.x;
      uv[k * 2 + 1] = s.uv.y;
      col[k * 3] = s.c.r;
      col[k * 3 + 1] = s.c.g;
      col[k * 3 + 2] = s.c.b;
      centroid.add(s.p);
    }
  }
  centroid.multiplyScalar(1 / count);

  // every vertex of a pole row is the same point: give them one shared normal
  const averageRow = (j) => {
    n.set(0, 0, 0);
    for (let i = 0; i < nu; i++) {
      const k = (j * cols + i) * 3;
      n.x += nor[k];
      n.y += nor[k + 1];
      n.z += nor[k + 2];
    }
    n.normalize();
    for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 3;
      nor[k] = n.x;
      nor[k + 1] = n.y;
      nor[k + 2] = n.z;
    }
  };
  if (poleStart) averageRow(0);
  if (poleEnd) averageRow(nv);

  // make the normals point away from the centroid
  let facing = 0;
  for (let k = 0; k < count; k++) {
    facing +=
      nor[k * 3] * (pos[k * 3] - centroid.x) +
      nor[k * 3 + 1] * (pos[k * 3 + 1] - centroid.y) +
      nor[k * 3 + 2] * (pos[k * 3 + 2] - centroid.z);
  }
  if (facing < 0) for (let k = 0; k < nor.length; k++) nor[k] = -nor[k];

  // pick the triangle winding that agrees with those normals
  const jm = Math.floor(nv / 2);
  const im = Math.floor(nu / 4);
  const k0 = jm * cols + im;
  const k1 = k0 + 1;
  const k2 = k0 + cols;
  a.set(pos[k1 * 3] - pos[k0 * 3], pos[k1 * 3 + 1] - pos[k0 * 3 + 1], pos[k1 * 3 + 2] - pos[k0 * 3 + 2]);
  b.set(pos[k2 * 3] - pos[k0 * 3], pos[k2 * 3 + 1] - pos[k0 * 3 + 1], pos[k2 * 3 + 2] - pos[k0 * 3 + 2]);
  n.crossVectors(a, b);
  const ccw = n.x * nor[k0 * 3] + n.y * nor[k0 * 3 + 1] + n.z * nor[k0 * 3 + 2] > 0;

  const index = [];
  for (let j = 0; j < nv; j++) {
    for (let i = 0; i < nu; i++) {
      const p0 = j * cols + i;
      const p1 = p0 + 1;
      const p2 = p0 + cols;
      const p3 = p2 + 1;
      if (ccw) index.push(p0, p1, p2, p1, p3, p2);
      else index.push(p0, p2, p1, p1, p2, p3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geometry.setIndex(index);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export const smoothstep = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
