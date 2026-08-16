import { uploadFile, runTask, pollTask } from './client';

export type GarmentCategory =
  | 'full_body'
  | 'upper_body'
  | 'lower_body'
  | 'outerwear'
  | 'shoes'
  | 'auto';

export interface ClothesVTOResult {
  resultImageUrl: string;
  garmentName?: string;
  garmentCategory?: GarmentCategory;
  rawResponse?: any;
}

/**
 * Normalizes internal category strings to YouCam AI Clothes v4.0 category types:
 * Allowed values by YouCam S2S cloth-v4: 'full_body' | 'upper_body' | 'lower_body' | 'outerwear' | 'shoes' | 'auto'
 */
export function normalizeGarmentCategory(category?: string): GarmentCategory {
  if (!category) return 'auto';
  const cat = category.toLowerCase();
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
    cat.includes('blazer') ||
    cat.includes('vest') ||
    cat.includes('cardigan')
  ) {
    return 'outerwear';
  }
  if (
    cat.includes('shoe') ||
    cat.includes('boot') ||
    cat.includes('sneaker') ||
    cat.includes('heel') ||
    cat.includes('sandal')
  ) {
    return 'shoes';
  }
  return 'auto';
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
    let garmentFileId: string | null = null;
    let directRefUrl: string | null = null;

    if (typeof garmentBufferOrUrl === 'string') {
      if (garmentBufferOrUrl.startsWith('http://') || garmentBufferOrUrl.startsWith('https://')) {
        directRefUrl = garmentBufferOrUrl;
        try {
          const fetchRes = await fetch(garmentBufferOrUrl);
          if (fetchRes.ok) {
            const arrayBuf = await fetchRes.arrayBuffer();
            garmentFileId = await uploadFile(
              '/s2s/v2.0/file',
              Buffer.from(arrayBuf),
              garmentContentType,
              'garment.jpg'
            );
          }
        } catch (fetchErr) {
          console.warn('Could not re-upload garment URL, falling back to direct URL:', fetchErr);
        }
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

    // Step 3: Run AI Clothes VTO Task with valid cloth-v4 payload
    const taskPayload: Record<string, any> = {
      src_file_id: personFileId,
      garment_category: normalizedCategory,
    };

    if (garmentFileId) {
      taskPayload.ref_file_id = garmentFileId;
    } else if (directRefUrl) {
      taskPayload.ref_file_url = directRefUrl;
    } else {
      throw new Error('No valid garment reference image or file ID available.');
    }

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

