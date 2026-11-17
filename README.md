# STARLING — lead the murmuration

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/usb-star001/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/usb-star001/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

**STARLING** is a murmuration game: you lead a flock of starlings across a
dusk sky. Steer with the mouse or arrow keys, gather golden seeds to grow
your flock, and outfly the hawks that dive at it. Your flock is your health
— every hawk strike costs a bird, and when the last bird falls the sky goes
dark. A flare (Space or click) repels nearby hawks, waves rise every 25
seconds, wind gusts push the flock sideways, and surviving to wave 6 breaks
the dawn.

## How to play

| Control | Action |
|---|---|
| Mouse / Arrow keys / WASD | Steer the lead bird; the flock follows |
| Space / Click | Flare — a pulse of light that repels hawks (3s cooldown) |
| P | Pause |
| M | Mute |
| R | Restart after game over |

Seeds grow the flock by one bird and build a combo (up to 3x score).
Hawks lock on, telegraph with a red ring, then dive. Reach wave 6 for the
dawn bonus of +1000 points.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network requests, no assets: everything is drawn on a
2D canvas and every sound is synthesized with the Web Audio API.

## Layout

- `game/index.html` — the page, canvas only
- `game/src/main.js` — frame loop, keys, screenshot staging
- `game/src/game.js` — state machine: title, playing, paused, game over
- `game/src/flock.js` — murmuration physics (follow-the-leader ribbon)
- `game/src/seeds.js` — golden seeds: spawn, drift, collect
- `game/src/hawks.js` — hawk AI: cruise, lock-on, dive, flee
- `game/src/world.js` — sky, stars, aurora, hills, gusts, particles
- `game/src/render.js` — all drawing: scene, HUD, title and end screens
- `game/src/input.js` — mouse, keyboard and touch
- `game/src/audio.js` — synthesized sound effects and wind pad
- `game/src/config.js` — tuning and palette
- `game/src/random.js` — seeded RNG for deterministic screenshots
- `game/src/shots.js` — staged scenes for the screenshots

## Enter it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Built for the [make.fun bounty](https://make.fun/bounty/best-game-01)
($1,000 total, judged pairwise by an AI judge on screenshots and source).
