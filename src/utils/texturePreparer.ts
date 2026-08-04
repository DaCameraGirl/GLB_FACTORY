/**
 * Prepares the face texture by cropping from the original image,
 * blending it with the base skin color, and applying an anatomical face-oval
 * (ellipse) mask so it blends seamlessly onto the head mesh without dark background bleed.
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

  // Preserve aspect ratio — square crop from center of detected face box
  // (no stretching faces into squares)
  const cropSize = finalSize;
  const cropX = Math.max(0, finalCenterX - cropSize / 2);
  const cropY = Math.max(0, finalCenterY - cropSize / 2);
  const finalXmin = cropX;
  const finalYmin = cropY;
  const finalW = Math.min(imgW - finalXmin, cropSize);
  const finalH = Math.min(imgH - finalYmin, cropSize);

  // 2. Create temporary canvas for the cropped face
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 256;
  tempCanvas.height = 256;
  const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
  if (!tempCtx) return canvas;

  // Center face crop — bigger face, less background bleed
  const faceSizeOnCanvas = 140 + (featherRadius / 100) * 45;
  const targetX = (256 - faceSizeOnCanvas) / 2;
  const targetY = (256 - faceSizeOnCanvas) / 2 - 4;

  if (finalW > 0 && finalH > 0 && imgW > 0 && imgH > 0) {
    try {
      // Aspect-ratio-preserving center crop: use min(finalW,finalH) so faces don't squash
      const srcSize = Math.min(finalW, finalH);
      const srcX = finalXmin + (finalW - srcSize) / 2;
      const srcY = finalYmin + (finalH - srcSize) / 2;
      tempCtx.drawImage(
        img,
        srcX, srcY, srcSize, srcSize, // Source (square, center-cropped)
        targetX, targetY, faceSizeOnCanvas, faceSizeOnCanvas // Destination
      );
    } catch (drawErr) {
      console.warn("Skipped drawing raw crop due to canvas drawImage limits", drawErr);
    }
  }

  // 3. Apply an Anatomical Face-Oval (Ellipse) Feather Mask
  // Vertical radius (ry) covers forehead to chin; Horizontal radius (rx) covers cheek to cheek.
  // This clips out dark photo backgrounds and clothing on the left/right before they reach the sides of the head.
  const tempImgData = tempCtx.getImageData(0, 0, 256, 256);
  const data = tempImgData.data;

  const cx = 128;
  const cy = 122;
  const ry = (faceSizeOnCanvas / 2) * 0.92; // vertical radius
  const rx = (faceSizeOnCanvas / 2) * 0.78; // horizontal radius — wider, stops cutting off cheeks/jaw
  const coreFactor = featherEdges ? 0.68 : 0.88; // solid core inner ratio — less aggressive edge fade

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 256; x++) {
      const idx = (y * 256 + x) * 4;
      const alpha = data[idx + 3];
      if (alpha === 0) continue;

      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const dist = Math.sqrt(nx * nx + ny * ny);

      if (dist >= 1.0) {
        // Outside the face oval: 100% transparent (blends to skinColor)
        data[idx + 3] = 0;
      } else if (dist > coreFactor) {
        // Soft feather band between core and outer oval edge
        const feather = (1.0 - dist) / (1.0 - coreFactor);
        const smoothFeather = feather * feather * (3 - 2 * feather); // smoothstep
        data[idx + 3] = Math.round(alpha * smoothFeather);
      }
    }
  }

  tempCtx.putImageData(tempImgData, 0, 0);

  // 4. Paint feathered face oval over base skin color
  ctx.drawImage(tempCanvas, 0, 0);

  // 5. Guarantee pure skin on corners & margins for side/back UV falloff
  ctx.fillStyle = skinColor;
  const corner = 36;
  ctx.fillRect(0, 0, corner, corner);
  ctx.fillRect(256 - corner, 0, corner, corner);
  ctx.fillRect(0, 256 - corner, corner, corner);
  ctx.fillRect(256 - corner, 256 - corner, corner, corner);

  return canvas;
}
