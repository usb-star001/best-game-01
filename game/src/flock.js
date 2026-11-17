// STARLING — the murmuration itself.
// The lead bird steers toward the player's target. Every other bird holds
// a slot in a loose cloud around the leader (golden-angle spiral, stretched
// along the direction of travel), easing toward it with a flutter — so the
// flock reads as a flowing cloud, never a stretched line or a stacked blob.
// The flock's size is the player's health: hawks eat birds, seeds grow it.

import { FLOCK, VIEW } from './config.js';

function slotFor(i) {
  // Golden-angle spiral: even coverage, denser near the leader.
  const r = Math.min(88, 15 * Math.sqrt(i + 1));
  const a = i * 2.399963;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.72 };
}

function makeBird(x, y, phase) {
  return {
    x,
    y,
    px: x,
    py: y,
    vx: 0,
    vy: 0,
    phase,
    wing: 0,
    angle: 0,
    slot: slotFor(0),
  };
}

export function createFlock(x, y, count) {
  const birds = [];
  for (let i = 0; i < count; i++) {
    const b = makeBird(x - i * 8, y + Math.sin(i * 0.9) * 12, i * 0.7);
    b.slot = slotFor(i);
    birds.push(b);
  }
  return {
    birds,
    invuln: 0, // seconds of post-hit safety left
    trail: [], // fading ribbon points behind the lead bird
    heading: 0, // the leader's direction of travel
  };
}

export function flockCount(flock) {
  return flock.birds.length;
}

export function addBird(flock, rng) {
  if (flock.birds.length >= FLOCK.maxBirds) return false;
  const i = flock.birds.length;
  const lead = flock.birds[0];
  const b = makeBird(
    (lead ? lead.x : 640) + (rng() - 0.5) * 60,
    (lead ? lead.y : 400) + (rng() - 0.5) * 60,
    i * 0.7,
  );
  b.slot = slotFor(i);
  flock.birds.push(b);
  return true;
}

export function removeBird(flock) {
  // A hawk strike takes the bird farthest from the leader: the cloud
  // visibly thins from its edge.
  const birds = flock.birds;
  if (birds.length <= 1) return birds.pop() || null;
  const lead = birds[0];
  let worst = 1;
  let worstD = -1;
  for (let i = 1; i < birds.length; i++) {
    const d = Math.hypot(birds[i].x - lead.x, birds[i].y - lead.y);
    if (d > worstD) { worstD = d; worst = i; }
  }
  return birds.splice(worst, 1)[0];
}

export function updateFlock(flock, target, dt, time, wind) {
  const birds = flock.birds;
  if (birds.length === 0) return;
  if (flock.invuln > 0) flock.invuln -= dt;

  // Lead bird: ease toward the target at a capped speed.
  const lead = birds[0];
  const dx = target.x - lead.x;
  const dy = target.y - lead.y;
  const dist = Math.hypot(dx, dy) || 1;
  const step = Math.min(dist, FLOCK.leadSpeed * dt);
  lead.px = lead.x;
  lead.py = lead.y;
  lead.x += (dx / dist) * step + wind.x * dt * 0.35;
  lead.y += (dy / dist) * step + wind.y * dt * 0.35;
  lead.x = Math.max(16, Math.min(VIEW.width - 16, lead.x));
  lead.y = Math.max(16, Math.min(VIEW.height - 16, lead.y));
  lead.vx = (lead.x - lead.px) / Math.max(dt, 0.001);
  lead.vy = (lead.y - lead.py) / Math.max(dt, 0.001);
  if (Math.hypot(lead.vx, lead.vy) > 30) {
    flock.heading = Math.atan2(lead.vy, lead.vx);
  }
  lead.angle = flock.heading;
  lead.wing = Math.sin(time * 14) * 0.9;

  // Followers: ease toward their slot in the cloud, stretched along the
  // heading, with a slow individual flutter so the cloud breathes.
  const ch = Math.cos(flock.heading);
  const sh = Math.sin(flock.heading);
  for (let i = 1; i < birds.length; i++) {
    const b = birds[i];
    b.px = b.x;
    b.py = b.y;
    const flutter = Math.sin(time * 2.1 + b.phase * 1.7) * 10;
    // Slot rotated into the heading frame, stretched along travel.
    const sx = b.slot.x * 1.5;
    const sy = b.slot.y * 0.8;
    const rx = sx * ch - sy * sh;
    const ry = sx * sh + sy * ch;
    const tx = lead.x + rx - sh * flutter;
    const ty = lead.y + ry + ch * flutter;
    const ease = Math.min(1, dt * 5.5);
    b.x += (tx - b.x) * ease + wind.x * dt * 0.3;
    b.y += (ty - b.y) * ease + wind.y * dt * 0.3;
    b.vx = (b.x - b.px) / Math.max(dt, 0.001);
    b.vy = (b.y - b.py) / Math.max(dt, 0.001);
    if (Math.hypot(b.vx, b.vy) > 30) b.angle = Math.atan2(b.vy, b.vx);
    b.wing = Math.sin(time * 14 + b.phase) * 0.9;
  }

  // Ribbon trail behind the lead bird, fading over ~0.5s.
  flock.trail.unshift({ x: lead.x, y: lead.y, life: 1 });
  for (const p of flock.trail) p.life -= dt * 2.2;
  while (flock.trail.length && flock.trail[flock.trail.length - 1].life <= 0) {
    flock.trail.pop();
  }
  if (flock.trail.length > 42) flock.trail.length = 42;
}
