import type { BossPuzzle, BossPuzzleResult } from './BossPuzzle';
import { CONFIG } from './config';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

const TELEGRAPH_DURATION = 1.5;
const RESOLVE_DURATION = 2.0;

const COW_NAMES = [
  'Bessie', 'Clover', 'Daisy', 'Buttercup',
  'Mabel', 'Hazel', 'Maple', 'Willow',
  'Penny', 'Ruby',
];

type SlotType = 'cow' | 'grass' | 'outhouse' | 'ranch_house' | 'shed';
type ActionId = 'revolver' | 'dynamite' | 'lasso' | 'hold';

const ALL_TYPES: SlotType[] = ['cow', 'outhouse', 'ranch_house', 'shed', 'grass'];

interface PositionDef {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface ActionDef {
  id: ActionId;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

enum PuzzleState {
  Telegraph,
  Choice,
  Resolve,
  Done,
}

const EMPTY_RESULT: BossPuzzleResult = { bossDamage: 0, playerDamage: 0, scoreBonus: 0, narrativeLine: '', turnPenalty: 0, lassosUsed: 0 };

export class BillRustlerPuzzle implements BossPuzzle {
  readonly name = 'Bill the Rustler';
  private state = PuzzleState.Telegraph;
  private timer = 0;
  private selectedSlot = -1;
  private chosenAction: ActionId | null = null;
  private _done = false;
  private _result: BossPuzzleResult = { ...EMPTY_RESULT };
  private _hasResult = false;

  lassosAvailable = 0;

  private readonly positions: PositionDef[] = (() => {
    const slotW = Math.floor(W * 0.28);
    const slotH = Math.floor(H * 0.2);
    const slotY = Math.floor(H * 0.2);
    const gap = Math.floor((W - slotW * 3) / 4);
    return [
      { x: gap, y: slotY, w: slotW, h: slotH },
      { x: gap * 2 + slotW, y: slotY, w: slotW, h: slotH },
      { x: gap * 3 + slotW * 2, y: slotY, w: slotW, h: slotH },
    ];
  })();

  private readonly actions: ActionDef[] = (() => {
    const btnW = Math.floor(W * 0.35);
    const btnH = 50;
    const actionY = Math.floor(H * 0.55);
    const half = Math.floor((W - btnW * 2) / 3);
    return [
      { id: 'dynamite', label: 'Dynamite', x: half, y: actionY, w: btnW, h: btnH },
      { id: 'revolver', label: 'Revolver', x: half * 2 + btnW, y: actionY, w: btnW, h: btnH },
      { id: 'lasso', label: 'Lasso', x: half, y: actionY + 60, w: btnW, h: btnH },
      { id: 'hold', label: 'Hold', x: half * 2 + btnW, y: actionY + 60, w: btnW, h: btnH },
    ];
  })();

  posTypes: (SlotType | null)[] = [null, null, null];
  billPosition = -1;
  telegraphPosition = -1;
  posDestroyed: boolean[] = [false, false, false];
  posCowNames: (string | null)[] = [null, null, null];
  usedCowNames: string[] = [];

  get done(): boolean { return this._done; }
  get hasResult(): boolean { return this._hasResult; }
  get result(): BossPuzzleResult { return this._result; }

  private assignEncounter(): void {
    const poolItems: string[] = [];

    for (const name of COW_NAMES) {
      if (!this.usedCowNames.includes(name)) {
        poolItems.push(`cow:${name}`);
      }
    }

    const hasCows = poolItems.filter(p => p.startsWith('cow:')).length > 0;

    poolItems.push('outhouse');
    poolItems.push('ranch_house');
    poolItems.push('shed');

    if (!hasCows) {
      poolItems.push('grass');
    }

    for (let i = poolItems.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [poolItems[i], poolItems[j]] = [poolItems[j], poolItems[i]];
    }

    const remaining = [...poolItems];

    for (let i = 0; i < 3; i++) {
      const valid = remaining.filter(item => {
        if (item.startsWith('cow:') && this.posDestroyed[i]) return false;
        return true;
      });

      if (valid.length > 0) {
        const chosen = valid[Math.floor(Math.random() * valid.length)];
        const idx = remaining.indexOf(chosen);
        remaining.splice(idx, 1);

        if (chosen.startsWith('cow:')) {
          this.posTypes[i] = 'cow';
          this.posCowNames[i] = chosen.slice(4);
        } else if (chosen === 'grass') {
          this.posTypes[i] = 'grass';
          this.posCowNames[i] = null;
        } else {
          this.posTypes[i] = chosen as SlotType;
          this.posCowNames[i] = null;
        }
      } else {
        this.posTypes[i] = null;
        this.posCowNames[i] = null;
      }
    }

    this.billPosition = Math.floor(Math.random() * 3);

    if (Math.random() < 0.5) {
      this.telegraphPosition = this.billPosition;
    } else {
      const others = [0, 1, 2].filter(i => i !== this.billPosition);
      this.telegraphPosition = others.length > 0
        ? others[Math.floor(Math.random() * others.length)]
        : this.billPosition;
    }
  }

