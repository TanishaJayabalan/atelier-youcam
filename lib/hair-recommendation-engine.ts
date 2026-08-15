import { HairProfile, UserBeautyProfile } from '@/types/beauty-profile';
import { WeatherData } from './weather';

export interface HairProductItem {
  id: string;
  name: string;
  brand: string;
  category: 'cleanser' | 'conditioner' | 'serum' | 'styling' | 'treatment';
  price: number;
  reason: string;
  rating: number;
  image_url: string;
}

export interface HairCareRoutine {
  hairSummary: string;
  curlClassificationNote: string;
  frizzDefenseStrategy: string;
  washRoutine: {
    step1: string;
    step2: string;
    step3: string;
  };
  stylingTechnique: string;
  recommendedProducts: HairProductItem[];
  haircutRecommendations: string[];
}

export function generateHairCareRoutine(
  hair: HairProfile,
  beautyProfile?: UserBeautyProfile,
  weather?: WeatherData
): HairCareRoutine {
  const { curlCategory, curlType, curlTerm, frizziness, frizzTerm, length } = hair;
  const humidity = weather?.humidity || 50;

  let frizzStrategy = 'Lightweight moisture sealing with botanical squalane.';
  if (frizziness >= 2 || humidity > 65) {
    frizzStrategy = `High frizz index (${frizzTerm}) combined with ${humidity}% humidity. Anti-humidity polymer sealants and silicone-free bonding oils required to block atmospheric moisture swelling.`;
  }

  let curlNote = `Your hair exhibits a ${curlTerm} (${curlType}) structural wave pattern.`;
  if (curlCategory === 'straight') {
    curlNote = `Straight hair pattern (Type 1). Focus on root lift, scalp sebum regulation, and weightless thermal protection.`;
  } else if (curlCategory === 'wavy') {
    curlNote = `Wavy curl architecture (Type ${curlType}). Requires curl-clumping moisture that won't weigh down the natural S-wave bend.`;
  } else if (curlCategory === 'curly' || curlCategory === 'coily') {
    curlNote = `High-porosity curl/coil pattern (Type ${curlType}). Demands deep lipid retention, leave-in hydration, and gentle scrunch diffusing.`;
  }

  // Generate customized product recommendations
  const products: HairProductItem[] = [
    {
      id: 'hair_prod_1',
      name: 'Anti-Frizz Discipline Bonding Serum',
      brand: 'Kérastase Nutritive',
      category: 'serum',
      price: 44,
      reason: `Instantly tames ${frizzTerm} flyaways and seals cuticle against ${humidity}% relative humidity.`,
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1608248597359-38374a2b91df?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hair_prod_2',
      name: 'Hydro-Wave Defining Curl Mousse',
      brand: 'Oribe Moisture & Control',
      category: 'styling',
      price: 39,
      reason: `Enhances natural ${curlType} bounce without stiffness or alcohol flaking.`,
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'hair_prod_3',
      name: 'Ceramide Peptide Restorative Hair Mask',
      brand: 'Briogeo Don’t Despair',
      category: 'treatment',
      price: 42,
      reason: `Replenishes internal lipid matrix to reinforce ${length} strands against mechanical styling damage.`,
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
    },
  ];

  return {
    hairSummary: `${curlTerm} · ${frizzTerm} · ${length.toUpperCase()}`,
    curlClassificationNote: curlNote,
    frizzDefenseStrategy: frizzStrategy,
    washRoutine: {
      step1: 'Sulfate-Free Balancing Cleanser: Massage scalp gently with lukewarm water to cleanse sebum without stripping natural cuticle oils.',
      step2: 'Moisture Lock Conditioner: Apply from mid-lengths to ends, using wide-tooth comb in shower to detangle without breaking wave clumps.',
      step3: 'Microfiber Plop & Air-Dry: Never towel-rub; gently cup with microfiber towel, applying leave-in bonding serum on soaking wet hair.',
    },
    stylingTechnique:
      curlCategory === 'straight'
        ? 'Blow-dry with a round ceramic brush at medium heat, finishing with a blast of cool air to lock in mirror shine.'
        : 'Apply curl mousse to soaking wet hair using praying hands method, scrunch upward, and diffuse on low heat until 85% dry.',
    recommendedProducts: products,
    haircutRecommendations: [
      'Face-framing butterfly layers to accentuate cheekbone height',
      'Dry-cut texturizing at the perimeter to remove heavy bulk without causing frizz',
      'Curtain bangs tailored to blend softly into temple layers',
    ],
  };
}
