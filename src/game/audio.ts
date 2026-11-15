class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    delay = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const jitter = 0.94 + Math.random() * 0.12;
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd * jitter), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public playJump(): void {
    this.tone(240, 520, 0.11, 'triangle', 0.11);
  }

  public playLand(): void {
    this.tone(110, 55, 0.06, 'sine', 0.07);
  }

  public playDash(): void {
    this.tone(320, 120, 0.13, 'sawtooth', 0.1);
    this.tone(520, 260, 0.09, 'square', 0.06, 0.01);
  }

  public playShard(): void {
    this.tone(660, 880, 0.09, 'triangle', 0.11);
    this.tone(990, 1320, 0.13, 'triangle', 0.1, 0.05);
  }

  public playPortalOpen(): void {
    this.tone(440, 660, 0.15, 'triangle', 0.11);
    this.tone(660, 880, 0.18, 'triangle', 0.11, 0.07);
    this.tone(880, 1320, 0.25, 'sine', 0.12, 0.14);
  }

  public playCheckpoint(): void {
    this.tone(523, 659, 0.1, 'triangle', 0.1);
    this.tone(659, 784, 0.14, 'triangle', 0.1, 0.06);
  }

  public playCrumble(): void {
    this.tone(160, 65, 0.12, 'square', 0.08);
  }

  public playLaserFire(): void {
    this.tone(760, 220, 0.11, 'sawtooth', 0.06);
  }

  public playDeath(): void {
    this.tone(240, 55, 0.22, 'sawtooth', 0.15);
    this.tone(150, 42, 0.25, 'square', 0.1, 0.03);
  }

  public playStageClear(): void {
    this.tone(523, 523, 0.09, 'triangle', 0.11);
    this.tone(659, 659, 0.09, 'triangle', 0.11, 0.07);
    this.tone(784, 784, 0.12, 'triangle', 0.11, 0.14);
    this.tone(1046, 1046, 0.24, 'triangle', 0.13, 0.21);
  }

  public playVictory(): void {
    [523, 659, 784, 1046, 1318].forEach((freq, idx) => {
      this.tone(freq, freq * 1.02, 0.2, 'triangle', 0.12, idx * 0.08);
    });
  }

  public playDefeat(): void {
    this.tone(293, 220, 0.18, 'sawtooth', 0.11);
    this.tone(220, 146, 0.22, 'sawtooth', 0.11, 0.16);
    this.tone(146, 98, 0.32, 'sawtooth', 0.12, 0.32);
  }
}

export const soundEngine = new SoundEngine();
