import { test, expect } from '@playwright/test';

test.describe('DESERT GUNNER Smoke Tests', () => {

  test('game loads without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('menu click advances to region map', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');

    // Click on the menu screen (anywhere) to advance
    await page.click('canvas#game');
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });

  test('B key at region map starts boss fight', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');

    // Advance from menu to region map
    await page.click('canvas#game');
    await page.waitForTimeout(300);

    // Press B to trigger boss fight
    await page.keyboard.press('b');
    await page.waitForTimeout(1000);

    // Take a screenshot to verify boss fight is showing
    await page.screenshot({ path: 'tests/screenshots/boss-fight.png' });
    expect(errors).toHaveLength(0);
  });

  test('boss fight click interactions work without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.goto('http://localhost:5173');
    await page.waitForSelector('canvas#game');

    // Start boss fight
    await page.click('canvas#game');
    await page.waitForTimeout(300);
    await page.keyboard.press('b');
    await page.waitForTimeout(1000);

    // Try clicking around on the board (makes matches)
    for (let i = 0; i < 12; i++) {
      // Click on different board positions
      const x = 150 + (i % 7) * 70;
      const y = 200 + (Math.floor(i / 7) % 5) * 70;
      await page.click('canvas#game', { position: { x, y } });
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: 'tests/screenshots/boss-after-clicks.png' });
    expect(errors).toHaveLength(0);
  });

});
