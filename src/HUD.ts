import { CONFIG } from './config';
import { drawSpriteCentered } from './assets/draw';

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
  showHealthBar?: boolean;
}

export class HUD {
  draw(ctx: CanvasRenderingContext2D, data: HUDData): void {
    const {
      score, level, combo, health, time,
      movesUsed, turnBudget, scoreTarget, deadeye, deadeyeMax, lassos,
    } = data;

    this.drawDeadeyeMeter(ctx, deadeye, deadeyeMax);

    drawSpriteCentered(ctx, 'terry_revolver', 0, 35, 35, 30);

    ctx.textAlign = 'left';
    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 20px Courier New';
    ctx.fillText(`SCORE: ${Math.floor(score)}`, 60, 28);

    ctx.fillStyle = CONFIG.colors.hudGray;
    ctx.font = '14px Courier New';
    ctx.fillText(`GOAL: ${scoreTarget}`, 60, 46);

    ctx.textAlign = 'right';
    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '20px Courier New';
    ctx.fillText(`MOVES: ${movesUsed}/${turnBudget}`, W - 10, 28);

    ctx.textAlign = 'left';
    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '20px Courier New';
    ctx.fillText(`LVL: ${level}`, 60, 72);

    drawSpriteCentered(ctx, 'terry_belt', 3, 35, 82, 20);

    ctx.fillStyle = '#c49a6c';
    ctx.font = '18px Courier New';
    ctx.fillText(`LASSOS: ${lassos}/${CONFIG.game.lassoMax}`, 60, 96);

    if (data.isBossLevel) {
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 16px Courier New';
      if (data.heartsOnBoard !== undefined) {
        ctx.fillText(`HEARTS: ${data.heartsOnBoard}`, 10, 120);
      }
      if (data.cowsRemaining !== undefined && data.cowsRemaining > 0) {
        ctx.fillStyle = '#8b6914';
        ctx.fillText(`COWS: ${data.cowsRemaining}`, 130, 120);
      }
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '20px Courier New';
    ctx.fillText(`COMBO x${combo}`, W - 10, 72);

    if (combo > 1) {
      ctx.fillStyle = `rgba(255, ${Math.max(0, 200 - combo * 15)}, 0, ${0.7 + Math.sin(time * 8) * 0.3})`;
      ctx.fillText(`COMBO x${combo}`, W - 10, 72);
    }

    if (data.showHealthBar !== false) {
      this.drawCompactHealthBar(ctx, health);
    }
  }

  private drawCompactHealthBar(ctx: CanvasRenderingContext2D, health: number): void {
    const hx = W - 180;
    const hy = 80;
    const hw = 170;
    const hh = 22;

    ctx.fillStyle = CONFIG.colors.healthBarBg;
    ctx.fillRect(hx, hy, hw, hh);

    const bw = hw * (health / 100);
    const hgrad = ctx.createLinearGradient(hx, 0, hx + hw, 0);
    hgrad.addColorStop(0, CONFIG.colors.hudGold);
    hgrad.addColorStop(1, CONFIG.colors.hudOrange);
    ctx.fillStyle = hgrad;
    ctx.fillRect(hx + 1, hy + 1, bw - 2, hh - 2);

    drawSpriteCentered(ctx, 'health_ui', 0, hx + hw + 14, hy + hh / 2, 20);

    ctx.fillStyle = CONFIG.colors.gunBody;
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`HP ${Math.floor(health)}`, hx + hw / 2, hy + hh / 2);
    ctx.textBaseline = 'alphabetic';
  }

  private drawDeadeyeMeter(ctx: CanvasRenderingContext2D, current: number, max: number): void {
    const bx = 90;
    const by = 4;
    const bw = W - 180;
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

    drawSpriteCentered(ctx, 'piece_star', 0, bx - 14, by + bh / 2, 14);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = 'bold 10px Courier New';
    ctx.textAlign = 'center';
    const label = current >= max ? 'DEADEYE READY' : 'DEADEYE';
    ctx.fillText(label, W / 2, by + 11);
  }
}
