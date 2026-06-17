import { CONFIG } from './config';
import type { RegionDef } from './data';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

const CARD_W = 220;
const CARD_H = 70;

const TOWN_POS = [
  { x: W * 0.3, y: 155 },
  { x: W * 0.7, y: 155 },
  { x: W * 0.3, y: 270 },
  { x: W * 0.7, y: 270 },
  { x: W * 0.3, y: 385 },
  { x: W * 0.7, y: 385 },
];

export type MapClickResult = { type: 'town'; townIndex: number } | null;

export class RegionMap {
  draw(ctx: CanvasRenderingContext2D, region: RegionDef, clearedTowns: number, currentGrip: number, time: number): void {
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#2a1a0e');
    bg.addColorStop(1, '#1a0f05');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    ctx.textAlign = 'center';
    ctx.fillStyle = CONFIG.colors.hudGold;
    ctx.font = 'bold 32px Courier New';
    ctx.fillText(region.name, W / 2, 40);

    ctx.fillStyle = CONFIG.colors.hudOrange;
    ctx.font = '18px Courier New';
    ctx.fillText(`Gang: ${region.gangName}`, W / 2, 68);

    this.drawGripBar(ctx, currentGrip, region.gangGrip);

    this.drawTrail(ctx, clearedTowns);

    for (let i = 0; i < region.towns.length; i++) {
      this.drawTownCard(ctx, region, i, clearedTowns, time);
    }
  }

  private drawTrail(ctx: CanvasRenderingContext2D, clearedTowns: number): void {
    ctx.strokeStyle = '#5c3a21';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);

