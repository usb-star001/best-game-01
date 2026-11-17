// STARLING — everything the player sees.
// Canvas 2D only: gradient sky, twinkling stars, aurora ribbons, hill
// silhouettes, the glowing flock ribbon, golden seeds, diving hawks, the
// flare pulse, particles, and the HUD plus title / game-over screens.
// All text uses the system font stack so the game loads nothing.

import { PALETTE, VIEW, FLARE } from './config.js';
import { skyGradient } from './world.js';

const FONT = "'Trebuchet MS', 'Segoe UI', Verdana, sans-serif";

function pill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

function drawBird(ctx, x, y, angle, scale, glow, wing, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  if (glow) {
    ctx.shadowColor = PALETTE.birdGlow;
    ctx.shadowBlur = 14;
  }
  // Teardrop body with a swept wing.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(12, 0);
  ctx.quadraticCurveTo(2, -7, -9, -3);
  ctx.quadraticCurveTo(-12, 0, -9, 3);
  ctx.quadraticCurveTo(2, 7, 12, 0);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(20, 24, 48, 0.85)';
  ctx.beginPath();
  ctx.arc(8, -1.5, 1.6, 0, Math.PI * 2);
  ctx.fill();
  // Wing, flapping with the bird's phase.
  ctx.fillStyle = 'rgba(255, 233, 176, 0.75)';
  ctx.beginPath();
  ctx.moveTo(-2, 0);
  ctx.quadraticCurveTo(-6, -8 - wing * 7, -13, -10 - wing * 9);
  ctx.quadraticCurveTo(-8, -2, -2, 1);
  ctx.fill();
  ctx.restore();
}

