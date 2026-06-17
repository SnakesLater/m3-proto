# Iteration Notes — Future Feature Candidates

*Ideas to revisit once the Phase 0 foundation is solid. Not committed to any of these — they're design probes to discuss when we're ready to add depth.*

---

## A. Atmosphere & Polish

### A1. Heat Shimmer Distortion

A subtle sine-wave distortion effect over the board when the Deadeye meter is high. Creates tension. Implementation: temporarily warp canvas draw on affected region using `ctx.drawImage()` with a displaced source.

**When:** Phase 7 polish window. Low effort, medium impact.

### A2. Tumbleweeds

Tumbleweeds drifting across the bottom of the screen between moves. Purely cosmetic. They bounce off the gun and slowly rotate.

**When:** Phase 7. Very low effort.

### A3. Vulture Idle Animation

If the player is idle for 3+ seconds, a vulture silhouette circles overhead. Suggests the player is "dead meat" if they don't act. Subtle pressure.

**When:** Phase 7. Low effort, medium psychological impact.

### A4. Gun Cylinder Combo Display

The revolver cylinder shows actual chambers (6). As combo builds, chambers light up with bullet glints. At 6 (max combo), all chambers glow and the gun steams lightly. Replaces the plain numeric combo display with a diegetic one.

**When:** Phase 7. Medium effort (needs art).

### A5. Canteen Health Bar

Replace the generic health bar with a diegetic canteen. When full, water sloshes visibly. When low, it's a dry metal rattle. Refill animation shows water pouring in from a canteen being uncorked (triggered by matches).

**When:** Phase 7. Medium effort.

### A6. Ambient Audio

- Low wind loop with occasional coyote howls
- Gunshots echo in the distance during shootouts
- Town ambient: creaking wood, distant piano
- Boss fight: tense strings, drum heartbeat

**When:** Phase 7. Low-medium effort (finding/buying sounds).

---

## B. Board Depth

### B1. Special Pieces

Add pieces that behave differently when matched:

| Piece | Behavior |
|-------|----------|
| Dynamite | Matched with 2 others → explodes in a cross pattern (clears row + column) |
| Sheriff Star | Wildcard — matches with any type |
| Handcuffs | Locks adjacent pieces for 1 turn (prevents matching them) |
| Whiskey Bottle | When matched, heals 15 HP instead of score |

**Risk:** Adds complexity. Best introduced as region-specific mechanics (e.g., Dynamite in Region 4 — Mountains).

**When:** Post-core, after Wilderness tutorial gating is in place.

### B2. Row/Column Clear

A match-4 or match-5 could clear an entire row or column in addition to the matched pieces. Common in match-3 games. Easy to implement but may speed up the game too much.

**Alternative:** Make row/column clear a weapon ability instead of a standard mechanic. The "Dynamite" weapon could trigger it once per level.

### B3. Obstacle Tiles

Some cells have obstacles (cactus, crate, barrel) that must be cleared by matching adjacent to them. Obstacles are not pieces — they sit on the board and block movement.

**When:** Could be a region-specific mechanic (e.g., region with abandoned mine carts).

---

## C. Shootout Depth (Phase 1+)

### C1. Silhouette Variety

Beyond "hostile vs. friendly," add:
- **Boss henchman**: Two-hit kill (requires fast double-tap)
- **Shielded enemy**: Hitbox partially covered — need to click exposed area
- **Running target**: Moves across the screen — predictive aim required

### C2. Shootout Wave System

Instead of one round, have escalating waves:
- Wave 1: 3 hostiles, 0 friendlies (warmup)
- Wave 2: 4 hostiles, 1 friendly (introduce discrimination)
- Wave 3: 5 hostiles, 2 friendlies (pressure)
- Boss wave (when applicable): henchman + 2 hostiles

More waves = more grip reduction + better loot.

### C3. Dual-Wielding

If the player has two weapons equipped, shootout alternates between them. Each weapon has its own Accuracy stat. A high-accuracy primary and a low-accuracy backup create interesting risk/reward during shootouts.

---

## D. Boss Fight Depth (Phase 3+)

### D1. Boss Variety Patterns

Ideas for boss attack patterns beyond the four in the GDD:

- **Ricochet Shot**: Boss fires at a wall, bullet bounces — player must click the bounce point to redirect it back at the boss
- **Standoff (reaction test)**: Crosshair drifts, "DRAW" flashes, player clicks within a narrowing window — miss = take damage
- **Barrage**: Rapid series of 5-7 quick clicks (machine pistol) — tests stamina
- **Taunt phase**: Boss pauses to gloat — free damage window but also a trap (sometimes he fakes it)

### D2. Boss Phase Transitions

At 50% HP, boss enters phase 2 with new patterns. At 25%, phase 3 (desperation). Each phase is faster and adds new attack types. Creates a sense of escalation.

### D3. Unique Boss Weapons

