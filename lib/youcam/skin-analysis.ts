// @ts-ignore
import AdmZip from 'adm-zip';
import sharp from 'sharp';
import { uploadFile, runTask, pollTask } from './client';
import { YouCamCredentials } from './auth';

export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal';

export type ConcernKey =
  | 'spots'
  | 'wrinkles'
  | 'wrinkle'
  | 'texture'
  | 'dark_circles'
  | 'dark_circle'
  | 'dark_circle_v2'
  | 'redness'
  | 'oiliness'
  | 'moisture'
  | 'pores'
  | 'pore'
  | 'eye_bags'
  | 'eye_bag'
  | 'radiance'
  | 'firmness'
  | 'droopy_upper_eyelid'
  | 'droopy_lower_eyelid'
  | 'acne'
  | 'age_spots'
  | 'age_spot'
  | 'droopy_eyelids'
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
  wrinkle: 'Fine Lines & Wrinkles',
  texture: 'Skin Smoothness & Texture',
  dark_circles: 'Periorbital Dark Circles',
  dark_circle: 'Periorbital Dark Circles',
  dark_circle_v2: 'Periorbital Dark Circles',
  redness: 'Erythema & Active Redness',
  oiliness: 'Sebum & T-Zone Oiliness',
  moisture: 'Hydration Level',
  pores: 'Pore Enlargement',
  pore: 'Pore Enlargement',
  eye_bags: 'Under-Eye Puffiness',
  eye_bag: 'Under-Eye Puffiness',
  radiance: 'Skin Glow & Radiance',
  firmness: 'Skin Elasticity & Firmness',
  droopy_upper_eyelid: 'Upper Eyelid Sagging',
  droopy_lower_eyelid: 'Lower Eyelid Sagging',
  droopy_eyelids: 'Eyelid Sagging',
  acne: 'Active Blemishes & Acne',
  age_spots: 'Age Spots & Sun Damage',
  age_spot: 'Age Spots & Sun Damage',
  dryness: 'Surface Dehydration',
  uniformness: 'Tone Uniformity',
};

