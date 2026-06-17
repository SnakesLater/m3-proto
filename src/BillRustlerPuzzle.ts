import type { BossPuzzle, BossPuzzleResult } from './BossPuzzle';
import { CONFIG } from './config';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

const COW_NAMES = [
  'Bessie', 'Clover', 'Daisy', 'Buttercup',
  'Mabel', 'Hazel', 'Maple', 'Willow',
  'Penny', 'Ruby',
];

type LocationId = 'cow_left' | 'cow_right' | 'shed';
type ActionId = 'revolver' | 'dynamite';

interface LocationDef {
  id: LocationId;
  label: string;
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

export class BillRustlerPuzzle implements BossPuzzle {
  readonly name = 'Bill the Rustler';
  private state = PuzzleState.Telegraph;
  private timer = 0;
  private telegraphLocation: LocationId = 'cow_left';
  private chosenAction: ActionId | null = null;
  private _done = false;
  private _result: BossPuzzleResult = { bossDamage: 0, playerDamage: 0, scoreBonus: 0, narrativeLine: '' };
  private _hasResult = false;
  private cowNameMap: Map<LocationId, string> = new Map();
  private billLocation: LocationId = 'cow_left';
  private selectedLocation: LocationId | null = null;

  private readonly locations: LocationDef[] = [
    { id: 'cow_left', label: '', x: 60, y: 200, w: 220, h: 200 },
    { id: 'cow_right', label: '', x: 370, y: 200, w: 220, h: 200 },
    { id: 'shed', label: 'Old Barn', x: 680, y: 200, w: 220, h: 200 },
  ];

  private readonly actions: ActionDef[] = [
    { id: 'revolver', label: 'Revolver', x: 150, y: 470, w: 200, h: 50 },
    { id: 'dynamite', label: 'Dynamite', x: 610, y: 470, w: 200, h: 50 },
  ];

  get done(): boolean { return this._done; }
  get hasResult(): boolean { return this._hasResult; }
  get result(): BossPuzzleResult { return this._result; }

  private pickBillLocation(): void {
    const ids: LocationId[] = ['cow_left', 'cow_right', 'shed'];
    this.billLocation = ids[Math.floor(Math.random() * ids.length)];
  }

  private pickTelegraphLocation(): void {
    const ids: LocationId[] = ['cow_left', 'cow_right', 'shed'];
    if (Math.random() < 0.5) {
      this.telegraphLocation = this.billLocation;
    } else {
      const others = ids.filter(l => l !== this.billLocation);
      this.telegraphLocation = others[Math.floor(Math.random() * others.length)];
    }
  }

  private assignCowNames(): void {
    const shuffled = [...COW_NAMES].sort(() => Math.random() - 0.5);
    this.cowNameMap.clear();
    this.cowNameMap.set('cow_left', shuffled[0 % shuffled.length]);
    this.cowNameMap.set('cow_right', shuffled[1 % shuffled.length]);
  }

  private beginEncounter(): void {
    this.state = PuzzleState.Telegraph;
    this.timer = 0;
    this.chosenAction = null;
    this.selectedLocation = null;
    this._done = false;
    this._hasResult = false;
    this.pickBillLocation();
    this.pickTelegraphLocation();
    this.assignCowNames();
  }

  start(): void {
    this.beginEncounter();
  }

  update(dt: number): void {
    this.timer += dt;

    switch (this.state) {
      case PuzzleState.Telegraph:
        if (this.timer >= 1.5) {
          this.timer = 0;
          this.state = PuzzleState.Choice;
        }
        break;

      case PuzzleState.Resolve:
        if (this.timer >= 2.0) {
          if (this._result.bossDamage > 0) {
            this._done = true;
          } else {
            this.beginEncounter();
          }
        }
        break;
    }
  }

  handleClick(mx: number, my: number): boolean {
    if (this.state !== PuzzleState.Choice) return false;

    for (const loc of this.locations) {
      if (mx >= loc.x && mx <= loc.x + loc.w && my >= loc.y && my <= loc.y + loc.h) {
        this.selectedLocation = loc.id;
        return true;
      }
    }

    if (this.selectedLocation) {
      for (const a of this.actions) {
        if (mx >= a.x && mx <= a.x + a.w && my >= a.y && my <= a.y + a.h) {
          this.chosenAction = a.id;
          this.resolve();
          this.state = PuzzleState.Resolve;
          this.timer = 0;
          return true;
        }
      }
    }

    return false;
  }

