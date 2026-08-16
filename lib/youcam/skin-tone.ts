import { uploadFile, runTask, pollTask } from './client';

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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function detectUndertone(skinHex: string): Undertone {
  const { r, g, b } = hexToRgb(skinHex);
  const rbRatio = r / Math.max(b, 1);
  const rgRatio = r / Math.max(g, 1);
  const gbRatio = g / Math.max(b, 1);

  if (gbRatio > 1.25 && rbRatio < 1.45) {
    return 'neutral';
  }
  if (rbRatio > 1.55 && rgRatio < 1.28) {
    return 'warm';
  }
  if (rbRatio < 1.35 || b > g * 0.85) {
    return 'cool';
  }
  return 'neutral';
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

export function normalizeSkinToneResponse(raw: any): SkinToneResult {
  const colorObj = raw?.color || raw?.results?.color || raw?.result?.color || {};
  const skinHex = colorObj.skin_color || colorObj.hex || raw?.skin_color || '#DFAC82';
  const rgb = hexToRgb(skinHex);

  const rawUndertone = (colorObj.undertone || raw?.undertone || '').toLowerCase();
  let undertone: Undertone = 'neutral';
  if (rawUndertone.includes('warm')) undertone = 'warm';
  else if (rawUndertone.includes('cool')) undertone = 'cool';
  else undertone = detectUndertone(skinHex);

  const ita = typeof colorObj.ita === 'number' ? colorObj.ita : 35;
  const lab = colorObj.lab || { l: 65, a: 12, b: 18 };

  let season: SeasonalPalette = 'Autumn';
  if (undertone === 'warm') {
    season = ita > 40 ? 'Spring' : 'Autumn';
  } else if (undertone === 'cool') {
    season = ita > 40 ? 'Summer' : 'Winter';
  } else {
    season = ita > 45 ? 'Spring' : 'Autumn';
  }

  const palette = getHarmonizedPalette(season, undertone);

  return {
    hexCode: skinHex,
    skinToneHex: skinHex,
    rgb,
    lab,
    ita,
    undertone,
    season,
    seasonPalette: season,
    palette,
    flatteringColors: palette.flattering,
    avoidColors: palette.avoid,
    colorHarmonyDescription: palette.description,
    confidence: 0.95,
    hair_color: colorObj.hair_color,
    eye_color: colorObj.eye_color,
    lip_color: colorObj.lip_color,
    eyebrow_color: colorObj.eyebrow_color,
    eyebrowColorHex: colorObj.eyebrow_color,
    rawResponse: raw,
  };
}

export async function analyzeSkinTone(
  selfieBuffer: Buffer,
  contentType: string = 'image/jpeg'
): Promise<SkinToneResult> {
  try {
    const fileId = await uploadFile(
      '/s2s/v2.0/file',
      selfieBuffer,
      contentType,
      'selfie_skin_tone.jpg'
    );

    const taskId = await runTask('/s2s/v2.0/task/skin-tone-analysis', {
      src_file_id: fileId,
      face_angle_strictness_level: 'medium',
    });

    const rawResult = await pollTask('/s2s/v2.0/task/skin-tone-analysis', taskId, {
      timeoutMs: 30000,
    });

    return normalizeSkinToneResponse(rawResult);
  } catch (err: any) {
    throw new Error(`Skin tone analysis failed: ${err.message}`);
  }
}
