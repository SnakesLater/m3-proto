import { getSheet, getFrame, type FrameDef } from './loader';

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  key: string,
  frameIndex: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): boolean {
  const sheet = getSheet(key);
  if (!sheet) return false;

  const frame = getFrame(sheet, frameIndex);
  ctx.drawImage(sheet.image, frame.sx, frame.sy, frame.sw, frame.sh, dx, dy, dw, dh);
  return true;
}

export function drawSpriteCentered(
  ctx: CanvasRenderingContext2D,
  key: string,
  frameIndex: number,
  cx: number,
  cy: number,
  size: number,
): boolean {
  const sheet = getSheet(key);
  if (!sheet) return false;

  const frame = getFrame(sheet, frameIndex);
  const aspect = frame.sw / frame.sh;
  let dw = size;
  let dh = size;
  if (aspect > 1) {
    dh = size / aspect;
  } else {
    dw = size * aspect;
  }
  ctx.drawImage(sheet.image, frame.sx, frame.sy, frame.sw, frame.sh, cx - dw / 2, cy - dh / 2, dw, dh);
  return true;
}

export function getSpriteSize(key: string, frameIndex: number): { w: number; h: number } | null {
  const sheet = getSheet(key);
  if (!sheet) return null;
  const frame = getFrame(sheet, frameIndex);
  return { w: frame.sw, h: frame.sh };
}