  start(): void {
    this.state = PuzzleState.Telegraph;
    this.timer = 0;
    this.selectedSlot = -1;
    this.chosenAction = null;
    this._done = false;
    this._hasResult = false;
    this._result = { ...EMPTY_RESULT };

    this.posTypes = [null, null, null];
    this.posCowNames = [null, null, null];

    this.assignEncounter();
  }

  update(dt: number): void {
    this.timer += dt;

    switch (this.state) {
      case PuzzleState.Telegraph:
        if (this.timer >= TELEGRAPH_DURATION) {
          this.timer = 0;
          this.state = PuzzleState.Choice;
        }
        break;

      case PuzzleState.Resolve:
        if (this.timer >= RESOLVE_DURATION) {
          this._done = true;
        }
        break;
    }
  }

  handleClick(mx: number, my: number): boolean {
    if (this.state !== PuzzleState.Choice) return false;

    for (const a of this.actions) {
      if (mx < a.x || mx > a.x + a.w || my < a.y || my > a.y + a.h) continue;

      if (a.id === 'hold') {
        this.chosenAction = 'hold';
        this.selectedSlot = -1;
        this.resolve();
        this.state = PuzzleState.Resolve;
        this.timer = 0;
        return true;
      }

      if (this.selectedSlot < 0) return false;

      if (a.id === 'lasso' && !this.canLasso()) return true;

      this.chosenAction = a.id;
      this.resolve();
      this.state = PuzzleState.Resolve;
      this.timer = 0;
      return true;
    }

    for (let i = 0; i < this.positions.length; i++) {
      const p = this.positions[i];
      if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h) {
        this.selectedSlot = i;
        return true;
      }
    }

    return false;
  }

  private canLasso(): boolean {
    if (this.lassosAvailable <= 0) return false;
    if (this.selectedSlot < 0) return false;
    return this.posTypes[this.selectedSlot] === 'cow' && !this.posDestroyed[this.selectedSlot];
  }

