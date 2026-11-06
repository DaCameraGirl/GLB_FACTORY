/** Read and decode before enabling either 3D workflow. */
export async function readImageFile(file: File): Promise<{ dataUrl: string; image: HTMLImageElement }> {
  if (!file.type.startsWith("image/") && !(file.type === "" && /\.(png|jpe?g|webp|gif|avif|bmp)$/i.test(file.name))) {
    throw new Error("Please choose an image file, such as JPG, PNG, or WebP.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read this image. Please choose it again."));
    };
    reader.onerror = () => reject(new Error("Could not read this image. Please choose it again."));
    reader.onabort = () => reject(new Error("Image loading was interrupted. Please choose it again."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) resolve(img);
      else reject(new Error("This image has no readable pixels. Try a JPG or PNG copy."));
    };
    img.onerror = () => reject(new Error("This browser could not open the image. Try a JPG, PNG, or WebP copy."));
    img.src = dataUrl;
  });
  return { dataUrl, image };
}
