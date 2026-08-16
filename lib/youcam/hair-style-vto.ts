import { runTask, pollTask, resolveImageInput } from './client';

export interface HairStyleTemplate {
  id: string;
  name: string;
  category: 'wavy' | 'sleek' | 'curly' | 'short' | 'updo';
  previewImageUrl: string;
  suitableFaceShapes: string[];
  effortLevel: 'Low (5 mins)' | 'Medium (15 mins)' | 'High (Styling required)';
  description: string;
}

export const HAIRSTYLE_TEMPLATES: HairStyleTemplate[] = [
  {
    id: 'female_s_wave_brunette',
    name: 'S-Wave Dimensional Brunette',
    category: 'wavy',
    previewImageUrl: 'https://cdn.perfectcorp.com/cms/8074cf6e-9299-4b2e-a10a-19849c5be4c2/1780540769370/file.jpg',
    suitableFaceShapes: ['Oval', 'Round', 'Square', 'Heart'],
    effortLevel: 'Medium (15 mins)',
    description: 'Shoulder-grazing S-waves with dimensional face-framing softness.',
  },
  {
    id: 'female_blunt_bob',
    name: 'Modern Precision Blunt Bob',
    category: 'short',
    previewImageUrl: 'https://cdn.perfectcorp.com/cms/9bc19ca5-2e6d-4816-8dc3-a6a1daf6593d/1781145851280/file.jpg',
    suitableFaceShapes: ['Oval', 'Heart', 'Oblong'],
    effortLevel: 'Low (5 mins)',
    description: 'Ultra-clean razor-sharp chin-length blunt cut with natural volume.',
  },
  {
    id: 'female_sleek_middle_part',
    name: 'Glass Hair Sleek Middle Part',
    category: 'sleek',
    previewImageUrl: 'https://cdn.perfectcorp.com/cms/658e8776-fdd0-4d78-8f35-1bbe27e902d4/1780543845278/file.jpg',
    suitableFaceShapes: ['Oval', 'Heart', 'Diamond'],
    effortLevel: 'Low (5 mins)',
    description: 'High-gloss polished middle-part straight length with reflective shine.',
  },
  {
    id: 'female_retro_brown_waves',
    name: 'Hollywood Retro Waves',
    category: 'wavy',
    previewImageUrl: 'https://cdn.perfectcorp.com/cms/ed330fc6-41b1-4d12-abcb-71dd43e620f8/1780540975822/file.jpg',
    suitableFaceShapes: ['Oval', 'Square', 'Diamond', 'Oblong'],
    effortLevel: 'High (Styling required)',
    description: 'Sculpted vintage glamour waves with defined side-swept architecture.',
  },
  {
    id: 'female_messy_bun_brown',
    name: 'Effortless Textured Topknot Updo',
    category: 'updo',
    previewImageUrl: 'https://cdn.perfectcorp.com/cms/0fcab08b-2e07-4173-bd91-aee43d6ad4a7/1780541079712/file.jpg',
    suitableFaceShapes: ['Oval', 'Round', 'Triangle'],
    effortLevel: 'Low (5 mins)',
    description: 'Lived-in tousled crown bun with soft wispy tendrils.',
  },
];

export async function applyHairStyleVTO(
  imageInput: Buffer | string,
  templateId: string = 'female_blunt_bob'
): Promise<{ imageUrl: string; template: HairStyleTemplate }> {
  const chosenTemplate = HAIRSTYLE_TEMPLATES.find((t) => t.id === templateId) || HAIRSTYLE_TEMPLATES[0];

  try {
    const imagePayload = await resolveImageInput(imageInput, 'hairstyle_src.jpg');

    const taskId = await runTask('/s2s/v2.1/task/hair-transfer', {
      ...imagePayload,
      template_id: chosenTemplate.id,
    });

    const result = await pollTask<any>('/s2s/v2.1/task/hair-transfer', taskId, {
      timeoutMs: 35000,
    });

    const outputUrl =
      result?.url ||
      result?.results?.url ||
      result?.result?.url ||
      result?.data?.url;

    if (!outputUrl) {
      throw new Error('YouCam hair style VTO returned no output image URL.');
    }

    return {
      imageUrl: outputUrl,
      template: chosenTemplate,
    };
  } catch (err: any) {
    throw new Error(`Hair style VTO failed: ${err.message}`);
  }
}