  private resolve(): void {
    const action = this.chosenAction!;

    if (action === 'hold') {
      this._result = {
        bossDamage: 0,
        playerDamage: 0,
        scoreBonus: 0,
        narrativeLine: 'You hold your position and observe...',
        turnPenalty: 0,
        lassosUsed: 0,
      };
      this._hasResult = true;
      return;
    }

    const slot = this.selectedSlot;
    const destroyed = this.posDestroyed[slot];
    const type = this.posTypes[slot];

    if (this.billPosition === slot) {
      if (destroyed) {
        this._result = {
          bossDamage: 2,
          playerDamage: 0,
          scoreBonus: 50,
          narrativeLine: 'Bill is exposed in the open! Easy shot.',
          turnPenalty: 0,
          lassosUsed: 0,
        };
      } else if (action === 'lasso') {
        this.usedCowNames.push(this.posCowNames[slot] || '');
        this._result = {
          bossDamage: 2,
          playerDamage: 0,
          scoreBonus: 100,
          narrativeLine: `You lasso Bill through ${this.posCowNames[slot] || 'the cow'}!`,
          turnPenalty: 0,
          lassosUsed: 1,
        };
      } else if (action === 'dynamite') {
        this.posDestroyed[slot] = true;
        if (type === 'cow') {
          this.usedCowNames.push(this.posCowNames[slot] || '');
        }
        this._result = {
          bossDamage: 10,
          playerDamage: 0,
          scoreBonus: 100,
          narrativeLine: 'Dynamite at his feet! Bill takes a massive blast.',
          turnPenalty: 0,
          lassosUsed: 0,
        };
      } else if (type === 'cow') {
        const hitBill = Math.random() < 0.7;
        if (hitBill) {
          this._result = {
            bossDamage: 2,
            playerDamage: 0,
            scoreBonus: 100,
            narrativeLine: `You nail Bill through the ${this.posCowNames[slot] || 'cow'}! Clean hit.`,
            turnPenalty: 0,
            lassosUsed: 0,
          };
        } else {
          this.usedCowNames.push(this.posCowNames[slot] || '');
          this._result = {
            bossDamage: 1,
            playerDamage: 0,
            scoreBonus: 0,
            narrativeLine: `The ${this.posCowNames[slot] || 'cow'} deflects your shot! Bill is grazed.`,
            turnPenalty: 1,
            lassosUsed: 0,
          };
        }
      } else {
        this._result = {
          bossDamage: 2,
          playerDamage: 0,
          scoreBonus: 100,
          narrativeLine: 'Your shot finds Bill cold!',
          turnPenalty: 0,
          lassosUsed: 0,
        };
      }
    } else {
      if (action === 'lasso') {
        this.usedCowNames.push(this.posCowNames[slot] || '');
        this._result = {
          bossDamage: 0,
          playerDamage: 0,
          scoreBonus: 0,
          narrativeLine: `${this.posCowNames[slot] || 'The cow'} is lassoed. Bill's not here.`,
          turnPenalty: 0,
          lassosUsed: 1,
        };
      } else if (action === 'dynamite') {
        this.posDestroyed[slot] = true;
        if (type === 'cow') {
          this.usedCowNames.push(this.posCowNames[slot] || '');
        }
        const noun = type === 'cow'
          ? 'cow field'
          : type === 'outhouse'
            ? 'outhouse'
            : type === 'ranch_house'
              ? 'ranch house'
              : type === 'grass'
                ? 'open field'
                : 'barn';
        this._result = {
          bossDamage: 0,
          playerDamage: 0,
          scoreBonus: 0,
          narrativeLine: `The ${noun} is destroyed! Bill wasn't there.`,
          turnPenalty: 1,
          lassosUsed: 0,
        };
      } else {
        if (type === 'cow') {
          this.usedCowNames.push(this.posCowNames[slot] || '');
          this._result = {
            bossDamage: 0,
            playerDamage: 0,
            scoreBonus: 0,
            narrativeLine: `The ${this.posCowNames[slot] || 'cow'} bolts! Bill's not here.`,
            turnPenalty: 1,
            lassosUsed: 0,
          };
        } else if (type === 'grass') {
          this._result = {
            bossDamage: 0,
            playerDamage: 0,
            scoreBonus: 0,
            narrativeLine: 'The open field is empty. Bill\'s not here.',
            turnPenalty: 1,
            lassosUsed: 0,
          };
        } else if (type === 'shed') {
          this._result = {
            bossDamage: 0,
            playerDamage: 0,
            scoreBonus: 0,
            narrativeLine: 'The barn is empty. Bill\'s not here.',
            turnPenalty: 1,
            lassosUsed: 0,
          };
        } else if (type === 'ranch_house') {
          this._result = {
            bossDamage: 0,
            playerDamage: 0,
            scoreBonus: 0,
            narrativeLine: 'The ranch house is quiet. Bill\'s playing games.',
            turnPenalty: 1,
            lassosUsed: 0,
          };
        } else {
          this._result = {
            bossDamage: 0,
            playerDamage: 0,
            scoreBonus: 0,
            narrativeLine: 'The outhouse is empty. Nice try.',
            turnPenalty: 1,
            lassosUsed: 0,
          };
        }
      }
    }

    this._hasResult = true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('DEADEYE — Bill the Rustler', W / 2, Math.floor(H * 0.06));

    this.drawSlots(ctx);

    if (this.state === PuzzleState.Choice) {
      this.drawPrompt(ctx);
      this.drawActions(ctx);
    }

    if (this.state === PuzzleState.Resolve) {
      this.drawResolve(ctx);
    }

    ctx.textAlign = 'left';
  }

  private drawPrompt(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#fff';
    ctx.font = '18px Courier New';
    ctx.textAlign = 'center';

    const promptY = Math.floor(H * 0.47);
    if (this.selectedSlot >= 0) {
      const type = this.posTypes[this.selectedSlot];
      const destroyed = this.posDestroyed[this.selectedSlot];
      const name = destroyed ? 'the ruins' : (
        type === 'cow' ? (this.posCowNames[this.selectedSlot] || 'a cow') :
        type === 'grass' ? 'the open field' :
        type === 'shed' ? 'the barn' :
        type === 'ranch_house' ? 'the ranch house' :
        'the outhouse'
      );
      ctx.fillText(`Targeting ${name} — pick your weapon:`, W / 2, promptY);
    } else {
      ctx.fillText('Click a spot to target, or Hold to pass:', W / 2, promptY);
    }
  }

