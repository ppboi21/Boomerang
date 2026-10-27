// Small synthesized sound effects (Web Audio API) - no audio files to load.
// Only ever played after the user turns sound on in the UI.

let ctx = null;

const PRESETS = {
  click: [[620, 0.035]],
  success: [[523, 0.07], [659, 0.07], [784, 0.14]],
  message: [[880, 0.05], [1175, 0.09]],
  match: [[392, 0.07], [523, 0.07], [659, 0.07], [1047, 0.18]],
  error: [[240, 0.1], [180, 0.14]],
};

export function playTone(name, volume = 0.06) {
  const notes = PRESETS[name];
  if (!notes || typeof window === 'undefined') return;
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    let t = ctx.currentTime;
    for (const [freq, dur] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur * 0.85;
    }
  } catch {
    /* audio unavailable: stay silent */
  }
}
