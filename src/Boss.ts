import { CONFIG } from './config';
import { PatternManager } from './BossPatterns';
import type { BossPuzzle } from './BossPuzzle';

export enum BossState {
  Intro,
  BoardPhase,
  PatternPhase,
  PuzzleIntro,
  PuzzleActive,
  PuzzleResolve,
  PuzzleExit,
  Victory,
  Done,
}

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

export class BossFight {
  state = BossState.Intro;
  timer = 0;
  puzzleSlideTimer = 0;
  health = 10;
  maxHealth = 10;
  bossName = '';
  patterns: PatternManager;
  movesPerPattern = 3;
  lastMovesUsed = 0;
  boardPhaseTimer = 0;
  boardPhaseTimeout = 15;
  hasPuzzle = false;
  puzzle: BossPuzzle | null = null;
  viewShift = 0;
  targetViewShift = 0;
  nextPuzzleThresholdIndex = 0;
  puzzleDamageApplied = false;

  private readonly thresholdPercentages = [1.0, 0.75, 0.5, 0.25, 0];

  onPuzzleDamagePlayer: ((damage: number) => void) | null = null;
  onPuzzleScoreBonus: ((bonus: number) => void) | null = null;

  constructor() {
    this.patterns = new PatternManager();
  }

  start(health: number, name: string): void {
    this.state = BossState.Intro;
    this.timer = 0;
    this.puzzleSlideTimer = 0;
    this.health = health;
    this.maxHealth = health;
    this.bossName = name;
    this.patterns.reset();
    this.lastMovesUsed = 0;
    this.boardPhaseTimer = 0;
    this.hasPuzzle = false;
    this.puzzle = null;
    this.viewShift = 0;
    this.targetViewShift = 0;
    this.nextPuzzleThresholdIndex = 0;
    this.puzzleDamageApplied = false;
  }

  get done(): boolean {
    return this.state === BossState.Done;
  }

  setPuzzle(puzzle: BossPuzzle): void {
    this.hasPuzzle = true;
    this.puzzle = puzzle;
  }

  notifyBoardMove(movesUsed: number): void {
    if (this.state === BossState.BoardPhase) {
      this.lastMovesUsed = movesUsed;
      this.patterns.recordMove();
      if (this.patterns.movesSincePattern >= this.movesPerPattern) {
        this.patterns.triggerNext();
        this.state = BossState.PatternPhase;
      }
    }
  }

  notifyHeartMatched(): void {
    if (this.state === BossState.BoardPhase && this.health > 0) {
      this.health = Math.max(0, this.health - 1);
    }
  }

  triggerPuzzleIntro(): void {
    if (this.hasPuzzle && this.puzzle) {
      this.state = BossState.PuzzleIntro;
      this.timer = 0;
      this.puzzleSlideTimer = 0;
      this.targetViewShift = 200;
      this.puzzle.start();
    }
  }

  update(dt: number): void {
    this.timer += dt;

    if (this.health <= 0 && this.state !== BossState.Victory && this.state !== BossState.Done && this.state !== BossState.PuzzleIntro) {
      if (this.hasPuzzle && this.nextPuzzleThresholdIndex < this.thresholdPercentages.length) {
        this.nextPuzzleThresholdIndex++;
        this.triggerPuzzleIntro();
        return;
      }
      this.state = BossState.Victory;
      this.timer = 0;
      return;
    }

    this.viewShift += (this.targetViewShift - this.viewShift) * Math.min(1, dt * CONFIG.puzzle.shiftSpeed);

    switch (this.state) {
      case BossState.Intro:
        if (this.timer >= CONFIG.boss.introDuration) {
          if (this.hasPuzzle && this.nextPuzzleThresholdIndex === 0) {
            this.nextPuzzleThresholdIndex++;
            this.triggerPuzzleIntro();
          } else {
            this.state = BossState.BoardPhase;
            this.timer = 0;
            this.boardPhaseTimer = 0;
          }
        }
        break;

      case BossState.BoardPhase:
        this.boardPhaseTimer += dt;
        if (this.boardPhaseTimer >= this.boardPhaseTimeout) {
          this.patterns.triggerNext();
          this.state = BossState.PatternPhase;
          this.boardPhaseTimer = 0;
        }
        if (this.hasPuzzle && this.nextPuzzleThresholdIndex < this.thresholdPercentages.length) {
          const threshold = this.thresholdPercentages[this.nextPuzzleThresholdIndex] * this.maxHealth;
          if (this.health <= threshold) {
            this.nextPuzzleThresholdIndex++;
            this.triggerPuzzleIntro();
          }
        }
        break;

      case BossState.PatternPhase:
        this.patterns.update(dt);
        if (!this.patterns.inPatternPhase) {
          this.health = Math.max(0, this.health - this.patterns.damage);
          this.state = BossState.BoardPhase;
          this.timer = 0;
          this.boardPhaseTimer = 0;
        }
        break;

      case BossState.PuzzleIntro:
        this.puzzleSlideTimer += dt;
        if (this.puzzleSlideTimer >= CONFIG.puzzle.slideDuration) {
          this.viewShift = this.targetViewShift;
          this.state = BossState.PuzzleActive;
          this.timer = 0;
        }
        break;

      case BossState.PuzzleActive:
        if (this.puzzle) {
          this.puzzle.update(dt);
          if (this.puzzle.done) {
            this.state = BossState.PuzzleResolve;
            this.timer = 0;
          }
        }
        break;

      case BossState.PuzzleResolve:
        if (this.puzzle && this.puzzle.hasResult && !this.puzzleDamageApplied) {
          const r = this.puzzle.result;
          if (this.onPuzzleDamagePlayer && r.playerDamage > 0) {
            this.onPuzzleDamagePlayer(r.playerDamage);
          }
          if (this.onPuzzleScoreBonus && r.scoreBonus > 0) {
            this.onPuzzleScoreBonus(r.scoreBonus);
          }
          this.health = Math.max(0, this.health - r.bossDamage);
          this.puzzleDamageApplied = true;
        }
        if (this.timer >= CONFIG.puzzle.resolveDuration) {
          this.state = BossState.PuzzleExit;
          this.targetViewShift = 0;
          this.puzzleSlideTimer = 0;
          this.puzzleDamageApplied = false;
        }
        break;

      case BossState.PuzzleExit:
        this.puzzleSlideTimer += dt;
        if (this.puzzleSlideTimer >= CONFIG.puzzle.exitDuration) {
          this.viewShift = 0;
          while (this.nextPuzzleThresholdIndex < this.thresholdPercentages.length) {
            const t = this.thresholdPercentages[this.nextPuzzleThresholdIndex] * this.maxHealth;
            if (this.health <= t) {
              this.nextPuzzleThresholdIndex++;
            } else {
              break;
            }
          }
          this.state = BossState.BoardPhase;
          this.timer = 0;
          this.boardPhaseTimer = 0;
        }
        break;

      case BossState.Victory:
        if (this.timer >= CONFIG.boss.victoryDuration) {
          this.state = BossState.Done;
        }
        break;
    }
  }

