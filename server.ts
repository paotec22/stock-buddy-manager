import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: "5mb" }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// API endpoint for AI Marketing Agent
app.post("/api/marketing/generate-posts", async (req, res) => {
  try {
    const { items, platforms, tone, customPrompt } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Please select at least one inventory item for marketing." });
    }

    const targetPlatforms = platforms && platforms.length > 0 ? platforms : ["WhatsApp", "Instagram", "Twitter"];
    const campaignTone = tone || "High-Urgency Sales & Professional";

    const inventorySummary = items
      .map(
        (it: any, idx: number) =>
          `${idx + 1}. ${it.description} | Price: ₦${(it.price || 0).toLocaleString()} | Stock: ${it.quantity ?? 'In Stock'} | Location: ${it.location || 'Showroom'} ${it.features ? `| Features: ${it.features.join(', ')}` : ''}`
      )
      .join("\n");

    const prompt = `You are an expert Social Media Growth Marketer and Copywriter for an enterprise showroom and smart solutions distributor ("Puido Smart Solutions").
Generate high-converting, professional, and engaging marketing social media posts for the following selected inventory items.

Selected Inventory Items:
${inventorySummary}

Target Platforms to generate content for: ${targetPlatforms.join(", ")}
Campaign Tone & Style: ${campaignTone}
${customPrompt ? `Additional User Instructions / Promo: ${customPrompt}` : ""}

For EACH requested platform (${targetPlatforms.join(", ")}), provide:
1. A catchy hook / headline with relevant emojis.
2. The main body copy highlighting the value proposition, specifications, and urgency/benefits.
3. A clear Call to Action (CTA) pointing customers to order via WhatsApp (08131927116) or visit our showroom.
4. Relevant hashtags (where applicable).

Format your response as valid JSON object mapping each platform name (e.g. "WhatsApp", "Instagram", "Twitter", "LinkedIn", "TikTok") to its generated post content (string). Make the copy sound professional, human, persuasive, and tailored specifically to each platform's best practices.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });

    const text = response.text();
    if (!text) {
      throw new Error("No response generated from AI model.");
    }

    const posts = JSON.parse(text);
    return res.json({ posts });
  } catch (error: any) {
    console.error("Marketing generation error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate marketing campaign" });
  }
});

async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  const port = process.env.PORT || 3000;

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
