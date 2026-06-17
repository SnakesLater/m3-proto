# DESERT GUNNER: Matched by Bullets — Future GDD

*Aspirational vision. This is the "north star" — what the game could become after all iterations are complete. Not all features here will ship; this is a curated wishlist built from GDD_PAST.md Phase 3+ sections, ITERATION_PLAN.md, and ITERATIONS.md.*

---

## 1. Regions 2–5 (Content Expansion)

### New Mexico Desert (Region 2)

- Gang: Los Comancheros
- Boss: La Viuda Negra (12 HP)
- Theme: Red rocks, adobe, agave
- Higher turn pressure: budget -2 per town vs Texas
- Introduces: Heat Wave hazard (budget shrink during play)

### Arizona Badlands (Region 3)

- Gang: Apache Raiders
- Boss: War Chief Cochise (14 HP)
- Theme: Canyons, mesas, petrified wood
- Introduces: Poison tiles (tiles lock after match)

### Colorado Mountains (Region 4)

- Gang: The Silver Syndicate
- Boss: Baron Von Colt (16 HP)
- Theme: Pine forests, granite, mining towns
- Introduces: Dynamite chains (match-4 spreads explosion)

### California Coast (Region 5)

- Gang: The Golden Dawn
- Boss: El Dorado (20 HP)
- Theme: Redwoods, fog, ocean cliffs
- Introduces: Flash Flood (board shift mechanic)

---

## 2. Boss Depth

### Phase Transitions

- At 50% HP: boss enters phase 2 with new, faster patterns
- At 25% HP: desperation mode — two patterns overlap
- Each phase adds visual distinction (boss sprite changes, background shifts)

### More Pattern Varieties

- Ricochet Shot: click bounce point to redirect bullet at boss
- Barrage: rapid series of 5–7 clicks (tests stamina)
- Taunt phase: boss pauses to gloat — free damage but sometimes a trap

### Unique Boss Weapons

Each boss drops a region-unique weapon:
- Bill's Peacemaker: "Fan Fire" ability (shoot 2 silhouettes at once)
- La Viuda's Derringer: "Double Tap" (+1 capacity, -1 damage per shot)
- Cochise's War Club: "Stagger" (boss telegraphs are 15% longer)
- Von Colt's Repeater: "Piercing Shot" (line-clear on boss phase)
- El Dorado's Golden Gun: "Critical Hit" (random 3× damage shots)

---

## 3. Weapons & Loadout System

### Weapon Tradeoff Triangle

```
           HIGH DAMAGE
          /            \
         /  fewer turns \
        ▼                 ▼
   BOSS RUN ←──────────→ LOOT RUN
        ▲                 ▲
         \  more turns  /
          \            /
           HIGH TURNS
```

### Planned Weapon Stats

| Weapon | Damage | Accuracy | Speed | Capacity | Turns | Rarity |
|--------|--------|----------|-------|----------|-------|--------|
| Peacemaker | 2 | 1 | 1 | 3 | 0 | Starter |
| Winchester | 1 | 2 | 1 | 4 | +5 | Common |
| Sawed-Off | 4 | 0 | 0 | 2 | -3 | Uncommon |
| Derringer | 1 | 1 | 3 | 2 | +2 | Common |
| (4 more to be defined) | | | | | | |

### Weapon Abilities

| Ability | Slot | Effect |
|---------|------|--------|
| Divine Miss | Special | Once/run: nullify a friendly-fire shot |
| Quick Draw | Passive | +15% shootout time window |
| Fan Fire | Active | Shoot 2 adjacent silhouettes at once |
| Dynamite | Passive | Matches of 4+ count as +1 for combos |
| Lucky Draw | Active | Once/level: board highlights a guaranteed match |
| Steady Hand | Passive | Boss telegraph windows +20% larger |
| Bandolier | Passive | +2 Capacity (more actions before boss reload) |

### Loadout Screen

Between TownSelect and Playing: show primary + secondary weapon slots, allow swapping, show active bonuses. Implements commitment: you're locked in for the level.

