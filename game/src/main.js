// STARLING — entry point: canvas setup, the frame loop, and the keys that
// drive the state machine. Also honours ?shot=start|play|flare|end&seed=N,
// which stages a deterministic scene for screenshots (see shots.js).

import { VIEW } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createGame, startGame, loadBest, updateGame, fireFlare } from './game.js';
import { drawScene, drawHud, drawTitle, drawGameOver, drawPaused, drawBanner } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || 7);

const input = createInput(canvas);
const audio = createAudio();
const game = createGame(seed);
loadBest(game);
window.__starling = game; // play-test hook: lets automation read the state.

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Global keys.
  if (input.wasPressed('m')) audio.toggleMute();
  if (input.wasPressed('p') && (game.mode === 'playing' || game.mode === 'paused')) {
    game.mode = game.mode === 'playing' ? 'paused' : 'playing';
  }
  if (input.wasPressed(' ') || input.wasPressed('pointer')) {
    audio.ensure();
    if (game.mode === 'playing') fireFlare(game, audio);
  }
  if (input.wasPressed('enter') && game.mode === 'title') {
    audio.ensure();
    startGame(game);
  }
  if (input.wasPressed('pointer') && game.mode === 'title') {
    audio.ensure();
    startGame(game);
  }
  if ((input.wasPressed('r') || input.wasPressed('pointer') || input.wasPressed('enter'))
      && game.mode === 'over') {
    audio.ensure();
    startGame(game);
  }

  updateGame(game, input, audio, dt);

  drawScene(ctx, game, game.time);
  if (game.mode === 'playing' || game.mode === 'paused') drawHud(ctx, game);
  if (game.mode === 'title') drawTitle(ctx, game, game.time);
  if (game.mode === 'over') drawGameOver(ctx, game);
  if (game.mode === 'paused') drawPaused(ctx);
  if (game.banner && game.mode === 'playing') {
    const a = game.banner.t < 0.3
      ? game.banner.t / 0.3
      : game.banner.t > game.banner.dur - 0.5 ? (game.banner.dur - game.banner.t) / 0.5 : 1;
    drawBanner(ctx, game.banner.text, game.banner.sub, Math.max(0, Math.min(1, a)));
  }

  input.consume();
  requestAnimationFrame(frame);
}

// Staged screenshots: build a fixed scene, then freeze on it.
if (shot) {
  stageShot(game, shot, seed);
  drawScene(ctx, game, game.time);
  if (game.mode === 'playing') drawHud(ctx, game);
  if (game.mode === 'title') drawTitle(ctx, game, game.time);
  if (game.mode === 'over') drawGameOver(ctx, game);
  if (game.banner) drawBanner(ctx, game.banner.text, game.banner.sub, 1);
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}
