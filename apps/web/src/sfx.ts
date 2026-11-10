import { useTodos } from './store'

let ctx: AudioContext | null = null

function audio() {
  if (useTodos.getState().muted) return null
  ctx ??= new AudioContext()
  return ctx
}

function tone(from: number, to: number, duration: number, type: OscillatorType = 'sine', volume = 0.2) {
  const a = audio()
  if (!a) return
  const t = a.currentTime
  const osc = a.createOscillator()
  const gain = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + duration)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  osc.connect(gain).connect(a.destination)
  osc.start(t)
  osc.stop(t + duration)
}

function noise(duration: number, from: number, to: number, volume = 0.3) {
  const a = audio()
  if (!a) return
  const t = a.currentTime
  const buffer = a.createBuffer(1, Math.ceil(a.sampleRate * duration), a.sampleRate)
  const samples = buffer.getChannelData(0)
  for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1

  const source = a.createBufferSource()
  source.buffer = buffer
  const filter = a.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(from, t)
  filter.frequency.exponentialRampToValueAtTime(to, t + duration)
  const gain = a.createGain()
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration)
  source.connect(filter).connect(gain).connect(a.destination)
  source.start(t)
}

export const sfx = {
  pop: () => tone(500, 1400, 0.12),
  smash: () => {
    noise(0.45, 3500, 400, 0.5)
    tone(180, 40, 0.25, 'triangle', 0.4)
  },
  kick: () => {
    tone(160, 35, 0.2, 'sine', 0.6)
    noise(0.08, 1200, 600, 0.3)
  },
  whoosh: () => noise(0.9, 250, 2500, 0.25),
  plop: () => tone(320, 70, 0.18, 'sine', 0.3),
  sad: () => tone(400, 200, 0.4, 'sawtooth', 0.08),
}
