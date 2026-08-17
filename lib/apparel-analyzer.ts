import { ClosetCategory, OutfitMetadata } from './supabase';
import { normalizeGarmentCategory } from './youcam/clothes-vto';

export interface ClassifiedApparel {
  category: ClosetCategory;
  youcamCategory: 'full_body' | 'upper_body' | 'lower_body' | 'outer' | 'shoes' | 'auto';
  name: string;
  brand?: string;
  metadata: OutfitMetadata;
}

const COLOR_KEYWORDS: Record<string, { name: string; hex: string }> = {
  emerald: { name: 'Emerald Green', hex: '#097969' },
  green: { name: 'Forest Green', hex: '#2E8B57' },
  sage: { name: 'Sage Green', hex: '#8A9A5B' },
  olive: { name: 'Olive Green', hex: '#708238' },
  mint: { name: 'Mint Green', hex: '#98FF98' },
  red: { name: 'Crimson Red', hex: '#C41E3A' },
  scarlet: { name: 'Scarlet Red', hex: '#FF2400' },
  ruby: { name: 'Ruby Red', hex: '#9B111E' },
  burgundy: { name: 'Burgundy Wine', hex: '#800020' },
  maroon: { name: 'Deep Maroon', hex: '#5B0E2D' },
  black: { name: 'Onyx Black', hex: '#111111' },
  white: { name: 'Optical White', hex: '#FAFAFA' },
  cream: { name: 'Ivory Cream', hex: '#FDFBF7' },
  ivory: { name: 'Ivory Cream', hex: '#FFFFF0' },
  beige: { name: 'Sand Beige', hex: '#F5F5DC' },
  camel: { name: 'Warm Camel', hex: '#C19A6B' },
  tan: { name: 'Sandstone Tan', hex: '#D2B48C' },
  brown: { name: 'Espresso Brown', hex: '#3D2B1F' },
  mocha: { name: 'Mocha Brown', hex: '#4E3629' },
  navy: { name: 'Navy Midnight', hex: '#001F3F' },
  blue: { name: 'Royal Blue', hex: '#264366' },
  sky: { name: 'Sky Blue', hex: '#87CEEB' },
  cobalt: { name: 'Cobalt Blue', hex: '#0047AB' },
  pink: { name: 'Blush Rose', hex: '#E0837A' },
  rose: { name: 'Dusty Rose', hex: '#B76E79' },
  magenta: { name: 'Plum Magenta', hex: '#8E2800' },
  fuschia: { name: 'Vibrant Fuchsia', hex: '#C2185B' },
  fuchsia: { name: 'Vibrant Fuchsia', hex: '#C2185B' },
  purple: { name: 'Royal Purple', hex: '#4B0082' },
  lavender: { name: 'Soft Lavender', hex: '#E6E6FA' },
  yellow: { name: 'Butter Yellow', hex: '#FFFDD0' },
  gold: { name: 'Lustrous Gold', hex: '#D4AF37' },
  orange: { name: 'Terracotta Rust', hex: '#B85D43' },
  rust: { name: 'Terracotta Rust', hex: '#B85D43' },
  coral: { name: 'Warm Coral', hex: '#FF7F50' },
  peach: { name: 'Muted Peach', hex: '#FFDAB9' },
  grey: { name: 'Heather Grey', hex: '#808080' },
  gray: { name: 'Charcoal Grey', hex: '#505050' },
  silver: { name: 'Liquid Silver', hex: '#C0C0C0' },
};

/**
 * Extracts dominant color from image pixels if base64/buffer is available.
 */
function sampleAverageColorFromBase64(base64: string): { name: string; hex: string } {
  try {
    const raw = base64.replace(/^data:image\/[a-z]+;base64,/, '');
    const buf = Buffer.from(raw, 'base64');
    if (buf.length > 200) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      const step = Math.max(1, Math.floor(buf.length / 500));
      for (let i = 50; i < buf.length - 3; i += step) {
        rSum += buf[i];
        gSum += buf[i + 1];
        bSum += buf[i + 2];
        count++;
      }
      if (count > 0) {
        const r = Math.round(rSum / count);
        const g = Math.round(gSum / count);
        const b = Math.round(bSum / count);
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
        return { name: 'Sampled Palette', hex };
      }
    }
  } catch {
    // Fallback if parsing fails
  }
  return { name: 'Classic Tone', hex: '#262626' };
}

/**
 * Classifies apparel adhering strictly to YouCam Clothes V4 & MirrorCheck standards.
 */
