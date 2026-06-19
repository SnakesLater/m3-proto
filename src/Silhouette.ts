import { CONFIG } from './config';
import { getSheet, getFrame } from './assets/loader';

export enum SilhouetteState {
  Hidden,
  Telegraphing,
  Rising,
  Visible,
  Falling,
  Hit,
  Missed,
}

export class Silhouette {
  x: number;
  y: number;
  isHostile: boolean;
  state = SilhouetteState.Hidden;
  stateTimer = 0;
  hitByPlayer = false;
  animTimer = 0;

  get scale(): number {
    return CONFIG.canvas.height / 600;
  }

  get hitboxRadius(): number {
    return Math.floor(30 * this.scale);
  }

  constructor(x: number, y: number, isHostile: boolean) {
    this.x = x;
    this.y = y;
    this.isHostile = isHostile;
  }

  get done(): boolean {
    return this.state === SilhouetteState.Hit || this.state === SilhouetteState.Missed;
  }

  get canBeHit(): boolean {
    return this.state === SilhouetteState.Rising || this.state === SilhouetteState.Visible;
  }

  activate(): void {
    this.state = SilhouetteState.Telegraphing;
    this.stateTimer = 0;
    this.animTimer = 0;
  }

  hitTest(mx: number, my: number): boolean {
    const dx = mx - this.x;
    const dy = my - this.y + 20;
    return dx * dx + dy * dy < this.hitboxRadius * this.hitboxRadius;
  }

  hit(): void {
    if (this.done) return;
    this.state = SilhouetteState.Hit;
    this.hitByPlayer = true;
    this.stateTimer = 0;
  }

  update(dt: number): void {
    this.stateTimer += dt;
    this.animTimer += dt;

    switch (this.state) {
      case SilhouetteState.Telegraphing:
        if (this.stateTimer >= CONFIG.shootout.telegraphDuration) {
          this.state = SilhouetteState.Rising;
          this.stateTimer = 0;
        }
        break;
      case SilhouetteState.Rising:
        if (this.stateTimer >= CONFIG.shootout.riseDuration) {
          this.state = SilhouetteState.Visible;
          this.stateTimer = 0;
        }
        break;
      case SilhouetteState.Visible:
        if (this.stateTimer >= CONFIG.shootout.visibleDuration) {
          this.state = SilhouetteState.Falling;
          this.stateTimer = 0;
        }
        break;
      case SilhouetteState.Falling:
        if (this.stateTimer >= CONFIG.shootout.fallDuration) {
          this.state = SilhouetteState.Missed;
        }
        break;
      case SilhouetteState.Hit:
        break;
    }
  }

  getProgress(): number {
    switch (this.state) {
      case SilhouetteState.Telegraphing: return this.stateTimer / CONFIG.shootout.telegraphDuration;
      case SilhouetteState.Rising: return this.stateTimer / CONFIG.shootout.riseDuration;
      case SilhouetteState.Falling: return this.stateTimer / CONFIG.shootout.fallDuration;
      case SilhouetteState.Hit: return Math.min(this.stateTimer / 0.2, 1);
      default: return 1;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.state === SilhouetteState.Hidden) return;

    if (this.state === SilhouetteState.Telegraphing) {
      this.drawTelegraph(ctx);
      return;
    }

    const progress = this.getProgress();
    let alpha = 1;
    let scale = 1;

    switch (this.state) {
      case SilhouetteState.Rising:
        scale = progress;
        alpha = progress;
        break;
      case SilhouetteState.Falling:
        scale = 1 - progress;
        alpha = 1 - progress;
        break;
      case SilhouetteState.Hit:
        alpha = 1 - progress;
        break;
    }

    if (alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.x / this.scale, (this.y + 10) / this.scale);

    if (scale !== 1) {
      ctx.scale(1, scale);
    }

    if (this.state === SilhouetteState.Hit) {
      this.drawHit(ctx);
      ctx.restore();
      return;
    }

    this.drawCharacter(ctx);

    ctx.restore();
  }

