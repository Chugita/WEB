# Living Matter — Sinapsis Orgánica

Phase 01 only. A full-viewport procedural 3D living mass, internal pearlescent light, localized elastic pointer interaction, temporary electromagnetic trails and one semantic **Comenzar** bubble. The supplied reference is a visual target, not a background texture. No explosion, headline, external network, questionnaire or second scene.

## Run and build

Requires Node.js 24.

```sh
npm ci
npm run dev
npm test
npm run build
```

Vite serves the app at the printed local address. Vercel uses `npm run build` and output `dist`. The existing `/api/health` function is preserved; Supabase is not configured because the account's two free project slots are already occupied. The scene has no database dependency.

## Architecture

TypeScript + Vite + Three.js with custom GLSL. Direct Three.js keeps the existing lightweight entry point and one animation loop without adding a React runtime solely for the canvas. Geist Sans is bundled locally.

- `src/OriginScene.ts`: camera, rendering, pointer capture, barycentric raycast mapping, lifecycle, responsive layout, bloom, adaptive quality.
- `src/LivingMatter.ts`: shared deformed geometry, ordered back membrane / light / inner folds / front membrane; CPU-updated smooth normals.
- `src/physics.ts`: coherent warped noise, localized Gaussian pressure, stable damped spring and release wave.
- `src/ElectromagneticTrail.ts`: four reused dynamic line buffers, Catmull–Rom interpolation, velocity response and shader alpha decay.
- `src/shaders/`: custom membrane, core and trail vertex/fragment shaders.
- `src/config/originVisualConfig.ts`: editable visual and physical parameters.
- `src/styles/origin.css`: composition, semantic organic bubble, focus and fallback.

Raycasting uses the actual current CPU-deformed outer mesh. Barycentric coordinates map the hit back to the corresponding original surface directions. It does not use a screen-center proximity heuristic or a spherical proxy. Pressure remains local and bounded; dragging never rotates the object as a trackball.

## Integration contract

```ts
const scene = mountOriginScene(root, {
  onBegin: () => { /* existing next-phase transition can be connected here */ },
  quality: 'auto' // 'high' | 'medium' | 'low'
});
// On removal:
scene.dispose();
```

Every activation also preserves the existing `sinapsis:begin` document event. No navigation or placeholder second scene is added. Enter, Space and touch use the real HTML button.

`forceFallback` and `reducedMotion` are optional mounting overrides for validation. Development-only `?fallback=1` and `?reduced=1` routes exercise those paths; production ignores these query overrides. Development diagnostics are DOM data attributes and do not collect or transmit visitor information.

## Performance and accessibility

One RAF loop, bounded frame delta, shared geometry, reused GPU buffers and disposed resources. Mesh updates at 30 Hz idle / 45 Hz during dragging; rendering targets the display refresh rate. Auto quality caps DPR, chooses geometry density and reduces DPR/bloom if sustained frame intervals are high. These are targets, not a hardware performance guarantee.

Reduced motion freezes the ambient time and removes pressure/trail effects while preserving the material and CTA. A keyboard-focus-only pause control is available after Comenzar; ordinary viewing contains only the one CTA. The animation suspends in hidden tabs. Context loss displays the static SVG approximation with the functional button. The fallback stays visible during first-frame compilation to avoid an empty viewport.

## Known fidelity and validation limits

Translucency, thickness and scattering are artistic approximations with ordered alpha layers and restrained bloom, not spectral transport or fluid simulation. The core uses a procedural luminous internal plane; surrounding deformed membranes provide the occlusion and volume impression. The silhouette and folds differ from the generated still and are not claimed pixel-perfect. Native GL line thickness varies by device.

CPU deformation tests cover coherence, bounds, locality, stable release and reduced-motion sampling. Browser review includes desktop and 390 × 844 simulated mobile composition, actual surface-hit detection, keyboard activation and forced fallback. Physical phones, Safari, hardware context loss and GPU profiling need separate validation. The reference still does not establish 60 FPS performance.
