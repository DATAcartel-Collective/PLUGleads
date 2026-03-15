let audioContext;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioContext) audioContext = new Ctx();
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playTone({ frequency = 220, duration = 0.08, type = 'square', gain = 0.045, when = 0 }) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + when;
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playNoiseBurst({ duration = 0.06, gain = 0.025, when = 0 }) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const bufferSize = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 540;

  const gainNode = ctx.createGain();
  const now = ctx.currentTime + when;
  gainNode.gain.setValueAtTime(gain, now);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start(now);
  source.stop(now + duration);
}

export function playNailGunSound() {
  playTone({ frequency: 140, duration: 0.05, type: 'square', gain: 0.05 });
  playNoiseBurst({ duration: 0.045, gain: 0.028, when: 0.012 });
  playTone({ frequency: 90, duration: 0.08, type: 'triangle', gain: 0.028, when: 0.025 });
}

export function playHammerHitSound() {
  playTone({ frequency: 120, duration: 0.11, type: 'square', gain: 0.045 });
  playNoiseBurst({ duration: 0.06, gain: 0.025, when: 0.008 });
}

export function playLadderClickSound() {
  playTone({ frequency: 380, duration: 0.02, type: 'square', gain: 0.024 });
}

export function playBundleThudSound() {
  playTone({ frequency: 80, duration: 0.18, type: 'triangle', gain: 0.044 });
  playNoiseBurst({ duration: 0.07, gain: 0.022, when: 0.01 });
}

export function playSwipeWhooshSound(isHeavy = false) {
  playNoiseBurst({ duration: isHeavy ? 0.12 : 0.08, gain: isHeavy ? 0.018 : 0.013 });
  playTone({
    frequency: isHeavy ? 110 : 160,
    duration: isHeavy ? 0.11 : 0.07,
    type: 'sawtooth',
    gain: 0.015,
  });
}

export function playStampSound() {
  playTone({ frequency: 96, duration: 0.12, type: 'square', gain: 0.043 });
  playNoiseBurst({ duration: 0.08, gain: 0.02, when: 0.01 });
  playTone({ frequency: 62, duration: 0.2, type: 'triangle', gain: 0.024, when: 0.02 });
}
