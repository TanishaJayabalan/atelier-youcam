import { HairProfile, UserBeautyProfile } from '@/types/beauty-profile';
import { WeatherResult } from './weather';

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
  weather?: WeatherResult
): HairCareRoutine {
  const { curlCategory, curlType, curlTerm, frizziness, frizzTerm, length, lengthTerm, naturalColorName } = hair;
  const humidity = weather?.humidity ?? 50;
  const uvIndex = weather?.uvIndex ?? 4;
  const skinType = beautyProfile?.skin?.skinType || 'normal';

  // 1. Frizz Defense Strategy
  let frizzDefenseStrategy = 'Lightweight cuticle sealing with squalane and silk amino acids.';
  if (frizziness >= 3 || humidity > 70) {
    frizzDefenseStrategy = `Extreme humidity alert (${humidity}% relative humidity). Anti-humidity polymer shields, silicone-free bonding oils, and moisture-blocking sealants are required to prevent strand swelling.`;
  } else if (frizziness >= 2 || humidity > 55) {
    frizzDefenseStrategy = `Active frizz detected (${frizzTerm}) combined with ${humidity}% humidity. Peptide leave-in bonding serums required to smooth the cuticle layer.`;
  } else if (frizziness === 1) {
    frizzDefenseStrategy = `Moderate frizz potential at ${humidity}% humidity. Light moisture lock and microfiber air-drying recommended.`;
  } else {
    frizzDefenseStrategy = `Cuticle is sleek and aligned. Maintain balance with weightless thermal protection and antioxidant serum.`;
  }

  // 2. Curl Classification & Architecture Note
  let curlClassificationNote = `Your hair exhibits a ${curlTerm} (${curlType}) structural wave pattern with ${naturalColorName} natural tone.`;
  if (curlCategory === 'straight') {
    curlClassificationNote = `Straight hair architecture (Type ${curlType}, ${naturalColorName}). Focus on root volume, light clarifying cleanse for ${skinType} scalp, and weightless thermal glass-shine protection.`;
  } else if (curlCategory === 'wavy') {
    curlClassificationNote = `Wavy curl architecture (Type ${curlType}, ${naturalColorName}). Demands wave-clumping hydration that preserves natural bounce without heavy silicone weight.`;
  } else if (curlCategory === 'curly') {
    curlClassificationNote = `Spiral curl architecture (Type ${curlType}, ${naturalColorName}). Requires rich humectants, leave-in moisture retention, and gentle diffuser drying.`;
  } else if (curlCategory === 'coily') {
    curlClassificationNote = `Coily & textured curl pattern (Type ${curlType}, ${naturalColorName}). High-density lipid nourishment, LOC (Liquid-Oil-Cream) sealing, and protective hydration required.`;
  }

  // 3. Wash Routine Steps Tailored to Pattern & Scalp
  let step1 = 'Sulfate-Free Balancing Cleanser: Massage scalp gently with lukewarm water to clear sebum without stripping natural cuticle oils.';
  let step2 = 'Moisture Lock Conditioner: Apply from mid-lengths to ends, detangling with a wide-tooth comb in shower.';
  let step3 = 'Microfiber Plop & Air-Dry: Never towel-rub; gently cup with microfiber towel, applying leave-in bonding serum on wet hair.';

  if (curlCategory === 'straight') {
    step1 = skinType === 'oily'
      ? 'Clarifying Rosemary & Salicylic Cleanser: Focus thoroughly on scalp to dissolve sebum and preserve 48-hour root lift.'
      : 'Weightless Hydrating Shampoo: Lather gently at roots, rinsing completely with cool water for mirror-shine.';
    step2 = 'Featherlight Volumizing Rinse: Apply strictly from mid-lengths to ends to avoid weighing down root volume.';
    step3 = 'Thermal Glass Shield: Spray heat-protectant mist on towel-damp hair before styling with a ceramic round brush.';
  } else if (curlCategory === 'wavy') {
    step1 = 'Low-Poo Amino Cleanser: Gently cleanses scalp while infusing hydrolyzed rice proteins into wave clumps.';
    step2 = 'Hydra-Wave Conditioner: Squish-to-condish upwards to encourage S-wave definition and hydration.';
    step3 = 'Wave Memory Mousse & Plop: Apply foam to soaking wet hair, plop in a microfiber wrap for 15 minutes.';
  } else if (curlCategory === 'curly' || curlCategory === 'coily') {
    step1 = 'Co-Wash Cleansing Conditioner: Gently dissolves buildup with botanical oils without depleting natural lipids.';
    step2 = 'Deep Moisture Melting Mask: Detangle in sections with slip-rich slippery elm & shea butter conditioner.';
    step3 = 'LOC Method (Liquid-Oil-Cream): Seal moisture into soaking wet curls, then diffuse on low heat.';
  }

  // 4. Products Tailored to Specific Profile
  const recommendedProducts: HairProductItem[] = [];

  if (curlCategory === 'straight') {
    recommendedProducts.push({
      id: 'hair_straight_1',
      name: 'Dream Coat Supernatural Glass Spray',
      brand: 'Color Wow',
      category: 'styling',
      price: 28,
      reason: `Waterproofs straight ${lengthTerm.toLowerCase()} against ${humidity}% humidity for glass-reflective shine.`,
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1608248597359-38374a2b91df?auto=format&fit=crop&w=400&q=80',
    });
    recommendedProducts.push({
      id: 'hair_straight_2',
      name: 'Scalp Detox Clarifying Treatment',
      brand: 'Ouai',
      category: 'treatment',
      price: 38,
      reason: `Removes micro-pollutants and sebum buildup to keep straight roots voluminous.`,
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    });
  } else if (curlCategory === 'wavy') {
    recommendedProducts.push({
      id: 'hair_wavy_1',
      name: 'Anti-Frizz Discipline Bonding Serum',
      brand: 'Kérastase Nutritive',
      category: 'serum',
      price: 44,
      reason: `Instantly tames ${frizzTerm} flyaways and seals cuticle against ${humidity}% relative humidity.`,
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1608248597359-38374a2b91df?auto=format&fit=crop&w=400&q=80',
    });
    recommendedProducts.push({
      id: 'hair_wavy_2',
      name: 'Hydro-Wave Defining Curl Mousse',
      brand: 'Oribe Moisture & Control',
      category: 'styling',
      price: 39,
      reason: `Enhances natural ${curlType} bounce without stiffness or alcohol flaking.`,
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    });
  } else {
    recommendedProducts.push({
      id: 'hair_curl_1',
      name: 'Curl Charisma Rice Amino Leave-In Cream',
      brand: 'Briogeo',
      category: 'styling',
      price: 34,
      reason: `Locks in deep hydration and seals curl clumps against ${humidity}% atmospheric moisture.`,
      rating: 4.9,
      image_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    });
    recommendedProducts.push({
      id: 'hair_curl_2',
      name: 'Curl Shaper Memory Locking Gel',
      brand: 'Ouidad',
      category: 'styling',
      price: 32,
      reason: `Forms a flexible protective cast to prevent ${frizzTerm} swelling without crunchiness.`,
      rating: 4.8,
      image_url: 'https://images.unsplash.com/photo-1608248597359-38374a2b91df?auto=format&fit=crop&w=400&q=80',
    });
  }

  // Universal Nourishing Treatment tailored to UV & length
  recommendedProducts.push({
    id: 'hair_mask_universal',
    name: 'Ceramide Peptide Restorative Hair Mask',
    brand: 'Briogeo Don’t Despair',
    category: 'treatment',
    price: 42,
    reason: `Reinforces internal lipid matrix against UV index of ${uvIndex} and mechanical damage on ${lengthTerm.toLowerCase()}.`,
    rating: 4.9,
    image_url: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=400&q=80',
  });

  // 5. Haircut Recommendations
  const haircutRecommendations: string[] = [];
  if (curlCategory === 'straight') {
    haircutRecommendations.push('Clean precision blunt perimeter cut to maximize perceived strand density');
    haircutRecommendations.push('Soft face-framing chin layers to add movement around jawline');
    haircutRecommendations.push('Whisper-light curtain bangs for dimensional front framing');
  } else if (curlCategory === 'wavy') {
    haircutRecommendations.push('Butterfly layers cut dry to release weight and activate wave bounce');
    haircutRecommendations.push('Curtain bangs cut with interior texture to blend into temple waves');
    haircutRecommendations.push('Long perimeter layers to prevent heavy triangular silhouette');
  } else {
    haircutRecommendations.push('Rezo or Deva dry-cut sculpting to balance round silhouette and volume');
    haircutRecommendations.push('Crown weight-removal layers to allow curls to spring upward');
    haircutRecommendations.push('Face-framing ringlet tendrils tailored to cheekbone architecture');
  }

  return {
    hairSummary: `${curlTerm} · ${frizzTerm} · ${lengthTerm}`,
    curlClassificationNote,
    frizzDefenseStrategy,
    washRoutine: {
      step1,
      step2,
      step3,
    },
    stylingTechnique:
      curlCategory === 'straight'
        ? 'Blow-dry with tension using a round ceramic brush at medium heat; seal with cool shot for mirror gloss.'
        : curlCategory === 'wavy'
        ? 'Apply wave mousse to wet hair, scrunch upward with microfiber towel, and air-dry or diffuse on low heat.'
        : 'Rake leave-in cream through damp sections, glaze with gel to form cast, and diffuse with bowl cup.',
    recommendedProducts,
    haircutRecommendations,
  };
}
