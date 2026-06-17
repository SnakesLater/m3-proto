import { test, expect } from '@playwright/test';

test.describe('Full Playthrough', () => {

  test('complete playthrough with screenshots and notes', async ({ page }) => {
    const errors: string[] = [];
    const logs: string[] = [];
    page.on('pageerror', err => errors.push(`PAGE ERROR: ${err.message}`));
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(`CONSOLE ERROR: ${msg.text()}`);
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });

    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');
    await page.waitForTimeout(500);
    console.log('=== MENU SCREEN ===');
    await page.screenshot({ path: 'tests/screenshots/01-menu.png' });
    console.log(`Errors so far: ${errors.length}`);

    // Click to advance to Region Map
    await page.click('canvas#game');
    await page.waitForTimeout(500);
    console.log('=== REGION MAP ===');
    await page.screenshot({ path: 'tests/screenshots/02-region-map.png' });
    console.log(`Errors: ${errors.length}`);

    // Click on first town (Dusty Trail)
    await page.click('canvas#game', { position: { x: 480, y: 300 } });
    await page.waitForTimeout(500);
    console.log('=== TOWN SELECT ===');
    await page.screenshot({ path: 'tests/screenshots/03-town-select.png' });
    console.log(`Errors: ${errors.length}`);

    // Click "Ride Out"
    await page.click('canvas#game', { position: { x: 480, y: 450 } });
    await page.waitForTimeout(800);
    console.log('=== PLAYING - Dusty Trail ===');
    await page.screenshot({ path: 'tests/screenshots/04-playing-dusty.png' });
    console.log(`Errors: ${errors.length}`);

    // Make some swaps to play the level
    const positions = [
      // Try clicking on cells (col,row) and adjacent to make swaps
      { x: 200, y: 250 }, // cell ~(1,2)
      { x: 270, y: 250 }, // adjacent ~(2,2)
    ];

    for (let round = 0; round < 6; round++) {
      for (const pos of positions) {
        await page.click('canvas#game', { position: pos });
        await page.waitForTimeout(350);
      }
    }
    await page.waitForTimeout(500);
    console.log('=== After some swaps ===');
    await page.screenshot({ path: 'tests/screenshots/05-dusty-after-swaps.png' });
    console.log(`Errors: ${errors.length}`);

    // Now test boss fight via B key
    // First get back to region map by completing or navigating
    // Actually, just reload and use B key
    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');
    await page.waitForTimeout(300);
    // Click to advance to region map
    await page.click('canvas#game');
    await page.waitForTimeout(300);
    // Press B for boss
    await page.keyboard.press('b');
    await page.waitForTimeout(1500);
    console.log('=== BOSS FIGHT - Intro ===');
    await page.screenshot({ path: 'tests/screenshots/06-boss-intro.png' });
    console.log(`Errors: ${errors.length}`);

    // Make some board moves during boss fight (BoardPhase)
    for (let round = 0; round < 8; round++) {
      const x = 200 + (round % 5) * 70;
      const y = 200 + (Math.floor(round / 5) % 3) * 70;
      await page.click('canvas#game', { position: { x, y } });
      await page.waitForTimeout(250);
      // Click adjacent
      await page.click('canvas#game', { position: { x: x + 70, y } });
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(1000);
    console.log('=== BOSS FIGHT - After board phase moves ===');
    await page.screenshot({ path: 'tests/screenshots/07-boss-after-moves.png' });
    console.log(`Errors: ${errors.length}`);

    // Wait for more pattern phases to occur
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'tests/screenshots/08-boss-patterns.png' });
    console.log('=== BOSS FIGHT - Pattern phase ===');

    // Try clicking pattern targets during pattern phase
    // Fan Fire targets at ~25%, 50%, 75% of width, ~45% height
    for (let i = 0; i < 10; i++) {
      await page.click('canvas#game', { position: { x: 480, y: 270 } });
      await page.waitForTimeout(200);
    }

    await page.waitForTimeout(2000);
    console.log('=== BOSS FIGHT - After interaction ===');
    await page.screenshot({ path: 'tests/screenshots/09-boss-late.png' });
    console.log(`Errors: ${errors.length}`);

    // Now test the Lonesome Ridge cow level
    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');
    await page.waitForTimeout(300);
    await page.click('canvas#game'); // menu → region map
    await page.waitForTimeout(300);

    // Click Lonesome Ridge (third town, ~center of screen)
    // Region map shows towns in a vertical list; third is Lonesome Ridge
    await page.click('canvas#game', { position: { x: 480, y: 200 } });
    await page.waitForTimeout(300);
    await page.click('canvas#game', { position: { x: 480, y: 450 } }); // Ride Out
    await page.waitForTimeout(1000);
    console.log('=== COW LEVEL - Lonesome Ridge ===');
    await page.screenshot({ path: 'tests/screenshots/10-cow-level-start.png' });
    console.log(`Errors: ${errors.length}`);

    // Make some swaps near the center (where starting lasso is at col 3)
    // Try to create a match near col 3 to collect the starting lasso
    for (let round = 0; round < 12; round++) {
      const x = 180 + (round % 5) * 70;
      const y = 200 + (Math.floor(round / 5) % 3) * 70;
      await page.click('canvas#game', { position: { x, y } });
      await page.waitForTimeout(200);
      await page.click('canvas#game', { position: { x: x + 70, y } });
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(500);
    console.log('=== COW LEVEL - After swaps ===');
    await page.screenshot({ path: 'tests/screenshots/11-cow-level-swaps.png' });
    console.log(`Errors: ${errors.length}`);

    // Final report
    console.log('\n=== PLAYTHROUGH COMPLETE ===');
    console.log(`Total page errors: ${errors.length}`);
    for (const err of errors) {
      console.log(`  ${err}`);
    }
    console.log(`\nTotal console entries: ${logs.length}`);

    // Take final screenshot
    await page.screenshot({ path: 'tests/screenshots/12-final.png' });
    console.log('All screenshots captured.');

    // We don't assert no errors because some may be expected
    // but if there are page errors, log them
    expect(errors.filter(e => e.startsWith('PAGE ERROR')).length, `Page errors: ${errors.join(', ')}`).toBe(0);
  });
});
