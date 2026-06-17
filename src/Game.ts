import { CONFIG } from './config';
import { PIECE_TYPES } from './Piece';
import { Board } from './Board';
import { Background } from './Background';
import { Gun } from './Gun';
import { HUD } from './HUD';
import { Screens } from './Screens';
import { Audio } from './Audio';
import { EffectManager } from './Effects';
import { RegionMap } from './RegionMap';
import { TownSelect } from './TownSelect';
import { ResultsScreen } from './ResultsScreen';
import { Shootout, ShootoutPhase } from './Shootout';
import { BossFight, BossState } from './Boss';
import { BillRustlerPuzzle } from './BillRustlerPuzzle';
import { getTown, totalGripReduction } from './data';
import type { LevelResult } from './data';
import { REGIONS } from './data';

export enum GameState {
  Menu,
  RegionMap,
  TownSelect,
  Playing,
  ConfirmShootout,
  ShootoutActive,
  Results,
  BossActive,
  GameOver,
}

export class Game {
  state = GameState.Menu;
  score = 0;
  level = 1;
  combo = 0;
  health = 100;
  time = 0;
  deadeye = 0;
  lassos = 0;
  cowsRemaining = 0;
  cowsCaptured = 0;

  currentRegionIndex = 0;
  currentTownIndex = 0;
  clearedTowns = 0;
  regionGrip = 100;

  lastResult: LevelResult | null = null;

  pendingGripReduction = 0;
  pendingDeadeyeUsed = false;

  shakeIntensity = 0;
  shakeDuration = 0;
  fadeAlpha = 0;

  board: Board;
  bg: Background;
  gun: Gun;
  hud: HUD;
  screens: Screens;
  audio: Audio;
  effects: EffectManager;
  regionMap: RegionMap;
  townSelect: TownSelect;
  resultsScreen: ResultsScreen;
  shootout: Shootout;
  boss: BossFight;
  bossTriggered = false;

