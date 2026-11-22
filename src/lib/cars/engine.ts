"use client";

import type { CarBody } from "@/lib/cars/style";

/** Engine sound made in the browser: start-up, idle rumble and revs. */
export class EngineSound {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private sub: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private idle = 38;

  get running() {
    return this.osc !== null;
  }

  start(body: CarBody) {
    if (this.osc) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx ??= new Ctx();
    const ctx = this.ctx;
    void ctx.resume();
    this.idle = body === "super" ? 62 : body === "sports" ? 52 : body === "suv" ? 34 : 40;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = body === "super" || body === "sports" ? 1400 : 700;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);
    filter.connect(gain);

    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const sub = ctx.createOscillator();
    sub.type = "square";

    // Lumpy idle
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 9;
    lfoGain.gain.value = 0.12;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    osc.connect(filter);
    sub.connect(filter);

    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(18, t);
    osc.frequency.exponentialRampToValueAtTime(this.idle * 3, t + 0.5);
    osc.frequency.exponentialRampToValueAtTime(this.idle, t + 1.3);
    sub.frequency.setValueAtTime(9, t);
    sub.frequency.exponentialRampToValueAtTime(this.idle / 2, t + 1.3);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.35, t + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 1.4);

    osc.start(t);
    sub.start(t);
    lfo.start(t);
    this.osc = osc;
    this.sub = sub;
    this.gain = gain;
  }

  rev() {
    if (!this.ctx || !this.osc || !this.sub || !this.gain) return;
    const t = this.ctx.currentTime;
    for (const [node, mult] of [
      [this.osc, 1],
      [this.sub, 0.5],
    ] as const) {
      node.frequency.cancelScheduledValues(t);
      node.frequency.setValueAtTime(node.frequency.value, t);
      node.frequency.exponentialRampToValueAtTime(this.idle * 4.5 * mult, t + 0.35);
      node.frequency.exponentialRampToValueAtTime(this.idle * mult, t + 1.4);
    }
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t);
    this.gain.gain.linearRampToValueAtTime(0.4, t + 0.3);
    this.gain.gain.linearRampToValueAtTime(0.18, t + 1.4);
  }

  stop() {
    if (!this.ctx || !this.osc || !this.gain) return;
    const t = this.ctx.currentTime;
    this.gain.gain.cancelScheduledValues(t);
    this.gain.gain.setValueAtTime(this.gain.gain.value, t);
    this.gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    this.osc.stop(t + 0.65);
    this.sub?.stop(t + 0.65);
    this.osc = null;
    this.sub = null;
    this.gain = null;
  }
}