---

## 4. Wilderness Hazards

| Hazard | Effect | Region Introduced |
|--------|--------|-------------------|
| Sandstorm | Hide 2-3 random pieces (dark tiles) | Texas Plains |
| Heat Wave | Reduce turn budget by 3 | New Mexico |
| Snake Bite | Lose 10 HP on level start | Arizona |
| Dust Devil | Board shuffles after each match | Colorado |
| Flash Flood | Board shifts columns | California |

Wilderness levels lock the player into their loadout, creating commitment and consequence.

---

## 5. Loot Economy

### Loot Drops by Source

| Source | Rarity | Example |
|--------|--------|---------|
| Normal match (3) | — | Small gold |
| Big match (4) | Common | "Chipped Grip" (+1 accuracy) |
| Area clear (5+) | Uncommon | "Winchester 94" (new weapon) |
| Shootout: Good | Common | Ammo/health drop |
| Shootout: Perfect | Rare | "Ivory-handled Revolver" |
| Boss clear | Legendary | Region-unique weapon |

### Dual Currency

- Gold: matches, loot drops → weapon purchases, town investment
- Bullets: shootout performance → boss retries, special abilities
- Bullets create tension: grind shootouts for bullets, or push through blind

---

## 6. Gang Reconquest System

When a player clears a region and advances 3 towns into the next region, previously cleared territories can resurge:

- Reconquest chance: 30% + (region difficulty × 10%)
- Starting grip: 40 + (player weapon level × 5)
- Tighter timings: 600ms shootout windows (vs 800ms)
- Better loot: +1 tier (incentive to return)
- More friendlies in shootouts: 1 in 3 (vs 1 in 5)

Creates optional replay value and a reason to return to earlier regions.

---

## 7. Tutorial Gating

Each new mechanic introduced in a 3-step ramp:

```
Wilderness 1           Wilderness 2           Town
(teach)                (practice)            (exam)
↓                       ↓                     ↓
Sandstorm: 1 hidden    Sandstorm: 2 hidden   Sandstorm: 3 hidden
tile, infinite budget  tiles, -2 budget      tiles, standard budget
No shootout            1-2 friendlies        3+ friendlies
                        in next shootout      tighter timer
```

---

## 8. Atmosphere & Polish (Phase 7)

### Visual
- Heat shimmer distortion when Deadeye meter is high
- Tumbleweeds drifting across bottom of screen
- Vulture circles overhead when player is idle 3+ seconds
- Diegetic gun cylinder: chambers light up with combo (max 6 = all glowing)
- Canteen health bar with water slosh animation
- Region-specific background art

### Audio
- Ambient wind loop with coyote howls
- Distant gunshot echoes during shootouts
- Town ambient: creaking wood, distant piano
- Boss fight: tense strings, drum heartbeat
- Dynamic soundtrack layers that build with combo meter

---

## 9. UI Polish

- Bounty Board: RNG events with bonus rewards
- Town Investment: build saloon (+health regen), gunsmith (cheaper upgrades), etc.
- Wanted Poster: boss poster updates as grip decreases
- Town Liberation animation when grip hits 0
- "One More Town" loop: short levels (2-3 min), immediate loot feedback, clear next-step visibility

---

## 10. Accessibility

- Difficulty sliders: shootout timing, board budget, health drain
- Colorblind mode: pattern overlays on piece types
- Touch support: canvas coordinate transform already handles it

---

## 11. Stretch Goals

- Co-op mode: second player shoots silhouettes
- Daily Run: seed-generated region, fixed loadout, leaderboard
- Card table: poker bonus minigame between towns
- Horse: appears in background, upgrades affect animation speed
- Dynamic soundtrack that responds to game state
- Parallel regions: branching paths after region 2 (harder/better loot vs easier/less)

---

*This document will become GDD_PRESENT.md when the next major iteration cycle begins. When that happens, archive current GDD_PRESENT.md to `archived/` and move this document into the PRESENT slot.*
