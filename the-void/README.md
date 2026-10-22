# THE VOID — Reality Simulator

A local-first, procedural 3D universe built with React, TypeScript, Vite, and Three.js.

## Run it

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

## Controls

- Move your pointer over the universe to subtly steer the camera.
- Change dimensional states: Singularity, Genesis, Wormhole, Entropy.
- Adjust gravity, chaos, energy, and time dilation.
- Pause/resume or reset the simulation.
- Type an intention and press Manifest to map keywords to a state and parameters.

## What's real vs. simulated?

The 3D particle field and its transformations are live procedural graphics rendered in WebGL. The intent interpreter is a local keyword-based prototype, not a connected language model. This keeps the first build free of API keys and usable offline after dependencies are installed. Google Fonts are loaded remotely; system fallback fonts will be used if unavailable.

## Good next upgrades

1. Add orbit/zoom controls and clickable cosmic objects.
2. Add a real AI backend that converts prompts into a validated scene JSON schema.
3. Add save/load presets and shareable scene URLs.
4. Add audio-reactive particle movement.
