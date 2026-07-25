/**
 * Prepares the face texture by cropping from the original image,
 * blending it with the base skin color, and optionally applying
 * a feathered radial mask so it blends seamlessly onto the head mesh.
 */
export function prepareFaceTexture(
  img: HTMLImageElement,
  box: [number, number, number, number], // [ymin, xmin, ymax, xmax] (0 to 100)
  skinColor: string,
  featherEdges: boolean,
  featherRadius: number, // 0 to 100 (percentage size of the solid center)
  offsetX: number = 0, // shift crop horizontally (percent of face size)
  offsetY: number = 0, // shift crop vertically
  scale: number = 1.0  // manual crop scaling zoom
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  // 1. Fill background with base skin color
  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, 256, 256);

  // Convert percentage box to actual image pixels (with client-side fallback)
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

  // Adjust for square crop aspect ratio to prevent face stretching
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

  // 2. Create temporary canvas for the cropped raw face
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 256;
  tempCanvas.height = 256;
  const tempCtx = tempCanvas.getContext("2d");
  if (!tempCtx) return canvas;

  // Draw cropped face into a beautifully centered region.
  // featherRadius doubles as the coverage control: higher values grow the drawn
  // face toward filling the entire 256x256 head texture, not just a small fixed circle.
  const faceSizeOnCanvas = 80 + (featherRadius / 100) * 176; // 80..256 (full coverage)
  const targetX = (256 - faceSizeOnCanvas) / 2;
  const targetY = (256 - faceSizeOnCanvas) / 2;

  if (finalW > 0 && finalH > 0 && imgW > 0 && imgH > 0) {
    try {
      tempCtx.drawImage(
        img,
        finalXmin, finalYmin, finalW, finalH, // Source
        targetX, targetY, faceSizeOnCanvas, faceSizeOnCanvas // Destination centered
      );
    } catch (drawErr) {
      console.warn("Skipped drawing raw crop due to canvas drawImage limits", drawErr);
    }
  }

  // 3. Apply radial mask feathering or circular clipping
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 256;
  maskCanvas.height = 256;
  const maskCtx = maskCanvas.getContext("2d");
  if (maskCtx) {
    const maxRadius = faceSizeOnCanvas / 2;

    if (featherEdges) {
      // Wide soft falloff into skin so the photo wraps the skull instead of reading as a sticker.
      // Inner solid disc ~62% of radius; outer fade to transparent at the rim.
      const innerRadius = maxRadius * 0.62;
      const outerRadius = maxRadius * 0.98;

      const gradient = maskCtx.createRadialGradient(
        128, 128, innerRadius,
        128, 128, outerRadius
      );
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.45, "rgba(0,0,0,0.92)");
      gradient.addColorStop(0.75, "rgba(0,0,0,0.45)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      maskCtx.fillStyle = gradient;
      maskCtx.fillRect(0, 0, 256, 256);
    } else {
      // Soft-edged circular clip (slight feather even in "hard" mode to avoid alias ring)
      const outerRadius = maxRadius * 0.99;
      const gradient = maskCtx.createRadialGradient(
        128, 128, outerRadius * 0.88,
        128, 128, outerRadius
      );
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      maskCtx.fillStyle = gradient;
      maskCtx.fillRect(0, 0, 256, 256);
    }

    // Mask the raw face photo
    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.drawImage(maskCanvas, 0, 0);
  }

  // 4. Paint the feathered face over the skin background
  ctx.drawImage(tempCanvas, 0, 0);

  // 5. Guarantee pure skin in the four corners (used by side/back UV falloff)
  ctx.fillStyle = skinColor;
  const corner = 18;
  ctx.fillRect(0, 0, corner, corner);
  ctx.fillRect(256 - corner, 0, corner, corner);
  ctx.fillRect(0, 256 - corner, corner, corner);
  ctx.fillRect(256 - corner, 256 - corner, corner, corner);

  return canvas;
}