export function normalizeSkinAnalysisResponse(raw: any): SkinAnalysisResult {
  const typedConcerns: Record<string, ConcernScore> = {};
  let detectedSkinType: string | undefined;

  // 1. Unpack array format from YouCam S2S API (raw.data.results.output or raw.results.output)
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
      const cleanKey = key.replace(/^hd_/, '');
      const displayName = DISPLAY_NAMES[cleanKey] || DISPLAY_NAMES[key] || cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1).replace(/_/g, ' ');

      typedConcerns[cleanKey] = {
        key: cleanKey as ConcernKey,
        displayName,
        label: displayName,
        score: normalizedScore,
        severity,
        subRegions: item.sub_regions || item.subRegions,
      };
    }
  }

  // 2. Unpack score_info or object format (raw.data.results.score_info, raw.results.score_info, etc.)
  const rawObj =
    raw?.data?.results?.score_info ||
    raw?.results?.score_info ||
    raw?.score_info ||
    raw?.concerns ||
    raw?.results?.concerns ||
    raw?.result?.concerns ||
    raw?.data?.results?.concerns ||
    raw?.data?.concerns ||
    (!Array.isArray(raw?.output) && typeof raw?.output === 'object' ? raw.output : null) ||
    raw;

  if (rawObj && typeof rawObj === 'object') {
    for (const [key, val] of Object.entries(rawObj)) {
      if (!key || key === 'all' || key === 'skin_age' || key === 'resize_image' || key === 'url' || key === 'rawResponse') continue;
      const cleanKey = key.toLowerCase().replace(/^hd_/, '');

      if (cleanKey === 'skin_type') {
        if (typeof val === 'string') {
          detectedSkinType = val;
        } else if (val && typeof val === 'object') {
          detectedSkinType = (val as any).whole?.skin_type || (val as any).skin_type;
        }
        continue;
      }

      if (typedConcerns[cleanKey]) continue;

      let rawScore: number | undefined;
      let subRegions: Record<string, number> | undefined;

      if (typeof val === 'number') {
        rawScore = val;
      } else if (val && typeof val === 'object') {
        if (typeof (val as any).ui_score === 'number' || typeof (val as any).raw_score === 'number' || typeof (val as any).score === 'number') {
          rawScore = (val as any).ui_score ?? (val as any).raw_score ?? (val as any).score ?? (val as any).value;
        } else {
          // Check nested subregions
          const subScores: number[] = [];
          for (const subVal of Object.values(val as Record<string, any>)) {
            if (typeof subVal === 'number') subScores.push(subVal);
            else if (subVal && typeof subVal === 'object') {
              const s = (subVal as any).ui_score ?? (subVal as any).raw_score ?? (subVal as any).score;
              if (typeof s === 'number') subScores.push(s);
            }
          }
          if (subScores.length > 0) {
            rawScore = subScores.reduce((sum, s) => sum + s, 0) / subScores.length;
          }
          subRegions = val as Record<string, number>;
        }
      }

      if (rawScore !== undefined) {
        const normalizedScore = Math.max(0, Math.min(100, Math.round(Number(rawScore))));
        const severity = scoreToSeverity(normalizedScore);
        const displayName = DISPLAY_NAMES[cleanKey] || DISPLAY_NAMES[key] || cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1).replace(/_/g, ' ');

        typedConcerns[cleanKey] = {
          key: cleanKey as ConcernKey,
          displayName,
          label: displayName,
          score: normalizedScore,
          severity,
          subRegions,
        };
      }
    }
  }

  const topConcerns = Object.values(typedConcerns)
    .filter((c) =>
      ['redness', 'pores', 'pore', 'dark_circles', 'dark_circle', 'dark_circle_v2', 'oiliness', 'texture', 'wrinkles', 'wrinkle', 'acne', 'moisture', 'radiance'].includes(c.key)
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const rawType = (
    detectedSkinType ||
    raw?.skin_type ||
    raw?.skinType ||
    raw?.data?.results?.skin_type ||
    raw?.result?.skin_type ||
    raw?.data?.results?.score_info?.skin_type ||
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
      ? Math.round(scoredConcerns.reduce((sum, c) => sum + c.score, 0) / scoredConcerns.length)
      : undefined;

  // Determine overall score: prioritize YouCam explicit overall / all score, then biomarker mean
  const explicitOverall =
    raw?.all?.score ??
    raw?.data?.results?.score_info?.all?.ui_score ??
    raw?.data?.results?.score_info?.all?.raw_score ??
    raw?.data?.results?.score_info?.all?.score ??
    raw?.data?.results?.score_info?.all ??
    raw?.data?.results?.all ??
    raw?.results?.all ??
    raw?.overall_score ??
    raw?.overallScore;

  const overallScore = explicitOverall !== undefined
    ? Math.max(1, Math.min(100, Math.round(Number(explicitOverall))))
    : (avgConcernScore !== undefined ? Math.max(25, Math.min(98, avgConcernScore)) : 81);

  const detectedSkinAge =
    raw?.skin_age ??
    raw?.skinAge ??
    raw?.data?.results?.skin_age ??
    raw?.data?.results?.score_info?.skin_age ??
    undefined;

  return {
    skinType,
    overallScore: Math.max(1, Math.min(100, overallScore)),
    skinAge: detectedSkinAge ? Math.round(Number(detectedSkinAge)) : undefined,
    concerns: typedConcerns,
    topConcerns,
    rawResponse: raw,
  };
}

export async function analyzeSkin(
  selfieBuffer: Buffer,
  contentType: string = 'image/jpeg',
  credentials?: YouCamCredentials
): Promise<SkinAnalysisResult> {
  try {
    // 1. Auto-crop portrait to tight 70% center face & scale to crisp 768x768 to satisfy YouCam bounds
    let processedBuffer = selfieBuffer;
    try {
      const meta = await sharp(selfieBuffer).metadata();
      const w = meta.width || 600;
      const h = meta.height || 600;
      const cropW = Math.round(w * 0.70);
      const cropH = Math.round(h * 0.70);
      const left = Math.max(0, Math.min(w - cropW, Math.round((w - cropW) / 2)));
      const top = Math.max(0, Math.min(h - cropH, Math.round((h - cropH) / 3.2)));
      processedBuffer = await sharp(selfieBuffer)
        .extract({ left, top, width: cropW, height: cropH })
        .resize(768, 768, { fit: 'cover' })
        .jpeg({ quality: 95 })
        .toBuffer();
    } catch {
      processedBuffer = selfieBuffer;
    }

    const fileId = await uploadFile(
      '/s2s/v2.0/file',
      processedBuffer,
      contentType,
      'selfie_skin_analysis.jpg',
      credentials
    );

    const taskId = await runTask(
      '/s2s/v2.0/task/skin-analysis',
      {
        version: '2.0',
        src_file_id: fileId,
        dst_actions: [
          'wrinkle',
          'droopy_upper_eyelid',
          'droopy_lower_eyelid',
          'firmness',
          'acne',
          'moisture',
          'eye_bag',
          'dark_circle_v2',
          'age_spot',
          'radiance',
          'redness',
          'oiliness',
          'pore',
          'texture',
          'skin_type',
        ],
      },
      credentials
    );

    const rawResult = await pollTask<any>(
      '/s2s/v2.0/task/skin-analysis',
      taskId,
      {
        timeoutMs: 120000,
      },
      credentials
    );

    // If YouCam returned a zip package URL, fetch and extract score_info.json
    const zipUrl = rawResult?.url || rawResult?.results?.url || rawResult?.file_url;
    if (zipUrl && typeof zipUrl === 'string') {
      try {
        const zipRes = await fetch(zipUrl);
        if (zipRes.ok) {
          const zipBuf = Buffer.from(await zipRes.arrayBuffer());
          const zip = new AdmZip(zipBuf);
          const entries = zip.getEntries();
          for (const entry of entries) {
            if (entry.entryName.includes('score_info.json') || entry.entryName.endsWith('.json')) {
              const scoreJsonText = entry.getData().toString('utf8');
              const scoreObj = JSON.parse(scoreJsonText);
              return normalizeSkinAnalysisResponse(scoreObj);
            }
          }
        }
      } catch (zipErr) {
        console.warn('[Zip Unpack Warning]: Could not extract score_info.json from zip:', zipErr);
      }
    }

    return normalizeSkinAnalysisResponse(rawResult);
  } catch (err: any) {
    throw new Error(`Skin analysis failed: ${err.message}`);
  }
}

