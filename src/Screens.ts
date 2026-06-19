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
    ctx.fillText('DESERT GUNNER', W / 2, H * 0.2);

    ctx.fillStyle = CONFIG.colors.hudOrange;
    ctx.font = 'bold 48px Courier New';
    ctx.fillText('Matched by Bullets', W / 2, H * 0.27);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '28px Courier New';
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillText('CLICK TO START', W / 2, H * 0.4);
    ctx.globalAlpha = 1;

    ctx.fillStyle = CONFIG.colors.hudGray;
    ctx.font = '22px Courier New';
    ctx.fillText('Match 3+ pieces. Each match fires your gun.', W / 2, H * 0.47);
    ctx.fillText('Outlaw | Bandit | Snake | Coyote | Vulture', W / 2, H * 0.5);
  }

  drawGameOver(ctx: CanvasRenderingContext2D, score: number, level: number, time: number): void {
    ctx.fillStyle = CONFIG.colors.gameOverBg;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.colors.gameOverRed;
    ctx.font = 'bold 72px Courier New';
    ctx.fillText('GAME OVER', W / 2, H * 0.26);

    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 32px Courier New';
    ctx.fillText(`Final Score: ${Math.floor(score)}`, W / 2, H * 0.33);
    ctx.fillText(`Level Reached: ${level}`, W / 2, H * 0.37);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '26px Courier New';
    const alpha = 0.5 + Math.sin(time * 3) * 0.5;
    ctx.globalAlpha = alpha;
    ctx.fillText('CLICK TO RETURN TO MENU', W / 2, H * 0.44);
    ctx.globalAlpha = 1;
  }
}
