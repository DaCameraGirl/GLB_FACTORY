var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "20mb" }));
var apiKey = process.env.GEMINI_API_KEY;
var ai = null;
if (apiKey) {
  ai = new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.post("/api/crop-face", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided" });
    }
    if (!ai) {
      return res.status(500).json({
        error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your secrets."
      });
    }
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const cleanMimeType = mimeType || "image/jpeg";
    const prompt = `Locate the person's face in the image and detect their key visual features for a 3D blocky avatar.
Return a JSON object with:
1. 'face_box': [ymin, xmin, ymax, xmax] representing the tight bounding box around the face (numbers from 0 to 100, representing percentage of image height/width. Give a buffer around the face including hair/chin).
2. 'skin_tone': a hex color code (e.g., '#f5c396') matching their skin.
3. 'hair_color': a hex color code (e.g., '#322315') matching their hair.
4. 'clothing_color': a hex color code (e.g., '#3b82f6') matching their clothing or a nice complementary color.
5. 'gender_style': a string recommendation for hairstyle ("short", "long", "afro", "bald", "ponytail", "cap").

Provide ONLY the raw JSON object, following this schema strictly, without markdown backticks or any other text.`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: cleanMimeType,
            data: base64Data
          }
        },
        {
          text: prompt
        }
      ],
      config: {
        responseMimeType: "application/json"
      }
    });
    const textOutput = response.text || "{}";
    let data;
    try {
      const jsonString = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse Gemini output:", textOutput);
      return res.status(500).json({
        error: "Failed to parse visual details from the model.",
        raw: textOutput
      });
    }
    return res.json(data);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
setupServer();
//# sourceMappingURL=server.cjs.map
