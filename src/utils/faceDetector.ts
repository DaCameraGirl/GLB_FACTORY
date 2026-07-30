/**
 * Client-side face-region estimator used when there is no backend to call
 * (e.g. the GitHub Pages static demo). Finds the largest connected blob of
 * skin-toned pixels on a downsampled grid and returns its padded bounding
 * box as a percentage [ymin, xmin, ymax, xmax] box — same format the Gemini
 * API returns — so different photos actually crop differently instead of
 * every upload reusing one fixed center box.
 */
export function estimateFaceBox(
  img: HTMLImageElement
): [number, number, number, number] | null {
  const GRID = 100; // grid cells double as percentage units (0-100)
  const canvas = document.createElement("canvas");
  canvas.width = GRID;
  canvas.height = GRID;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  ctx.drawImage(img, 0, 0, GRID, GRID);
  const { data } = ctx.getImageData(0, 0, GRID, GRID);

  const isSkin = (x: number, y: number): boolean => {
    const i = (y * GRID + x) * 4;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // YCbCr skin-tone band — more lighting/tone robust than a raw RGB rule.
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    return cb >= 77 && cb <= 127 && cr >= 133 && cr <= 173;
  };

  const visited = new Uint8Array(GRID * GRID);
  let best: { minX: number; minY: number; maxX: number; maxY: number; size: number; score: number } | null = null;
  const stackX: number[] = [];
  const stackY: number[] = [];

  for (let sy = 0; sy < GRID; sy++) {
    for (let sx = 0; sx < GRID; sx++) {
      const startIdx = sy * GRID + sx;
      if (visited[startIdx] || !isSkin(sx, sy)) continue;

      let minX = sx, maxX = sx, minY = sy, maxY = sy, size = 0;
      stackX.length = 0;
      stackY.length = 0;
      stackX.push(sx);
      stackY.push(sy);
      visited[startIdx] = 1;

      while (stackX.length) {
        const x = stackX.pop()!;
        const y = stackY.pop()!;
        size++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        const neighbors: Array<[number, number]> = [
          [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
        ];
        for (const [nx, ny] of neighbors) {
          if (nx < 0 || nx >= GRID || ny < 0 || ny >= GRID) continue;
          const nIdx = ny * GRID + nx;
          if (visited[nIdx] || !isSkin(nx, ny)) continue;
          visited[nIdx] = 1;
          stackX.push(nx);
          stackY.push(ny);
        }
      }

      // The largest skin-toned blob is very often a neck/chest/arm, not the
      // face — those are usually bigger than the face itself in a normal
      // photo. Score blobs toward face-like proportions (roughly as wide as
      // tall) sitting in the upper part of the frame (portraits/selfies
      // overwhelmingly frame the face there), instead of picking on raw size.
      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      const aspect = w / h;
      const aspectScore = 1 / (1 + Math.abs(Math.log(aspect / 0.85)));
      const verticalCenter = (minY + maxY) / 2 / GRID;
      const positionScore = verticalCenter < 0.65 ? 1 : 0.35;
      const score = size * aspectScore * positionScore;

      if (!best || score > best.score) {
        best = { minX, minY, maxX, maxY, size, score };
      }
    }
  }

  // Require a meaningfully sized blob (~2% of the frame) before trusting it —
  // otherwise a stray skin-colored wall or prop could hijack the crop.
  if (!best || best.size < GRID * GRID * 0.02) {
    return null;
  }

  const w = best.maxX - best.minX;
  const h = best.maxY - best.minY;
  const padX = w * 0.25;
  const padTop = h * 0.35; // extra headroom above for hair/forehead
  const padBottom = h * 0.15;

  const ymin = Math.max(0, best.minY - padTop);
  const xmin = Math.max(0, best.minX - padX);
  const ymax = Math.min(GRID, best.maxY + padBottom);
  const xmax = Math.min(GRID, best.maxX + padX);

  return [ymin, xmin, ymax, xmax];
}
