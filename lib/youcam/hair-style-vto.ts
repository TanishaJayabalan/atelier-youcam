import { uploadFile, runTask, pollTask } from './client';

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
    id: 'style_wavy_lob',
    name: 'Textured Coastal Waves Lob',
    category: 'wavy',
    previewImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    suitableFaceShapes: ['Oval', 'Round', 'Square', 'Heart'],
    effortLevel: 'Medium (15 mins)',
    description: 'Shoulder-grazing dimensional beach waves with soft face-framing layers.',
  },
  {
    id: 'style_curtain_blowout',
    name: '90s Layered Curtain Blowout',
    category: 'wavy',
    previewImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    suitableFaceShapes: ['Oval', 'Square', 'Diamond', 'Oblong'],
    effortLevel: 'High (Styling required)',
    description: 'Voluminous cascading butterfly layers with curtain bangs that frame the cheekbones.',
  },
  {
    id: 'style_sleek_sidepart',
    name: 'Glass Hair Sleek Bob',
    category: 'sleek',
    previewImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    suitableFaceShapes: ['Oval', 'Heart', 'Diamond'],
    effortLevel: 'Low (5 mins)',
    description: 'Ultra-glossy razor-sharp blunt cut with a deep side part for high-contrast structure.',
  },
  {
    id: 'style_voluminous_curls',
    name: 'Hydrated Defined Ringlets',
    category: 'curly',
    previewImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    suitableFaceShapes: ['Oval', 'Round', 'Triangle'],
    effortLevel: 'Medium (15 mins)',
    description: 'Bouncy, frizz-free defined curl clusters with root volume and perimeter shape.',
  },
  {
    id: 'style_french_bob',
    name: 'Chic Parisian French Bob with Fringe',
    category: 'short',
    previewImageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    suitableFaceShapes: ['Oval', 'Heart', 'Oblong'],
    effortLevel: 'Low (5 mins)',
    description: 'Chin-length micro bob paired with wispy eyebrow-grazing bangs.',
  },
];

export async function applyHairStyleVTO(
  imageInput: Buffer | string,
  templateId: string = 'style_wavy_lob'
): Promise<{ imageUrl: string; template: HairStyleTemplate }> {
  const chosenTemplate = HAIRSTYLE_TEMPLATES.find((t) => t.id === templateId) || HAIRSTYLE_TEMPLATES[0];
  const fallbackUrl = typeof imageInput === 'string' && imageInput.startsWith('http') ? imageInput : chosenTemplate.previewImageUrl;

  try {
    let fileId: string;
    if (Buffer.isBuffer(imageInput)) {
      fileId = await uploadFile('/s2s/v2.0/file', imageInput, 'image/jpeg', 'hairstyle_src.jpg');
    } else {
      fileId = imageInput;
    }

    const taskId = await runTask('/s2s/v2.1/task/hair-transfer', {
      src_file_id: fileId.startsWith('http') ? undefined : fileId,
      src_file_url: fileId.startsWith('http') ? fileId : undefined,
      template_id: templateId,
    });

    const result = await pollTask<any>('/s2s/v2.1/task/hair-transfer', taskId, {
      timeoutMs: 30000,
      mockResultGenerator: () => ({ url: fallbackUrl }),
    });

    const outputUrl =
      result?.url ||
      result?.results?.url ||
      result?.result?.url ||
      result?.data?.url ||
      fallbackUrl;

    return {
      imageUrl: outputUrl,
      template: chosenTemplate,
    };
  } catch (err) {
    console.warn('Hair style VTO fallback:', err);
    return {
      imageUrl: fallbackUrl,
      template: chosenTemplate,
    };
  }
}
