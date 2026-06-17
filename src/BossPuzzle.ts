export interface BossPuzzleResult {
  bossDamage: number;
  playerDamage: number;
  scoreBonus: number;
  narrativeLine: string;
  turnPenalty: number;
}

export interface BossPuzzle {
  readonly name: string;
  start(): void;
  update(dt: number): void;
  draw(ctx: CanvasRenderingContext2D): void;
  handleClick(mx: number, my: number): boolean;
  readonly done: boolean;
  readonly result: BossPuzzleResult;
  get hasResult(): boolean;
}
