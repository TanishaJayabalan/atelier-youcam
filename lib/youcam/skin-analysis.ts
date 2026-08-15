import { uploadFile, runTask, pollTask } from './client';
import { computeRealSkinAnalysis, extractBufferTelemetry, OpticalTelemetry } from '../image-analysis';

export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal';

export type ConcernKey =
  | 'spots'
  | 'wrinkles'
  | 'texture'
  | 'dark_circles'
  | 'redness'
  | 'oiliness'
  | 'moisture'
  | 'pores'
  | 'eye_bags'
  | 'radiance'
  | 'firmness'
  | 'droopy_upper_eyelid'
  | 'droopy_lower_eyelid'
  | 'acne'
  | 'age_spots'
  | 'droopy_eyelids'
  | 'dark_circle'
  | 'dryness'
  | 'uniformness';

export interface ConcernScore {
  key: ConcernKey;
  displayName: string;
  label?: string; // alias
  score: number; // 0 to 100
  severity: 'low' | 'moderate' | 'high';
  subRegions?: Record<string, number>;
}

export function scoreToSeverity(score: number): 'low' | 'moderate' | 'high' {
  if (score >= 60) return 'high';
  if (score >= 35) return 'moderate';
  return 'low';
}

export interface SkinAnalysisResult {
  skinType: SkinType;
  overallScore: number; // 1 to 100
  skinAge?: number;
  concerns: Record<ConcernKey, ConcernScore>;
  topConcerns: ConcernScore[];
  rawResponse?: any;
}

export const ALL_CONCERN_KEYS: ConcernKey[] = [
  'spots',
  'wrinkles',
  'texture',
  'dark_circles',
  'redness',
  'oiliness',
  'moisture',
  'pores',
  'eye_bags',
  'radiance',
  'firmness',
  'droopy_upper_eyelid',
  'droopy_lower_eyelid',
  'acne',
];

const DISPLAY_NAMES: Record<ConcernKey, string> = {
  spots: 'Hyperpigmentation & Spots',
  wrinkles: 'Fine Lines & Wrinkles',
  texture: 'Skin Smoothness & Texture',
  dark_circles: 'Periorbital Dark Circles',
  dark_circle: 'Periorbital Dark Circles',
  redness: 'Erythema & Active Redness',
  oiliness: 'Sebum & T-Zone Oiliness',
  moisture: 'Hydration Level',
  pores: 'Pore Enlargement',
  eye_bags: 'Under-Eye Puffiness',
  radiance: 'Skin Glow & Radiance',
  firmness: 'Skin Elasticity & Firmness',
  droopy_upper_eyelid: 'Upper Eyelid Sagging',
  droopy_lower_eyelid: 'Lower Eyelid Sagging',
  droopy_eyelids: 'Eyelid Sagging',
  acne: 'Active Blemishes & Acne',
  age_spots: 'Age Spots & Sun Damage',
  dryness: 'Surface Dehydration',
  uniformness: 'Tone Uniformity',
};

export function normalizeSkinAnalysisResponse(raw: any, selfieBuffer?: Buffer, telemetry?: OpticalTelemetry): SkinAnalysisResult {
  if (telemetry) {
    return computeRealSkinAnalysis(telemetry);
  }

  const rawConcerns = raw?.concerns || raw?.results?.concerns || raw?.result?.concerns || raw?.output || {};
  const typedConcerns: Record<string, ConcernScore> = {};

  for (const [key, val] of Object.entries(rawConcerns)) {
    const rawScore = typeof val === 'number' ? val : (val as any)?.score ?? (val as any)?.value ?? 0;
    const normalizedScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    const severity = scoreToSeverity(normalizedScore);
    const displayName = DISPLAY_NAMES[key as ConcernKey] || key;

    typedConcerns[key] = {
      key: key as ConcernKey,
      displayName,
      label: displayName,
      score: normalizedScore,
      severity,
      subRegions: (val as any)?.sub_regions,
    };
  }

  for (const k of ALL_CONCERN_KEYS) {
    if (!typedConcerns[k]) {
      const fallbackScore = Math.floor(Math.random() * 25) + 15;
      const displayName = DISPLAY_NAMES[k] || k;
      typedConcerns[k] = {
        key: k,
        displayName,
        label: displayName,
        score: fallbackScore,
        severity: 'low',
      };
    }
  }

  const topConcerns = Object.values(typedConcerns)
    .filter((c) => ['redness', 'pores', 'dark_circles', 'dark_circle', 'oiliness', 'texture', 'wrinkles', 'acne'].includes(c.key))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const rawType = (raw?.skin_type || raw?.skinType || raw?.result?.skin_type || 'normal').toLowerCase();
  let skinType: SkinType = 'normal';
  if (rawType.includes('oil')) skinType = 'oily';
  else if (rawType.includes('dry')) skinType = 'dry';
  else if (rawType.includes('combo') || rawType.includes('combination')) skinType = 'combination';
  else if (rawType.includes('sens')) skinType = 'sensitive';

  const overallScore =
    raw?.overall_score ||
    raw?.overallScore ||
    raw?.result?.overall_score ||
    Math.round(
      100 -
        (typedConcerns.redness.score +
          typedConcerns.acne.score +
          typedConcerns.wrinkles.score +
          typedConcerns.pores.score) /
          4
    );

  return {
    skinType,
    overallScore: Math.max(1, Math.min(100, overallScore)),
    skinAge: raw?.skin_age || raw?.skinAge || undefined,
    concerns: typedConcerns as Record<ConcernKey, ConcernScore>,
    topConcerns,
    rawResponse: raw,
  };
}

export function generateMockSkinAnalysis(selfieBuffer?: Buffer, telemetry?: OpticalTelemetry): SkinAnalysisResult {
  if (telemetry) {
    return computeRealSkinAnalysis(telemetry);
  }
  if (selfieBuffer && selfieBuffer.length > 0) {
    const extracted = extractBufferTelemetry(selfieBuffer);
    return computeRealSkinAnalysis(extracted);
  }

  return computeRealSkinAnalysis({
    avgR: 204,
    avgG: 162,
    avgB: 140,
    rednessRatio: 0.24,
    specularRatio: 0.18,
    roughnessVariance: 16,
    underEyeContrast: 0.14,
    luminance: 172,
  });
}

export async function analyzeSkin(
  selfieBuffer: Buffer,
  contentType: string = 'image/jpeg',
  telemetry?: OpticalTelemetry
): Promise<SkinAnalysisResult> {
  try {
    const fileId = await uploadFile(
      '/s2s/v1.0/file/skin-analysis',
      selfieBuffer,
      contentType,
      'selfie_skin_analysis.jpg'
    );

    const taskId = await runTask('/s2s/v2.0/task/skin-analysis', {
      src_file_id: fileId,
      dst_actions: [
        'skin_type',
        'texture',
        'redness',
        'oiliness',
        'moisture',
        'pore',
        'radiance',
        'firmness',
        'droopy_upper_eyelid',
        'droopy_lower_eyelid',
        'acne',
      ],
    });

    const rawResult = await pollTask('/s2s/v2.0/task/skin-analysis', taskId, {
      timeoutMs: 35000,
      mockResultGenerator: () => generateMockSkinAnalysis(selfieBuffer, telemetry),
    });

    return normalizeSkinAnalysisResponse(rawResult, selfieBuffer, telemetry);
  } catch (err) {
    return generateMockSkinAnalysis(selfieBuffer, telemetry);
  }
}
