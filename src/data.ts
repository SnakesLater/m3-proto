export interface RegionDef {
  id: string;
  name: string;
  gangName: string;
  gangGrip: number;
  towns: TownDef[];
  boss: BossDef;
}

export interface BossDef {
  name: string;
  health: number;
}

export interface TownDef {
  id: string;
  name: string;
  type: 'town' | 'wilderness';
  turnBudget: number;
  scoreTarget: number;
  gripReduction: number;
  hasShootout: boolean;
  shootoutWaves?: number;
  hasCows?: boolean;
}

export interface LevelResult {
  passed: boolean;
  score: number;
  turnsUsed: number;
  turnBudget: number;
  scoreTarget: number;
  gripReduction: number;
  deadeyeUsed: boolean;
  shootoutHostiles?: number;
  shootoutFriendlies?: number;
}

export const REGIONS: RegionDef[] = [
  {
    id: 'texas-plains',
    name: 'Texas Plains',
    gangName: 'The Rustlers',
    gangGrip: 100,
    boss: { name: 'Cattle Rustler Bill', health: 45 },
    towns: [
      {
        id: 'dusty-trail',
        name: 'Dusty Trail',
        type: 'wilderness',
        turnBudget: 20,
        scoreTarget: 500,
        gripReduction: 0,
        hasShootout: false,
      },
      {
        id: 'dry-gulch',
        name: 'Dry Gulch',
        type: 'town',
        turnBudget: 18,
        scoreTarget: 1000,
        gripReduction: 10,
        hasShootout: true,
        shootoutWaves: 2,
      },
      {
        id: 'lonesome-ridge',
        name: 'Lonesome Ridge',
        type: 'wilderness',
        turnBudget: 18,
        scoreTarget: 750,
        gripReduction: 0,
        hasShootout: false,
        hasCows: true,
      },
      {
        id: 'dustbowl',
        name: 'Dustbowl',
        type: 'town',
        turnBudget: 16,
        scoreTarget: 1200,
        gripReduction: 15,
        hasShootout: true,
        shootoutWaves: 2,
      },
      {
        id: 'rattlesnake-gorge',
        name: 'Rattlesnake Gorge',
        type: 'wilderness',
        turnBudget: 16,
        scoreTarget: 1000,
        gripReduction: 0,
        hasShootout: false,
      },
      {
        id: 'dead-mans-crossing',
        name: "Dead Man's Crossing",
        type: 'town',
        turnBudget: 15,
        scoreTarget: 1500,
        gripReduction: 20,
        hasShootout: true,
        shootoutWaves: 3,
      },
    ],
  },
];

export function getRegion(index: number): RegionDef {
  return REGIONS[index];
}

export function getTown(regionIndex: number, townIndex: number): TownDef {
  return REGIONS[regionIndex].towns[townIndex];
}

export function totalGripReduction(region: RegionDef, upToTown: number): number {
  let total = 0;
  for (let i = 0; i <= upToTown; i++) {
    total += region.towns[i].gripReduction;
  }
  return total;
}
