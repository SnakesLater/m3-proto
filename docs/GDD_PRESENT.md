# DESERT GUNNER: Matched by Bullets — Present GDD

*Current implementation reality. Updated from GDD_PAST.md. Changes from PAST are annotated with `[CHANGE]` and cross-reference `DECISIONS.md`.*

---

## Preamble: Changes from PAST

This document is a live update of the original GDD. Sections that differ from `GDD_PAST.md` are flagged with `[CHANGE]` and link to `DECISIONS.md` for rationale. Unchanged sections are copied verbatim.

The major architectural shifts from PAST:
1. **Cow/Lasso mechanic replaced the original pure match-3** — cows move with gravity, lassos collected via adjacency (DECISIONS.md §1)
2. **Heart mechanic redesigned** — adjacency pop instead of board-phase prerequisite (DECISIONS.md §3)
3. **Health decay removed from regular levels** — kept only in boss fights (DECISIONS.md §2)
4. **Boss patterns implemented** — 4 pattern types with telegraph/active/resolve phases (DECISIONS.md §4)
5. **Boss visual clarity improved** — darker overlays, larger targets (DECISIONS.md §5)
6. **Dev shortcuts added** — B key, VITE_BOSS_TEST env var (DECISIONS.md §6)
7. **Health decay removed from boss fights** — replaced with Deadeye drain + puzzle system (DECISIONS.md §8)
8. **Puzzle mode added** — Deadeye max triggers boss-specific interactive puzzle (DECISIONS.md §9)
9. **Bill the Rustler puzzle** — first puzzle boss with telegraph/choice/resolve cycle (DECISIONS.md §10)
10. **Lasso + Hold puzzle actions** — 4 actions in 2×2 grid; Lasso spends board resource, Hold skips (DECISIONS.md §10.3)
11. **Cow pool model** — 10 names consumed individually; grass type joins when pool empties (DECISIONS.md §9.5, §10.4)
12. **QTE damage unified** — all patterns deal 1 HP on hit, turn penalty on miss (DECISIONS.md §4.4)
13. **Resource injection** — BoardPhase automatically ensures cows and lassos on board (DECISIONS.md §9.7)

---

# 1. Game Overview

**High Concept:** A Southwestern-themed match-3 hybrid where the board fuels action phases — shootouts, boss fights, and territorial progression across an expanding frontier. Not a candy-crush reskin. Every match fires your gun. Every cleared town loosens the gang's grip on the region. Every boss defeated opens new land to the West.

**Genre:** Match-3 / Action-RPG hybrid with roguelite-lite progression elements.

**Theme:** Spaghetti Western aesthetics — dust, leather, revolvers, wanted posters, saloons, desert sunsets, and six-shooter justice.

**Target Experience:**
- The board phase is meditative and tactical (plan matches)
- Shootouts are visceral and skill-based (react fast, discriminate targets)
- Boss fights are pattern-recognition challenges (learn telegraphs, execute)
- Between towns, loadout choices create tension (am I building for loot or for the boss?)

**Current Phase:** Phase 3 — Boss Patterns (match-3 core + cow/lasso/heart mechanics + boss patterns + shootout)

---

# 2. Core Match-3 Mechanics

## 2.1 Board

| Property | Value | Notes |
|----------|-------|-------|
| Dimensions | 7 columns × 6 rows | Standard for match-3, fits portrait-ish gameplay |
| Cell size | 64px | At 960×600 canvas, leaves room for HUD and gun |
| Grid offset Y | 120px | Space for sky + scorebar above |

## 2.2 Piece Types

### Standard Types (5)

