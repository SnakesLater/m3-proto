# Game Mechanics Reference

*Complete documentation of how DESERT GUNNER plays. This is the "returning after a break" reference — read this to understand every system, how they interact, and where the relevant code lives.*

---

## 1. Board Basics

| Property | Value | Config |
|----------|-------|--------|
| Columns | 7 | `CONFIG.board.cols` |
| Rows | 6 | `CONFIG.board.rows` |
| Cell size | 64px | `CONFIG.board.cellSize` |
| Grid offset Y | 120px | `CONFIG.board.offsetY` |
| Cell pattern | Checkerboard | Even/odd sum |
| Colors | Light `#c49a6c`, Dark `#b8895e` | `CONFIG.colors.cellLight/Dark` |

**Board drawing:** `Board.draw()` in `src/Board.ts:607-661`
- Brown border and inner fill surround the grid
- Checkerboard cells with 1px strokes
- Pieces drawn on top of cells
- Lasso pulse glow and cow "needs lasso" pulse glow drawn last (on top of everything)

---

## 2. Piece Types

### Standard Matchable Types (5)

| Index | Name | Color | Shape | Draw Function |
|-------|------|-------|-------|---------------|
| 0 | Outlaw | `#ff3333` | Red circle + star badge | `drawOutlaw()`, `src/Piece.ts:9-32` |
| 1 | Bandit | `#1a1a1a` | Dark rounded rect + glowing eyes | `drawBandit()`, `src/Piece.ts:34-68` |
| 2 | Snake | `#33cc33` | Green bezier curve + segmented dots | `drawSnake()`, `src/Piece.ts:70-89` |
| 3 | Coyote | `#cccccc` | Gray pentagon with ear triangles | `drawCoyote()`, `src/Piece.ts:91-112` |
| 4 | Vulture | `#cc6600` | Orange wing-shaped bird silhouette | `drawVulture()`, `src/Piece.ts:114-138` |

### Special Types (non-matchable)

| Index | Constant | Name | Color | Draw Function |
|-------|----------|------|-------|---------------|
| 5 | `COW_TYPE` | Cow | `#8b6914` | `drawCow()`, `src/Piece.ts:140-186` |
| 6 | `HEART_TYPE` | Heart | `#ff0044` | `drawHeart()`, `src/Piece.ts:188-200` |
| 7 | `LASSO_TYPE` | Lasso | `#5c3a21` stroke | `drawLasso()`, `src/Piece.ts:202-231` |

**Constants:** `src/Piece.ts:244-246`
```
COW_TYPE = 5
HEART_TYPE = 6
LASSO_TYPE = 7
```

**Piece registration:** `PIECE_TYPES` array at `src/Piece.ts:233-242` maps index → name, color, and draw function. Adding a new type = one array entry + one draw function.

**Piece class:** `src/Piece.ts:248-340` — handles position, animation (swap/gravity/removal), selection indicator (golden pulse ring for selected pieces).

---

## 3. Match System

### Detection

**Method:** `Board.findMatches()` at `src/Board.ts:302-378`
- Two passes: horizontal scan, then vertical scan
- Each pass finds runs of ≥3 identical types
- Match-4 rows and match-5+ columns trigger row/column clear: all standard pieces in that row/col are added to the match set. Special pieces in those rows/cols are moved to `sinkQueue` instead of removed.
- Overlapping matches (L-shape, T-shape) are supported — both runs are merged into one match set

### Match Prevention

- **Special types excluded:** `canMatchType()` at `src/Board.ts:298-300` returns `false` for `COW_TYPE` and `LASSO_TYPE` (cows and lassos cannot be matched).
- **Spawn prevention:** `Board.wouldMatch()` at `src/Board.ts:213-217` checks if placing a type at `(c,r)` would create a run of 3. Used during board init and gravity spawns.

### Match Scoring

| Match Size | Base Score | Multiplier | Deadeye Gain |
|------------|-----------|------------|--------------|
| 3 (normal) | 100 | × combo | +8 |
| 4 (line clear) | 300 | × combo | +15 |
| 5+ (area clear) | 500 | × combo | +25 |

Score formula: `matchScore * combo`. Combo increments by 1 per match (including cascade matches), max 10. Combo resets to 0 on new player move (but NOT during cascade chains — chain matches build combo).

### Row/Column Clear

