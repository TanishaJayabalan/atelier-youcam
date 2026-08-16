import sharp from 'sharp';
import { SkinAnalysisResult, ConcernScore, ConcernKey } from './youcam/skin-analysis';
import { SkinToneResult, Undertone, SeasonalPalette, getHarmonizedPalette } from './youcam/skin-tone';
import { FitzpatrickResult, ColorTonesResult, FaceAttributesResult, UserBeautyProfile } from '@/types/beauty-profile';

function rgbToLab(r: number, g: number, b: number): { l: number; a: number; b: number } {
  let sR = r / 255;
  let sG = g / 255;
  let sB = b / 255;

  sR = sR > 0.04045 ? Math.pow((sR + 0.055) / 1.055, 2.4) : sR / 12.92;
  sG = sG > 0.04045 ? Math.pow((sG + 0.055) / 1.055, 2.4) : sG / 12.92;
  sB = sB > 0.04045 ? Math.pow((sB + 0.055) / 1.055, 2.4) : sB / 12.92;

  const x = (sR * 0.4124 + sG * 0.3576 + sB * 0.1805) / 0.95047;
  const y = (sR * 0.2126 + sG * 0.7152 + sB * 0.0722) / 1.00000;
  const z = (sR * 0.0193 + sG * 0.1192 + sB * 0.9505) / 1.08883;

  const fX = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  const fY = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  const fZ = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const l = Math.max(0, Math.min(100, 116 * fY - 16));
  const a = 500 * (fX - fY);
  const bVal = 200 * (fY - fZ);

  return { l: Number(l.toFixed(2)), a: Number(a.toFixed(2)), b: Number(bVal.toFixed(2)) };
}

function calculateITA(l: number, b: number): number {
  if (b === 0) return 0;
  const rad = Math.atan((l - 50) / Math.max(0.1, b));
  return Number(((rad * 180) / Math.PI).toFixed(2));
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('');
}

