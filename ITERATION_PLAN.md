# V2 Iteration Plan

Based on 18 source files reviewed. Working directory: `~/opencode/m3-v2/`

---

## A. Prep Work

### A0. Verify the game runs
```bash
cd ~/opencode/m3-v2 && npm run dev
```
Open the URL in a browser. Play through Texas Plains to verify the current loop works before we change anything.

---

## B. Expand Regions (Add Content Fast)

### B1. Add Regions 2-5 to `src/data.ts`

Insert after the Texas Plains entry in the `REGIONS` array:

**Region 2 — New Mexico Desert**
- Gang: Los Comancheros
- Boss: La Viuda Negra (health: 12)
- Gang Grip: 120
- 5 towns (2 wilderness, 3 town)
- Higher turn pressure (budget -2 per town vs Texas)

**Region 3 — Arizona Badlands**
- Gang: Apache Raiders
- Boss: War Chief Cochise (health: 14)
- Gang Grip: 140
- 5 towns
- Introduces obstacles/wilderness hazards

**Region 4 — Colorado Mountains**
- Gang: The Silver Syndicate
- Boss: Baron Von Colt (health: 16)
- Gang Grip: 160
- 4 towns (harder)

**Region 5 — California Coast**
- Gang: The Golden Dawn
- Boss: El Dorado (health: 20)
- Gang Grip: 200
- 4 towns (hardest)

Each town scales: higher scoreTarget, tighter turnBudget, more shootoutWaves.

### B2. Update `Game.ts` for region progression

When `regionGrip <= 0` after a boss victory → advance to next region index.
If at last region → victory screen.
Currently the boss returns to the same region map. Need to add:
- BossDefeat → RegionComplete → unlock next region → advance to next REGIONS entry

### B3. Update `RegionMap.ts`

Show which region is currently active. Add a visual "Westward" arrow to indicate progress direction.
No multi-region map screen yet — keep it simple with a sequential linear flow.

---

## C. Real Boss Patterns (Core Loop Complete)

### C1. Replace current boss with pattern-based system

Current: `Boss.ts` has a single telegraph → vulnerable cycle on a random target.
Replace with multiple patterns drawn from a pool, rotated each turn.

### C2. Pattern Definitions

Add a `BossPattern` type and a pool of patterns per region:

**Pattern 1 — Fan Fire**
- Boss stance: 3 horizontal click targets appear left-to-right
- Each target has a short window (500ms) to click
- Clicking all 3 = 3x damage
- Missing any = 0 damage that turn
- Telegraph: red streaks animate across the screen before targets appear

**Pattern 2 — Dynamite Toss**
- A lit dynamite stick arcs across the screen
- Player must click it mid-air at the right moment
- Timing window: ~700ms around the peak of the arc
- Hit = 2 damage, miss = 0
- Telegraph: fuse sparks + sound cue before throw

**Pattern 3 — Quick Draw Standoff**
- Crosshair drifts erratically on screen
- A "DRAW!" flash appears at a random moment
- Player must click within a narrowing window (starts 600ms, shrinks with boss HP)
- Success = 2 damage, failure = boss deals 1 damage to player (health penalty)
- Telegraph: dramatic zoom on the boss + music sting

**Pattern 4 — Reload Window**
- Boss pauses to reload (2s window)
- Rapid-click phase: each click within the window deals 0.5 damage
- Max ~4 damage if clicking at full speed
- No telegraph — it's a "free damage" reward phase after 2-3 attack patterns

### C3. Pattern Selection System

```typescript
class BossPatternSelector {
  // On each boss turn:
  // 1. Pick a random pattern from available pool (weighted)
  // 2. Same pattern can't repeat twice in a row
  // 3. Reload Window always appears after 2-3 attack patterns
  // 4. At < 50% HP: patterns execute faster (shorter telegraphs, tighter windows)
  // 5. At < 25% HP: desperation mode — two patterns overlap
}
```

### C4. Boss UI Overlay

Move damage from "match hearts on board" to pattern-based. The board during boss fights should use hearts as a supplementary mechanic (bonus damage), not the primary way to damage the boss.

Boss health bar already exists in `Boss.ts`'s `drawOverlay()`.

### C5. Integrate with `Game.ts`

- `BossActive` state: alternate between board phase (match hearts for bonus) and boss attack phase (patterns)
- Patterns run as timed sequences independent of the board
- Player clicks either board (for hearts) or pattern targets (for boss damage) depending on current sub-phase

---

## D. Weapon / Loadout System

### D1. Create `src/Weapon.ts`

