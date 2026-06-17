# Design Decisions Log

*This is the anti-rework document. Every major mechanic decision is recorded here with its context, alternatives considered, chosen approach, and reasoning. When you come back after a break and think "should I change this?", read this first.*

*Format: Each entry has **Context** (what prompted the decision), **Alternatives** (what else was considered), **Decision** (what we did), and **Why** (the reasoning to prevent re-litigation).*

---

## §1. Cow & Lasso Mechanic

### §1.1 — Lassos collected via adjacency (not bottom row)

**Context:** Originally, lassos were placed at the top of the board and fell with gravity to the bottom row, where they were collected (like a "catch" mechanic). Players had to sink lassos to the bottom.

**Alternatives considered:**
1. **Bottom-row collection** (original): Lasso falls to bottom, player matches near it to collect. Problem: undiscoverable. Player doesn't know they need to sink it, and lassos often get stuck behind other pieces.
2. **Click-to-collect**: Player clicks lasso to pick it up. Problem: trivializes the mechanic — no skill expression.
3. **Adjacency collection** (chosen): When a match occurs next to a lasso, the lasso is automatically collected.

**Decision:** Lasso is collected when a match occurs in an adjacent cell (cardinal directions only).

**Why:** The adjacency pattern mimics how cows generate lassos (match near cow → lasso spawns). It's a single consistent rule: *match near a special piece → something happens.* This teaches the player organically: they make a match, see a lasso nearby disappear, see their lasso counter increment. The cause-and-effect is immediate and visible. Also prevents the "stuck lasso" problem — a lasso anywhere on the board is potentially collectible, not just at the bottom.

### §1.2 — Cows are swappable (not blocked like lassos)

**Context:** Lassos are blocked from selection (player cannot click a lasso; clicking it does nothing). Original design planned to block cows too.

**Alternatives considered:**
1. **Block cows like lassos**: Player cannot click or swap cows; cows can only be moved by gravity when pieces below them are matched away.
2. **Cows are swappable** (chosen): Player can click a cow (it selects with the golden glow ring), then click an adjacent piece to swap.

**Decision:** Cows can be selected and swapped with adjacent pieces. Lassos remain unselectable.

**Why:** Blocking cows made them frustrating — they'd get stuck in columns with no way to move them toward the bottom. Making them swappable gives the player agency: they can deliberately maneuver a cow to a column where it can fall, or past obstacles. This creates interesting decisions ("do I waste a move swapping this cow, or match for score?"). Lassos remain unselectable because there's no reason to move a lasso — they're collected in-place by adjacency and don't need to reach any particular position.

### §1.3 — Cows auto-captured at bottom (not click-to-capture)

**Context:** Original design required the player to click a cow on the bottom row to capture it (like confirming a catch).

**Alternatives considered:**
1. **Click-to-capture**: Cow on bottom row, player clicks it → capture animation. Problem: adds an extra click with no skill expression. Also fragile — if the board cascades and the cow briefly lands on bottom then gets covered, player might miss the window.
2. **Auto-capture** (chosen): When gravity settles, any cow on the bottom row is automatically checked against `onCowCapture`. If lassos > 0, cow is removed, lasso decremented.
3. **Auto-capture with grace period**: Cow sits on bottom row for 1 second before auto-capture. Too complex for too little gain.

**Decision:** Cows are auto-captured the moment they arrive on the bottom row and a cascade settles, provided `lassos > 0`.

**Why:** Removes a pointless click. The interesting decision is *getting the cow to the bottom*, not *confirming the capture*. The "needs lasso" pulse glow communicates the state clearly. Auto-capture also prevents the scenario where cascading prevents the player from clicking.

### §1.4 — Lasso spawns via cow adjacency (one cow = one lasso queued)

**Context:** When a match occurs near a cow, a lasso spawn is queued in that cow's column.

**Alternatives considered:**
1. **Lasso always on board**: A lasso is always present somewhere. Problem: lassos could pile up or get lost.
2. **Match near cow = instant lasso**: Lasso appears immediately on the matched cell. Problem: lassos on matched cells would be removed with the match.
3. **Match near cow = queue lasso in that column** (chosen): A column index is pushed to `lassoQueue`. During the next gravity pass, that column spawns a lasso at the top (before regular pieces).

**Decision:** Cow adjacency queues a lasso spawn in the cow's column. Only one lasso per column per gravity pass (the `spawnedLassoThisCol` guard prevents duplicates).

