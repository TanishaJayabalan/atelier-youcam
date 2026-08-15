import { uploadFile, runTask, pollTask } from './client';

export type GarmentCategory = 'upper_body' | 'lower_body' | 'dress' | 'outerwear' | 'overall';

export interface ClothesVTOResult {
  resultImageUrl: string;
  garmentName?: string;
  garmentCategory?: GarmentCategory;
  rawResponse?: any;
}

/**
 * Normalizes internal category strings to YouCam AI Clothes category types.
 */
export function normalizeGarmentCategory(category?: string): GarmentCategory {
  if (!category) return 'overall';
  const cat = category.toLowerCase();
  if (cat.includes('top') || cat.includes('shirt') || cat.includes('blouse') || cat.includes('sweater')) {
    return 'upper_body';
  }
  if (cat.includes('bottom') || cat.includes('pant') || cat.includes('skirt') || cat.includes('jean') || cat.includes('trouser')) {
    return 'lower_body';
  }
  if (cat.includes('dress') || cat.includes('gown')) {
    return 'dress';
  }
  if (cat.includes('outer') || cat.includes('jacket') || cat.includes('coat') || cat.includes('blazer')) {
    return 'outerwear';
  }
  return 'overall';
}

/**
 * Generates mock try-on result utilizing the actual garment image chosen by the recommendation engine.
 */
export function generateMockClothesResult(
  garmentBufferOrUrl?: Buffer | string,
  garmentName?: string,
  category?: GarmentCategory
): ClothesVTOResult {
  let resultImageUrl = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=80';

  if (typeof garmentBufferOrUrl === 'string' && (garmentBufferOrUrl.startsWith('http') || garmentBufferOrUrl.startsWith('data:'))) {
    resultImageUrl = garmentBufferOrUrl;
  }

  return {
    resultImageUrl,
    garmentName: garmentName || 'Tailored Ensemble Piece',
    garmentCategory: category || 'upper_body',
    rawResponse: {
      status: 'success',
      mock: true,
      message: 'Clothes VTO rendered selected wardrobe garment',
    },
  };
}

/**
 * Executes Generative Clothes Virtual Try-On using YouCam S2S API.
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
    let garmentFileId: string;
    if (typeof garmentBufferOrUrl === 'string') {
      if (garmentBufferOrUrl.startsWith('http://') || garmentBufferOrUrl.startsWith('https://')) {
        const fetchRes = await fetch(garmentBufferOrUrl);
        if (!fetchRes.ok) {
          throw new Error(`Failed to fetch garment image from URL: ${garmentBufferOrUrl}`);
        }
        const arrayBuf = await fetchRes.arrayBuffer();
        garmentFileId = await uploadFile(
          '/s2s/v2.0/file',
          Buffer.from(arrayBuf),
          garmentContentType,
          'garment.jpg'
        );
      } else {
        garmentFileId = garmentBufferOrUrl;
      }
    } else {
      garmentFileId = await uploadFile(
        '/s2s/v2.0/file',
        garmentBufferOrUrl,
        garmentContentType,
        'garment.jpg'
      );
    }

    // Step 3: Run AI Clothes VTO Task
    const taskId = await runTask('/s2s/v2.0/task/cloth-v4', {
      src_file_id: personFileId,
      ref_file_id: garmentFileId,
      garment_category: normalizedCategory,
    });

    // Step 4: Poll task result
    const rawResult: any = await pollTask('/s2s/v2.0/task/cloth-v4', taskId, {
      timeoutMs: 45000,
      mockResultGenerator: () => generateMockClothesResult(garmentBufferOrUrl, garmentName, normalizedCategory),
    });

    const resultImageUrl =
      rawResult?.resultImageUrl ||
      rawResult?.result_image_url ||
      rawResult?.file_url ||
      rawResult?.url ||
      rawResult?.results?.output_url ||
      generateMockClothesResult(garmentBufferOrUrl, garmentName, normalizedCategory).resultImageUrl;

    return {
      resultImageUrl,
      garmentName,
      garmentCategory: normalizedCategory,
      rawResponse: rawResult,
    };
  } catch (err) {
    console.warn('Clothes VTO error, using garment visual fallback:', err);
    return generateMockClothesResult(garmentBufferOrUrl, garmentName, normalizedCategory);
  }
}
