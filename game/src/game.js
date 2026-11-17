// STARLING — the game state machine.
// One object owns the mode (title / playing / paused / over), the score,
// combo, wave clock, flare cooldown, wind gusts and the dawn bonus, and
// steps every subsystem once per frame. Nothing here draws; render.js does.

import { FLOCK, SEEDS, WAVES, FLARE, GUST, VIEW } from './config.js';
import { createFlock, updateFlock, addBird, removeBird, flockCount } from './flock.js';
import { createSeeds, updateSeeds, collectSeeds, magnetSeeds } from './seeds.js';
import { createHawks, updateHawks, hawkStrikes } from './hawks.js';
import { createWorld, burst, addGust, updateWorld } from './world.js';
import { PALETTE } from './config.js';

export function createGame(seed) {
  return {
    mode: 'title', // title | playing | paused | over
    time: 0,
    seed,
    world: createWorld(seed),
    flock: createFlock(420, 420, FLOCK.startBirds),
    seeds: createSeeds(),
    hawks: createHawks(),
    score: 0,
    best: 0,
    wave: 1,
    waveT: 0,
    combo: 0,
    comboT: 0,
    maxCombo: 1,
    seedsEaten: 0,
    flare: { active: false, t: 0, x: 0, y: 0, cooldown: 0 },
    wind: { x: 0, y: 0 },
    gustTimer: 8,
    banner: null, // { text, sub, t, dur }
    dawnShown: false,
    isNewBest: false,
    target: { x: 640, y: 400 },
  };
}

export function startGame(game) {
  game.mode = 'playing';
  game.time = 0;
  game.world = createWorld(game.seed + 1);
  game.flock = createFlock(420, 420, FLOCK.startBirds);
  game.seeds = createSeeds();
  game.hawks = createHawks();
  game.score = 0;
  game.wave = 1;
  game.waveT = 0;
  game.combo = 0;
  game.comboT = 0;
  game.maxCombo = 1;
  game.seedsEaten = 0;
  game.flare = { active: false, t: 0, x: 0, y: 0, cooldown: 0 };
  game.wind = { x: 0, y: 0 };
  game.gustTimer = 8;
  game.banner = null;
  game.dawnShown = false;
  game.isNewBest = false;
  game.target = { x: 640, y: 400 };
}

export function loadBest(game) {
  try {
    game.best = Number(window.localStorage.getItem('starling-best') || 0) || 0;
  } catch (e) {
    game.best = 0;
  }
}

export function saveBest(game) {
  try {
    window.localStorage.setItem('starling-best', String(game.best));
  } catch (e) {
    // Storage unavailable (sandboxed file://): the score still shows.
  }
}

export function fireFlare(game, audio) {
  if (game.flare.cooldown > 0 || game.mode !== 'playing') return false;
  const lead = game.flock.birds[0];
  if (!lead) return false;
  game.flare.active = true;
  game.flare.t = FLARE.pulseMs / 1000;
  game.flare.x = lead.x;
  game.flare.y = lead.y;
  game.flare.cooldown = FLARE.cooldown;
  burst(game.world, lead.x, lead.y, '#9fe8ff', 26, 320);
  if (audio) audio.flare();
  return true;
}

function showBanner(game, text, sub, dur) {
  game.banner = { text, sub, t: 0, dur };
}

