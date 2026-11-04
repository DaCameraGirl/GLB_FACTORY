import * as THREE from "three";

/**
 * Photo Sculpt — turns a single photo into a real, closed 3D mesh entirely in
 * the browser with GLB Factory's own code. No AI model, no server, no API key.
 *
 * Pipeline:
 *  1. Cut the subject out of the background (border-seeded color flood fill).
 *  2. Inflate the cutout into a rounded body (distance-from-edge → height).
 *  3. Add surface detail from the photo's shading (bright pushes out, dark sinks in).
 *  4. Build a front surface + a thinner back surface that meet at the silhouette,
 *     cap any edge where the subject runs off the photo, and wrap the photo on.
 *
 * Best results: one person/object, plain-ish background that contrasts with it.
 */

export interface SculptOptions {
  /** Longest side of the sampling grid. Higher = more detail, more triangles. */
  resolution?: number;
  /** How far the front bulges out (0.2 - 1.5). */
  depth?: number;
  /** How much photo shading becomes surface bumps (0 - 1). */
  detail?: number;
  /** Back thickness compared to the front (0 - 1). */
  backDepth?: number;
  /** How different a color must be from the background to count as subject (10 - 120). */
  tolerance?: number;
  /** Where the subject is in the photo (0-1 from top-left). Set when the user taps the photo. */
  focus?: { x: number; y: number } | null;
}

export interface SculptResult {
  group: THREE.Group;
  /** White = subject, black = background. Shown in the UI so you can see the cutout. */
  maskCanvas: HTMLCanvasElement;
  /** Share of the photo treated as subject (0 - 1). */
  coverage: number;
  /** True when no clear subject was found and a centered oval was used instead. */
  usedFallbackMask: boolean;
  triangleCount: number;
}

const DEFAULTS: Required<SculptOptions> = {
  resolution: 180,
  depth: 0.55,
  detail: 0.35,
  backDepth: 0.7,
  tolerance: 42,
  focus: null,
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the photo."));
    img.src = src;
  });
}

function drawScaled(img: HTMLImageElement, maxSide: number, filter?: string): HTMLCanvasElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  if (filter) ctx.filter = filter;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Separable box blur on a float field, repeated for a near-gaussian result. */
function blurField(src: Float32Array, W: number, H: number, radius: number, passes: number): Float32Array {
  let a = Float32Array.from(src);
  let b = new Float32Array(src.length);
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let sum = 0, n = 0;
        for (let k = -radius; k <= radius; k++) {
          const xx = x + k;
          if (xx < 0 || xx >= W) continue;
          sum += a[y * W + xx]; n++;
        }
        b[y * W + x] = sum / n;
      }
    }
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let sum = 0, n = 0;
        for (let k = -radius; k <= radius; k++) {
          const yy = y + k;
          if (yy < 0 || yy >= H) continue;
          sum += b[yy * W + x]; n++;
        }
        a[y * W + x] = sum / n;
      }
    }
  }
  return a;
}

