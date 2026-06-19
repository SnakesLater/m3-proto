export interface FrameDef {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface SpriteSheet {
  image: HTMLImageElement;
  frameW: number;
  frameH: number;
  cols: number;
  rows: number;
}

export interface AssetRef {
  key: string;
  url: string;
  frameW: number;
  frameH: number;
  numFrames?: number;
}

const cache = new Map<string, SpriteSheet>();

export function getSheet(key: string): SpriteSheet | undefined {
  return cache.get(key);
}

export function getFrame(sheet: SpriteSheet, index: number): FrameDef {
  const col = index % sheet.cols;
  const row = Math.floor(index / sheet.cols);
  return {
    sx: col * sheet.frameW,
    sy: row * sheet.frameH,
    sw: sheet.frameW,
    sh: sheet.frameH,
  };
}

export async function loadAssets(manifest: AssetRef[]): Promise<void> {
  const promises = manifest.map(ref => loadOne(ref));
  await Promise.all(promises);
}

function loadOne(ref: AssetRef): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const cols = Math.floor(img.naturalWidth / ref.frameW);
      const rows = ref.numFrames
        ? Math.ceil(ref.numFrames / cols)
        : Math.floor(img.naturalHeight / ref.frameH);
      cache.set(ref.key, { image: img, frameW: ref.frameW, frameH: ref.frameH, cols, rows });
      resolve();
    };
    img.onerror = () => {
      console.warn(`Failed to load asset: ${ref.key} (${ref.url})`);
      resolve();
    };
    img.src = ref.url;
  });
}
