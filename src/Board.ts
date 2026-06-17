import { CONFIG } from './config';
import { PIECE_TYPES, Piece, COW_TYPE, HEART_TYPE, LASSO_TYPE } from './Piece';
import type { EffectManager } from './Effects';

export enum BoardPhase {
  Idle,
  Swapping,
  Removing,
  Cascading,
}

export class Board {
  cols: number;
  rows: number;
  cellSize: number;
  ox: number;
  oy: number;
  grid: (Piece | null)[][];
  pieces: Piece[];

  selected: Piece | null;
  swapPair: [Piece, Piece] | null;
  isSwapBack: boolean;
  phase: BoardPhase;
  matchedPieces: Piece[];
  gravityPieces: Piece[];

  turnBudget: number;
  movesUsed: number;
  scoreTarget: number;
  levelComplete: boolean;
  levelPassed: boolean;

  lassoQueue: number[] = [];
  heartQueue: number[] = [];
  cowCount = 0;
  canDamageHearts = false;
  isBossLevel = false;
  hasCows = false;
  firstMatchMade = false;
  pendingCowSpawn = false;
  sinkQueue: Piece[] = [];
  onNeedsLasso: (() => boolean) | null = null;
  onLassoCollected: (() => void) | null = null;
  onCowRemoved: (() => void) | null = null;
  onHeartMatched: (() => void) | null = null;
  onCowCapture: ((col: number, row: number) => boolean) | null = null;
  onMatch: ((matchedPieces: Piece[], effects: EffectManager) => void) | null = null;

  constructor() {
    this.cols = CONFIG.board.cols;
    this.rows = CONFIG.board.rows;
    this.cellSize = CONFIG.board.cellSize;
    this.ox = (CONFIG.canvas.width - this.cols * this.cellSize) / 2;
    this.oy = CONFIG.board.offsetY;
    this.grid = [];
    this.pieces = [];
    this.selected = null;
    this.swapPair = null;
    this.isSwapBack = false;
    this.phase = BoardPhase.Idle;
    this.matchedPieces = [];
    this.gravityPieces = [];
    this.turnBudget = 99;
    this.movesUsed = 0;
    this.scoreTarget = 100000;
    this.levelComplete = false;
    this.levelPassed = false;
    this.init();
  }

  setupLevel(turnBudget: number, scoreTarget: number, cowsToSpawn = 0, heartsToSpawn = 0, isBoss = false, hasCows = false): void {
    this.turnBudget = turnBudget;
    this.scoreTarget = scoreTarget;
    this.movesUsed = 0;
    this.levelComplete = false;
    this.levelPassed = false;
    this.lassoQueue = [];
    this.heartQueue = [];
    this.canDamageHearts = false;
    this.isBossLevel = isBoss;
    this.hasCows = hasCows;
    this.firstMatchMade = false;
    this.pendingCowSpawn = false;
    this.sinkQueue = [];

    if (cowsToSpawn > 0) {
      this.spawnCows(cowsToSpawn);
    }
    if (heartsToSpawn > 0) {
      this.spawnHearts(heartsToSpawn);
    }
    if (isBoss) {
      this.canDamageHearts = false;
    }
    if (hasCows || cowsToSpawn > 0) {
      this.placeStartingLasso();
    }
  }

  private placeStartingLasso(): void {
    const c = Math.floor(this.cols / 2);
    const old = this.grid[0][c];
    if (old) {
      old.removing = true;
      old.removeProgress = 1;
    }
    const lasso = new Piece(c, 0, LASSO_TYPE);
    this.grid[0][c] = lasso;
    this.pieces.push(lasso);
  }

