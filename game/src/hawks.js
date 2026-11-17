// STARLING — hawks.
// A hawk circles at the edge, locks onto the flock, telegraphs with a red
// glint, then dives at the nearest bird. A flare pulse repels every hawk
// inside its radius and stuns it; a hawk that strikes a bird is thrown back
// off-screen and the flock gets a short moment of safety.

import { HAWKS, VIEW } from './config.js';
import { range } from './random.js';

export function createHawks() {
  return { list: [], timer: 5.0 };
}

export function spawnHawk(hawks, rng) {
  const edge = Math.floor(rng() * 4);
  let x;
  let y;
  if (edge === 0) { x = range(rng, 80, VIEW.width - 80); y = -30; }
  else if (edge === 1) { x = range(rng, 80, VIEW.width - 80); y = VIEW.height + 30; }
  else if (edge === 2) { x = -30; y = range(rng, 80, VIEW.height - 80); }
  else { x = VIEW.width + 30; y = range(rng, 80, VIEW.height - 80); }
  hawks.list.push({
    x,
    y,
    vx: 0,
    vy: 0,
    state: 'cruise', // cruise -> lock -> dive -> flee
    stateT: 0,
    target: null,
    wing: 0,
    stun: 0,
  });
}

export function updateHawks(hawks, dt, wave, flock, rng, time, flareActive, flareX, flareY) {
  const interval = Math.max(HAWKS.spawnMin, HAWKS.spawnEvery - wave * 0.35);
  hawks.timer -= dt;
  if (hawks.timer <= 0 && hawks.list.length < HAWKS.maxAlive) {
    hawks.timer = interval;
    spawnHawk(hawks, rng);
  }

  const birds = flock.birds;
  for (let i = hawks.list.length - 1; i >= 0; i--) {
    const h = hawks.list[i];
    h.wing = Math.sin(time * 10 + i * 2) * 0.8;
    if (h.stun > 0) {
      h.stun -= dt;
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      continue;
    }

    // A flare pulse repels every hawk caught inside it.
    if (flareActive) {
      const d = Math.hypot(h.x - flareX, h.y - flareY);
      if (d < HAWKS.repelRadius) {
        h.state = 'flee';
        h.stateT = 0;
        const a = Math.atan2(h.y - flareY, h.x - flareX);
        h.vx = Math.cos(a) * 520;
        h.vy = Math.sin(a) * 520;
        h.stun = HAWKS.stunTime;
        continue;
      }
    }

    if (birds.length === 0) {
      h.state = 'cruise';
    }

    if (h.state === 'cruise') {
      h.stateT += dt;
      // Drift toward the flock's middle until close enough to lock on.
      const mid = birds[Math.floor(birds.length / 2)] || { x: VIEW.width / 2, y: VIEW.height / 2 };
      const a = Math.atan2(mid.y - h.y, mid.x - h.x);
      h.vx += Math.cos(a) * 160 * dt;
      h.vy += Math.sin(a) * 160 * dt;
      const sp = Math.hypot(h.vx, h.vy) || 1;
      const cap = HAWKS.cruiseSpeed + wave * 12;
      if (sp > cap) { h.vx = (h.vx / sp) * cap; h.vy = (h.vy / sp) * cap; }
      if (Math.hypot(mid.x - h.x, mid.y - h.y) < HAWKS.lockRadius || h.stateT > 3.5) {
        h.state = 'lock';
        h.stateT = 0;
      }
    } else if (h.state === 'lock') {
      // Telegraph: hover and glint for 0.7s, then dive at a chosen bird.
      h.stateT += dt;
      h.vx *= 0.94;
      h.vy *= 0.94;
      if (h.stateT > 0.7) {
        h.state = 'dive';
        h.stateT = 0;
        h.target = birds.length ? birds[Math.floor(rng() * birds.length)] : null;
      }
    } else if (h.state === 'dive') {
      h.stateT += dt;
      const t = h.target && birds.includes(h.target)
        ? h.target
        : (birds[0] || { x: VIEW.width / 2, y: VIEW.height / 2 });
      const a = Math.atan2(t.y - h.y, t.x - h.x);
      const sp = HAWKS.diveSpeed + wave * 14;
      h.vx = Math.cos(a) * sp;
      h.vy = Math.sin(a) * sp;
      if (h.stateT > 1.6) {
        h.state = 'flee';
        h.stateT = 0;
      }
    } else if (h.state === 'flee') {
      // Fly away from the flock, then leave the screen.
      h.stateT += dt;
      const mid = birds[Math.floor(birds.length / 2)] || { x: VIEW.width / 2, y: VIEW.height / 2 };
      const a = Math.atan2(h.y - mid.y, h.x - mid.x);
      h.vx = Math.cos(a) * 420;
      h.vy = Math.sin(a) * 420;
    }

    h.x += h.vx * dt;
    h.y += h.vy * dt;
    if (h.x < -70 || h.x > VIEW.width + 70 || h.y < -70 || h.y > VIEW.height + 70) {
      hawks.list.splice(i, 1);
    }
  }
}

// Returns the birds a diving hawk struck this frame (at most one per hawk).
export function hawkStrikes(hawks, flock) {
  const struck = [];
  if (flock.invuln > 0) return struck;
  for (const h of hawks.list) {
    if (h.state !== 'dive') continue;
    for (const b of flock.birds) {
      if (Math.hypot(h.x - b.x, h.y - b.y) < HAWKS.strikeRadius) {
        struck.push(b);
        h.state = 'flee';
        h.stateT = 0;
        break;
      }
    }
    if (struck.length) break;
  }
  return struck;
}
