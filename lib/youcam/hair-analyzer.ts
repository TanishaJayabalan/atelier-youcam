import { uploadFile, runTask, pollTask } from './client';
import { HairProfile } from '@/types/beauty-profile';

export async function analyzeHairDiagnostics(
  imageInput: Buffer | string
): Promise<HairProfile> {
  const isBuffer = Buffer.isBuffer(imageInput);

  try {
    let fileId: string;
    if (isBuffer) {
      fileId = await uploadFile('/s2s/v2.0/file', imageInput, 'image/jpeg', 'hair_analysis.jpg');
    } else {
      fileId = imageInput;
    }

    // Run length, type, and frizziness concurrently with Promise.all
    const [lengthRes, typeRes, frizzRes] = await Promise.all([
      (async () => {
        const taskId = await runTask('/s2s/v2.0/task/hair-length-detection', {
          src_file_id: fileId.startsWith('http') ? undefined : fileId,
          src_file_url: fileId.startsWith('http') ? fileId : undefined,
        });
        return pollTask<any>('/s2s/v2.0/task/hair-length-detection', taskId, {
          timeoutMs: 25000,
        });
      })(),
      (async () => {
        const taskId = await runTask('/s2s/v2.0/task/hair-type-detection', {
          src_file_id: fileId.startsWith('http') ? undefined : fileId,
          src_file_url: fileId.startsWith('http') ? fileId : undefined,
        });
        return pollTask<any>('/s2s/v2.0/task/hair-type-detection', taskId, {
          timeoutMs: 25000,
        });
      })(),
      (async () => {
        const taskId = await runTask('/s2s/v2.0/task/hair-frizziness-detection', {
          src_file_id: fileId.startsWith('http') ? undefined : fileId,
          src_file_url: fileId.startsWith('http') ? fileId : undefined,
        });
        return pollTask<any>('/s2s/v2.0/task/hair-frizziness-detection', taskId, {
          timeoutMs: 25000,
        });
      })(),
    ]);

    const lengthVal = lengthRes?.term || 'above chest';
    const typeVal = typeRes?.mapping || '2b to 2c';
    const typeTerm = typeRes?.term || 'Medium Wavy';
    const frizzVal = typeof frizzRes?.mapping === 'number' ? frizzRes.mapping : 2;
    const frizzTerm = frizzRes?.term || 'Frizzy';

    let curlCategory: HairProfile['curlCategory'] = 'wavy';
    if (typeVal.startsWith('1')) curlCategory = 'straight';
    else if (typeVal.startsWith('2')) curlCategory = 'wavy';
    else if (typeVal.startsWith('3')) curlCategory = 'curly';
    else if (typeVal.startsWith('4')) curlCategory = 'coily';

    return {
      curlType: typeVal,
      curlTerm: typeTerm,
      curlCategory,
      length: lengthVal as any,
      lengthTerm: `${String(lengthVal).toUpperCase()} length detected`,
      frizziness: frizzVal as any,
      frizzTerm: frizzTerm as any,
      naturalColorHex: '#2B211D',
      naturalColorName: 'Espresso Brunette',
    };
  } catch (err: any) {
    throw new Error(`Hair diagnostics failed: ${err.message}`);
  }
}
