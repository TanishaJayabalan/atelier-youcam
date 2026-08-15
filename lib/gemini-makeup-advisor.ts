import { FaceAttributesResult, ColorTonesResult } from '@/types/beauty-profile';
import { generateMakeupAdvice, MakeupPlacementAdvice } from './makeup-advisor';

export interface StylistAdvice {
  placementAdvice: MakeupPlacementAdvice;
  aiEditorialSummary: string;
  signatureLookName: string;
  expertTips: string[];
}

export async function getStylistConsultation(
  faceAttr: FaceAttributesResult,
  colorTones: ColorTonesResult,
  vibe: string = 'Bold'
): Promise<StylistAdvice> {
  const placementAdvice = generateMakeupAdvice(faceAttr, colorTones);
  const geminiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    return {
      placementAdvice,
      signatureLookName: `${faceAttr.faceShape} Harmony ${vibe} Edit`,
      aiEditorialSummary: `Architectural placement customized for your ${faceAttr.faceShape} face geometry with ${faceAttr.eyelidType} eye architecture and ${colorTones.undertone} undertones.`,
      expertTips: placementAdvice.keyStylingTips,
    };
  }

  try {
    const prompt = `You are a world-class celebrity makeup artist.
Analyze these facial metrics and give a concise 2-sentence editorial styling summary and 3 bullet tips:
- Face Shape: ${faceAttr.faceShape}
- Eye Shape: ${faceAttr.eyeShape} (${faceAttr.eyelidType}, ${faceAttr.eyeDistance})
- Cheekbones: ${faceAttr.cheekbones}
- Lip Shape: ${faceAttr.lipShape}
- Skin Tone: ${colorTones.skinColor} (${colorTones.undertone} undertone)
- Style Vibe: ${vibe}

Return clean JSON:
{
  "signatureLookName": "Look Name",
  "aiEditorialSummary": "2-sentence styling summary",
  "expertTips": ["tip 1", "tip 2", "tip 3"]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          placementAdvice,
          signatureLookName: parsed.signatureLookName || `${faceAttr.faceShape} ${vibe} Look`,
          aiEditorialSummary: parsed.aiEditorialSummary || `Tailored look for ${faceAttr.faceShape} face shape.`,
          expertTips: parsed.expertTips || placementAdvice.keyStylingTips,
        };
      }
    }
  } catch (err) {
    console.warn('Gemini stylist consultation error fallback:', err);
  }

  return {
    placementAdvice,
    signatureLookName: `${faceAttr.faceShape} Harmony ${vibe} Edit`,
    aiEditorialSummary: `Architectural placement customized for your ${faceAttr.faceShape} face geometry with ${faceAttr.eyelidType} eye architecture and ${colorTones.undertone} undertones.`,
    expertTips: placementAdvice.keyStylingTips,
  };
}