When a match of ≥4 is found:
- **Match-4:** Entire row of that run is cleared (all standard pieces added to match set)
- **Match-5+:** Entire column of that run is also cleared
- Special pieces (cow, heart, lasso) in cleared rows/cols are NOT removed — they're added to `sinkQueue` and repositioned downward via `sinkSpecialPieces()` at `src/Board.ts:457-485`

---

## 4. Board Phase State Machine

### States (`BoardPhase` enum at `src/Board.ts:5-10`)

```
Idle → (click valid swap) → Swapping → (pieces arrive) → Removing → (≥50% removed)
  → Cascading → (gravity settles) → check matches → found? → Removing (chain)
                                                     → none? → spawn cow if pending
                                                              → Idle
  Swapping → (no match, not swapback) → SwapBack (swap back) → Swapping
           → (no match, is swapback) → Idle
```

**Idle:** `src/Board.ts:531-533` — waits for player click. `Board.canPlay` must be true (level not complete).

**Swapping:** `src/Board.ts:535-556` — plays swap animation. When both pieces arrived:
- Check matches via `findMatches()`
- If matches found → transition to Removing
- If no matches:
  - If first swap (`isSwapBack = false`): swap back, set `isSwapBack = true`, stay in Swapping
  - If swap-back (`isSwapBack = true`): return to Idle (swap was invalid)

**Removing:** `src/Board.ts:559-578` — waits until all matched pieces are ≥50% removed:
1. Remove matched pieces from grid
2. Call `addLassoFromCowProximity()` — process adjacent lassos/cows/hearts
3. Fire `onMatch` callback (scoring, effects, deadeye)
4. Check if any matched piece was a heart (extra `onHeartMatched` call for 3-heart match)
5. Call `sinkSpecialPieces()` — drop cows/hearts/lassos into cleared cells
6. On first match of cow level: set `pendingCowSpawn = true`
7. Clear matched pieces array, call `applyGravity()` for new pieces
8. Transition to Cascading

**Cascading:** `src/Board.ts:581-604` — waits for all gravity pieces to land:
1. Call `collectBottomCows()` — auto-capture cows on bottom row
2. Check for new matches via `findMatches()`
3. If matches found → transition to Removing (chain reaction)
4. If no matches:
   - Return to Idle
   - If `pendingCowSpawn`: spawn one new cow, check bottom cows again

### Update Loop

`Board.update(dt, effects)` at `src/Board.ts:525-605` — called every frame from Game.ts:
1. Update all piece animations (position, scale, removal progress)
2. Remove dead pieces from `pieces` array
3. Run current phase logic (switch statement)
4. Phase transitions happen within the switch

---

## 5. Lasso System

### Overview

Lassos are the resource used to capture cows. They're collected via adjacency (not by matching). Lassos appear on cow levels and boss levels with cows.

### Lasso Queue

When a match occurs adjacent to a cow (cardinal directions only), the cow's column is pushed to `lassoQueue` at `src/Board.ts:401-403`:
```typescript
} else if (n.type === COW_TYPE && !matchedSet.has(n) && !this.lassoQueue.includes(n.col)) {
  this.lassoQueue.push(n.col);
}
```
- Deduplicated: same column won't be double-queued
- Limit: one lasso per column per gravity pass (guard with `spawnedLassoThisCol`)

### Lasso Spawn

During `applyGravity()` at `src/Board.ts:433-436`:
- If the current column is in `lassoQueue`, spawn a lasso at the top of that column (before regular piece generation)
- Only one lasso column-queue entry is consumed per gravity pass per column

### Lasso Collection

During `addLassoFromCowProximity()` at `src/Board.ts:393-396`:
- After a match, check all cardinal neighbors of each matched piece
- If neighbor is a lasso: mark it `removing = true`, fire `onLassoCollected()` callback
- Lassos are NOT matched — they're collected via adjacency and removed from board

### Lasso Usage

Lassos are consumed to capture cows. The `onCowCapture` callback at `src/Game.ts:99-106`:
```typescript
this.board.onCowCapture = () => {
  if (this.lassos > 0) {
    this.lassos--;
    this.cowsCaptured++;
    return true;
  }
  return false;
};
```

### Lasso Counter

Displayed in HUD as `LASSOS: N/3` where 3 is `CONFIG.game.lassoMax`. Lassos are tracked in `Game.lassos`.

### Starting Lasso

`placeStartingLasso()` at `src/Board.ts:101-111`: places a lasso at `(3, 0)` (center top) when `hasCows` or `cowsToSpawn > 0`. Replaces whatever piece was there (with removal animation).