**Why:** Gravity-queue spawning ensures the lasso enters the board naturally — it falls from the top like any other piece, making it clear that it's a board element. The player sees "I matched near a cow → a lasso appeared at the top → it's falling down" — a clear causal chain. Single lasso per column prevents the board from flooding with special pieces.

### §1.5 — Starting lasso placement (center top for cow levels)

**Context:** Cow levels and boss fights with cows need at least one lasso on the board at start, or the player is stuck (cows at bottom, no lassos to collect).

**Alternatives considered:**
1. **Give starting lassos**: Start with `lassos = 1` (no board lasso). Problem: doesn't teach the adjacency-collection mechanic.
2. **Place lasso on board** (chosen): `placeStartingLasso()` puts a lasso at `(col=3, row=0)` — center of top row.

**Decision:** A starting lasso is placed at `(3, 0)` when cows are present on a level. The cell's existing piece is replaced (with removal animation).

**Why:** Teaching adjacency requires a board element. The center-top position is the most visible spot — the player's eye naturally goes there. They'll make a match near it, see the lasso get collected, and understand the mechanic. Replacing an existing piece (rather than inserting into an empty cell) works cleanly with the existing board layout.

### §1.6 — Lasso visual redesign (dark brown stroke + golden highlight)

**Context:** Original lasso used the same color as board cells (`#c49a6c`), making it nearly invisible against the checkerboard.

**Alternatives considered:**
1. **Bright stroke only**: High-visibility outline without fill. Problem: doesn't read as "lasso object."
2. **Dark brown stroke + golden highlight + semi-opaque fill** (chosen): `#5c3a21` stroke (3.5px), `#8b6914` golden arc highlight (1.5px), `rgba(92, 58, 33, 0.35)` fill.
3. **Golden glow only**: Use the same pulse glow that bottom-row cows get. Problem: indistinguishable from the "needs lasso" indicator.

**Decision:** Dark brown stroke creates clear contrast against both light and dark board cells. Golden arc adds a premium feel. Semi-opaque fill gives visual weight without obscuring the cell pattern underneath.

**Why:** Lasso needs to be instantly scannable — the player needs to see "oh, there's a lasso next to my match" at a glance. The original color blended in completely, making the mechanic undiscoverable.

### §1.7 — Cow levels win by capturing ≥ 1 cow

**Context:** Original game had score-based win conditions for all levels. Cow levels (like Lonesome Ridge) need a special win path.

**Alternatives considered:**
1. **Score + cow capture**: Must hit score target AND capture a cow. Problem: doubles the difficulty for no clear reason.
2. **Cow capture only** (chosen): Win when `cowsCaptured >= 1`. Score still shown/accumulated but not required.
3. **Cow capture + moves remaining bonus**: Extra points for unused moves. Overengineered for a prototype.

**Decision:** `checkBoardWinCondition()` in Game.ts checks `cowsCaptured >= 1` for cow levels. If moves run out without capturing a cow, level is lost.

**Why:** Makes the level goal clear and simple: get a cow to the bottom with a lasso. The score becomes a secondary measure of efficiency. Losing is still possible if you waste moves and don't capture.

---

## §2. Health System

### §2.1 — Health decay removed from regular levels

**Context:** Original GDD had continuous health decay (2 HP/s + 0.5/level) on all levels, including regular town/wilderness levels.

**Alternatives considered:**
1. **Keep health decay everywhere** (original): Creates urgency on every level. Problem: felt punishing for puzzle-solving. Players felt rushed and made sloppy moves.
2. **Remove decay entirely**: No time pressure anywhere. Problem: removes tension from boss fights.
3. **Decay only in boss fights** (chosen): Regular levels have no health decay. Boss fights retain decay at original rate.

**Decision:** Health decay completely removed from `Playing` state (regular levels). Decay kept in `BossActive` state.

**Why:** The match-3 board phase is about planning and tactics. Time pressure forced rushed play and made the puzzle unfun. Removing decay lets the player think. Boss fights are the tension peaks — that's where time pressure belongs. This creates a clear rhythm: *relaxed puzzling → tense execution → relaxed puzzling*. The health bar still matters in boss fights (health = 0 = game over), and matches still restore health (8 HP per match), so health management remains relevant.

### §2.2 — Health decay kept in boss fights

**Context:** Considered removing health decay from boss fights too, making hearts the only pressure source.