  private spawnCows(count: number): void {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 100) {
      const c = Math.floor(Math.random() * this.cols);
      const r = Math.floor(Math.random() * this.rows);
      if (!this.grid[r][c]) {
        attempts++;
        continue;
      }
      if (this.grid[r][c].type === COW_TYPE) {
        attempts++;
        continue;
      }
      if (this.wouldMatchSurroundings(c, r, COW_TYPE)) {
        attempts++;
        continue;
      }
      this.grid[r][c].removeProgress = 1;
      this.grid[r][c].removing = true;
      const cow = new Piece(c, r, COW_TYPE);
      this.grid[r][c] = cow;
      this.pieces.push(cow);
      this.cowCount++;
      placed++;
    }
  }

  private spawnHearts(count: number): void {
    let placed = 0;
    let attempts = 0;
    while (placed < count && attempts < 100) {
      const c = Math.floor(Math.random() * this.cols);
      const r = Math.floor(Math.random() * this.rows);
      if (!this.grid[r][c]) continue;
      if (this.grid[r][c].type === HEART_TYPE) continue;
      if (this.grid[r][c].type === COW_TYPE) continue;
      this.grid[r][c].removeProgress = 1;
      this.grid[r][c].removing = true;
      const heart = new Piece(c, r, HEART_TYPE);
      this.grid[r][c] = heart;
      this.pieces.push(heart);
      placed++;
    }
  }

  private wouldMatchSurroundings(c: number, r: number, t: number): boolean {
    return this.countSameInRow(c, r, t) > 0 || this.countSameInCol(c, r, t) > 0;
  }

  private countSameInRow(c: number, r: number, t: number): number {
    let count = 0;
    if (c > 0 && this.grid[r][c - 1]?.type === t) count++;
    if (c < this.cols - 1 && this.grid[r][c + 1]?.type === t) count++;
    return count;
  }

  private countSameInCol(c: number, r: number, t: number): number {
    let count = 0;
    if (r > 0 && this.grid[r - 1]?.[c]?.type === t) count++;
    if (r < this.rows - 1 && this.grid[r + 1]?.[c]?.type === t) count++;
    return count;
  }

  get canPlay(): boolean {
    return !this.levelComplete;
  }

  init(): void {
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));
    this.pieces = [];
    this.selected = null;
    this.swapPair = null;
    this.isSwapBack = false;
    this.phase = BoardPhase.Idle;
    this.matchedPieces = [];
    this.gravityPieces = [];
    this.lassoQueue = [];
    this.heartQueue = [];
    this.cowCount = 0;
    this.canDamageHearts = false;
    this.isBossLevel = false;
    this.hasCows = false;
    this.firstMatchMade = false;
    this.pendingCowSpawn = false;
    this.sinkQueue = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let t: number;
        do {
          t = Math.floor(Math.random() * CONFIG.game.regularTypeCount);
        } while (this.wouldMatch(c, r, t));
        const p = new Piece(c, r, t);
        this.grid[r][c] = p;
        this.pieces.push(p);
      }
    }
  }

  private wouldMatch(c: number, r: number, t: number): boolean {
    if (c >= 2 && this.grid[r][c - 1]?.type === t && this.grid[r][c - 2]?.type === t) return true;
    if (r >= 2 && this.grid[r - 1]?.[c]?.type === t && this.grid[r - 2]?.[c]?.type === t) return true;
    return false;
  }

  private isSpecialType(type: number): boolean {
    return type === COW_TYPE || type === LASSO_TYPE;
  }

  handleClick(mx: number, my: number, effects: EffectManager): void {
    if (this.phase !== BoardPhase.Idle || !this.canPlay) return;

    const c = Math.floor((mx - this.ox) / this.cellSize);
    const r = Math.floor((my - this.oy) / this.cellSize);
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return;

    const p = this.grid[r][c];
    if (!p || p.removing) return;

    if (p.type === LASSO_TYPE) return;

    if (!this.selected) {
      this.selected = p;
      p.selected = true;
      return;
    }

    if (this.selected === p) {
      this.selected.selected = false;
      this.selected = null;
      return;
    }

    if (this.selected.type === LASSO_TYPE) {
      this.selected.selected = false;
      this.selected = null;
      return;
    }

    const dr = Math.abs(this.selected.row - r);
    const dc = Math.abs(this.selected.col - c);
    if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
      this.startSwap(this.selected, p);
      this.selected.selected = false;
      this.selected = null;
    } else {
      this.selected.selected = false;
      this.selected = p;
      p.selected = true;
    }
  }

  private removeCowAt(col: number, row: number): void {
    const cow = this.grid[row][col];
    if (!cow) return;
    cow.removing = true;
    this.cowCount--;
    if (this.hasCows) this.pendingCowSpawn = true;
    if (this.onCowRemoved) this.onCowRemoved();
  }

  private startSwap(a: Piece, b: Piece): void {
    this.swapPair = [a, b];
    this.isSwapBack = false;
    this.phase = BoardPhase.Swapping;
    this.performGridSwap(a, b);
    this.movesUsed++;
  }

  private performGridSwap(a: Piece, b: Piece): void {
    this.grid[a.row][a.col] = b;
    this.grid[b.row][b.col] = a;

    const tr = a.row;
    const tc = a.col;
    a.row = b.row;
    a.col = b.col;
    b.row = tr;
    b.col = tc;

    a.setTarget(a.col, a.row);
    b.setTarget(b.col, b.row);
  }

  private canMatchType(type: number): boolean {
    return !this.isSpecialType(type);
  }

  private findMatches(): Piece[] {
    const matched = new Set<Piece>();
    const clearRows = new Set<number>();
    const clearCols = new Set<number>();
    this.sinkQueue = [];

    for (let r = 0; r < this.rows; r++) {
      let c = 0;
      while (c < this.cols) {
        const p = this.grid[r][c];
        if (!p || p.removing || !this.canMatchType(p.type)) { c++; continue; }
        let len = 1;
        while (c + len < this.cols) {
          const next = this.grid[r][c + len];
          if (!next || next.removing || next.type !== p.type) break;
          len++;
        }
        if (len >= 3) {
          if (len >= 4) clearRows.add(r);
          for (let i = 0; i < len; i++) {
            const mp = this.grid[r][c + i];
            if (mp) matched.add(mp);
          }
        }
        c += len;
      }
    }

    for (let c = 0; c < this.cols; c++) {
      let r = 0;
      while (r < this.rows) {
        const p = this.grid[r][c];
        if (!p || p.removing || !this.canMatchType(p.type)) { r++; continue; }
        let len = 1;
        while (r + len < this.rows) {
          const next = this.grid[r + len][c];
          if (!next || next.removing || next.type !== p.type) break;
          len++;
        }
        if (len >= 3) {
          if (len >= 4) clearCols.add(c);
          for (let i = 0; i < len; i++) {
            const mp = this.grid[r + i][c];
            if (mp) matched.add(mp);
          }
        }
        r += len;
      }
    }

    for (const r of clearRows) {
      for (let c = 0; c < this.cols; c++) {
        const p = this.grid[r][c];
        if (p && !p.removing) {
          if (this.canMatchType(p.type)) {
            matched.add(p);
          } else if (!this.sinkQueue.includes(p)) {
            this.sinkQueue.push(p);
          }
        }
      }
    }
    for (const c of clearCols) {
      for (let r = 0; r < this.rows; r++) {
        const p = this.grid[r][c];
        if (p && !p.removing) {
          if (this.canMatchType(p.type)) {
            matched.add(p);
          } else if (!this.sinkQueue.includes(p)) {
            this.sinkQueue.push(p);
          }
        }
      }
    }

    return [...matched];
  }

  private addLassoFromCowProximity(matchedPieces: Piece[]): void {
    const matchedSet = new Set(matchedPieces);
    let lassoCollected = false;
    for (const mp of matchedPieces) {
      if (this.isSpecialType(mp.type)) continue;
      const neighbors = [
        mp.col > 0 ? this.grid[mp.row][mp.col - 1] : null,
        mp.col < this.cols - 1 ? this.grid[mp.row][mp.col + 1] : null,
        mp.row > 0 ? this.grid[mp.row - 1][mp.col] : null,
        mp.row < this.rows - 1 ? this.grid[mp.row + 1][mp.col] : null,
      ];
      for (const n of neighbors) {
        if (!n || n.removing) continue;
        if (n.type === LASSO_TYPE && !matchedSet.has(n)) {
          n.removing = true;
          if (this.onLassoCollected) this.onLassoCollected();
          lassoCollected = true;
        } else if (n.type === HEART_TYPE && !matchedSet.has(n)) {
          n.removing = true;
          if (this.onHeartMatched) this.onHeartMatched();
          this.heartQueue.push(Math.floor(Math.random() * this.cols));
        } else if (n.type === COW_TYPE && !matchedSet.has(n) && !this.lassoQueue.includes(n.col)) {
          this.lassoQueue.push(n.col);
        }
      }
    }
    if (lassoCollected) {
      this.collectBottomCows();
    }
  }

  private applyGravity(): Piece[] {
    const drops: Piece[] = [];
    for (let c = 0; c < this.cols; c++) {
      let writeRow = this.rows - 1;
      let spawnedLassoThisCol = false;

      for (let r = this.rows - 1; r >= 0; r--) {
        const p = this.grid[r][c];
        if (p && !p.removing) {
          if (r !== writeRow) {
            this.grid[writeRow][c] = p;
            this.grid[r][c] = null;
            p.row = writeRow;
            p.setTarget(c, writeRow);
            drops.push(p);
          }
          writeRow--;
        }
      }

      for (let r = writeRow; r >= 0; r--) {
        let t: number;
        if (this.lassoQueue.includes(c) && !spawnedLassoThisCol) {
          t = LASSO_TYPE;
          spawnedLassoThisCol = true;
          this.lassoQueue = this.lassoQueue.filter(lc => lc !== c);
        } else if (this.heartQueue.includes(c)) {
          t = HEART_TYPE;
          this.heartQueue = this.heartQueue.filter(hc => hc !== c);
        } else {
          do {
            t = Math.floor(Math.random() * CONFIG.game.regularTypeCount);
          } while (this.wouldMatch(c, r, t));
        }

        const p = new Piece(c, r, t);
        p.x = c;
        p.y = r - 1 - (writeRow - r) - 0.5;
        this.grid[r][c] = p;
        this.pieces.push(p);
        drops.push(p);
      }
    }
    return drops;
  }

  private sinkSpecialPieces(): void {
    const byCol = new Map<number, Piece[]>();
    for (const p of this.sinkQueue) {
      if (!p.removing) {
        const list = byCol.get(p.col) || [];
        list.push(p);
        byCol.set(p.col, list);
      }
    }
    this.sinkQueue = [];
    for (const [col, pieces] of byCol) {
      for (const p of pieces) {
        this.grid[p.row][col] = null;
      }
      pieces.sort((a, b) => b.row - a.row);
      let writeRow = this.rows - 1;
      for (const p of pieces) {
        while (writeRow >= 0 && this.grid[writeRow][col]) {
          writeRow--;
        }
        if (writeRow >= 0) {
          this.grid[writeRow][col] = p;
          p.row = writeRow;
          p.setTarget(col, writeRow);
          writeRow--;
        }
      }
    }
  }

  private spawnSingleCow(): void {
    if (this.cowCount >= 1) return;
    let attempts = 0;
    while (attempts < 50) {
      const c = Math.floor(Math.random() * this.cols);
      const r = Math.floor(Math.random() * this.rows);
      if (!this.grid[r][c] || this.grid[r][c].removing) { attempts++; continue; }
      if (this.grid[r][c].type === COW_TYPE) { attempts++; continue; }
      this.grid[r][c].removeProgress = 1;
      this.grid[r][c].removing = true;
      const cow = new Piece(c, r, COW_TYPE);
      this.grid[r][c] = cow;
      this.pieces.push(cow);
      this.cowCount++;
      return;
    }
  }

  private collectBottomCows(): void {
    if (!this.hasCows && this.cowCount === 0) return;
    for (let c = 0; c < this.cols; c++) {
      const p = this.grid[this.rows - 1][c];
      if (p && p.type === COW_TYPE && !p.removing) {
        if (this.onCowCapture && this.onCowCapture(c, this.rows - 1)) {
          this.removeCowAt(c, this.rows - 1);
          this.grid[this.rows - 1][c] = null;
        }
      }
    }
  }

  getGridCoord(mx: number, my: number): { col: number; row: number } | null {
    const c = Math.floor((mx - this.ox) / this.cellSize);
    const r = Math.floor((my - this.oy) / this.cellSize);
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return null;
    return { col: c, row: r };
  }

  update(dt: number, effects: EffectManager): void {
    for (const p of this.pieces) {
      p.update(dt);
    }
    this.pieces = this.pieces.filter(p => !p.dead);

    switch (this.phase) {
      case BoardPhase.Idle:
        break;

      case BoardPhase.Swapping: {
        if (!this.swapPair) break;
        const [a, b] = this.swapPair;
        if (a.isAtTarget && b.isAtTarget) {
          const matches = this.findMatches();
          if (matches.length > 0) {
            for (const p of matches) {
              p.removing = true;
            }
            this.matchedPieces = matches;
            this.phase = BoardPhase.Removing;
          } else if (this.isSwapBack) {
            this.swapPair = null;
            this.isSwapBack = false;
            this.phase = BoardPhase.Idle;
          } else {
            this.performGridSwap(a, b);
            this.isSwapBack = true;
            this.phase = BoardPhase.Swapping;
          }
        }
        break;
      }

      case BoardPhase.Removing: {
        if (this.matchedPieces.every(p => p.removeProgress >= 0.5)) {
          for (const p of this.matchedPieces) {
            this.grid[p.row][p.col] = null;
            p.removeProgress = 1;
          }
          this.addLassoFromCowProximity(this.matchedPieces);
          const hadHearts = this.matchedPieces.some(p => p.type === HEART_TYPE);
          if (this.onMatch) this.onMatch(this.matchedPieces, effects);
          if (hadHearts && this.onHeartMatched) this.onHeartMatched();
          this.sinkSpecialPieces();
          if (this.hasCows && !this.firstMatchMade) {
            this.firstMatchMade = true;
            this.pendingCowSpawn = true;
          }
          this.matchedPieces = [];
          this.gravityPieces = this.applyGravity();
          this.phase = BoardPhase.Cascading;
        }
        break;
      }

      case BoardPhase.Cascading: {
        if (this.gravityPieces.every(p => p.isAtTarget)) {
          this.collectBottomCows();
          const matches = this.findMatches();
          if (matches.length > 0) {
            for (const p of matches) {
              p.removing = true;
            }
            this.matchedPieces = matches;
            this.phase = BoardPhase.Removing;
          } else {
            this.swapPair = null;
            this.isSwapBack = false;
            this.phase = BoardPhase.Idle;
            if (this.pendingCowSpawn) {
              this.pendingCowSpawn = false;
              this.spawnSingleCow();
              this.collectBottomCows();
            }
          }
        }
        break;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { ox, oy, cellSize, cols, rows } = this;

    ctx.fillStyle = CONFIG.colors.boardBg;
    ctx.fillRect(ox - 8, oy - 8, cols * cellSize + 16, rows * cellSize + 16);

    ctx.fillStyle = CONFIG.colors.boardInner;
    ctx.fillRect(ox - 4, oy - 4, cols * cellSize + 8, rows * cellSize + 8);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = ox + c * cellSize;
        const y = oy + r * cellSize;
        ctx.fillStyle = (r + c) % 2 === 0 ? CONFIG.colors.cellLight : CONFIG.colors.cellDark;
        ctx.fillRect(x, y, cellSize, cellSize);
        ctx.strokeStyle = CONFIG.colors.boardBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, cellSize, cellSize);
      }
    }

    for (const p of this.pieces) {
      p.draw(ctx, cellSize, ox, oy);
    }

    if (this.hasCows || this.cowCount > 0) {
      const needsLasso = this.onNeedsLasso ? this.onNeedsLasso() : false;
      if (needsLasso) {
        for (let c = 0; c < this.cols; c++) {
          const p = this.grid[this.rows - 1][c];
          if (p && p.type === COW_TYPE && !p.removing) {
            const cx = ox + c * cellSize + cellSize / 2;
            const cy = oy + (this.rows - 1) * cellSize + cellSize / 2;
            const pulse = 0.12 + Math.sin(performance.now() / 300) * 0.08;
            ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
            ctx.beginPath();
            ctx.arc(cx, cy, cellSize * 0.55, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    for (const p of this.pieces) {
      if (p.type === LASSO_TYPE && !p.removing) {
        const cx = ox + p.col * cellSize + cellSize / 2;
        const cy = oy + p.row * cellSize + cellSize / 2;
        const pulse = 0.10 + Math.sin(performance.now() / 350 + p.col * 0.5) * 0.06;
        ctx.fillStyle = `rgba(255, 215, 0, ${pulse})`;
        ctx.beginPath();
        ctx.arc(cx, cy, cellSize * 0.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}
