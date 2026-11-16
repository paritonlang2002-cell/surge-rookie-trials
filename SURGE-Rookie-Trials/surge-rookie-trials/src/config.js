// All tuning values and the complete visual palette live here.
export const COLORS = {
  navy: '#0b1030', panel: '#141b4d', cyan: '#22e6ff',
  magenta: '#ff2e9a', yellow: '#ffe14a', ink: '#05060f',
  paper: '#f6f3ff', wood: '#2a1d5c', woodLight: '#3b2a7d',
  crate: '#c98a2b', green: '#3ee88a'
};

export const GESTURES = {
  PINCH_START: 0.025, PINCH_END: 0.04, PALM_EXTEND: 0.09, SMOOTH_FRAMES: 4
};

export const GAME = {
  deskHeight: 0.75, playRadius: 0.6, panelDistance: 0.8,
  panelYOffset: -0.12, trial1Seconds: 90, trial2Seconds: 60,
  focusDrainPerSecond: 5.2, focusRecoverPerSecond: 12,
  timeDrainPerSecond: 18, timeRecoverPerSecond: 10,
  normalTimeScale: 1, slowTimeScale: 0.2, gravity: 1.6,
  followLerp: 0.15, particleCap: 300, maxPixelRatio: 1.5,
  outlineScale: 1.055
};

export const ASSET_PATHS = {
  crate: 'assets/models/training-crate.glb',
  crystal: 'assets/models/academy-crystal.glb',
  badge: 'assets/models/academy-badge.glb',
  grab: 'assets/audio/grab.ogg',
  whoosh: 'assets/audio/whoosh.ogg',
  success: 'assets/audio/success.ogg',
  slow: 'assets/audio/slow-hum.ogg'
};