  constructor() {
    this.board = new Board();
    this.bg = new Background();
    this.gun = new Gun();
    this.hud = new HUD();
    this.screens = new Screens();
    this.audio = new Audio();
    this.effects = new EffectManager();
    this.regionMap = new RegionMap();
    this.townSelect = new TownSelect();
    this.resultsScreen = new ResultsScreen();
    this.shootout = new Shootout();
    this.boss = new BossFight();

    this.board.onMatch = (matchedPieces, effects) => {
      this.handleMatch(matchedPieces, effects);
    };

    this.board.onLassoCollected = () => {
      this.lassos++;
    };

    this.board.onCowRemoved = () => {
      this.cowsRemaining--;
    };

    this.board.onNeedsLasso = () => this.lassos <= 0;

    this.board.onCowCapture = () => {
      if (this.lassos > 0) {
        this.lassos--;
        this.cowsCaptured++;
        if (this.state === GameState.BossActive && this.boss.health > 0) {
          this.boss.health = Math.max(0, this.boss.health - 1);
        }
        return true;
      }
      return false;
    };

    this.board.onHeartMatched = () => {
      if (this.state === GameState.BossActive && this.boss.health > 0) {
        this.boss.notifyHeartMatched();
      }
    };

    this.syncRegionState();

    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BOSS_TEST) {
      setTimeout(() => this.startBossFight(), 100);
    }
  }

  private syncRegionState(): void {
    const region = REGIONS[this.currentRegionIndex];
    this.regionGrip = region.gangGrip - totalGripReduction(region, this.clearedTowns - 1);
    if (this.regionGrip < 0) this.regionGrip = 0;
  }

  start(): void {
    this.state = GameState.Menu;
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.health = CONFIG.game.initialHealth;
    this.time = 0;
    this.deadeye = 0;
    this.lassos = 0;
    this.cowsCaptured = 0;
    this.currentRegionIndex = 0;
    this.currentTownIndex = 0;
    this.clearedTowns = 0;
    this.lastResult = null;
    this.pendingGripReduction = 0;
    this.pendingDeadeyeUsed = false;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.fadeAlpha = 0;
    this.bossTriggered = false;
    this.effects.clear();
    this.gun.pulse = 0;
    this.gun.rotation = 0;
    this.board.init();
    this.audio.init();
    this.syncRegionState();
    this.fadeAlpha = 0.3;
    this.state = GameState.RegionMap;
  }

  private startLevel(townIndex: number): void {
    this.currentTownIndex = townIndex;
    const town = getTown(this.currentRegionIndex, townIndex);
    this.score = 0;
    this.combo = 0;
    this.health = CONFIG.game.initialHealth;
    this.lassos = 0;
    this.cowsCaptured = 0;
    this.pendingGripReduction = 0;
    this.pendingDeadeyeUsed = false;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.effects.clear();
    this.board.init();
    this.board.setupLevel(town.turnBudget, town.scoreTarget, 0, 0, false, town.hasCows || false);
    this.fadeAlpha = 0.3;
    this.state = GameState.Playing;
  }

  private startBossFight(puzzleBoss = false): void {
    this.score = 0;
    this.combo = 0;
    this.health = CONFIG.game.initialHealth;
    this.deadeye = puzzleBoss ? CONFIG.game.deadeyeMax - 5 : 0;
    this.lassos = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.effects.clear();
    this.board.init();

    const region = REGIONS[this.currentRegionIndex];
    const cowsToSpawn = CONFIG.game.cowsToCapture;
    const heartsToSpawn = 5;
    this.board.setupLevel(99, 0, cowsToSpawn, heartsToSpawn, true, false);
    this.cowsRemaining = cowsToSpawn;

    if (puzzleBoss) {
      const bill = new BillRustlerPuzzle();
      this.boss.start(region.boss.health, 'Bill the Rustler');
      this.boss.setPuzzle(bill);
      this.boss.onPuzzleDamagePlayer = (dmg) => {
        this.health = Math.max(0, this.health - dmg);
      };
      this.boss.onPuzzleScoreBonus = (bonus) => {
        this.score += bonus;
      };
    } else {
      const bill = new BillRustlerPuzzle();
      this.boss.start(region.boss.health, region.boss.name);
      this.boss.setPuzzle(bill);
      this.boss.onPuzzleDamagePlayer = (dmg) => {
        this.health = Math.max(0, this.health - dmg);
      };
      this.boss.onPuzzleScoreBonus = (bonus) => {
        this.score += bonus;
      };
    }

    this.fadeAlpha = 0.3;
    this.state = GameState.BossActive;
  }

  handleKeyDown(key: string, shiftKey = false): void {
    if (key === 'b' || key === 'B') {
      if (this.state === GameState.RegionMap || this.state === GameState.TownSelect) {
        this.startBossFight(shiftKey && key === 'B');
      }
    }
  }

  handleMatch(matchedPieces: import('./Piece').Piece[], effects: EffectManager): void {
    const byType = new Map<number, typeof matchedPieces>();
    for (const p of matchedPieces) {
      const existing = byType.get(p.type) || [];
      existing.push(p);
      byType.set(p.type, existing);
    }

    let anyArea = false;
    let anyLine = false;

    for (const [, ps] of byType) {
      const cx = ps.reduce((s, p) => s + p.x, 0) / ps.length;
      const cy = ps.reduce((s, p) => s + p.y, 0) / ps.length;
      const wx = this.board.ox + (cx + 0.5) * this.board.cellSize;
      const wy = this.board.oy + (cy + 0.5) * this.board.cellSize;

      if (ps.length >= 5) {
        anyArea = true;
        effects.addText(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2, 'AREA CLEAR!', '#ff4500', CONFIG.effects.floatingTextDuration.area);
        effects.spawnDustBurst(wx, wy, CONFIG.effects.particleCountArea, 300, CONFIG.effects.particleLifeArea, 5);
        effects.spawnHatParticles(wx, wy, 8);
        this.deadeye = Math.min(this.deadeye + CONFIG.game.deadeyePerArea, CONFIG.game.deadeyeMax);
      } else if (ps.length === 4) {
        anyLine = true;
        effects.addText(CONFIG.canvas.width / 2, CONFIG.canvas.height / 2, 'LINE CLEAR!', '#ff8c00', CONFIG.effects.floatingTextDuration.line);
        effects.spawnDustBurst(wx, wy, CONFIG.effects.particleCountLine, 200, CONFIG.effects.particleLifeLine, 4);
        this.deadeye = Math.min(this.deadeye + CONFIG.game.deadeyePerLine, CONFIG.game.deadeyeMax);
      } else {
        effects.addText(wx, wy, 'BANG!', '#fff', CONFIG.effects.floatingTextDuration.bang);
        effects.spawnDustBurst(wx, wy, CONFIG.effects.particleCountNormal, 150, CONFIG.effects.particleLifeNormal, 3);
        this.deadeye = Math.min(this.deadeye + CONFIG.game.deadeyePerMatch, CONFIG.game.deadeyeMax);
      }
    }

    if (anyArea) {
      this.audio.play('thump');
      this.gun.addPulse();
      this.shakeIntensity = 6;
      this.shakeDuration = 0.35;
      this.score += CONFIG.game.scoreArea * this.combo;
    } else if (anyLine) {
      this.audio.play('ding');
      this.gun.addPulse();
      this.shakeIntensity = 4;
      this.shakeDuration = 0.25;
      this.score += CONFIG.game.scoreLine * this.combo;
    } else {
      this.audio.play('shot');
      this.gun.addPulse();
      this.shakeIntensity = 2;
      this.shakeDuration = 0.15;
      this.score += CONFIG.game.scoreNormal * this.combo;
    }

    this.combo = Math.min(this.combo + 1, CONFIG.game.maxCombo);
    this.health = Math.min(100, this.health + CONFIG.game.healthPerMatch);

    const newLevel = Math.floor(this.score / CONFIG.game.scorePerLevel) + 1;
    if (newLevel > this.level) this.level = newLevel;
  }

  handleClick(mx: number, my: number): void {
    switch (this.state) {
      case GameState.Menu:
        this.start();
        break;

      case GameState.RegionMap: {
        const result = this.regionMap.handleClick(mx, my, REGIONS[this.currentRegionIndex], this.clearedTowns);
        if (result && result.type === 'town') {
          this.currentTownIndex = result.townIndex;
          this.fadeAlpha = 0.3;
          this.state = GameState.TownSelect;
        }
        break;
      }

      case GameState.TownSelect: {
        if (this.townSelect.handleClick(mx, my)) {
          this.startLevel(this.currentTownIndex);
        }
        break;
      }

      case GameState.Playing: {
        if (!this.board.canPlay) return;
        this.board.handleClick(mx, my, this.effects);
        break;
      }

      case GameState.ConfirmShootout: {
        const action = this.shootout.handlePromptClick(mx, my);
        if (action === 'shoot') {
          const town = getTown(this.currentRegionIndex, this.currentTownIndex);
          this.shootout.start(town.shootoutWaves || 2);
          this.fadeAlpha = 0.3;
          this.state = GameState.ShootoutActive;
        } else if (action === 'skip') {
          this.finalizeLevel(false);
        }
        break;
      }

      case GameState.ShootoutActive: {
        this.shootout.handleClick(mx, my);
        break;
      }

      case GameState.Results: {
        if (this.resultsScreen.handleClick(mx, my)) {
          if (this.bossTriggered) {
            this.bossTriggered = false;
            this.startBossFight();
          } else {
            this.fadeAlpha = 0.3;
            this.state = GameState.RegionMap;
          }
        }
        break;
      }

      case GameState.BossActive: {
        if (this.boss.handleClick(mx, my)) break;
        if (this.boss.state === BossState.PuzzleActive ||
            this.boss.state === BossState.PuzzleIntro ||
            this.boss.state === BossState.PuzzleResolve ||
            this.boss.state === BossState.PuzzleExit) break;
        if (!this.board.canPlay) return;
        const adjustedMy = my - this.boss.viewShift;
        this.board.handleClick(mx, adjustedMy, this.effects);
        break;
      }

      case GameState.GameOver:
        this.start();
        break;
    }
  }

  handleMouseMove(mx: number, my: number): void {
    switch (this.state) {
      case GameState.Playing:
      case GameState.BossActive:
        this.board.setHoverCellFromCoords(mx, my);
        break;
      default:
        break;
    }
  }

  update(dt: number): void {
    this.time += dt;

    if (this.shakeDuration > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - (this.shakeIntensity / this.shakeDuration) * dt);
      this.shakeDuration = Math.max(0, this.shakeDuration - dt);
    }
    this.fadeAlpha = Math.max(0, this.fadeAlpha - dt);

    switch (this.state) {
      case GameState.Menu:
      case GameState.RegionMap:
      case GameState.TownSelect:
        this.bg.update(dt, 1);
        this.effects.update(dt);
        return;

      case GameState.Playing:
        break;

      case GameState.BossActive:
        this.gun.update(dt);
        this.bg.update(dt, this.level * 0.5 + 0.5);
        this.board.update(dt, this.effects);
        this.effects.update(dt);
        this.boss.update(dt);

        if (this.boss.state === BossState.BoardPhase) {
          const currentMoves = this.board.movesUsed;
          if (currentMoves !== this.boss.lastMovesUsed) {
            this.boss.notifyBoardMove(currentMoves);
          }
        }

        if (this.boss.health <= 0 && this.boss.state !== BossState.Victory && this.boss.state !== BossState.Done) {
          this.boss.state = BossState.Victory;
          this.boss.timer = 0;
        }
        if (this.boss.done) {
          this.fadeAlpha = 0.3;
          this.state = GameState.RegionMap;
        }

        if (this.boss.state === BossState.BoardPhase && this.deadeye >= CONFIG.game.deadeyeMax && this.boss.hasPuzzle) {
          this.deadeye = 0;
          this.boss.triggerPuzzleIntro();
        }
        if (this.health <= 0) {
          this.health = 0;
          this.state = GameState.GameOver;
        }
        return;

      case GameState.ShootoutActive:
        this.shootout.update(dt);
        if (this.shootout.done) {
          this.finalizeLevel(true);
        }
        return;

      case GameState.ConfirmShootout:
      case GameState.GameOver:
        this.effects.update(dt);
        return;

      case GameState.Results:
        this.resultsScreen.update(dt);
        this.effects.update(dt);
        return;
    }

    if (this.state !== GameState.Playing) return;

    this.gun.update(dt);
    this.bg.update(dt, this.level * 0.5 + 0.5);
    this.board.update(dt, this.effects);
    this.effects.update(dt);

    if (!this.board.levelComplete) {
      this.checkBoardWinCondition();
    } else {
      this.completeLevel();
    }
  }

  private checkBoardWinCondition(): void {
    if (this.board.isBossLevel) return;
    if (this.board.hasCows) {
      if (this.cowsCaptured >= 1) {
        this.board.levelComplete = true;
        this.board.levelPassed = true;
      } else if (this.board.movesUsed >= this.board.turnBudget) {
        this.board.levelComplete = true;
        this.board.levelPassed = false;
      }
      return;
    }
    if (this.score >= this.board.scoreTarget) {
      this.board.levelComplete = true;
      this.board.levelPassed = true;
    } else if (this.board.movesUsed >= this.board.turnBudget) {
      this.board.levelComplete = true;
      this.board.levelPassed = this.score >= this.board.scoreTarget;
    }
  }

  private completeLevel(): void {
    const town = getTown(this.currentRegionIndex, this.currentTownIndex);
    const passed = this.board.levelPassed;
    const boardGrip = passed ? town.gripReduction : Math.floor(town.gripReduction * 0.5);

    this.pendingGripReduction = boardGrip;

    if (this.currentTownIndex >= this.clearedTowns) {
      this.clearedTowns = this.currentTownIndex + 1;
    }

    if (town.hasShootout && this.deadeye >= CONFIG.game.deadeyeMax) {
      this.pendingDeadeyeUsed = false;
      this.fadeAlpha = 0.3;
      this.state = GameState.ConfirmShootout;
      return;
    }

    this.finalizeLevel(false);
  }

  private finalizeLevel(usedShootout: boolean): void {
    const town = getTown(this.currentRegionIndex, this.currentTownIndex);
    let totalGrip = this.pendingGripReduction;
    let hostiles = 0;
    let friendlies = 0;

    if (usedShootout) {
      this.pendingDeadeyeUsed = true;
      this.deadeye = 0;
      const result = this.shootout.getResult();
      hostiles = result.hostilesHit;
      friendlies = result.friendliesHit;
      const gripDelta = Math.max(result.gripDelta, -town.gripReduction);
      totalGrip = Math.max(0, this.pendingGripReduction + gripDelta);
      if (gripDelta < 0) {
        totalGrip = Math.max(0, this.pendingGripReduction + gripDelta);
      } else {
        totalGrip = this.pendingGripReduction + gripDelta;
      }
    }

    this.regionGrip = Math.max(0, this.regionGrip - totalGrip);
    this.bossTriggered = this.regionGrip <= 0;

    this.lastResult = {
      passed: this.board.levelPassed,
      score: this.score,
      turnsUsed: this.board.movesUsed,
      turnBudget: this.board.turnBudget,
      scoreTarget: this.board.scoreTarget,
      gripReduction: totalGrip,
      deadeyeUsed: this.pendingDeadeyeUsed,
      shootoutHostiles: usedShootout ? hostiles : undefined,
      shootoutFriendlies: usedShootout ? friendlies : undefined,
    };

    this.fadeAlpha = 0.3;
    this.resultsScreen.start(this.lastResult);
    this.state = GameState.Results;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    switch (this.state) {
      case GameState.Menu:
        this.bg.draw(ctx);
        this.screens.drawMenu(ctx, this.time);
        this.effects.draw(ctx);
        break;

      case GameState.RegionMap: {
        this.bg.draw(ctx);
        this.effects.draw(ctx);
        this.regionMap.draw(ctx, REGIONS[this.currentRegionIndex], this.clearedTowns, this.regionGrip, this.time);
        break;
      }

      case GameState.TownSelect: {
        this.bg.draw(ctx);
        this.effects.draw(ctx);
        this.townSelect.draw(ctx, getTown(this.currentRegionIndex, this.currentTownIndex));
        break;
      }

      case GameState.Playing: {
        this.bg.draw(ctx);

        if (this.shakeIntensity > 0) {
          const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
          const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
          ctx.translate(sx, sy);
        }

        this.board.draw(ctx);
        this.hud.draw(ctx, {
          score: this.score,
          level: this.level,
          combo: this.combo,
          health: this.health,
          time: this.time,
          movesUsed: this.board.movesUsed,
          turnBudget: this.board.turnBudget,
          scoreTarget: this.board.scoreTarget,
          deadeye: this.deadeye,
          deadeyeMax: CONFIG.game.deadeyeMax,
          lassos: this.lassos,
        });
        this.effects.draw(ctx);
        break;
      }

      case GameState.ConfirmShootout: {
        this.bg.draw(ctx);
        this.effects.draw(ctx);
        this.shootout.drawPrompt(ctx);
        break;
      }

      case GameState.ShootoutActive: {
        this.shootout.draw(ctx);
        this.effects.draw(ctx);
        break;
      }

      case GameState.BossActive: {
        this.bg.draw(ctx);

        if (this.shakeIntensity > 0) {
          const sx = (Math.random() - 0.5) * this.shakeIntensity * 2;
          const sy = (Math.random() - 0.5) * this.shakeIntensity * 2;
          ctx.translate(sx, sy);
        }

        ctx.save();
        ctx.translate(0, this.boss.viewShift);
        this.board.draw(ctx);
        ctx.restore();

        const heartsOnBoard = this.board.pieces.filter(p => p.type === 6 && !p.removing).length;
        this.hud.draw(ctx, {
          score: this.score,
          level: this.level,
          combo: this.combo,
          health: this.health,
          time: this.time,
          movesUsed: this.board.movesUsed,
          turnBudget: this.board.turnBudget,
          scoreTarget: this.board.scoreTarget,
          deadeye: this.deadeye,
          deadeyeMax: CONFIG.game.deadeyeMax,
          lassos: this.lassos,
          isBossLevel: true,
          heartsOnBoard,
          cowsRemaining: this.cowsRemaining,
          showHealthBar: false,
        });
        this.boss.drawOverlay(ctx);
        this.effects.draw(ctx);
        break;
      }

      case GameState.Results: {
        this.bg.draw(ctx);
        this.effects.draw(ctx);
        if (this.lastResult) {
          this.resultsScreen.draw(ctx, this.lastResult);
        }
        break;
      }

      case GameState.GameOver: {
        this.bg.draw(ctx);
        this.effects.draw(ctx);
        this.screens.drawGameOver(ctx, this.score, this.level, this.time);
        break;
      }
    }

    ctx.restore();

    if (this.state === GameState.Playing) {
      this.gun.draw(ctx, this.combo);
    }

    if (this.fadeAlpha > 0) {
      const a = Math.min(this.fadeAlpha / 0.3, 1) * 0.7;
      ctx.fillStyle = `rgba(0,0,0,${a})`;
      ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    }
  }
}