| Type | Index | Color | Visual |
|------|-------|-------|--------|
| Outlaw | 0 | Red (#ff3333) | Circle with star badge |
| Bandit | 1 | Dark (#1a1a1a) | Rounded rect with glowing eyes |
| Snake | 2 | Green (#33cc33) | Bezier curve body with segmented dots |
| Coyote | 3 | Gray (#cccccc) | Pentagon with ears |
| Vulture | 4 | Orange (#cc6600) | Wing-shaped bird silhouette |

### Special Types (3)  [CHANGE — new types replacing GDD Phase 3+ plan]

| Type | Index | Color | Behavior |
|------|-------|-------|----------|
| Cow | 5 | Gold (#8b6914) | Moves via gravity; captured when reaching bottom row with lassos > 0 |
| Heart | 6 | Pink (#ff0044) | Boss-only; popped via adjacency match; deals 1 boss damage; auto-respawns |
| Lasso | 7 | Brown (#c49a6c) | Collected when adjacent to a match; consumed to capture cows |

**Design note:** Piece draw functions are registered in a strategy map (`PIECE_TYPES`), not an if/else chain. Adding a new type means adding one entry and one draw function — no other code changes. Special types (5–7) use type-index constants (`COW_TYPE = 5`, `HEART_TYPE = 6`, `LASSO_TYPE = 7`) for fast comparison in match/collision logic.

## 2.3 Match Detection

- Simultaneous horizontal + vertical pass
- Finds all runs of length 3+ with the same type
- Non-removing pieces only
- Supports overlapping matches (e.g., an L-shape or T-shape clears all pieces in both runs)
- Match-4 clears its entire row; match-5+ clears its entire column as well [CHANGE — row/col clear was a PAST future idea, now implemented]
- Special types (Cow, Lasso) are excluded from match detection via `canMatchType()` — they cannot be matched

## 2.4 Gravity

- Per-column compact: non-removed pieces sink to fill gaps
- New pieces spawn at the top with a small entrance animation
- `wouldMatch()` is called during spawn to prevent trivially created matches at insertion time (the cascading check is the real safety net)
- Lasso queue and heart queue are processed during gravity: queued columns spawn a lasso or heart at the top before regular piece generation [CHANGE — gravity now handles special spawn queues]

## 2.5 State Machine (Board Phase)

```
                          ┌──────────────────────────┐
                          │  Idle                    │
                          │  (waiting for player)    │
                          └────┬─────────────────────┘
                               │ valid adjacent click
                               ▼
                    ┌──────────────────────────┐
                    │  Swapping                │
                    │  (animation playing)     │
                    └────┬─────────────────────┘
                         │ both pieces arrived
                         ▼
               ┌────────────────────┐      ┌────────────────────┐
               │  Matches found?    │──NO──│  Was swap-back?    │
               └────────┬───────────┘      └────────┬───────────┘
                        │ YES                       │ NO (first swap)
                        ▼                           ▼
               ┌────────────────────┐      ┌────────────────────┐
               │  Removing          │      │  SwapBack           │
               │  (matched pieces   │      │  (swap pair back)   │
               │   shrink away)     │      └────────┬───────────┘
               └────────┬───────────┘               │
                        │ remove ≥ 50%               │ re-enter Swapping
                        ▼                           ▼
               ┌────────────────────┐      (back to Swapping
               │  + addLassoFrom-   │       with isSwapBack=true)
               │    CowProximity()  │
               │  + sinkSpecial-   │
               │    Pieces()        │
               │  + onMatch()       │
               └────────┬───────────┘
                        │
                        ▼
               ┌────────────────────┐
               │  Cascading         │
               │  (gravity settle)  │
               └────────┬───────────┘
                        │ all settled
                        ▼
               ┌────────────────────┐
               │  collectBottom-   │
               │    Cows()          │
               │  More matches?    │──YES→ Removing (chain reaction)
               └────────┬───────────┘
                        │ NO
                        ▼
               ┌────────────────────┐
               │  pendingCow-      │
               │    Spawn? → spawn │
               │    single cow      │
               │  Back to Idle      │
               └────────────────────┘
```

**Key additions from PAST:**
- `addLassoFromCowProximity()` runs after removal — checks if any matched piece is adjacent to a lasso (collects it), cow (queues lasso spawn), or heart (pops it and queues respawn)
- `sinkSpecialPieces()` runs after removal — moves special pieces (cows, hearts, lassos) down when pieces below them are cleared by row/column clears
- `collectBottomCows()` runs after gravity settles — checks bottom row for cows, captures them if lassos > 0
- `pendingCowSpawn` flag — after first match on cow levels, queues a single cow spawn after cascade settles

---

# 3. Three-Phase Loop

## 3.1 Board Phase

**This section replaces the PAST §3.1. Original scoring and combo system retained; cow/lasso/heart mechanics added.**

- Match 3+ pieces to remove them and score points
- Each match fires the gun (audio + visual feedback)
- Bigger matches (4 = "LINE CLEAR", 5+ = "AREA CLEAR") produce bigger effects, more score, and different sounds
- Combo meter builds with consecutive matches (max 10)
- Match-4 clears its entire row; match-5+ clears its entire column as well
- **Health (canteen) does NOT drain during regular levels** [CHANGE — removed to reduce time pressure]
- **Health (canteen) drains during boss fights ONLY via Deadeye system** (2 HP/s base replaced with 1.5/s deadeye drain) [CHANGE]
- Move budget limits total moves per level

### Cow/Lasso Subsystem [CHANGE — entirely new]

On levels with `hasCows: true` and boss levels with `cowsToSpawn > 0`:
- Cows are placed at level start on random non-matching positions
- A starting lasso is placed at the center top cell
- Cows are **swappable** (player can click and swap them with adjacent pieces)
- Cows move with gravity like normal pieces
- When a cow is adjacent to a match (not matched itself, but next to a matched piece):
  - A lasso spawn is queued in that cow's column (drops from top during gravity)
- When a lasso is adjacent to a match:
  - The lasso is collected (removed from board, `lassos++` counter incremented)
- After a lasso is collected, `collectBottomCows()` checks the bottom row:
  - If a cow is on the bottom row AND `lassos > 0`:
    - Cow is removed, lasso decremented, cow captured
- If cow reaches bottom row when `lassos <= 0`:
  - Cow waits at bottom with a golden pulse glow indicating "needs lasso"
- Cow levels win condition: capture ≥ 1 cow (checked against `cowsCaptured`)
- After first match on a cow level, and after each cascade settles, one new cow is spawned (maintains ~1 cow on board)

### Heart Subsystem (Boss Levels Only) [CHANGE — entirely new]

On boss levels:
- Hearts are placed at level start (configurable count, currently 5)
- Hearts are **swappable**
- Heart type is excluded from match detection — hearts cannot be matched as 3-in-a-row
- When a heart is adjacent to a match:
  - Heart is popped (removed from board)
  - `onHeartMatched` callback fires → `boss.notifyHeartMatched()` → boss takes 1 damage
  - A random column is pushed to `heartQueue`
- During gravity, queued heart columns spawn a new heart at the top
- Hearts auto-respawn indefinitely — there is no finite supply
- **No prerequisite for heart damage** — `canDamageHearts` guard was removed [CHANGE]

**Scoring (current):**

| Match Size | Base Score | Audio | Visual |
|------------|-----------|-------|--------|
| 3 | 100 × combo | Shot (short, percussive) | Small spark burst, "BANG!" text |
| 4 | 300 × combo | Ding (musical ping) | Medium burst, "LINE CLEAR!" |
| 5+ | 500 × combo | Thump (bass hit) | Large burst, "AREA CLEAR!" |

## 3.2 Shootout Phase

*Unchanged from PAST. Full description in GDD_PAST.md §3.2.*

When Deadeye meter is full (after sufficient matches), the player can activate a shootout. Full mechanics: silhouettes pop up, player discriminates hostiles vs friendlies, grip reduction depends on performance.

## 3.3 Boss Phase [CHANGE — completely redesigned from PAST §3.3]

### Boss Fight Flow

Boss fight alternates between **BoardPhase** and **PatternPhase**:

```
Boss Intro (1.5s)
    │
    ▼
BoardPhase ──(play on board, match hearts for +1 damage each)──→ movesSincePattern ≥ 3
    │                                                                         │
    │                                                   PatternManager.triggerNext()
    │                                                                         ▼
    │                                                                PatternPhase
    │                                                                 (boss attacks)
    │                                                                     │
    └────────(PatternPhase ends)───────────────────────────────────────────┘
                                                                         │
                                                    boss.health > 0? ────┘
                                                           │ NO
                                                           ▼
                                                      Victory (2s)
                                                           │
                                                           ▼
                                                      Done
```

**Pattern Manager** (`BossPatterns.ts`):
- Contains a pool of 4 pattern types
- Each boss turn (after 3 board moves), selects one pattern at random, weighted
- Same pattern cannot repeat twice in a row
- Pattern phases run independently of the board (board remains visible in background)
- After pattern completes: damage is applied, returns to BoardPhase
- When boss HP ≤ 0: victory screen, return to RegionMap

### Boss Health & Damage Sources

| Source | Damage | Penalty on Miss | When |
|--------|--------|-----------------|------|
| Heart adjacency pop | 1 per pop | — | BoardPhase — any match adjacent to a heart |
| Pattern: Fan Fire | 1 per bullet hit (0-3) | 1 turn per miss (0-3) | End of PatternPhase |
| Pattern: Dynamite Toss | 1 if hit | 1 turn penalty | End of PatternPhase |
| Pattern: Quick Draw | 1 if hit | 1 turn penalty | End of PatternPhase |
| Pattern: Reload Window | 1 if any clicks | 1 turn penalty | End of PatternPhase |
| Puzzle: Dynamite on Bill | 10 | — | PuzzleResolve |
| Puzzle: Lasso/Revolver on Bill | 2 | — | PuzzleResolve |
| Puzzle: Grazing hit | 1 | 1 turn penalty | PuzzleResolve |
| Puzzle: Miss | 0 | 1 turn penalty | PuzzleResolve |
| Deadeye drain (player) | 1 HP when deadeye hits 0 | — | BoardPhase |

**Progression damage table:**
```
Heart pops:      1 dmg each, unlimited via heart respawn
Patterns:        0-3 dmg per cycle (3 moves), 0-3 turn penalty
Puzzle mode:     0-10 dmg per trigger (depends on action)
Deadeye drain:   1.5/s drain; 0 = 1 player damage + reset to 50
```

### Boss Patterns

**Fan Fire:**
- 3 horizontal click targets appear left-to-right sequentially
- 500ms window per target
- Each hit = 1 damage, each miss = 1 turn penalty (damage 0-3, penalty 0-3)
- Telegraph: 0.8s red lines from boss to target positions
- Hit visual: green circle with checkmark

**Dynamite Toss:**
- Dynamite stick arcs across screen (quadratic bezier) over 3.0s (slowed from 1.0s)
- Click target during middle 50% of arc (between 25%–75% progress)
- Hit = 1 damage, miss = 1 turn penalty
- Telegraph: 1.0s spark particles at origin
- Hit visual: explosion burst

**Quick Draw Standoff:**
- Crosshair drifts erratically on screen during 1.2s telegraph
- "DRAW!" flash → 0.65s click window
- Hit = 1 damage, miss = 1 turn penalty
- Telegraph: dark overlay with pulsing crosshair

**Reload Window:**
- Boss pauses to reload (2s window)
- Need at least 1 click for hit (1 damage); no clicks = 1 turn penalty
- Brief 0.3s "Boss is reloading..." notice
- Progress bar shows remaining time

---

# 4. Regions & Progression

## 4.1 Region Map

```
Region 1: Texas Plains
  Gang: The Rustlers
  Boss: Cattle Rustler Bill (10 HP)
  Theme: Golden grasslands, wooden buildings
  Grip: 100
  Towns: Dusty Trail (W), Dry Gulch (T), Lonesome Ridge (W, cows),
         Dustbowl (T), Rattlesnake Gorge (W), Dead Man's Crossing (T)
```

*Regions 2–5 defined in GDD_PAST.md; not yet implemented.* [CHANGE — only Texas Plains exists in code]

## 4.2 Gang's Grip

- Per-region value (0–100+)
- Decreases when towns are cleared and shootouts are won
- Increases when friendlies are shot in shootouts
- When Grip reaches 0, the boss is drawn out (next town completion triggers boss fight)
- Boss fight also starts via B key at RegionMap/TownSelect for testing [CHANGE — dev shortcut added]

## 4.3 Level Flow

```
Region Map
  │
  ├─ Click Town
  │   └─ TownSelect (info + "Ride Out")
  │       └─ Playing (Board Phase)
  │           ├─ Win → score ≥ target or cow captured (cow levels)
  │           ├─ Lose → turns exhausted without target
  │           └─ (Deadeye full?) → ConfirmShootout → ShootoutActive
  │                                  → Results → Region Map
  │
  └─ B key → instant boss fight (dev shortcut)
```

---

# 5. Loadout & Weapons (Phase 4+) [FUTURE]

*Not implemented. See GDD_FUTURE.md and GDD_PAST.md §5 for the design.*

---

# 6. Wilderness Levels (Phase 5+) [FUTURE]

*Not implemented. See GDD_FUTURE.md and GDD_PAST.md §6 for the design.*

---

# 7. Gang Reconquest System (Phase 6+) [FUTURE]

*Not implemented. See GDD_FUTURE.md.*

---

# 8. Design Variants & Open Questions

## 8.1 Eliminated Variants (from PAST)

- **Direct weapon impact on board:** Rejected in favor of cleaner separation — weapons affect actions per move (turn budget), not board states. *Still valid.*
- **Game over on boss failure:** Replaced with "retry with grip penalty." *Still valid.*
- **Shootout as speed-click test:** Replaced with discrimination (hostile vs. friendly). *Still valid.*

## 8.2 Eliminated in Current Iteration [CHANGE — new]

- **Health decay on regular levels:** Removed. Players solve puzzles without time pressure. Kept in boss fights. (DECISIONS.md §2)
- **Cow click-to-capture:** Removed. Cows only captured via bottom row. (DECISIONS.md §1)
- **Lasso collection at bottom row:** Removed. Lassos collected via adjacency. (DECISIONS.md §1)
- **Heart cow-clear prerequisite:** Removed. Hearts pop on adjacency regardless. (DECISIONS.md §3)
- **Finite heart supply:** Removed. Hearts auto-respawn. (DECISIONS.md §3)

## 8.3 Active Design Questions

- **Cow spawn cadence:** Currently 1 cow on board at a time, respawns after capture. Adjust?
- **Heart adjacency radius:** Currently cardinal neighbors only. Diagonal?
- **Lasso max:** Currently 3 (`lassoMax` in config). Does stockpiling feel right?
- **Boss pattern speed:** Currently 3 moves per pattern. Should regions increase speed?

---

# 9. Technical Architecture

## 9.1 Module Map [UPDATED]

```
src/
├── main.ts                 # Entry: canvas, game loop, input (keydown listener added)
├── config.ts               # All constants, balance tables (lassos, cows, hearts added)
├── data.ts                 # Region/town definitions, level configs (cow flag per town)
├── Game.ts                 # Top-level orchestrator (menu→map→select→play→results→boss)
├── Board.ts                # Match-3 with cow/lasso/heart mechanics, gravity queues
├── Piece.ts                # Piece types (strategy pattern) + drawCow/drawHeart/drawLasso
├── Background.ts           # Parallax desert (region-aware)
├── RegionMap.ts            # Region map screen with clickable towns + grip bar
├── TownSelect.ts           # Town/wilderness info + start screen
├── ResultsScreen.ts        # Post-level results summary
├── Shootout.ts             # Shootout state machine (with discrimination)
├── Silhouette.ts           # Target entity (hostile/friendly discrimination)
├── Boss.ts                 # Boss encounter orchestrator (BoardPhase ↔ PatternPhase ↔ Puzzle states)
├── BossPatterns.ts         # 4 boss pattern implementations + PatternManager
├── BossPuzzle.ts           # Boss puzzle interface (BossPuzzle + BossPuzzleResult)
├── BillRustlerPuzzle.ts    # Bill the Rustler puzzle — telegraph/choice/resolve cycle
├── HUD.ts                  # HUD: score, goal, turns, combo, health, deadeye, lassos, boss data
├── Gun.ts                  # Weapon renderer (revolver with recoil + muzzle flash)
├── Screens.ts              # Menu, Game Over
├── Effects.ts              # Particles, floating text
├── Audio.ts                # Sound effects (Web Audio API oscillators)
└── Input.ts                # Coordinate transform
```

## 9.2 Data Flow

```
main.ts → Game.update() → Board.update() → (BoardPhase state machine + cow/lasso/heart processing)
                         → Effects.update()
                         → Background.update()
                         → Gun.update()
                         → Boss.update() (BoardPhase ↔ PatternPhase)
                         → Audio.play()

main.ts → Game.draw() → Background.draw()
                       → (state-dependent screen: RegionMap, TownSelect,
                          Board+Gun+HUD, Boss+Board+Gun+HUD, Results, Menu, or GameOver)
                       → Boss.drawOverlay() (if boss active)
                       → Effects.draw()
```

## 9.3 Game State Machine [UPDATED]

```
Menu → (click) → RegionMap → (click town) → TownSelect → (click Ride Out) → Playing
                      ↑                                                    |
                      |                                            (level complete)
                      |                                         (deadeye? → shootout)
                      |                                                    |
                      |                                       ┌────────────┘
                      |                                       ▼
                      |                                    Results
                      |                                       |
                      └────────────────(grip ≤ 0?)───────────┘
                                               |
                                        YES / NO
                                          |    └──→ RegionMap
                                          ▼
                                    BossActive
                                       |
                                       ├─ BoardPhase (match hearts for bonus damage)
                                       │      │
                                       │      └── every 3 moves → PatternPhase
                                       │             │ (pattern plays out)
                                       │             └── damage applied → BoardPhase
                                       │
                                       ├─ boss HP ≤ 0 → Victory → RegionMap
                                       │
                                       └─ health ≤ 0 → GameOver

Dev shortcut: B key at RegionMap/TownSelect → skip directly to BossActive
              VITE_BOSS_TEST=1 env var → auto-start boss fight on game start
```

## 9.4 Implementation Phases [UPDATED]

| Phase | Modules | Playable? | Core Loop? |
|-------|---------|-----------|------------|
| 0 | config, Piece, Board, Background, Effects, Gun, HUD, Audio, Screens, Game, main, data | ✅ Match-3 works | No |
| 1 | RegionMap, TownSelect, ResultsScreen, HUD (upgraded), Board (moves/win), Game (state machine) | ✅ Level flow | Partial |
| 2 | Shootout, Silhouette, Game (ConfirmShootout/ShootoutActive states), Deadeye persistence | ✅ Board→Shootout→Grip | Yes |
| 3 | Boss patterns, Boss, BossPatterns, cow/lasso/heart mechanics | ✅ All phases | Yes |
| 4 | BossPuzzle (base), BillRustlerPuzzle, puzzle states in Boss.ts, Deadeye drain in Game.ts | ✅ Bill puzzle works | Yes |
| 5 | WildernessHazard, wilderness routing | Not yet | — |
| 6 | Reconquest system | Not yet | — |
| 7 | Polish (effects, audio, animation, region art) | Not yet | — |

## 9.5 Build Output

- Vite + TypeScript dev environment
- Clean ES module structure
- Build: 22 modules, 71.53 kB (18.68 kB gzip)
- `npm run build` for production bundle
- `npm run dev` for development server (Vite hot-reload)
- `npm run dev:boss` for `VITE_BOSS_TEST=1 vite` (auto-starts boss fight)
- Playwright smoke tests: `npx playwright test` (4 tests, Firefox)

---

# 10. Current Status (Phase 3 — Complete)

**Phase 0 implemented (match-3 core):**
- Full match-3 board with 5 piece types
- Grid swap/match/gravity/cascade state machine
- Match-4 row clear, match-5+ column clear
- Parallax desert background (sky gradient, dunes, shrubs)
- Revolver with recoil + muzzle flash animation
- Particle effects and floating combat text
- Web Audio SFX (shot, ding, thump)
- Vite + TypeScript dev environment
- Clean ES module structure

**Phase 1 implemented (progression loop):**
- Region/town data definitions (Texas Plains, 6 levels)
- Region Map screen with Gang's Grip bar + clickable towns
- Town/wilderness info screen with "Ride Out" button
- Turn budget + score target + win/lose conditions on the board
- Win condition override: cow capture (for cow levels)
- Move counter + score goal + deadeye meter in HUD
- Post-level Results screen (score, turns, grip reduction)
- Full state machine: Menu → Map → TownSelect → Playing → Results → Map

**Phase 2 implemented (shootout + deadeye):**
- Deadeye persistence across levels
- Deadeye activation prompt when full
- Silhouette target entity with state machine (hidden→rising→visible→falling→hit/missed)
- Building facade background with window/door cover positions
- Hostile vs. friendly discrimination
- Wave-based shootout minigame (2-3 waves per town)
- Grip reduction from shootout performance
- Results screen shows shootout stats

**Phase 3 implemented (boss patterns + cow/lasso/hearts):**
- Cow/Lasso mechanic: cows move with gravity, lassos collected via adjacency
- Cows are swappable, captured at bottom row when lassos > 0
- Cow levels win by capturing ≥ 1 cow
- Lasso pulse glow for visibility
- Heart adjacency pop for boss damage
- Hearts auto-respawn via queue during gravity
- No cow-clearing prerequisite for hearts
- 4 boss pattern types (Fan Fire, Dynamite Toss, Quick Draw, Reload Window)
- Pattern telegraph → active → resolve phases
- BoardPhase ↔ PatternPhase boss loop (3 moves per pattern)
- Boss health bar + name overlay
- HUD shows hearts and cows during boss fights
- Darkened boss overlays (BoardPhase: `rgba(0,0,0,0.2)`, PatternPhase: `rgba(0,0,0,0.55)`)
- Enlarged pattern hit targets (~1.5×), thickened telegraph lines (6px)
- Health decay removed from regular levels, kept in boss fights
- B key at RegionMap/TownSelect → start boss fight
- `VITE_BOSS_TEST` environment variable → auto-start boss fight
- Lasso visual: dark brown stroke (`#5c3a21`), golden highlight (`#8b6914`), semi-opaque fill
- Lasso starting placement at center top for cow levels
- Playwright smoke tests (4 tests pass on Firefox)

**Phase 4 implemented (boss puzzle mode + Deadeye drain + QTE unification):**
- Deadeye replaces health decay as primary boss tension mechanic
- Deadeye drains at 1.5/s during BoardPhase, fills via matches
- Deadeye hitting 0 → 1 damage + reset to 50%
- Deadeye maxing → puzzle trigger for puzzle-capable bosses
- Viewport shift animation (board slides down during puzzle)
- BossPuzzle interface (start/update/draw/handleClick/done/result) with `turnPenalty` and `lassosUsed` fields
- Bill the Rustler puzzle: 3 dynamic locations (cows from 10-name pool + 3 buildings + grass)
- 4 actions in 2×2 grid: Dynamite, Revolver, Lasso (spends board resource), Hold (safe skip)
- Cow pool model: 10 names consumed individually; grass joins when pool exhausted
- Dynamite direct hit = 10 boss damage; other hits = 1-2 damage; misses = 1 turn penalty
- Telegraph shortened to 1.5s (was 3.0s)
- QTE damage unified: all 4 patterns deal 1 HP on hit, turn penalty on miss
- `PatternManager.consumeResult()` added for proper damage/turn-penalty extraction
- Dynamite Toss slowed: arc 3.0s (was 1.0s), telegraph 1.0s, timeout 3.5s
- Resource injection on BoardPhase: `ensureBoardResources()` spawns cows/lassos if below thresholds
- Lasso + Hold puzzle actions with resource consumption via `onLassosUsed` callback
- Vite config updated: `host: true`, `allowedHosts` for Tailscale remote access

**Not yet implemented (Phase 5+):**
- Boss defeat → region transition → next region unlock
- Weapons / loadouts / loot
- Wilderness hazards
- Gang reconquest
- Tutorial gating for mechanics
- Regions 2–5 content
- Map UI polish (circled numbers, town markers)
- Ammo drops / ammo farming system
