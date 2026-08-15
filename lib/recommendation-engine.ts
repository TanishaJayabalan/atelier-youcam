import { SkinAnalysisResult } from './youcam/skin-analysis';
import { SkinToneResult } from './youcam/skin-tone';
import { MakeupStep, MakeupCategory } from './youcam/makeup-vto';
import { WeatherResult } from './weather';
import { ClosetItem, OutfitMetadata, MakeupMetadata, SkincareMetadata } from './supabase';

export interface SkincareStepRec {
  stepCategory: string;
  product?: ClosetItem;
  productName: string;
  timing: 'AM' | 'PM' | 'both';
  activeIngredients?: string[];
  actionNote: string;
  isModified?: boolean;
  warning?: string;
}

export interface OutfitRecommendation {
  topOrDress?: ClosetItem;
  bottom?: ClosetItem;
  outerwear?: ClosetItem;
  stylingRationale: string;
}

export interface GapFillSuggestion {
  category: string;
  suggestedProduct: string;
  reason: string;
  urgency: 'high' | 'medium' | 'recommended';
}

export interface Recommendation {
  vibe: 'classy' | 'elegant' | 'bold' | 'natural';
  skincareNotes: {
    warnings: string[];
    amSteps: SkincareStepRec[];
    pmSteps: SkincareStepRec[];
  };
  makeupSteps: MakeupStep[];
  outfit: OutfitRecommendation;
  gapFillSuggestions: GapFillSuggestion[];
  explanation: string;
}

// Vibe makeup configuration matrix
const VIBE_MAKEUP_PROFILES: Record<
  'classy' | 'elegant' | 'bold' | 'natural',
  {
    lipIntensity: number;
    blushIntensity: number;
    eyeIntensity: number;
    browIntensity: number;
    foundationIntensity: number;
    preferredFinish: 'matte' | 'dewy' | 'satin' | 'glossy';
    styleDesc: string;
  }
> = {
  classy: {
    lipIntensity: 75,
    blushIntensity: 65,
    eyeIntensity: 65,
    browIntensity: 70,
    foundationIntensity: 75,
    preferredFinish: 'satin',
    styleDesc: 'Refined, structured elegance with velvety skin and balanced definition',
  },
  elegant: {
    lipIntensity: 70,
    blushIntensity: 70,
    eyeIntensity: 55,
    browIntensity: 65,
    foundationIntensity: 70,
    preferredFinish: 'dewy',
    styleDesc: 'Luminous, ethereal glow with romantic soft-rose tones and radiant cheekbones',
  },
  bold: {
    lipIntensity: 90,
    blushIntensity: 75,
    eyeIntensity: 85,
    browIntensity: 85,
    foundationIntensity: 85,
    preferredFinish: 'matte',
    styleDesc: 'High-impact editorial contrast featuring defined brows and statement lip focus',
  },
  natural: {
    lipIntensity: 50,
    blushIntensity: 45,
    eyeIntensity: 40,
    browIntensity: 50,
    foundationIntensity: 50,
    preferredFinish: 'dewy',
    styleDesc: 'Effortless "clean girl" minimalism enhancing your natural skin luminosity',
  },
};

/**
 * Generates personalized Skincare, Makeup, and Outfit recommendations.
 * Pure function with zero side effects.
 */
