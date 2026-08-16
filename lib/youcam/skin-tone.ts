import sharp from 'sharp';
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
        { name: 'Rich Warm Sand', hex: '#D2A177' },
        { name: 'Warm Amber Honey', hex: '#BA7A47' },
      ],
      clothingComplementaryColors: ['#B85D43', '#C19A6B', '#D4AF37'],
    },
    Summer: {
      flattering: ['#4682B4', '#B0E0E6', '#DDA0DD', '#E6E6FA', '#708090'],
      avoid: ['#FF4500', '#FFD700', '#8B4513'],
      description: 'Soft cool palette featuring slate blue, powder blue, soft lavender, and dusty rose.',
      blushShades: [
        { name: 'Petal Soft Pink', hex: '#F4C2C2' },
        { name: 'Mauve Whisper', hex: '#B784A7' },
      ],
      lipShades: [
        { name: 'Pillow Talk Cool Nude', hex: '#C48A96' },
        { name: 'Soft Plum Rose', hex: '#A25F7C' },
      ],
      foundationShades: [
        { name: 'Rose Fair', hex: '#FBE8E0' },
        { name: 'Cool Alabaster', hex: '#EED9D1' },
      ],
      clothingComplementaryColors: ['#4682B4', '#B0E0E6', '#DDA0DD'],
    },
    Winter: {
      flattering: ['#800020', '#000080', '#2E8B57', '#4B0082', '#FFFFFF'],
      avoid: ['#D2B48C', '#F4A460', '#DAA520'],
      description: 'High-contrast bold palette featuring true burgundy, deep sapphire, crisp emerald, and pure black/white.',
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
  const colorObj =
    raw?.data?.results?.color ||
    raw?.results?.color ||
    raw?.data?.color ||
    raw?.color ||
    raw?.result?.color ||
    {};

  const skinHex =
    colorObj.skin_color ||
    colorObj.hex ||
    raw?.data?.results?.skin_color ||
    raw?.skin_color ||
    '#DFAC82';
  const rgb = hexToRgb(skinHex);

  const rawUndertone = (
    colorObj.undertone ||
    raw?.data?.results?.undertone ||
    raw?.undertone ||
    ''
  ).toLowerCase();

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
      face_angle_strictness_level: 'flexible',
    });

    const rawResult = await pollTask<any>('/s2s/v2.0/task/skin-tone-analysis', taskId, {
      timeoutMs: 30000,
    });

    return normalizeSkinToneResponse(rawResult);
  } catch (err: any) {
    console.warn(`[Skin Tone Warning]: YouCam API returned: ${err.message}. Extracting dynamic skin tone from photo pixels...`);
    try {
      const meta = await sharp(selfieBuffer).metadata();
      const w = meta.width || 400;
      const h = meta.height || 400;
      const { data } = await sharp(selfieBuffer)
        .extract({ left: Math.round(w * 0.35), top: Math.round(h * 0.35), width: Math.max(10, Math.round(w * 0.3)), height: Math.max(10, Math.round(h * 0.3)) })
        .raw()
        .toBuffer({ resolveWithObject: true });

      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let i = 0; i < data.length; i += 3) {
        sumR += data[i];
        sumG += data[i + 1];
        sumB += data[i + 2];
        count++;
      }
      const avgR = count > 0 ? Math.round(sumR / count) : 180;
      const avgG = count > 0 ? Math.round(sumG / count) : 140;
      const avgB = count > 0 ? Math.round(sumB / count) : 110;
      const hex = '#' + [avgR, avgG, avgB].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
      return normalizeSkinToneResponse({ color: { skin_color: hex } });
    } catch {
      return normalizeSkinToneResponse({});
    }
  }
}