---

## 6. Cow System

### Overview

Cows are special pieces that must be guided to the bottom row and captured using lassos. They appear on specific levels (e.g., Lonesome Ridge) and boss fights.

### Cow Spawn

**Initial spawn:** `spawnCows(count)` at `src/Board.ts:113-139`:
- Places `count` cows on random non-matching positions
- Replaces existing pieces (with removal animation)
- Avoids `COW_TYPE` collisions and wouldMatch detection

**Mid-level spawn:** `spawnSingleCow()` at `src/Board.ts:487-503`:
- Spawns one cow on a random non-matching position
- Only if `cowCount < 1` (max 1 cow on board at a time)
- Triggered by `pendingCowSpawn` after cascade settles
- `pendingCowSpawn` is set true on:
  - First match of a cow level (`firstMatchMade` flag)
  - After a cow is removed (`removeCowAt` sets `pendingCowSpawn = true`)

### Cow Movement

Cows follow normal gravity: when pieces below them are matched/removed, cows sink down with the compact pass.

Cows are **swappable**: player can click a cow (it gains the golden selection ring), then click an adjacent piece to swap. This lets players maneuver cows toward desirable columns or past obstacles.

### Cow Capture

`collectBottomCows()` at `src/Board.ts:505-516`:
- Called after gravity settles (end of Cascading phase)
- Checks every cell on the bottom row (`rows - 1`)
- If a cow is found: calls `onCowCapture(cow.col, cow.row)`
- If callback returns true: cow is removed, grid cell set to null

**Needs Lasso indicator:** When a cow is on the bottom row and `lassos <= 0`, a golden pulse glow animates behind the cow (`src/Board.ts:632-648`). The `onNeedsLasso` callback checks `Game.lassos <= 0`.

### Cow Win Condition

`Game.checkBoardWinCondition()` at `src/Game.ts:422-441`:
- For levels with `hasCows: true`: win when `cowsCaptured >= 1`
- Lose if `movesUsed >= turnBudget` without capturing a cow
- For non-cow levels: standard score-based win condition

### Cow Count Tracking

- `Board.cowCount`: number of cows currently on the board grid
- `Game.cowsRemaining`: synced from `Board.onCowRemoved` (decrements when cow is removed by capture or row-clear)
- `Game.cowsCaptured`: incremented on successful capture (lassos decremented)

---

## 7. Heart System (Boss Levels Only)

### Overview

Hearts are the primary way to damage the boss during the board phase. They pop when adjacent to a match and respawn automatically. Available only during boss fights.

### Heart Spawn

**Initial spawn:** `spawnHearts(count)` at `src/Board.ts:141-157`:
- Places `count` hearts on random positions (avoids existing hearts and cows)
- Replaces existing pieces (with removal animation)
- Boss fights spawn 5 hearts by default (`heartsToSpawn = 5` in `Game.startBossFight()`)

**Respawn:** During `applyGravity()` at `src/Board.ts:437-439`:
- If a column is in `heartQueue`, spawn a heart at the top
- Column is chosen randomly when a heart is popped (`Math.floor(Math.random() * this.cols)` at `src/Board.ts:400`)
- Processed before regular piece generation but after lasso queue

### Heart Pop (Adjacency)

During `addLassoFromCowProximity()` at `src/Board.ts:397-400`:
- Check cardinal neighbors of each matched piece
- If neighbor is a heart (and not already in match set):
  - Mark it `removing = true`
  - Fire `onHeartMatched()` callback → `boss.notifyHeartMatched()` → boss health -1
  - Push random column to `heartQueue`

### Heart State

