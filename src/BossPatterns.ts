import { CONFIG } from './config';
import { drawSpriteCentered } from './assets/draw';

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

interface PatternState {
  start(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  handleClick(mx: number, my: number): void;
  get done(): boolean;
  get damage(): number;
  get turnPenalty(): number;
  get name(): string;
}

// ─── Fan Fire ────────────────────────────────────────

class FanFirePattern implements PatternState {
  phase: 'telegraph' | 'active' | 'resolve' | 'done' = 'telegraph';
  timer = 0;
  lanes: { x: number; y: number; hit: boolean; missed: boolean; active: boolean }[] = [];
  currentLane = 0;
  hits = 0;

  start(): void {
    this.phase = 'telegraph';
    this.timer = 0;
    this.currentLane = 0;
    this.hits = 0;
    this.lanes = [];
    const positions = [W * 0.25, W * 0.5, W * 0.75];
    const baseY = H * 0.45;
    for (const x of positions) {
      this.lanes.push({
        x, y: baseY + (Math.random() - 0.5) * 50,
        hit: false, missed: false, active: false,
      });
    }
  }

  get name(): string { return 'Fan Fire'; }
  get damage(): number { return this.hits; }
  get turnPenalty(): number { return 3 - this.hits; }
  get done(): boolean { return this.phase === 'done'; }

  update(dt: number): void {
    this.timer += dt;
    switch (this.phase) {
      case 'telegraph':
        if (this.timer >= 0.8) {
          this.phase = 'active';
          this.timer = 0;
          this.lanes[0].active = true;
        }
        break;
      case 'active': {
        const lane = this.lanes[this.currentLane];
        if (!lane.hit && !lane.missed && this.timer >= 0.5) {
          lane.missed = true;
        }
        if (this.timer >= 0.7) {
          lane.active = false;
          this.currentLane++;
          if (this.currentLane >= this.lanes.length) {
            this.phase = 'resolve';
            this.timer = 0;
          } else {
            this.lanes[this.currentLane].active = true;
            this.timer = 0;
          }
        }
        break;
      }
      case 'resolve':
        if (this.timer >= 1.0) {
          this.phase = 'done';
        }
        break;
    }
  }

