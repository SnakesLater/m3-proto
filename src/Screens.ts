import { CONFIG } from './config';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

export class Screens {
  drawMenu(ctx: CanvasRenderingContext2D, time: number): void {
    ctx.fillStyle = CONFIG.colors.menuBg;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 72px Courier New';
    ctx.fillText('DESERT GUNNER', W / 2, 200);

    ctx.fillStyle = CONFIG.colors.hudOrange;
    ctx.font = 'bold 36px Courier New';
    ctx.fillText('Matched by Bullets', W / 2, 260);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '24px Courier New';
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillText('CLICK TO START', W / 2, 380);
    ctx.globalAlpha = 1;

    ctx.fillStyle = CONFIG.colors.hudGray;
    ctx.font = '18px Courier New';
    ctx.fillText('Match 3+ pieces. Each match fires your gun.', W / 2, 450);
    ctx.fillText('Outlaw | Bandit | Snake | Coyote | Vulture', W / 2, 480);
  }

  drawGameOver(ctx: CanvasRenderingContext2D, score: number, level: number, time: number): void {
    ctx.fillStyle = CONFIG.colors.gameOverBg;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.colors.gameOverRed;
    ctx.font = 'bold 64px Courier New';
    ctx.fillText('GAME OVER', W / 2, 250);

    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 28px Courier New';
    ctx.fillText(`Final Score: ${Math.floor(score)}`, W / 2, 310);
    ctx.fillText(`Level Reached: ${level}`, W / 2, 350);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '22px Courier New';
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillText('CLICK TO RETURN TO MENU', W / 2, 420);
    ctx.globalAlpha = 1;
  }
}
