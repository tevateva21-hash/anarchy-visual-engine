import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { psychedelicLook } from './psychedelicLook';

/** Spatial post effect only: no history buffer, random noise, CSS filter or wall clock. */
export function createPsychedelicPass(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const target = new THREE.WebGLRenderTarget(1, 1, {
    type: renderer.extensions.has('EXT_color_buffer_float') ? THREE.HalfFloatType : THREE.UnsignedByteType,
  });
  const composer = new EffectComposer(renderer, target);
  const renderPass = new RenderPass(scene, camera);
  const effect = new ShaderPass({
    name: 'TechnoTherapyLook',
    uniforms: {
      tDiffuse: { value: null }, strength: { value: 0 }, phase: { value: 0 },
      warp: { value: 0 }, chroma: { value: 0 }, glow: { value: 0 }, contrast: { value: 1 },
      aspect: { value: 1 },
    },
    vertexShader: `varying vec2 vUv;
      void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float strength, phase, warp, chroma, glow, contrast, aspect;
      varying vec2 vUv;
      vec3 source(vec2 uv) { return texture2D(tDiffuse, clamp(uv, vec2(0.001), vec2(0.999))).rgb; }
      vec3 highlight(vec2 uv) { vec3 c = source(uv); return c * smoothstep(0.65, 1.6, max(c.r, max(c.g, c.b))); }
      void main() {
        vec2 p = vUv - 0.5;
        float radius = length(p * vec2(aspect, 1.0));
        vec2 drift = p * sin(radius * 8.0 - phase * 0.35) * warp;
        vec2 uv = vUv + drift;
        vec2 separation = p * chroma * (1.0 + radius);
        vec3 color = vec3(source(uv + separation).r, source(uv).g, source(uv - separation).b);
        vec2 stepUV = vec2(0.006 / aspect, 0.006);
        vec3 halo = highlight(uv + stepUV) + highlight(uv - stepUV);
        halo += highlight(uv + vec2(stepUV.x, -stepUV.y)) + highlight(uv + vec2(-stepUV.x, stepUV.y));
        halo += highlight(uv + vec2(stepUV.x, 0.0)) + highlight(uv - vec2(stepUV.x, 0.0));
        halo += highlight(uv + vec2(0.0, stepUV.y)) + highlight(uv - vec2(0.0, stepUV.y));
        color += halo * (glow / 8.0);
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        vec3 shadowTint = vec3(0.90, 0.96, 1.06);
        vec3 lightTint = vec3(1.04, 0.96, 1.015);
        color *= mix(vec3(1.0), mix(shadowTint, lightTint, smoothstep(0.05, 0.8, luminance)), strength);
        color = pow(max(color, vec3(0.0)), vec3(contrast));
        color *= 1.0 - strength * 0.12 * smoothstep(0.2, 0.85, radius);
        gl_FragColor = vec4(color, 1.0);
      }`,
  });
  const output = new OutputPass();
  composer.addPass(renderPass); composer.addPass(effect); composer.addPass(output);
  return {
    render(time: number, strength: number, motion: number) {
      const values = psychedelicLook(time, strength, motion);
      if (strength === 0) { renderer.setRenderTarget(null); renderer.render(scene, camera); return; }
      for (const name of ['strength', 'phase', 'warp', 'chroma', 'glow', 'contrast'] as const) effect.uniforms[name].value = values[name];
      // Explicit delta prevents EffectComposer from consulting its internal clock. No temporal pass uses it.
      composer.render(0);
    },
    resize(width: number, height: number) {
      composer.setSize(width, height); effect.uniforms.aspect.value = width / height;
    },
    dispose() {
      renderPass.dispose(); effect.dispose(); output.dispose(); composer.dispose();
    },
  };
}
