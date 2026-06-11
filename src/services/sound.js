/**
 * SortSound — tiny Web Audio API synth for sorting sound effects.
 * No audio files needed — generates tones programmatically.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Play a short tone.
 * @param {number} freq   — frequency in Hz (higher = higher pitch)
 * @param {number} duration — in seconds
 * @param {string} type   — oscillator type: 'sine', 'square', 'triangle', 'sawtooth'
 * @param {number} volume — 0 to 1
 */
export function playTone(freq = 440, duration = 0.05, type = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not supported or blocked — fail silently
  }
}

/**
 * Swap sound — short percussive click
 */
export function playSwapSound(value = 500, maxValue = 1000) {
  // Map value to pitch: low values = low pitch, high values = high pitch
  const freq = 200 + (value / maxValue) * 600;
  playTone(freq, 0.06, 'square', 0.1);
}

/**
 * Compare sound — very soft tick
 */
export function playCompareSound(value = 500, maxValue = 1000) {
  const freq = 300 + (value / maxValue) * 400;
  playTone(freq, 0.03, 'sine', 0.04);
}

/**
 * Sorted sound — satisfying completion blip
 */
export function playSortedSound() {
  playTone(600, 0.08, 'sine', 0.08);
  setTimeout(() => playTone(800, 0.1, 'sine', 0.08), 80);
}
