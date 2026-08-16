import { uploadFile, runTask, pollTask } from './client';
import { ColorTonesResult } from '@/types/beauty-profile';

export interface HairColorShade {
  id: string;
  name: string;
  hex: string;
  toneFamily: 'Warm Bronze' | 'Rich Brunette' | 'Golden Blonde' | 'Copper Red' | 'Cool Berry' | 'Platinum Cool';
  flatteringUndertones: ('warm' | 'cool' | 'neutral' | 'olive')[];
  description: string;
}

export const HAIR_COLOR_SHADES: HairColorShade[] = [
  {
    id: 'color_caramel_balayage',
    name: 'Toasted Caramel Balayage',
    hex: '#A06E46',
    toneFamily: 'Warm Bronze',
    flatteringUndertones: ['warm', 'olive', 'neutral'],
    description: 'Golden honey highlights blended through a warm chestnut base for sun-kissed dimension.',
  },
  {
    id: 'color_espresso_gloss',
    name: 'Glass Gloss Espresso',
    hex: '#231815',
    toneFamily: 'Rich Brunette',
    flatteringUndertones: ['warm', 'cool', 'neutral', 'olive'],
    description: 'Deep ultra-glossy monochromatic espresso with mirror-like shine reflection.',
  },
  {
    id: 'color_honey_amber',
    name: 'Spiced Honey Amber',
    hex: '#C58F49',
    toneFamily: 'Golden Blonde',
    flatteringUndertones: ['warm', 'neutral'],
    description: 'Luminous multi-tonal butterscotch gold that illuminates fair to medium warm skin.',
  },
  {
    id: 'color_auburn_copper',
    name: 'Velvet Auburn Copper',
    hex: '#8C3D26',
    toneFamily: 'Copper Red',
    flatteringUndertones: ['warm', 'olive'],
    description: 'Vibrant autumnal cinnamon and crushed copper tones that amplify eye color intensity.',
  },
  {
    id: 'color_ruby_burgundy',
    name: 'Midnight Ruby Wine',
    hex: '#5E1B2C',
    toneFamily: 'Cool Berry',
    flatteringUndertones: ['cool', 'neutral'],
    description: 'Sultry deep violet-red wine tone offering striking high-contrast sophistication.',
  },
  {
    id: 'color_ash_smoky',
    name: 'Smoky Ash Beige',
    hex: '#7E756C',
    toneFamily: 'Platinum Cool',
    flatteringUndertones: ['cool', 'neutral'],
    description: 'Muted cool beige with silver pearl undertones that neutralize brassiness.',
  },
];

export function getRecommendedHairColors(colorTones?: ColorTonesResult): HairColorShade[] {
  const undertone = colorTones?.undertone || 'warm';
  return HAIR_COLOR_SHADES.filter((s) => s.flatteringUndertones.includes(undertone));
}

export async function applyHairColorVTO(
  imageInput: Buffer | string,
  colorId: string = 'color_caramel_balayage'
): Promise<{ imageUrl: string; shade: HairColorShade }> {
  const chosenShade = HAIR_COLOR_SHADES.find((c) => c.id === colorId) || HAIR_COLOR_SHADES[0];

  try {
    let fileId: string;
    if (Buffer.isBuffer(imageInput)) {
      fileId = await uploadFile('/s2s/v2.0/file', imageInput, 'image/jpeg', 'haircolor_src.jpg');
    } else {
      fileId = imageInput;
    }

    const taskId = await runTask('/s2s/v2.0/task/hair-color', {
      src_file_id: fileId.startsWith('http') ? undefined : fileId,
      src_file_url: fileId.startsWith('http') ? fileId : undefined,
      pattern: { name: 'full' },
      palettes: [
        {
          color: chosenShade.hex,
          colorIntensity: 65,
          blend: 60,
        },
      ],
    });

    const result = await pollTask<any>('/s2s/v2.0/task/hair-color', taskId, {
      timeoutMs: 30000,
    });

    const outputUrl =
      result?.url ||
      result?.results?.url ||
      result?.result?.url ||
      result?.data?.url;

    if (!outputUrl) {
      throw new Error('YouCam hair color VTO returned no output image URL.');
    }

    return {
      imageUrl: outputUrl,
      shade: chosenShade,
    };
  } catch (err: any) {
    throw new Error(`Hair color VTO failed: ${err.message}`);
  }
}
