# Changelog

*Chronological log of all changes to the DESERT GUNNER prototype. Format: `YYYY-MM-DD: Change description [files affected] — reason`.*

---

## Iteration 1 — Cow/Lasso Redesign & Boss Patterns

### 2026-06-17: Playwright smoke tests added
- Added `playwright.config.ts` and `tests/smoke.spec.ts` with 4 tests (loads, menu click, B-key boss start, boss interactions)
- Configured for Firefox (Chromium headless shell missing system deps)
- All 4 tests passing

### 2026-06-17: Dev shortcuts for boss testing
- Added `handleKeyDown(key)` method to Game.ts: pressing `B` at RegionMap/TownSelect calls `startBossFight()` [`src/Game.ts:197-203`]
- Added keydown event listener in `main.ts`
- Added `"dev:boss": "VITE_BOSS_TEST=1 vite"` npm script in `package.json`
- Added `VITE_BOSS_TEST` env check in Game.ts constructor (auto-starts boss fight after 100ms delay) [`src/Game.ts:116-118`]
- **Reason:** Enable rapid boss iteration without playing through menu/region progression

### 2026-06-17: Boss visual clarity improvements
- Darkened boss overlays: BoardPhase from `rgba(255, 215, 0, 0.08)` to `rgba(0, 0, 0, 0.2)`; PatternPhase from `rgba(255, 50, 0, 0.12)` to `rgba(0, 0, 0, 0.55)` [`src/Boss.ts:122-136`]
- Enlarged pattern hit targets ~1.5× (Fan Fire: 33px→45px pulse; Dynamite: 40px→60px hit radius) [`src/BossPatterns.ts:87-90, 257`]
- Thickened telegraph lines: 3px→6px [`src/BossPatterns.ts:98`]
- Added `heartsOnBoard` and `cowsRemaining` display to HUD during boss fights [`src/HUD.ts:47-58`]
- **Reason:** Boss patterns were hard to read against the bright board; darkened overlays make telegraphs pop

### 2026-06-17: Health decay removed from regular levels
- Removed `this.health -= CONFIG.game.healthDecayBase * dt` from `Playing` state update block (lines 400-407 removed) [`src/Game.ts`]
- Kept health decay in `BossActive` state: `this.health -= CONFIG.game.healthDecayBase * dt` (line 383) [`src/Game.ts:383`]
- **Reason:** Time pressure on puzzle-solving felt punishing; keep tension for boss fights only

### 2026-06-17: Heart mechanic redesigned — adjacency pop + auto-respawn
- Hearts pop via adjacency: added `HEART_TYPE` check in `addLassoFromCowProximity()` — marks heart removing, fires `onHeartMatched`, pushes random column to `heartQueue` [`src/Board.ts:397-400`]
- Hearts respawn automatically: added `heartQueue: number[]` to Board; processed in `applyGravity()` (same timing as lasso queue) [`src/Board.ts:437-439`]
- Removed `canDamageHearts` prerequisite: deleted from `canMatchType()` guard, `onCowRemoved` callback, and `startBossFight()` setup
- **Reason:** Finite hearts + cow-clear prerequisite made boss damage feel locked behind busywork; adjacency pop + infinite respawn keeps the board phase dynamic

### 2026-06-17: Cow/Lasso mechanic redesign — adjacency collection + gravity capture
- Rewrote `addLassoFromCowProximity()` in Board.ts: lassos adjacent to a match are collected (marked removing, fires `onLassoCollected`); cows adjacent still queue lasso spawn [`src/Board.ts:380-409`]
- Removed `collectLassos()` — lassos no longer collected at bottom row
- Added `collectBottomCows()` — checks bottom row after cascade settles; if cow present and `onCowCapture` returns true (lassos > 0), cow is removed and grid cell nulled [`src/Board.ts:505-516`]
- Removed click-to-capture for cows in `handleClick` — cows only captured via bottom row [`src/Board.ts:233`]
- Made cows swappable: `handleClick` and selection checks only block `LASSO_TYPE`, not `COW_TYPE` [`src/Board.ts:233, 247-251`]
- Added `onNeedsLasso: () => boolean` callback; wired in Game.ts to `this.lassos <= 0` [`src/Game.ts:97`]
- Added golden pulse glow on bottom-row cows when `lassos <= 0` [`src/Board.ts:632-648`]
- Added golden pulse glow on all lassos (always visible) [`src/Board.ts:650-660`]
- Fixed lasso visibility: stroke changed from `#c49a6c` (matched board cell color) to dark brown `#5c3a21` with thicker 3.5px stroke; added golden highlight arc `#8b6914`; fill changed to `rgba(92, 58, 33, 0.35)` [`src/Piece.ts:202-231`]
- Boss levels with cows (`cowsToSpawn > 0`) now get a starting lasso via `placeStartingLasso()` [`src/Board.ts:96-111`]
- Cow levels win condition: capture ≥ 1 cow (checked in `checkBoardWinCondition`) [`src/Game.ts:424-433`]
- **Reason:** Original bottom-row lasso collection was undiscoverable; adjacency collection teaches the mechanic naturally. Cow auto-capture at bottom + pulse glow creates clear feedback loop

## Initial Build

### Pre-2026-06: Phase 0-2 Foundation (Original GDD scope)
- Full match-3 board with 5 piece types, swap/match/gravity/cascade state machine
- Match-4 row clear, match-5+ column clear
- Parallax desert background, revolver with recoil, particle effects, Web Audio SFX
- Vite + TypeScript dev environment
- Region/town data (Texas Plains, 6 levels)
- Region Map, Town Select, Playing, Results state machine
- Shootout minigame with hostile/friendly discrimination
- Deadeye meter persistence and activation
- All balanced via `config.ts`
- See `GDD_PAST.md` for full Phase 0-2 details
