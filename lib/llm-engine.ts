import { SkinAnalysisResult } from './youcam/skin-analysis';
import { SkinToneResult } from './youcam/skin-tone';
import { WeatherResult } from './weather';
import { ClosetItem } from './supabase';
import { Recommendation } from './recommendation-engine';

const HF_API_URL = 'https://router.huggingface.co/hf-inference/v1/chat/completions';
const DEFAULT_MODEL = 'meta-llama/Meta-Llama-3-8B-Instruct';

/**
 * Calls Hugging Face Inference API to generate live LLM recommendations
 * synthesizing dermatology metrics, atmospheric weather, wardrobe, and aesthetic vibe.
 */
export async function generateLLMRecommendation(input: {
  skin: SkinAnalysisResult;
  skinTone: SkinToneResult;
  weather: WeatherResult;
  vibe: 'classy' | 'elegant' | 'bold' | 'natural';
  closet: ClosetItem[];
}): Promise<Recommendation | null> {
  const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

  if (!apiKey) {
    return null;
  }

  const { skin, skinTone, weather, vibe, closet } = input;
  const ownedCloset = closet.filter((item) => item.is_owned);

  const topConcernsList = skin.topConcerns.map((c) => `${c.displayName}: ${c.score}% (${c.severity})`).join(', ');

  const systemPrompt = `You are MirrorCheck AI — a master dermatologist, cosmetic formulator, and editorial fashion stylist.
Your job is to analyze the user's live facial diagnostics, skin undertone, atmospheric weather, and available wardrobe items to generate a completely custom, non-hardcoded JSON recommendation.

Return ONLY a valid JSON object with NO markdown formatting, NO extra commentary, and NO backticks.
The JSON must strictly conform to this schema:
{
  "vibe": "${vibe}",
  "explanation": "A detailed 2-3 sentence personalized analysis explaining why this specific skincare regimen, cosmetic shade palette, and outfit ensemble was synthesized for their exact skin metrics, undertone, and today's weather.",
  "skincareNotes": {
    "warnings": ["Array of any critical active ingredient alerts, e.g. acne blemish advisories, retinoid buffering warnings if redness is present, or high UV SPF warnings"],
    "amSteps": [
      {
        "stepCategory": "Cleanser | Blemish Serum | Antioxidant Serum | Hydration | Moisturizer | SPF",
        "productName": "Exact product name matched from available skincare or clinical recommendation",
        "timing": "AM",
        "activeIngredients": ["list", "of", "actives"],
        "actionNote": "Specific explanation of what this step does for their skin concerns"
      }
    ],
    "pmSteps": [
      {
        "stepCategory": "Double Cleanse | Targeted BHA Treatment | Night Renewal Serum | Barrier Recovery Cream",
        "productName": "Exact product name",
        "timing": "PM",
        "activeIngredients": ["list", "of", "actives"],
        "actionNote": "Specific night action note",
        "isModified": true,
        "warning": "Optional note if an active was adjusted"
      }
    ]
  },
  "makeupSteps": [
    {
      "category": "foundation",
      "colorHex": "${skinTone.skinToneHex || skinTone.hexCode}",
      "intensity": 75,
      "finish": "matte | satin | dewy",
      "productName": "Specific foundation shade and formula name matching their undertone"
    },
    {
      "category": "blush",
      "colorHex": "#HexCode matching their seasonal palette and vibe",
      "intensity": 55,
      "finish": "dewy | satin",
      "productName": "Specific blush product and shade name"
    },
    {
      "category": "lip",
      "colorHex": "#HexCode matching their seasonal palette and vibe",
      "intensity": 75,
      "finish": "matte | glossy | satin",
      "productName": "Specific lipstick or lip tint product and shade name"
    },
    {
      "category": "eyeshadow",
      "colorHex": "#HexCode matching their seasonal palette",
      "intensity": 50,
      "productName": "Specific eyeshadow palette or shade"
    },
    {
      "category": "eyebrow",
      "colorHex": "${skinTone.eyebrowColorHex || '#422B1E'}",
      "intensity": 65,
      "productName": "Precision brow definer"
    }
  ],
  "outfit": {
    "topOrDress": { "id": "closet_item_id", "name": "Exact matching item from wardrobe", "brand": "Brand", "image_url": "Image URL", "category": "outfit_top | outfit_dress", "metadata": {} },
    "bottom": { "id": "closet_item_id", "name": "Matching bottom item or null if dress", "brand": "Brand", "image_url": "Image URL", "category": "outfit_bottom", "metadata": {} },
    "outerwear": { "id": "closet_item_id", "name": "Matching outerwear layer or null if warm", "brand": "Brand", "image_url": "Image URL", "category": "outfit_outer", "metadata": {} },
    "stylingRationale": "Detailed explanation of why this outfit was curated for today's weather and vibe."
  },
  "gapFillSuggestions": [
    {
      "category": "Category",
      "suggestedProduct": "Product Name",
      "reason": "Why their closet/shelf needs this item",
      "urgency": "high | medium | recommended"
    }
  ]
}`;

  const userPrompt = `LIVE USER PROFILE:
- Vibe Preference: ${vibe.toUpperCase()}
- Overall Skin Vitality: ${skin.overallScore}/100
- Skin Type: ${skin.skinType}
- Top Clinical Concerns: ${topConcernsList}
- Detailed Concern Scores: Acne (${skin.concerns.acne?.score}%), Redness (${skin.concerns.redness?.score}%), Oiliness (${skin.concerns.oiliness?.score}%), Dryness (${skin.concerns.dryness?.score}%), Pores (${skin.concerns.pores?.score}%), Dark Circles (${skin.concerns.dark_circles?.score}%)
- Skin Undertone: ${skinTone.undertone} (${skinTone.hexCode})
- Seasonal Color Palette: ${skinTone.season} (${skinTone.colorHarmonyDescription})
- Current Weather: ${weather.tempC}°C in ${weather.city || 'Local Area'}, Condition: ${weather.condition}, UV Index: ${weather.uvIndex}, Humidity: ${weather.humidity}%, Rain: ${weather.precipitationMm}mm

AVAILABLE INVENTORY ITEMS:
${JSON.stringify(ownedCloset, null, 2)}

Generate the complete bespoke JSON recommendation now.`;

  try {
    const res = await fetch(HF_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const cleanJson = content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed: Recommendation = JSON.parse(cleanJson);

    return parsed;
  } catch (err) {
    return null;
  }
}
