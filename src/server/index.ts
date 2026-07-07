import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit for base64 images
app.use(express.json({ limit: "20mb" }));

// Initialize Gemini client (server-side only)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// API endpoint for face detection and visual feature extraction
app.post("/api/crop-face", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "No image data provided" });
    }

    if (!ai) {
      return res.status(500).json({
        error: "Gemini API key is not configured. Please add GEMINI_API_KEY to your secrets.",
      });
    }

    // Extract raw base64 data (strip data URI prefix if present)
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
            data: base64Data,
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: "application/json",
      },
    });

    const textOutput = response.text || "{}";
    let data;
    try {
      // Remove any markdown code block formatting if returned despite request
      const jsonString = textOutput.replace(/```json/g, "").replace(/```/g, "").trim();
      data = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse Gemini output:", textOutput);
      return res.status(500).json({
        error: "Failed to parse visual details from the model.",
        raw: textOutput,
      });
    }

    return res.json(data);
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Setup Vite Dev Server / Static file server
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

setupServer();
