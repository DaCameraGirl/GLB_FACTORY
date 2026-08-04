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
    // YCbCr skin-tone band — widened to cover full Monk Skin Tone Scale (medium/brown/dark).
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    if (cb >= 70 && cb <= 135 && cr >= 130 && cr <= 185) return true;
    // RGB fallback for skin tones YCbCr still misses (deeper brown/rich melanin).
    // Relaxed: r >= g (was r > g), g > b*0.6 (was b*0.75), covers broader skin range.
    if (r >= g && g > b * 0.6 && r > 35 && r - b > 8) return true;
    return false;
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

  // Require a meaningfully sized blob (~1.5% of the frame) before trusting it —
  // otherwise a stray skin-colored wall or prop could hijack the crop.
  // Lowered from 2.0% to catch smaller/more distant faces.
  if (!best || best.size < GRID * GRID * 0.015) {
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

export function analyzeColorsClientSide(img: HTMLImageElement): {
  skin_tone: string;
  hair_color: string;
  clothing_color: string;
  gender_style: "short" | "medium" | "long" | "spiky" | "bald" | "afro" | "pony" | "bob";
} {
  const defaults = {
    skin_tone: "#e5a65d",
    hair_color: "#211510",
    clothing_color: "#1e3a8a",
    gender_style: "short" as const,
  };

  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return defaults;

    canvas.width = 100;
    canvas.height = 100;
    ctx.drawImage(img, 0, 0, 100, 100);

    const rgbToHex = (r: number, g: number, b: number) => {
      return (
        "#" +
        [r, g, b]
          .map((x) => {
            const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
          })
          .join("")
      );
    };

    const averageRegion = (x0: number, y0: number, w: number, h: number) => {
      const data = ctx.getImageData(
        Math.max(0, x0),
        Math.max(0, y0),
        Math.min(w, 100 - x0),
        Math.min(h, 100 - y0)
      ).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
        n++;
      }
      if (n === 0) return { r: 128, g: 128, b: 128, lum: 128 };
      r /= n; g /= n; b /= n;
      return { r, g, b, lum: 0.2126 * r + 0.7152 * g + 0.0722 * b };
    };

    // Skin: sample cheeks & forehead (avoiding dark eyes/eyebrows/shadows)
    const candidates = [
      averageRegion(56, 46, 12, 12), // Right cheek
      averageRegion(32, 46, 12, 12), // Left cheek
      averageRegion(42, 28, 16, 10), // Forehead
      averageRegion(42, 42, 16, 16), // Central face
    ];

    let skin_tone = defaults.skin_tone;
    for (const cand of candidates) {
      // Lum gate 35 (was 65) — allows medium/brown/dark skin tones.
      // r >= g (was r > g), g > b*0.6 (was b*0.75) — broader skin range.
      if (cand.lum > 35 && cand.r >= cand.g && cand.g > cand.b * 0.6) {
        skin_tone = rgbToHex(cand.r, cand.g, cand.b);
        break;
      }
    }

    const hair = averageRegion(35, 8, 30, 14);
    const hair_color = hair.lum > 220 ? defaults.hair_color : rgbToHex(hair.r, hair.g, hair.b);

    const clothing = averageRegion(30, 78, 40, 16);
    let clothing_color = defaults.clothing_color;
    if (clothing.lum >= 18 && clothing.lum <= 245) {
      clothing_color = rgbToHex(clothing.r, clothing.g, clothing.b);
    }

    return {
      skin_tone,
      hair_color,
      clothing_color,
      gender_style: "short",
    };
  } catch (e) {
    console.warn("Could not read image pixels client-side", e);
    return defaults;
  }
}