- Hearts are **not matchable** — `canMatchType()` returns `true` for heart type (hearts CAN be matched, since they're not in the special type list... wait, let me check).

Actually, looking at the code: `canMatchType()` at `src/Board.ts:298-300`:
```typescript
private canMatchType(type: number): boolean {
  return !this.isSpecialType(type);
}
```
And `isSpecialType()` at `src/Board.ts:219-221`:
```typescript
private isSpecialType(type: number): boolean {
  return type === COW_TYPE || type === LASSO_TYPE;
}
```

So hearts ARE matchable. A 3-heart match would trigger `onMatch` (scoring) AND the `hadHearts` check in Removing phase fires `onHeartMatched` as well. This means a 3-heart match deals 1 damage (via `hadHearts` check) AND each adjacent heart also pops (via `addLassoFromCowProximity`).

But in practice, 5 hearts on a 7×6 board makes 3-in-a-row unlikely unless the player sets it up deliberately.

### Heart Display

During boss fights, HUD shows `HEARTS: N` where N = count of non-removing hearts on board (`src/Game.ts:579`).

---

## 8. Boss Fight System

### State Machine (`BossState` at `src/Boss.ts:4-10`)

```
Intro (1.5s) → BoardPhase → (3 moves) → PatternPhase → (pattern ends, damage applied)
                                                       → BoardPhase → ... loop
                                                       or boss HP ≤ 0 → Victory → Done
```

### BoardPhase (`src/Boss.ts:77-78`)
- Player makes moves on the board
- `notifyBoardMove()` called from Game.ts when `Board.movesUsed` changes
- `notifyHeartMatched()` called when a heart is popped (adjacent to match)
- After 3 moves: `PatternManager.triggerNext()` selects next pattern, state → PatternPhase

### PatternPhase (`src/Boss.ts:80-86`)
- Current pattern plays through its telegraph → active → resolve phases
- `PatternManager.update(dt)` called every frame
- When pattern is done (`!patterns.inPatternPhase`): damage applied to boss health, state → BoardPhase
- Click events are intercepted by `Boss.handleClick()` which forwards to `PatternManager.handleClick()`

### Boss Health Sources

| Source | Amount | Trigger |
|--------|--------|---------|
| Heart adjacency pop | 1 | BoardPhase, any match near heart |
| Pattern: Fan Fire | hits (0-3) | PatternPhase end |
| Pattern: Dynamite Toss | 2 if hit, 0 if miss | PatternPhase end |
| Pattern: Quick Draw | 2 if hit, 0 if miss | PatternPhase end |
| Pattern: Reload Window | clicks × 0.5 (max 4) | PatternPhase end |
| Health decay | 2 HP/s continuous | Always during boss fight |

### Patterns Detail

See `src/BossPatterns.ts` for complete implementation.

**Fan Fire** (`src/BossPatterns.ts:18-184`):
- Telegraph (0.8s): red lines from boss to 3 positions
- Active: 3 circles appear left-to-right, 0.5s each to click, 0.7s total per lane
- Hit detection: 50px radius
- Damage: 1 per hit (max 3)
- Resolve (1.0s): show result

**Dynamite Toss** (`src/BossPatterns.ts:188-372`):
- Telegraph (0.7s): spark particles at origin
- Active (1.2s): dynamite arcs across screen on quadratic bezier curve
- Can only click between 25%-75% arc progress
- Hit detection: 60px radius
- Damage: 2 if hit
- Resolve (0.8s): show result

**Quick Draw** (`src/BossPatterns.ts:376-528`):
- Telegraph (1.2s): crosshair drifts erratically with sine-based movement
- Active (0.65s): "DRAW!" flash, click crosshair within 50px radius
- Damage: 2 if hit
- Resolve (0.8s): show result

**Reload Window** (`src/BossPatterns.ts:532-642`):
- Telegraph (0.3s): "Boss is reloading..." notice
- Active (2.0s): click rapidly, each click = 0.5 damage, max 8 clicks
- Progress bar shows remaining time
- Damage: min(clicks × 0.5, 4)
- Resolve (0.8s): show result

### Pattern Selection

`PatternManager.triggerNext()` at `src/BossPatterns.ts:680-697`:
- Pool of 4 patterns (Fan Fire, Dynamite, Quick Draw, Reload)
- Random selection avoiding last 2 picks (stored in `history`, max length 2)
- When all 4 have been used, `history` resets
- `movesSincePattern` resets to 0 on trigger

---

## 9. Health System

### Regular Levels (Playing state)
- No health decay (`src/Game.ts:408-419` — health decay code removed from Playing section)
- Health starts at 100 (`CONFIG.game.initialHealth`)
- Health restored by matches: +8 HP per match (`CONFIG.game.healthPerMatch`), capped at 100
- Health does NOT reach 0 = no game over from health alone on regular levels

### Boss Fights (BossActive state)
- Health decays at 2 HP/s (`CONFIG.game.healthDecayBase`, `src/Game.ts:383-387`)
- Health = 0 → GameOver
- Matches still restore health (+8 per match)
- Max health: 100

### Health Display
- Health bar at top-right of HUD (`src/HUD.ts:76-110`)
- Rounded bar with gold-to-orange gradient fill
- Text: `HP N` centered on bar

---

## 10. Scoring & Combo

### Score Accumulation
- Points added per match: `baseScore * combo`
- Combo increments per match (including cascade chains), max 10
- Combo resets on new player move (not during chain reactions)
- Score level-up: every 3000 points = +1 level (visual only, no gameplay effect yet)

### Score Target
- Each level has a `scoreTarget` (from `TownDef.scoreTarget` in `src/data.ts`)
- Win condition for non-cow levels: `score >= scoreTarget` before `movesUsed >= turnBudget`

### Combo Display
- HUD shows `COMBO xN` at top-right
- Text pulses redder as combo increases (`src/HUD.ts:67-70`)

---

## 11. Deadeye System

### Accumulation
| Match Type | Deadeye Gain |
|------------|--------------|
| Normal (3) | +8 |
| Line (4) | +15 |
| Area (5+) | +25 |
| Max | 100 (`CONFIG.game.deadeyeMax`) |

### Usage
- When deadeye is full (100) and the current town has `hasShootout: true`:
  - Level completion shows a "ConfirmShootout" prompt (`GameState.ConfirmShootout`)
  - Player can choose to enter shootout or skip
- Using shootout consumes deadeye (reset to 0)
- Deadeye persists across levels

### Display
- Deadeye meter at top-center of HUD (`src/HUD.ts:112-140`)
- Brown-to-orange-to-red gradient fill
- Label: "DEADEYE" when filling, "DEADEYE READY" when full

---

## 12. Level Win/Lose Conditions

### Standard Levels (non-cow, non-boss)
- Win: `score >= scoreTarget` before `movesUsed >= turnBudget`
- Lose: `movesUsed >= turnBudget` and `score < scoreTarget`

### Cow Levels (`hasCows: true`)
- Win: `cowsCaptured >= 1`
- Lose: `movesUsed >= turnBudget` and `cowsCaptured < 1`

### Boss Levels
- Boss fight state machine handles win/lose:
  - Boss HP ≤ 0 → Victory → Done → return to RegionMap
  - Player health ≤ 0 → GameOver
  - Board has no turn limit for boss (turnBudget = 99)

### Level Complete Flow
1. Board win condition met
2. If town has shootout AND deadeye full → `ConfirmShootout` prompt
3. After shootout or skip → `Results` screen with score, turns, grip reduction
4. Results → click Continue → back to RegionMap
5. If `regionGrip <= 0` after results → `bossTriggered = true` → next level = boss fight

---

## 13. HUD Elements

### Layout

| Position | Element | Color | Source |
|----------|---------|-------|--------|
| Top-left | SCORE: N | Gold | `src/HUD.ts:31-33` |
| Top-left | GOAL: N | Gray | `src/HUD.ts:35-37` |
| Top-left | LVL: N | White | `src/HUD.ts:39-41` |
| Top-left | LASSOS: N/3 | Tan | `src/HUD.ts:43-45` |
| Top-left | HEARTS: N | Red (boss only) | `src/HUD.ts:47-53` |
| Top-left | COWS: N | Gold (boss only) | `src/HUD.ts:54-57` |
| Top-right | MOVES: N/M | White | `src/HUD.ts:60-62` |
| Top-right | COMBO xN | White/Red pulse | `src/HUD.ts:64-70` |
| Top-right | Health bar | Gold gradient | `src/HUD.ts:76-110` |
| Top-center | Deadeye meter | Gradient | `src/HUD.ts:112-140` |

### Boss-Only HUD
When `isBossLevel: true` in HUDData:
- HEARTS: count of hearts currently on board
- COWS: remaining cows (if cows are present in boss fight)

---

## 14. Input Handling

### Mouse Clicks
- `Game.handleClick(mx, my)` at `src/Game.ts:267-338` routes clicks based on current `GameState`
- Coordinate mapping: canvas coordinates (already CSS-pixel adjusted in `main.ts`)
- Board click: `Board.handleClick()` converts to grid coordinates via `(mx - ox) / cellSize`

### Keyboard
- `Game.handleKeyDown(key)` at `src/Game.ts:197-203`
- **B key**: At RegionMap or TownSelect → starts boss fight immediately
- Registered in `main.ts` with `window.addEventListener('keydown', ...)`

### Click Routing by State

| GameState | Handler |
|-----------|---------|
| Menu | `Game.start()` (transition to RegionMap) |
| RegionMap | `RegionMap.handleClick()` |
| TownSelect | `TownSelect.handleClick()` |
| Playing | `Board.handleClick()` |
| ConfirmShootout | `Shootout.handlePromptClick()` |
| ShootoutActive | `Shootout.handleClick()` |
| Results | `ResultsScreen.handleClick()` |
| BossActive | `Boss.handleClick()` first → if unhandled, `Board.handleClick()` |
| GameOver | `Game.start()` |

---

## 15. Game State Machine

### States (`GameState` enum at `src/Game.ts:19-29`)

| State | Description |
|-------|-------------|
| Menu | Title screen, click to start |
| RegionMap | Region overview, clickable towns |
| TownSelect | Town info + "Ride Out" button |
| Playing | Board phase (match-3 gameplay) |
| ConfirmShootout | Prompt to enter shootout or skip |
| ShootoutActive | Shootout minigame |
| Results | Post-level summary |
| BossActive | Boss fight (BoardPhase ↔ PatternPhase) |
| GameOver | Death screen, click to restart |

### State Transitions

Full diagram in `src/Game.ts` implemented via the `update()` and `handleClick()` switch statements:

```
Menu → (click) → RegionMap
RegionMap → (click town) → TownSelect
TownSelect → (click Ride Out) → Playing
Playing → (win) → (deadeye full + shootout town?) → ConfirmShootout
                                                  ↘ (no) → Results
ConfirmShootout → (click "Shoot") → ShootoutActive
                → (click "Skip") → Results
ShootoutActive → (done) → Results
Results → (click Continue) → RegionMap
         → (if bossTriggered) → BossActive
BossActive → (boss HP ≤ 0) → Victory (2s) → Done → RegionMap
          → (player HP ≤ 0) → GameOver
GameOver → (click) → Menu
```

---

## 16. Dev Shortcuts

### B Key
- Press `B` at RegionMap or TownSelect screen
- Skips all menu/level progression
- Starts a boss fight directly with current region's boss
- Useful for rapid boss iteration

### VITE_BOSS_TEST Env Var
- Set `VITE_BOSS_TEST=1` before starting dev server (or use `npm run dev:boss`)
- `Game.ts:116-118` checks `import.meta.env.VITE_BOSS_TEST`
- If truthy: auto-starts boss fight after 100ms delay
- Used for automated testing and continuous development

---

## 17. Project Structure

```
m3-v2/
├── dist/                    # Build output
├── docs/                    # Documentation
│   ├── CHANGELOG.md
│   ├── DECISIONS.md
│   ├── GDD_PAST.md          # Original GDD (frozen)
│   ├── GDD_PRESENT.md       # Current GDD
│   ├── GDD_FUTURE.md        # Aspirational GDD
│   └── MECHANICS.md         # This file
├── node_modules/
├── src/                     # Source code
│   ├── main.ts              # Entry point
│   ├── config.ts            # All constants
│   ├── data.ts              # Region/town/boss definitions
│   ├── Game.ts              # Top-level orchestrator
│   ├── Board.ts             # Match-3 + cow/lasso/heart
│   ├── Piece.ts             # Piece types + drawing
│   ├── Background.ts        # Parallax desert
│   ├── Boss.ts              # Boss fight orchestrator
│   ├── BossPatterns.ts      # Pattern implementations
│   ├── RegionMap.ts         # Region navigation
│   ├── TownSelect.ts        # Level info
│   ├── ResultsScreen.ts     # Post-level results
│   ├── Shootout.ts          # Shootout minigame
│   ├── Silhouette.ts        # Shootout targets
│   ├── HUD.ts               # HUD rendering
│   ├── Gun.ts               # Revolver rendering
│   ├── Screens.ts           # Menu/GameOver
│   ├── Effects.ts           # Particles/text
│   ├── Audio.ts             # Sound effects
│   └── Input.ts             # Coordinate mapping
├── tests/                   # Playwright tests
│   ├── screenshots/
│   └── smoke.spec.ts
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vite.config.ts
├── BALANCE.md
├── GDD.md                   # Original GDD root copy
└── ITERATION_PLAN.md        # V2 iteration plan
```

### Build Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start Vite dev server (hot-reload) |
| `npm run dev:boss` | Start dev server with `VITE_BOSS_TEST=1` (auto boss) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run typecheck` | TypeScript type-check only |
| `npx playwright test` | Run Playwright smoke tests (Firefox) |