Each boss drops a unique weapon with a special ability not available elsewhere:

- **Bill's Peacemaker**: "Fan Fire" ability (shoot 2 silhouettes at once)
- **La Viuda's Derringer**: "Double Tap" (+1 capacity, -1 damage per shot)
- **Cochise's War Club**: "Stagger" (boss telegraphs are 15% longer)

---

## E. Region Map Depth (Phase 2+)

### E1. Dynamic Events

Random events on the region map:

| Event | Effect |
|-------|--------|
| Stagecoach Robbery | Optional shootout for bonus loot (risks friendly fire) |
| Wounded Traveler | Heal 20 HP if you have a bandage (consumable) |
| Snake Oil Salesman | Buy a random upgrade for gold |
| Gang Raid | Gang's Grip increases by 10 — urgency to act |

### E2. Town Investment

After liberating a town, player can invest gold to build it up:
- Saloon: +health regen in the region
- Gunsmith: weapon upgrades cost less
- Sheriff's Office: reduced grip recovery from reconquest
- Telegraph: alerts you when other regions are reconquered

### E3. Parallel Regions

After clearing Region 2, allow the player to choose direction:
- North (harder enemies, better loot)
- West (standard progression)
- South (easier, less loot — catch-up mechanic)

This creates replay value without procedural generation.

---

## F. Economy & Progression

### F1. Currencies

Consider a second currency beyond gold:

| Currency | Earned From | Spent On |
|----------|-------------|----------|
| Gold | Matches, loot drops | Weapon purchases, town investment |
| Bullets | Shootout performance | Boss fight retries, special abilities |

Bullets as a "resource you spend to retry bosses" creates tension — you can grind shootouts for bullets, or push through blind.

### F2. Prestige / New Game+

After clearing all 5 regions, offer New Game+:
- Enemies are harder (tighter timings, more grip)
- Loot quality is permanently +1 tier
- Collect "Legend of the West" badges for achievements

### F3. "One More Town" Loop

The game should feel like "just one more town" is always the right choice. This means:
- Short level length (2-3 minutes per town)
- Immediate feedback after each town (loot/reward screen)
- Clear next-step visibility on the region map

---

## G. Accessibility & Tuning

### G1. Difficulty Sliders

Let players tune:
- Shootout timing windows (±200ms increments)
- Board move budget (±2 increment)
- Health drain rate (multiplier: 0.5x, 1x, 1.5x, 2x)

These don't disable achievements — the game is single-player, let people play how they want.

### G2. Colorblind Mode

Piece types currently use both color AND shape to differentiate. Verify shape differentiation is sufficient for common colorblind types. Add a pattern overlay option (stripes, dots, crosshatch) as a toggle.

### G3. Click v. Tap

Since this is desktop-first, click is the primary input. But make sure touch screens work — the coordinate transform in main.ts already handles CSS-pixel-to-canvas mapping. Consider adding touch events with a 300ms debounce to prevent accidental double-taps.

---

## H. Tech Debt & Refactoring

### H1. Entity Component System

If Piece types explode in complexity (special pieces, hazards, obstacles), consider migrating from class hierarchy to an ECS pattern. Each Piece has a set of components (RenderComponent, MatchComponent, HazardComponent, etc.).

**When:** Only if special pieces make Piece.ts >500 lines. Premature otherwise.

### H2. Audio Pool

The current Audio creates new oscillators per sound. This is fine for low volume but will crackle under heavy use (e.g., machine-gun boss pattern). Future: use a pre-allocated oscillator pool with gain envelopes.

### H3. State Machine Library

If Game.ts's state machine grows beyond 5 states (menu, playing, shootout, boss, region_map, gameover), consider a lightweight state machine library or a more formal pattern. For now, the `switch` statement is fine.

---

## I. Untested Premises (Need Playtesting)

- **Loadout lock via wilderness:** Is 2 wilderness levels per town the right number? Playtest with 1 vs. 3.
- **Turn budget:** Is 15 base turns + weapon modifier fair? Too tight? Too loose?
- **Shootout timing:** 800ms base window. 600ms for reconquest. Verify these feel right.
- **Health decay:** 2 HP/s + 0.5/level. Does this create enough pressure? Too much?
- **Combo scaling:** Max 10. 100 base score per match. Does this incentivize chaining?

These numbers will all live in `config.ts` and be easy to tune once we have player feedback.

---

## J. Stretch Goals (Very Post-Core)

- **Co-op mode:** Second player shoots silhouettes, first player matches. Split-screen.
- **Daily Run:** Seed-generated region with fixed loadout. Leaderboard by score.
- **Card table:** A poker-themed bonus minigame playable between towns. Rewards gold.
- **Horse:** The player's horse appears in background art. Horse upgrades affect board speed/animation.
- **Dynamic soundtrack:** Audio layers that build with combo meter, drop during shootouts, and intensify during boss fights.
