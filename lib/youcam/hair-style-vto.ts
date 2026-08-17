import { runTask, pollTask, resolveImageInput } from './client';
import { YouCamCredentials } from './auth';

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
    previewImageUrl: '/hair-styles/1.jpg',
    suitableFaceShapes: ['Oval', 'Round', 'Square', 'Heart'],
    effortLevel: 'Medium (15 mins)',
    description: 'Shoulder-grazing S-waves with dimensional face-framing softness.',
  },
  {
    id: 'female_blunt_bob',
    name: 'Modern Precision Blunt Bob',
    category: 'short',
    previewImageUrl: '/hair-styles/2.jpg',
    suitableFaceShapes: ['Oval', 'Heart', 'Oblong'],
    effortLevel: 'Low (5 mins)',
    description: 'Ultra-clean razor-sharp chin-length blunt cut with natural volume.',
  },
  {
    id: 'female_sleek_middle_part',
    name: 'Glass Hair Sleek Middle Part',
    category: 'sleek',
    previewImageUrl: '/hair-styles/3.jpg',
    suitableFaceShapes: ['Oval', 'Heart', 'Diamond'],
    effortLevel: 'Low (5 mins)',
    description: 'High-gloss polished middle-part straight length with reflective shine.',
  },
  {
    id: 'female_retro_brown_waves',
    name: 'Hollywood Retro Waves',
    category: 'wavy',
    previewImageUrl: '/hair-styles/4.jpg',
    suitableFaceShapes: ['Oval', 'Square', 'Diamond', 'Oblong'],
    effortLevel: 'High (Styling required)',
    description: 'Sculpted vintage glamour waves with defined side-swept architecture.',
  },
  {
    id: 'female_messy_bun_brown',
    name: 'Effortless Textured Topknot Updo',
    category: 'updo',
    previewImageUrl: '/hair-styles/5.jpg',
    suitableFaceShapes: ['Oval', 'Round', 'Triangle'],
    effortLevel: 'Low (5 mins)',
    description: 'Lived-in tousled crown bun with soft wispy tendrils.',
  },
];

export async function applyHairStyleVTO(
  imageInput: Buffer | string,
  templateId: string = 'female_blunt_bob',
  credentials?: YouCamCredentials
): Promise<{ imageUrl: string; template: HairStyleTemplate }> {
  const chosenTemplate = HAIRSTYLE_TEMPLATES.find((t) => t.id === templateId) || HAIRSTYLE_TEMPLATES[0];

  try {
    const imagePayload = await resolveImageInput(imageInput, 'hairstyle_src.jpg', '/s2s/v2.0/file', credentials);

    const taskId = await runTask(
      '/s2s/v2.1/task/hair-transfer',
      {
        ...imagePayload,
        template_id: chosenTemplate.id,
      },
      credentials
    );

    const result = await pollTask<any>(
      '/s2s/v2.1/task/hair-transfer',
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
