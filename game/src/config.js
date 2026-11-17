// STARLING — tuning, palette and layout constants.
// One place for every number that shapes the game, so balance is tuned here
// and nowhere else.

export const VIEW = { width: 1280, height: 800 };

export const PALETTE = {
  skyTop: '#0a0f26',
  skyMid: '#1c2a52',
  skyLow: '#43316b',
  sunset: '#ff7e5f',
  sunsetSoft: '#feb47b',
  hillFar: '#1a2340',
  hillNear: '#121a33',
  star: '#e8ecff',
  auroraA: 'rgba(64, 224, 178, 0.13)',
  auroraB: 'rgba(120, 140, 255, 0.11)',
  bird: '#ffe9b0',
  birdGlow: 'rgba(255, 220, 140, 0.55)',
  seed: '#ffd76a',
  seedGlow: 'rgba(255, 205, 90, 0.75)',
  hawk: '#e5484d',
  hawkDark: '#7a1f26',
  flare: 'rgba(140, 220, 255, 0.85)',
  hudText: '#fff6dd',
  hudPill: 'rgba(8, 12, 32, 0.55)',
  danger: '#ff5d5d',
};

export const FLOCK = {
  startBirds: 7,
  maxBirds: 42,
  leadSpeed: 620, // px/s toward the pointer
  followSpring: 4.0,
  followDamp: 0.82,
  spacing: 26,
  flutterAmp: 7,
  flutterFreq: 9,
  birdRadius: 7,
  invulnAfterHit: 1.5, // seconds of safety after a hawk strike
};

export const SEEDS = {
  spawnEvery: 0.45, // seconds between spawns (shrinks with wave)
  spawnMin: 0.24,
  driftSpeed: 42,
  collectRadius: 40,
  magnetRadius: 120, // seeds inside this range drift toward the lead bird
  magnetPull: 260,
  baseScore: 10,
  comboWindow: 3.0, // seconds to keep the combo alive
  comboStep: 0.1, // +10% per combo step
  comboCap: 3.0,
};

export const HAWKS = {
  spawnEvery: 5.5, // seconds between spawns (shrinks with wave)
  spawnMin: 2.2,
  cruiseSpeed: 190,
  diveSpeed: 400,
  lockRadius: 420,
  strikeRadius: 16,
  repelRadius: 300,
  stunTime: 2.0,
  maxAlive: 5,
};

export const FLARE = {
  cooldown: 3.0,
  radius: 300,
  pulseMs: 450,
};

export const WAVES = {
  length: 25, // seconds per wave
  dawnWave: 6, // reaching this wave breaks the dawn
  dawnBonus: 1000,
};

export const GUST = {
  everyMin: 7,
  everyMax: 12,
  duration: 2.6,
  strength: 170,
};