export async function classifyApparelFromPhotoAndText(input: {
  textDescription: string;
  photoBase64?: string;
  brand?: string;
}): Promise<ClassifiedApparel> {
  const { textDescription, photoBase64, brand } = input;
  const descLower = (textDescription || '').toLowerCase();

  // 1. YouCam Category Detection
  let category: ClosetCategory = 'outfit_dress';
  if (
    descLower.includes('top') ||
    descLower.includes('shirt') ||
    descLower.includes('blouse') ||
    descLower.includes('tee') ||
    descLower.includes('t-shirt') ||
    descLower.includes('sweater') ||
    descLower.includes('bodysuit') ||
    descLower.includes('tank') ||
    descLower.includes('crop')
  ) {
    category = 'outfit_top';
  } else if (
    descLower.includes('pant') ||
    descLower.includes('trouser') ||
    descLower.includes('jean') ||
    descLower.includes('skirt') ||
    descLower.includes('short') ||
    descLower.includes('legging')
  ) {
    category = 'outfit_bottom';
  } else if (
    descLower.includes('blazer') ||
    descLower.includes('jacket') ||
    descLower.includes('coat') ||
    descLower.includes('trench') ||
    descLower.includes('cardigan') ||
    descLower.includes('outer') ||
    descLower.includes('vest')
  ) {
    category = 'outfit_outer';
  } else {
    category = 'outfit_dress';
  }

  const youcamCategory = normalizeGarmentCategory(category);

  // 2. Formality / Vibe Detection
  let formality_tag: 'casual' | 'classy' | 'elegant' | 'bold' = 'classy';
  if (
    descLower.includes('bold') ||
    descLower.includes('cutout') ||
    descLower.includes('asymmetric') ||
    descLower.includes('avant') ||
    descLower.includes('statement') ||
    descLower.includes('leather') ||
    descLower.includes('scarlet') ||
    descLower.includes('neon')
  ) {
    formality_tag = 'bold';
  } else if (
    descLower.includes('elegant') ||
    descLower.includes('satin') ||
    descLower.includes('silk') ||
    descLower.includes('gown') ||
    descLower.includes('velvet') ||
    descLower.includes('evening') ||
    descLower.includes('chiffon') ||
    descLower.includes('romantic')
  ) {
    formality_tag = 'elegant';
  } else if (
    descLower.includes('casual') ||
    descLower.includes('linen') ||
    descLower.includes('cotton') ||
    descLower.includes('denim') ||
    descLower.includes('sundress') ||
    descLower.includes('relaxed') ||
    descLower.includes('daily')
  ) {
    formality_tag = 'casual';
  } else {
    formality_tag = 'classy';
  }

  // 3. Color & Hex Detection
  let detectedColor = 'Classic Black';
  let detectedHex = '#1A1A1A';

  for (const [key, colorObj] of Object.entries(COLOR_KEYWORDS)) {
    if (descLower.includes(key)) {
      detectedColor = colorObj.name;
      detectedHex = colorObj.hex;
      break;
    }
  }

  // If no explicit color word detected and base64 is present, sample from image
  if (detectedHex === '#1A1A1A' && photoBase64) {
    const sampled = sampleAverageColorFromBase64(photoBase64);
    if (sampled.hex !== '#262626') {
      detectedHex = sampled.hex;
      detectedColor = sampled.name;
    }
  }

  // 4. Weather Tags Suitability
  let weather_tags: string[] = ['warm', 'cool'];
  if (
    descLower.includes('linen') ||
    descLower.includes('sundress') ||
    descLower.includes('summer') ||
    descLower.includes('chiffon') ||
    descLower.includes('sleeveless') ||
    descLower.includes('crop')
  ) {
    weather_tags = ['hot', 'warm'];
  } else if (
    descLower.includes('wool') ||
    descLower.includes('cashmere') ||
    descLower.includes('sweater') ||
    descLower.includes('velvet') ||
    descLower.includes('coat') ||
    descLower.includes('heavy')
  ) {
    weather_tags = ['cool', 'cold'];
  } else if (
    descLower.includes('trench') ||
    descLower.includes('leather') ||
    descLower.includes('waterproof')
  ) {
    weather_tags = ['rain', 'cool', 'cold'];
  }

  // 5. Fabric Detection
  let fabric = 'Premium Blend';
  if (descLower.includes('silk')) fabric = '100% Mulberry Silk';
  else if (descLower.includes('satin')) fabric = 'Gloss Satin';
  else if (descLower.includes('linen')) fabric = 'Pure Washed Linen';
  else if (descLower.includes('cotton')) fabric = 'Organic Cotton';
  else if (descLower.includes('wool')) fabric = 'Virgin Wool';
  else if (descLower.includes('cashmere')) fabric = '100% Cashmere';
  else if (descLower.includes('velvet')) fabric = 'Plush Velvet';
  else if (descLower.includes('leather')) fabric = 'Full-Grain Leather';
  else if (descLower.includes('denim')) fabric = 'Structured Denim';
  else if (descLower.includes('chiffon')) fabric = 'Delicate Chiffon';
  else if (descLower.includes('knit')) fabric = 'Ribbed Knit';

  // 6. Name Generation
  let cleanName = textDescription.trim();
  if (cleanName.length > 50) {
    cleanName = cleanName.substring(0, 50).trim();
  }
  // Capitalize properly
  cleanName = cleanName
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  if (!cleanName || cleanName.length < 3) {
    cleanName = `${detectedColor} ${category === 'outfit_dress' ? 'Dress' : category.replace('outfit_', '')}`;
  }

  return {
    category,
    youcamCategory,
    name: cleanName,
    brand: brand || 'Custom Collection',
    metadata: {
      formality_tag,
      color: detectedColor,
      color_hex: detectedHex,
      weather_tags,
      fabric,
    },
  };
}
