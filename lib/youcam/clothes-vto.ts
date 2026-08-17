import { uploadFile, runTask, pollTask } from './client';
import { resolveImageBuffer } from '@/lib/image-utils';

export type GarmentCategory =
  | 'upper_body'
  | 'lower_body'
  | 'full_body'
  | 'outer'
  | 'shoes'
  | 'auto';

export interface ClothesVTOResult {
  resultImageUrl: string;
  garmentName?: string;
  garmentCategory?: string;
  rawResponse: any;
}

/**
 * Normalizes user / recommendation category tags to valid YouCam S2S cloth-v4 garment categories.
 */
export function normalizeGarmentCategory(category?: string): GarmentCategory {
  if (!category) return 'upper_body';
  const cat = category.toLowerCase().trim();

  if (
    cat.includes('dress') ||
    cat.includes('gown') ||
    cat.includes('suit') ||
    cat.includes('jumpsuit') ||
    cat.includes('overall') ||
    cat.includes('full')
  ) {
    return 'full_body';
  }
  if (
    cat.includes('top') ||
    cat.includes('shirt') ||
    cat.includes('blouse') ||
    cat.includes('sweater') ||
    cat.includes('tee') ||
    cat.includes('tank')
  ) {
    return 'upper_body';
  }
  if (
    cat.includes('bottom') ||
    cat.includes('pant') ||
    cat.includes('skirt') ||
    cat.includes('jean') ||
    cat.includes('trouser') ||
    cat.includes('short')
  ) {
    return 'lower_body';
  }
  if (
    cat.includes('outer') ||
    cat.includes('jacket') ||
    cat.includes('coat') ||
    cat.includes('cardigan') ||
    cat.includes('blazer') ||
    cat.includes('trench')
  ) {
    return 'outer';
  }
  if (cat.includes('shoe') || cat.includes('boot') || cat.includes('sneaker') || cat.includes('heel')) {
    return 'shoes';
  }

  return 'upper_body';
}

/**
 * Calls YouCam Clothes VTO API (v4 /s2s/v2.0/task/cloth-v4) to fit garments onto a person's photo.
 */
export async function applyOutfit(
  selfieBuffer: Buffer,
  garmentBufferOrUrl: Buffer | string,
  options: {
    garmentName?: string;
    category?: string;
    selfieContentType?: string;
    garmentContentType?: string;
  } = {}
): Promise<ClothesVTOResult> {
  const {
    garmentName,
    category,
    selfieContentType = 'image/jpeg',
    garmentContentType = 'image/jpeg',
  } = options;

  const normalizedCategory = normalizeGarmentCategory(category);

  try {
    // Step 1: Upload selfie image (person source)
    const personFileId = await uploadFile(
      '/s2s/v2.0/file',
      selfieBuffer,
      selfieContentType,
      'selfie_person.jpg'
    );

    // Step 2: Upload or resolve garment image
    const { buffer: garmentBuffer, contentType: garmentType } = await resolveImageBuffer(garmentBufferOrUrl);
    const garmentFileId = await uploadFile(
      '/s2s/v2.0/file',
      garmentBuffer,
      garmentType || garmentContentType,
      'garment.jpg'
    );

    // Step 3: Run AI Clothes VTO Task with valid cloth-v4 payload
    const taskPayload: Record<string, any> = {
      src_file_id: personFileId,
      ref_file_id: garmentFileId,
      garment_category: normalizedCategory,
    };

    const taskId = await runTask('/s2s/v2.0/task/cloth-v4', taskPayload);

    // Step 4: Poll task result
    const rawResult: any = await pollTask('/s2s/v2.0/task/cloth-v4', taskId, {
      timeoutMs: 45000,
    });

    const resultImageUrl =
      rawResult?.resultImageUrl ||
      rawResult?.result_image_url ||
      rawResult?.file_url ||
      rawResult?.url ||
      rawResult?.results?.output_url ||
      rawResult?.results?.files?.[0]?.url;

    if (!resultImageUrl) {
      throw new Error('YouCam clothes VTO returned no output image URL.');
    }

    return {
      resultImageUrl,
      garmentName,
      garmentCategory: normalizedCategory,
      rawResponse: rawResult,
    };
  } catch (err: any) {
    throw new Error(`Clothes VTO failed: ${err.message}`);
  }
}

export interface GarmentToApply {
  name: string;
  category: string;
  image_url: string;
}

/**
 * Executes multi-garment virtual try-on in sequential pipeline (e.g. Top -> Bottom -> Outerwear).
 */
export async function applyMultiGarmentOutfit(
  initialBodyBuffer: Buffer,
  garments: GarmentToApply[],
  bodyContentType: string = 'image/jpeg'
): Promise<ClothesVTOResult> {
  const validGarments = garments.filter((g) => Boolean(g && g.image_url));
  if (validGarments.length === 0) {
    throw new Error('No valid garments provided for virtual try-on.');
  }

  let currentBuffer = initialBodyBuffer;
  let currentContentType = bodyContentType;
  let lastResult: ClothesVTOResult | null = null;

  for (let i = 0; i < validGarments.length; i++) {
    const garment = validGarments[i];
    
    // Apply current garment onto the canvas
    lastResult = await applyOutfit(currentBuffer, garment.image_url, {
      garmentName: garment.name,
      category: garment.category,
      selfieContentType: currentContentType,
    });

    // If there are subsequent garments to chain, fetch intermediate canvas output
    if (i < validGarments.length - 1 && lastResult.resultImageUrl) {
      try {
        const intermediateRes = await fetch(lastResult.resultImageUrl);
        if (intermediateRes.ok) {
          const intermediateArr = await intermediateRes.arrayBuffer();
          currentBuffer = Buffer.from(intermediateArr);
          currentContentType = 'image/jpeg';
        }
      } catch (chainErr) {
        console.warn('Could not fetch intermediate clothes VTO result for chaining:', chainErr);
      }
    }
  }

  if (!lastResult) {
    throw new Error('Clothes VTO failed to produce any result.');
  }

  return lastResult;
}


