import { CONFIG } from './config';
import type { TownDef } from './data';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

export class TownSelect {
  draw(ctx: CanvasRenderingContext2D, town: TownDef): void {
    ctx.fillStyle = '#1a0a05';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    const label = town.type === 'wilderness' ? 'Wilderness' : 'Town';
    ctx.fillStyle = CONFIG.colors.hudGray;
    ctx.font = '20px Courier New';
    ctx.fillText(`— ${label} —`, W / 2, H * 0.1);

    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 44px Courier New';
    ctx.fillText(town.name, W / 2, H * 0.18);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = '18px Courier New';

    const infoY = Math.floor(H * 0.25);
    const lines = [
      `Turn Budget: ${town.turnBudget}`,
      `Score Target: ${town.scoreTarget}`,
    ];

    if (town.gripReduction > 0) {
      lines.push(`Grip Reduction: -${town.gripReduction}`);
    }

    if (town.hasShootout) {
      lines.push('Shootout: Yes');
    }

    if (town.type === 'wilderness') {
      lines.push('Loadout will be locked through this leg.');
    }

    lines.forEach((line, i) => {
      ctx.fillText(line, W / 2, infoY + i * 30);
    });

    const btnY = Math.floor(H * 0.44);
    const pulse = 0.5 + Math.sin(performance.now() / 300) * 0.5;
    ctx.globalAlpha = 0.7 + pulse * 0.3;

    ctx.fillStyle = town.type === 'town' ? '#7a4a2b' : '#5c3a21';
    ctx.fillRect(W / 2 - 120, btnY, 240, 50);

    ctx.strokeStyle = CONFIG.colors.hudGold;
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 120, btnY, 240, 50);

    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 22px Courier New';
    ctx.fillText('RIDE OUT', W / 2, btnY + 33);

    ctx.globalAlpha = 1;
  }

  handleClick(mx: number, my: number): boolean {
    const btnY = Math.floor(H * 0.44);
    return (
      mx >= W / 2 - 120 && mx <= W / 2 + 120 &&
      my >= btnY && my <= btnY + 50
    );
  }
}