**Alternatives considered:**
1. **Remove boss decay too**: Only hearts and pattern damage matter. Problem: reduces boss tension. Player can stall indefinitely on the board phase.
2. **Keep boss decay** (chosen): 2 HP/s base continuous drain during boss fight.

**Decision:** Boss fights retain `this.health -= CONFIG.game.healthDecayBase * dt`.

**Why:** Boss fights need a "soft timer" to prevent the player from making infinite board moves. Without decay, the player could slowly farm hearts for infinite damage. The decay creates urgency: "I need to damage the boss before my health runs out." 2 HP/s means ~50 seconds of board time before game over at full health, but each match restores 8 HP (4 seconds of decay), so active players can sustain.

---

## §3. Heart Mechanic

### §3.1 — Hearts pop via adjacency (no cow-clear prerequisite)

**Context:** Original design had `canDamageHearts` — a flag that was set to `true` only when a certain number of cows were cleared. Players had to clear cows before hearts could deal damage.

**Alternatives considered:**
1. **Cow prerequisite** (original): Clear N cows → hearts become damageable. Problem: convoluted. On a level with cows and hearts (boss), player has to manage two separate subsystems before they can damage the boss. Felt like busywork.
2. **Adjacency pop** (chosen): Any match adjacent to a heart pops it and deals 1 boss damage. No prerequisite.
3. **Match 3 hearts**: Hearts are a regular piece type that can be matched 3-in-a-row. Problem: Hearts are sparse (5 on board), 3-in-a-row is unlikely without deliberate setup. Also makes hearts behave inconsistently — sometimes matched, sometimes adjacency-popped.

**Decision:** `canDamageHearts` guard completely removed. Hearts always pop when adjacent to a match. If 3 hearts happen to be matched as part of a row/column, they also trigger `onHeartMatched` via `the hadHearts` check in the Removing phase.

**Why:** Simpler, more intuitive, more fun. "Match near heart = damage boss" is a single clear rule. The player doesn't need to understand a multi-step prerequisite chain. It also creates interesting decisions: do I take a suboptimal match because it's next to a heart?

### §3.2 — Hearts auto-respawn (not finite)

**Context:** Original design had a fixed number of hearts on the board. When all were consumed, no more boss damage from the board phase.

**Alternatives considered:**
1. **Finite hearts** (original): Once all hearts are popped, board phase becomes stalling-only. Problem: soft-lock scenario where player can't damage boss enough and just waits for health decay to kill them.
2. **Infinite respawn** (chosen): Each popped heart queues a random column in `heartQueue`. During gravity, a new heart spawns at the top of that column.
3. **Heart regen on timer**: New heart spawns every N seconds. Problem: makes board phase passive (wait for hearts rather than make matches).

**Decision:** Hearts auto-respawn via `heartQueue` during gravity, on a random column. There is no finite supply.

**Why:** Prevents soft-lock. The player can always damage the boss if they make matches near hearts. The random column placement means hearts naturally redistribute across the board, preventing farming of a single column. The gravity-queue pattern (same as lasso queue) keeps the implementation clean and consistent.

---

## §4. Boss Patterns

### §4.1 — Pattern-based boss (not random target)

**Context:** Original `Boss.ts` had a single telegraph → vulnerable cycle: boss highlighted a random target cell, player clicked it for damage.

**Alternatives considered:**
1. **Random target** (original): Simple, but repetitive. No pattern recognition or skill development.
2. **Pattern pool** (chosen): 4 distinct pattern types, selected randomly (no immediate repeats), each with telegraph → active → resolve phases.
3. **Scripted sequence**: Fixed pattern order (e.g., Fan Fire → Dynamite → Quick Draw → Reload, repeat). Problem: predictable, less replayable.

**Decision:** `PatternManager` selects from a pool of `PatternState` implementations. Patterns cannot repeat consecutively. Pattern pool resets after all 4 have been used.

**Why:** Pattern variety creates skill development. The player learns to recognize each telegraph and respond differently. The no-repeat rule ensures variety. The pool reset prevents repetitive cycling of a subset. Each pattern has a unique skill test: Fan Fire tests sequential clicking, Dynamite tests timing, Quick Draw tests reaction speed, Reload tests clicking speed.

### §4.2 — Boss phase loop: BoardPhase ↔ PatternPhase (3 moves per pattern)

**Context:** Needed a structure for board phase → boss attack → board phase cycling.