  handleClick(mx: number, my: number): void {
    if (this.phase !== 'active') return;
    const lane = this.lanes[this.currentLane];
    if (!lane.active || lane.hit || lane.missed) return;
    const dx = mx - lane.x;
    const dy = my - lane.y;
    if (dx * dx + dy * dy < 50 * 50) {
      lane.hit = true;
      this.hits++;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    switch (this.phase) {
      case 'telegraph': {
        const alpha = Math.min(this.timer / 0.8, 1);
        ctx.strokeStyle = `rgba(255, 50, 0, ${alpha * 0.7})`;
        ctx.lineWidth = 6;
        for (const lane of this.lanes) {
          ctx.beginPath();
          ctx.moveTo(W / 2, Math.floor(H * 0.12));
          ctx.lineTo(lane.x, lane.y);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
        ctx.font = 'bold 28px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('FAN FIRE!', W / 2, H - 60);
        break;
      }

      case 'active': {
        for (let i = 0; i < this.lanes.length; i++) {
          const lane = this.lanes[i];
          const cx = lane.x;
          const cy = lane.y;

          if (lane.hit) {
            ctx.fillStyle = '#4a4';
            ctx.beginPath();
            ctx.arc(cx, cy, 33, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✓', cx, cy);
          } else if (i < this.currentLane || (i === this.currentLane && lane.missed)) {
            ctx.fillStyle = '#f44';
            ctx.beginPath();
            ctx.arc(cx, cy, 33, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 32px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('✗', cx, cy);
          } else if (lane.active) {
            const pulse = 0.6 + Math.sin(this.timer * 14) * 0.4;
            ctx.fillStyle = `rgba(255, 80, 0, ${pulse * 0.25})`;
            ctx.beginPath();
            ctx.arc(cx, cy, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 200, 50, ${pulse})`;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(cx, cy, 33, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = 'rgba(255, 200, 50, 0.12)';
            ctx.beginPath();
            ctx.arc(cx, cy, 30, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`Deflect the bullets! ${this.currentLane + 1}/${this.lanes.length}`, W / 2, H - 30);
        break;
      }

      case 'resolve': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = this.hits > 0 ? '#4a4' : '#f44';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          this.hits > 0 ? `${this.hits} deflected!` : 'All missed!',
          W / 2, H / 2,
        );
        ctx.textBaseline = 'alphabetic';
        break;
      }
    }
  }
}

// ─── Dynamite Toss ───────────────────────────────────

class DynamiteTossPattern implements PatternState {
  phase: 'telegraph' | 'active' | 'resolve' | 'done' = 'telegraph';
  timer = 0;
  arcProgress = 0;
  hit = false;

  // Arc control points
  startX = 100;
  startY = 350;
  endX = W - 100;
  endY = 350;
  peakX = W / 2;
  peakY = 150;

  start(): void {
    this.phase = 'telegraph';
    this.timer = 0;
    this.arcProgress = 0;
    this.hit = false;
    this.startX = Math.floor(W * 0.12) + Math.random() * Math.floor(W * 0.1);
    this.startY = Math.floor(H * 0.35) + Math.random() * Math.floor(H * 0.08);
    this.endX = W - Math.floor(W * 0.12) - Math.random() * Math.floor(W * 0.1);
    this.endY = Math.floor(H * 0.35) + Math.random() * Math.floor(H * 0.08);
    this.peakX = W / 2;
    this.peakY = Math.floor(H * 0.14) + Math.random() * Math.floor(H * 0.08);
  }

  get name(): string { return 'Dynamite Toss'; }
  get damage(): number { return this.hit ? 1 : 0; }
  get turnPenalty(): number { return this.hit ? 0 : 1; }
  get done(): boolean { return this.phase === 'done'; }

  private getArcPos(t: number): { x: number; y: number } {
    const x = (1 - t) * (1 - t) * this.startX + 2 * (1 - t) * t * this.peakX + t * t * this.endX;
    const y = (1 - t) * (1 - t) * this.startY + 2 * (1 - t) * t * this.peakY + t * t * this.endY;
    return { x, y };
  }

  update(dt: number): void {
    this.timer += dt;
    switch (this.phase) {
      case 'telegraph':
        if (this.timer >= 1.0) {
          this.phase = 'active';
          this.timer = 0;
        }
        break;
      case 'active': {
        this.arcProgress = Math.min(this.timer / 3.0, 1);
        if (this.timer >= 3.5) {
          this.phase = 'resolve';
          this.timer = 0;
        }
        break;
      }
      case 'resolve':
        if (this.timer >= 0.8) {
          this.phase = 'done';
        }
        break;
    }
  }

  handleClick(mx: number, my: number): void {
    if (this.phase !== 'active' || this.hit) return;
    const progress = this.arcProgress;
    if (progress < 0.25 || progress > 0.75) return;
    const pos = this.getArcPos(progress);
    const dx = mx - pos.x;
    const dy = my - pos.y;
    if (dx * dx + dy * dy < 60 * 60) {
      this.hit = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    switch (this.phase) {
      case 'telegraph': {
        const alpha = Math.min(this.timer / 0.7, 1);
        const start = this.getArcPos(0);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2 + this.timer * 4;
          const sx = start.x + Math.cos(angle) * (4 + alpha * 8);
          const sy = start.y + Math.sin(angle) * (4 + alpha * 8);
          ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.6})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 2 + alpha * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
        ctx.font = 'bold 28px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('DYNAMITE!', W / 2, H - 60);
        break;
      }
      case 'active': {
        const pos = this.getArcPos(this.arcProgress);
        const nearPeak = this.arcProgress > 0.25 && this.arcProgress < 0.75;

        // Draw arc trail
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        for (let t = 0; t <= 1; t += 0.02) {
          const p = this.getArcPos(t);
          if (t === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw dynamite stick
        ctx.save();
        ctx.translate(pos.x, pos.y);
        const angle = Math.atan2(
          this.getArcPos(Math.min(this.arcProgress + 0.01, 1)).y - pos.y,
          this.getArcPos(Math.min(this.arcProgress + 0.01, 1)).x - pos.x,
        );
        ctx.rotate(angle);

        if (!drawSpriteCentered(ctx, 'terry_dynamite', 0, 0, 0, 30)) {
          ctx.fillStyle = '#8b4513';
          ctx.fillRect(-12, -5, 24, 10);
          ctx.fillStyle = '#a0522d';
          ctx.fillRect(-10, -4, 20, 8);
        }

        // Fuse
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.quadraticCurveTo(18, -8, 14, -14);
        ctx.stroke();

        // Spark
        const sparkPulse = 0.5 + Math.sin(this.timer * 20) * 0.5;
        ctx.fillStyle = `rgba(255, 200, 50, ${sparkPulse})`;
        ctx.beginPath();
        ctx.arc(14, -14, 3 + sparkPulse * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        if (nearPeak) {
          const pulse = 0.5 + Math.sin(this.timer * 10) * 0.5;
          ctx.strokeStyle = `rgba(255, 200, 50, ${pulse * 0.4})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 30 + pulse * 10, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (this.hit) {
          ctx.fillStyle = 'rgba(255, 255, 200, 0.6)';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 60, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ff8c00';
          ctx.font = 'bold 36px Courier New';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('BOOM!', pos.x, pos.y);
          ctx.textBaseline = 'alphabetic';
        }

        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(
          nearPeak && !this.hit ? 'Click the dynamite!' : '',
          W / 2, H - 30,
        );
        break;
      }
      case 'resolve': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = this.hit ? '#4a4' : '#f44';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.hit ? 'Defused!' : 'Missed!', W / 2, H / 2);
        break;
      }
    }
  }
}

// ─── Quick Draw Standoff ─────────────────────────────

class QuickDrawPattern implements PatternState {
  phase: 'telegraph' | 'active' | 'resolve' | 'done' = 'telegraph';
  timer = 0;
  targetX = 0;
  targetY = 0;
  driftX = 0;
  driftY = 0;
  hit = false;

  start(): void {
    this.phase = 'telegraph';
    this.timer = 0;
    this.hit = false;
    this.targetX = W * 0.25 + Math.random() * W * 0.5;
    this.targetY = H * 0.25 + Math.random() * H * 0.35;
    this.driftX = 0;
    this.driftY = 0;
  }

  get name(): string { return 'Quick Draw'; }
  get damage(): number { return this.hit ? 1 : 0; }
  get turnPenalty(): number { return this.hit ? 0 : 1; }
  get done(): boolean { return this.phase === 'done'; }

  update(dt: number): void {
    this.timer += dt;
    switch (this.phase) {
      case 'telegraph':
        this.driftX += Math.sin(this.timer * 1.7) * 40 * dt;
        this.driftY += Math.cos(this.timer * 2.3) * 30 * dt;
        if (this.timer >= 1.2) {
          this.phase = 'active';
          this.timer = 0;
        }
        break;
      case 'active': {
        // Small drift continues during active window
        this.driftX += Math.sin(this.timer * 2 + 1) * 20 * dt;
        this.driftY += Math.cos(this.timer * 1.5 + 2) * 15 * dt;
        // Clamp drift
        this.driftX = Math.max(-40, Math.min(40, this.driftX));
        this.driftY = Math.max(-30, Math.min(30, this.driftY));
        if (this.timer >= 0.65) {
          this.phase = 'resolve';
          this.timer = 0;
        }
        break;
      }
      case 'resolve':
        if (this.timer >= 0.8) {
          this.phase = 'done';
        }
        break;
    }
  }

  handleClick(mx: number, my: number): void {
    if (this.phase !== 'active' || this.hit) return;
    const cx = this.targetX + this.driftX;
    const cy = this.targetY + this.driftY;
    const dx = mx - cx;
    const dy = my - cy;
    if (dx * dx + dy * dy < 50 * 50) {
      this.hit = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const cx = this.targetX + this.driftX;
    const cy = this.targetY + this.driftY;

    switch (this.phase) {
      case 'telegraph': {
        ctx.fillStyle = `rgba(0,0,0,${Math.min(this.timer / 1.2, 1) * 0.3})`;
        ctx.fillRect(0, 0, W, H);

        // Crosshair
        ctx.strokeStyle = `rgba(255, 200, 50, ${0.4 + Math.sin(this.timer * 6) * 0.2})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - 35, cy);
        ctx.lineTo(cx + 35, cy);
        ctx.moveTo(cx, cy - 35);
        ctx.lineTo(cx, cy + 35);
        ctx.stroke();

        const drawPulse = 0.5 + Math.sin(this.timer * 3) * 0.5;
        ctx.fillStyle = `rgba(255, 200, 0, ${drawPulse})`;
        ctx.font = 'bold 32px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('DRAW...', W / 2, H - 60);
        break;
      }
      case 'active': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, H);

        // Big DRAW! flash
        const flash = Math.max(0, 1 - this.timer / 0.2);
        ctx.fillStyle = `rgba(255, 200, 0, ${flash * 0.15})`;
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 60px Courier New';
        ctx.textAlign = 'center';
          ctx.fillText('DRAW!', W / 2, Math.floor(H * 0.14));

        if (this.hit) {
          ctx.fillStyle = 'rgba(255, 255, 200, 0.5)';
          ctx.beginPath();
          ctx.arc(cx, cy, 50, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#4a4';
          ctx.font = 'bold 28px Courier New';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('HIT!', cx, cy);
          ctx.textBaseline = 'alphabetic';
        } else {
          // Crosshair
          ctx.strokeStyle = '#f44';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy, 25, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx - 35, cy);
          ctx.lineTo(cx + 35, cy);
          ctx.moveTo(cx, cy - 35);
          ctx.lineTo(cx, cy + 35);
          ctx.stroke();
        }

        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Quick! Click the crosshair!', W / 2, H - 30);
        break;
      }
      case 'resolve': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = this.hit ? '#4a4' : '#f44';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(this.hit ? 'FAST DRAW!' : 'Too slow!', W / 2, H / 2);
        break;
      }
    }
  }
}

// ─── Reload Window ────────────────────────────────────

class ReloadWindowPattern implements PatternState {
  phase: 'telegraph' | 'active' | 'resolve' | 'done' = 'telegraph';
  timer = 0;
  clicks = 0;
  maxClicks = 8;

  start(): void {
    this.phase = 'telegraph';
    this.timer = 0;
    this.clicks = 0;
  }

  get name(): string { return 'Reload Window'; }
  get damage(): number { return this.clicks > 0 ? 1 : 0; }
  get turnPenalty(): number { return this.clicks > 0 ? 0 : 1; }
  get done(): boolean { return this.phase === 'done'; }

  update(dt: number): void {
    this.timer += dt;
    switch (this.phase) {
      case 'telegraph':
        if (this.timer >= 0.3) {
          this.phase = 'active';
          this.timer = 0;
        }
        break;
      case 'active':
        if (this.timer >= 2.0) {
          this.phase = 'resolve';
          this.timer = 0;
        }
        break;
      case 'resolve':
        if (this.timer >= 0.8) {
          this.phase = 'done';
        }
        break;
    }
  }

  handleClick(_mx: number, _my: number): void {
    if (this.phase !== 'active') return;
    if (this.clicks < this.maxClicks) {
      this.clicks++;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    switch (this.phase) {
      case 'telegraph': {
        ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 28px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Boss is reloading...', W / 2, H / 2);
        break;
      }
      case 'active': {
        const timeLeft = Math.max(0, 2.0 - this.timer);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('RELOADING!', W / 2, Math.floor(H * 0.14));

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Courier New';
        ctx.fillText(`Shots: ${this.clicks}`, W / 2, Math.floor(H * 0.2));

        // Progress bar
        const bx = W / 2 - 120;
        const by = Math.floor(H * 0.24);
        const bw = 240;
        const bh = 16;
        ctx.fillStyle = '#3a1a1a';
        ctx.fillRect(bx, by, bw, bh);
        ctx.fillStyle = '#ff8c00';
        ctx.fillRect(bx, by, bw * (timeLeft / 2.0), bh);
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, bw, bh);

        ctx.fillStyle = '#aaa';
        ctx.font = 'bold 18px Courier New';
        ctx.fillText(`Time: ${timeLeft.toFixed(1)}s`, W / 2, by + bh + 24);

        // Click indicator
        const pulse = 0.5 + Math.sin(this.timer * 6) * 0.5;
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 48px Courier New';
        ctx.fillText('CLICK!', W / 2, Math.floor(H * 0.56));
        ctx.globalAlpha = 1;

        break;
      }
      case 'resolve': {
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, W, H);
        const dmg = this.damage;
        ctx.fillStyle = dmg > 0 ? '#4a4' : '#888';
        ctx.font = 'bold 36px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(`${dmg > 0 ? `${dmg} damage!` : 'Missed!'}`, W / 2, H / 2);
        break;
      }
    }
  }
}

// ─── Pattern Selector ────────────────────────────────

export class PatternManager {
  private patterns: PatternState[] = [];
  private history: number[] = [];
  private current: PatternState | null = null;
  movesSincePattern = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.patterns = [
      new FanFirePattern(),
      new DynamiteTossPattern(),
      new QuickDrawPattern(),
      new ReloadWindowPattern(),
    ];
    this.history = [];
    this.current = null;
    this.movesSincePattern = 0;
  }

  get isActive(): boolean {
    return this.current !== null && !this.current.done;
  }

  get activePattern(): PatternState | null {
    return this.current;
  }

  get inPatternPhase(): boolean {
    return this.current !== null && !this.current.done;
  }

  triggerNext(): void {
    const available = this.patterns
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => !this.history.includes(i));

    if (available.length === 0) {
      this.history = [];
      return this.triggerNext();
    }

    const pick = available[Math.floor(Math.random() * available.length)];
    this.history.push(pick.i);
    if (this.history.length > 2) this.history.shift();

    pick.p.start();
    this.current = pick.p;
    this.movesSincePattern = 0;
  }

  recordMove(): void {
    this.movesSincePattern++;
  }

  update(dt: number): void {
    if (this.current && !this.current.done) {
      this.current.update(dt);
    }
  }

  handleClick(mx: number, my: number): void {
    if (this.current && !this.current.done) {
      this.current.handleClick(mx, my);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.current && !this.current.done) {
      this.current.draw(ctx);
    }
  }

  get damage(): number {
    return this.current?.damage ?? 0;
  }

  get turnPenalty(): number {
    return this.current?.turnPenalty ?? 0;
  }

  consumeResult(): { damage: number; turnPenalty: number } {
    const dmg = this.current?.damage ?? 0;
    const tp = this.current?.turnPenalty ?? 0;
    this.current = null;
    return { damage: dmg, turnPenalty: tp };
  }
}
