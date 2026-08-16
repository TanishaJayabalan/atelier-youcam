import { uploadFile, runTask, pollTask } from './client';

export type MakeupCategory = 'foundation' | 'blush' | 'lip' | 'eyeshadow' | 'eyebrow';

export interface MakeupStep {
  category: MakeupCategory;
  colorHex: string;
  intensity?: number; // 0 to 100
  finish?: 'matte' | 'dewy' | 'satin' | 'shimmer' | 'glossy';
  pattern?: string;
  productName?: string;
}

export interface MakeupVTOResult {
  resultImageUrl: string;
  appliedSteps: MakeupStep[];
  rawResponse?: any;
}

/**
 * Maps standard categories and parameters into YouCam Makeup VTO task action objects.
 */
export function buildMakeupActions(steps: MakeupStep[]): Array<{ id: string; params: Record<string, any> }> {
  return steps.map((step) => {
    const intensity = typeof step.intensity === 'number' ? Math.max(0, Math.min(100, step.intensity)) : 75;
    const cleanHex = step.colorHex.startsWith('#') ? step.colorHex : `#${step.colorHex}`;

    const params: Record<string, any> = {
      color: cleanHex,
      intensity,
    };

    if (step.finish) {
      params.texture = step.finish;
    }
    if (step.pattern) {
      params.pattern = step.pattern;
    }

    let actionId: string = step.category;
    if (step.category === 'lip') actionId = 'lipstick';
    if (step.category === 'foundation') actionId = 'foundation';
    if (step.category === 'blush') actionId = 'blush';
    if (step.category === 'eyeshadow') actionId = 'eyeshadow';
    if (step.category === 'eyebrow') actionId = 'eyebrow';

    return {
      id: actionId,
      params,
    };
  });
}

/**
 * Executes Makeup Virtual Try-On using YouCam S2S API.
 */
export async function applyMakeup(
  selfieBuffer: Buffer,
  steps: MakeupStep[],
  contentType: string = 'image/jpeg'
): Promise<MakeupVTOResult> {
  if (!steps || steps.length === 0) {
    throw new Error('At least one makeup step is required for Virtual Try-On.');
  }

  try {
    // Step 1: Upload selfie image via standard File API
    const fileId = await uploadFile(
      '/s2s/v2.0/file',
      selfieBuffer,
      contentType,
      'selfie_makeup_vto.jpg'
    );

    // Step 2: Build actions and run task
    const taskId = await runTask('/s2s/v1.0/task/makeup-vto', {
      payload: {
        file_sets: {
          src_ids: [fileId],
        },
        actions: [
          {
            id: 0,
            params: {
              lipstick: steps.find((s) => s.category === 'lip')?.colorHex
                ? { color: steps.find((s) => s.category === 'lip')?.colorHex, intensity: steps.find((s) => s.category === 'lip')?.intensity || 80 }
                : undefined,
              blush: steps.find((s) => s.category === 'blush')?.colorHex
                ? { color: steps.find((s) => s.category === 'blush')?.colorHex, intensity: steps.find((s) => s.category === 'blush')?.intensity || 60 }
                : undefined,
              foundation: steps.find((s) => s.category === 'foundation')?.colorHex
                ? { color: steps.find((s) => s.category === 'foundation')?.colorHex, intensity: steps.find((s) => s.category === 'foundation')?.intensity || 75 }
                : undefined,
              eyeshadow: steps.find((s) => s.category === 'eyeshadow')?.colorHex
                ? { color: steps.find((s) => s.category === 'eyeshadow')?.colorHex, intensity: steps.find((s) => s.category === 'eyeshadow')?.intensity || 65 }
                : undefined,
              eyebrow: steps.find((s) => s.category === 'eyebrow')?.colorHex
                ? { color: steps.find((s) => s.category === 'eyebrow')?.colorHex, intensity: steps.find((s) => s.category === 'eyebrow')?.intensity || 70 }
                : undefined,
            },
          },
        ],
      },
    });

    // Step 3: Poll task result
    const rawResult: any = await pollTask('/s2s/v1.0/task/makeup-vto', taskId, {
      timeoutMs: 40000,
    });

    const resultImageUrl =
      rawResult?.resultImageUrl ||
      rawResult?.result_image_url ||
      rawResult?.file_url ||
      rawResult?.url ||
      rawResult?.results?.output_url ||
      rawResult?.results?.files?.[0]?.url;

    if (!resultImageUrl) {
      throw new Error('YouCam makeup VTO returned no output image URL.');
    }

    return {
      resultImageUrl,
      appliedSteps: steps,
      rawResponse: rawResult,
    };
  } catch (err: any) {
    throw new Error(`Makeup VTO failed: ${err.message}`);
  }
}
