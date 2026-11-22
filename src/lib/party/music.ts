"use client";

/**
 * A small Afrobeats-style groove made in the browser (no audio files):
 * kick, clap, shaker, log drum and a bell, around 104 BPM.
 */
export class PartyBeat {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: number | null = null;
  private step = 0;
  private nextTime = 0;
  private readonly bpm = 104;

  get playing() {
    return this.timer !== null;
  }

  start() {
    if (this.timer !== null) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx ??= new Ctx();
    void this.ctx.resume();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.timer = window.setInterval(() => this.schedule(), 25);
  }

  stop() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.master?.disconnect();
    this.master = null;
  }

  private schedule() {
    const ctx = this.ctx;
    if (!ctx) return;
    const sixteenth = 60 / this.bpm / 4;
    while (this.nextTime < ctx.currentTime + 0.12) {
      this.play(this.step % 32, this.nextTime);
      this.nextTime += sixteenth;
      this.step++;
    }
  }

  private play(s: number, t: number) {
    const bar = s % 16;
    // Kick: the classic afrobeats "1 . . 1 . . 1 ." feel
    if ([0, 3, 6, 10, 12].includes(bar)) this.kick(t);
    // Clap/snare on 2 and 4
    if (bar === 4 || bar === 12) this.clap(t);
    // Shaker on every 16th, accented off-beats
    this.shaker(t, bar % 2 === 1 ? 0.12 : 0.05);
    // Log drum bass line
    const notes: Record<number, number> = { 0: 55, 7: 65.4, 10: 49, 14: 73.4, 16: 55, 23: 82.4, 26: 61.7, 30: 49 };
    if (notes[s] !== undefined) this.logDrum(t, notes[s]);
    // Bell
    if ([2, 5, 9, 13].includes(bar)) this.bell(t, bar === 9 ? 1320 : 990);
  }

  private env(t: number, peak: number, decay: number) {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    g.connect(this.master!);
    return g;
  }

  private kick(t: number) {
    const o = this.ctx!.createOscillator();
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    o.connect(this.env(t, 0.9, 0.25));
    o.start(t);
    o.stop(t + 0.3);
  }

  private noise(duration: number) {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * duration), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    return src;
  }

  private clap(t: number) {
    const n = this.noise(0.2);
    const f = this.ctx!.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 1500;
    n.connect(f);
    f.connect(this.env(t, 0.5, 0.16));
    n.start(t);
  }

  private shaker(t: number, level: number) {
    const n = this.noise(0.05);
    const f = this.ctx!.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = 7000;
    n.connect(f);
    f.connect(this.env(t, level, 0.045));
    n.start(t);
  }

  private logDrum(t: number, freq: number) {
    const o = this.ctx!.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(freq * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(freq, t + 0.06);
    o.connect(this.env(t, 0.7, 0.45));
    o.start(t);
    o.stop(t + 0.5);
  }

  private bell(t: number, freq: number) {
    const o = this.ctx!.createOscillator();
    o.type = "triangle";
    o.frequency.value = freq;
    o.connect(this.env(t, 0.08, 0.12));
    o.start(t);
    o.stop(t + 0.15);
  }
}
