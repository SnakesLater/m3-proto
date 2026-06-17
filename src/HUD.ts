import { CONFIG } from './config';

const W = CONFIG.canvas.width;

export interface HUDData {
  score: number;
  level: number;
  combo: number;
  health: number;
  time: number;
  movesUsed: number;
  turnBudget: number;
  scoreTarget: number;
  deadeye: number;
  deadeyeMax: number;
  lassos: number;
  isBossLevel?: boolean;
  heartsOnBoard?: number;
  cowsRemaining?: number;
}

export class HUD {
  draw(ctx: CanvasRenderingContext2D, data: HUDData): void {
    const {
      score, level, combo, health, time,
      movesUsed, turnBudget, scoreTarget, deadeye, deadeyeMax, lassos,
    } = data;

    ctx.textAlign = 'left';

    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 20px Courier New';
    ctx.fillText(`SCORE: ${Math.floor(score)}`, 20, 40);

    ctx.fillStyle = CONFIG.colors.hudGray;
    ctx.font = '16px Courier New';
    ctx.fillText(`GOAL: ${scoreTarget}`, 20, 65);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '20px Courier New';
    ctx.fillText(`LVL: ${level}`, 20, 95);

    ctx.fillStyle = '#c49a6c';
    ctx.font = '16px Courier New';
    ctx.fillText(`LASSOS: ${lassos}/${CONFIG.game.lassoMax}`, 20, 120);

    if (data.isBossLevel) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 16px Courier New';
      if (data.heartsOnBoard !== undefined) {
        ctx.fillText(`HEARTS: ${data.heartsOnBoard}`, 20, 150);
      }
      if (data.cowsRemaining !== undefined && data.cowsRemaining > 0) {
        ctx.fillStyle = '#8b6914';
        ctx.fillText(`COWS: ${data.cowsRemaining}`, 20, 175);
      }
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.fillText(`MOVES: ${movesUsed}/${turnBudget}`, W - 20, 40);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.fillText(`COMBO x${combo}`, W - 20, 65);

    if (combo > 1) {
      ctx.fillStyle = `rgba(255, ${Math.max(0, 200 - combo * 15)}, 0, ${0.7 + Math.sin(time * 8) * 0.3})`;
      ctx.fillText(`COMBO x${combo}`, W - 20, 65);
    }

    this.drawHealthBar(ctx, health);
    this.drawDeadeyeMeter(ctx, deadeye, deadeyeMax);
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D, health: number): void {
    const hx = W - 220;
    const hy = 95;
    const hw = 180;
    const hh = 20;
    const hr = 10;

    ctx.fillStyle = CONFIG.colors.healthBarBg;
    ctx.beginPath();
    ctx.moveTo(hx + hr, hy);
    ctx.lineTo(hx + hw - hr, hy);
    ctx.quadraticCurveTo(hx + hw, hy, hx + hw, hy + hr);
    ctx.lineTo(hx + hw, hy + hh - hr);
    ctx.quadraticCurveTo(hx + hw, hy + hh, hx + hw - hr, hy + hh);
    ctx.lineTo(hx + hr, hy + hh);
    ctx.quadraticCurveTo(hx, hy + hh, hx, hy + hh - hr);
    ctx.lineTo(hx, hy + hr);
    ctx.quadraticCurveTo(hx, hy, hx + hr, hy);
    ctx.closePath();
    ctx.fill();

    const bw = (hw - 4) * (health / 100);
    const hgrad = ctx.createLinearGradient(hx, 0, hx + hw, 0);
    hgrad.addColorStop(0, CONFIG.colors.hudGold);
    hgrad.addColorStop(1, CONFIG.colors.hudOrange);
    ctx.fillStyle = hgrad;
    ctx.fillRect(hx + 2, hy + 2, bw, hh - 4);

    ctx.fillStyle = CONFIG.colors.gunBody;
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HP ${Math.floor(health)}`, hx + hw / 2, hy + hh / 2);
    ctx.textBaseline = 'alphabetic';
  }

  private drawDeadeyeMeter(ctx: CanvasRenderingContext2D, current: number, max: number): void {
    const bx = W / 2 - 120;
    const by = 10;
    const bw = 240;
    const bh = 14;

    ctx.fillStyle = '#1a0a05';
    ctx.fillRect(bx, by, bw, bh);

    const ratio = Math.min(current / max, 1);
    const fillW = bw * ratio;

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#8b4513');
    grad.addColorStop(0.5, '#cc6600');
    grad.addColorStop(1, '#ff4500');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, fillW, bh);

    ctx.strokeStyle = '#5c3a21';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    const label = current >= max ? 'DEADEYE READY' : 'DEADEYE';
    ctx.fillText(label, W / 2, by + 11);
  }
}
