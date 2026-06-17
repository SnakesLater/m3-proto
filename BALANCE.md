# Balance Log

*Living document. Update as values change during playtesting.*

---

## Core Game Balance

| Parameter | Current Value | Notes | Date Set |
|-----------|--------------|-------|----------|
| Board columns | 7 | Standard | Phase 0 |
| Board rows | 6 | Standard | Phase 0 |
| Cell size | 64px | Fits 960-wide canvas | Phase 0 |
| Initial health | 100 | | Phase 0 |
| Health decay base | 2 HP/s | Boss fights only (removed from regular levels) | Phase 0 → V2 |
| Health decay per level | 0.5 HP/s | Boss fights only | Phase 0 → V2 |
| Health per match | 8 HP | Flat restore | Phase 0 |
| Max combo | 10 | | Phase 0 |
| Lasso max | 3 | Max lassos player can hold | V2 |
| Cows to capture | 3 | Spawned on boss start | V2 |
| Hearts on boss start | 5 | Initial placement | V2 |
| Boss health | 10 | Cattle Rustler Bill | V2 |
| Boss moves per pattern | 3 | board moves between patterns | V2 |

## Scoring

| Match Size | Base Score | Multiplier | Notes |
|------------|-----------|------------|-------|
| 3 (normal) | 100 | × combo | |
| 4 (line) | 300 | × combo | |
| 5+ (area) | 500 | × combo | |
| Score per level up | 3000 | | |

## Deadeye

| Parameter | Current Value | Notes |
|-----------|--------------|-------|
| Max deadeye | 100 | |
| Per normal match | 8 | |
| Per line match | 15 | |
| Per area match | 25 | |

## Towns (Region 1: Texas Plains)

### Town Data

| Name | Type | Turns | Score Target | Grip Reduction | Status |
|------|------|-------|-------------|----------------|--------|
| Dusty Trail | Wilderness | 20 | 500 | 0 | Untuned |
| Dry Gulch | Town | 18 | 1000 | 10 | Untuned |
| Lonesome Ridge | Wilderness | 18 | 750 | 0 | Untuned |
| Dustbowl | Town | 16 | 1200 | 15 | Untuned |
| Rattlesnake Gorge | Wilderness | 16 | 1000 | 0 | Untuned |
| Dead Man's Crossing | Town | 15 | 1500 | 20 | Untuned |

### Tuning Notes

_TBD after playtesting first run._

Initial thoughts:
- 100 score per normal match × combo means ~10+ matches per level at base
- Wilderness levels are shorter (fewer turns, lower target) — should feel breezy
- Town levels escalate: fewer turns + higher targets = pressure
- Grip reduction: all 3 towns cleared = 10 + 15 + 20 = 45 grip reduced (from 100). Need shootout mechanic to bring it to 0 for boss.
- Move budget seems generous for first pass — expect to tune down once playtested

## Shootout (Future Phase)

| Parameter | Planned Value | Notes |
|-----------|--------------|-------|
| Base window | 800ms | |
| Reconquest window | 600ms | |
| Friendly frequency (first) | 1 in 5 | |
| Friendly frequency (reconquest) | 1 in 3 | |

## Weapons (Future Phase)

_Parameters TBD — placeholder for when weapons are implemented._

| Slot | Example Stats |
|------|--------------|
| Primary | Dmg 4, Acc 3, Cap 5, Turns 0 |
| Secondary | Dmg 2, Acc 5, Cap 3, Turns +2 |
| Boss weapon | Dmg 7, Acc 4, Cap 6, Turns -3 |

---

## Playtest Sessions

| Date | Level | Score | Turns Used | Pass? | Notes |
|------|-------|-------|-----------|-------|-------|
| — | — | — | — | — | Not yet tested |

## Change Log

| Date | Parameter | Old Value | New Value | Reason |
|------|-----------|-----------|-----------|--------|
| 2026-06-17 | Health decay (regular) | 2 HP/s | 0 | Remove time pressure from puzzle-solving |
| 2026-06-17 | Health decay (boss) | — | 2 HP/s (kept) | Keep tension in boss fights |
| 2026-06-17 | Lasso mechanic | Bottom-row collect | Adjacency collect | Discoverability; natural teaching |
| 2026-06-17 | Cow mechanic | Click-to-capture | Auto-capture at bottom | Remove pointless extra click |
| 2026-06-17 | Heart prerequisite | Cow-clear required | Always damageable | Simplifies boss damage loop |
| 2026-06-17 | Heart supply | Finite (board only) | Infinite (auto-respawn) | Prevent soft-lock |
| 2026-06-17 | Heart pop trigger | Row/column match | Adjacency to match | More intuitive, more dynamic |
| 2026-06-17 | Boss overlay (BoardPhase) | rgba(255,215,0,0.08) | rgba(0,0,0,0.2) | Phase distinction clarity |
| 2026-06-17 | Boss overlay (PatternPhase) | rgba(255,50,0,0.12) | rgba(0,0,0,0.55) | Pattern visibility |
| 2026-06-17 | Pattern hit targets | ~30px | ~50px | Reduced frustration |
| 2026-06-17 | Telegraph lines | 3px | 6px | Better telegraph readability |
| 2026-06-17 | Lasso stroke color | #c49a6c | #5c3a21 | Visibility against board cells |
| 2026-06-17 | Lasso stroke width | 1px | 3.5px | Visibility |
