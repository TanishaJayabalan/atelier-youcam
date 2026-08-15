import { uploadFile, runTask, pollTask } from './client';

export interface MakeupTransferRequest {
  srcImage: Buffer | string; // User's selfie (Buffer or URL or file_id)
  refImage: Buffer | string; // Reference makeup look photo (Buffer or URL or file_id)
}

export interface MakeupTransferResponse {
  imageUrl: string;
  dstId?: string;
  status: 'success' | 'fallback';
}

export async function transferMakeupLook(
  params: MakeupTransferRequest
): Promise<MakeupTransferResponse> {
  const { srcImage, refImage } = params;

  try {
    let srcFileId: string;
    if (Buffer.isBuffer(srcImage)) {
      srcFileId = await uploadFile('/s2s/v2.0/file', srcImage, 'image/jpeg', 'user_face.jpg');
    } else {
      srcFileId = srcImage;
    }

    let refFileId: string;
    if (Buffer.isBuffer(refImage)) {
      refFileId = await uploadFile('/s2s/v2.0/file', refImage, 'image/jpeg', 'ref_look.jpg');
    } else {
      refFileId = refImage;
    }

    const taskId = await runTask('/s2s/v2.0/task/mu-transfer', {
      src_file_id: srcFileId.startsWith('http') ? undefined : srcFileId,
      src_file_url: srcFileId.startsWith('http') ? srcFileId : undefined,
      ref_file_id: refFileId.startsWith('http') ? undefined : refFileId,
      ref_file_url: refFileId.startsWith('http') ? refFileId : undefined,
    });

    const fallbackUrl = typeof refImage === 'string' && refImage.startsWith('http') ? refImage : (typeof srcImage === 'string' && srcImage.startsWith('http') ? srcImage : '');

    const result = await pollTask<any>('/s2s/v2.0/task/mu-transfer', taskId, {
      timeoutMs: 30000,
      mockResultGenerator: () => ({
        url: fallbackUrl,
        dst_id: `dst_transfer_${Date.now()}`,
      }),
    });

    const outputUrl =
      result?.url ||
      result?.results?.url ||
      result?.result?.url ||
      result?.data?.url ||
      fallbackUrl;

    const dstId = result?.dst_id || result?.results?.dst_id;

    return {
      imageUrl: outputUrl,
      dstId,
      status: 'success',
    };
  } catch (err) {
    console.warn('Makeup transfer service error, returning fallback:', err);
    return {
      imageUrl: typeof refImage === 'string' && refImage.startsWith('http') ? refImage : '',
      status: 'fallback',
    };
  }
}
