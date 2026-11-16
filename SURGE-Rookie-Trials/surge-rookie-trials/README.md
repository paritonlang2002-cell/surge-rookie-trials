# SURGE: Rookie Trials

A seated, hands-only WebXR hero-training game for Meta Quest Browser. The rookie sits at an academy desk, uses pinch to lift objects, and opens a palm to slow falling objects. The two trials introduce mass/force and speed/reaction time.

## Requirements

- Node.js **20.19+** (Node 22 LTS is recommended)
- npm
- Chrome for desktop testing; Meta Quest Browser for headset testing
- HTTPS for immersive WebXR (GitHub Pages provides HTTPS)

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Desktop controls:
- Move the mouse to aim.
- Click and hold to pinch/grab.
- Hold **Space** to open your palm and slow time.

Build and preview the production bundle:

```bash
npm run build
npm run preview
```

## GitHub Pages deployment

1. Create a GitHub repository named `surge-rookie-trials`.
2. In `vite.config.js`, make sure `base` is `/surge-rookie-trials/`. If you use another repository name, replace the path with `/<YOUR_REPO_NAME>/`.
3. Push this project to the repository's `main` branch.
4. In GitHub, open **Settings → Pages** and set the source to **GitHub Actions**.
5. The workflow in `.github/workflows/deploy.yml` builds and deploys on every push to `main`.
6. Wait for the Actions run to finish. Your URL will be `https://<YOUR_GITHUB_USERNAME>.github.io/surge-rookie-trials/`.

## Project map

| File | Purpose |
|---|---|
| `index.html` | The page shell, HUD, overlay panel and entry point. |
| `vite.config.js` | Vite build settings and the GitHub Pages base path. |
| `package.json` | Exact dependency versions and common npm commands. |
| `src/main.js` | Creates the Three.js scene, room, hands, VR button, state flow and render loop. |
| `src/config.js` | Central place for the palette, gesture thresholds and gameplay tuning values. |
| `src/input/gestures.js` | Reads Quest hand joints and detects pinch/open-palm transitions with smoothing and hysteresis. |
| `src/input/desktopFallback.js` | Maps mouse clicks to pinch rays and held Space to open palm. |
| `src/game/state.js` | Small state machine for START, TUTORIAL, both trials, RESULTS and PAUSED. |
| `src/game/trial1Telekinesis.js` | Creates three weighted crates, focus drain, grabbing and target scoring. |
| `src/game/trial2TimeSlow.js` | Creates falling orbs, catches and a slow-time gauge. |
| `src/ui/panels.js` | Displays the start, tutorial, hand-lost and results panels. |
| `src/fx/comicStyle.js` | Toon gradient, inverted-hull outlines and comic popup sprites. |
| `src/fx/particles.js` | Reusable particle buffer capped at 300 points. |
| `src/audio/audio.js` | Optional positional audio. Missing clips are ignored safely. |
| `src/assets/loader.js` | Optional GLB loader with primitive fallback and auto-fit scaling. |
| `.github/workflows/deploy.yml` | GitHub Actions build and Pages deployment. |

## Optional local assets

Place files here; the game still runs without them.

```text
public/assets/
  audio/
    grab.ogg
    whoosh.ogg
    success.ogg
    slow-hum.ogg
  models/
    training-crate.glb
    academy-crystal.glb
    academy-badge.glb
```

Only add assets you have the right to use. Keep audio short and each model below roughly 2 MB. The optional GLB loader automatically uses a primitive if a model is missing or fails.

## Testing the hand gestures

1. Use Chrome with the Immersive Web Emulator extension, or open the deployed HTTPS URL in Meta Quest Browser.
2. Select **ENTER VR**. The session requests `hand-tracking` and `local-floor` as optional features.
3. Allow hand tracking if prompted. Pinch thumb-tip to index-tip to grab; extend all four fingers to slow time.
4. Remove a hand during a trial to verify the pause screen, then bring it back to resume.

## Performance notes

- No physics engine, post-processing, locomotion or real-time shadows.
- Particle count is capped at 300.
- Pixel ratio is capped and XR foveation is requested when available.
- Geometry and materials are reused where practical.

## Known prototype limitations to test before competition submission

- WebXR hand tracking and `XRHandModelFactory` behavior must be verified on the target Quest Browser / OS version.
- The demo uses locally generated primitive objects and procedural audio hooks; no third-party runtime services are used.
- The supplied build is a playable starting project, not a claim of hardware certification or a measured 60 fps result. Test on the actual headset and tune thresholds in `src/config.js`.
