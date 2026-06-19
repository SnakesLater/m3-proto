import { CONFIG } from './config';
import { getSheet, getFrame } from './assets/loader';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;
const SKY_H = Math.floor(H * 0.42);

export class Background {
  xA = 0;
  xB = 0;
  xC = 0;
  xGround1 = 0;
  xGround2 = 0;
  xGround3 = 0;

  shrubs: { x: number; y: number; s: number }[] = [];

  constructor() {
    for (let i = 0; i < 15; i++) {
      this.shrubs.push({
        x: Math.random() * W,
        y: SKY_H + Math.random() * (H - SKY_H) * 0.25,
        s: 10 + Math.random() * 20,
      });
    }
  }

  update(dt: number, speed: number): void {
    this.xA -= 15 * speed * dt;
    this.xB -= 30 * speed * dt;
    this.xC -= 50 * speed * dt;
    this.xGround1 -= 20 * speed * dt;
    this.xGround2 -= 60 * speed * dt;
    this.xGround3 -= 120 * speed * dt;

    for (const s of this.shrubs) {
      s.x -= 100 * speed * dt;
      if (s.x < -50) s.x = W + 50;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.drawSky(ctx);
    this.drawParallaxLayers(ctx);
    this.drawGround(ctx);
    this.drawShrubs(ctx);
  }

  private drawSky(ctx: CanvasRenderingContext2D): void {
    const grad = ctx.createLinearGradient(0, 0, 0, SKY_H);
    grad.addColorStop(0, CONFIG.colors.skyGradStart);
    grad.addColorStop(0.3, CONFIG.colors.skyGradMid);
    grad.addColorStop(0.6, CONFIG.colors.skyGradWarm);
    grad.addColorStop(0.85, CONFIG.colors.skyGradPink);
    grad.addColorStop(1, CONFIG.colors.skyGradGold);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, SKY_H);
  }

  private drawParallaxLayers(ctx: CanvasRenderingContext2D): void {
    const layerA = getSheet('bg_layerA');
    const layerB = getSheet('bg_layerB');
    const layerC = getSheet('bg_layerC');

    if (!layerA && !layerB && !layerC) return;

    ctx.save();
    ctx.rect(0, 0, W, SKY_H);
    ctx.clip();

    if (layerA) {
      const iw = layerA.image.naturalWidth;
      const ih = layerA.image.naturalHeight;
      const scale = SKY_H * 0.4 / ih;
      const sw = iw * scale;
      const sy = SKY_H - ih * scale * 0.9;
      for (let x = this.xA % sw - sw; x < W; x += sw) {
        ctx.drawImage(layerA.image, 0, 0, iw, ih, x, sy, sw, ih * scale);
      }
    }

    if (layerB) {
      const iw = layerB.image.naturalWidth;
      const ih = layerB.image.naturalHeight;
      const scale = SKY_H * 0.2 / ih;
      const sw = iw * scale;
      const sy = SKY_H - ih * scale * 0.5;
      for (let x = this.xB % sw - sw; x < W; x += sw) {
        ctx.drawImage(layerB.image, 0, 0, iw, ih, x, sy, sw, ih * scale);
      }
    }

    if (layerC) {
      const iw = layerC.image.naturalWidth;
      const ih = layerC.image.naturalHeight;
      const scale = SKY_H * 0.3 / ih;
      const sw = iw * scale;
      const sy = SKY_H - ih * scale * 0.2;
      for (let x = this.xC % sw - sw; x < W; x += sw) {
        ctx.drawImage(layerC.image, 0, 0, iw, ih, x, sy, sw, ih * scale);
      }
    }

    ctx.restore();
  }

  private drawGround(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = CONFIG.colors.groundDark;
    ctx.fillRect(0, SKY_H, W, H - SKY_H);

    const c1 = CONFIG.colors.groundBrown;
    ctx.fillStyle = c1;
    ctx.beginPath();
    ctx.moveTo(0, SKY_H);
    for (let x = 0; x <= W; x += 40) {
      ctx.lineTo(x, SKY_H + Math.sin(x * 0.01 + this.xGround1 * 0.001) * 15);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    const c2 = CONFIG.colors.groundDeep;
    ctx.fillStyle = c2;
    ctx.beginPath();
    ctx.moveTo(0, SKY_H + 30);
    for (let x = 0; x <= W; x += 30) {
      ctx.lineTo(x, SKY_H + 30 + Math.sin(x * 0.015 + this.xGround2 * 0.002) * 20);
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    const c3 = CONFIG.colors.groundBlack;
    ctx.fillStyle = c3;
    for (let i = 0; i < 8; i++) {
      const x = ((i * 140 + this.xGround2) % (W + 200)) - 100;
      ctx.beginPath();
      ctx.moveTo(x, SKY_H + 60);
      ctx.lineTo(x + 20, SKY_H + 20);
      ctx.lineTo(x + 60, SKY_H + 60);
      ctx.closePath();
      ctx.fill();
    }
  }

  private drawShrubs(ctx: CanvasRenderingContext2D): void {
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
