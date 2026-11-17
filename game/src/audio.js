// STARLING — synthesized sound with the Web Audio API.
// No audio files: every effect is an oscillator/noise envelope built at
// run time, and a soft wind pad loops under the game. Audio starts only
// after the first user gesture (browsers require it), so the title screen
// stays silent until the player presses a key or clicks.

export function createAudio() {
  const audio = {
    ctx: null,
    master: null,
    muted: false,
    padNodes: null,
  };

  audio.ensure = function ensure() {
    if (audio.ctx) {
      if (audio.ctx.state === 'suspended') audio.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio.ctx = new Ctx();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.5;
    audio.master.connect(audio.ctx.destination);
    audio.startPad();
  };

  audio.toggleMute = function toggleMute() {
    audio.muted = !audio.muted;
    if (audio.master) audio.master.gain.value = audio.muted ? 0 : 0.5;
    return audio.muted;
  };

  function tone(freq, dur, type, vol, slideTo) {
    if (!audio.ctx || audio.muted) return;
    const t = audio.ctx.currentTime;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function noise(dur, vol, filterFreq) {
    if (!audio.ctx || audio.muted) return;
    const t = audio.ctx.currentTime;
    const len = Math.floor(audio.ctx.sampleRate * dur);
    const buffer = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = audio.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = audio.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    src.start(t);
  }

  // A soft two-note chime, rising a semitone with the combo.
  audio.seed = function seed(combo) {
    const base = 660 * Math.pow(2, Math.min(combo, 12) / 24);
    tone(base, 0.18, 'sine', 0.22);
    tone(base * 1.5, 0.28, 'sine', 0.14);
  };

  audio.flare = function flare() {
    tone(320, 0.4, 'sine', 0.2, 980);
    noise(0.35, 0.12, 2400);
  };

  audio.hit = function hit() {
    tone(180, 0.3, 'sawtooth', 0.22, 60);
    noise(0.25, 0.25, 900);
  };

  audio.wave = function wave() {
    tone(392, 0.22, 'triangle', 0.18);
    setTimeout(() => tone(523, 0.3, 'triangle', 0.18), 110);
  };

  audio.dawn = function dawn() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => tone(f, 0.5, 'sine', 0.16), i * 130);
    });
  };

  audio.over = function over() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => tone(f, 0.45, 'triangle', 0.16), i * 160);
    });
  };

  audio.startPad = function startPad() {
    if (!audio.ctx || audio.padNodes) return;
    const padGain = audio.ctx.createGain();
    padGain.gain.value = 0.05;
    padGain.connect(audio.master);
    const len = Math.floor(audio.ctx.sampleRate * 2);
    const buffer = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = audio.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = audio.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 320;
    filter.Q.value = 0.6;
    const lfo = audio.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = audio.ctx.createGain();
    lfoGain.gain.value = 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    src.connect(filter);
    filter.connect(padGain);
    src.start();
    lfo.start();
    audio.padNodes = { src, lfo };
  };

  return audio;
}