  private drawCharacter(ctx: CanvasRenderingContext2D): void {
    const cx = 0;
    const cy = 0;

    if (this.isHostile) {
      const sheet = getSheet('cowboy_idle');
      if (sheet) {
        const frameIdx = Math.floor(this.animTimer * 8) % sheet.cols;
        const f = getFrame(sheet, frameIdx);
        const aspect = f.sw / f.sh;
        const dw = 48 * this.scale / this.scale;
        const dh = 48 * this.scale / this.scale;
        const w = aspect > 1 ? dw : dw * aspect;
        const h = aspect > 1 ? dh / aspect : dh;
        ctx.drawImage(sheet.image, f.sx, f.sy, f.sw, f.sh, cx - w / 2, cy - h / 2, w, h);
        return;
      }
      this.drawProceduralHostile(ctx, cx, cy);
    } else {
      const sheet = getSheet('enemy_regular');
      if (sheet) {
        const frameIdx = this.isHostile ? 0 : Math.floor(this.animTimer * 6) % sheet.cols;
        const f = getFrame(sheet, 0);
        const aspect = f.sw / f.sh;
        const dw = 48;
        const dh = 32;
        ctx.drawImage(sheet.image, f.sx, f.sy, f.sw, f.sh, cx - dw / 2, cy - dh / 2, dw, dh);
        return;
      }
      this.drawProceduralFriendly(ctx, cx, cy);
    }
  }

  private drawHit(ctx: CanvasRenderingContext2D): void {
    const sheet = getSheet('explosion');
    if (sheet) {
      const f = getFrame(sheet, Math.min(Math.floor(this.stateTimer / 0.05), sheet.cols - 1));
      ctx.drawImage(sheet.image, f.sx, f.sy, f.sw, f.sh, -20, -20, 40, 40);
      return;
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -18, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-14, -8, 28, 35);
  }

  private drawProceduralHostile(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const bodyColor = '#1a1a1a';
    const accentColor = '#333';

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 38);
    ctx.lineTo(cx + 22, cy - 38);
    ctx.lineTo(cx + 14, cy - 25);
    ctx.lineTo(cx - 14, cy - 25);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(cx - 14, cy - 8, 28, 35);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx - 14, cy);
    ctx.lineTo(cx - 24, cy + 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 14, cy);
    ctx.lineTo(cx + 24, cy + 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 27);
    ctx.lineTo(cx - 10, cy + 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + 27);
    ctx.lineTo(cx + 10, cy + 45);
    ctx.stroke();
  }

  private drawProceduralFriendly(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    const bodyColor = '#8b6914';
    const accentColor = '#a08050';

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(cx - 14, cy - 8, 28, 35);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 2);
    ctx.lineTo(cx - 22, cy - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 14, cy - 2);
    ctx.lineTo(cx + 22, cy - 20);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 27);
    ctx.lineTo(cx - 10, cy + 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + 27);
    ctx.lineTo(cx + 10, cy + 45);
    ctx.stroke();
  }

  private drawTelegraph(ctx: CanvasRenderingContext2D): void {
    const t = this.stateTimer / CONFIG.shootout.telegraphDuration;
    ctx.save();
    ctx.scale(this.scale, this.scale);
    ctx.translate(this.x / this.scale, (this.y + 10) / this.scale);

    const sheet = getSheet('cowboy_draw');
    if (sheet) {
      const frameIdx = Math.min(Math.floor(t * (sheet.cols - 1)), sheet.cols - 1);
      const f = getFrame(sheet, frameIdx);
      ctx.globalAlpha = 0.3 + t * 0.7;
      ctx.drawImage(sheet.image, f.sx, f.sy, f.sw, f.sh, -24, -24, 48, 48);
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = t * 0.5;
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, -10, 12 + t * 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = t * 0.25;
      ctx.fillStyle = '#ff8c00';
      ctx.beginPath();
      ctx.arc(0, -10, 16 + t * 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }
}