export function updateGame(game, input, audio, dt) {
  game.time += dt;
  updateWorld(game.world, dt, game.time);

  if (game.mode === 'title') {
    // A demo murmuration drifts behind the title so the cover is alive,
    // kept in the middle band so it never covers the title itself.
    const t = game.target;
    t.x = 640 + Math.sin(game.time * 0.35) * 260;
    t.y = 480 + Math.sin(game.time * 0.7) * 80;
    updateFlock(game.flock, t, dt, game.time, { x: 0, y: 0 });
    return;
  }

  if (game.mode === 'paused' || game.mode === 'over') return;

  // Steering.
  game.target = input.steerTarget(dt, game.target.x, game.target.y);

  // Wind gusts: a timer starts one, it pushes everything sideways.
  game.gustTimer -= dt;
  if (game.gustTimer <= 0) {
    game.gustTimer = GUST.everyMin + Math.random() * (GUST.everyMax - GUST.everyMin);
    addGust(game.world, Math.random);
    const dir = Math.random() > 0.5 ? 1 : -1;
    game.wind.x = dir * GUST.strength;
    game.wind.y = (Math.random() - 0.5) * 60;
    setTimeout(() => { game.wind.x = 0; game.wind.y = 0; }, GUST.duration * 1000);
  }

  // Flare pulse lifetime and cooldown.
  if (game.flare.active) {
    game.flare.t -= dt;
    if (game.flare.t <= 0) game.flare.active = false;
  }
  if (game.flare.cooldown > 0) game.flare.cooldown -= dt;

  updateFlock(game.flock, game.target, dt, game.time, game.wind);
  updateSeeds(game.seeds, dt, game.wind, game.wave, Math.random, game.time);
  updateHawks(game.hawks, dt, game.wave, game.flock, Math.random, game.time,
    game.flare.active, game.flare.x, game.flare.y);

  // Combo clock.
  if (game.comboT > 0) {
    game.comboT -= dt;
    if (game.comboT <= 0) game.combo = 0;
  }

  // Seeds: grow the flock, score with the combo multiplier.
  magnetSeeds(game.seeds, game.flock, dt);
  const got = collectSeeds(game.seeds, game.flock);
  for (const s of got) {
    game.seedsEaten++;
    if (game.comboT > 0) game.combo++;
    else game.combo = 1;
    game.comboT = SEEDS.comboWindow;
    const mult = 1 + Math.min(game.combo, 20) * SEEDS.comboStep;
    game.maxCombo = Math.max(game.maxCombo, mult);
    game.score += Math.round(SEEDS.baseScore * mult);
    addBird(game.flock, Math.random);
    burst(game.world, s.x, s.y, PALETTE.seed, 10, 160);
    if (audio) audio.seed(game.combo);
  }

  // Hawk strikes: lose a bird, break the combo, shake the screen.
  const struck = hawkStrikes(game.hawks, game.flock);
  if (struck.length) {
    const lost = removeBird(game.flock);
    if (lost) burst(game.world, lost.x, lost.y, '#ffb0b0', 18, 240);
    game.flock.invuln = FLOCK.invulnAfterHit;
    game.combo = 0;
    game.comboT = 0;
    game.world.shake = 14;
    if (audio) audio.hit();
    if (flockCount(game.flock) === 0) {
      game.mode = 'over';
      game.isNewBest = game.score > game.best;
      if (game.isNewBest) game.best = game.score;
      saveBest(game);
      if (audio) audio.over();
      return;
    }
  }

  // Wave clock.
  game.waveT += dt;
  if (game.waveT >= WAVES.length) {
    game.waveT = 0;
    game.wave++;
    game.score += 50 * game.wave;
    showBanner(game, `WAVE ${game.wave}`, game.wave === WAVES.dawnWave ? 'The sky begins to brighten' : 'The hawks grow bolder', 2.2);
    if (audio) audio.wave();
    if (game.wave === WAVES.dawnWave && !game.dawnShown) {
      game.dawnShown = true;
      game.score += WAVES.dawnBonus;
      showBanner(game, 'DAWN BREAKS', `+${WAVES.dawnBonus} — the flock survived the night`, 3.2);
      if (audio) audio.dawn();
    }
  }

  // Dawn brightness eases in after wave 6.
  if (game.dawnShown && game.world.dawn < 1) {
    game.world.dawn = Math.min(1, game.world.dawn + dt * 0.25);
  }

  if (game.banner) {
    game.banner.t += dt;
    if (game.banner.t > game.banner.dur) game.banner = null;
  }
}