```typescript
interface WeaponDef {
  id: string;
  name: string;
  slot: 'primary' | 'secondary';
  stats: {
    damage: number;      // per successful boss action
    speed: number;       // makes timing windows more lenient
    accuracy: number;    // makes shootout hitboxes bigger
    capacity: number;    // actions before forced reload
    turnsBonus: number;  // modifies board turn budget
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  ability?: string;
}
```

Define a starter set of ~8 weapons following the tradeoff triangle:
- Peacemaker (balanced: +0 turns, dmg 2, acc 1, spd 1, cap 3)
- Winchester (loot: +5 turns, dmg 1, acc 2, spd 1, cap 4)
- Sawed-Off (boss: -3 turns, dmg 4, acc 0, spd 0, cap 2)
- Derringer (fast: +2 turns, dmg 1, acc 1, spd 3, cap 2)
- (4 more of varying rarities)

### D2. Create `src/LootManager.ts`

Manages inventory of owned weapons. Tracks active loadout (primary + secondary).
Handles loot drops at level completion:
- Normal match (3): small gold + chance at common item
- Line clear (4): common item
- Area clear (5+): uncommon/rare
- Shootout good: common
- Shootout perfect: rare
- Boss: legendary region-unique

### D3. Create `src/WeaponAbility.ts`

```
Divine Miss     → nullify one friendly-fire shot (active, once/run)
Quick Draw      → +15% shootout time window (passive)
Fan Fire        → shoot 2 adjacent silhouettes at once (active)
Dynamite        → matches of 4+ count as +1 for combos (passive)
Lucky Draw      → highlight a guaranteed match (active, once/level)
Steady Hand     → boss telegraph windows +20% larger (passive)
Bandolier       → +2 capacity (passive)
```

### D4. Loadout Screen

Add a loadout screen (`src/LoadoutScreen.ts`) between TownSelect and Playing:
- Show primary weapon (equipped) and secondary weapon (holstered)
- Allow swapping
- Show active bonuses

Wire into `Game.ts` state machine: `TownSelect → LoadoutScreen → Playing`

### D5. Turn budget modification

In `Board.setupLevel()`, apply `weapon.turnsBonus` to the town's `turnBudget`.
```typescript
effectiveBudget = town.turnBudget + weapon.stats.turnsBonus;
```

---

## E. Wilderness Hazards

### E1. Create `src/WildernessHazard.ts`

```typescript
type HazardType = 'sandstorm' | 'heatwave' | 'snakebite' | 'dustdevil';

interface HazardDef {
  type: HazardType;
  name: string;
  description: string;
  apply: (board: Board, level: number) => void;
  remove: (board: Board) => void;
}
```

**Sandstorm** — Hide 2-3 random pieces (render them as dark tiles). Player must remember/match from memory.
**Heat Wave** — Reduce turn budget by 3.
**Snake Bite** — Lose 10 HP on level start.
**Dust Devil** — Shuffle the board after each match.

### E2. Integrate with Game flow

In `Game.startLevel()`, if town type is 'wilderness', pick a hazard from the current region's available hazards. Call `hazard.apply(board)` on level start, `hazard.remove(board)` on level end.

---

## F. Polish & Technical Debt

### F1. Boss victory → region transition
When boss HP reaches 0:
1. Play victory animation (existing)
2. Show region complete overlay
3. Unlock next region
4. Transition to region map with next region loaded
5. If last region: game victory screen

### F2. `.gitignore`
Already added to V1 and V2.

### F3. Build check
```bash
npm run build  # currently: 21 modules, 60.85 kB gzip
```

---

## Implementation Order

```
Iteration 1: Boss Patterns (C)
  - Most critical — completes the core gameplay loop
  - Makes the game feel like a complete experience
  - Patterns can be added one at a time and tested immediately

Iteration 2: Regions (B)
  - Adds content breadth using existing systems
  - Each region is just data + slight param scaling
  - No new systems needed

Iteration 3: Weapons/Loadout (D)
  - Adds strategic depth that makes the loop repeatable
  - Requires the loadout screen UI
  - Turn budget modification is a small change

Iteration 4: Wilderness Hazards (E)
  - Adds variety to the board phase
  - Each hazard is independent and self-contained
  - Finishes the wilderness level type

Iteration 5: Polish (F)
  - Region transitions, victory screens
  - Juice: particles, sound, animation
```

---

## How to Test Each Iteration

```bash
cd ~/opencode/m3-v2
npm run build        # typescript + bundle check
npm run typecheck    # type-only check
```

Then open the dev server and play through:
- Iter 1: Fight the boss → verify all 4 patterns appear, damage applies, boss dies
- Iter 2: Play through Region 2 → verify progression unlocks, harder params
- Iter 3: Open loadout screen → verify weapon selection → verify turn budget changes
- Iter 4: Play wilderness → verify hazard applies and ends correctly
- Iter 5: Complete all regions → verify victory flow
