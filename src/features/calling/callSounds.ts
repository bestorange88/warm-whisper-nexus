/**
 * Call sound effects using Web Audio API.
 * Generates ringtone, dial tone, and call-end beep programmatically.
 */

let audioContext: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];
let activeGains: GainNode[] = [];
let loopTimerId: ReturnType<typeof setInterval> | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function stopAll() {
  if (loopTimerId) {
    clearInterval(loopTimerId);
    loopTimerId = null;
  }
  activeOscillators.forEach((osc) => {
    try { osc.stop(); } catch { /* already stopped */ }
  });
  activeGains.forEach((g) => {
    try { g.disconnect(); } catch { /* ignore */ }
  });
  activeOscillators = [];
  activeGains = [];
}

/**
 * Play a repeating ringtone pattern (for incoming calls).
 * Pattern: two short tones, pause, repeat.
 */
function playRingtone() {
  stopAll();
  const ctx = getAudioContext();

  function playRingBurst() {
    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = 440;
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.4);
    activeOscillators.push(osc1);
    activeGains.push(gain1);

    // Second tone (slightly higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.value = 523.25;
    gain2.gain.setValueAtTime(0, ctx.currentTime + 0.5);
    gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.55);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.9);
    activeOscillators.push(osc2);
    activeGains.push(gain2);
  }

  playRingBurst();
  loopTimerId = setInterval(() => {
    playRingBurst();
  }, 2000); // ring every 2 seconds
}

/**
 * Play a dial/ringback tone (for outgoing calls waiting to be answered).
 * Pattern: long tone, pause, repeat — mimics phone ringback.
 */
function playDialTone() {
  stopAll();
  const ctx = getAudioContext();

  function playDialBurst() {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 425;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.setValueAtTime(0.2, ctx.currentTime + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.2);
    activeOscillators.push(osc);
    activeGains.push(gain);
  }

  playDialBurst();
  loopTimerId = setInterval(() => {
    playDialBurst();
  }, 3000); // ring-back every 3 seconds
}

/**
 * Play a short beep when call ends.
 */
function playEndTone() {
  stopAll();
  const ctx = getAudioContext();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 480;
  gain.gain.setValueAtTime(0.25, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.5);

  // Second lower beep
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 380;
  gain2.gain.setValueAtTime(0, ctx.currentTime + 0.3);
  gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.35);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(ctx.currentTime + 0.3);
  osc2.stop(ctx.currentTime + 0.8);
}

/**
 * Play a connect tone (short double beep when call connects).
 */
function playConnectTone() {
  stopAll();
  const ctx = getAudioContext();

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = 600;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.15);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sine';
  osc2.frequency.value = 800;
  gain2.gain.setValueAtTime(0, ctx.currentTime + 0.2);
  gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.22);
  gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(ctx.currentTime + 0.2);
  osc2.stop(ctx.currentTime + 0.35);
}

export const callSounds = {
  playRingtone,
  playDialTone,
  playEndTone,
  playConnectTone,
  stopAll,
};
