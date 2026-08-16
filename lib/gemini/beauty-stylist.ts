import { MakeupStep } from '../youcam/makeup-vto';
import { SkinToneResult } from '../youcam/skin-tone';
import { WeatherResult } from '../weather';
import { UserBeautyProfile } from '@/types/beauty-profile';

export interface CustomBeautyLook {
  lookTitle: string;
  aestheticSummary: string;
  makeupSteps: MakeupStep[];
  palette: string[]; // 4 hex colors
  wardrobeGuidance: string;
  outfitTags: string[];
  stylingRationale: string;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

/**
 * Validates and normalizes hex color code strings.
 */
function sanitizeHex(hex: string, fallback: string): string {
  if (!hex || typeof hex !== 'string') return fallback;
  const clean = hex.trim().replace(/^#/, '');
  if (/^[0-9A-Fa-f]{6}$/.test(clean)) {
    return `#${clean.toUpperCase()}`;
  }
  return fallback;
}

/**
 * Color dictionary with rich cosmetic shades
 */
const COLOR_PALETTES: Record<string, string> = {
  // Pinks & Magentas
  'bright pink': '#FF1493',
  'hot pink': '#FF69B4',
  'neon pink': '#FF007F',
  'barbie pink': '#E0218A',
  'magenta': '#D81B60',
  'fuchsia': '#C2185B',
  'baby pink': '#F4C2C2',
  'soft pink': '#E8A598',
  'rose': '#C86267',
  'dusty rose': '#B76E79',
  'pink': '#E91E63',

  // Blues & Teals
  'dark blue': '#0A235C',
  'navy': '#001F3F',
  'midnight blue': '#191970',
  'royal blue': '#4169E1',
  'cobalt': '#0047AB',
  'sapphire': '#0F52BA',
  'electric blue': '#007FFF',
  'sky blue': '#87CEEB',
  'cyan': '#00BCD4',
  'teal': '#008080',
  'blue': '#1E88E5',

  // Oranges, Corals & Peaches
  'bright orange': '#FF5722',
  'neon orange': '#FF4500',
  'tangerine': '#F28500',
  'burnt orange': '#CC5500',
  'apricot': '#FBCEB1',
  'peach': '#F88379',
  'coral': '#FF6F59',
  'orange': '#E67E22',

  // Reds & Berries
  'bright red': '#E50914',
  'ruby': '#9B111E',
  'crimson': '#DC143C',
  'scarlet': '#FF2400',
  'cherry': '#58111A',
  'wine': '#722F37',
  'burgundy': '#800020',
  'maroon': '#800000',
  'blood red': '#8A0303',
  'red': '#C21807',

  // Purples & Plums
  'deep purple': '#4A148C',
  'royal purple': '#7B1FA2',
  'plum': '#701C45',
  'eggplant': '#311432',
  'violet': '#8A2BE2',
  'lavender': '#E6E6FA',
  'lilac': '#C8A2C8',
  'purple': '#8E24AA',

  // Greens
  'emerald': '#097969',
  'forest green': '#228B22',
  'olive': '#556B2F',
  'sage': '#9DC183',
  'mint': '#98FF98',
  'lime': '#32CD32',
  'green': '#2E7D32',

  // Browns, Bronzes & Golds
  'espresso': '#3B2418',
  'cocoa': '#4A2E1B',
  'chocolate': '#3D2314',
  'mocha': '#4E3629',
  'coffee': '#5C3826',
  'latte': '#8B5A2B',
  'caramel': '#C19A6B',
  'terracotta': '#B85D43',
  'cinnamon': '#D2691E',
  'bronze': '#CD7F32',
  'copper': '#B87333',
  'gold': '#D4AF37',
  'champagne': '#F7E7CE',
  'honey': '#E8A735',
  'nude': '#C97A63',
  'tan': '#D2B48C',
  'brown': '#5C3826',

  // Neutrals, Darks & Lights
  'black': '#1B1B1B',
  'charcoal': '#2E2E2E',
  'gunmetal': '#2C3539',
  'silver': '#C0C0C0',
  'white': '#FFFFFF',
  'porcelain': '#FBE8E0',
  'ivory': '#FFFFF0',
  'alabaster': '#EED9D1',
};

/**
 * Natural Language Feature & Color Extractor
 * Parses explicit user color directives for specific facial zones.
 */
function extractTargetColor(prompt: string, featureKeywords: string[], defaultColor: string): string {
  const p = prompt.toLowerCase();
  for (const kw of featureKeywords) {
    const idx = p.indexOf(kw);
    if (idx !== -1) {
      const preText = p.slice(Math.max(0, idx - 35), idx);
      let bestColor = '';
      let bestEndPos = -1;
      let longestLen = 0;

      for (const [colorName, hex] of Object.entries(COLOR_PALETTES)) {
        const startPos = preText.lastIndexOf(colorName);
        if (startPos !== -1) {
          const endPos = startPos + colorName.length;
          if (endPos > bestEndPos || (endPos === bestEndPos && colorName.length > longestLen)) {
            bestEndPos = endPos;
            longestLen = colorName.length;
            bestColor = hex;
          }
        }
      }
      if (bestColor) return bestColor;

      const postText = p.slice(idx + kw.length, Math.min(p.length, idx + kw.length + 35));
      for (const [colorName, hex] of Object.entries(COLOR_PALETTES)) {
        if (postText.includes(colorName)) return hex;
      }
    }
  }
  return defaultColor;
}

/**
 * Natural Language Feature & Color Extractor
 */
function extractFeatureColors(prompt: string, defaultSkinHex: string) {
  const p = prompt.toLowerCase();

  const detectFinish = (text: string, defaultFinish: 'matte' | 'satin' | 'dewy' | 'glossy' | 'shimmer'): 'matte' | 'satin' | 'dewy' | 'glossy' | 'shimmer' => {
    if (text.includes('gloss') || text.includes('glass') || text.includes('wet') || text.includes('glazed')) return 'glossy';
    if (text.includes('shimmer') || text.includes('glitter') || text.includes('sparkle') || text.includes('metallic')) return 'shimmer';
    if (text.includes('dewy') || text.includes('glow') || text.includes('hydrated')) return 'dewy';
    if (text.includes('matte') || text.includes('velvet') || text.includes('powder')) return 'matte';
    return defaultFinish;
  };

  const detectIntensity = (text: string, defaultIntensity: number): number => {
    if (text.includes('very bright') || text.includes('neon') || text.includes('bold') || text.includes('heavy') || text.includes('dark') || text.includes('intense') || text.includes('dramatic')) return 92;
    if (text.includes('bright') || text.includes('vibrant') || text.includes('deep')) return 85;
    if (text.includes('sheer') || text.includes('subtle') || text.includes('light') || text.includes('soft') || text.includes('barely') || text.includes('minimal')) return 40;
    return defaultIntensity;
  };

  // 1. LIP COLOR
  const lipHex = extractTargetColor(p, ['lip', 'lips', 'lipstick', 'lip gloss', 'lip tint'], '#B85D43');
  const lipFinish = detectFinish(p, 'glossy');
  const lipIntensity = detectIntensity(p, 85);

  // 2. EYE COLOR
  const eyeHex = extractTargetColor(p, ['eyeshadow', 'eye shadow', 'eye', 'eyes', 'lids', 'lid', 'liner', 'eyeliner'], '#7A4B2A');
  const eyeFinish = detectFinish(p, 'shimmer');
  const eyeIntensity = detectIntensity(p, 80);

  // 3. FOUNDATION COLOR
  const foundHex = extractTargetColor(p, ['foundation', 'base', 'complexion'], defaultSkinHex);
  const foundFinish = detectFinish(p, 'satin');
  const foundIntensity = detectIntensity(p, 70);

  // 4. BLUSH COLOR
  const blushHex = extractTargetColor(p, ['blush', 'cheek', 'cheeks'], lipHex === '#FF1493' || lipHex === '#FF69B4' ? '#F48FB1' : '#E89078');
  const blushFinish = detectFinish(p, 'satin');
  const blushIntensity = detectIntensity(p, 55);

  // Dynamic Look Title
  const titleParts: string[] = [];
  if (foundHex !== defaultSkinHex) titleParts.push('Custom Base');
  if (lipHex !== '#B85D43') titleParts.push('Statement Lip');
  if (eyeHex !== '#7A4B2A') titleParts.push('Artistic Eye');

  const lookTitle = titleParts.length > 0
    ? titleParts.join(' & ') + ' Aesthetic'
    : 'Custom Formulated Aesthetic';

  const makeupSteps: MakeupStep[] = [
    {
      category: 'foundation',
      colorHex: foundHex,
      intensity: foundIntensity,
      finish: foundFinish as any,
      productName: foundHex !== defaultSkinHex ? 'Custom Tint Foundation' : 'Harmonized Base Foundation',
    },
    {
      category: 'blush',
      colorHex: blushHex,
      intensity: blushIntensity,
      finish: blushFinish as any,
      productName: 'Custom Sculpting Blush',
    },
    {
      category: 'eyeshadow',
      colorHex: eyeHex,
      intensity: eyeIntensity,
      finish: eyeFinish,
      productName: 'Custom Eye Palette',
    },
    {
      category: 'lip',
      colorHex: lipHex,
      intensity: lipIntensity,
      finish: lipFinish,
      productName: 'Custom Statement Lip',
    },
    {
      category: 'eyebrow',
      colorHex: '#261814',
      intensity: 70,
      productName: 'Sculpted Definition Brow',
    },
  ];

  const palette = [lipHex, eyeHex, blushHex, foundHex];

  return {
    lookTitle,
    aestheticSummary: `Custom formulated directly from your prompt: "${prompt}".`,
    makeupSteps,
    palette,
    wardrobeGuidance: 'Pair with modern high-contrast styling featuring bold complementary elements to harmonize the look.',
    outfitTags: ['Contemporary Polish', 'High-Contrast Accent', 'Statement Tailoring'],
    stylingRationale: `Directly translated shade codes for YouCam VTO rendering based on: "${prompt}".`,
  };
}

/**
 * Calls Google Gemini Flash with live model rotation & smart fallback
 */
export async function generateCustomBeautyLook({
  prompt,
  skinTone,
  weather,
  beautyProfile,
}: {
  prompt: string;
  skinTone?: SkinToneResult;
  weather?: WeatherResult;
  beautyProfile?: UserBeautyProfile;
}): Promise<CustomBeautyLook> {
  const defaultSkinHex = skinTone?.hexCode || '#DFAC82';
  const extractedDirectLook = extractFeatureColors(prompt, defaultSkinHex);

  if (!GEMINI_API_KEY || !prompt.trim()) {
    return extractedDirectLook;
  }

  const systemInstruction = `You are an elite celebrity makeup artist and fashion director.
Translate the user's aesthetic request into mathematical cosmetics parameters for a virtual try-on engine (YouCam S2S).
Strictly follow any explicit color requests the user mentions for specific features (e.g. orange foundation, pink lips, blue eyeshadow).

User skin profile:
- Skin Hex: ${defaultSkinHex}
- Undertone: ${skinTone?.undertone || 'neutral'}
- Seasonal Palette: ${skinTone?.season || 'Autumn'}
- Fitzpatrick Type: ${beautyProfile?.fitzpatrick.type || 'III'}

Rules:
1. All hex codes MUST be valid 6-character hex (e.g. #FF1493, #0A235C, #E67E22).
2. Intensity must be an integer between 20 and 95.
3. Steps MUST include lip, blush, eyeshadow, and foundation.
4. Finish must be one of: 'matte', 'satin', 'dewy', 'glossy', 'shimmer'.
5. Palette must be an array of exactly 4 complementary hex codes.`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Formulate a complete beauty look and wardrobe styling for the following aesthetic request:\n"${prompt}"\nReturn strict JSON adhering to the specified schema.`,
          },
        ],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      responseMimeType: 'application/json',
    },
  };

  const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.7-flash', 'gemini-flash-latest'];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) continue;

      const json = await res.json();
      const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const parsed = JSON.parse(rawText);

      const sanitizedSteps: MakeupStep[] = (parsed.makeupSteps || []).map((s: any) => ({
        category: s.category as any,
        colorHex: sanitizeHex(s.colorHex, '#B85D43'),
        intensity: Math.max(15, Math.min(100, Number(s.intensity) || 60)),
        finish: s.finish || 'satin',
        productName: s.productName || `${s.category} shade`,
      }));

      const sanitizedPalette = (parsed.palette || [])
        .slice(0, 4)
        .map((hex: string) => sanitizeHex(hex, '#DFAC82'));

      while (sanitizedPalette.length < 4) {
        sanitizedPalette.push('#C19A6B');
      }

      if (sanitizedSteps.length >= 3) {
        return {
          lookTitle: parsed.lookTitle || extractedDirectLook.lookTitle,
          aestheticSummary: parsed.aestheticSummary || `Custom aesthetic formulated for "${prompt}".`,
          makeupSteps: sanitizedSteps,
          palette: sanitizedPalette,
          wardrobeGuidance: parsed.wardrobeGuidance || extractedDirectLook.wardrobeGuidance,
          outfitTags: Array.isArray(parsed.outfitTags) && parsed.outfitTags.length > 0 ? parsed.outfitTags.slice(0, 3) : extractedDirectLook.outfitTags,
          stylingRationale: parsed.stylingRationale || extractedDirectLook.stylingRationale,
        };
      }
    } catch {
      // Continue to next model or fallback
    }
  }

  return extractedDirectLook;
}
