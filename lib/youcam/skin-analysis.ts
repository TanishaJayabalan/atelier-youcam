import { uploadFile, runTask, pollTask } from './client';

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
  label?: string;
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
  concerns: Record<string, ConcernScore>;
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

const DISPLAY_NAMES: Record<string, string> = {
  spots: 'Hyperpigmentation & Spots',
  wrinkles: 'Fine Lines & Wrinkles',
  texture: 'Skin Smoothness & Texture',
  dark_circles: 'Periorbital Dark Circles',
  dark_circle: 'Periorbital Dark Circles',
  redness: 'Erythema & Active Redness',
  oiliness: 'Sebum & T-Zone Oiliness',
  moisture: 'Hydration Level',
  pores: 'Pore Enlargement',
  pore: 'Pore Enlargement',
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

export function normalizeSkinAnalysisResponse(raw: any): SkinAnalysisResult {
  const rawConcerns = raw?.concerns || raw?.results?.concerns || raw?.result?.concerns || raw?.output || {};
  const typedConcerns: Record<string, ConcernScore> = {};

  for (const [key, val] of Object.entries(rawConcerns)) {
    const rawScore = typeof val === 'number' ? val : (val as any)?.score ?? (val as any)?.value ?? 0;
    const normalizedScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    const severity = scoreToSeverity(normalizedScore);
    const displayName = DISPLAY_NAMES[key] || key;

    typedConcerns[key] = {
      key: key as ConcernKey,
      displayName,
      label: displayName,
      score: normalizedScore,
      severity,
      subRegions: (val as any)?.sub_regions,
    };
  }

  const topConcerns = Object.values(typedConcerns)
    .filter((c) => ['redness', 'pores', 'pore', 'dark_circles', 'dark_circle', 'oiliness', 'texture', 'wrinkles', 'acne'].includes(c.key))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const rawType = (raw?.skin_type || raw?.skinType || raw?.result?.skin_type || 'normal').toLowerCase();
  let skinType: SkinType = 'normal';
  if (rawType.includes('oil')) skinType = 'oily';
  else if (rawType.includes('dry')) skinType = 'dry';
  else if (rawType.includes('combo') || rawType.includes('combination')) skinType = 'combination';
  else if (rawType.includes('sens')) skinType = 'sensitive';

  const scoredConcerns = Object.values(typedConcerns);
  const avgConcernScore = scoredConcerns.length > 0
    ? scoredConcerns.reduce((sum, c) => sum + c.score, 0) / scoredConcerns.length
    : 20;

  const overallScore =
    raw?.overall_score ||
    raw?.overallScore ||
    raw?.result?.overall_score ||
    Math.max(1, Math.min(100, Math.round(100 - avgConcernScore * 0.75)));

  return {
    skinType,
    overallScore: Math.max(1, Math.min(100, overallScore)),
    skinAge: raw?.skin_age || raw?.skinAge || undefined,
    concerns: typedConcerns,
    topConcerns,
    rawResponse: raw,
  };
}

export async function analyzeSkin(
  selfieBuffer: Buffer,
  contentType: string = 'image/jpeg'
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
    });

    return normalizeSkinAnalysisResponse(rawResult);
  } catch (err: any) {
    throw new Error(`Skin analysis failed: ${err.message}`);
  }
}
