import { CONFIG } from './config';
import { drawSpriteCentered } from './assets/draw';

export interface PieceTypeDef {
  name: string;
  color: string;
  draw: (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => void;
  spriteKey?: string;
}

function spriteOrProc(
  key: string,
  frameIdx: number,
  proc: (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) => void,
): (ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) => void {
  return (ctx, cx, cy, s) => {
    if (!drawSpriteCentered(ctx, key, frameIdx, cx, cy, s)) {
      proc(ctx, cx, cy, s);
    }
  };
}

function drawOutlaw(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.fillStyle = '#ff3333';
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.arc(cx - s * 0.12, cy - s * 0.12, s * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#b8860b';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    const method = i === 0 ? 'moveTo' as const : 'lineTo' as const;
    ctx[method](cx + Math.cos(a) * s * 0.42, cy + Math.sin(a) * s * 0.42);
  }
  ctx.closePath();
  ctx.fill();
}

function drawBandit(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.fillStyle = '#222222';
  const hw = s * 0.425, r = s * 0.15;
  ctx.beginPath();
  ctx.moveTo(cx - hw + r, cy - hw);
  ctx.lineTo(cx + hw - r, cy - hw);
  ctx.quadraticCurveTo(cx + hw, cy - hw, cx + hw, cy - hw + r);
  ctx.lineTo(cx + hw, cy + hw - r);
  ctx.quadraticCurveTo(cx + hw, cy + hw, cx + hw - r, cy + hw);
  ctx.lineTo(cx - hw + r, cy + hw);
  ctx.quadraticCurveTo(cx - hw, cy + hw, cx - hw, cy + hw - r);
  ctx.lineTo(cx - hw, cy - hw + r);
  ctx.quadraticCurveTo(cx - hw, cy - hw, cx - hw + r, cy - hw);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(cx - s * 0.18, cy - s * 0.18, s * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.18, cy - s * 0.18, s * 0.13, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#111111';
  ctx.beginPath();
  ctx.arc(cx - s * 0.18, cy - s * 0.18, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.18, cy - s * 0.18, s * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

function drawSnake(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = s * 0.12;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.45, cy);
  ctx.bezierCurveTo(cx - s * 0.3, cy - s * 0.25, cx + s * 0.3, cy + s * 0.25, cx + s * 0.45, cy);
  ctx.stroke();

  ctx.fillStyle = '#33cc33';
  ctx.beginPath();
  ctx.arc(cx - s * 0.35, cy - s * 0.15, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.35, cy + s * 0.15, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawCoyote(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.fillStyle = '#cccccc';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.45);
  ctx.lineTo(cx + s * 0.45, cy + s * 0.15);
  ctx.lineTo(cx + s * 0.25, cy + s * 0.45);
  ctx.lineTo(cx - s * 0.25, cy + s * 0.45);
  ctx.lineTo(cx - s * 0.45, cy + s * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#777777';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.45);
  ctx.lineTo(cx + s * 0.18, cy - s * 0.63);
  ctx.lineTo(cx - s * 0.18, cy - s * 0.63);
  ctx.closePath();
  ctx.fill();
}

function drawVulture(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.fillStyle = '#cc6600';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.22);
  ctx.lineTo(cx - s * 0.7, cy);
  ctx.lineTo(cx - s * 0.2, cy - s * 0.05);
  ctx.lineTo(cx, cy + s * 0.38);
  ctx.lineTo(cx + s * 0.2, cy - s * 0.05);
  ctx.lineTo(cx + s * 0.7, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#553300';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.05, s * 0.14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#553300';
  ctx.beginPath();
  ctx.arc(cx, cy - s * 0.05, s * 0.07, 0, Math.PI * 2);
  ctx.fill();
}

function drawCow(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.05, s * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f5f5dc';
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.05, s * 0.32, s * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.38, cy - s * 0.48);
  ctx.lineTo(cx - s * 0.24, cy - s * 0.35);
  ctx.lineTo(cx - s * 0.42, cy - s * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.38, cy - s * 0.48);
  ctx.lineTo(cx + s * 0.24, cy - s * 0.35);
  ctx.lineTo(cx + s * 0.42, cy - s * 0.22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#333';
  ctx.beginPath();
  ctx.arc(cx - s * 0.12, cy - s * 0.1, s * 0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + s * 0.12, cy - s * 0.1, s * 0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.38, cy + s * 0.25, s * 0.08, s * 0.18, 0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.38, cy + s * 0.25, s * 0.08, s * 0.18, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + s * 0.32, cy + s * 0.35, s * 0.08, s * 0.18, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx - s * 0.32, cy + s * 0.35, s * 0.08, s * 0.18, -0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.fillStyle = '#ff0044';
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.2);
  ctx.bezierCurveTo(cx + s * 0.5, cy - s * 0.1, cx + s * 0.3, cy - s * 0.45, cx, cy - s * 0.2);
  ctx.bezierCurveTo(cx - s * 0.3, cy - s * 0.45, cx - s * 0.5, cy - s * 0.1, cx, cy + s * 0.2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.arc(cx - s * 0.1, cy - s * 0.18, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function drawLasso(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number): void {
  ctx.strokeStyle = '#5c3a21';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#8b6914';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.35, 0.3, Math.PI * 1.7);
  ctx.stroke();

  ctx.strokeStyle = '#5c3a21';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.35, cy);
  ctx.lineTo(cx + s * 0.6, cy + s * 0.3);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - s * 0.35, cy);
  ctx.lineTo(cx - s * 0.55, cy - s * 0.2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(92, 58, 33, 0.35)';
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

export const PIECE_TYPES: PieceTypeDef[] = [
  { name: 'Outlaw', color: '#ff3333', draw: spriteOrProc('piece_hat', 0, drawOutlaw) },
  { name: 'Bandit', color: '#1a1a1a', draw: spriteOrProc('piece_boot', 0, drawBandit) },
  { name: 'Snake', color: '#33cc33', draw: spriteOrProc('piece_bottle', 0, drawSnake) },
  { name: 'Coyote', color: '#cccccc', draw: spriteOrProc('piece_gold', 0, drawCoyote) },
  { name: 'Vulture', color: '#cc6600', draw: spriteOrProc('piece_star', 0, drawVulture) },
  { name: 'Cow', color: '#8b6914', draw: drawCow },
  { name: 'Heart', color: '#ff0044', draw: drawHeart },
  { name: 'Lasso', color: '#c49a6c', draw: drawLasso },
];

export const COW_TYPE = 5;
export const HEART_TYPE = 6;
export const LASSO_TYPE = 7;

export class Piece {
  col: number;
  row: number;
  type: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  scale: number;
  targetScale: number;
  selected: boolean;
  pulse: number;
  floatOffset: number;
  removing: boolean;
  removeProgress: number;

  constructor(col: number, row: number, typeIdx: number) {
    this.col = col;
    this.row = row;
    this.type = typeIdx;
    this.x = col;
    this.y = row;
    this.tx = col;
    this.ty = row;
    this.scale = 1;
    this.targetScale = 1;
    this.selected = false;
    this.pulse = 0;
    this.floatOffset = Math.random() * Math.PI * 2;
    this.removing = false;
    this.removeProgress = 0;
  }

  setTarget(c: number, r: number): void {
    this.tx = c;
    this.ty = r;
  }

  get isAtTarget(): boolean {
    return Math.abs(this.x - this.tx) < 0.05 && Math.abs(this.y - this.ty) < 0.05;
  }

  get dead(): boolean {
    return this.removing && this.removeProgress >= 1;
  }

  update(dt: number): void {
    const speed = this.removing ? 15 : 12;
    this.x += (this.tx - this.x) * Math.min(speed * dt, 1);
    this.y += (this.ty - this.y) * Math.min(speed * dt, 1);
    this.scale += (this.targetScale - this.scale) * Math.min(10 * dt, 1);
    this.pulse = this.selected ? this.pulse + dt * 4 : 0;
    if (this.removing) {
      this.removeProgress += dt * 8;
      this.targetScale = Math.max(0, 1 - this.removeProgress);
    }
  }

  draw(ctx: CanvasRenderingContext2D, cellSize: number, ox: number, oy: number): void {
    if (this.removing && this.removeProgress > 1) return;

    const now = performance.now() / 500;
    const px = ox + (this.x + 0.5) * cellSize;
    const py = oy + (this.y + 0.5) * cellSize + Math.sin(now + this.floatOffset) * 2;
    const s = cellSize * 0.78 * this.scale;

    ctx.save();

    if (this.selected) {
      ctx.strokeStyle = `rgba(255, 200, 50, ${0.6 + Math.sin(this.pulse) * 0.4})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, py, s + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (this.removing) {
      ctx.globalAlpha = Math.max(0, 1 - this.removeProgress);
    }

    PIECE_TYPES[this.type].draw(ctx, px, py, s);

    ctx.restore();
  }

  worldX(cellSize: number, ox: number): number {
    return ox + (this.x + 0.5) * cellSize;
  }

  worldY(cellSize: number, oy: number): number {
    return oy + (this.y + 0.5) * cellSize;
  }
}
