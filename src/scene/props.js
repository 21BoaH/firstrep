import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/**
 * Where a handle sits in the hand, in the hand's own coordinates: across the roots of the
 * fingers, on the palm side. The fingers close around this point when the hand grips.
 */
export const GRIP_POINT = [-0.024, -0.088, 0.002];

/**
 * The few pieces of gym equipment that turn a pose into an exercise: a pair of dumbbells that
 * ride in the hands, a pull-up bar and a bench. They are not part of the body. They cannot be
 * clicked, and they stay solid in every layer.
 *
 * Returns { show(held, at), dispose }.
 *   held  { dumbbells, bar, bench }: how far each piece has come in, from 0 (away) to 1 (in place)
 *   at    { bar: { y, z }, bench: { top, z } }: where the bar hangs and how high the bench stands
 */
export function buildEquipment(body, scene) {
  const iron = new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 0.42, metalness: 0.72 });
  const steel = new THREE.MeshStandardMaterial({ color: 0xa9abb2, roughness: 0.3, metalness: 0.95 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xd6b37c, roughness: 0.32, metalness: 1, emissive: 0xd6b37c, emissiveIntensity: 0.18 });
  const pad = new THREE.MeshStandardMaterial({ color: 0x1d1f25, roughness: 0.78, metalness: 0.05 });
  const materials = [iron, steel, gold, pad];
  const geometries = new Set();

  const piece = (parent, geometry, material) => {
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // ------------------------------------------------------------ dumbbells
  // One in each hand. A cylinder stands along y, so the group is laid over to run from the thumb
  // to the little finger, which is the hand's z axis.
  const handle = new THREE.CylinderGeometry(0.0105, 0.0105, 0.13, 14);
  const head = new THREE.CylinderGeometry(0.036, 0.036, 0.034, 28);
  const collar = new THREE.CylinderGeometry(0.0165, 0.0165, 0.008, 18);
  const dumbbells = body.rig.hand.map((hand) => {
    const group = new THREE.Group();
    group.position.set(...GRIP_POINT);
    group.rotation.x = Math.PI / 2;
    group.visible = false;
    hand.add(group);
    piece(group, handle, steel);
    for (const end of [-1, 1]) {
      piece(group, head, iron).position.y = end * 0.073;
      piece(group, collar, gold).position.y = end * 0.052;
    }
    return group;
  });

  // ------------------------------------------------------------ pull-up bar
  // It hangs in the air where the hands of the pose are. Its ends carry the gold of the pedestal.
  const bar = new THREE.Group();
  bar.visible = false;
  scene.add(bar);
  const rail = piece(bar, new THREE.CylinderGeometry(0.0145, 0.0145, 1.5, 18), steel);
  rail.rotation.z = Math.PI / 2;
  const cap = new THREE.CylinderGeometry(0.019, 0.019, 0.03, 18);
  for (const end of [-1, 1]) {
    const tip = piece(bar, cap, gold);
    tip.rotation.z = Math.PI / 2;
    tip.position.x = end * 0.75;
  }

  // ------------------------------------------------------------ bench
  // A padded top on a dark block, with a gold line where they meet. Its height is set to the pose.
  const bench = new THREE.Group();
  bench.visible = false;
  scene.add(bench);
  const PAD = 0.07;
  const cushion = piece(bench, new RoundedBoxGeometry(1.04, PAD, 0.34, 4, 0.026), pad);
  const block = piece(bench, new THREE.BoxGeometry(0.9, 1, 0.24), iron);
  const line = piece(bench, new THREE.BoxGeometry(0.92, 0.006, 0.26), gold);

  const show = (held, at) => {
    for (const group of dumbbells) {
      group.visible = held.dumbbells > 0.02;
      group.scale.setScalar(Math.max(held.dumbbells, 0.001));
    }

    bar.visible = held.bar > 0.02;
    bar.position.set(0, at.bar.y, at.bar.z);
    bar.scale.set(Math.max(held.bar, 0.001), 1, 1); // it runs out from the middle

    bench.visible = held.bench > 0.02;
    bench.position.set(0, 0, at.bench.z);
    bench.scale.y = Math.max(held.bench, 0.001); // it rises from the floor
    const under = Math.max(at.bench.top - PAD, 0.02);
    cushion.position.y = under + PAD / 2;
    block.scale.y = under;
    block.position.y = under / 2;
    line.position.y = under;
  };

  const dispose = () => {
    for (const group of dumbbells) group.removeFromParent();
    bar.removeFromParent();
    bench.removeFromParent();
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  };

  return { show, dispose };
}
