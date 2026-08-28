import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

// AI advisor endpoint (ported from rabnix-estate-v1) — powers the v1 AI Valuation modal and the
// "Rabnix Genie" chat drawer. DISABLED BY DEFAULT (docs/frontend-port-v1.md §8.3): the route only
// calls Gemini when GEMINI_API_KEY is set; with no key it returns a clean { success:false } 503 and
// the client modals degrade gracefully (they already render the error text / a fallback reply).
// Model is env-overridable (GEMINI_MODEL) and defaults to a current, generally-available flash model
// — v1's placeholder `gemini-3.7-flash` is not a real model id.

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

let genAIInstance: GoogleGenAI | null = null;
function getGenAI(apiKey: string) {
  if (!genAIInstance) {
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });
  }
  return genAIInstance;
}

type ValuationPayload = {
  city?: string;
  locality?: string;
  category?: string;
  areaSqFt?: number;
  bhk?: number;
  furnishing?: string;
  age?: string;
};

type ChatPayload = {
  userQuery?: string;
  contextProperty?: {
    title?: string;
    city?: string;
    locality?: string;
    priceFormatted?: string;
    pricePerSqFt?: number;
    bhk?: number;
    carpetAreaSqFt?: number;
    reraId?: string;
  } | null;
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Feature not provisioned — respond in the shape the client already handles, no upstream call.
    return NextResponse.json(
      {
        success: false,
        error: "AI features are disabled. Set GEMINI_API_KEY to enable AI valuation and Rabnix Genie.",
      },
      { status: 503 },
    );
  }

  try {
    const body = (await req.json()) as { action?: string; payload?: unknown };
    const { action, payload } = body;
    const ai = getGenAI(apiKey);

    // Action 1: AI Property Valuation & Fair Market Price Estimator
    if (action === "valuation") {
      const p = (payload ?? {}) as ValuationPayload;

      const prompt = `You are Rabnix Estate India's Senior Chief Real Estate Valuer and Market Analyst.
Evaluate fair market pricing, rental yields, and investment forecast for the following Indian property:
- City: ${p.city || "Mumbai"}
- Locality: ${p.locality || "Central"}
- Category: ${p.category || "Apartment"}
- Carpet Area: ${p.areaSqFt || 1000} sq.ft
- BHK: ${p.bhk || 2} BHK
- Furnishing: ${p.furnishing || "Semi-Furnished"}
- Age: ${p.age || "New"}

Provide accurate, realistic Indian real estate valuation metrics with INR figures, yield percentages, market drivers, pros and cons.`;

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            "You are Rabnix Estate AI Property Valuation Engine. Return accurate, data-backed Indian real estate analytics in structured JSON.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedPriceMin: { type: Type.NUMBER, description: "Minimum estimated market price in INR total" },
              estimatedPriceMax: { type: Type.NUMBER, description: "Maximum estimated market price in INR total" },
              fairValueEstimate: { type: Type.NUMBER, description: "Fair valuation midpoint in INR total" },
              confidenceScore: { type: Type.NUMBER, description: "Confidence percentage (e.g. 92)" },
              fairPriceSqFt: { type: Type.NUMBER, description: "Estimated price per sq.ft in INR" },
              estimatedRentalMin: { type: Type.NUMBER, description: "Minimum monthly rental in INR" },
              estimatedRentalMax: { type: Type.NUMBER, description: "Maximum monthly rental in INR" },
              rentalYield: { type: Type.NUMBER, description: "Annual gross rental yield percentage e.g. 4.2" },
              fiveYearAppreciationForecast: { type: Type.NUMBER, description: "Projected 5-year capital growth percentage e.g. 45" },
              localityGrade: { type: Type.STRING, description: "Locality Grade e.g. A+ Prime / Tier-1 Tech Corridor" },
              keyDrivers: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Key price driving factors like upcoming metro, IT hubs, infrastructure",
              },
              marketPros: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "3 strong advantages of investing in this locality/property",
              },
              marketCons: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2 to 3 points of caution or considerations",
              },
              comparableLocalityAverages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    avgRate: { type: Type.NUMBER },
                  },
                },
                description: "3 nearby localities with their average price per sq.ft",
              },
              summary: { type: Type.STRING, description: "Executive valuation summary in 2-3 concise sentences" },
            },
            required: [
              "estimatedPriceMin",
              "estimatedPriceMax",
              "fairValueEstimate",
              "fairPriceSqFt",
              "rentalYield",
              "summary",
              "marketPros",
              "marketCons",
            ],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      return NextResponse.json({ success: true, data: parsed });
    }

    // Action 2: Rabnix Genie Chatbot & Real Estate Consultation
    if (action === "chat") {
      const { userQuery, contextProperty } = (payload ?? {}) as ChatPayload;

      let prompt = `User Query: ${userQuery ?? ""}\n`;
      if (contextProperty) {
        prompt += `\nCurrently viewed property context:\nTitle: ${contextProperty.title}\nCity: ${contextProperty.city}, Locality: ${contextProperty.locality}\nPrice: ${contextProperty.priceFormatted} (${contextProperty.pricePerSqFt} / sq.ft)\nBHK: ${contextProperty.bhk || "N/A"}, Carpet Area: ${contextProperty.carpetAreaSqFt} sq.ft\nRERA: ${contextProperty.reraId || "Approved"}\n`;
      }

      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          systemInstruction: `You are "Rabnix Genie", the official AI Real Estate Advisor at Rabnix Estate (India's Premier Real Estate & Property Portal).
You help buyers, tenants, sellers, and NRI investors navigate Indian real estate with expertise in:
1. Locality recommendations, price per sq.ft trends across Mumbai, Bangalore, Delhi-NCR, Hyderabad, Pune, Chennai, etc.
2. Home Loans, interest rates (Repo-linked lending rates), Section 80C and Section 24(b) tax deductions, EMI optimization.
3. RERA regulations, carpet area vs super built-up calculations, encumbrance certificates, title verification.
4. Stamp duty & registration charges by state (Maharashtra, Karnataka, Delhi, Telangana, etc.).
5. Rental agreements, security deposit norms, and negotiation tactics.

Tone: Professional, friendly, highly knowledgeable about Indian cities & real estate law. Keep responses scannable, using bullet points and bold highlights. Keep answers concise (150-250 words max).`,
        },
      });

      return NextResponse.json({
        success: true,
        reply:
          response.text ||
          "I can help guide you through Indian real estate, property valuation, home loans, or locality recommendations.",
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Error in Rabnix Estate AI route:", error);
    const message = error instanceof Error ? error.message : "Failed to process AI request. Please try again.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
