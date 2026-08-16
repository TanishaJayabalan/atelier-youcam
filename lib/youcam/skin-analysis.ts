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
  const typedConcerns: Record<string, ConcernScore> = {};
  let detectedSkinType: string | undefined;

  // 1. Unpack array format from YouCam S2S API (raw.data.results.output)
  const outputArray =
    raw?.data?.results?.output ||
    raw?.results?.output ||
    raw?.output ||
    (Array.isArray(raw?.concerns) ? raw.concerns : null) ||
    (Array.isArray(raw?.data?.concerns) ? raw.data.concerns : null);

  if (Array.isArray(outputArray)) {
    for (const item of outputArray) {
      if (!item) continue;
      const key = (item.type || item.key || item.name || '').toLowerCase();
      if (!key) continue;

      if (key === 'skin_type') {
        detectedSkinType = item.skin_type || item.value || item.result;
        continue;
      }

      const rawScore =
        item.ui_score ??
        item.raw_score ??
        item.score ??
        item.value ??
        0;

      const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(rawScore))));
      const severity = scoreToSeverity(normalizedScore);
      const displayName = DISPLAY_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');

      typedConcerns[key] = {
        key: key as ConcernKey,
        displayName,
        label: displayName,
        score: normalizedScore,
        severity,
        subRegions: item.sub_regions || item.subRegions,
      };
    }
  }

  // 2. Unpack object format (fallback or mock format)
  const rawObj =
    raw?.concerns ||
    raw?.results?.concerns ||
    raw?.result?.concerns ||
    raw?.data?.results?.concerns ||
    raw?.data?.concerns ||
    (!Array.isArray(raw?.output) && typeof raw?.output === 'object' ? raw.output : null);

  if (rawObj && typeof rawObj === 'object') {
    for (const [key, val] of Object.entries(rawObj)) {
      if (!key || typedConcerns[key]) continue;
      const rawScore =
        typeof val === 'number'
          ? val
          : (val as any)?.ui_score ?? (val as any)?.raw_score ?? (val as any)?.score ?? (val as any)?.value ?? 0;
      const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(rawScore))));
      const severity = scoreToSeverity(normalizedScore);
      const displayName = DISPLAY_NAMES[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');

      typedConcerns[key] = {
        key: key as ConcernKey,
        displayName,
        label: displayName,
        score: normalizedScore,
        severity,
        subRegions: (val as any)?.sub_regions,
      };
    }
  }

  const topConcerns = Object.values(typedConcerns)
    .filter((c) =>
      ['redness', 'pores', 'pore', 'dark_circles', 'dark_circle', 'oiliness', 'texture', 'wrinkles', 'acne', 'moisture', 'radiance'].includes(c.key)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const rawType = (
    detectedSkinType ||
    raw?.skin_type ||
    raw?.skinType ||
    raw?.data?.results?.skin_type ||
    raw?.result?.skin_type ||
    'normal'
  ).toLowerCase();

  let skinType: SkinType = 'normal';
  if (rawType.includes('oil')) skinType = 'oily';
  else if (rawType.includes('dry')) skinType = 'dry';
  else if (rawType.includes('combo') || rawType.includes('combination')) skinType = 'combination';
  else if (rawType.includes('sens')) skinType = 'sensitive';

  const scoredConcerns = Object.values(typedConcerns);
  const avgConcernScore =
    scoredConcerns.length > 0
      ? scoredConcerns.reduce((sum, c) => sum + c.score, 0) / scoredConcerns.length
      : 20;

  const overallScore =
    raw?.overall_score ||
    raw?.overallScore ||
    raw?.data?.results?.overall_score ||
    raw?.result?.overall_score ||
    Math.max(1, Math.min(100, Math.round(100 - avgConcernScore * 0.75)));

  return {
    skinType,
    overallScore: Math.max(1, Math.min(100, overallScore)),
    skinAge: raw?.skin_age || raw?.skinAge || raw?.data?.results?.skin_age || undefined,
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