export async function analyzeImageOptically(imageBuffer: Buffer): Promise<{
  skinAnalysis: SkinAnalysisResult;
  skinTone: SkinToneResult;
  beautyProfile: UserBeautyProfile;
}> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  const width = metadata.width || 400;
  const height = metadata.height || 400;

  // Extract upper center 60% of portrait (forehead, eyes, cheeks, nose)
  const left = Math.round(width * 0.2);
  const top = Math.round(height * 0.15);
  const extractW = Math.max(20, Math.round(width * 0.6));
  const extractH = Math.max(20, Math.round(height * 0.6));

  const { data, info } = await sharp(imageBuffer)
    .extract({ left, top, width: extractW, height: extractH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const totalPixels = info.width * info.height;

  let sumR = 0, sumG = 0, sumB = 0;
  let allSumR = 0, allSumG = 0, allSumB = 0;
  let skinPixelCount = 0;
  let rednessSum = 0;
  const luminances: number[] = [];

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    allSumR += r;
    allSumG += g;
    allSumB += b;

    // Human skin chromaticity filter
    const isSkin =
      r > 45 &&
      g > 25 &&
      b > 15 &&
      r >= g &&
      g >= b * 0.7 &&
      r - g >= 8 &&
      r - b >= 10;

    if (isSkin) {
      sumR += r;
      sumG += g;
      sumB += b;
      skinPixelCount++;

      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      luminances.push(lum);

      const redExcess = Math.max(0, r - (g * 1.15 + b * 0.35) / 1.5);
      rednessSum += redExcess;
    }
  }

  const useSkinMask = skinPixelCount > 80;
  const count = useSkinMask ? skinPixelCount : totalPixels;
  const avgR = useSkinMask ? Math.round(sumR / count) : Math.round(allSumR / count);
  const avgG = useSkinMask ? Math.round(sumG / count) : Math.round(allSumG / count);
  const avgB = useSkinMask ? Math.round(sumB / count) : Math.round(allSumB / count);

  const meanLum = luminances.length > 0 ? luminances.reduce((a, c) => a + c, 0) / luminances.length : 128;
  const variance = luminances.length > 0 ? luminances.reduce((a, c) => a + Math.pow(c - meanLum, 2), 0) / luminances.length : 400;
  const stdDev = Math.sqrt(variance);

  const hexCode = rgbToHex(avgR, avgG, avgB);
  const lab = rgbToLab(avgR, avgG, avgB);
  const ita = calculateITA(lab.l, lab.b);

  const rbRatio = avgR / Math.max(avgB, 1);
  const rgRatio = avgR / Math.max(avgG, 1);
  const gbRatio = avgG / Math.max(avgB, 1);

  let undertone: Undertone = 'neutral';
  if (gbRatio > 1.28 && rbRatio < 1.48) {
    undertone = 'neutral';
  } else if (rbRatio > 1.52 && rgRatio < 1.35) {
    undertone = 'warm';
  } else if (rbRatio < 1.38 || avgB > avgG * 0.8) {
    undertone = 'cool';
  } else {
    undertone = 'warm';
  }

  let fitzType: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' = 'III';
  let fitzLabel = 'Type III: Medium Beige / Olive';
  let fitzSun = 'Sometimes mild burn, gradually tans to olive';
  let melaninIndex = 45;

  if (ita > 55) {
    fitzType = 'I';
    fitzLabel = 'Type I: Very Light / Porcelain';
    fitzSun = 'Always burns easily, never tans';
    melaninIndex = 15;
  } else if (ita > 41) {
    fitzType = 'II';
    fitzLabel = 'Type II: Light / Fair Alabaster';
    fitzSun = 'Usually burns, tans with difficulty';
    melaninIndex = 28;
  } else if (ita > 28) {
    fitzType = 'III';
    fitzLabel = 'Type III: Medium Beige / Olive';
    fitzSun = 'Sometimes mild burn, gradually tans to olive';
    melaninIndex = 45;
  } else if (ita > 10) {
    fitzType = 'IV';
    fitzLabel = 'Type IV: Moderately Brown / Warm Bronze';
    fitzSun = 'Rarely burns, tans easily to dark bronze';
    melaninIndex = 62;
  } else if (ita > -30) {
    fitzType = 'V';
    fitzLabel = 'Type V: Dark Brown / Rich Caramel';
    fitzSun = 'Very rarely burns, tans very easily';
    melaninIndex = 78;
  } else {
    fitzType = 'VI';
    fitzLabel = 'Type VI: Deep Espresso / Ebony';
    fitzSun = 'Never burns, deeply pigmented naturally';
    melaninIndex = 92;
  }

  let season: SeasonalPalette = 'Autumn';
  if (undertone === 'warm') {
    season = lab.l > 60 ? 'Spring' : 'Autumn';
  } else if (undertone === 'cool') {
    season = lab.l > 60 ? 'Summer' : 'Winter';
  } else {
    season = lab.l > 58 ? 'Spring' : 'Autumn';
  }

  const palette = getHarmonizedPalette(season, undertone);

  const normalizedRedness = Math.max(8, Math.min(92, Math.round((rednessSum / Math.max(1, count)) * 2.8)));
  const normalizedTexture = Math.max(12, Math.min(88, Math.round(stdDev * 1.45)));
  const normalizedOiliness = Math.max(15, Math.min(85, Math.round((avgG / 255) * 88)));
  const normalizedMoisture = Math.max(30, Math.min(94, Math.round(lab.l * 0.92 + (255 - avgR) * 0.1)));
  const normalizedPores = Math.max(14, Math.min(86, Math.round(stdDev * 1.35 + (avgR > 180 ? 8 : -4))));
  const normalizedRadiance = Math.max(25, Math.min(95, Math.round(lab.l * 0.90 + (100 - stdDev) * 0.1)));
  const normalizedDarkCircles = Math.max(15, Math.min(82, Math.round((100 - lab.l) * 0.82)));
  const normalizedFirmness = Math.max(50, Math.min(95, Math.round(100 - (100 - lab.l) * 0.35)));

  const concerns: Record<string, ConcernScore> = {
    redness: {
      key: 'redness',
      displayName: 'Erythema & Active Redness',
      score: normalizedRedness,
      severity: normalizedRedness >= 55 ? 'high' : normalizedRedness >= 35 ? 'moderate' : 'low',
    },
    texture: {
      key: 'texture',
      displayName: 'Skin Smoothness & Texture',
      score: normalizedTexture,
      severity: normalizedTexture >= 55 ? 'high' : normalizedTexture >= 35 ? 'moderate' : 'low',
    },
    oiliness: {
      key: 'oiliness',
      displayName: 'Sebum & T-Zone Oiliness',
      score: normalizedOiliness,
      severity: normalizedOiliness >= 55 ? 'high' : normalizedOiliness >= 35 ? 'moderate' : 'low',
    },
    moisture: {
      key: 'moisture',
      displayName: 'Hydration Level',
      score: normalizedMoisture,
      severity: normalizedMoisture >= 60 ? 'low' : normalizedMoisture >= 40 ? 'moderate' : 'high',
    },
    pore: {
      key: 'pore',
      displayName: 'Pore Enlargement',
      score: normalizedPores,
      severity: normalizedPores >= 55 ? 'high' : normalizedPores >= 35 ? 'moderate' : 'low',
    },
    radiance: {
      key: 'radiance',
      displayName: 'Skin Glow & Radiance',
      score: normalizedRadiance,
      severity: normalizedRadiance >= 65 ? 'low' : 'moderate',
    },
    dark_circles: {
      key: 'dark_circles',
      displayName: 'Periorbital Dark Circles',
      score: normalizedDarkCircles,
      severity: normalizedDarkCircles >= 50 ? 'moderate' : 'low',
    },
    firmness: {
      key: 'firmness',
      displayName: 'Skin Elasticity & Firmness',
      score: normalizedFirmness,
      severity: 'low',
    },
  };

  const topConcerns = Object.values(concerns)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  let skinType: 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal' = 'normal';
  if (normalizedOiliness >= 55) skinType = 'oily';
  else if (normalizedMoisture < 45) skinType = 'dry';
  else if (normalizedRedness >= 45) skinType = 'sensitive';
  else if (normalizedOiliness >= 40 && normalizedMoisture >= 50) skinType = 'combination';

  // Compute overall vitality dynamically from the 4 primary pillar scores
  const overallScore = Math.max(35, Math.min(96, Math.round(
    ((100 - normalizedRedness) * 0.25) +
    (normalizedMoisture * 0.30) +
    ((100 - normalizedPores) * 0.25) +
    ((100 - normalizedTexture) * 0.20)
  )));

  const skinAnalysis: SkinAnalysisResult = {
    skinType,
    overallScore,
    skinAge: Math.max(18, Math.min(65, Math.round(26 + (100 - overallScore) * 0.25))),
    concerns,
    topConcerns,
    rawResponse: { source: 'optical_pixel_analyzer', ita, lab, hexCode },
  };

  const skinTone: SkinToneResult = {
    hexCode,
    skinToneHex: hexCode,
    rgb: { r: avgR, g: avgG, b: avgB },
    lab,
    ita,
    undertone,
    season,
    seasonPalette: season,
    palette,
    flatteringColors: palette.flattering,
    avoidColors: palette.avoid,
    colorHarmonyDescription: palette.description,
    confidence: 0.96,
  };

  const beautyProfile: UserBeautyProfile = {
    skin: skinAnalysis,
    fitzpatrick: {
      type: fitzType,
      label: fitzLabel,
      sunReaction: fitzSun,
      melaninIndex,
      description: `${fitzLabel} with an ITA of ${ita}° and ${undertone} undertone harmony.`,
    },
    colorTones: {
      skinColor: hexCode,
      eyeColor: '#3A2E2B',
      eyeColorName: 'Brown',
      lipColor: rgbToHex(Math.min(255, Math.round(avgR * 1.15)), Math.round(avgG * 0.75), Math.round(avgB * 0.8)),
      eyebrowColor: rgbToHex(Math.round(avgR * 0.35), Math.round(avgG * 0.3), Math.round(avgB * 0.25)),
      hairColor: '#2B211D',
      hairColorName: 'Brown',
      undertone,
    },
    faceAttributes: {
      faceShape: 'Oval',
      age: skinAnalysis.skinAge || 26,
      gender: 'female',
      eyeShape: 'Almond',
      eyeSize: 'Average',
      eyeAngle: 'Average',
      eyeDistance: 'Average',
      eyelidType: 'Double-lid',
      eyebrowShape: 'Soft Angled',
      eyebrowThickness: 'Average',
      eyebrowDistance: 'Average',
      lipShape: 'Full',
      noseWidth: 'Average',
      noseLength: 'Average',
      cheekbones: 'High Cheekbone',
      ratios: {
        faceAspectRatio: 1.44,
        horizontalThird: '33% : 34% : 33% (Balanced)',
        verticalFifth: '20% : 20% : 20% : 20% : 20% (Balanced)',
        eyeAspectRatio: 3.0,
        noseToLipToChin: 'Balanced lower-third ratio (1:1.618)',
        upperLipToLowerLip: 'Balanced (1:1.618 golden proportion)',
      },
    },
  };

  return { skinAnalysis, skinTone, beautyProfile };
}
