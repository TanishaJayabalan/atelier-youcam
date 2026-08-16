import { uploadFile, runTask, pollTask } from './client';
import { ColorTonesResult } from '@/types/beauty-profile';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function detectUndertone(skinHex: string): 'warm' | 'cool' | 'neutral' | 'olive' {
  const { r, g, b } = hexToRgb(skinHex);
  const rbRatio = r / Math.max(b, 1);
  const rgRatio = r / Math.max(g, 1);
  const gbRatio = g / Math.max(b, 1);

  if (gbRatio > 1.25 && rbRatio < 1.45) {
    return 'olive';
  }
  if (rbRatio > 1.55 && rgRatio < 1.28) {
    return 'warm';
  }
  if (rbRatio < 1.35 || b > g * 0.85) {
    return 'cool';
  }
  return 'neutral';
}

export async function analyzeColorTones(
  imageInput: Buffer | string
): Promise<ColorTonesResult> {
  const isBuffer = Buffer.isBuffer(imageInput);

  try {
    let fileId: string;
    if (isBuffer) {
      fileId = await uploadFile('/s2s/v2.0/file', imageInput, 'image/jpeg', 'colortones.jpg');
    } else {
      fileId = imageInput;
    }

    const taskId = await runTask('/s2s/v2.0/task/skin-tone-analysis', {
      src_file_id: fileId.startsWith('http') ? undefined : fileId,
      src_file_url: fileId.startsWith('http') ? fileId : undefined,
      face_angle_strictness_level: 'medium',
    });

    const result = await pollTask<any>('/s2s/v2.0/task/skin-tone-analysis', taskId, {
      timeoutMs: 25000,
    });

    const colorObj =
      result?.data?.results?.color ||
      result?.results?.color ||
      result?.data?.color ||
      result?.color ||
      {};
    const skinColor = colorObj.skin_color || '#DFAC82';
    const eyeColor = colorObj.eye_color || '#3A2E2B';
    const eyeColorName = colorObj.eye_color_name || 'Brown';
    const lipColor = colorObj.lip_color || '#C86267';
    const eyebrowColor = colorObj.eyebrow_color || '#4A3B32';
    const hairColor = colorObj.hair_color || '#2B211D';
    const hairColorName = colorObj.hair_color_name || 'Brown';
    const undertone = detectUndertone(skinColor);

    return {
      skinColor,
      eyeColor,
      eyeColorName,
      lipColor,
      eyebrowColor,
      hairColor,
      hairColorName,
      undertone,
    };
  } catch (err: any) {
    throw new Error(`Color tones analysis failed: ${err.message}`);
  }
}
