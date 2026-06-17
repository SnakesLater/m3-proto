export class Audio {
  private ctx: AudioContext | null = null;

  init(): void {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }

  play(type: 'shot' | 'ding' | 'thump'): void {
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.connect(g);
    g.connect(this.ctx.destination);

    switch (type) {
      case 'shot':
        o.type = 'square';
        o.frequency.setValueAtTime(150, t);
        o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
        g.gain.setValueAtTime(0.3, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        o.start(t);
        o.stop(t + 0.1);
        break;

      case 'ding':
        o.type = 'sine';
        o.frequency.setValueAtTime(880, t);
        o.frequency.exponentialRampToValueAtTime(440, t + 0.2);
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        o.start(t);
        o.stop(t + 0.3);
        break;

      case 'thump':
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(60, t);
        o.frequency.exponentialRampToValueAtTime(20, t + 0.3);
        g.gain.setValueAtTime(0.4, t);
        g.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        o.start(t);
        o.stop(t + 0.3);
        break;
    }
  }
}
