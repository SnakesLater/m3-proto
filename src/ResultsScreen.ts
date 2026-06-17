import { CONFIG } from './config';
import type { LevelResult } from './data';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export class ResultsScreen {
  animTimer = 0;
  animDuration = 0.8;
  activeResult: LevelResult | null = null;

  start(result: LevelResult): void {
    this.animTimer = 0;
    this.activeResult = result;
  }

  update(dt: number): void {
    if (this.activeResult) {
      this.animTimer = Math.min(this.animTimer + dt, this.animDuration);
    }
  }

  get displayScore(): number {
    if (!this.activeResult) return 0;
    const progress = easeOutCubic(this.animTimer / this.animDuration);
    return Math.floor(progress * this.activeResult.score);
  }

  draw(ctx: CanvasRenderingContext2D, result: LevelResult): void {
    ctx.fillStyle = '#1a0a05';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    if (result.passed) {
      ctx.fillStyle = '#4a4';
      ctx.font = 'bold 48px Courier New';
      ctx.fillText('CLEAR!', W / 2, 100);
    } else {
      ctx.fillStyle = '#cc3333';
      ctx.font = 'bold 48px Courier New';
      ctx.fillText('OUT OF MOVES', W / 2, 100);
    }

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '20px Courier New';

    const showScore = this.displayScore;
    const lines: string[] = [
      `Score: ${showScore} / ${result.scoreTarget}`,
      `Turns Used: ${result.turnsUsed} / ${result.turnBudget}`,
    ];

    if (result.gripReduction > 0) {
      lines.push(`Grip Reduced: -${result.gripReduction}`);
    }

    if (result.deadeyeUsed) {
      lines.push('Deadeye: Activated');
    }

    if (result.shootoutHostiles !== undefined) {
      lines.push(`Hostiles shot: ${result.shootoutHostiles}`);
    }

    if (result.shootoutFriendlies !== undefined && result.shootoutFriendlies > 0) {
      lines.push(`Friendly fire: ${result.shootoutFriendlies}`);
    }

    lines.forEach((line, i) => {
      ctx.fillStyle = CONFIG.colors.hudWhite;
      ctx.fillText(line, W / 2, 200 + i * 35);
    });

    const btnY = 420;
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(W / 2 - 120, btnY, 240, 50);

    ctx.strokeStyle = CONFIG.colors.hudGold;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 120, btnY, 240, 50);

    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 22px Courier New';
    ctx.fillText('CONTINUE', W / 2, btnY + 33);
  }

  handleClick(mx: number, my: number): boolean {
    const btnY = 420;
    return (
      mx >= W / 2 - 120 && mx <= W / 2 + 120 &&
      my >= btnY && my <= btnY + 50
    );
  }
}