**Alternatives considered:**
1. **Time-based**: Boss attacks every N seconds. Problem: player might be mid-cascade when boss attacks, causing confusion.
2. **Move-based** (chosen): Boss attacks every 3 board moves. `notifyBoardMove()` is called after each move; when `movesSincePattern >= movesPerPattern`, `PatternPhase` triggers.
3. **Heart-based**: Boss attacks after N hearts popped. Problem: makes hearts feel punishing (pop heart → trigger boss attack).

**Decision:** 3 board moves → PatternPhase. Board moves counted via `Board.movesUsed` change detection.

**Why:** Move-based gives the player clear control — they know "I have 3 moves before the boss attacks." It creates natural pacing: make 3 matches (opportunity to pop hearts), then survive the pattern, then repeat. 3 moves feels like enough for 1-2 heart pops but not enough to stall indefinitely.

### §4.3 — Pattern damage sources

**Context:** Needed to define how much damage each pattern deals.

**Alternatives considered:**
1. **Fixed damage per pattern**: Fan Fire = 3, Dynamite = 2, Quick Draw = 2, Reload = variable. This is effectively what we have.
2. **Damage scales with boss HP phase**: All patterns deal more damage in phase 2/3. Not implemented yet (FUTURE).
3. **Damage tied to weapon stats**: Weapon damage stat multiplies pattern damage. FUTURE when weapons are implemented.

**Decision:** Current values: Fan Fire = hits (max 3), Dynamite = 2 (hit/miss), Quick Draw = 2 (hit/miss), Reload = clicks × 0.5 (max 4). Heart adjacency = 1 per pop. Damage applied at end of PatternPhase.

**Why:** Varied damage values make each pattern feel distinct. Reload rewards fast clicking (skill investment). Fan Fire rewards precision (3 separate clicks). Dynamite and Quick Draw are binary hit/miss with higher payoff. The sum of patterns + hearts gives the player a sense of progress: they're always chipping away.

---

## §5. Boss Visual Clarity

### §5.1 — Darkened overlays for boss phases

**Context:** Original overlays were semi-transparent gold (`rgba(255, 215, 0, 0.08)`) for BoardPhase and red (`rgba(255, 50, 0, 0.12)`) for PatternPhase. These were nearly invisible, making it hard to tell which phase was active.

**Alternatives considered:**
1. **Original light overlays**: Too subtle. Players couldn't tell if they were in a boss fight or regular play.
2. **Dark overlays** (chosen): BoardPhase = `rgba(0, 0, 0, 0.2)`, PatternPhase = `rgba(0, 0, 0, 0.55)`.
3. **Full-screen color tint**: e.g., red tint for PatternPhase. Problem: distorts piece colors, makes matching harder.

**Decision:** Dark overlays with different opacities for each phase. BoardPhase gets light darkening (board still visible and playable). PatternPhase gets heavy darkening (board dims, pattern targets pop).

**Why:** The phase switch needs to be immediately perceptible. The heavy darkening during PatternPhase also solves a practical problem: pattern targets (clickable circles) are rendered on top of the darkened board, making them stand out strongly compared to the dimmed board underneath.

### §5.2 — Enlarged pattern hit targets

**Context:** Click targets on patterns (Fan Fire circles, Dynamite hit zone, Quick Draw crosshair) were too small for comfortable clicking, especially under time pressure.

**Alternatives considered:**
1. **Original sizes** (~30px radius): Felt precise but frustrating.
2. **Enlarged targets** (chosen): Fan Fire target radius 33px→45px pulse area (hit detection still 50px), Dynamite hit radius 40px→60px, Quick Draw crosshair 30px→50px.
3. **Dynamically sizing by performance**: Smaller if you're hitting consistently. Overengineered.

**Decision:** All pattern hit targets enlarged ~1.5× from original sizes. Hit detection radii uniformly set to 50px+.

**Why:** Bigger targets reduce frustration without reducing skill expression — the timing window is still tight. Fan Fire's 0.5s-per-lane window is the real challenge, not pixel-perfect clicking. Dynamite's mid-arc timing (25%-75% progress) is the challenge there. Enlarged targets = fair.

### §5.3 — Thickened telegraph lines

**Context:** Telegraph lines (Fan Fire red streaks) were 3px, hard to see against the background.

**Decision:** Thickened to 6px.

**Why:** Telegraphs communicate what pattern is coming. If they're hard to see, the player gets surprised by the pattern without warning. Thicker lines = clearer communication.

