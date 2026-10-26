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

// Helper to generate template marketing copy if all AI models are temporarily unavailable
function generateFallbackMarketingPosts(
  items: any[],
  targetPlatforms: string[],
  campaignTone: string,
  customPrompt?: string
): Record<string, string> {
  const itemsList = items
    .map(
      (it, idx) =>
        `• ${it.description} - ₦${(it.price || 0).toLocaleString()} ${it.location ? `(${it.location} Store)` : ""}`
    )
    .join("\n");

  const promoLine = customPrompt ? `\n📌 Note: ${customPrompt}\n` : "";
  const result: Record<string, string> = {};

  for (const platform of targetPlatforms) {
    if (platform === "WhatsApp") {
      result["WhatsApp"] = `🔥 *EXCLUSIVE SHOWROOM OFFER - LIMITED STOCK!* 🔥\n\nUpgrade your smart living space today with top-rated solutions from *Puido Smart Solutions*! ⚡\n\n📦 *Featured Items Available Now:*\n${itemsList}\n${promoLine}\n✅ 100% Genuine & Tested\n✅ Nationwide Delivery & Same-Day Dispatch\n✅ Professional Installation Available\n\n📲 *Reply to this message or WhatsApp 08131927116 to order yours today!*`;
    } else if (platform === "Instagram") {
      result["Instagram"] = `✨ Transform your space with effortless smart technology! ✨\n\nExperience luxury, convenience, and superior control with our certified product collection:\n\n${itemsList}\n${promoLine}\n🏢 Visit our Ikeja showroom or enjoy fast delivery across Nigeria.\n\n💬 Send us a DM or click the link in bio to order via WhatsApp: 08131927116 📲\n\n#SmartHomeNigeria #LagosLiving #PuidoSmart #SmartSecurity #HomeAutomationNigeria #Ikeja #InteriorDesignLagos`;
    } else if (platform === "Twitter") {
      result["Twitter"] = `Modernize your setup with genuine smart tech from Puido Smart Solutions! 🚀\n\n${itemsList}\n${promoLine}\n📦 Ready for same-day pickup in Ikeja & nationwide delivery.\n\n👉 WhatsApp 08131927116 to order now!\n\n#SmartTech #Lagos #PuidoSmartSolutions`;
    } else if (platform === "LinkedIn") {
      result["LinkedIn"] = `🏢 Enterprise & Residential Smart Infrastructure Solutions\n\nAt Puido Smart Solutions, we equip modern residential homes, hotels, and corporate offices with high-performance automation hardware.\n\nFeatured inventory:\n${itemsList}\n${promoLine}\nFor project procurement, bulk contractor rates, and installation consultations, reach out via WhatsApp at 08131927116 or connect with our technical sales team.\n\n#BuildingAutomation #SmartOffices #NigerianContractors #PuidoSmart`;
    } else if (platform === "TikTok") {
      result["TikTok"] = `🔥 Wait till you see what this smart upgrade does! \n\nCheck these out before they sell out:\n${itemsList}\n${promoLine}\nTap the link in bio or WhatsApp 08131927116 to get yours delivered today! 🚀\n\n#SmartHomeHacks #TechTok #NigeriaTech #LagosShopping`;
    } else {
      result[platform] = `✨ Special Showcase from Puido Smart Solutions:\n\n${itemsList}\n${promoLine}\nContact 08131927116 via WhatsApp for orders and fast delivery!`;
    }
  }

  return result;
}

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

    // Try primary and fallback models in order of speed and stability
    const candidateModels = [
      "gemini-3.5-flash",
      "gemini-3.1-flash-lite",
      "gemini-flash-latest",
      "gemini-3.8-flash"
    ];

    let generatedText: string | null = null;
    let lastError: any = null;

    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });

        // Safely extract text (getter in @google/genai)
        const rawText = typeof (response as any).text === "function" ? (response as any).text() : response.text;
        if (rawText && typeof rawText === "string" && rawText.trim().length > 0) {
          generatedText = rawText.trim();
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} failed or high-demand, trying next fallback...`, err.message || err);
      }
    }

    if (generatedText) {
      // Clean possible markdown code fences
      const cleaned = generatedText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      try {
        const posts = JSON.parse(cleaned);
        return res.json({ posts });
      } catch (parseErr) {
        console.warn("JSON parsing error on AI output, falling back to structured generator:", parseErr);
      }
    }

    // Graceful fallback to guaranteed high-converting campaign
    console.log("Using guaranteed template campaign fallback due to AI model unavailability.");
    const fallbackPosts = generateFallbackMarketingPosts(items, targetPlatforms, campaignTone, customPrompt);
    return res.json({ posts: fallbackPosts, note: "Generated via template copywriter" });
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
