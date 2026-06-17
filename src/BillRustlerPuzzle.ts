import type { BossPuzzle, BossPuzzleResult } from './BossPuzzle';
import { CONFIG } from './config';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

const COW_NAMES = [
  'Bessie', 'Clover', 'Daisy', 'Buttercup',
  'Mabel', 'Hazel', 'Maple', 'Willow',
  'Penny', 'Ruby',
];

type LocationId = 'cow_left' | 'cow_right' | 'shed' | 'open_ground';
type ActionId = 'revolver' | 'dynamite' | 'wait';

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
  LocationChoice,
  ActionChoice,
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
  private destroyedLocations: Set<LocationId> = new Set();
  private cowNameMap: Map<LocationId, string> = new Map();
  private billLocation: LocationId = 'cow_left';
  private selectedLocation: LocationId | null = null;
  private encounterCount = 0;

  private readonly locations: LocationDef[] = [
    { id: 'cow_left', label: '', x: 60, y: 200, w: 220, h: 200 },
    { id: 'cow_right', label: '', x: 370, y: 200, w: 220, h: 200 },
    { id: 'shed', label: 'Old Barn', x: 680, y: 200, w: 220, h: 200 },
  ];

  private readonly actions: ActionDef[] = [
    { id: 'revolver', label: 'Revolver', x: 60, y: 470, w: 160, h: 50 },
    { id: 'dynamite', label: 'Dynamite', x: 400, y: 470, w: 160, h: 50 },
    { id: 'wait', label: 'Wait...', x: 740, y: 470, w: 160, h: 50 },
  ];

  private readonly openGroundLoc: LocationDef = {
    id: 'open_ground',
    label: 'Open Ground',
    x: 200, y: 220, w: 560, h: 160,
  };

  get done(): boolean { return this._done; }
  get hasResult(): boolean { return this._hasResult; }
  get result(): BossPuzzleResult { return this._result; }

  private getAliveLocations(): LocationId[] {
    const all: LocationId[] = ['cow_left', 'cow_right', 'shed'];
    return all.filter(id => !this.destroyedLocations.has(id));
  }

  start(): void {
    this.encounterCount++;
    this.state = PuzzleState.Telegraph;
    this.timer = 0;
    this.chosenAction = null;
    this.selectedLocation = null;
    this._done = false;
    this._hasResult = false;

    const alive = this.getAliveLocations();

    const shuffled = [...COW_NAMES].sort(() => Math.random() - 0.5);
    let nameIdx = 0;
    this.cowNameMap.clear();
    for (const id of alive) {
      if (id !== 'shed') {
        this.cowNameMap.set(id, shuffled[nameIdx++ % shuffled.length]);
      }
    }

    if (alive.length <= 1) {
      if (alive.length === 0) {
        this.billLocation = 'open_ground';
        this.telegraphLocation = 'open_ground';
      } else {
        this.billLocation = alive[0];
        this.telegraphLocation = alive[0];
      }
      this.selectedLocation = this.billLocation;
      this.state = PuzzleState.ActionChoice;
      return;
    }

    this.billLocation = alive[Math.floor(Math.random() * alive.length)];

    if (Math.random() < 0.5) {
      this.telegraphLocation = this.billLocation;
    } else {
      const others = alive.filter(l => l !== this.billLocation);
      this.telegraphLocation = others[Math.floor(Math.random() * others.length)];
    }
  }

  update(dt: number): void {
    this.timer += dt;

    switch (this.state) {
      case PuzzleState.Telegraph:
        if (this.timer >= 1.5) {
          this.timer = 0;
          this.state = PuzzleState.LocationChoice;
        }
        break;

      case PuzzleState.Resolve:
        if (this.timer >= 2.0) {
          this._done = true;
        }
        break;
    }
  }

  handleClick(mx: number, my: number): boolean {
    if (this.state === PuzzleState.LocationChoice) {
      for (const loc of this.locations) {
        if (this.destroyedLocations.has(loc.id)) continue;
        if (mx >= loc.x && mx <= loc.x + loc.w && my >= loc.y && my <= loc.y + loc.h) {
          this.selectedLocation = loc.id;
          this.state = PuzzleState.ActionChoice;
          this.timer = 0;
          return true;
        }
      }
      return false;
    }

    if (this.state === PuzzleState.ActionChoice) {
      for (const a of this.actions) {
        if (mx >= a.x && mx <= a.x + a.w && my >= a.y && my <= a.y + a.h) {
          this.chosenAction = a.id;
          this.resolve();
          this.state = PuzzleState.Resolve;
          this.timer = 0;
          return true;
        }
      }
      return false;
    }

    return false;
  }

  private resolve(): void {
    const action = this.chosenAction!;
    const target = this.selectedLocation!;
    const bill = this.billLocation;

    if (action === 'wait') {
      this._result = {
        bossDamage: 2,
        playerDamage: 0,
        scoreBonus: 200,
        narrativeLine: "You catch his dynamite mid-air and hurl it back! The blast scares Bill and leaves him exposed.",
      };
    } else if (target === bill) {
      if (action === 'dynamite') {
        this.destroyedLocations.add(target);
        this._result = {
          bossDamage: 3,
          playerDamage: 0,
          scoreBonus: 150,
          narrativeLine: "Direct hit! Bill is thrown clear as the spot explodes.",
        };
      } else {
        this._result = {
          bossDamage: 2,
          playerDamage: 0,
          scoreBonus: 100,
          narrativeLine: "Your shot clips Bill! He's wounded and on the run.",
        };
      }
    } else if (action === 'dynamite') {
      this.destroyedLocations.add(target);
      if (target === 'shed') {
        this._result = {
          bossDamage: 0,
          playerDamage: 0,
          scoreBonus: 0,
          narrativeLine: "The barn goes up in flames! That hiding spot is gone forever.",
        };
      } else {
        this.destroyedLocations.add('cow_left');
        this.destroyedLocations.add('cow_right');
        this._result = {
          bossDamage: 0,
          playerDamage: 0,
          scoreBonus: 0,
          narrativeLine: "The cows scatter across the plains! Bill's hiding spots are reduced.",
        };
      }
    } else {
      if (target === 'shed') {
        this._result = {
          bossDamage: 0,
          playerDamage: 1,
          scoreBonus: 0,
          narrativeLine: "Bill isn't there! He returns fire from his real position and you take a grazing shot.",
        };
      } else {
        this._result = {
          bossDamage: 0,
          playerDamage: 0,
          scoreBonus: 0,
          narrativeLine: "The cow bolts into the distance. The townsfolk won't be happy about this...",
        };
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

    if (this.state === PuzzleState.ActionChoice) {
      this.drawActions(ctx);
    }

    if (this.state === PuzzleState.Telegraph || this.state === PuzzleState.LocationChoice) {
      this.drawPrompt(ctx);
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

    if (this.state === PuzzleState.Telegraph) {
      ctx.fillText('Movement spotted... Where will Bill strike next?', W / 2, 75);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 18px Courier New';
      const flash = Math.sin(this.timer * 6) > 0;
      if (flash) {
        ctx.fillText('WAIT... WATCH FOR MOVEMENT', W / 2, 440);
      }
    } else {
      const alive = this.getAliveLocations().length;
      if (alive > 0) {
        ctx.fillText('Choose a location to target:', W / 2, 75);
      }
    }
  }

  private drawLocations(ctx: CanvasRenderingContext2D): void {
    const aliveIds = new Set(this.getAliveLocations());

    for (const loc of this.locations) {
      const destroyed = this.destroyedLocations.has(loc.id);
      const alive = aliveIds.has(loc.id);
      const isTelegraph = loc.id === this.telegraphLocation;
      const isSelected = loc.id === this.selectedLocation;
      const pulse = 0.3 + Math.sin(this.timer * 4) * 0.2;

      if (destroyed) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(loc.x, loc.y, loc.w, loc.h);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(loc.x, loc.y, loc.w, loc.h);
        ctx.fillStyle = '#555';
        ctx.font = 'bold 14px Courier New';
        ctx.textAlign = 'center';
        if (loc.id !== 'shed') {
          ctx.fillText('— EMPTY —', loc.x + loc.w / 2, loc.y + 100);
        } else {
          ctx.fillText('— RUINS —', loc.x + loc.w / 2, loc.y + 100);
        }
        continue;
      }

      ctx.fillStyle = alive ? (isTelegraph ? '#3a1a1a' : '#2a1a0a') : '#1a1a1a';
      ctx.fillRect(loc.x, loc.y, loc.w, loc.h);

      if (isSelected) {
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
      } else if (isTelegraph && (this.state === PuzzleState.Telegraph || this.state === PuzzleState.LocationChoice)) {
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

      const displayName = loc.id === 'shed' ? loc.label : (this.cowNameMap.get(loc.id) || loc.label);
      ctx.fillText(displayName, loc.x + loc.w / 2, loc.y + 30);

      if (loc.id === 'cow_left' || loc.id === 'cow_right') {
        this.drawCowIcon(ctx, loc.x + loc.w / 2, loc.y + 100);
      } else {
        this.drawShedIcon(ctx, loc.x + loc.w / 2, loc.y + 100);
      }

      if (isTelegraph && (this.state === PuzzleState.Telegraph || this.state === PuzzleState.LocationChoice)) {
        ctx.fillStyle = `rgba(255, 0, 0, ${pulse * 0.3})`;
        ctx.fillRect(loc.x, loc.y, loc.w, loc.h);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 16px Courier New';
        ctx.fillText('??? MOVEMENT ???', loc.x + loc.w / 2, loc.y + 170);
      }
    }

    if (this.getAliveLocations().length === 0) {
      const loc = this.openGroundLoc;
      ctx.fillStyle = '#3a1a1a';
      ctx.fillRect(loc.x, loc.y, loc.w, loc.h);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.strokeRect(loc.x, loc.y, loc.w, loc.h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText('Bill is exposed in the open!', loc.x + loc.w / 2, loc.y + 50);
      ctx.fillStyle = '#ff4444';
      ctx.font = 'bold 16px Courier New';
      ctx.fillText('No hiding spots remain — take your shot!', loc.x + loc.w / 2, loc.y + 110);
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
    const alive = this.getAliveLocations();
    let prompt = 'Choose your weapon:';

    if (this.selectedLocation === 'open_ground' || (alive.length <= 1 && this.selectedLocation)) {
      const name = this.billLocation === 'open_ground'
        ? 'in the open'
        : (this.cowNameMap.get(this.selectedLocation!) || this.selectedLocation);
      prompt = `Bill is at ${name} — choose your weapon:`;
    } else if (this.selectedLocation) {
      const name = this.cowNameMap.get(this.selectedLocation) || 'the barn';
      prompt = `You're targeting ${name} — choose your weapon:`;
    }

    ctx.fillStyle = '#fff';
    ctx.font = '16px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(prompt, W / 2, 440);

    ctx.font = 'bold 16px Courier New';

    for (const a of this.actions) {
      const isOver = this.state === PuzzleState.ActionChoice;
      const bgColor = a.id === 'dynamite' ? '#8b4513' : a.id === 'revolver' ? '#5c3a21' : '#3e2723';
      ctx.fillStyle = bgColor;
      ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.strokeStyle = '#8b6914';
      ctx.lineWidth = 2;
      ctx.strokeRect(a.x, a.y, a.w, a.h);

      ctx.fillStyle = isOver ? '#fff' : '#ffd700';
      ctx.fillText(a.label, a.x + a.w / 2, a.y + 32);
    }
  }

  private drawResolve(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';

    const text = this._result.playerDamage > 0 ? 'YOU TOOK DAMAGE!' : 'NICE SHOT!';
    ctx.fillText(text, W / 2, H / 2 - 80);

    ctx.fillStyle = '#fff';
    ctx.font = '18px Courier New';
    ctx.fillText(this._result.narrativeLine, W / 2, H / 2 - 30);

    ctx.fillStyle = '#4a4';
    ctx.font = 'bold 20px Courier New';
    ctx.fillText(`Boss Damage: ${this._result.bossDamage}`, W / 2, H / 2 + 30);

    if (this._result.scoreBonus > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`Score: +${this._result.scoreBonus}`, W / 2, H / 2 + 60);
    }
  }
}
