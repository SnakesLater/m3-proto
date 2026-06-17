import { CONFIG } from './config';

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string, life: number, size: number) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.size = size || 3;
  }

  get dead(): boolean {
    return this.life <= 0;
  }

  update(dt: number): void {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += 400 * dt;
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const a = this.life / this.maxLife;
    ctx.globalAlpha = a;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * a, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export class FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  rotation: number;

  constructor(x: number, y: number, text: string, color: string, life: number) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = life;
    this.maxLife = life;
    this.rotation = (Math.random() - 0.5) * 0.08;
  }

  get dead(): boolean {
    return this.life <= 0;
  }

  update(dt: number): void {
    this.y -= 60 * dt;
    this.life -= dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const a = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (this.text === 'AREA CLEAR!') {
      ctx.fillStyle = 'rgba(255, 69, 0, 0.15)';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
        const r1 = 50;
        const r2 = 20;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
        else ctx.lineTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
        ctx.lineTo(Math.cos(angle + Math.PI / 8) * r2, Math.sin(angle + Math.PI / 8) * r2);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.text === 'LINE CLEAR!') {
      ctx.fillStyle = 'rgba(255, 140, 0, 0.12)';
      ctx.fillRect(-45, -18, 90, 36);
    }

    ctx.fillStyle = this.color;
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

export class EffectManager {
  particles: Particle[];
  texts: FloatingText[];

  constructor() {
    this.particles = [];
    this.texts = [];
  }

  addParticle(x: number, y: number, vx: number, vy: number, color: string, life: number, size: number): void {
    this.particles.push(new Particle(x, y, vx, vy, color, life, size));
  }

  addText(x: number, y: number, text: string, color: string, life: number): void {
    this.texts.push(new FloatingText(x, y, text, color, life));
  }

  spawnBurst(cx: number, cy: number, amount: number, colors: string[], speed: number, life: number, size: number): void {
    for (let i = 0; i < amount; i++) {
      this.addParticle(
        cx, cy,
        (Math.random() - 0.5) * speed,
        (Math.random() - 0.5) * speed,
        colors[Math.floor(Math.random() * colors.length)],
        life + Math.random() * (life * 0.5),
        size,
      );
    }
  }

  spawnDustBurst(cx: number, cy: number, amount: number, speed: number, life: number, size: number): void {
    const dustColors = ['#c49a6c', '#a0724a', '#8b5a2b', '#d4a574', '#b8895e'];
    for (let i = 0; i < amount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * speed;
      this.addParticle(
        cx + (Math.random() - 0.5) * 20,
        cy + (Math.random() - 0.5) * 20,
        Math.cos(angle) * dist * 0.4,
        Math.sin(angle) * dist * 0.4 - 30,
        dustColors[Math.floor(Math.random() * dustColors.length)],
        life + Math.random() * life * 0.5,
        size,
      );
    }
  }

  spawnHatParticles(cx: number, cy: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 200;
      const vy = -Math.random() * 150 - 50;
      this.addParticle(cx, cy, vx, vy, '#1a1a1a', 0.6 + Math.random() * 0.3, 4);
      this.addParticle(cx, cy, vx * 0.7, vy * 0.7, '#333', 0.4 + Math.random() * 0.3, 3);
    }
  }

  clear(): void {
    this.particles = [];
    this.texts = [];
  }

  update(dt: number): void {
    for (const p of this.particles) p.update(dt);
    for (const t of this.texts) t.update(dt);
    this.particles = this.particles.filter(p => !p.dead);
    this.texts = this.texts.filter(t => !t.dead);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) p.draw(ctx);
    for (const t of this.texts) t.draw(ctx);
  }
}
