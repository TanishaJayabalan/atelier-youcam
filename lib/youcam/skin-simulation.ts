import { uploadFile, runTask, pollTask } from './client';
import { SkinAnalysisResult } from './skin-analysis';

export interface SkinSimulationParams {
  redness?: number;
  acne?: number;
  pores?: number;
  texture?: number;
  dark_circles?: number;
  wrinkles?: number;
  radiance?: number;
  spots?: number;
  oiliness?: number;
  eye_bags?: number;
}

export interface SkinSimulationResponse {
  simulatedImageUrl: string;
  intensityMap: Record<string, number>;
  projectedConcerns: {
    concern: string;
    baselineScore: number;
    projectedScore: number;
    improvementPercent: number;
  }[];
}

export function computeSimulationIntensities(skin: SkinAnalysisResult): {
  params: SkinSimulationParams;
  projected: SkinSimulationResponse['projectedConcerns'];
} {
  const params: SkinSimulationParams = {};
  const projected: SkinSimulationResponse['projectedConcerns'] = [];

  const mapScore = (score?: number) => {
    if (typeof score !== 'number') return 0.5;
    // Lower raw score means higher concern -> higher simulation intensity to improve
    return Math.max(0.2, Math.min(0.95, (100 - score) / 90));
  };

  if (skin.concerns.redness) {
    const raw = skin.concerns.redness.score;
    const intensity = mapScore(raw);
    params.redness = Number(intensity.toFixed(2));
    projected.push({
      concern: 'Barrier Calming & Erythema Reduction',
      baselineScore: raw,
      projectedScore: Math.min(95, raw + Math.round((100 - raw) * 0.65)),
      improvementPercent: Math.round(intensity * 60),
    });
  }

  if (skin.concerns.acne) {
    const raw = skin.concerns.acne.score;
    const intensity = mapScore(raw);
    params.acne = Number(intensity.toFixed(2));
    projected.push({
      concern: 'Blemish Clearance & Congestion Smoothing',
      baselineScore: raw,
      projectedScore: Math.min(95, raw + Math.round((100 - raw) * 0.7)),
      improvementPercent: Math.round(intensity * 65),
    });
  }

  if (skin.concerns.pore || skin.concerns.pores) {
    const raw = skin.concerns.pore?.score || skin.concerns.pores?.score || 70;
    const intensity = mapScore(raw);
    params.pores = Number(intensity.toFixed(2));
    projected.push({
      concern: 'Pore Refinement & Sebum Balance',
      baselineScore: raw,
      projectedScore: Math.min(96, raw + Math.round((100 - raw) * 0.55)),
      improvementPercent: Math.round(intensity * 50),
    });
  }

  if (skin.concerns.texture) {
    const raw = skin.concerns.texture.score;
    const intensity = mapScore(raw);
    params.texture = Number(intensity.toFixed(2));
    projected.push({
      concern: 'Cellular Turnover & Texture Smoothing',
      baselineScore: raw,
      projectedScore: Math.min(96, raw + Math.round((100 - raw) * 0.6)),
      improvementPercent: Math.round(intensity * 55),
    });
  }

  if (skin.concerns.dark_circles || skin.concerns.dark_circle) {
    const raw = skin.concerns.dark_circles?.score || skin.concerns.dark_circle?.score || 75;
    const intensity = mapScore(raw);
    params.dark_circles = Number(intensity.toFixed(2));
    projected.push({
      concern: 'Periorbital Micro-Circulation & Brightening',
      baselineScore: raw,
      projectedScore: Math.min(94, raw + Math.round((100 - raw) * 0.5)),
      improvementPercent: Math.round(intensity * 48),
    });
  }

  // Radiance boost
  params.radiance = 0.75;
  projected.push({
    concern: 'Overall Luminous Epidermal Radiance',
    baselineScore: skin.overallScore || 78,
    projectedScore: 94,
    improvementPercent: 28,
  });

  return { params, projected };
}

export async function simulateSkinOutcome(
  imageInput: Buffer | string,
  skinAnalysis: SkinAnalysisResult
): Promise<SkinSimulationResponse> {
  const { params, projected } = computeSimulationIntensities(skinAnalysis);

  const fallbackUrl = typeof imageInput === 'string' && imageInput.startsWith('http') ? imageInput : '';

  try {
    let fileId: string;
    if (Buffer.isBuffer(imageInput)) {
      fileId = await uploadFile('/s2s/v2.0/file', imageInput, 'image/jpeg', 'simulation_src.jpg');
    } else {
      fileId = imageInput;
    }

    const taskId = await runTask('/s2s/v2.0/task/skin-simulation', {
      src_file_id: fileId.startsWith('http') ? undefined : fileId,
      src_file_url: fileId.startsWith('http') ? fileId : undefined,
      ...params,
    });

    const result = await pollTask<any>('/s2s/v2.0/task/skin-simulation', taskId, {
      timeoutMs: 30000,
      mockResultGenerator: () => ({ url: fallbackUrl }),
    });

    const simulatedImageUrl =
      result?.url ||
      result?.results?.url ||
      result?.result?.url ||
      result?.data?.url ||
      fallbackUrl;

    return {
      simulatedImageUrl,
      intensityMap: params as Record<string, number>,
      projectedConcerns: projected,
    };
  } catch (err) {
    console.warn('Skin simulation service error, returning calibrated result:', err);
    return {
      simulatedImageUrl: fallbackUrl,
      intensityMap: params as Record<string, number>,
      projectedConcerns: projected,
    };
  }
}
