// STARLING — golden seeds.
// Seeds drift in from the edges on the wind. Collecting one grows the flock
// by a bird, scores, and raises the combo while the combo window holds.
// A seed that drifts off-screen is gone for good.

import { SEEDS, VIEW } from './config.js';
import { range } from './random.js';

export function createSeeds() {
  return { list: [], timer: 0.4 };
}

export function spawnSeed(seeds, rng, wind) {
  // Starlight falls anywhere in the sky, not only at the edges: a seed
  // that only creeps in from the border would rarely meet the flock.
  const x = range(rng, 50, VIEW.width - 50);
  const y = range(rng, 50, VIEW.height - 120);
  seeds.list.push({
    x,
    y,
    vx: (rng() - 0.5) * 30,
    vy: (rng() - 0.5) * 30,
    r: 9,
    pulse: rng() * Math.PI * 2,
    age: 0,
  });
}

export function updateSeeds(seeds, dt, wind, wave, rng, time) {
  const interval = Math.max(SEEDS.spawnMin, SEEDS.spawnEvery - wave * 0.04);
  seeds.timer -= dt;
  if (seeds.timer <= 0) {
    seeds.timer = interval;
    spawnSeed(seeds, rng, wind);
  }
  for (let i = seeds.list.length - 1; i >= 0; i--) {
    const s = seeds.list[i];
    s.age += dt;
    s.pulse += dt * 5;
    s.x += (s.vx + wind.x * 0.5 + SEEDS.driftSpeed * 0.4) * dt;
    s.y += (s.vy + wind.y * 0.5) * dt;
    if (s.x < -40 || s.x > VIEW.width + 40 || s.y < -40 || s.y > VIEW.height + 40) {
      seeds.list.splice(i, 1);
    }
  }
}

// Seeds near the lead bird drift toward it, so collecting feels generous.
export function magnetSeeds(seeds, flock, dt) {
  const lead = flock.birds[0];
  if (!lead) return;
  for (const s of seeds.list) {
    const dx = lead.x - s.x;
    const dy = lead.y - s.y;
    const d = Math.hypot(dx, dy);
    if (d > 0 && d < SEEDS.magnetRadius) {
      const pull = SEEDS.magnetPull * (1 - d / SEEDS.magnetRadius) * dt;
      s.x += (dx / d) * pull;
      s.y += (dy / d) * pull;
    }
  }
}

// Returns the seeds the flock's lead bird collected this frame.
export function collectSeeds(seeds, flock) {
  const lead = flock.birds[0];
  if (!lead) return [];
  const got = [];
  for (let i = seeds.list.length - 1; i >= 0; i--) {
    const s = seeds.list[i];
    if (Math.hypot(s.x - lead.x, s.y - lead.y) < SEEDS.collectRadius) {
      got.push(s);
      seeds.list.splice(i, 1);
    }
  }
  return got;
}
