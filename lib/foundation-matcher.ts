import { ColorTonesResult, FitzpatrickType } from '@/types/beauty-profile';

export interface FoundationMatchResult {
  shadeName: string;
  shadeCode: string;
  matchedHex: string;
  undertone: 'Warm Golden' | 'Cool Rosy' | 'Neutral Balanced' | 'Olive Golden';
  fitzpatrickLabel: string;
  coverageLevel: 'Medium-Buildable' | 'Full Velvet' | 'Sheer Luminous';
  recommendedFinish: 'Satin Radiant' | 'Velvet Matte' | 'Dewy Silk';
  formulaNotes: string;
  youcamEffect: {
    color: string;
    colorIntensity: number;
    glowIntensity: number;
    coverageIntensity: number;
  };
}

interface ShadeDefinition {
  code: string;
  name: string;
  hex: string;
  fitzpatrick: FitzpatrickType[];
  undertone: 'warm' | 'cool' | 'neutral' | 'olive';
}

const FOUNDATION_SHADE_CATALOG: ShadeDefinition[] = [
  // Type I-II
  { code: 'F100', name: 'Porcelain Rosy', hex: '#FDF0EA', fitzpatrick: ['I'], undertone: 'cool' },
  { code: 'F110', name: 'Alabaster Warm', hex: '#F9EAD9', fitzpatrick: ['I'], undertone: 'warm' },
  { code: 'F120', name: 'Ivory Neutral', hex: '#F8E6DA', fitzpatrick: ['I', 'II'], undertone: 'neutral' },
  { code: 'F200', name: 'Light Beige Warm', hex: '#F4DFCD', fitzpatrick: ['II'], undertone: 'warm' },
  { code: 'F210', name: 'Petal Cool', hex: '#F3D6CA', fitzpatrick: ['II'], undertone: 'cool' },
  { code: 'F220', name: 'Vanilla Neutral', hex: '#EED9C4', fitzpatrick: ['II', 'III'], undertone: 'neutral' },

  // Type III
  { code: 'F300', name: 'Golden Sand', hex: '#E7C5A3', fitzpatrick: ['III'], undertone: 'warm' },
  { code: 'F310', name: 'Medium Olive Warm', hex: '#DEC098', fitzpatrick: ['III'], undertone: 'olive' },
  { code: 'F320', name: 'Natural Ochre', hex: '#DFB892', fitzpatrick: ['III', 'IV'], undertone: 'neutral' },
  { code: 'F330', name: 'Rosy Buff', hex: '#DBB196', fitzpatrick: ['III'], undertone: 'cool' },

  // Type IV
  { code: 'F400', name: 'Warm Honey', hex: '#CD9D6F', fitzpatrick: ['IV'], undertone: 'warm' },
  { code: 'F410', name: 'Caramel Bronze', hex: '#C28E5C', fitzpatrick: ['IV'], undertone: 'olive' },
  { code: 'F420', name: 'Amber Neutral', hex: '#BC8A5C', fitzpatrick: ['IV', 'V'], undertone: 'neutral' },
  { code: 'F430', name: 'Spiced Toffee', hex: '#BA7A50', fitzpatrick: ['IV'], undertone: 'cool' },

  // Type V
  { code: 'F500', name: 'Chestnut Golden', hex: '#A3683C', fitzpatrick: ['V'], undertone: 'warm' },
  { code: 'F510', name: 'Rich Mocha', hex: '#8F542A', fitzpatrick: ['V'], undertone: 'neutral' },
  { code: 'F520', name: 'Deep Espresso Warm', hex: '#7D4724', fitzpatrick: ['V', 'VI'], undertone: 'warm' },

  // Type VI
  { code: 'F600', name: 'Ebony Royal', hex: '#583318', fitzpatrick: ['VI'], undertone: 'neutral' },
  { code: 'F610', name: 'Dark Truffle', hex: '#442512', fitzpatrick: ['VI'], undertone: 'cool' },
  { code: 'F620', name: 'Deep Onyx Warm', hex: '#3C2011', fitzpatrick: ['VI'], undertone: 'warm' },
];

export function findFoundationMatch(
  colorTones: ColorTonesResult,
  fitzpatrickType: FitzpatrickType
): FoundationMatchResult {
  const { skinColor, undertone } = colorTones;

  // Filter catalog by Fitzpatrick type
  const typeMatches = FOUNDATION_SHADE_CATALOG.filter((s) => s.fitzpatrick.includes(fitzpatrickType));
  
  // Find exact undertone match or fallback to closest
  let best = typeMatches.find((s) => s.undertone === undertone) || typeMatches[0] || FOUNDATION_SHADE_CATALOG[6];

  let undertoneLabel: FoundationMatchResult['undertone'] = 'Warm Golden';
  if (undertone === 'cool') undertoneLabel = 'Cool Rosy';
  else if (undertone === 'neutral') undertoneLabel = 'Neutral Balanced';
  else if (undertone === 'olive') undertoneLabel = 'Olive Golden';

  return {
    shadeName: best.name,
    shadeCode: best.code,
    matchedHex: skinColor || best.hex,
    undertone: undertoneLabel,
    fitzpatrickLabel: `Type ${fitzpatrickType}`,
    coverageLevel: 'Medium-Buildable',
    recommendedFinish: undertone === 'warm' ? 'Satin Radiant' : 'Velvet Matte',
    formulaNotes: `Custom-calibrated to match ${skinColor} with ${undertoneLabel} micro-pigments. Blends seamlessly without flashback.`,
    youcamEffect: {
      color: skinColor || best.hex,
      colorIntensity: 55,
      glowIntensity: undertone === 'warm' ? 35 : 20,
      coverageIntensity: 50,
    },
  };
}
