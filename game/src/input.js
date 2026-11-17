// STARLING — keyboard, mouse and touch input.
// Tracks the pointer target the lead bird steers toward, held keys, and
// edge-triggered presses (flare, restart, pause, mute) so the game logic
// never has to listen to the DOM itself.

export function createInput(canvas) {
  const input = {
    pointerX: 640,
    pointerY: 400,
    pointerDown: false,
    pointerActive: false, // true once the player has moved the pointer
    keys: new Set(),
    pressed: new Set(), // edge-triggered, cleared each frame by consume()
  };

  function toGame(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('pointermove', (e) => {
    const p = toGame(e);
    input.pointerX = p.x;
    input.pointerY = p.y;
    input.pointerActive = true;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const p = toGame(e);
    input.pointerX = p.x;
    input.pointerY = p.y;
    input.pointerActive = true;
    input.pointerDown = true;
    input.pressed.add('pointer');
  });
  window.addEventListener('pointerup', () => {
    input.pointerDown = false;
  });

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }
    if (!e.repeat) input.pressed.add(e.key.toLowerCase());
    input.keys.add(e.key.toLowerCase());
  });
  window.addEventListener('keyup', (e) => {
    input.keys.delete(e.key.toLowerCase());
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.pointerDown = false;
  });

  // The lead bird's steering target: pointer when the player uses it,
  // otherwise the arrow/WASD keys move an invisible target point.
  input.steerTarget = function steerTarget(dt, tx, ty) {
    const speed = 520;
    let x = tx;
    let y = ty;
    if (input.keys.has('arrowleft') || input.keys.has('a')) x -= speed * dt;
    if (input.keys.has('arrowright') || input.keys.has('d')) x += speed * dt;
    if (input.keys.has('arrowup') || input.keys.has('w')) y -= speed * dt;
    if (input.keys.has('arrowdown') || input.keys.has('s')) y += speed * dt;
    if (input.pointerActive) {
      x = input.pointerX;
      y = input.pointerY;
    }
    return { x, y };
  };

  input.wasPressed = function wasPressed(name) {
    return input.pressed.has(name);
  };

  input.consume = function consume() {
    input.pressed.clear();
  };

  return input;
}
