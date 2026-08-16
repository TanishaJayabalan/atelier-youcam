import { uploadFile, runTask, pollTask } from './client';
import { FitzpatrickResult, FitzpatrickType } from '@/types/beauty-profile';

const FITZPATRICK_METADATA: Record<
  FitzpatrickType,
  { label: string; sunReaction: string; melaninIndex: number; description: string }
> = {
  I: {
    label: 'Type I: Fair / Ivory',
    sunReaction: 'Always burns rapidly, never tans without protection',
    melaninIndex: 15,
    description: 'Extremely sun-sensitive skin. Highly susceptible to photo-damage and erythema; needs mandatory daily SPF 50+ mineral protection.',
  },
  II: {
    label: 'Type II: Light Beige',
    sunReaction: 'Usually burns easily, tans minimally with difficulty',
    melaninIndex: 30,
    description: 'Fair to peach skin tone. Burns easily with limited melanin defense; requires broad-spectrum SPF 50 and antioxidant serum.',
  },
  III: {
    label: 'Type III: Medium Golden / Light Olive',
    sunReaction: 'Sometimes mild burn, gradually tans to golden honey',
    melaninIndex: 50,
    description: 'Balanced melanin baseline with moderate UV resilience. Tans well with gradual sun exposure; benefits from daily SPF 30-50.',
  },
  IV: {
    label: 'Type IV: Olive / Medium Brown',
    sunReaction: 'Rarely burns, tans easily to deep bronze',
    melaninIndex: 70,
    description: 'Melanin-rich Mediterranean/Asian/Latino skin. Low risk of acute sunburn, but prone to post-inflammatory hyperpigmentation; needs daily broad-spectrum defense.',
  },
  V: {
    label: 'Type V: Dark Brown / Rich Caramel',
    sunReaction: 'Very rarely burns, tans very easily and darkly',
    melaninIndex: 85,
    description: 'High natural melanin density offering elevated intrinsic UV shielding. Focus on barrier hydration, dark mark prevention, and non-chalky invisible SPF.',
  },
  VI: {
    label: 'Type VI: Deep Espresso / Ebony',
    sunReaction: 'Almost never burns, deeply pigmented',
    melaninIndex: 98,
    description: 'Maximum melanin protection. Prone to ashiness or post-inflammatory marks; best supported by hydrating ceramides and clear mineral/chemical SPF.',
  },
};

export async function analyzeFitzpatrickScale(
  imageInput: Buffer | string
): Promise<FitzpatrickResult> {
  const isBuffer = Buffer.isBuffer(imageInput);

  try {
    let fileId: string;
    if (isBuffer) {
      fileId = await uploadFile('/s2s/v2.0/file', imageInput, 'image/jpeg', 'fitzpatrick.jpg');
    } else {
      fileId = imageInput;
    }

    const taskId = await runTask('/s2s/v2.0/task/fitzpatrick-scale-analyzer', {
      src_file_id: fileId.startsWith('http') ? undefined : fileId,
      src_file_url: fileId.startsWith('http') ? fileId : undefined,
      version: '1.0',
    });

    const result = await pollTask<any>('/s2s/v2.0/task/fitzpatrick-scale-analyzer', taskId, {
      timeoutMs: 25000,
    });

    const rawType = result?.fitzpatrick_scale || result?.results?.fitzpatrick_scale;
    let resolvedType: FitzpatrickType = 'III';
    if (rawType) {
      const match = String(rawType).toUpperCase().trim();
      if (match.includes('VI') || match === 'TYPE 6') resolvedType = 'VI';
      else if (match.includes('V') || match === 'TYPE 5') resolvedType = 'V';
      else if (match.includes('IV') || match === 'TYPE 4') resolvedType = 'IV';
      else if (match.includes('III') || match === 'TYPE 3') resolvedType = 'III';
      else if (match.includes('II') || match === 'TYPE 2') resolvedType = 'II';
      else if (match.includes('I') || match === 'TYPE 1') resolvedType = 'I';
    }

    const meta = FITZPATRICK_METADATA[resolvedType];
    return {
      type: resolvedType,
      label: meta.label,
      sunReaction: meta.sunReaction,
      melaninIndex: meta.melaninIndex,
      description: meta.description,
    };
  } catch (err: any) {
    throw new Error(`Fitzpatrick classification failed: ${err.message}`);
  }
}