  private drawSlots(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.positions.length; i++) {
      const pos = this.positions[i];
      const type = this.posTypes[i];
      const destroyed = this.posDestroyed[i];
      const hasBill = i === this.billPosition;
      const isTelegraph = i === this.telegraphPosition;
      const isSelected = i === this.selectedSlot;
      const pulse = 0.3 + Math.sin(this.timer * 4) * 0.2;

      ctx.fillStyle = destroyed ? '#1a2a1a' : (isTelegraph ? '#3a1a1a' : '#2a1a0a');
      ctx.fillRect(pos.x, pos.y, pos.w, pos.h);

      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
      } else if (isTelegraph && (this.state === PuzzleState.Telegraph || this.state === PuzzleState.Choice)) {
        ctx.strokeStyle = `rgba(255, 50, 50, ${pulse})`;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = destroyed ? '#3a5c3a' : '#5c3a21';
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(pos.x, pos.y, pos.w, pos.h);

      ctx.textAlign = 'center';

      if (destroyed) {
        this.drawDestroyedSlot(ctx, pos, type, hasBill);
      } else if (type === 'cow') {
        this.drawCowSlot(ctx, pos, this.posCowNames[i] || 'cow');
      } else if (type === 'grass') {
        this.drawOpenField(ctx, pos, hasBill);
      } else if (type === 'shed') {
        this.drawBuildingSlot(ctx, pos, 'Old Barn', false);
      } else if (type === 'ranch_house') {
        this.drawBuildingSlot(ctx, pos, 'Ranch House', true);
      } else if (type === 'outhouse') {
        this.drawBuildingSlot(ctx, pos, 'Outhouse', false);
      }

      if (!destroyed && isTelegraph && (this.state === PuzzleState.Telegraph || this.state === PuzzleState.Choice)) {
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
        ctx.fillRect(pos.x, pos.y, pos.w, pos.h);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px Courier New';
        ctx.fillText('??? MOVEMENT ???', pos.x + pos.w / 2, pos.y + pos.h - 30);
      }
    }
  }

  private drawDestroyedSlot(ctx: CanvasRenderingContext2D, pos: PositionDef, wasType: SlotType | null, hasBill: boolean): void {
    const cx = pos.x + pos.w / 2;
    const cy = pos.y + pos.h / 2;

    if (wasType === 'shed') {
      this.drawWreckedBarn(ctx, cx, cy);
    } else if (wasType === 'ranch_house') {
      this.drawWreckedRanchHouse(ctx, cx, cy);
    } else if (wasType === 'outhouse') {
      this.drawWreckedOuthouse(ctx, cx, cy);
    } else {
      this.drawGrass(ctx, cx, cy);
    }

    if (hasBill) {
      this.drawBillSilhouette(ctx, cx, cy);
    }

    ctx.fillStyle = hasBill ? '#ff6666' : '#667766';
    ctx.font = 'bold 12px Courier New';
    const caption = hasBill ? 'HOSTILE SPOTTED' : (
      wasType === 'shed' ? '— RUINS —' :
      wasType === 'ranch_house' ? '— BURNT —' :
      wasType === 'outhouse' ? '— SPLINTERED —' :
      '— EMPTY —'
    );
    ctx.fillText(caption, pos.x + pos.w / 2, pos.y + pos.h - 15);
  }

  private drawOpenField(ctx: CanvasRenderingContext2D, pos: PositionDef, hasBill: boolean): void {
    const cx = pos.x + pos.w / 2;
    const cy = pos.y + pos.h / 2;

    ctx.fillStyle = '#3a6b35';
    ctx.fillRect(cx - 80, cy - 50, 160, 100);

    ctx.fillStyle = '#4a8b45';
    for (let i = 0; i < 16; i++) {
      const gx = cx - 70 + Math.random() * 140;
      const gy = cy - 40 + Math.random() * 80;
      ctx.fillRect(gx, gy, 3, 8 + Math.random() * 6);
    }

    ctx.fillStyle = '#5c3a21';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('Open Field', cx, pos.y + 30);

    if (hasBill) {
      this.drawBillSilhouette(ctx, cx, cy);
      ctx.fillStyle = '#ff6666';
      ctx.font = 'bold 12px Courier New';
      ctx.fillText('HOSTILE SPOTTED', cx, pos.y + pos.h - 15);
    }
  }

