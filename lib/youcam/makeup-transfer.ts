import { uploadFile, runTask, pollTask } from './client';
import { YouCamCredentials } from './auth';

export interface MakeupTransferRequest {
  srcImage: Buffer | string; // User's selfie (Buffer or URL or file_id)
  refImage: Buffer | string; // Reference makeup look photo (Buffer or URL or file_id)
  credentials?: YouCamCredentials;
}

export interface MakeupTransferResponse {
  imageUrl: string;
  dstId?: string;
  status: 'success';
}

export async function transferMakeupLook(
  params: MakeupTransferRequest
): Promise<MakeupTransferResponse> {
  const { srcImage, refImage, credentials } = params;

  try {
    let srcFileId: string;
    if (Buffer.isBuffer(srcImage)) {
      srcFileId = await uploadFile('/s2s/v2.0/file', srcImage, 'image/jpeg', 'user_face.jpg', credentials);
    } else {
      srcFileId = srcImage;
    }

    let refFileId: string;
    if (Buffer.isBuffer(refImage)) {
      refFileId = await uploadFile('/s2s/v2.0/file', refImage, 'image/jpeg', 'ref_look.jpg', credentials);
    } else {
      refFileId = refImage;
    }

    const taskId = await runTask(
      '/s2s/v2.0/task/mu-transfer',
      {
        src_file_id: srcFileId.startsWith('http') ? undefined : srcFileId,
        src_file_url: srcFileId.startsWith('http') ? srcFileId : undefined,
        ref_file_id: refFileId.startsWith('http') ? undefined : refFileId,
        ref_file_url: refFileId.startsWith('http') ? refFileId : undefined,
      },
      credentials
    );

    const result = await pollTask<any>(
      '/s2s/v2.0/task/mu-transfer',
      taskId,
      {
        timeoutMs: 120000,
      },
      credentials
    );

    const outputUrl =
      result?.url ||
      result?.results?.url ||
      result?.result?.url ||
      result?.data?.url;

    if (!outputUrl) {
      throw new Error('YouCam makeup transfer returned no output image URL.');
    }

    const dstId = result?.dst_id || result?.results?.dst_id;

    return {
      imageUrl: outputUrl,
      dstId,
      status: 'success',
    };
  } catch (err: any) {
    throw new Error(`Makeup transfer failed: ${err.message}`);
  }
}
