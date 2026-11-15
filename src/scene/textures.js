import * as THREE from "three";

// Deterministic pseudo-random numbers so the model looks the same on every load.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Muscle-fibre streaks running along v, tileable in u.
 * Returns a colour map (sRGB) and a bump map (linear) drawn from one canvas.
 */
export function createFibreTextures() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const rand = mulberry32(7);

  ctx.fillStyle = "#f0f0f0";
  ctx.fillRect(0, 0, size, size);

  // a few broad bundles under many fine fibres
  for (let i = 0; i < 26; i++) {
    const x = rand() * size;
    const w = 10 + rand() * 26;
    ctx.fillStyle = "rgba(70, 20, 24, " + (0.03 + rand() * 0.07) + ")";
    for (const dx of [-size, 0, size]) ctx.fillRect(x + dx, 0, w, size);
  }
  for (let i = 0; i < 340; i++) {
    const x = rand() * size;
    const w = 0.7 + rand() * 3.2;
    const dark = rand() < 0.7;
    const alpha = dark ? 0.05 + rand() * 0.22 : 0.08 + rand() * 0.22;
    ctx.fillStyle = dark ? "rgba(60, 20, 20, " + alpha + ")" : "rgba(255, 255, 255, " + alpha + ")";
    // draw three times so streaks that cross the edge wrap around
    for (const dx of [-size, 0, size]) ctx.fillRect(x + dx, 0, w, size);
  }

  const make = (colorSpace) => {
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = colorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = 8;
    return texture;
  };

  return {
    map: make(THREE.SRGBColorSpace),
    bumpMap: make(THREE.NoColorSpace),
  };
}

/** Soft round shadow under the feet: one textured quad instead of a shadow map. */
export function createContactShadowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(0, 0, 0, 0.55)");
  g.addColorStop(0.45, "rgba(0, 0, 0, 0.22)");
  g.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