---

## §6. Developer Tooling

### §6.1 — B key shortcut for boss fight

**Context:** Testing boss fights required playing through menu → region map → clicking "Ride Out" → potentially playing through a level → then getting to boss. Too many steps.

**Alternatives considered:**
1. **Menu button**: Add a "FIGHT BOSS" button on the menu. Problem: UI work, clutters the menu.
2. **Keyboard shortcut, no UI change** (chosen): Press B at RegionMap or TownSelect → instantly starts boss fight.
3. **Console command**: Type "boss" in some debug panel. Too complex.

**Decision:** `Game.handleKeyDown('b')` checks if state is RegionMap or TownSelect, then calls `startBossFight()`.

**Why:** Zero UI overhead. The key is memorable (B = Boss). Won't trigger accidentally during gameplay (Playing and BossActive states are not checked). The `VITE_BOSS_TEST` env var provides automation (for Playwright tests and continuous development).

---

## §7. Lasso Drawing

### §7.1 — Dark brown stroke instead of board-matching color

**Context:** Lasso stroke was `#c49a6c`, the same color as light board cells. Invisible on checkerboard.

**Decision:** Changed to `#5c3a21` (dark brown) with 3.5px width. Added golden highlight arc (`#8b6914`, 1.5px) for visual interest. Fill changed to `rgba(92, 58, 33, 0.35)`.

**Why:** The lasso is a critical interactive element — the player needs to see it instantly. The original color was a design blind spot (matched the board exactly). The dark brown + golden accent makes it visually distinct from all standard piece types while maintaining the Western aesthetic.

---

## §8. Deadeye System (Boss Fights)

### §8.1 — Deadeye replaces health decay as primary boss tension

**Context:** Original boss fight had continuous health decay (2 HP/s). Player health drained constantly, creating urgency but feeling passive and unengaging.

**Alternatives considered:**
1. **Keep health decay** (original): Constant drain felt like a lazy timer. No interesting decisions — just "match faster."
2. **Deadeye drain** (chosen): Deadeye starts at 0, fills via matches, drains during BoardPhase. At 0 → damage. At max → special trigger.
3. **No timer at all**: Only hearts and patterns. Problem: boss fight has no soft fail state.

**Decision:** Deadeye replaces health decay entirely. Health bar hidden during boss fights (`showHealthBar: false`). Deadeye meter becomes the primary HUD element.

**Why:** Deadeye ties the tension mechanic to active play (matching) rather than passive waiting. Players feel rewarded for good matches (deadeye fills up) and punished for stalling (deadeye drains out). The drain rate (1.5/s) creates a ~30s window before a full deadeye bar empties, giving the player breathing room but not infinite time. The "hit 0 → 1 damage + reset to 50%" creates a rhythm: take damage, recover, build toward puzzle trigger.

### §8.2 — Deadeye max triggers puzzle mode (not generic bonus)

**Context:** Original Deadeye max triggered a shootout minigame (at level completion). For boss fights, we wanted something that felt more connected to the boss encounter itself.

**Alternatives considered:**
1. **Shootout-style minigame**: Random targets pop up. Problem: disconnected from the boss narrative.
2. **Pattern-style attack**: Generic damage burst. Problem: same as existing pattern phase.
3. **Boss-specific puzzle** (chosen): Each boss defines a unique interactive scene with multiple solutions.

**Decision:** When deadeye reaches 100 during boss BoardPhase and the boss has `hasPuzzle: true`, the boss transitions to PuzzleIntro → PuzzleActive → PuzzleResolve → PuzzleExit → BoardPhase.

**Why:** Boss-specific puzzles make each boss feel distinct. The puzzle isn't just "more match-3" — it's a narrative moment where the player's choice matters. This creates the "dopamine hit" the design brief asked for: a meaningful decision with visible consequences.

---

## §9. Puzzle Mode Architecture

### §9.1 — Choice-based puzzle (not grid-based mini-game)

**Context:** Two approaches were considered for puzzle mode interactions: (A) mini-grids with weapon pieces at each boss spawn location, where the player matches weapons to fire at that location; (B) a shifted viewport showing locations with clickable action buttons.