    for (let i = 0; i < TOWN_POS.length - 1; i++) {
      const from = TOWN_POS[i];
      const to = TOWN_POS[i + 1];

      ctx.beginPath();
      if (from.y === to.y) {
        ctx.moveTo(from.x - CARD_W / 2 + 25 + 16, from.y + CARD_H / 2);
        ctx.lineTo(to.x - CARD_W / 2 + 25 - 16, to.y + CARD_H / 2);
      } else {
        const ex = from.x - CARD_W / 2 + 25 + 16;
        ctx.moveTo(ex, from.y + CARD_H / 2);
        ctx.lineTo(ex, from.y + CARD_H + 10);
        ctx.lineTo(to.x - CARD_W / 2 + 25 - 16, from.y + CARD_H + 10);
        ctx.lineTo(to.x - CARD_W / 2 + 25 - 16, to.y);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  private drawTownCard(ctx: CanvasRenderingContext2D, region: RegionDef, index: number, clearedTowns: number, time: number): void {
    const town = region.towns[index];
    const pos = TOWN_POS[index];
    const cleared = index < clearedTowns;
    const unlocked = index <= clearedTowns;
    const current = index === clearedTowns;
    const cx = pos.x;
    const cy = pos.y;

    ctx.save();

    if (current) {
      const pulse = 0.3 + Math.sin(time * 4) * 0.15;
      ctx.shadowColor = CONFIG.colors.hudGold;
      ctx.shadowBlur = 12 + pulse * 8;
    }

    ctx.fillStyle = !unlocked ? '#1a0f06' : cleared ? '#2a1a0e' : current ? '#3a2510' : '#2a1a0e';
    ctx.fillRect(cx - CARD_W / 2, cy, CARD_W, CARD_H);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = !unlocked ? '#2a1a0a' : cleared ? '#4a4' : current ? CONFIG.colors.hudGold : '#5c3a21';
    ctx.lineWidth = current ? 2 : 1;
    ctx.strokeRect(cx - CARD_W / 2, cy, CARD_W, CARD_H);

    const circleX = cx - CARD_W / 2 + 25;
    const circleY = cy + CARD_H / 2;

    ctx.beginPath();
    ctx.arc(circleX, circleY, 16, 0, Math.PI * 2);
    ctx.fillStyle = cleared ? '#2a6a2a' : current ? '#7a5a00' : unlocked ? '#4a3a2a' : '#1a1a1a';
    ctx.fill();

    ctx.strokeStyle = cleared ? '#4a4' : current ? CONFIG.colors.hudGold : '#5c3a21';
    ctx.lineWidth = cleared || current ? 2 : 1;
    ctx.beginPath();
    ctx.arc(circleX, circleY, 16, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = unlocked ? CONFIG.colors.hudWhite : '#444';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${index + 1}`, circleX, circleY);

    const iconX = cx - CARD_W / 2 + 55;
    this.drawIcon(ctx, iconX, circleY, town.type, unlocked, cleared);

    const nameX = iconX + 28;
    ctx.fillStyle = unlocked ? (cleared ? '#888' : CONFIG.colors.hudWhite) : '#444';
    ctx.font = 'bold 15px Courier New';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(unlocked ? town.name : '???', nameX, circleY - 8);

    ctx.fillStyle = unlocked ? (cleared ? '#666' : CONFIG.colors.hudGray) : '#333';
    ctx.font = '12px Courier New';
    ctx.fillText(town.type === 'town' ? 'TOWN' : 'WILDERNESS', nameX, circleY + 10);

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    if (current) {
      ctx.fillStyle = CONFIG.colors.hudGold;
      ctx.font = 'bold 14px Courier New';
      const a = 0.6 + (0.5 + Math.sin(time * 5) * 0.5) * 0.4;
      ctx.globalAlpha = a;
      ctx.fillText('▶ RIDE OUT', cx + CARD_W / 2 - 12, circleY);
      ctx.globalAlpha = 1;
    } else if (cleared) {
      ctx.fillStyle = '#4a4';
      ctx.font = 'bold 14px Courier New';
      ctx.fillText('✓ CLEARED', cx + CARD_W / 2 - 12, circleY);
    } else if (!unlocked) {
      ctx.fillStyle = '#555';
      ctx.font = '14px Courier New';
      ctx.fillText('LOCKED', cx + CARD_W / 2 - 12, circleY);
    }

    ctx.restore();
  }

  private drawIcon(ctx: CanvasRenderingContext2D, x: number, y: number, type: 'town' | 'wilderness', unlocked: boolean, cleared: boolean): void {
    const a = cleared ? 0.4 : unlocked ? 1 : 0.3;
    ctx.save();
    ctx.globalAlpha = a;

    if (type === 'town') {
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x - 10, y - 10, 20, 20);
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(x - 6, y - 4, 12, 14);
      ctx.fillStyle = '#a0724a';
      ctx.fillRect(x - 8, y - 12, 16, 4);
      ctx.fillStyle = '#3a1a0a';
      ctx.fillRect(x - 3, y + 2, 6, 8);
    } else {
      ctx.fillStyle = '#5c3a21';
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 6);
      ctx.lineTo(x, y - 12);
      ctx.lineTo(x + 12, y + 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(x - 1, y - 6, 2, 12);
      ctx.fillStyle = '#cc6600';
      ctx.beginPath();
      ctx.arc(x, y + 10, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff8c00';
      ctx.beginPath();
      ctx.arc(x, y + 10, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawGripBar(ctx: CanvasRenderingContext2D, current: number, max: number): void {
    const bx = W / 2 - 150;
    const by = 105;
    const bw = 300;
    const bh = 18;

    ctx.fillStyle = '#3a1a1a';
    ctx.fillRect(bx, by, bw, bh);

    const ratio = Math.max(0, current / max);
    const fillW = bw * ratio;

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#cc3333');
    grad.addColorStop(1, '#ff6600');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, fillW, bh);

    ctx.strokeStyle = '#5c3a21';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = CONFIG.colors.hudWhite;
    ctx.font = 'bold 13px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`GANG'S GRIP: ${Math.floor(current)} / ${max}`, W / 2, by + 14);
  }

  handleClick(mx: number, my: number, region: RegionDef, clearedTowns: number): MapClickResult {
    for (let i = 0; i < region.towns.length; i++) {
      const unlocked = i <= clearedTowns;
      if (!unlocked) continue;

      const pos = TOWN_POS[i];
      if (
        mx >= pos.x - CARD_W / 2 && mx <= pos.x + CARD_W / 2 &&
        my >= pos.y && my <= pos.y + CARD_H
      ) {
        return { type: 'town', townIndex: i };
      }
    }

    return null;
  }
}
