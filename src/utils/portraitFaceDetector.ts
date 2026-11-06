import type { FaceLandmarker } from "@mediapipe/tasks-vision";

export interface PortraitLandmark {
  x: number;
  y: number;
  /** Relative depth in image-width units; smaller values are nearer the camera. */
  z: number;
}

export interface PortraitFaceResult {
  landmarks: PortraitLandmark[];
  imageAspect: number;
  /** [ymin, xmin, ymax, xmax], percentages matching the existing face-box format. */
  faceBox: [number, number, number, number];
}

type PortraitSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap | string;
type StatusCallback = (message: string) => void;
type FailureCode = "IMAGE" | "UNSUPPORTED" | "MODEL" | "NO_FACE" | "FIT";

export class PortraitFaceError extends Error {
  constructor(public readonly code: FailureCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PortraitFaceError";
  }
}

let detectorPromise: Promise<FaceLandmarker> | undefined;
let loadedDetector: FaceLandmarker | undefined;
let cancelPendingLoad: (() => void) | undefined;
let loadGeneration = 0;
const MAX_IMAGE_EDGE = 1024;
const MODEL_LOAD_TIMEOUT_MS = 60_000;

function assetUrl(path: string): string {
  return new URL(`${import.meta.env.BASE_URL}mediapipe/${path}`, document.baseURI).href;
}

async function createDetector(): Promise<FaceLandmarker> {
  if (typeof WebAssembly === "undefined") {
    throw new PortraitFaceError("UNSUPPORTED", "This browser cannot run face fitting. Try a current version of Chrome, Edge, Firefox, or Safari.");
  }
  // This pinned release requires SIMD; check before attempting initialization.
  const simd = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11]);
  if (!WebAssembly.validate(simd)) {
    throw new PortraitFaceError("UNSUPPORTED", "Face fitting needs a newer browser on this device. Please update your browser and try again.");
  }
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const files = await FilesetResolver.forVisionTasks(assetUrl("wasm"));
  // CPU inference also works on devices where a GPU delegate is unavailable.
  return FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: assetUrl("face_landmarker.task"), delegate: "CPU" },
    runningMode: "IMAGE",
    numFaces: 1,
    minFaceDetectionConfidence: 0.5,
    minFacePresenceConfidence: 0.5,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });
}

async function getDetector(onStatus?: StatusCallback): Promise<FaceLandmarker> {
  if (loadedDetector) return loadedDetector;
  onStatus?.("Loading the face-fitting model on this device…");
  if (!detectorPromise) {
    const generation = ++loadGeneration;
    let abandoned = false;
    const pending = new Promise<FaceLandmarker>((resolve, reject) => {
      const fail = (error: unknown) => {
        if (generation === loadGeneration) cancelPendingLoad = undefined;
        reject(error instanceof PortraitFaceError ? error : new PortraitFaceError(
          "MODEL", "The face-fitting model could not load. Check your connection and try fitting again.", { cause: error },
        ));
      };
      const timer = setTimeout(() => {
        abandoned = true;
        fail(new PortraitFaceError("MODEL", "The face-fitting model took too long to load. Check your connection and try fitting again."));
      }, MODEL_LOAD_TIMEOUT_MS);
      cancelPendingLoad = () => {
        abandoned = true;
        clearTimeout(timer);
        fail(new PortraitFaceError("MODEL", "Face fitting was stopped. Please try fitting again."));
      };
      createDetector().then((detector) => {
        clearTimeout(timer);
        if (abandoned || generation !== loadGeneration) {
          detector.close();
          return;
        }
        cancelPendingLoad = undefined;
        loadedDetector = detector;
        resolve(detector);
      }, (cause: unknown) => {
        clearTimeout(timer);
        if (!abandoned) fail(cause);
      });
    });
    detectorPromise = pending.catch((cause: unknown) => {
      if (generation === loadGeneration) detectorPromise = undefined;
      throw cause;
    });
  }
  return detectorPromise;
}

async function decodeSource(source: PortraitSource): Promise<Exclude<PortraitSource, string>> {
  if (typeof source !== "string") {
    if (source instanceof HTMLImageElement && !source.complete) {
      try { await source.decode(); }
      catch (cause) { throw new PortraitFaceError("IMAGE", "This portrait could not be opened. Try a JPG, PNG, or WebP image.", { cause }); }
    }
    return source;
  }
  // Uploaded pixels must never be fetched from or posted to a remote service.
  if (!source.startsWith("data:image/") && !source.startsWith("blob:")) {
    throw new PortraitFaceError("IMAGE", "Please choose a portrait from your device to fit its face.");
  }
  const image = new Image();
  image.src = source;
  try { await image.decode(); }
  catch (cause) { throw new PortraitFaceError("IMAGE", "This portrait could not be opened. Try a JPG, PNG, or WebP image.", { cause }); }
  return image;
}

/** Fits an uploaded portrait locally. The original photo is neither fetched remotely nor uploaded. */
export async function detectPortraitFace(source: PortraitSource, onStatus?: StatusCallback): Promise<PortraitFaceResult> {
  const image = await decodeSource(source);
  const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  if (!(width > 0 && height > 0)) {
    throw new PortraitFaceError("IMAGE", "This image has no readable pixels. Please choose another portrait.");
  }
  const detector = await getDetector(onStatus);
  onStatus?.("Finding the shape of your face…");
  // Let React paint the status before the synchronous single-image inference.
  await new Promise<void>((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new PortraitFaceError("UNSUPPORTED", "This browser could not prepare the portrait. Reload the page and try again.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  try {
    const points = detector.detect(canvas).faceLandmarks[0];
    if (!points || points.length < 468) {
      throw new PortraitFaceError("NO_FACE", "No clear face was found. Use a well-lit portrait facing the camera, with the whole face visible.");
    }
    if (points.some(({ x, y, z }) => !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z))) {
      throw new PortraitFaceError("FIT", "The face fit was incomplete. Try a clearer, front-facing portrait.");
    }
    const landmarks = points.map(({ x, y, z }) => ({ x, y, z }));
    const skin = landmarks.slice(0, 468);
    const clampPercent = (value: number) => Math.max(0, Math.min(100, value * 100));
    const minX = Math.min(...skin.map((point) => point.x));
    const maxX = Math.max(...skin.map((point) => point.x));
    const minY = Math.min(...skin.map((point) => point.y));
    const maxY = Math.max(...skin.map((point) => point.y));
    onStatus?.("Face shape fitted. Building your 3D character…");
    return {
      landmarks,
      imageAspect: width / height,
      faceBox: [clampPercent(minY), clampPercent(minX), clampPercent(maxY), clampPercent(maxX)],
    };
  } catch (cause) {
    if (cause instanceof PortraitFaceError) throw cause;
    throw new PortraitFaceError("FIT", "The face could not be fitted on this device. Try a smaller, clear portrait or reload the page.", { cause });
  } finally {
    canvas.width = 1;
    canvas.height = 1;
  }
}

/** Release the cached model when the app no longer needs portrait fitting. */
export async function disposePortraitFaceDetector(): Promise<void> {
  cancelPendingLoad?.();
  cancelPendingLoad = undefined;
  loadGeneration += 1;
  detectorPromise = undefined;
  loadedDetector?.close();
  loadedDetector = undefined;
}
