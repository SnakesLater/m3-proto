import { CONFIG } from './config';
import { Silhouette, SilhouetteState } from './Silhouette';

export enum ShootoutPhase {
  Intro,
  Active,
  BetweenWaves,
  Complete,
  Done,
}

export interface ShootoutResult {
  hostilesHit: number;
  hostilesTotal: number;
  friendliesHit: number;
  friendliesTotal: number;
  gripDelta: number;
}

const COVER_POSITIONS = [
  { x: 140, y: 230 },
  { x: 300, y: 230 },
  { x: 460, y: 230 },
  { x: 620, y: 230 },
  { x: 780, y: 230 },
  { x: 220, y: 350 },
  { x: 740, y: 350 },
];

interface SpawnItem {
  sil: Silhouette;
  delay: number;
}

export class Shootout {
  phase = ShootoutPhase.Intro;
  timer = 0;
  currentWave = 0;
  totalWaves = 0;
  silhouettes: Silhouette[] = [];
  waveSilhouettes: Silhouette[] = [];
  spawnQueue: SpawnItem[] = [];

  hostilesHit = 0;
  hostilesTotal = 0;
  friendliesHit = 0;
  friendliesTotal = 0;

  start(totalWaves: number): void {
    this.phase = ShootoutPhase.Intro;
    this.timer = 0;
    this.currentWave = 0;
    this.totalWaves = totalWaves;
    this.silhouettes = [];
    this.waveSilhouettes = [];
    this.spawnQueue = [];
    this.hostilesHit = 0;
    this.hostilesTotal = 0;
    this.friendliesHit = 0;
    this.friendliesTotal = 0;
  }

  get done(): boolean {
    return this.phase === ShootoutPhase.Done;
  }

  getResult(): ShootoutResult {
    return {
      hostilesHit: this.hostilesHit,
      hostilesTotal: this.hostilesTotal,
      friendliesHit: this.friendliesHit,
      friendliesTotal: this.friendliesTotal,
      gripDelta: (this.hostilesHit * CONFIG.shootout.gripPerHostile) - (this.friendliesHit * CONFIG.shootout.gripPerFriendly),
    };
  }

  private spawnWave(): void {
    const config = CONFIG.shootout;
    const count = config.hostilesPerWave + config.friendliesPerWave;

    const available = [...COVER_POSITIONS];
    const used: typeof available = [];

    for (let i = 0; i < count; i++) {
      if (available.length === 0) break;
      const idx = Math.floor(Math.random() * available.length);
      used.push(available.splice(idx, 1)[0]);
    }

    const waveSils: Silhouette[] = [];
    this.spawnQueue = [];
    for (let i = 0; i < used.length; i++) {
      const isHostile = i < config.hostilesPerWave;
      const pos = used[i];
      const sil = new Silhouette(pos.x, pos.y, isHostile);
      this.spawnQueue.push({ sil, delay: i * config.silhouetteStagger });
      waveSils.push(sil);
      this.silhouettes.push(sil);
      if (isHostile) this.hostilesTotal++;
      else this.friendliesTotal++;
    }

    this.waveSilhouettes = waveSils;
  }

  handleClick(mx: number, my: number): boolean {
    if (this.phase !== ShootoutPhase.Active) return false;

    let hitSomething = false;
    for (const sil of this.waveSilhouettes) {
      if (!sil.canBeHit || sil.done) continue;
      if (sil.hitTest(mx, my)) {
        sil.hit();
        if (sil.isHostile) this.hostilesHit++;
        else this.friendliesHit++;
        hitSomething = true;
        break;
      }
    }
    return hitSomething;
  }