  handleClick(mx: number, my: number): boolean {
    if (this.state === BossState.PatternPhase) {
      this.patterns.handleClick(mx, my);
      return true;
    }
    if (this.state === BossState.PuzzleActive && this.puzzle) {
      return this.puzzle.handleClick(mx, my);
    }
    return false;
  }

  drawOverlay(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`BOSS: ${this.bossName}`, W / 2, 28);

    if (this.state !== BossState.PuzzleIntro &&
        this.state !== BossState.PuzzleActive &&
        this.state !== BossState.PuzzleResolve &&
        this.state !== BossState.PuzzleExit) {
      this.drawHealthBar(ctx);
    }

    switch (this.state) {
      case BossState.Intro:
        ctx.fillStyle = '#ff8c00';
        ctx.font = 'bold 28px Courier New';
        ctx.fillText('THE BOSS APPROACHES...', W / 2, H - 60);
        break;

      case BossState.BoardPhase: {
        const nextPattern = this.movesPerPattern - this.patterns.movesSincePattern;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 22px Courier New';
        ctx.fillText(
          `Match hearts for bonus damage  |  Boss attacks in ${nextPattern} moves`,
          W / 2, 85,
        );
        break;
      }

      case BossState.PatternPhase: {
        if (this.patterns.activePattern) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = '#ff4444';
          ctx.font = 'bold 26px Courier New';
          ctx.fillText(`⚠ ${this.patterns.activePattern.name} ⚠`, W / 2, 85);
          this.patterns.draw(ctx);
        }
        break;
      }

      case BossState.PuzzleIntro: {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Courier New';
        ctx.fillText('DEADEYE — Puzzle Mode', W / 2, 120);
        break;
      }

      case BossState.PuzzleActive: {
        if (this.puzzle) {
          this.puzzle.draw(ctx);
        }
        break;
      }

      case BossState.PuzzleResolve: {
        if (this.puzzle) {
          this.puzzle.draw(ctx);
        }
        break;
      }

      case BossState.PuzzleExit: {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#aaa';
        ctx.font = '20px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText('Returning to the fight...', W / 2, 120);
        break;
      }

      case BossState.Victory:
        this.drawVictory(ctx);
        break;
    }
  }

  private drawHealthBar(ctx: CanvasRenderingContext2D): void {
    const bx = W / 2 - 150;
    const by = 55;
    const bw = 300;
    const bh = 18;

    ctx.fillStyle = '#3a1a1a';
    ctx.fillRect(bx, by, bw, bh);

    const grad = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    grad.addColorStop(0, '#ff4444');
    grad.addColorStop(1, '#ff6600');
    ctx.fillStyle = grad;
    ctx.fillRect(bx, by, bw * (this.health / this.maxHealth), bh);

    ctx.strokeStyle = '#5c3a21';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText(`${this.bossName}  ${this.health}/${this.maxHealth}`, W / 2, by + 14);
  }

  private drawVictory(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS DEFEATED!', W / 2, H / 2 - 40);

    ctx.fillStyle = '#4a4';
    ctx.font = '24px Courier New';
    ctx.fillText(`${this.bossName} has been vanquished`, W / 2, H / 2 + 20);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Courier New';
    ctx.fillText('The region is liberated!', W / 2, H / 2 + 60);
  }
}
