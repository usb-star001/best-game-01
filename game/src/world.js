// STARLING — the living sky: stars, aurora ribbons, drifting hills, wind
// gusts and the particle bursts that make every action visible.
// Everything here is drawn procedurally; the game ships no image assets.

import { PALETTE, VIEW } from './config.js';
import { makeRng, range } from './random.js';

export function createWorld(seed) {
  const rng = makeRng(seed);
  const stars = [];
  for (let i = 0; i < 130; i++) {
    stars.push({
      x: rng() * VIEW.width,
      y: rng() * VIEW.height * 0.62,
      r: range(rng, 0.6, 1.9),
      tw: range(rng, 0.5, 2.4),
      ph: rng() * Math.PI * 2,
    });
  }
  const aurora = [];
  for (let i = 0; i < 3; i++) {
    aurora.push({
      baseY: 90 + i * 70,
      amp: 26 + i * 12,
      speed: 0.11 + i * 0.05,
      ph: rng() * Math.PI * 2,
      color: i % 2 ? PALETTE.auroraB : PALETTE.auroraA,
    });
  }
  const hillsFar = [];
  const hillsNear = [];
  for (let x = 0; x <= VIEW.width + 80; x += 80) {
    hillsFar.push({ x, y: VIEW.height - 118 + Math.sin(x * 0.008) * 26 });
    hillsNear.push({ x, y: VIEW.height - 46 + Math.sin(x * 0.011 + 2) * 18 });
  }
  return {
    stars,
    aurora,
    hillsFar,
    hillsNear,
    particles: [],
    gusts: [], // visible wind streaks
    shake: 0, // screen-shake magnitude, decays each frame
    dawn: 0, // 0 = dusk, 1 = full dawn brightness after wave 6
  };
}

export function burst(world, x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.3 + Math.random() * 0.7);
    world.particles.push({
      x,
      y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.6 + Math.random() * 0.5,
      maxLife: 1.1,
      r: 1.5 + Math.random() * 2.5,
      color,
    });
  }
}

export function addGust(world, rng) {
  const dir = rng() > 0.5 ? 1 : -1;
  world.gusts.push({ dir, x: dir > 0 ? -80 : VIEW.width + 80, life: 2.6 });
}

export function updateWorld(world, dt, time) {
  for (let i = world.particles.length - 1; i >= 0; i--) {
    const p = world.particles[i];
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.985;
    p.vy *= 0.985;
    if (p.life <= 0) world.particles.splice(i, 1);
  }
  for (let i = world.gusts.length - 1; i >= 0; i--) {
    const g = world.gusts[i];
    g.life -= dt;
    g.x += g.dir * 620 * dt;
    if (g.life <= 0) world.gusts.splice(i, 1);
  }
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 26);
}

// The sky gradient, brightening as dawn approaches.
export function skyGradient(ctx, dawn) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  const mix = (a, b, t) => {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * t);
    const gg = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * t);
    const bb = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * t);
    return `rgb(${r},${gg},${bb})`;
  };
  g.addColorStop(0, mix(PALETTE.skyTop, '#3a2f66', dawn * 0.7));
  g.addColorStop(0.55, mix(PALETTE.skyMid, '#7a4a72', dawn * 0.7));
  g.addColorStop(0.8, mix(PALETTE.skyLow, '#c65a4e', dawn));
  g.addColorStop(1, mix(PALETTE.sunset, '#ffc46b', dawn));
  return g;
}