**Alternatives considered:**
1. **Mini-grid per location** (Option A): Multiple match-3 grids, each at a boss peek location. Matching weapon pieces fires that weapon. Problem: multiple grids = massive UI complexity, match detection across grids, cognitive overload during a boss fight.
2. **Shifted viewport + choice buttons** (Option B, chosen): Viewport slides down to show "over the cover" view. 3 locations visible. Player clicks an action button. Resolution plays out with narrative text.
3. **Hybrid**: Shift viewport to one location at a time, show a weapon grid, player matches weapon → fire → shift to next location. Problem: multi-step interaction breaks flow.

**Decision:** Option B: single-choice puzzle with telegraph → choice → resolve cycle. Viewport shifts to show a static scene. Player reads the telegraph, picks an action, sees the outcome.

**Why:** Option B is implementable in a single file (~250 lines) with no new grid mechanics. It preserves the "meaningful choice" goal without the scope of building a second match-3 system. The 3-phase cycle (telegraph → choice → resolve) creates clear gameplay beats. Future bosses can define different scene layouts, location counts, and action sets while using the same puzzle interface.

### §9.2 — Viewport shift (not screen transition)

**Context:** The puzzle mode could either: (a) fade to a new screen, (b) shift the viewport within the existing canvas, or (c) overlay on top of the frozen board.

**Alternatives considered:**
1. **Full screen transition**: Black out, show puzzle on new screen, fade back. Problem: disorienting, breaks the "you're in a boss fight" feeling.
2. **Overlay on frozen board** (partial): Puzzle draws over the dimmed board. Problem: board still visible but inactive — player might try to click it.
3. **Viewport shift** (chosen): Board slides down via `ctx.translate(0, boss.viewShift)`. The puzzle scene occupies the vacated upper portion. Board becomes visually inaccessible but still rendered.

**Decision:** Board is translated downward by 200px during puzzle states. Puzzle overlay renders on the full canvas on top. Clicks are intercepted by boss.handleClick() → puzzle.handleClick() during puzzle states.

**Why:** The viewport shift tells a visual story: "you're looking over the cover now." It's a smooth animation (lerp-based), not a hard cut. The board staying visible (just shifted) maintains spatial awareness — the player knows they'll return to the same board state.

### §9.3 — Puzzle result applied immediately (not queued)

**Context:** Puzzle results (boss damage, player damage, score) could be applied at puzzle end or at some later resolution point.

**Decision:** Results are applied during `PuzzleResolve` state via `Boss.drawOverlay()` callback. `onPuzzleDamagePlayer` and `onPuzzleScoreBonus` callbacks in Game.ts apply the consequences immediately.

**Why:** Immediate feedback for the puzzle outcome. The player sees the boss health bar decrease or their own health decrease right after the narrative text. The 1.0s resolve duration gives the player time to read the result before returning to BoardPhase.

---

## §10. Bill the Rustler Puzzle Design

### §10.1 — Multiple valid solutions with tradeoffs

**Context:** Bill the Rustler's puzzle needed to feel like a meaningful choice, not a multiple-choice quiz.

**Alternatives considered:**
1. **Single correct answer**: One best solution per telegraph. Problem: no replayability, feels like a test.
2. **All solutions valid but different** (chosen): Every choice combination produces a valid outcome. The "best" outcome (Wait → catch dynamite) requires reading the telegraph and choosing the hardest option.
3. **Random outcome regardless of choice**: Adds chaos but removes player agency.

**Decision:** 3 locations × 3 actions = 9 possible outcomes. Each outcome pair has unique damage, score, and narrative text. Player agency is preserved: a skilled player who reads the telegraph and chooses "Wait" gets the best result. A player who picks recklessly still gets a result — just worse.

**Why:** Multiple valid solutions prevent frustration (no "wrong answer" soft-lock) while rewarding skill. The narrative text gives each outcome character — the town's reaction changes based on your choices. This sets up the future "narrative consequence" system.

### §10.2 — Cow/shed locations aligned with Western theme

**Context:** Bill's cover spots needed to feel authentic to the "cattle rustler" character.

**Decision:** Three locations: Bessie (cow), Clover (cow), Old Barn (shed). Bill telegraphs from one. Actions: Revolver (shoot the spot), Dynamite (explosive), Wait (catch his dynamite).

**Why:** The cow locations tie into the existing cow mechanic on the board — the boss fight board has 3 cows, and the puzzle shows 2 of them. This creates visual continuity. The barn adds environmental storytelling (this is a ranch). The "Wait" option teaches the player that patience can be a weapon — they catch Bill's own dynamite and turn it against him.