export function drawScene(ctx, state, time) {
  const { world, flock, seeds, hawks, flare } = state;
  ctx.save();
  if (world.shake > 0.4) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }

  // Sky.
  ctx.fillStyle = skyGradient(ctx, world.dawn);
  ctx.fillRect(-20, -20, VIEW.width + 40, VIEW.height + 40);

  // Stars, twinkling, fading as dawn breaks.
  ctx.fillStyle = PALETTE.star;
  for (const s of world.stars) {
    const a = (0.35 + 0.65 * Math.abs(Math.sin(time * s.tw + s.ph))) * (1 - world.dawn * 0.85);
    if (a < 0.05) continue;
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Aurora ribbons.
  for (const au of world.aurora) {
    ctx.strokeStyle = au.color;
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = -40; x <= VIEW.width + 40; x += 40) {
      const y = au.baseY + Math.sin(x * 0.006 + time * au.speed + au.ph) * au.amp;
      if (x === -40) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Sunset glow at the horizon.
  const sun = ctx.createRadialGradient(VIEW.width * 0.72, VIEW.height * 0.86, 10, VIEW.width * 0.72, VIEW.height * 0.86, 540);
  sun.addColorStop(0, `rgba(255, 178, 102, ${0.38 + world.dawn * 0.35})`);
  sun.addColorStop(1, 'rgba(255, 126, 95, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, VIEW.height - 460, VIEW.width, 460);

  // Hill silhouettes.
  ctx.fillStyle = PALETTE.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height);
  for (const h of world.hillsFar) ctx.lineTo(h.x, h.y);
  ctx.lineTo(VIEW.width, VIEW.height);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, VIEW.height);
  for (const h of world.hillsNear) ctx.lineTo(h.x, h.y);
  ctx.lineTo(VIEW.width, VIEW.height);
  ctx.closePath();
  ctx.fill();

  // Wind gust streaks.
  for (const g of world.gusts) {
    ctx.strokeStyle = `rgba(200, 220, 255, ${0.28 * (g.life / 2.6)})`;
    ctx.lineWidth = 2;
    for (let k = 0; k < 5; k++) {
      const y = 120 + k * 130 + Math.sin(time + k) * 20;
      ctx.beginPath();
      ctx.moveTo(g.x - g.dir * 120, y);
      ctx.lineTo(g.x + g.dir * 60, y);
      ctx.stroke();
    }
  }

  // Flock ribbon trail.
  const trail = flock.trail;
  if (trail.length > 1) {
    ctx.strokeStyle = 'rgba(255, 220, 140, 0.35)';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(trail[0].x, trail[0].y);
    for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
    ctx.stroke();
  }

  // Seeds.
  for (const s of seeds.list) {
    const pulse = 1 + Math.sin(s.pulse) * 0.18;
    ctx.save();
    ctx.shadowColor = PALETTE.seedGlow;
    ctx.shadowBlur = 16;
    ctx.fillStyle = PALETTE.seed;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(s.x, s.y, (s.r + 5) * pulse, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Hawks.
  for (const h of hawks.list) {
    const angle = Math.atan2(h.vy, h.vx);
    const flashing = h.state === 'lock' && Math.sin(time * 18) > 0;
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(angle);
    ctx.shadowColor = 'rgba(229, 72, 77, 0.7)';
    ctx.shadowBlur = 14;
    ctx.fillStyle = flashing ? '#ff7070' : PALETTE.hawk;
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.quadraticCurveTo(4, -9, -14, -5);
    ctx.quadraticCurveTo(-20, 0, -14, 5);
    ctx.quadraticCurveTo(4, 9, 20, 0);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Swept wings.
    ctx.fillStyle = PALETTE.hawkDark;
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-10, -16 - h.wing * 10, -24, -20 - h.wing * 12);
    ctx.quadraticCurveTo(-14, -4, -2, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.quadraticCurveTo(-10, 16 + h.wing * 10, -24, 20 + h.wing * 12);
    ctx.quadraticCurveTo(-14, 4, -2, -2);
    ctx.fill();
    // Eye.
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(12, -2, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // Lock-on telegraph ring.
    if (h.state === 'lock') {
      ctx.strokeStyle = `rgba(255, 93, 93, ${0.5 + 0.4 * Math.sin(time * 18)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 30 + Math.sin(time * 10) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // The flock, rearmost first so the lead bird draws on top.
  const flashing = flock.invuln > 0 && Math.sin(time * 24) > 0;
  for (let i = flock.birds.length - 1; i >= 0; i--) {
    const b = flock.birds[i];
    const scale = i === 0 ? 1.15 : 1;
    drawBird(ctx, b.x, b.y, b.angle || 0, scale, i === 0, b.wing, flashing ? '#cfe6ff' : PALETTE.bird);
  }

  // Flare pulse.
  if (flare.active) {
    const p = 1 - flare.t / (FLARE.pulseMs / 1000);
    const r = FLARE.radius * (1 - p * 0.4);
    const grad = ctx.createRadialGradient(flare.x, flare.y, 10, flare.x, flare.y, r);
    grad.addColorStop(0, `rgba(140, 220, 255, ${0.55 * p})`);
    grad.addColorStop(1, 'rgba(140, 220, 255, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(flare.x, flare.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(200, 240, 255, ${0.8 * p})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(flare.x, flare.y, r * 0.85, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Particles.
  for (const p of world.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Vignette.
  const vg = ctx.createRadialGradient(640, 400, 320, 640, 400, 780);
  vg.addColorStop(0, 'rgba(6, 8, 24, 0)');
  vg.addColorStop(1, 'rgba(6, 8, 24, 0.42)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.restore();
}

export function drawHud(ctx, state) {
  const { score, best, wave, waveT, combo, comboT, flare, flock } = state;
  ctx.save();
  ctx.textBaseline = 'middle';

  // Score, top left.
  ctx.fillStyle = PALETTE.hudPill;
  pill(ctx, 18, 16, 250, 64, 14);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `700 30px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(String(score).padStart(6, '0'), 34, 42);
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = 'rgba(255, 246, 221, 0.75)';
  ctx.fillText(`BEST ${String(best).padStart(6, '0')}`, 34, 66);

  // Wave, top center.
  ctx.fillStyle = PALETTE.hudPill;
  pill(ctx, VIEW.width / 2 - 110, 16, 220, 64, 14);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `700 22px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${wave}`, VIEW.width / 2, 40);
  ctx.fillStyle = 'rgba(255, 246, 221, 0.35)';
  pill(ctx, VIEW.width / 2 - 84, 58, 168, 7, 4);
  ctx.fillStyle = PALETTE.seed;
  pill(ctx, VIEW.width / 2 - 84, 58, 168 * Math.min(1, waveT / 25), 7, 4);

  // Flock + flare, top right.
  ctx.fillStyle = PALETTE.hudPill;
  pill(ctx, VIEW.width - 268, 16, 250, 64, 14);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = `700 22px ${FONT}`;
  ctx.textAlign = 'right';
  ctx.fillText(`FLOCK ${flock.birds.length}`, VIEW.width - 34, 40);
  const cd = Math.max(0, flare.cooldown);
  ctx.font = `600 13px ${FONT}`;
  ctx.fillStyle = cd === 0 ? '#9fe8ff' : 'rgba(255, 246, 221, 0.75)';
  ctx.fillText(cd === 0 ? 'FLARE READY  [SPACE]' : `FLARE ${cd.toFixed(1)}s`, VIEW.width - 34, 66);

  // Combo meter, under the score.
  if (combo > 1 && comboT > 0) {
    const mult = (1 + Math.min(combo, 20) * 0.1).toFixed(1);
    ctx.fillStyle = PALETTE.hudPill;
    pill(ctx, 18, 92, 170, 40, 12);
    ctx.fillStyle = PALETTE.seed;
    ctx.font = `700 20px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText(`COMBO x${mult}`, 32, 112);
    ctx.fillStyle = 'rgba(255, 215, 106, 0.4)';
    pill(ctx, 18, 128, 170 * Math.min(1, comboT / 3), 5, 3);
  }

  ctx.restore();
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW.width / 2, y);
}

export function drawTitle(ctx, state, time) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 12, 32, 0.38)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  const bob = Math.sin(time * 1.4) * 8;
  centerText(ctx, 'S T A R L I N G', 250 + bob, `700 84px ${FONT}`, PALETTE.hudText);
  ctx.shadowColor = PALETTE.birdGlow;
  ctx.shadowBlur = 26;
  centerText(ctx, 'S T A R L I N G', 250 + bob, `700 84px ${FONT}`, PALETTE.hudText);
  ctx.shadowBlur = 0;
  centerText(ctx, 'Lead the murmuration. Gather the light. Outfly the hawks.', 316, `400 24px ${FONT}`, 'rgba(255, 246, 221, 0.9)');
  centerText(ctx, 'MOUSE or ARROWS — steer the flock      SPACE or CLICK — flare, repel the hawks', 430, `600 19px ${FONT}`, '#cfe6ff');
  centerText(ctx, 'Golden seeds grow your flock. A hawk strike costs a bird.', 462, `400 18px ${FONT}`, 'rgba(255, 246, 221, 0.8)');
  centerText(ctx, 'Lose every bird and the sky goes dark. Reach wave 6 and dawn breaks.', 490, `400 18px ${FONT}`, 'rgba(255, 246, 221, 0.8)');
  const pulse = 0.65 + 0.35 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'CLICK OR PRESS ENTER TO FLY', 590, `700 26px ${FONT}`, PALETTE.seed);
  ctx.globalAlpha = 1;
  centerText(ctx, 'P pause    ·    M mute    ·    R restart', 660, `400 15px ${FONT}`, 'rgba(255, 246, 221, 0.6)');
  ctx.restore();
}

export function drawGameOver(ctx, state) {
  const { score, best, wave, seedsEaten, maxCombo, isNewBest } = state;
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 28, 0.62)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  centerText(ctx, 'THE SKY GOES DARK', 210, `700 64px ${FONT}`, PALETTE.hudText);
  if (isNewBest) {
    centerText(ctx, '★ NEW BEST ★', 280, `700 26px ${FONT}`, PALETTE.seed);
  }
  centerText(ctx, String(score).padStart(6, '0'), 370, `700 72px ${FONT}`, PALETTE.seed);
  centerText(ctx, `WAVE ${wave}   ·   ${seedsEaten} SEEDS   ·   BEST COMBO x${maxCombo.toFixed(1)}`, 448, `600 20px ${FONT}`, 'rgba(255, 246, 221, 0.85)');
  centerText(ctx, `BEST ${String(best).padStart(6, '0')}`, 486, `400 18px ${FONT}`, 'rgba(255, 246, 221, 0.7)');
  const pulse = 0.65 + 0.35 * Math.sin(performance.now() / 300);
  ctx.globalAlpha = pulse;
  centerText(ctx, 'PRESS R OR CLICK TO FLY AGAIN', 580, `700 26px ${FONT}`, PALETTE.hudText);
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawPaused(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 10, 28, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  centerText(ctx, 'PAUSED', 380, `700 56px ${FONT}`, PALETTE.hudText);
  centerText(ctx, 'Press P to keep flying', 450, `400 20px ${FONT}`, 'rgba(255, 246, 221, 0.85)');
  ctx.restore();
}

export function drawBanner(ctx, text, sub, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  centerText(ctx, text, 330, `700 54px ${FONT}`, PALETTE.seed);
  ctx.shadowColor = PALETTE.seedGlow;
  ctx.shadowBlur = 22;
  centerText(ctx, text, 330, `700 54px ${FONT}`, PALETTE.seed);
  ctx.shadowBlur = 0;
  if (sub) centerText(ctx, sub, 386, `600 22px ${FONT}`, PALETTE.hudText);
  ctx.restore();
}