  update(dt: number): void {
    this.timer += dt;

    switch (this.phase) {
      case ShootoutPhase.Intro:
        if (this.timer >= CONFIG.shootout.introDuration) {
          this.phase = ShootoutPhase.Active;
          this.timer = 0;
          this.spawnWave();
        }
        break;

      case ShootoutPhase.Active: {
        for (const item of this.spawnQueue) {
          if (item.sil.state === SilhouetteState.Hidden && this.timer >= item.delay) {
            item.sil.activate();
          }
        }

        for (const sil of this.waveSilhouettes) {
          sil.update(dt);
        }

        const allSpawned = this.waveSilhouettes.every(s => s.state !== SilhouetteState.Hidden);
        const allDone = allSpawned && this.waveSilhouettes.length > 0 && this.waveSilhouettes.every(s => s.done);
        if (allDone) {
          this.currentWave++;
          if (this.currentWave >= this.totalWaves) {
            this.phase = ShootoutPhase.Complete;
            this.timer = 0;
          } else {
            this.phase = ShootoutPhase.BetweenWaves;
            this.timer = 0;
          }
        }
        break;
      }

      case ShootoutPhase.BetweenWaves:
        if (this.timer >= CONFIG.shootout.betweenWaveDuration) {
          this.phase = ShootoutPhase.Active;
          this.timer = 0;
          this.spawnWave();
        }
        break;

      case ShootoutPhase.Complete:
        if (this.timer >= CONFIG.shootout.completeDuration) {
          this.phase = ShootoutPhase.Done;
        }
        break;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    switch (this.phase) {
      case ShootoutPhase.Intro:
        this.drawBackground(ctx);
        this.drawIntro(ctx);
        break;

      case ShootoutPhase.Active:
      case ShootoutPhase.BetweenWaves:
        this.drawBackground(ctx);
        this.drawSilhouettes(ctx);
        this.drawHUD(ctx);
        break;

      case ShootoutPhase.Complete:
        this.drawBackground(ctx);
        this.drawComplete(ctx);
        this.drawHUD(ctx);
        break;
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0a0510');
    grad.addColorStop(0.4, '#1a0a20');
    grad.addColorStop(1, '#2a1a10');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#1a0a05';
    ctx.fillRect(0, 120, W, H - 120);

    ctx.fillStyle = '#2a1a10';
    for (let y = 130; y < H; y += 40) {
      ctx.fillRect(40, y, W - 80, 2);
    }

    ctx.fillStyle = '#3a2510';
    for (const pos of COVER_POSITIONS) {
      const isDoor = pos.y > 300;
      const w = isDoor ? 70 : 60;
      const h = isDoor ? 100 : 80;
      ctx.fillRect(pos.x - w / 2, pos.y - h / 2, w, h);

      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x - w / 2 - 3, pos.y - h / 2 - 3, w + 6, h + 6);
    }

    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(0, H - 8, W, 8);
    ctx.fillRect(0, 0, 8, H);
    ctx.fillRect(W - 8, 0, 8, H);
  }

  private drawIntro(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 48px Courier New';
    ctx.fillText('DEADEYE', W / 2, H / 2 - 30);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Courier New';
    const pulse = 0.5 + Math.sin(this.timer * 6) * 0.5;
    ctx.globalAlpha = pulse;
    ctx.fillText('CLICK TO SHOOT', W / 2, H / 2 + 30);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '18px Courier New';
    ctx.fillText(`Wave ${this.currentWave + 1} of ${this.totalWaves}`, W / 2, H / 2 + 80);
  }

  private drawSilhouettes(ctx: CanvasRenderingContext2D): void {
    for (const sil of this.silhouettes) {
      if (sil.state === SilhouetteState.Hidden) continue;
      if (sil.done && sil.stateTimer > 0.3) continue;
      sil.draw(ctx);
    }
  }

  private drawHUD(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.canvas.width;

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Courier New';
    ctx.fillText(`WAVE ${this.currentWave + 1}/${this.totalWaves}`, 20, 35);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`HITS: ${this.hostilesHit}`, W - 20, 35);

    if (this.friendliesHit > 0) {
      ctx.fillStyle = '#ff4444';
      ctx.font = '18px Courier New';
      ctx.fillText(`FRIENDLY FIRE: ${this.friendliesHit}`, W - 20, 60);
    }

    if (this.phase === ShootoutPhase.BetweenWaves) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = '28px Courier New';
      ctx.fillText('RELOADING...', W / 2, CONFIG.canvas.height / 2 + 100);
    }
  }

  private drawComplete(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;
    const result = this.getResult();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Courier New';
    ctx.fillText('SHOOTOUT OVER', W / 2, H / 2 - 60);

    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Courier New';
    ctx.fillText(`Hostiles: ${result.hostilesHit}/${result.hostilesTotal}`, W / 2, H / 2);

    if (result.friendliesHit > 0) {
      ctx.fillStyle = '#ff4444';
      ctx.fillText(`Friendlies hit: ${result.friendliesHit}`, W / 2, H / 2 + 35);
    }

    const gripText = result.gripDelta >= 0 ? `Grip -${result.gripDelta}` : `Grip +${Math.abs(result.gripDelta)}`;
    ctx.fillStyle = result.gripDelta >= 0 ? '#4a4' : '#ff4444';
    ctx.font = '28px Courier New';
    ctx.fillText(gripText, W / 2, H / 2 + 75);
  }

  drawPrompt(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 48px Courier New';
    ctx.fillText('DEADEYE READY', W / 2, H / 2 - 80);

    ctx.fillStyle = '#ffffff';
    ctx.font = '22px Courier New';
    ctx.fillText('Your aim is steady. Take the shot?', W / 2, H / 2 - 25);

    const pulse = 0.5 + Math.sin(performance.now() / 300) * 0.5;
    ctx.globalAlpha = 0.7 + pulse * 0.3;

    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(W / 2 - 160, H / 2 + 30, 140, 50);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 160, H / 2 + 30, 140, 50);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px Courier New';
    ctx.fillText('SHOOT', W / 2 - 90, H / 2 + 62);

    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(W / 2 + 20, H / 2 + 30, 140, 50);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 + 20, H / 2 + 30, 140, 50);
    ctx.fillStyle = '#888';
    ctx.font = 'bold 22px Courier New';
    ctx.fillText('SKIP', W / 2 + 90, H / 2 + 62);

    ctx.globalAlpha = 1;
  }

  handlePromptClick(mx: number, my: number): 'shoot' | 'skip' | null {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    const shootBtn = { x: W / 2 - 160, y: H / 2 + 30, w: 140, h: 50 };
    const skipBtn = { x: W / 2 + 20, y: H / 2 + 30, w: 140, h: 50 };

    if (mx >= shootBtn.x && mx <= shootBtn.x + shootBtn.w && my >= shootBtn.y && my <= shootBtn.y + shootBtn.h) {
      return 'shoot';
    }
    if (mx >= skipBtn.x && mx <= skipBtn.x + skipBtn.w && my >= skipBtn.y && my <= skipBtn.y + skipBtn.h) {
      return 'skip';
    }
    return null;
  }
}