export function generateRecommendation(input: {
  skin: SkinAnalysisResult;
  skinTone: SkinToneResult;
  weather: WeatherResult;
  vibe: 'classy' | 'elegant' | 'bold' | 'natural';
  closet: ClosetItem[];
}): Recommendation {
  const { skin, skinTone, weather, vibe, closet } = input;
  const ownedCloset = closet.filter((item) => item.is_owned);

  const warnings: string[] = [];
  const gapFills: GapFillSuggestion[] = [];

  // =========================================================================
  // 1. SKINCARE ROUTINE & CORRECTION LOGIC
  // =========================================================================
  const skincareItems = ownedCloset.filter((i) => i.category === 'skincare');
  
  const hasAcne = (skin.concerns.acne?.score || 0) >= 28 || skin.concerns.acne?.severity === 'high' || skin.concerns.acne?.severity === 'moderate';
  const hasHighRedness = (skin.concerns.redness?.score || 0) >= 32 || skin.concerns.redness?.severity !== 'low' || skin.skinType === 'sensitive';
  const hasHighOiliness = (skin.concerns.oiliness?.score || 0) >= 40 || skin.skinType === 'oily';
  const hasHighDryness = (skin.concerns.dryness?.score || 0) >= 40 || skin.skinType === 'dry';
  const hasDarkCircles = (skin.concerns.dark_circles?.score || 0) >= 35 || skin.concerns.dark_circle?.severity === 'high';

  const spf = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.step_category === 'spf');

  // Specific clinical alert banners
  if (hasAcne) {
    warnings.push(
      `Active Blemish & Acne Congestion Detected (${skin.concerns.acne.score}%): Incorporating 2% BHA Salicylic Acid and Niacinamide + Zinc to dissolve follicular plugs and reduce localized inflammation.`
    );
  } else if (hasHighRedness) {
    warnings.push(
      `Elevated Skin Redness Detected (${skin.concerns.redness.score}%): Your lipid barrier shows micro-vascular reactivity. Pausing PM exfoliating acids/retinol and buffering with soothing Centella Asiatica & Ceramides.`
    );
  }

  if (weather.uvIndex >= 6) {
    warnings.push(
      `High UV Index (${weather.uvIndex}): Direct UV exposure is intense today. Mineral SPF 50+ reapplication every 2 hours is required.`
    );
    if (!spf) {
      gapFills.push({
        category: 'Skincare (SPF)',
        suggestedProduct: 'Invisible Shield Daily Mineral SPF 50',
        reason: `Direct UV Index (${weather.uvIndex}) is high today. Broad-spectrum mineral sunscreen is required for photo-aging defense.`,
        urgency: 'high',
      });
    }
  }

  const amSteps: SkincareStepRec[] = [];
  const pmSteps: SkincareStepRec[] = [];

  // Dynamic product selection by skin type & weather suitability
  const cleansers = skincareItems.filter((i) => (i.metadata as SkincareMetadata)?.step_category === 'cleanser');
  const cleanser =
    (hasHighOiliness
      ? cleansers.find((c) => (c.metadata as SkincareMetadata)?.texture === 'foam')
      : cleansers.find((c) => (c.metadata as SkincareMetadata)?.texture === 'fluid' || (c.metadata as SkincareMetadata)?.texture === 'cream')) ||
    cleansers[0];

  const bhaItem = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.active_ingredients?.some((a) => a.includes('salicylic') || a.includes('bha')));
  const niacinamideItem = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.active_ingredients?.some((a) => a.includes('niacinamide') || a.includes('zinc')));
  const centellaItem = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.active_ingredients?.some((a) => a.includes('centella') || a.includes('madecassoside')));
  const haItem = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.active_ingredients?.some((a) => a.includes('hyaluronic')));
  const vitCItem = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.active_ingredients?.some((a) => a.includes('vitamin_c')));
  const retinolItem = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.active_ingredients?.some((a) => a.includes('retinol')));
  const caffeineItem = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.active_ingredients?.some((a) => a.includes('caffeine') || a.includes('egcg')));

  const moisturizers = skincareItems.filter((i) => (i.metadata as SkincareMetadata)?.step_category === 'moisturizer');
  const moisturizer =
    (hasHighOiliness || weather.tempC >= 26
      ? moisturizers.find((m) => (m.metadata as SkincareMetadata)?.texture === 'gel')
      : moisturizers.find((m) => (m.metadata as SkincareMetadata)?.texture === 'cream')) ||
    moisturizers[0];

  // ==================== AM ROUTINE ====================
  if (cleanser) {
    amSteps.push({
      stepCategory: 'Cleanser',
      product: cleanser,
      productName: cleanser.name,
      timing: 'AM',
      actionNote: hasHighOiliness
        ? `Foaming cleanse tailored to your ${skin.skinType} skin to clarify sebum excess.`
        : `Gentle morning cleanse tailored for ${skin.skinType} skin to refresh without stripping your barrier.`,
    });
  }

  // AM Active Serum Selection
  if (hasAcne && niacinamideItem) {
    amSteps.push({
      stepCategory: 'Blemish Control Serum',
      product: niacinamideItem,
      productName: niacinamideItem.name,
      timing: 'AM',
      activeIngredients: ['10% Niacinamide', '1% Zinc PCA'],
      actionNote: 'Regulates excess sebum production, clears follicular micro-congestion, and calms blemish redness.',
    });
  } else if (hasHighRedness && centellaItem) {
    amSteps.push({
      stepCategory: 'Soothing Barrier Ampoule',
      product: centellaItem,
      productName: centellaItem.name,
      timing: 'AM',
      activeIngredients: ['Centella Asiatica', 'Madecassoside'],
      actionNote: 'Calms morning erythema and strengthens micro-vascular resistance.',
    });
  } else if (hasHighDryness && haItem) {
    amSteps.push({
      stepCategory: 'Hydration Plumping Serum',
      product: haItem,
      productName: haItem.name,
      timing: 'AM',
      activeIngredients: ['Multi-Molecular Hyaluronic Acid'],
      actionNote: 'Replenishes deep cellular moisture to prevent flakiness under makeup.',
    });
  } else if (vitCItem) {
    amSteps.push({
      stepCategory: 'Antioxidant Radiance Serum',
      product: vitCItem,
      productName: vitCItem.name,
      timing: 'AM',
      activeIngredients: ['15% Vitamin C', 'Phytosterols'],
      actionNote: 'Free-radical defense and brightening synergy against ambient urban UV.',
    });
  }

  // AM Eye Treatment (If dark circles detected)
  if (hasDarkCircles && caffeineItem) {
    amSteps.push({
      stepCategory: 'Eye Contour Treatment',
      product: caffeineItem,
      productName: caffeineItem.name,
      timing: 'AM',
      activeIngredients: ['5% Caffeine', 'EGCG'],
      actionNote: 'Constricts dilated micro-capillaries to reduce periorbital dark circles and morning puffiness.',
    });
  }

  if (moisturizer) {
    amSteps.push({
      stepCategory: 'Moisturizer',
      product: moisturizer,
      productName: moisturizer.name,
      timing: 'AM',
      actionNote: weather.tempC >= 26
        ? `Lightweight gel moisture for warm weather (${weather.tempC}°C) to prevent shine under makeup.`
        : hasHighDryness
        ? 'Deep lipid replenishment to seal skin moisture barrier.'
        : 'Balancing layer to maintain hydration under makeup.',
    });
  }

  if (spf) {
    amSteps.push({
      stepCategory: 'Sun Protection (SPF)',
      product: spf,
      productName: spf.name,
      timing: 'AM',
      actionNote: `Essential broad-spectrum protection against today's UV index of ${weather.uvIndex}.`,
    });
  }

  // ==================== PM ROUTINE ====================
  if (cleanser) {
    pmSteps.push({
      stepCategory: 'Double Cleanse',
      product: cleanser,
      productName: cleanser.name,
      timing: 'PM',
      actionNote: 'Dissolves makeup, SPF, and environmental micro-pollutants.',
    });
  }

  // PM Targeted Treatment
  if (hasAcne && bhaItem) {
    pmSteps.push({
      stepCategory: 'Pore Clarifying Treatment (Targeted)',
      product: bhaItem,
      productName: bhaItem.name,
      timing: 'PM',
      activeIngredients: ['2% Salicylic Acid (BHA)', 'Green Tea'],
      actionNote: 'Penetrates oil-clogged pores to dissolve keratin plugs, exfoliate dead cells, and clear active acne breakouts.',
      isModified: true,
    });
  } else if (hasHighRedness && centellaItem) {
    pmSteps.push({
      stepCategory: 'Barrier Recovery Treatment (Corrected)',
      product: centellaItem,
      productName: centellaItem.name,
      timing: 'PM',
      activeIngredients: ['Centella Asiatica', 'Ceramides'],
      actionNote: 'Paused Retinol tonight due to elevated redness. Replaced with soothing Centella Asiatica & Ceramides to restore the barrier.',
      isModified: true,
      warning: 'Retinol paused for 24h until redness subdues.',
    });
  } else if (retinolItem) {
    pmSteps.push({
      stepCategory: 'Night Serum (Cellular Renewal)',
      product: retinolItem,
      productName: retinolItem.name,
      timing: 'PM',
      activeIngredients: ['0.5% Pure Retinol', 'Bisabolol'],
      actionNote: 'Stimulates cellular turnover, refines skin texture, and encourages collagen synthesis overnight.',
    });
  }

  if (moisturizer) {
    pmSteps.push({
      stepCategory: 'Barrier Recovery Cream',
      product: moisturizer,
      productName: moisturizer.name,
      timing: 'PM',
      actionNote: 'Rich nocturnal hydration with peptides and ceramides to lock in active treatments.',
    });
  }

  // =========================================================================
  // 2. MAKEUP FORMULATION (OWNED CLOSET + UNDERTONE + VIBE)
  // =========================================================================
  const vibeConfig = VIBE_MAKEUP_PROFILES[vibe] || VIBE_MAKEUP_PROFILES.classy;
  const currentSeason = (skinTone.season || skinTone.seasonPalette || 'Autumn') as 'Spring' | 'Summer' | 'Autumn' | 'Winter';

  // Dynamic Vibe & Seasonal Palette Matrix
  const SHADE_MATRIX: Record<
    'natural' | 'classy' | 'bold' | 'elegant',
    Record<'Spring' | 'Summer' | 'Autumn' | 'Winter', {
      lip: { name: string; hex: string };
      blush: { name: string; hex: string };
      eyeshadow: { name: string; hex: string };
    }>
  > = {
    natural: {
      Spring: {
        lip: { name: 'Rhode Peptide Lip Tint (Peach Nectar)', hex: '#E89078' },
        blush: { name: 'Rare Beauty Soft Pinch (Joy - Dewy Peach)', hex: '#F28D77' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Sheer Champagne)', hex: '#E6CFB8' },
      },
      Summer: {
        lip: { name: 'Summer Fridays Lip Butter (Pink Sugar)', hex: '#D88A96' },
        blush: { name: 'Dior Backstage Rosy Glow (001 Cool Pink)', hex: '#E89EB0' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Luminous Pearlescent)', hex: '#E2D3D8' },
      },
      Autumn: {
        lip: { name: 'Fenty Gloss Bomb (Fenty Glow - Rose Nude)', hex: '#C97A63' },
        blush: { name: 'Merit Flush Balm (Beverly Hills - Warm Terracotta)', hex: '#D98A72' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Warm Champagne Wash)', hex: '#DEC09E' },
      },
      Winter: {
        lip: { name: 'Clinique Almost Lipstick (Black Honey Sheer Berry)', hex: '#8E3B46' },
        blush: { name: 'Rare Beauty Soft Pinch (Faith - Soft Berry Flush)', hex: '#A84B66' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Cool Alabaster Shimmer)', hex: '#DED8E2' },
      },
    },
    classy: {
      Spring: {
        lip: { name: 'Charlotte Tilbury K.I.S.S.I.N.G (Coral Kiss)', hex: '#D96B50' },
        blush: { name: 'NARS Powder Blush (Orgasm - Peachy Coral Gold)', hex: '#E67F6B' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Soft Warm Ochre)', hex: '#C49A68' },
      },
      Summer: {
        lip: { name: 'Charlotte Tilbury Matte Revolution (Pillow Talk)', hex: '#B67375' },
        blush: { name: 'Hourglass Ambient Lighting (Mood Exposure Soft Plum)', hex: '#B87B84' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Cool Muted Taupe)', hex: '#A68D96' },
      },
      Autumn: {
        lip: { name: 'Charlotte Tilbury Matte Revolution (Walk of No Shame)', hex: '#B85D43' },
        blush: { name: 'Patrick Ta Double-Take (She\'s Sincere Terracotta)', hex: '#C9735D' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Neutral Taupe & Ochre)', hex: '#BA9576' },
      },
      Winter: {
        lip: { name: 'MAC Matte Lipstick (Chili Deep Rust)', hex: '#942F38' },
        blush: { name: 'NARS Powder Blush (Sin - Cool Plum Berry)', hex: '#9E435E' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Slate Espresso & Taupe)', hex: '#85737A' },
      },
    },
    bold: {
      Spring: {
        lip: { name: 'MAC Powder Kiss (Devoted to Chili - Vivid Rust)', hex: '#BF3B2B' },
        blush: { name: 'Rare Beauty Soft Pinch (Love - Terracotta Sienna)', hex: '#C45943' },
        eyeshadow: { name: 'Tom Ford Quad (Smoldering Bronze Chrome)', hex: '#633B1E' },
      },
      Summer: {
        lip: { name: 'YSL Rouge Pur Couture (Fuchsia Velvet Statement)', hex: '#A82255' },
        blush: { name: 'Fenty Cheeks Out (Drama Cla$$ Vivid Berry)', hex: '#944273' },
        eyeshadow: { name: 'Tom Ford Quad (Midnight Plum & Cool Bronze)', hex: '#542E47' },
      },
      Autumn: {
        lip: { name: 'Tom Ford Lip Color (Bruised Plum / Scarlet)', hex: '#851C24' },
        blush: { name: 'Tower 28 BeachPlease (Golden Hour Sunlit Amber)', hex: '#D4623B' },
        eyeshadow: { name: 'Tom Ford Quad (Smoldering Espresso & Antique Bronze)', hex: '#4A2E1B' },
      },
      Winter: {
        lip: { name: 'MAC Retro Matte (Ruby Woo - Iconic Deep Crimson)', hex: '#960018' },
        blush: { name: 'Dior Rouge Blush (999 Iconic Red Statement)', hex: '#991B2B' },
        eyeshadow: { name: 'Tom Ford Quad (Deep Onyx & Smoldering Silver)', hex: '#2A252B' },
      },
    },
    elegant: {
      Spring: {
        lip: { name: 'Chanel Rouge Allure (Pirate Warm Vermilion)', hex: '#C2412D' },
        blush: { name: 'Westman Atelier Baby Cheeks (Chouchette Nude Peach)', hex: '#E89680' },
        eyeshadow: { name: 'Natasha Denona Glam (Luminous Antique Gold)', hex: '#B8935C' },
      },
      Summer: {
        lip: { name: 'Gucci Rouge à Lèvres (Peggy Taupe Muted Rose)', hex: '#A86372' },
        blush: { name: 'Westman Atelier Baby Cheeks (Petal Dusty Rose)', hex: '#C97D8C' },
        eyeshadow: { name: 'Natasha Denona Glam (Cool Shimmer Mauve)', hex: '#9E7E8B' },
      },
      Autumn: {
        lip: { name: 'Victoria Beckham Posh Lipstick (Fringe Chestnut)', hex: '#8B4B3E' },
        blush: { name: 'Chanel Joues Contraste (Brun Roussi Spiced Amber)', hex: '#BA6852' },
        eyeshadow: { name: 'Natasha Denona Glam (Antique Gold & Soft Cocoa)', hex: '#9C7752' },
      },
      Winter: {
        lip: { name: 'YSL The Slim (Rouge Extravagant Velvet Wine)', hex: '#7A1B28' },
        blush: { name: 'Hourglass Ambient (Ethereal Alabaster Rose)', hex: '#8A3A4D' },
        eyeshadow: { name: 'Natasha Denona Glam (Champagne Quartz & Cocoa)', hex: '#705763' },
      },
    },
  };

  const selectedPalette = SHADE_MATRIX[vibe]?.[currentSeason] || SHADE_MATRIX.classy.Autumn;
  const makeupSteps: MakeupStep[] = [];

  // Foundation (Formulated to user's exact detected skin tone)
  const foundationHex = skinTone.skinToneHex || skinTone.hexCode || '#DFAC82';
  makeupSteps.push({
    category: 'foundation',
    colorHex: foundationHex,
    intensity: vibeConfig.foundationIntensity,
    finish: hasHighOiliness ? 'matte' : vibeConfig.preferredFinish,
    productName: `Harmonized ${skinTone.undertone} Undertone Base (${vibe.toUpperCase()})`,
  });

  // Blush
  makeupSteps.push({
    category: 'blush',
    colorHex: selectedPalette.blush.hex,
    intensity: hasHighRedness ? Math.max(25, vibeConfig.blushIntensity - 20) : vibeConfig.blushIntensity,
    finish: vibe === 'bold' ? 'satin' : 'dewy',
    productName: selectedPalette.blush.name,
  });

  // Lip
  makeupSteps.push({
    category: 'lip',
    colorHex: selectedPalette.lip.hex,
    intensity: vibeConfig.lipIntensity,
    finish: vibe === 'bold' ? 'matte' : vibe === 'natural' ? 'glossy' : vibeConfig.preferredFinish,
    productName: selectedPalette.lip.name,
  });

  // Eyeshadow
  makeupSteps.push({
    category: 'eyeshadow',
    colorHex: selectedPalette.eyeshadow.hex,
    intensity: vibeConfig.eyeIntensity,
    productName: selectedPalette.eyeshadow.name,
  });

  // Eyebrow
  makeupSteps.push({
    category: 'eyebrow',
    colorHex: skinTone.eyebrowColorHex || '#422B1E',
    intensity: vibeConfig.browIntensity,
    productName: 'Brow Wiz Precision Definer',
  });

  // =========================================================================
  // 3. OUTFIT SELECTION & WEATHER SYNERGY
  // =========================================================================
  const outfitItems = ownedCloset.filter((i) => i.category.startsWith('outfit_'));
  const weatherCategory = weather.conditionCategory;

  // Filter tops, bottoms, dresses matching vibe & weather
  const matchingDresses = outfitItems.filter((i) => {
    if (i.category !== 'outfit_dress') return false;
    const meta = i.metadata as OutfitMetadata;
    const matchesVibe = meta.formality_tag === vibe;
    const matchesWeather = meta.weather_tags.includes(weatherCategory) || meta.weather_tags.includes('warm');
    return matchesVibe && matchesWeather;
  });

  const matchingTops = outfitItems.filter((i) => {
    if (i.category !== 'outfit_top') return false;
    const meta = i.metadata as OutfitMetadata;
    return meta.formality_tag === vibe || (vibe === 'natural' && meta.formality_tag === 'casual');
  });

  const matchingBottoms = outfitItems.filter((i) => {
    if (i.category !== 'outfit_bottom') return false;
    const meta = i.metadata as OutfitMetadata;
    return meta.weather_tags.includes(weatherCategory) || meta.weather_tags.includes('warm') || meta.formality_tag === vibe;
  });

  let topOrDress: ClosetItem | undefined;
  let bottom: ClosetItem | undefined;
  let outerwear: ClosetItem | undefined;
  let stylingRationale = '';

  if (matchingDresses.length > 0 && (vibe === 'elegant' || vibe === 'bold')) {
    topOrDress = matchingDresses[0];
    stylingRationale = `Selected the ${topOrDress.name} to capture a striking ${vibe} silhouette suitable for ${weather.tempC}°C ${weather.condition}.`;
  } else if (matchingTops.length > 0) {
    topOrDress = matchingTops[0];
    bottom = matchingBottoms[0] || outfitItems.find((i) => i.category === 'outfit_bottom');
    stylingRationale = `Paired the ${topOrDress.name} with ${bottom?.name || 'tailored trousers'} for a balanced ${vibe} aesthetic optimized for today's ${weatherCategory} weather.`;
  } else {
    // Fallback: pick best available
    topOrDress = outfitItems.find((i) => i.category === 'outfit_top' || i.category === 'outfit_dress');
    bottom = outfitItems.find((i) => i.category === 'outfit_bottom');
    stylingRationale = `Selected versatile closet essentials (${topOrDress?.name}) tailored for ${weather.tempC}°C.`;
  }

  // Outerwear logic for cold or rain
  if (weatherCategory === 'rain' || weatherCategory === 'cold' || weatherCategory === 'cool' || weather.tempC <= 18) {
    const matchingOuter = outfitItems.find((i) => {
      if (i.category !== 'outfit_outer') return false;
      const meta = i.metadata as OutfitMetadata;
      if (weatherCategory === 'rain' && meta.weather_tags.includes('rain')) return true;
      return meta.weather_tags.includes(weatherCategory) || meta.formality_tag === vibe;
    });

    if (matchingOuter) {
      outerwear = matchingOuter;
      stylingRationale += ` Layered with ${outerwear.name} for thermal comfort and weather protection.`;
    } else if (weatherCategory === 'rain') {
      gapFills.push({
        category: 'Outerwear',
        suggestedProduct: 'Water-Repellent Minimalist Trench',
        reason: `Precipitation (${weather.precipitationMm}mm) is expected today. A tailored water-resistant trench ensures style without weather damage.`,
        urgency: 'medium',
      });
    }
  }

  // =========================================================================
  // 4. GAP-FILL SUGGESTIONS (COLOR / VIBE GAPS)
  // =========================================================================
  const makeupItems = ownedCloset.filter((i) => i.category === 'makeup');
  if (vibe === 'bold') {
    const hasBoldLip = makeupItems.some((i) => {
      const meta = i.metadata as MakeupMetadata;
      return meta.product_category === 'lip' && (meta.shade_hex === '#B31B1B' || meta.shade_hex === '#9C3328');
    });
    if (!hasBoldLip) {
      gapFills.push({
        category: 'Makeup (Lipstick)',
        suggestedProduct: 'Statement Crimson Velvet Matte Lipstick',
        reason: `Your chosen vibe is "${vibe.toUpperCase()}" with ${skinTone.undertone} undertones. A high-pigment crimson lip elevates the contrast of your facial harmony.`,
        urgency: 'recommended',
      });
    }
  }

  // =========================================================================
  // 5. HUMAN-READABLE EXPLANATION
  // =========================================================================
  const explanation = [
    `✨ **Mirror Check Analysis for Today (${weather.city || 'Your Location'})**:`,
    `- **Skin & Undertone**: Overall skin vitality is rated **${skin.overallScore}/100** with **${skinTone.undertone.toUpperCase()}** undertones (${skinTone.seasonPalette} season). ${hasHighRedness ? '⚠️ Mild skin redness/sensitivity was detected on your barrier.' : 'Skin barrier is in prime balance.'}`,
    `- **Weather Synergy**: Currently **${weather.tempC}°C / ${weather.tempF}°F** with **${weather.condition}** and a **UV Index of ${weather.uvIndex}** (${weather.uvIndex >= 6 ? 'High UV alert' : 'Moderate UV'}).`,
    `- **Skincare Strategy**: ${hasHighRedness ? 'Swapped active Retinol out of tonight\'s routine in favor of soothing Centella & Ceramide barrier recovery.' : 'Standard daytime hydration and protection routine applied.'}`,
    `- **Look & Styling**: Curated a **${vibe.toUpperCase()}** profile with ${vibeConfig.styleDesc}. ${stylingRationale}`,
  ].join('\n');

  return {
    vibe,
    skincareNotes: {
      warnings,
      amSteps,
      pmSteps,
    },
    makeupSteps,
    outfit: {
      topOrDress,
      bottom,
      outerwear,
      stylingRationale,
    },
    gapFillSuggestions: gapFills,
    explanation,
  };
}
