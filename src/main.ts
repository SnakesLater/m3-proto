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

function canvasCoords(e: MouseEvent | PointerEvent): [number, number] {
  const rect = canvas.getBoundingClientRect();
  const sx = W / rect.width;
  const sy = H / rect.height;
  return [(e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy];
}

canvas.addEventListener('click', (e: MouseEvent) => {
  const [mx, my] = canvasCoords(e);
  game.handleClick(mx, my);
});

canvas.addEventListener('pointerdown', (e: PointerEvent) => {
  e.preventDefault();
  canvas.setPointerCapture(e.pointerId);
  const [mx, my] = canvasCoords(e);
  game.handlePointerDown(mx, my);
});

canvas.addEventListener('pointermove', (e: PointerEvent) => {
  e.preventDefault();
  const [mx, my] = canvasCoords(e);
  game.handlePointerMove(mx, my);
});

canvas.addEventListener('pointerup', (e: PointerEvent) => {
  e.preventDefault();
  canvas.releasePointerCapture(e.pointerId);
  const [mx, my] = canvasCoords(e);
  game.handlePointerUp(mx, my);
});

canvas.addEventListener('mousemove', (e: MouseEvent) => {
  const [mx, my] = canvasCoords(e);
  game.handleMouseMove(mx, my);
});

document.addEventListener('keydown', (e: KeyboardEvent) => {
  game.handleKeyDown(e.key, e.shiftKey);
});

requestAnimationFrame(loop);
