import { CONFIG } from './config';
import { Game } from './Game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const W = CONFIG.canvas.width;
const H = CONFIG.canvas.height;

const game = new Game();
(window as any).__game = game;

let lastTime = performance.now();

function loop(now: number): void {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  game.update(dt);
  game.draw(ctx);

  requestAnimationFrame(loop);
}

canvas.addEventListener('click', (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width;
  const sy = H / rect.height;
  const mx = (e.clientX - rect.left) * sx;
  const my = (e.clientY - rect.top) * sy;

  game.handleClick(mx, my);
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  game.handleKeyDown(e.key);
});

requestAnimationFrame(loop);
