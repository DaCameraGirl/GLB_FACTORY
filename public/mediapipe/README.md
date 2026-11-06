# MediaPipe assets for local portrait fitting

Copyright The MediaPipe Authors. Licensed under Apache License 2.0; see `LICENSE`.
The pinned JavaScript dependency is `@mediapipe/tasks-vision` 1.2.2. The two WASM
runtime files are copied without modification from that package's `wasm/` folder.
The package and these assets must be updated together.

`face_landmarker.task` is Google's official float16/v1 face-landmarker bundle.
`canonical_face_model.obj` is Google's 468-vertex, 898-triangle canonical topology.
Asset URLs and SHA-256 checksums are recorded in `sources.json`.
The [official Face Mesh V2 model card](https://storage.googleapis.com/mediapipe-assets/Model%20Card%20MediaPipe%20Face%20Mesh%20V2.pdf)
states Apache 2.0 licensing. See the [official project](https://github.com/google-ai-edge/mediapipe)
and [package instructions](https://github.com/google-ai-edge/mediapipe/blob/master/mediapipe/tasks/web/vision/README.md).

Photos are processed on the device, not sent to a model service. The MediaPipe
package can send performance/utilization metrics to Google; local hosting of
model files does not disable that behavior. See the [official privacy notice](https://goo.gle/mediapipe-privacy).
This is a fitted facial surface with estimated relative depth, not a full scan
of hidden hair, ears, or the back of the head. Clear, front-facing portraits work best.
