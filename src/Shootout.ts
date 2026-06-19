import { CONFIG } from './config';
import { Silhouette, SilhouetteState } from './Silhouette';
import { getSheet } from './assets/loader';
import { drawSpriteCentered } from './assets/draw';

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

function coverPositions(W: number, H: number): { x: number; y: number }[] {
  return [
    { x: Math.floor(W * 0.17), y: Math.floor(H * 0.3) },
    { x: Math.floor(W * 0.5), y: Math.floor(H * 0.28) },
    { x: Math.floor(W * 0.83), y: Math.floor(H * 0.3) },
    { x: Math.floor(W * 0.17), y: Math.floor(H * 0.48) },
    { x: Math.floor(W * 0.5), y: Math.floor(H * 0.44) },
    { x: Math.floor(W * 0.83), y: Math.floor(H * 0.48) },
    { x: Math.floor(W * 0.33), y: Math.floor(H * 0.38) },
    { x: Math.floor(W * 0.67), y: Math.floor(H * 0.38) },
  ];
}

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
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;
    const config = CONFIG.shootout;
    const count = config.hostilesPerWave + config.friendliesPerWave;

    const available = [...coverPositions(W, H)];
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
    ctx.fillRect(0, Math.floor(H * 0.14), W, H - Math.floor(H * 0.14));

    ctx.fillStyle = '#2a1a10';
    for (let y = Math.floor(H * 0.15); y < H; y += Math.floor(H * 0.045)) {
      ctx.fillRect(Math.floor(W * 0.07), y, Math.floor(W * 0.86), 2);
    }

    ctx.fillStyle = '#3a2510';
    const positions = coverPositions(W, H);
    for (const pos of positions) {
      const isDoor = pos.y > H * 0.4;
      const w = Math.floor(W * 0.12);
      const h = isDoor ? Math.floor(H * 0.12) : Math.floor(H * 0.1);
      ctx.fillRect(pos.x - w / 2, pos.y - h / 2, w, h);

      ctx.strokeStyle = '#5a3a1a';
      ctx.lineWidth = 2;
      ctx.strokeRect(pos.x - w / 2 - 3, pos.y - h / 2 - 3, w + 6, h + 6);

      const spriteIdx = (pos.x + pos.y) % 3;
      if (spriteIdx === 0) {
        drawSpriteCentered(ctx, 'wanted_poster', 0, pos.x, pos.y - h * 0.15, 16);
      } else if (spriteIdx === 1) {
        drawSpriteCentered(ctx, 'bottle_prop', 0, pos.x + w * 0.3, pos.y - h * 0.1, 12);
      } else {
        drawSpriteCentered(ctx, 'tincan', 0, pos.x - w * 0.3, pos.y - h * 0.1, 12);
      }
    }

    ctx.fillStyle = '#1a0f0a';
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(0, H - 8, W, 8);
    ctx.fillRect(0, 0, 8, H);
    ctx.fillRect(W - 8, 0, 8, H);

    drawSpriteCentered(ctx, 'terry_wanted', 0, W / 2, 20, 24);
  }

  private drawIntro(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 56px Courier New';
    ctx.fillText('DEADEYE', W / 2, H * 0.35);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Courier New';
    const pulse = 0.5 + Math.sin(this.timer * 6) * 0.5;
    ctx.globalAlpha = pulse;
    ctx.fillText('CLICK TO SHOOT', W / 2, H * 0.45);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#aaaaaa';
    ctx.font = '22px Courier New';
    ctx.fillText(`Wave ${this.currentWave + 1} of ${this.totalWaves}`, W / 2, H * 0.52);
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
    const H = CONFIG.canvas.height;

    drawSpriteCentered(ctx, 'terry_revolver', 0, 30, 30, 28);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Courier New';

    ctx.fillText(`WAVE ${this.currentWave + 1}/${this.totalWaves}`, 60, 34);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`HITS: ${this.hostilesHit}`, W - 10, 34);

    if (this.friendliesHit > 0) {
      ctx.fillStyle = '#ff4444';
      ctx.font = '20px Courier New';
      ctx.fillText(`FRIENDLY FIRE: ${this.friendliesHit}`, W - 10, 58);
    }

    if (this.phase === ShootoutPhase.BetweenWaves) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.font = '32px Courier New';
      ctx.fillText('RELOADING...', W / 2, H * 0.6);
    }
  }

  private drawComplete(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;
    const result = this.getResult();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 56px Courier New';
    ctx.fillText('SHOOTOUT OVER', W / 2, H * 0.35);

    ctx.fillStyle = '#ffffff';
    ctx.font = '28px Courier New';
    ctx.fillText(`Hostiles: ${result.hostilesHit}/${result.hostilesTotal}`, W / 2, H * 0.46);

    if (result.friendliesHit > 0) {
      ctx.fillStyle = '#ff4444';
      ctx.fillText(`Friendlies hit: ${result.friendliesHit}`, W / 2, H * 0.52);
    }

    const gripText = result.gripDelta >= 0 ? `Grip -${result.gripDelta}` : `Grip +${Math.abs(result.gripDelta)}`;
    ctx.fillStyle = result.gripDelta >= 0 ? '#4a4' : '#ff4444';
    ctx.font = '32px Courier New';
    ctx.fillText(gripText, W / 2, H * 0.6);
  }

  drawPrompt(ctx: CanvasRenderingContext2D): void {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#ff8c00';
    ctx.font = 'bold 56px Courier New';
    ctx.fillText('DEADEYE READY', W / 2, H * 0.3);

    ctx.fillStyle = '#ffffff';
    ctx.font = '26px Courier New';
    ctx.fillText('Your aim is steady. Take the shot?', W / 2, H * 0.38);

    const pulse = 0.5 + Math.sin(performance.now() / 300) * 0.5;
    ctx.globalAlpha = 0.7 + pulse * 0.3;

    const btnW = Math.floor(W * 0.24);
    const btnH = 56;
    const btnY = Math.floor(H * 0.48);

    ctx.fillStyle = '#7a4a2b';
    ctx.fillRect(W / 2 - btnW - 10, btnY, btnW, btnH);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - btnW - 10, btnY, btnW, btnH);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 26px Courier New';
    ctx.fillText('SHOOT', W / 2 - btnW / 2 - 10, btnY + 37);

    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(W / 2 + 10, btnY, btnW, btnH);
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 + 10, btnY, btnW, btnH);
    ctx.fillStyle = '#888';
    ctx.font = 'bold 26px Courier New';
    ctx.fillText('SKIP', W / 2 + btnW / 2 + 10, btnY + 37);

    ctx.globalAlpha = 1;
  }

  handlePromptClick(mx: number, my: number): 'shoot' | 'skip' | null {
    const W = CONFIG.canvas.width;
    const H = CONFIG.canvas.height;

    const btnW = Math.floor(W * 0.24);
    const btnH = 56;
    const btnY = Math.floor(H * 0.48);

    const shootBtn = { x: W / 2 - btnW - 10, y: btnY, w: btnW, h: btnH };
    const skipBtn = { x: W / 2 + 10, y: btnY, w: btnW, h: btnH };

    if (mx >= shootBtn.x && mx <= shootBtn.x + shootBtn.w && my >= shootBtn.y && my <= shootBtn.y + shootBtn.h) {
      return 'shoot';
    }
    if (mx >= skipBtn.x && mx <= skipBtn.x + skipBtn.w && my >= skipBtn.y && my <= skipBtn.y + skipBtn.h) {
      return 'skip';
    }
    return null;
  }
}
