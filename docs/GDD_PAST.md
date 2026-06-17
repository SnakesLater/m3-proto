# DESERT GUNNER: Matched by Bullets

## Game Design Document

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

**Current Phase:** Phase 0 — Foundation (match-3 core, background, HUD, gun, menu)

---

# 2. Core Match-3 Mechanics

## 2.1 Board

| Property | Value | Notes |
|----------|-------|-------|
| Dimensions | 7 columns × 6 rows | Standard for match-3, fits portrait-ish gameplay |
| Cell size | 64px | At 960×600 canvas, leaves room for HUD and gun |
| Grid offset Y | 120px | Space for sky + scorebar above |

## 2.2 Piece Types

| Type | Color | Visual |
|------|-------|--------|
| Outlaw | Red (#ff3333) | Circle with star badge |
| Bandit | Dark (#1a1a1a) | Rounded rect with glowing eyes |
| Snake | Green (#33cc33) | Bezier curve body with segmented dots |
| Coyote | Gray (#cccccc) | Pentagon with ears |
| Vulture | Orange (#cc6600) | Wing-shaped bird silhouette |

**Design note:** Piece draw functions are registered in a strategy map (`PIECE_TYPES`), not an if/else chain. Adding a new type means adding one entry and one draw function — no other code changes.

## 2.3 Match Detection

- Simultaneous horizontal + vertical pass
- Finds all runs of length 3+ with the same type
- Non-removing pieces only
- Supports overlapping matches (e.g., an L-shape or T-shape clears all pieces in both runs)

## 2.4 Gravity

- Per-column compact: non-removed pieces sink to fill gaps
- New pieces spawn at the top with a small entrance animation
- `wouldMatch()` is called during spawn to prevent trivially created matches at insertion time (the cascading check is the real safety net)

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
               │  Cascading         │       with isSwapBack=true)
               │  (gravity settle)  │
               └────────┬───────────┘
                        │ all settled
                        ▼
               ┌────────────────────┐
               │  More matches?     │──YES→ Removing (chain reaction)
               └────────┬───────────┘
                        │ NO
                        ▼
                   back to Idle
```

---

# 3. Three-Phase Loop

## 3.1 Board Phase

- Match 3+ pieces to remove them and score points
- Each match fires the gun (audio + visual feedback)
- Bigger matches (4 = "LINE CLEAR", 5+ = "AREA CLEAR") produce bigger effects, more score, and different sounds
- Combo meter builds with consecutive matches (max 10)
- Health (canteen) drains slowly over time and is refilled by matches
- Move budget (added in Phase 1+) limits total moves per level

**Scoring (current):**

| Match Size | Base Score | Audio | Visual |
|------------|-----------|-------|--------|
| 3 | 100 × combo | Shot (short, percussive) | Small spark burst, "BANG!" text |
| 4 | 300 × combo | Ding (musical ping) | Medium burst, "LINE CLEAR!" |
| 5+ | 500 × combo | Thump (bass hit) | Large burst, "AREA CLEAR!" |

## 3.2 Shootout Phase (Phase 1+)

When Deadeye meter is full (after sufficient matches), the player can activate a shootout.

**How it works:**
1. Board slides down / fades out
2. Town street background appears (doors, windows, barrels)
3. Silhouettes pop up in cover positions over ~3 seconds
4. Player clicks to shoot

**Target discrimination:**
- Hostile silhouettes (armed) → shoot these
- Friendly silhouettes (townsfolk) → DO NOT shoot (penalty)
- Each has a hit window (e.g., 800ms base) before ducking back

**Performance Tiers:**

| Tier | Criteria | Grip Reduction | Loot |
|------|----------|---------------|------|
| Perfect | All hostiles, 0 friendlies | Max | Rare weapon/upgrade |
| Good | Most hostiles, few misses | Medium | Common item |
| Poor | Many misses or hit friendlies | Minimal | Cash only |

**Friendly-fire penalty:** Shooting a friendly increases the Gang's Grip on the town (the gang uses the incident to turn townsfolk against you). This can push the boss out of reach for the current run, but the player can still get loot.

**Divine Miss ability:** Some weapons provide a "Divine Miss" — a one-time nullification of a friendly-fire shot. This lets risk-tolerant players shoot aggressively and recover from one mistake.

## 3.3 Boss Phase (Phase 3+)

When Gang's Grip reaches 0, the gang leader is forced out of hiding.

**Boss encounter design:**
- Pattern-based: boss telegraphs an attack → player reacts → damage is dealt
- Simplified rhythm/dance-battle structure
- Weapon Damage stat affects damage per successful action
- Weapon Capacity determines actions before a forced reload pause
- Weapon Speed makes timing windows more lenient

**Example patterns (Cattle Rustler Bill — Region 1 boss):**
1. **Fan Fire**: Boss shoots 3 bullets left-to-right — click each bullet to deflect
2. **Dynamite Toss**: Boss throws dynamite — click it midair to blow it up (timed)
3. **Quick Draw Standoff**: Crosshair drifts — click at the right moment (needle/gauge)
4. **Reload Window**: Boss pauses to reload — free damage window (rapid click)

**Win:** Region cleared, move West, legendary loot drop.
**Lose:** Gang's Grip resets to 30%, retry with penalty. The gang is wary now — shootouts will be slightly harder.

---

# 4. Regions & Progression

## 4.1 Region Map

```
Region 1: Texas Plains
  Gang: The Rustlers
  Boss: Cattle Rustler Bill
  Theme: Golden grasslands, wooden buildings
  Grip: 100

Region 2: New Mexico Desert
  Gang: Los Comancheros
  Boss: La Viuda Negra
  Theme: Red rocks, adobe, agave
  Grip: 120

Region 3: Arizona Badlands
  Gang: Apache Raiders
  Boss: War Chief Cochise
  Theme: Canyons, mesas, petrified wood
  Grip: 140

Region 4: Colorado Mountains
  Gang: The Silver Syndicate
  Boss: Baron Von Colt
  Theme: Pine forests, granite, mining towns
  Grip: 160

Region 5: California Coast
  Gang: The Golden Dawn
  Boss: El Dorado
  Theme: Redwoods, fog, ocean cliffs
  Grip: 200
```

Each region has 3-5 towns (levels). Each town cleared reduces Gang's Grip.

## 4.2 Gang's Grip

- Per-region value (0-100+)
- Decreases when towns are cleared and shootouts are won
- Increases when friendlies are shot in shootouts
- When Grip reaches 0, the boss is drawn out
- Regions can be "reconquered" after the player advances (see Section 7)
- Reconquest starts with higher grip, scaling with player power

## 4.3 Level Flow

```
Region Map
  │
  ├─ Click Town
  │   └─ Loadout Screen (choose primary + secondary weapon)
  │       └─ [CONFIRM] → Wilderness 1 → Wilderness 2 → Town Battle
  │           └─ Grip reduced? → Map (or Boss if grip ≤ 0)
  │               └─ Boss Phase → Win/Lose
  │
  └─ (repeat for each town in region)
```

---

# 5. Loadout & Weapons (Phase 4+)

## 5.1 Weapon Tradeoff Triangle

```
               HIGH DAMAGE
              /            \
             /  fewer turns  \
            ▼                 ▼
       BOSS RUN ←──────────→ LOOT RUN
            ▲                 ▲
             \  more turns  /
              \            /
               HIGH TURNS
```

| Stat | Phase | What it does |
|------|-------|-------------|
| **Damage** | Boss | Damage per successful boss action |
| **Accuracy** | Shootout | Makes silhouette hitboxes bigger |
| **Capacity** | Boss | Actions before forced reload pause |
| **Turns** | Board | Modifies level move budget |

**Turn budget formula:**
```
baseTurns = 15 + (townDifficulty × 2)
effectiveTurns = baseTurns + weapon.turnsBonus
```

Example weapon turn modifiers:
- High-damage weapon: `turnsBonus = -4` (risky — 11 moves for a boss region)
- Balanced weapon: `turnsBonus = 0` (standard — 15 moves)
- Survival weapon: `turnsBonus = +5` (safe — 20 moves)
- Loot-farm weapon: `turnsBonus = +10, damage = 0` (max turns, boss impossible)

## 5.2 Player Strategy

**Boss run:** Equip max damage weapon. Accept fewer turns. Solve fast. Beat boss. Progress.

**Loot run:** Equip more turns weapon. Solve comfortably. Collect loot drops. Build stats for the next boss attempt.

**The tension:** A player who keeps dying to the boss can swap to a loot build, farm towns for better gear, then attempt the boss again with superior stats. A confident player can rush with a damage build and skip the farming loop.

## 5.3 Weapon Abilities

| Ability | Slot | Effect |
|---------|------|--------|
| Divine Miss | Special | Once/run: nullify a friendly-fire shot |
| Quick Draw | Passive | +15% shootout time window |
| Fan Fire | Active | Shoot 2 adjacent silhouettes at once |
| Dynamite | Passive | Matches of 4+ count as +1 for combos |
| Lucky Draw | Active | Once/level: board highlights a guaranteed match |
| Steady Hand | Passive | Boss telegraph windows +20% larger |
| Bandolier | Passive | +2 Capacity (more actions before boss reload) |

## 5.4 Loot Drops

| Source | Rarity | Example |
|--------|--------|---------|
| Normal match (3) | — | Small gold |
| Big match (4) | Common | "Chipped Grip" (+1 accuracy) |
| Area clear (5+) | Uncommon | "Winchester 94" (new weapon) |
| Shootout: Good | Common | Ammo/health drop |
| Shootout: Perfect | Rare | "Ivory-handled Revolver" |
| Boss clear | Legendary | Region-unique weapon |

```typescript
interface Weapon {
  id: string;
  name: string;
  slot: 'primary' | 'secondary';
  stats: {
    damage: number;
    speed: number;
    accuracy: number;
    capacity: number;
    turnsBonus: number;
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  ability?: WeaponAbility;
}
```

---

# 6. Wilderness Levels (Phase 5+)

## 6.1 Purpose

Wilderness levels are mandatory travel segments between towns. They lock the player into their loadout until the next town, creating commitment and consequence.

## 6.2 Differences from Town Levels

| | Town Level | Wilderness Level |
|---|---|---|
| Budget | Standard | Tighter (fewer moves) |
| Grip impact | Reduces gang grip | No grip impact |
| Loot | Full loot table | Small loot (consumables only) |
| Hazard | — | Random hazard per wilderness |
| Shootout | Yes | No |
| Boss trigger | Yes (at grip=0) | No |

## 6.3 Hazards

| Hazard | Effect |
|--------|--------|
| Sandstorm | 2-3 random pieces hidden (blank tiles) per turn |
| Snake Bite | Lose 10 health on match start |
| Heat Wave | Move budget reduced by 3 |
| Dust Devil | Board shuffles after each match |

## 6.4 Tutorial Gating

Each new mechanic is introduced in a 3-step ramp:

```
Wilderness 1           Wilderness 2           Town
(teach)                (practice)            (exam)
↓                       ↓                     ↓
Sandstorm: 1 hidden    Sandstorm: 2 hidden   Sandstorm: 3 hidden
tile, infinite budget  tiles, -2 budget      tiles, standard budget
No shootout            1-2 friendlies        3+ friendlies
                        in next shootout      tighter timer
```

| Region | New Mechanic | Wilderness 1 | Wilderness 2 | Town |
|--------|-------------|--------------|--------------|------|
| 1 - Plains | Sandstorm (hidden tiles) | 1 hidden, infinite budget | 2 hidden, -2 budget | 3 hidden, standard |
| 2 - Desert | Heat Wave (budget shrink) | Warning shown, no shrink | -1 budget | -3 budget |
| 3 - Badlands | Poison (tiles lock after match) | 1 lock, no shootout | 2 locks, easy shootout | 3 locks, full |
| 4 - Mountains | Dynamite (chain explosion on match-4) | Match-4 highlighted | Find match-4 naturally | Match-4 spreads damage |
| 5 - Canyon | Flash Flood (board shift) | Shift indicated, slow | Shift + budget penalty | Full shift, tight |

---

# 7. Gang Reconquest System (Phase 6+)

When a player clears a region and advances, gangs can resurge in previously cleared territories.

## 7.1 Trigger

```typescript
if (townsCompletedInNextRegion >= 3) {
  const chance = 0.3 + (region.difficulty * 0.1);
  if (Math.random() < chance) {
    triggerReconquest(region);
  }
}
```

## 7.2 Effects

| Aspect | First Encounter | Reconquest |
|--------|----------------|------------|
| Starting grip | 100 | 40 + (playerAvgWeaponLevel × 5) |
| Shootout timing | 800ms window | 600ms window |
| Friendly frequency | 1 in 5 | 1 in 3 |
| Loot quality | Normal | +1 tier (incentive to return) |
| Player gear | Starter | What they had when leaving |

## 7.3 Design Intent

Reconquest creates **optional replay value** and a reason to return to earlier regions. Returning is harder but drops better loot, creating a positive feedback loop that feeds back into the main DPS race against later bosses.

---

# 8. Design Variants & Open Questions

## 8.1 Eliminated Variants

**Direct weapon impact on board:** Considered allowing weapons to influence the board directly (e.g., "dynamite weapon clears a row"). Rejected in favor of cleaner separation — weapons affect **actions per move** (turn budget), not board states. This keeps match-3 pure and strategy focused on loadout choice.

**Game over on boss failure:** Considered high-stakes permadeath. Replaced with "retry with grip penalty" to keep the game accessible while maintaining consequence.

**Shootout as speed-click test:** Considered a simple "click fast" test. Replaced with discrimination (hostile vs. friendly) to add skill depth beyond raw speed.

## 8.2 Active Design Questions

**Weapon swap cadence:** Currently set at "every town." Alternative: "every region" for more commitment. Current design favors player freedom.

**Deadeye meter behavior:** Should Deadeye deplete over time (pressure to use it) or persist until activated (patient play)? Design leans toward **persist but cap** — fill it, hold it, use it at the right moment.

**Health (canteen) refill rate:** Currently 8 HP per match. Should scale with region difficulty? TBD in playtesting.

## 8.3 Future Mechanic Ideas

- **Bounty Board:** RNG events that offer bonus rewards for specific goals (e.g., "clear 3 Outlaw matches in the next town")
- **Posse Members:** NPC allies with passive bonuses (e.g., "Deputy increases Accuracy by 10%")
- **Wanted Poster UI:** Each region's boss has a "Wanted" poster that updates as grip decreases — emotional feedback
- **Town Liberation animation:** When grip hits 0, short animation of townsfolk celebrating in the background

---

# 9. Technical Architecture

## 9.1 Module Map

```
src/
├── main.ts                 # Entry: canvas, game loop, input
├── config.ts               # All constants, balance tables
├── data.ts                 # Region/town definitions, level configs
├── Game.ts                 # Top-level orchestrator (menu→map→select→play→results)
├── Board.ts                # Match-3 with move budget + win/lose
├── Piece.ts                # Piece types (strategy pattern)
├── Background.ts           # Parallax desert (region-aware)
├── RegionMap.ts            # Region map screen with clickable towns + grip bar
├── TownSelect.ts           # Town/wilderness info + start screen
├── ResultsScreen.ts        # Post-level results summary
├── Shootout.ts             # Shootout state machine (Phase 2+)
├── Silhouette.ts           # Target entity (Phase 2+)
├── BossFight.ts            # Boss encounter (Phase 3+)
├── RegionProgression.ts    # Region/town/grip/reconquest (Phase 2+)
├── LootManager.ts          # Inventory, drops, upgrades (Phase 4+)
├── Weapon.ts               # Weapon definitions (Phase 4+)
├── WeaponAbility.ts        # Ability definitions (Phase 4+)
├── WildernessHazard.ts     # Hazard defs + application (Phase 5+)
├── HUD.ts                  # HUD: score, goal, turns, combo, health, deadeye
├── Gun.ts                  # Weapon renderer
├── Screens.ts              # Menu, Game Over
├── Effects.ts              # Particles, floating text
├── Audio.ts                # Sound effects
└── Input.ts                # Coordinate transform
```

## 9.2 Data Flow

```
main.ts → Game.update() → Board.update() → (BoardPhase state machine + win check)
                         → Effects.update()
                         → Background.update()
                         → Gun.update()
                         → Audio.play()

main.ts → Game.draw() → Background.draw()
                       → (state-dependent screen: RegionMap, TownSelect,
                          Board+Gun+HUD, Results, Menu, or GameOver)
                       → Effects.draw()
```

## 9.3 Game State Machine

```
Menu → (click) → RegionMap → (click town) → TownSelect → (click Ride Out) → Playing
                      ↑                                                    |
                      |                                            (level complete)
                      |                                                    v
                      └───────────── Results ←─────────────────────────────┘
                                             |
                                             ↓ (click Continue)
                                        back to RegionMap
```

## 9.4 Implementation Phases

| Phase | Modules | Playable? | Core Loop? |
|-------|---------|-----------|------------|
| 0 | config, Piece, Board, Background, Effects, Gun, HUD, Audio, Screens, Game, main, data | ✅ Match-3 works | No |
| 1 | RegionMap, TownSelect, ResultsScreen, HUD (upgraded), Board (moves/win), Game (state machine) | ✅ Level flow: Map→Select→Play→Results | Partial |
| 2 | Shootout, Silhouette, Game (ConfirmShootout/ShootoutActive states), Deadeye persistence + activation | ✅ Board → Shootout → Grip reduction | Yes |
| 3 | BossFight, boss patterns | ✅ All 3 phases | Yes |
| 4 | LootManager, Weapon, WeaponAbility | ✅ Strategic depth | Yes |
| 5 | WildernessHazard, wilderness routing | ✅ Loadout lock | Yes |
| 6 | Reconquest system | ✅ Optional replay | Yes |
| 7 | Polish (effects, audio, animation, region art) | ✅ Full feel | Yes |

---

# 10. Current Status (Phase 2 — Complete)

**Phase 0 implemented (match-3 core):**
- Full match-3 board with 5 piece types
- Grid swap/match/gravity/cascade state machine
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
- Move counter + score goal + deadeye meter in HUD
- Post-level Results screen (score, turns, grip reduction)
- Full state machine: Menu → Map → TownSelect → Playing → Results → Map
- `BALANCE.md` tracking tunable parameters

**Phase 2 implemented (shootout + deadeye):**
- Deadeye persistence across levels (built in wilderness, spent in towns)
- Deadeye activation prompt when full on shootout-capable towns
- Silhouette target entity with state machine (hidden→rising→visible→falling→hit/missed)
- Building facade background with window/door cover positions
- Hostile (hat, arms out) vs. friendly (no hat, arms up) discrimination
- Wave-based shootout minigame (2-3 waves per town)
- Grip reduction from shootout performance (hostile hits add, friendly fire subtracts)
- Results screen shows shootout stats (hostiles hit, friendly fire)
- All balanced via `config.ts` (timing, wave counts, grip values)

**Not yet implemented (Phase 3+):**
- Boss encounters
- Weapons / loadouts / loot
- Wilderness hazards
- Gang reconquest
- Tutorial gating for mechanics
- Map UI polish (circled numbers, town markers)
- Wilderness chase variant / outlaw blockers
- Ammo drops / ammo farming system
