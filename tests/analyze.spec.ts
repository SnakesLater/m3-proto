import { test, expect } from '@playwright/test';

test.describe('Game State Analysis', () => {

  async function snap(page: any): Promise<void> {
    const data = await page.evaluate(() => {
      const g = (window as any).__game;
      if (!g) return 'NO_GAME';
      const b = g.board;
      const pieces = b.pieces
        .filter((p: any) => !p.removing)
        .map((p: any) => `(${p.col},${p.row} t:${p.type})`);
      return JSON.stringify({
        state: ['Menu','RegionMap','TownSelect','Playing','ConfirmShootout','ShootoutActive','Results','BossActive','GameOver'][g.state],
        score: Math.floor(g.score),
        health: Math.floor(g.health),
        lassos: g.lassos,
        cowsCaptured: g.cowsCaptured,
        cowsRemaining: g.cowsRemaining,
        deadeye: Math.floor(g.deadeye),
        combo: g.combo,
        movesUsed: b.movesUsed,
        turnBudget: b.turnBudget,
        scoreTarget: b.scoreTarget,
        phase: ['Idle','Swapping','Removing','Cascading'][b.phase],
        isBoss: b.isBossLevel,
        hasCows: b.hasCows,
        cowCount: b.cowCount,
        lassoQueue: b.lassoQueue,
        heartQueue: b.heartQueue,
        bossState: ['Intro','BoardPhase','PatternPhase','Victory','Done'][g.boss.state],
        bossHealth: g.boss.health,
        selected: g.board.selected ? `(${g.board.selected.col},${g.board.selected.row})` : null,
        gridBottom: b.grid[5].map((c: any) => c ? c.type : '.'),
        bottomRowPieces: b.grid[5].map((c: any) => c ? `t${c.type} rmv:${c.removing}` : 'empty'),
        timer: Math.floor(g.time * 10) / 10,
        hasLassoOnBoard: b.pieces.some((p: any) => !p.removing && p.type === 7),
        hasHeartOnBoard: b.pieces.some((p: any) => !p.removing && p.type === 6),
        heartsOnBoard: b.pieces.filter((p: any) => !p.removing && p.type === 6).length,
        cowsOnBoard: b.pieces.filter((p: any) => !p.removing && p.type === 5).length,
      });
    });
    console.log(JSON.parse(data));
  }

  test('analyze full game flow', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`CONSOLE: ${msg.text()}`);
    });

    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');
    await page.waitForTimeout(300);

    console.log('\n═══ 1. MENU ═══');
    await snap(page);

    // Click to advance past menu
    await page.click('canvas#game');
    await page.waitForTimeout(400);
    console.log('\n═══ 2. REGION MAP ═══');
    await snap(page);

    // Click first town (Dusty Trail)
    await page.click('canvas#game', { position: { x: 480, y: 300 } });
    await page.waitForTimeout(300);
    console.log('\n═══ 3. TOWN SELECT (Dusty Trail) ═══');
    await snap(page);

    // Click "Ride Out" area
    await page.click('canvas#game', { position: { x: 480, y: 480 } });
    await page.waitForTimeout(800);
    console.log('\n═══ 4. PLAYING (Dusty Trail) ═══');
    await snap(page);

    // Make swaps on the board — click cell then adjacent
    for (let round = 0; round < 8; round++) {
      const cx = 130 + (round % 6) * 70;
      const cy = 150 + (Math.floor(round / 6) % 4) * 70;
      await page.click('canvas#game', { position: { x: cx, y: cy } });
      await page.waitForTimeout(100);
      await page.click('canvas#game', { position: { x: cx + 70, y: cy } });
      await page.waitForTimeout(500);
    }
    console.log('\n═══ 5. DUSTY TRAIL AFTER 8 SWAPS ═══');
    await snap(page);

    // ===== BOSS FIGHT =====
    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');
    await page.waitForTimeout(200);
    await page.click('canvas#game'); // menu → region map
    await page.waitForTimeout(300);
    await page.keyboard.press('b');
    await page.waitForTimeout(1500);

    console.log('\n═══ 6. BOSS FIGHT START ═══');
    await snap(page);

    // Make board moves (should be in BoardPhase)
    for (let round = 0; round < 9; round++) {
      const cx = 130 + (round % 6) * 70;
      const cy = 150 + (Math.floor(round / 6) % 4) * 70;
      await page.click('canvas#game', { position: { x: cx, y: cy } });
      await page.waitForTimeout(80);
      await page.click('canvas#game', { position: { x: cx + 70, y: cy } });
      await page.waitForTimeout(400);
    }
    console.log('\n═══ 7. BOSS AFTER 9 MOVES ═══');
    await snap(page);

    // Wait for pattern phase to resolve
    await page.waitForTimeout(5000);
    console.log('\n═══ 8. BOSS AFTER PATTERNS ═══');
    await snap(page);

    // Try clicking various pattern targets
    for (let i = 0; i < 20; i++) {
      const tx = 200 + (i % 4) * 180;
      const ty = 200 + (i % 3) * 100;
      await page.click('canvas#game', { position: { x: tx, y: ty } });
      await page.waitForTimeout(150);
    }
    await page.waitForTimeout(3000);
    console.log('\n═══ 9. BOSS FINAL ═══');
    await snap(page);

    // ===== COW LEVEL =====
    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');
    await page.waitForTimeout(200);
    await page.click('canvas#game'); // menu → region map
    await page.waitForTimeout(300);

    // Region map — try clicking Lonesome Ridge area
    // Towns are listed vertically, approx y positions: 160, 220, 280, 340, 400, 460
    await page.click('canvas#game', { position: { x: 480, y: 280 } });
    await page.waitForTimeout(300);

    console.log('\n═══ 10. TOWN SELECT (should be Lonesome Ridge) ═══');
    await snap(page);

    // Click Ride Out
    await page.click('canvas#game', { position: { x: 480, y: 480 } });
    await page.waitForTimeout(800);

    console.log('\n═══ 11. COW LEVEL START ═══');
    await snap(page);

    // Make swaps — try to make matches near center column (starting lasso at col 3)
    for (let round = 0; round < 15; round++) {
      const cx = 100 + (round % 6) * 70;
      const cy = 150 + (Math.floor(round / 6) % 4) * 70;
      await page.click('canvas#game', { position: { x: cx, y: cy } });
      await page.waitForTimeout(80);
      // Try swapping in different directions
      if (round % 2 === 0) {
        await page.click('canvas#game', { position: { x: cx + 70, y: cy } });
      } else {
        await page.click('canvas#game', { position: { x: cx, y: cy + 70 } });
      }
      await page.waitForTimeout(400);
    }

    console.log('\n═══ 12. COW LEVEL AFTER 15 SWAPS ═══');
    await snap(page);

    // More focused swaps — try to clear below cows if any cow visible
    for (let round = 0; round < 10; round++) {
      const cx = 200 + (round % 4) * 70;
      const cy = 400; // bottom area of board
      await page.click('canvas#game', { position: { x: cx, y: cy } });
      await page.waitForTimeout(80);
      await page.click('canvas#game', { position: { x: cx + 70, y: cy } });
      await page.waitForTimeout(400);
    }

    console.log('\n═══ 13. COW LEVEL AFTER BOTTOM SWAPS ═══');
    await snap(page);

    // Summary
    console.log('\n═══ ERRORS ═══');
    for (const e of errors) console.log(`  ${e}`);
    expect(errors.length).toBe(0);
  });
});
