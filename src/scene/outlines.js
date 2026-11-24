import * as THREE from "three";

/**
 * Thin dark lines where one muscle meets the next, so that neighbours of the same red still read as
 * separate muscles.
 *
 * After each frame is drawn, the scene is drawn once more into an offscreen buffer, where every
 * pixel holds the number of its outline group (one muscle part on one side of the body, say) and the
 * way its surface faces. A full-screen pass then darkens the pixels next to a pixel of another group,
 * but only where the two surfaces meet at an angle, as they do at a seam. Where they run on together,
 * one surface only grazes through the other, and a line would trace the overlap, not a border.
 */

/** How dark a line is at most: 0 is no line, 1 is black. */
const STRENGTH = 0.45;

const GROUP_VERTEX = /* glsl */ `
varying vec3 vNormal;
void main() {
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// The group number in red and green (0 is empty space, 1 a mesh without lines of its own), and the
// direction the surface faces, in view space, in blue and alpha.
const GROUP_FRAGMENT = /* glsl */ `
uniform float group;
varying vec3 vNormal;
void main() {
  vec3 n = normalize(vNormal);
  gl_FragColor = vec4(mod(group, 256.0) / 255.0, floor(group / 256.0) / 255.0, n.xy * 0.5 + 0.5);
}`;

const LINE_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

const LINE_FRAGMENT = /* glsl */ `
uniform sampler2D groups;
uniform vec2 texel;
uniform float strength;
varying vec2 vUv;

float groupOf(vec4 t) {
  return floor(t.r * 255.0 + 0.5) + 256.0 * floor(t.g * 255.0 + 0.5);
}

vec3 normalOf(vec4 t) {
  vec2 xy = t.ba * 2.0 - 1.0;
  return vec3(xy, sqrt(max(0.0, 1.0 - dot(xy, xy))));
}

// How much of a line the neighbouring pixel at uv calls for.
float seam(float group, vec3 normal, vec2 uv) {
  vec4 t = texture2D(groups, uv);
  float other = groupOf(t);
  // empty space, a mesh without lines, or more of the same group
  if (other < 1.5 || abs(other - group) < 0.5) return 0.0;
  // no line below about 11 degrees between the two surfaces, a full one from about 28
  return smoothstep(0.02, 0.12, 1.0 - dot(normal, normalOf(t)));
}

void main() {
  vec4 t = texture2D(groups, vUv);
  float group = groupOf(t);
  if (group < 1.5) discard;
  vec3 normal = normalOf(t);
  float line = max(
    max(seam(group, normal, vUv + vec2(texel.x, 0.0)), seam(group, normal, vUv - vec2(texel.x, 0.0))),
    max(seam(group, normal, vUv + vec2(0.0, texel.y)), seam(group, normal, vUv - vec2(0.0, texel.y)))
  );
  if (line <= 0.0) discard;
  gl_FragColor = vec4(0.0, 0.0, 0.0, line * strength);
}`;

/**
 * Outlines for the meshes of one renderer. add() each mesh to outline, then call render() right after
 * each frame is drawn. Everything else in the scene still hides the lines behind it.
 */
export function createOutlines(renderer) {
  /** outline group name -> its number, from 2 */
  const numbers = new Map();
  const target = new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    generateMipmaps: false,
  });

  // front faces only, like every material of the body, so that a mesh with an open edge covers the
  // same pixels here as in the picture
  const groupMaterial = new THREE.ShaderMaterial({
    uniforms: { group: { value: 0 } },
    vertexShader: GROUP_VERTEX,
    fragmentShader: GROUP_FRAGMENT,
  });
  // one material draws every mesh, so it takes each mesh's group number just before drawing it
  groupMaterial.onBeforeRender = (_renderer, _scene, _camera, _geometry, object) => {
    groupMaterial.uniforms.group.value = object.userData.outlineGroup ?? 1;
    groupMaterial.uniformsNeedUpdate = true;
  };

  const lineMaterial = new THREE.ShaderMaterial({
    uniforms: { groups: { value: target.texture }, texel: { value: new THREE.Vector2() }, strength: { value: STRENGTH } },
    vertexShader: LINE_VERTEX,
    fragmentShader: LINE_FRAGMENT,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), lineMaterial);
  quad.frustumCulled = false;
  const overlay = new THREE.Scene();
  overlay.add(quad);
  const flat = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const size = new THREE.Vector2();
  const clearColor = new THREE.Color();

  return {
    /** Outline this mesh where it meets a mesh of another group. group: any name. */
    add(mesh, group) {
      if (!numbers.has(group)) numbers.set(group, numbers.size + 2);
      mesh.userData.outlineGroup = numbers.get(group);
    },

    /** Lay the lines over the picture of this scene that was just drawn. */
    render(scene, camera) {
      if (!numbers.size) return;
      renderer.getDrawingBufferSize(size);
      if (!size.x || !size.y) return;
      if (target.width !== size.x || target.height !== size.y) target.setSize(size.x, size.y);
      lineMaterial.uniforms.texel.value.set(1 / size.x, 1 / size.y);

      const autoClear = renderer.autoClear;
      const shadows = renderer.shadowMap.autoUpdate;
      const override = scene.overrideMaterial;
      const background = scene.background;
      const clearAlpha = renderer.getClearAlpha();
      renderer.getClearColor(clearColor);
      renderer.autoClear = false;

      // The groups, offscreen. The lights stay in the scene, so that three.js keeps its light setup
      // from the frame just drawn, but the shadows are not drawn again.
      renderer.shadowMap.autoUpdate = false;
      scene.overrideMaterial = groupMaterial;
      scene.background = null;
      renderer.setRenderTarget(target);
      renderer.setClearColor(0x000000, 0);
      renderer.clear();
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      renderer.setClearColor(clearColor, clearAlpha);
      scene.overrideMaterial = override;
      scene.background = background;
      renderer.shadowMap.autoUpdate = shadows;

      // the lines, over the picture
      renderer.render(overlay, flat);
      renderer.autoClear = autoClear;
    },

    dispose() {
      target.dispose();
      groupMaterial.dispose();
      lineMaterial.dispose();
      quad.geometry.dispose();
    },
  };
}