export async function sculptFromPhoto(src: string, options: SculptOptions = {}): Promise<SculptResult> {
  const opt = { ...DEFAULTS, ...options };
  const img = await loadImage(src);

  // ---------- 1. Sample grid ----------
  const grid = drawScaled(img, opt.resolution);
  const W = grid.width;
  const H = grid.height;
  const N = W * H;
  const fx = (opt.focus?.x ?? 0.5) * W;
  const fy = (opt.focus?.y ?? 0.5) * H;
  const focusIdx = Math.min(H - 1, Math.max(0, Math.round(fy - 0.5))) * W + Math.min(W - 1, Math.max(0, Math.round(fx - 0.5)));
  const px = grid.getContext("2d", { willReadFrequently: true })!.getImageData(0, 0, W, H).data;
  const R = new Float32Array(N), G = new Float32Array(N), B = new Float32Array(N), L = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    R[i] = px[i * 4]; G[i] = px[i * 4 + 1]; B[i] = px[i * 4 + 2];
    L[i] = (0.2126 * R[i] + 0.7152 * G[i] + 0.0722 * B[i]) / 255;
  }
  const dist = (i: number, r: number, g: number, b: number) => {
    const dr = R[i] - r, dg = G[i] - g, db = B[i] - b;
    return Math.sqrt((2 * dr * dr + 4 * dg * dg + 3 * db * db) / 9);
  };

  // ---------- 2. Background flood fill from the photo border ----------
  const border: number[] = [];
  for (let x = 0; x < W; x++) { border.push(x); border.push((H - 1) * W + x); }
  for (let y = 1; y < H - 1; y++) { border.push(y * W); border.push(y * W + W - 1); }
  const median = (arr: Float32Array) => {
    const vals = border.map((i) => arr[i]).sort((p, q) => p - q);
    return vals[vals.length >> 1];
  };
  const mR = median(R), mG = median(G), mB = median(B);

  const isBg = new Uint8Array(N);
  const sR = new Float32Array(N), sG = new Float32Array(N), sB = new Float32Array(N);
  // Original seed color, so slow drift can't walk the fill all the way into the subject.
  const oR = new Float32Array(N), oG = new Float32Array(N), oB = new Float32Array(N);
  const queue = new Int32Array(N);
  let head = 0, tail = 0;
  const seed = (i: number, limit: number) => {
    if (isBg[i] || dist(i, mR, mG, mB) > limit) return;
    isBg[i] = 1; sR[i] = oR[i] = R[i]; sG[i] = oG[i] = G[i]; sB[i] = oB[i] = B[i];
    queue[tail++] = i;
  };
  for (const i of border) {
    const onBottom = i >= (H - 1) * W;
    // Subjects are often cut off at the bottom (busts, selfies), so the bottom
    // edge only seeds where it really matches the background.
    seed(i, onBottom ? opt.tolerance : opt.tolerance * 1.6);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % W, y = (i / W) | 0;
    const nbrs = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
    for (const n of nbrs) {
      if (n < 0 || isBg[n]) continue;
      if (dist(n, sR[i], sG[i], sB[i]) > opt.tolerance) continue;
      if (dist(n, oR[i], oG[i], oB[i]) > opt.tolerance * 2.2) continue;
      isBg[n] = 1;
      oR[n] = oR[i]; oG[n] = oG[i]; oB[n] = oB[i];
      // Let the reference color drift slowly so gradient backgrounds still fill.
      sR[n] = sR[i] * 0.97 + R[n] * 0.03;
      sG[n] = sG[i] * 0.97 + G[n] * 0.03;
      sB[n] = sB[i] * 0.97 + B[n] * 0.03;
      queue[tail++] = n;
    }
  }

  const nbrs4 = (i: number) => {
    const x = i % W, y = (i / W) | 0;
    return [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
  };

  // ---------- 3. Clean a cutout: smooth edges, keep biggest piece, fill holes ----------
  const cleanMask = (raw: Uint8Array): { mask: Uint8Array; coverage: number } => {
    let m = new Uint8Array(N);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let c = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          c += raw[yy * W + xx]; n++;
        }
        m[y * W + x] = c * 2 > n ? 1 : 0;
      }
    }

    // Pieces are scored by size and how central they are. The best piece is kept,
    // plus any other big central piece (e.g. a head that the cutout split from the body).
    const label = new Int32Array(N).fill(-1);
    const pieces: { size: number; score: number; central: boolean }[] = [];
    for (let st = 0; st < N; st++) {
      if (!m[st] || label[st] >= 0) continue;
      const cur = pieces.length;
      head = 0; tail = 0; queue[tail++] = st; label[st] = cur;
      let size = 0, sx = 0, sy = 0;
      while (head < tail) {
        const i = queue[head++]; size++;
        sx += i % W; sy += (i / W) | 0;
        for (const n of nbrs4(i)) {
          if (n < 0 || !m[n] || label[n] >= 0) continue;
          label[n] = cur; queue[tail++] = n;
        }
      }
      const cx = (sx / size - fx) / (W / 2), cy = (sy / size - fy) / (H / 2);
      const off = Math.sqrt(cx * cx + cy * cy);
      pieces.push({ size, score: size * Math.max(0.15, 1 - off * 0.8), central: off < 0.75 });
    }
    let best = 0;
    for (let k = 1; k < pieces.length; k++) if (pieces[k].score > pieces[best].score) best = k;
    if (opt.focus && m[focusIdx]) best = label[focusIdx]; // the piece the user tapped always wins
    const keep = pieces.map((pc, k) => k === best || (pc.central && pc.size >= pieces[best]?.size * 0.12));
    for (let i = 0; i < N; i++) m[i] = label[i] >= 0 && keep[label[i]] ? 1 : 0;

    const outside = new Uint8Array(N);
    head = 0; tail = 0;
    for (const i of border) if (!m[i] && !outside[i]) { outside[i] = 1; queue[tail++] = i; }
    while (head < tail) {
      const i = queue[head++];
      for (const n of nbrs4(i)) {
        if (n < 0 || m[n] || outside[n]) continue;
        outside[n] = 1; queue[tail++] = n;
      }
    }
    let count = 0;
    for (let i = 0; i < N; i++) { if (!m[i] && !outside[i]) m[i] = 1; count += m[i]; }
    return { mask: m, coverage: count / N };
  };

  const usable = (c: number) => c >= 0.06 && c <= 0.9;

  // Edge strength of the photo; a good cutout's outline sits on strong edges.
  const grad = new Float32Array(N);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x;
    let g = 0;
    for (const [a, b] of [[i - 1, i + 1], [i - W, i + W]]) {
      const dr = R[a] - R[b], dg = G[a] - G[b], db = B[a] - B[b];
      g += Math.sqrt(dr * dr + dg * dg + db * db);
    }
    grad[i] = g;
  }
  const outlineScore = (m: Uint8Array) => {
    let sum = 0, n = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!m[i]) continue;
      if (!m[i - 1] || !m[i + 1] || !m[i - W] || !m[i + W]) { sum += grad[i]; n++; }
    }
    return n ? sum / n : 0;
  };

  const candidates: { mask: Uint8Array; coverage: number; score: number }[] = [];

  // Method A: background flood fill (great for plain or gradient backgrounds).
  const floodRaw = new Uint8Array(N);
  for (let i = 0; i < N; i++) floodRaw[i] = isBg[i] ? 0 : 1;
  const flood = cleanMask(floodRaw);
  if (usable(flood.coverage)) candidates.push({ ...flood, score: outlineScore(flood.mask) });

  // Method B: color groups (handles busy backgrounds). Colors that mostly show up
  // along the photo border are background; colors concentrated toward the middle are subject.
  {
    const K = 8;
    const cR = new Float32Array(K), cG = new Float32Array(K), cB = new Float32Array(K);
    for (let k = 0; k < K; k++) {
      const i = Math.floor(((k + 0.5) / K) * N);
      cR[k] = R[i]; cG[k] = G[i]; cB[k] = B[i];
    }
    const assign = new Uint8Array(N);
    for (let iter = 0; iter < 10; iter++) {
      const sr = new Float64Array(K), sg = new Float64Array(K), sb = new Float64Array(K), sn = new Float64Array(K);
      for (let i = 0; i < N; i++) {
        let best = 0, bestD = Infinity;
        for (let k = 0; k < K; k++) {
          const dd = dist(i, cR[k], cG[k], cB[k]);
          if (dd < bestD) { bestD = dd; best = k; }
        }
        assign[i] = best;
        sr[best] += R[i]; sg[best] += G[i]; sb[best] += B[i]; sn[best]++;
      }
      for (let k = 0; k < K; k++) if (sn[k] > 0) { cR[k] = sr[k] / sn[k]; cG[k] = sg[k] / sn[k]; cB[k] = sb[k] / sn[k]; }
    }
    const areaCount = new Float64Array(K), borderCount = new Float64Array(K), centerWeight = new Float64Array(K);
    for (let i = 0; i < N; i++) {
      const x = i % W, y = (i / W) | 0;
      const nx = (x - fx) / (W / 2), ny = (y - fy) / (H / 2);
      areaCount[assign[i]]++;
      centerWeight[assign[i]] += Math.max(0, 1 - Math.sqrt(nx * nx + ny * ny));
    }
    // Only the top edge and upper sides vote for "background": people and objects
    // are usually cut off by the bottom and lower sides of a photo.
    const bgVoters = border.filter((i) => ((i / W) | 0) < H * 0.6);
    for (const i of bgVoters) borderCount[assign[i]]++;
    const isSubjectColor = new Uint8Array(K);
    for (let k = 0; k < K; k++) {
      if (areaCount[k] === 0) continue;
      const borderDensity = borderCount[k] / bgVoters.length / (areaCount[k] / N);
      const centerDensity = centerWeight[k] / areaCount[k];
      isSubjectColor[k] = borderDensity < 0.8 && centerDensity > 0.25 ? 1 : 0;
    }
    // Colors right where the user tapped are subject, whatever the border says.
    if (opt.focus) {
      const near = new Float64Array(K);
      let total = 0;
      const rad = Math.max(2, Math.round(Math.min(W, H) * 0.06));
      for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
        const x = Math.round(fx) + dx, y = Math.round(fy) + dy;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        near[assign[y * W + x]]++; total++;
      }
      for (let k = 0; k < K; k++) if (near[k] / total > 0.12) isSubjectColor[k] = 1;
    }
    const clusterRaw = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      const x = i % W, y = (i / W) | 0;
      const nx = (x - fx) / (W * 0.5), ny = (y - fy) / (H * 0.55);
      clusterRaw[i] = isSubjectColor[assign[i]] && nx * nx + ny * ny <= 1 ? 1 : 0;
    }
    const alt = cleanMask(clusterRaw);
    if (usable(alt.coverage)) candidates.push({ ...alt, score: outlineScore(alt.mask) });
  }

  // Plain backgrounds (border colors close together) trust the flood fill; busy
  // backgrounds trust the color groups. Outline sharpness breaks any remaining tie.
  const spreadVals = border.map((i) => dist(i, mR, mG, mB)).sort((p, q) => p - q);
  const borderSpread = spreadVals[Math.floor(spreadVals.length * 0.6)];
  const plainBackground = borderSpread < opt.tolerance * 0.2;
  for (const c of candidates) {
    const isFlood = c.mask === flood.mask;
    if (isFlood === plainBackground) c.score += 1e6;
    if (opt.focus && c.mask[focusIdx]) c.score += 1e7;
  }
  candidates.sort((p, q) => q.score - p.score);
  let mask = candidates[0]?.mask ?? new Uint8Array(N);
  let coverage = candidates[0]?.coverage ?? 0;

  let usedFallbackMask = false;
  if (!usable(coverage)) {
    // Couldn't tell subject from background — use a centered oval so it never dead-ends.
    usedFallbackMask = true;
    let count = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const nx = (x - fx) / (W * 0.42), ny = (y - fy) / (H * 0.46);
      const v = nx * nx + ny * ny <= 1 ? 1 : 0;
      mask[y * W + x] = v; count += v;
    }
    coverage = count / N;
  }

  // ---------- 4. Distance from the silhouette edge (chamfer transform) ----------
  // Photo edges count as "inside" so a subject cut off by the frame keeps its thickness there.
  const INF = 1e9;
  const D = new Float32Array(N);
  for (let i = 0; i < N; i++) D[i] = mask[i] ? INF : 0;
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= W || y >= H ? INF : D[y * W + x]);
  const S2 = Math.SQRT2;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!mask[i]) continue;
    D[i] = Math.min(D[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + S2, at(x + 1, y - 1) + S2);
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x;
    if (!mask[i]) continue;
    D[i] = Math.min(D[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + S2, at(x - 1, y + 1) + S2);
  }
  let dMax = 1;
  for (let i = 0; i < N; i++) if (mask[i] && D[i] < INF && D[i] > dMax) dMax = D[i];
  for (let i = 0; i < N; i++) if (D[i] >= INF) D[i] = dMax; // whole edge filled by subject

  // ---------- 5. Heights ----------
  const blurL = blurField(L, W, H, Math.max(2, Math.round(W / 45)), 3);
  let Hf = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (!mask[i]) continue;
    const t = Math.min(1, D[i] / dMax);
    const body = dMax * Math.pow(t, 0.6); // rounded, puffy-at-center inflation
    const shading = (L[i] - blurL[i]) * dMax * 0.6 * opt.detail * Math.min(1, t * 4);
    Hf[i] = Math.max(0, body + shading);
  }
  // Smooth inside the cutout only.
  for (let pass = 0; pass < 2; pass++) {
    const out = new Float32Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!mask[i]) continue;
      let sum = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const j = yy * W + xx;
        if (!mask[j]) continue;
        sum += Hf[j]; n++;
      }
      out[i] = sum / n;
    }
    Hf = out;
  }

  // A silhouette pixel touches background inside the photo; front and back meet there.
  const isEdge = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!mask[i]) continue;
    if ((x > 0 && !mask[i - 1]) || (x < W - 1 && !mask[i + 1]) || (y > 0 && !mask[i - W]) || (y < H - 1 && !mask[i + W])) {
      isEdge[i] = 1;
      Hf[i] = 0;
    }
  }

  // ---------- 6. Mesh ----------
  const s = 2 / Math.max(W, H); // model is ~2 units on its longest side
  const zScale = s * opt.depth;
  const positions: number[] = [];
  const uvs: number[] = [];
  const front = new Int32Array(N).fill(-1);
  const back = new Int32Array(N).fill(-1);
  const addVert = (x: number, y: number, z: number) => {
    positions.push((x + 0.5 - W / 2) * s, (H / 2 - (y + 0.5)) * s, z);
    uvs.push((x + 0.5) / W, 1 - (y + 0.5) / H);
    return positions.length / 3 - 1;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (!mask[i]) continue;
    front[i] = addVert(x, y, Hf[i] * zScale);
    back[i] = isEdge[i] ? front[i] : addVert(x, y, -Hf[i] * zScale * opt.backDepth);
  }

  const frontTris: number[] = [];
  const backTris: number[] = [];
  const v3 = (k: number) => new THREE.Vector3(positions[k * 3], positions[k * 3 + 1], positions[k * 3 + 2]);
  // Push a triangle wound so its normal points along `facing`.
  const tri = (list: number[], a: number, b: number, c: number, facing: THREE.Vector3) => {
    if (a === b || b === c || a === c) return;
    const n = v3(b).sub(v3(a)).cross(v3(c).sub(v3(a)));
    if (n.lengthSq() === 0) return;
    if (n.dot(facing) < 0) list.push(a, c, b);
    else list.push(a, b, c);
  };
  const OUT_Z = new THREE.Vector3(0, 0, 1);
  const IN_Z = new THREE.Vector3(0, 0, -1);

  for (let y = 0; y < H - 1; y++) for (let x = 0; x < W - 1; x++) {
    const a = y * W + x, b = a + 1, c = a + W, d = c + 1;
    const present = [a, b, c, d].filter((k) => mask[k]);
    if (present.length === 4) {
      tri(frontTris, front[a], front[c], front[d], OUT_Z);
      tri(frontTris, front[a], front[d], front[b], OUT_Z);
      tri(backTris, back[a], back[c], back[d], IN_Z);
      tri(backTris, back[a], back[d], back[b], IN_Z);
    } else if (present.length === 3) {
      const [p, q, r] = present;
      tri(frontTris, front[p], front[q], front[r], OUT_Z);
      tri(backTris, back[p], back[q], back[r], IN_Z);
    }
  }

  // Cap the sides where the subject runs off the photo edge, so the mesh stays closed.
  const capEdge = (cells: number[], outward: THREE.Vector3) => {
    for (let k = 0; k < cells.length - 1; k++) {
      const p = cells[k], q = cells[k + 1];
      if (!mask[p] || !mask[q]) continue;
      tri(backTris, front[p], front[q], back[q], outward);
      tri(backTris, front[p], back[q], back[p], outward);
    }
  };
  const row = (y: number) => Array.from({ length: W }, (_, x) => y * W + x);
  const col = (x: number) => Array.from({ length: H }, (_, y) => y * W + x);
  capEdge(row(0), new THREE.Vector3(0, 1, 0));
  capEdge(row(H - 1), new THREE.Vector3(0, -1, 0));
  capEdge(col(0), new THREE.Vector3(-1, 0, 0));
  capEdge(col(W - 1), new THREE.Vector3(1, 0, 0));

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex([...frontTris, ...backTris]);
  geometry.addGroup(0, frontTris.length, 0);
  geometry.addGroup(frontTris.length, backTris.length, 1);
  geometry.translate(0, (H * s) / 2, 0); // stand on the ground at y = 0
  geometry.computeVertexNormals();

  // ---------- 7. Materials ----------
  const frontTex = new THREE.CanvasTexture(drawScaled(img, 1024));
  frontTex.colorSpace = THREE.SRGBColorSpace;
  const backTex = new THREE.CanvasTexture(drawScaled(img, 256, "blur(6px) brightness(0.8)"));
  backTex.colorSpace = THREE.SRGBColorSpace;
  const frontMat = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.75, metalness: 0, name: "photo_front" });
  const backMat = new THREE.MeshStandardMaterial({ map: backTex, roughness: 0.85, metalness: 0, name: "photo_back" });

  const mesh = new THREE.Mesh(geometry, [frontMat, backMat]);
  mesh.name = "photo_sculpt";
  const group = new THREE.Group();
  group.name = "photo_sculpt_root";
  group.add(mesh);

  // ---------- Mask preview ----------
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = W;
  maskCanvas.height = H;
  const mctx = maskCanvas.getContext("2d")!;
  const mImg = mctx.createImageData(W, H);
  for (let i = 0; i < N; i++) {
    const v = mask[i] ? 255 : 20;
    mImg.data[i * 4] = mask[i] ? R[i] : v;
    mImg.data[i * 4 + 1] = mask[i] ? G[i] : v;
    mImg.data[i * 4 + 2] = mask[i] ? B[i] : v;
    mImg.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(mImg, 0, 0);

  return {
    group,
    maskCanvas,
    coverage,
    usedFallbackMask,
    triangleCount: (frontTris.length + backTris.length) / 3,
  };
}

/** Free GPU memory for a sculpt group once it's replaced. */
export function disposeSculpt(group: THREE.Group) {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      for (const m of mats) {
        (m as THREE.MeshStandardMaterial).map?.dispose();
        m.dispose();
      }
    }
  });
}
