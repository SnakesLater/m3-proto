import { CONFIG } from './config';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

export class Gun {
  pulse = 0;
  rotation = 0;
  cx: number;
  cy: number;
  cylRadius = 30;
  chamberRadius = 8;

  constructor() {
    this.cx = W - 80;
    this.cy = H - 70;
  }

  addPulse(): void {
    this.pulse = 0.15;
  }

  update(dt: number): void {
    this.pulse = Math.max(0, this.pulse - dt);
    this.rotation += dt * 0.3;
  }

  draw(ctx: CanvasRenderingContext2D, combo = 0): void {
    const scale = 1 + this.pulse * 0.15;
    const cylR = this.cylRadius;

    ctx.save();
    ctx.translate(this.cx, this.cy);
    ctx.scale(scale, scale);
    ctx.rotate(this.rotation);

    ctx.fillStyle = '#3e2723';
    ctx.beginPath();
    ctx.arc(0, 0, cylR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#5d4037';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, cylR, 0, Math.PI * 2);
    ctx.stroke();

    const chR = this.chamberRadius;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const chx = Math.cos(angle) * (cylR - chR - 3);
      const chy = Math.sin(angle) * (cylR - chR - 3);

      if (i < combo) {
        ctx.fillStyle = i >= combo - 1 ? '#fff' : '#ffd700';
        ctx.beginPath();
        ctx.arc(chx, chy, chR, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(chx, chy, chR, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#1a0f0a';
        ctx.beginPath();
        ctx.arc(chx, chy, chR, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (combo >= 6) {
      ctx.strokeStyle = 'rgba(255, 215, 0, 0.4)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, cylR + 4, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 215, 0, 0.08)';
      ctx.beginPath();
      ctx.arc(0, 0, cylR, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
