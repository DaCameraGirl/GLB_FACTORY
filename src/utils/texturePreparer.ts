/**
 * Prepares the face texture by cropping from the original image,
 * blending it with the base skin color, and applying a feathered radial
 * mask so it blends seamlessly onto the head mesh without dark background bleed.
 */
export function prepareFaceTexture(
  img: HTMLImageElement,
  box: [number, number, number, number], // [ymin, xmin, ymax, xmax] (0 to 100)
  skinColor: string,
  featherEdges: boolean,
  featherRadius: number, // 0 to 100
  offsetX: number = 0, // shift crop horizontally
  offsetY: number = 0, // shift crop vertically
  scale: number = 1.0  // manual crop scaling zoom
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return canvas;

  // 1. Fill background with base skin color
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 256, 256);

  // Convert percentage box to actual image pixels
  const imgW = img.naturalWidth || img.width || img.clientWidth || 256;
  const imgH = img.naturalHeight || img.height || img.clientHeight || 256;

  let ymin = (box[0] / 100) * imgH;
  let xmin = (box[1] / 100) * imgW;
  let ymax = (box[2] / 100) * imgH;
  let xmax = (box[3] / 100) * imgW;

  // Keep dimensions bounded
  xmin = Math.max(0, xmin);
  ymin = Math.max(0, ymin);
  xmax = Math.min(imgW, xmax);
  ymax = Math.min(imgH, ymax);

  let faceW = xmax - xmin;
  let faceH = ymax - ymin;

  const size = Math.max(faceW, faceH);
  const centerX = xmin + faceW / 2;
  const centerY = ymin + faceH / 2;

  // Apply manual scaling and shifting
  const finalSize = size * scale;
  const finalCenterX = centerX + (offsetX / 100) * size;
  const finalCenterY = centerY + (offsetY / 100) * size;

  const finalXmin = Math.max(0, finalCenterX - finalSize / 2);
  const finalYmin = Math.max(0, finalCenterY - finalSize / 2);
  const finalW = Math.min(imgW - finalXmin, finalSize);
  const finalH = Math.min(imgH - finalYmin, finalSize);

  // 2. Create temporary canvas for the cropped face
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 256;
  tempCanvas.height = 256;
  const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
  if (!tempCtx) return canvas;

  // Center face crop (target size 120..190px on canvas)
  const faceSizeOnCanvas = 120 + (featherRadius / 100) * 70;
  const targetX = (256 - faceSizeOnCanvas) / 2;
  const targetY = (256 - faceSizeOnCanvas) / 2 - 4;

  if (finalW > 0 && finalH > 0 && imgW > 0 && imgH > 0) {
    try {
      tempCtx.drawImage(
        img,
        finalXmin, finalYmin, finalW, finalH, // Source
        targetX, targetY, faceSizeOnCanvas, faceSizeOnCanvas // Destination
      );
    } catch (drawErr) {
      console.warn("Skipped drawing raw crop due to canvas drawImage limits", drawErr);
    }
  }

  // 3. Apply radial mask feathering
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 256;
  maskCanvas.height = 256;
  const maskCtx = maskCanvas.getContext("2d");
  if (maskCtx) {
    const maxRadius = faceSizeOnCanvas / 2;
    const innerRadius = maxRadius * (featherEdges ? 0.55 : 0.85);
    const outerRadius = maxRadius;

    const gradient = maskCtx.createRadialGradient(
      128, 124, innerRadius,
      128, 124, outerRadius
    );
    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.5, "rgba(0,0,0,0.85)");
    gradient.addColorStop(0.8, "rgba(0,0,0,0.35)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    maskCtx.fillStyle = gradient;
    maskCtx.fillRect(0, 0, 256, 256);

    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.drawImage(maskCanvas, 0, 0);
  }

  // 4. Suppress dark photo background/clothing pixels outside core face region
  // so dark hoodies/backgrounds fade cleanly into skinColor instead of stamping a black disc.
  const tempImgData = tempCtx.getImageData(0, 0, 256, 256);
  const data = tempImgData.data;
  const cx = 128, cy = 124;
  const coreRadius = (faceSizeOnCanvas / 2) * 0.45; // inner face skin region (eyes/nose/mouth)

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      const alpha = data[idx + 3];
      if (alpha === 0) continue;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > coreRadius) {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = r * 0.299 + g * 0.587 + b * 0.114;

        if (lum < 75) {
          const fadeFactor = Math.max(0, (lum - 20) / 55);
          const distFade = Math.max(0, 1 - (dist - coreRadius) / ((faceSizeOnCanvas / 2) - coreRadius));
          data[idx + 3] = Math.round(alpha * Math.min(fadeFactor, distFade));
        }
      }
    }
  }
  tempCtx.putImageData(tempImgData, 0, 0);

  // 5. Paint feathered face over skin background
  ctx.drawImage(tempCanvas, 0, 0);

  // 6. Guarantee pure skin on corners & margins for side/back UV falloff
  ctx.fillStyle = skinColor;
  const corner = 32;
  ctx.fillRect(0, 0, corner, corner);
  ctx.fillRect(256 - corner, 0, corner, corner);
  ctx.fillRect(0, 256 - corner, corner, corner);
  ctx.fillRect(256 - corner, 256 - corner, corner, corner);

  return canvas;
}
