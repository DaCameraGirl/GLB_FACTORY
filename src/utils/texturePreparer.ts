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

  // Convert percentage box to actual image pixels
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;

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

  // Draw cropped face into a beautifully centered region
  // Base face size is 120x120, which maps perfectly onto the front of the head sphere without horizontal stretching
  const faceSizeOnCanvas = 120;
  const targetX = (256 - faceSizeOnCanvas) / 2;
  const targetY = (256 - faceSizeOnCanvas) / 2;

  tempCtx.drawImage(
    img,
    finalXmin, finalYmin, finalW, finalH, // Source
    targetX, targetY, faceSizeOnCanvas, faceSizeOnCanvas // Destination centered
  );

  // 3. Apply radial mask feathering or circular clipping
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = 256;
  maskCanvas.height = 256;
  const maskCtx = maskCanvas.getContext("2d");
  if (maskCtx) {
    const maxRadius = faceSizeOnCanvas / 2; // 60
    
    if (featherEdges) {
      // Smooth feathered radial gradient mask
      const innerRadius = maxRadius * (featherRadius / 100) * 0.45;
      const outerRadius = maxRadius * (featherRadius / 100) * 0.95;

      const gradient = maskCtx.createRadialGradient(
        128, 128, innerRadius,
        128, 128, outerRadius
      );
      gradient.addColorStop(0, "rgba(0,0,0,1)");
      gradient.addColorStop(0.5, "rgba(0,0,0,0.95)");
      gradient.addColorStop(0.8, "rgba(0,0,0,0.4)");
      gradient.addColorStop(1, "rgba(0,0,0,0)");

      maskCtx.fillStyle = gradient;
      maskCtx.fillRect(0, 0, 256, 256);
    } else {
      // Hard-edged circular clip mask
      maskCtx.fillStyle = "rgba(0,0,0,0)";
      maskCtx.fillRect(0, 0, 256, 256);
      maskCtx.fillStyle = "rgba(0,0,0,1)";
      maskCtx.beginPath();
      maskCtx.arc(128, 128, maxRadius, 0, Math.PI * 2);
      maskCtx.fill();
    }

    // Mask the raw face photo
    tempCtx.globalCompositeOperation = "destination-in";
    tempCtx.drawImage(maskCanvas, 0, 0);
  }

  // 4. Paint the feathered face over the skin background
  ctx.drawImage(tempCanvas, 0, 0);

  return canvas;
}