  private resolve(): void {
    const action = this.chosenAction!;
    const target = this.selectedLocation!;

    if (target === this.billLocation) {
      if (action === 'dynamite') {
        this._result = {
          bossDamage: 2,
          playerDamage: 0,
          scoreBonus: 100,
          narrativeLine: "The dynamite lands at Bill's feet! He's thrown clear — nice hit!",
        };
      } else {
        if (target === 'shed') {
          this._result = {
            bossDamage: 2,
            playerDamage: 0,
            scoreBonus: 100,
            narrativeLine: 'Your shot finds Bill through the barn wall! He won\'t forget that.',
          };
        } else {
          const hitBill = Math.random() < 0.7;
          if (hitBill) {
            this._result = {
              bossDamage: 2,
              playerDamage: 0,
              scoreBonus: 100,
              narrativeLine: `You nail Bill through the brush! The ${this.cowNameMap.get(target) || 'cow'} startles but Bill takes the hit.`,
            };
          } else {
            this._result = {
              bossDamage: 0,
              playerDamage: 0,
              scoreBonus: 0,
              narrativeLine: `Your shot clips the ${this.cowNameMap.get(target) || 'cow'} instead! Bill ducks away laughing.`,
            };
          }
        }
      }
    } else {
      if (action === 'dynamite') {
        this._result = {
          bossDamage: 0,
          playerDamage: 0,
          scoreBonus: 0,
          narrativeLine: 'The blast kicks up dust but Bill isn\'t there. Keep searching!',
        };
      } else {
        if (target === 'shed') {
          this._result = {
            bossDamage: 0,
            playerDamage: 0,
            scoreBonus: 0,
            narrativeLine: 'You kick the barn door open — empty. Bill\'s playing games with you.',
          };
        } else {
          this._result = {
            bossDamage: 0,
            playerDamage: 0,
            scoreBonus: 0,
            narrativeLine: `The ${this.cowNameMap.get(target) || 'cow'} moos in protest. No sign of Bill here.`,
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
    ctx.font = 'bold 20px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('DEADEYE — Bill the Rustler', W / 2, 40);

    this.drawLocations(ctx);

    if (this.state === PuzzleState.Choice) {
      this.drawPrompt(ctx);
      if (this.selectedLocation) {
        this.drawActions(ctx);
      }
    }

    if (this.state === PuzzleState.Resolve) {
      this.drawResolve(ctx);
    }

    ctx.textAlign = 'left';
  }

  private drawPrompt(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'center';

    if (this.selectedLocation) {
      const name = this.cowNameMap.get(this.selectedLocation) || 'the barn';
      ctx.fillText(`Targeting ${name} — pick your weapon:`, W / 2, 440);
    } else {
      ctx.fillText('Click a location to target:', W / 2, 440);
    }
  }

  private drawLocations(ctx: CanvasRenderingContext2D): void {
    for (const loc of this.locations) {
      const isTelegraph = loc.id === this.telegraphLocation;
      const isSelected = loc.id === this.selectedLocation;
      const pulse = 0.3 + Math.sin(this.timer * 4) * 0.2;

      ctx.fillStyle = isTelegraph ? '#3a1a1a' : '#2a1a0a';
      ctx.fillRect(loc.x, loc.y, loc.w, loc.h);

      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
      } else if (isTelegraph && (this.state === PuzzleState.Telegraph || this.state === PuzzleState.Choice)) {
        ctx.strokeStyle = `rgba(255, 50, 50, ${pulse})`;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 1;
      }
      ctx.strokeRect(loc.x, loc.y, loc.w, loc.h);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Courier New';
      ctx.textAlign = 'center';

      const displayName = loc.id === 'shed' ? loc.label : (this.cowNameMap.get(loc.id) || loc.id);
      ctx.fillText(displayName, loc.x + loc.w / 2, loc.y + 30);

      if (loc.id === 'cow_left' || loc.id === 'cow_right') {
        this.drawCowIcon(ctx, loc.x + loc.w / 2, loc.y + 100);
      } else {
        this.drawShedIcon(ctx, loc.x + loc.w / 2, loc.y + 100);
      }

      if (isTelegraph && (this.state === PuzzleState.Telegraph || this.state === PuzzleState.Choice)) {
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
        ctx.fillRect(loc.x, loc.y, loc.w, loc.h);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('??? MOVEMENT ???', loc.x + loc.w / 2, loc.y + 170);
      }
    }
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
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';

    for (const a of this.actions) {
      const bgColor = a.id === 'dynamite' ? '#8b4513' : '#5c3a21';
      ctx.fillStyle = bgColor;
      ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.strokeStyle = '#8b6914';
      ctx.lineWidth = 2;
      ctx.strokeRect(a.x, a.y, a.w, a.h);

      ctx.fillStyle = '#ffd700';
      ctx.fillText(a.label, a.x + a.w / 2, a.y + 32);
    }
  }

  private drawResolve(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';

    const text = this._result.bossDamage > 0 ? 'HIT!' : 'MISS!';
    ctx.fillText(text, W / 2, H / 2 - 80);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Courier New';
    ctx.fillText(this._result.narrativeLine, W / 2, H / 2 - 30);

    if (this._result.bossDamage > 0) {
      ctx.fillStyle = '#4a4';
      ctx.font = 'bold 20px Courier New';
      ctx.fillText(`Boss Damage: ${this._result.bossDamage}`, W / 2, H / 2 + 30);
    }

    if (this._result.scoreBonus > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`Score: +${this._result.scoreBonus}`, W / 2, H / 2 + 60);
    }
  }
}
