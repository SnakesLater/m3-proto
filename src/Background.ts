import { CONFIG } from './config';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

export class Background {
  x1 = 0;
  x2 = 0;
  x3 = 0;

  shrubs: { x: number; y: number; s: number }[] = [];

  constructor() {
    for (let i = 0; i < 15; i++) {
      this.shrubs.push({
        x: Math.random() * W,
        y: 480 + Math.random() * 60,
        s: 10 + Math.random() * 20,
      });
    }
  }

  update(dt: number, speed: number): void {
    this.x1 -= 20 * speed * dt;
    if (this.x1 <= -W) this.x1 += W;

    this.x2 -= 60 * speed * dt;
    if (this.x2 <= -W) this.x2 += W;

    this.x3 -= 120 * speed * dt;
    if (this.x3 <= -W) this.x3 += W;

    for (const s of this.shrubs) {
      s.x -= 100 * speed * dt;
      if (s.x < -50) s.x = W + 50;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, 400);
    grad.addColorStop(0, CONFIG.colors.skyGradStart);
    grad.addColorStop(0.3, CONFIG.colors.skyGradMid);
    grad.addColorStop(0.6, CONFIG.colors.skyGradWarm);
    grad.addColorStop(0.85, CONFIG.colors.skyGradPink);
    grad.addColorStop(1, CONFIG.colors.skyGradGold);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 400);

    ctx.fillStyle = CONFIG.colors.groundDark;
    ctx.fillRect(0, 400, W, 200);

    const c1 = CONFIG.colors.groundBrown;
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.moveTo(0, 400);
    for (let x = 0; x <= W; x += 40) {
      ctx.lineTo(x, 400 + Math.sin(x * 0.01 + this.x1 * 0.001) * 15);
    }
    ctx.lineTo(W, 600);
    ctx.lineTo(0, 600);
    ctx.closePath();
    ctx.fill();

    const c2 = CONFIG.colors.groundDeep;
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(0, 430);
    for (let x = 0; x <= W; x += 30) {
      ctx.lineTo(x, 430 + Math.sin(x * 0.015 + this.x2 * 0.002) * 20);
    }
    ctx.lineTo(W, 600);
    ctx.lineTo(0, 600);
    ctx.closePath();
    ctx.fill();

    const c3 = CONFIG.colors.groundBlack;
    ctx.fillStyle = c3;
    for (let i = 0; i < 8; i++) {
      const x = ((i * 140 + this.x2) % (W + 200)) - 100;
      ctx.beginPath();
      ctx.moveTo(x, 460);
      ctx.lineTo(x + 20, 420);
      ctx.lineTo(x + 60, 460);
      ctx.closePath();
      ctx.fill();
    }

    for (const s of this.shrubs) {
      ctx.fillStyle = CONFIG.colors.shrubBrown;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = CONFIG.colors.shrubDark;
      ctx.beginPath();
      ctx.arc(s.x - s.s * 0.4, s.y - s.s * 0.2, s.s * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
