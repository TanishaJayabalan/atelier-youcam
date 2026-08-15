import { uploadFile, runTask, pollTask } from './client';
import { computeRealSkinTone, extractBufferTelemetry, OpticalTelemetry } from '../image-analysis';

export type Undertone = 'warm' | 'cool' | 'neutral';
export type SeasonalPalette = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export interface SkinTonePalette {
  flattering: string[];
  avoid: string[];
  description: string;
  blushShades: Array<{ name: string; hex: string }>;
  lipShades: Array<{ name: string; hex: string }>;
  foundationShades: Array<{ name: string; hex: string }>;
  clothingComplementaryColors: string[];
}

export interface SkinToneResult {
  hexCode: string;
  skinToneHex?: string;
  rgb: { r: number; g: number; b: number };
  lab: { l: number; a: number; b: number };
  ita: number;
  undertone: Undertone;
  season: SeasonalPalette;
  seasonPalette?: SeasonalPalette;
  palette: SkinTonePalette;
  flatteringColors: string[];
  avoidColors: string[];
  colorHarmonyDescription: string;
  confidence: number;
  hair_color?: string;
  eye_color?: string;
  lip_color?: string;
  eyebrow_color?: string;
  eyebrowColorHex?: string;
  rawResponse?: any;
}

export function getHarmonizedPalette(season: SeasonalPalette, undertone: Undertone = 'warm'): SkinTonePalette {
  const harmonies: Record<SeasonalPalette, SkinTonePalette> = {
    Spring: {
      flattering: ['#E2725B', '#F4C430', '#98FF98', '#FF7F50', '#FFFDD0'],
      avoid: ['#000000', '#2F4F4F', '#4A0E4E'],
      description: 'Luminous warm palette featuring coral, peach, golden yellow, and fresh warm ivory.',
      blushShades: [
        { name: 'Warm Coral', hex: '#F88379' },
        { name: 'Peach Nectar', hex: '#FFDAB9' },
      ],
      lipShades: [
        { name: 'Poppy Coral', hex: '#FF6F59' },
        { name: 'Warm Apricot', hex: '#FBCEB1' },
      ],
      foundationShades: [
        { name: 'Golden Fair', hex: '#F7DFD4' },
        { name: 'Warm Beige', hex: '#E8C5A0' },
      ],
      clothingComplementaryColors: ['#E2725B', '#F4C430', '#98FF98'],
    },
    Autumn: {
      flattering: ['#B85D43', '#C19A6B', '#D4AF37', '#808000', '#556B2F'],
      avoid: ['#FF69B4', '#00FFFF', '#E6E6FA'],
      description: 'Rich earthy warmth featuring terracotta, camel, warm olive, and antique gold.',
      blushShades: [
        { name: 'Terracotta Flush', hex: '#E89078' },
        { name: 'Spiced Rose', hex: '#C97A63' },
      ],
      lipShades: [
        { name: 'Walk of No Shame (Warm Berry)', hex: '#B85D43' },
        { name: 'Caramel Nude', hex: '#C19A6B' },
      ],
      foundationShades: [
        { name: 'Warm Sand', hex: '#DFAC82' },
        { name: 'Golden Honey', hex: '#C68B59' },
      ],
      clothingComplementaryColors: ['#B85D43', '#C19A6B', '#D4AF37'],
    },
    Summer: {
      flattering: ['#C86267', '#87CEEB', '#E6E6FA', '#708090', '#B0C4DE'],
      avoid: ['#FF8C00', '#FFD700', '#8B4513'],
      description: 'Soft muted coolness featuring dusty rose, slate blue, powder blue, and soft mauve.',
      blushShades: [
        { name: 'Dusty Petal', hex: '#D8A0A6' },
        { name: 'Soft Orchid', hex: '#DF73FF' },
      ],
      lipShades: [
        { name: 'Rose Silk', hex: '#C86267' },
        { name: 'Mauve Whisper', hex: '#B784A7' },
      ],
      foundationShades: [
        { name: 'Cool Ivory', hex: '#FBE7DF' },
        { name: 'Neutral Rose', hex: '#E2BCB7' },
      ],
      clothingComplementaryColors: ['#C86267', '#87CEEB', '#E6E6FA'],
    },
    Winter: {
      flattering: ['#800020', '#000080', '#2E8B57', '#000000', '#FFFFFF'],
      avoid: ['#D2B48C', '#F0E68C', '#E97451'],
      description: 'High-contrast clarity featuring deep ruby, midnight navy, emerald, and stark crisp black & white.',
      blushShades: [
        { name: 'Crimson Glow', hex: '#C21E56' },
        { name: 'Cool Berry', hex: '#8E2856' },
      ],
      lipShades: [
        { name: 'Ruby Statement', hex: '#800020' },
        { name: 'Midnight Wine', hex: '#58111A' },
      ],
      foundationShades: [
        { name: 'Porcelain Cool', hex: '#FFF0F5' },
        { name: 'Espresso Rich', hex: '#4A2E18' },
      ],
      clothingComplementaryColors: ['#800020', '#000080', '#2E8B57'],
    },
  };
  return harmonies[season] || harmonies.Autumn;
}

export function normalizeSkinToneResponse(raw: any, selfieBuffer?: Buffer, telemetry?: OpticalTelemetry): SkinToneResult {
  if (telemetry) {
    return computeRealSkinTone(telemetry);
  }
  if (selfieBuffer && selfieBuffer.length > 0) {
    const extracted = extractBufferTelemetry(selfieBuffer);
    return computeRealSkinTone(extracted);
  }

  return computeRealSkinTone({
    avgR: 215,
    avgG: 175,
    avgB: 150,
    rednessRatio: 0.2,
    specularRatio: 0.14,
    roughnessVariance: 14,
    underEyeContrast: 0.1,
    luminance: 180,
  });
}

export function generateMockSkinTone(selfieBuffer?: Buffer, telemetry?: OpticalTelemetry): SkinToneResult {
  if (telemetry) {
    return computeRealSkinTone(telemetry);
  }
  if (selfieBuffer && selfieBuffer.length > 0) {
    const extracted = extractBufferTelemetry(selfieBuffer);
    return computeRealSkinTone(extracted);
  }

  return computeRealSkinTone({
    avgR: 215,
    avgG: 175,
    avgB: 150,
    rednessRatio: 0.2,
    specularRatio: 0.14,
    roughnessVariance: 14,
    underEyeContrast: 0.1,
    luminance: 180,
  });
}

export async function analyzeSkinTone(
  selfieBuffer: Buffer,
  contentType: string = 'image/jpeg',
  telemetry?: OpticalTelemetry
): Promise<SkinToneResult> {
  if (telemetry) {
    return computeRealSkinTone(telemetry);
  }
  if (selfieBuffer && selfieBuffer.length > 0) {
    const extracted = extractBufferTelemetry(selfieBuffer);
    return computeRealSkinTone(extracted);
  }

  return generateMockSkinTone(selfieBuffer, telemetry);
}