  private drawCowSlot(ctx: CanvasRenderingContext2D, pos: PositionDef, name: string): void {
    const cx = pos.x + pos.w / 2;
    const cy = pos.y + pos.h / 2;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(name, cx, pos.y + 30);
    this.drawCowIcon(ctx, cx, cy - 20);
  }

  private drawBuildingSlot(ctx: CanvasRenderingContext2D, pos: PositionDef, label: string, isRanch: boolean): void {
    const cx = pos.x + pos.w / 2;
    const cy = pos.y + pos.h / 2;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, pos.y + 30);
    if (isRanch) {
      this.drawRanchHouse(ctx, cx, cy);
    } else if (label === 'Outhouse') {
      this.drawOuthouse(ctx, cx, cy);
    } else {
      this.drawShedIcon(ctx, cx, cy - 20);
    }
  }

  private drawGrass(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#3a6b35';
    ctx.fillRect(cx - 80, cy - 50, 160, 100);
    ctx.fillStyle = '#4a8b45';
    for (let i = 0; i < 12; i++) {
      const gx = cx - 70 + Math.random() * 140;
      const gy = cy - 40 + Math.random() * 80;
      ctx.fillRect(gx, gy, 3, 10 + Math.random() * 8);
    }
    ctx.fillStyle = '#5a3a1a';
    ctx.beginPath();
    ctx.ellipse(cx + 10, cy + 15, 14, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - 15, cy + 10, 10, 5, -0.1, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawBillSilhouette(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 30, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 14, cy - 42, 28, 6);
    ctx.fillRect(cx - 6, cy - 18, 12, 35);
    ctx.fillRect(cx - 20, cy + 10, 18, 6);
    ctx.fillRect(cx + 2, cy + 10, 18, 6);
  }

  private drawWreckedBarn(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(cx - 60, cy - 10, 120, 50);
    ctx.fillStyle = '#5a3a21';
    ctx.beginPath();
    ctx.moveTo(cx - 65, cy - 10);
    ctx.lineTo(cx, cy - 45);
    ctx.lineTo(cx + 65, cy - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 60, cy - 10);
    ctx.lineTo(cx, cy - 40);
    ctx.lineTo(cx + 60, cy - 10);
    ctx.stroke();

    const t = this.timer;
    ctx.fillStyle = `rgba(255, 120, 20, ${0.3 + Math.sin(t * 3) * 0.2})`;
    ctx.beginPath();
    ctx.arc(cx - 30, cy + 15, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 20, cy + 20, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 5, cy + 5, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy + 5);
    ctx.lineTo(cx - 30, cy - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 55, cy + 5);
    ctx.lineTo(cx + 30, cy - 20);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy + 20);
    ctx.lineTo(cx + 50, cy + 20);
    ctx.stroke();
  }

  private drawWreckedRanchHouse(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(cx - 60, cy - 15, 120, 55);
    ctx.strokeStyle = '#4a2a1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx - 60, cy - 15, 120, 55);

    ctx.strokeStyle = '#3a1a0a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 15);
    ctx.lineTo(cx - 30, cy - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 55, cy - 15);
    ctx.lineTo(cx + 30, cy - 30);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy + 25);
    ctx.lineTo(cx + 50, cy + 25);
    ctx.stroke();

    const t = this.timer;
    ctx.fillStyle = `rgba(255, 80, 10, ${0.2 + Math.sin(t * 2.5) * 0.15})`;
    ctx.beginPath();
    ctx.arc(cx - 20, cy + 10, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 15, cy + 15, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawWreckedOuthouse(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(cx - 25, cy - 5, 50, 40);
    ctx.fillStyle = '#5a3a21';
    ctx.beginPath();
    ctx.moveTo(cx - 28, cy - 5);
    ctx.lineTo(cx, cy - 25);
    ctx.lineTo(cx + 28, cy - 5);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#2a1a0a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 25, cy + 30);
    ctx.lineTo(cx - 10, cy + 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 25, cy + 30);
    ctx.lineTo(cx + 10, cy + 5);
    ctx.stroke();
    ctx.fillStyle = '#1a1a0a';
    ctx.fillRect(cx - 12, cy + 5, 8, 20);
  }

  private drawRanchHouse(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(cx - 50, cy - 15, 100, 55);
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.moveTo(cx - 55, cy - 15);
    ctx.lineTo(cx, cy - 45);
    ctx.lineTo(cx + 55, cy - 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a1a0a';
    ctx.fillRect(cx - 15, cy + 10, 12, 30);
    ctx.fillRect(cx + 15, cy + 5, 8, 15);
    ctx.fillStyle = '#4a2a1a';
    ctx.fillRect(cx - 45, cy + 35, 12, 5);
    ctx.fillRect(cx + 33, cy + 35, 12, 5);
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.arc(cx + 50, cy, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx + 48, cy - 20, 4, 20);
  }

  private drawOuthouse(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(cx - 20, cy - 10, 40, 40);
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.moveTo(cx - 23, cy - 10);
    ctx.lineTo(cx, cy - 28);
    ctx.lineTo(cx + 23, cy - 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a1a0a';
    ctx.beginPath();
    ctx.arc(cx + 8, cy + 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 8, cy + 5, 16, 20);
  }

  private drawCowIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#8b6914';
    ctx.beginPath();
    ctx.ellipse(cx, cy + 5, 25, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(cx - 18, cy + 18, 6, 16);
    ctx.fillRect(cx + 12, cy + 18, 6, 16);
    ctx.fillRect(cx - 6, cy + 18, 6, 16);
    ctx.fillRect(cx + 1, cy + 18, 6, 16);
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - 11, cy - 15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 15, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(cx - 11, cy - 15, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 15, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath();
    ctx.moveTo(cx - 6, cy - 24);
    ctx.lineTo(cx - 2, cy - 34);
    ctx.lineTo(cx + 2, cy - 24);
    ctx.closePath();
    ctx.fill();
  }

  private drawShedIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(cx - 30, cy - 15, 60, 50);
    ctx.fillStyle = '#8b5a2b';
    ctx.beginPath();
    ctx.moveTo(cx - 35, cy - 15);
    ctx.lineTo(cx, cy - 40);
    ctx.lineTo(cx + 35, cy - 15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3a1a0a';
    ctx.fillRect(cx - 8, cy + 10, 16, 25);
  }

  private drawActions(ctx: CanvasRenderingContext2D): void {
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center';

    for (const a of this.actions) {
      const isLasso = a.id === 'lasso';
      const isHold = a.id === 'hold';
      let enabled = false;

      if (isHold) {
        enabled = true;
      } else if (isLasso) {
        enabled = this.canLasso();
      } else {
        enabled = this.selectedSlot >= 0;
      }

      ctx.fillStyle = !enabled ? '#333' : (a.id === 'dynamite' ? '#8b4513' : '#5c3a21');
      ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.strokeStyle = enabled ? '#8b6914' : '#555';
      ctx.lineWidth = 2;
      ctx.strokeRect(a.x, a.y, a.w, a.h);

      ctx.fillStyle = enabled ? '#ffd700' : '#666';
      const label = isLasso ? `Lasso (${this.lassosAvailable})` : a.label;
      ctx.fillText(label, a.x + a.w / 2, a.y + 32);
    }
  }

  private drawResolve(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 32px Courier New';
    ctx.textAlign = 'center';

    const text = this._result.bossDamage > 0 ? 'HIT!' : (this._result.lassosUsed > 0 ? 'Lasso!' : 'MISS!');
    ctx.fillText(text, W / 2, H * 0.35);

    ctx.fillStyle = '#fff';
    ctx.font = '22px Courier New';
    ctx.fillText(this._result.narrativeLine, W / 2, H * 0.42);

    let ly = H * 0.5;
    if (this._result.bossDamage > 0) {
      ctx.fillStyle = '#4a4';
      ctx.font = 'bold 22px Courier New';
      ctx.fillText(`Boss Damage: ${this._result.bossDamage}`, W / 2, ly);
      ly += 35;
    }

    if (this._result.scoreBonus > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = '22px Courier New';
      ctx.fillText(`Score: +${this._result.scoreBonus}`, W / 2, ly);
      ly += 35;
    }

    if (this._result.turnPenalty > 0) {
      ctx.fillStyle = '#ff6644';
      ctx.font = 'bold 18px Courier New';
      ctx.fillText(`-${this._result.turnPenalty} Turn`, W / 2, ly);
      ly += 35;
    }

    if (this._result.lassosUsed > 0) {
      ctx.fillStyle = '#c49a6c';
      ctx.font = 'bold 18px Courier New';
      ctx.fillText(`Lassos Used: ${this._result.lassosUsed}`, W / 2, ly);
    }
  }
}
