// STARLING — deterministic screenshot staging.
// ?shot=start|play|flare|end&seed=N builds a fixed, attractive scene and
// leaves the game frozen on it, so screenshots are reproducible and show
// the game at its best. Normal play (no query) never calls this.

import { VIEW } from './config.js';
import { makeRng, range } from './random.js';
import { startGame } from './game.js';
import { updateFlock, addBird } from './flock.js';
import { spawnSeed } from './seeds.js';
import { spawnHawk } from './hawks.js';
import { burst } from './world.js';

function simulate(game, seconds, step, steer) {
  // Step the flock along a smooth steering path without hawks or seeds
  // interfering, so the ribbon forms a pleasing curve.
  const t0 = game.time;
  for (let t = 0; t < seconds; t += step) {
    game.time += step;
    const target = steer(game.time - t0);
    updateFlock(game.flock, target, step, game.time, { x: 0, y: 0 });
  }
}

export function stageShot(game, shot, seed) {
  const rng = makeRng(seed);
  if (shot === 'start') {
    // Title over a live murmuration: grow the flock and let it flow.
    game.mode = 'title';
    for (let i = 0; i < 14; i++) addBird(game.flock, rng);
    simulate(game, 6, 1 / 60, (t) => ({
      x: 640 + Math.sin(t * 0.4) * 300,
      y: 480 + Math.sin(t * 0.8) * 80,
    }));
    return;
  }

  startGame(game);
  game.mode = 'playing';
  // A busy mid-game: a big flock, seeds scattered, hawks circling.
  for (let i = 0; i < 16; i++) addBird(game.flock, rng);
  for (let i = 0; i < 9; i++) spawnSeed(game.seeds, rng, { x: 0, y: 0 });
  for (const s of game.seeds.list) {
    s.x = range(rng, 120, VIEW.width - 120);
    s.y = range(rng, 120, VIEW.height - 200);
  }
  for (let i = 0; i < 3; i++) spawnHawk(game.hawks, rng);
  game.hawks.list[0].x = 980;
  game.hawks.list[0].y = 220;
  game.hawks.list[0].state = 'lock';
  game.hawks.list[1].x = 240;
  game.hawks.list[1].y = 560;
  game.hawks.list[1].state = 'cruise';
  game.hawks.list[2].x = 1120;
  game.hawks.list[2].y = 620;
  game.hawks.list[2].state = 'cruise';
  game.score = 1240;
  game.wave = 3;
  game.waveT = 14;
  game.combo = 6;
  game.comboT = 2.1;
  game.maxCombo = 1.6;
  game.seedsEaten = 31;
  simulate(game, 2.5, 1 / 60, (t) => ({
    x: 640 + Math.sin(t * 0.5) * 220,
    y: 400 + Math.cos(t * 0.6) * 110,
  }));

  if (shot === 'flare') {
    // The flare pulse going off with a hawk repelled beside it.
    const lead = game.flock.birds[0];
    game.flare.active = true;
    game.flare.t = 0.3;
    game.flare.x = lead.x;
    game.flare.y = lead.y;
    game.flare.cooldown = 1.8;
    game.hawks.list[0].state = 'flee';
    game.hawks.list[0].stun = 1.4;
    burst(game.world, lead.x, lead.y, '#9fe8ff', 26, 320);
    burst(game.world, 980, 220, '#ffd76a', 14, 200);
    game.banner = { text: 'WAVE 4', sub: 'The hawks grow bolder', t: 0.6, dur: 2.2 };
    game.wave = 4;
    return;
  }

  if (shot === 'end') {
    // Game over after a long run: high score, new best.
    game.mode = 'over';
    game.score = 4860;
    game.best = 4860;
    game.isNewBest = true;
    game.wave = 5;
    game.seedsEaten = 87;
    game.maxCombo = 2.4;
    game.flock.birds.length = 0;
    return;
  }

  // shot === 'play': the busy mid-game scene above, as staged.
}
