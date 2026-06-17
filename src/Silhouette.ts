import { CONFIG } from './config';

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

  readonly hitboxRadius = 28;

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
  }

  hitTest(mx: number, my: number): boolean {
    const dx = mx - this.x;
    const dy = my - this.y - 10;
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
      case SilhouetteState.Hit: return Math.min(this.stateTimer / 0.15, 1);
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
    ctx.translate(this.x, this.y + 10);

    if (scale !== 1) {
      ctx.scale(1, scale);
    }

    const bodyColor = this.isHostile ? '#1a1a1a' : '#8b6914';
    const accentColor = this.isHostile ? '#333' : '#a08050';
    const cx = 0;
    const cy = 0;

    if (this.state === SilhouetteState.Hit) {
      ctx.fillStyle = this.isHostile ? '#ffffff' : '#ff4444';
      ctx.beginPath();
      ctx.arc(cx, cy - 18, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - 14, cy - 8, 28, 35);
      ctx.restore();
      return;
    }

    if (this.isHostile) {
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.moveTo(cx - 22, cy - 38);
      ctx.lineTo(cx + 22, cy - 38);
      ctx.lineTo(cx + 14, cy - 25);
      ctx.lineTo(cx - 14, cy - 25);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillRect(cx - 14, cy - 8, 28, 35);

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    if (this.isHostile) {
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy);
      ctx.lineTo(cx - 24, cy + 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy);
      ctx.lineTo(cx + 24, cy + 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - 2);
      ctx.lineTo(cx - 22, cy - 20);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 14, cy - 2);
      ctx.lineTo(cx + 22, cy - 20);
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(cx - 8, cy + 27);
    ctx.lineTo(cx - 10, cy + 45);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy + 27);
    ctx.lineTo(cx + 10, cy + 45);
    ctx.stroke();

    ctx.restore();
  }

  private drawTelegraph(ctx: CanvasRenderingContext2D): void {
    const t = this.stateTimer / CONFIG.shootout.telegraphDuration;
    ctx.save();
    ctx.translate(this.x, this.y + 10);

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
    ctx.restore();
  }
}
