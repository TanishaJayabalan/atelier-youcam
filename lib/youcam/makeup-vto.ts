import { uploadFile, runTask, pollTask, extractImageUrlFromResult } from './client';
import { YouCamCredentials } from './auth';

export type MakeupCategory = 'foundation' | 'blush' | 'lip' | 'eyeshadow' | 'eyebrow';

export interface MakeupStep {
  category: MakeupCategory;
  colorHex: string;
  intensity?: number; // 0 to 100
  finish?: 'matte' | 'dewy' | 'satin' | 'shimmer' | 'glossy' | 'gloss';
  pattern?: string;
  productName?: string;
}

export interface MakeupVTOResult {
  resultImageUrl: string;
  appliedSteps: MakeupStep[];
  rawResponse?: any;
}

/**
 * Builds the official YouCam v2.0 makeup effects payload structure.
 */
export function buildV2MakeupEffects(steps: MakeupStep[]): any[] {
  const effects: any[] = [
    {
      category: 'skin_smooth',
      skinSmoothStrength: 50,
      skinSmoothColorIntensity: 50,
    },
  ];

  for (const step of steps) {
    const intensity = typeof step.intensity === 'number' ? Math.max(0, Math.min(100, step.intensity)) : 60;
    const cleanHex = step.colorHex.startsWith('#') ? step.colorHex : `#${step.colorHex}`;

    if (step.category === 'lip') {
      const isGloss = step.finish === 'glossy' || step.finish === 'gloss';
      effects.push({
        category: 'lip_color',
        shape: { name: 'original' },
        morphology: { fullness: 20, wrinkless: 20 },
        style: { type: 'full' },
        palettes: [
          {
            color: cleanHex,
            texture: isGloss ? 'gloss' : 'matte',
            colorIntensity: intensity,
            gloss: isGloss ? 70 : undefined,
            transparencyIntensity: isGloss ? 50 : undefined,
          },
        ],
      });
    } else if (step.category === 'blush') {
      effects.push({
        category: 'blush',
        pattern: { name: '1color1' },
        palettes: [
          {
            color: cleanHex,
            texture: 'matte',
            colorIntensity: intensity,
          },
        ],
      });
    } else if (step.category === 'eyebrow') {
      effects.push({
        category: 'eyebrows',
        pattern: {
          type: 'shape',
          name: 'SoftArch1',
          curvature: 0,
          thickness: 0,
          definition: 0,
        },
        palettes: [
          {
            color: cleanHex,
            texture: 'matte',
            colorIntensity: intensity,
          },
        ],
      });
    } else if (step.category === 'eyeshadow') {
      effects.push({
        category: 'eye_shadow',
        pattern: { name: '1color1' },
        palettes: [
          {
            color: cleanHex,
            texture: 'matte',
            colorIntensity: intensity,
          },
        ],
      });
    } else if (step.category === 'foundation') {
      effects.push({
        category: 'foundation',
        palettes: [
          {
            color: cleanHex,
            colorIntensity: intensity,
            glowIntensity: 40,
            coverageIntensity: 50,
          },
        ],
      });
    }
  }

  return effects;
}

export const buildMakeupActions = buildV2MakeupEffects;

/**
 * Executes Makeup Virtual Try-On using YouCam S2S v2.0 API.
 */
export async function applyMakeup(
  selfieBuffer: Buffer,
  steps: MakeupStep[],
  contentType: string = 'image/jpeg',
  credentials?: YouCamCredentials
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
      'selfie_makeup_vto.jpg',
      credentials
    );

    // Step 2: Build official v2.0 effects array
    const effects = buildV2MakeupEffects(steps);

    // Step 3: Run task on /s2s/v2.0/task/makeup-vto
    const taskId = await runTask(
      '/s2s/v2.0/task/makeup-vto',
      {
        src_file_id: fileId,
        version: '1.0',
        effects,
      },
      credentials
    );

    // Step 4: Poll task result
    const rawResult: any = await pollTask(
      '/s2s/v2.0/task/makeup-vto',
      taskId,
      {
        timeoutMs: 120000,
      },
      credentials
    );

    const resultImageUrl = extractImageUrlFromResult(rawResult);

    if (!resultImageUrl) {
      console.error('[Makeup VTO Empty URL Raw Response]:', JSON.stringify(rawResult, null, 2));
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
