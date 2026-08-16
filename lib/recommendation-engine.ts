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
  colorHarmonyRationale?: string;
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

// 64-Formula Comprehensive Makeup Shade Matrix [vibe][season][undertone]
type UndertoneKey = 'warm' | 'cool' | 'neutral' | 'olive';
type SeasonKey = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

interface PaletteItem {
  lip: { name: string; hex: string };
  blush: { name: string; hex: string };
  eyeshadow: { name: string; hex: string };
}

const PALETTE_MATRIX: Record<
  'classy' | 'elegant' | 'bold' | 'natural',
  Record<SeasonKey, Record<UndertoneKey, PaletteItem>>
> = {
  natural: {
    Spring: {
      warm: {
        lip: { name: 'Summer Fridays Lip Butter (Peach Silk)', hex: '#E89078' },
        blush: { name: 'Rare Beauty Soft Pinch (Joy - Dewy Peach)', hex: '#E89078' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Warm Champagne Wash)', hex: '#DEC09E' },
      },
      cool: {
        lip: { name: 'Summer Fridays Lip Butter (Pink Sugar)', hex: '#D88A96' },
        blush: { name: 'Dior Backstage Rosy Glow (001 Cool Pink)', hex: '#E89EB0' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Sheer Pearl)', hex: '#E6DAE0' },
      },
      neutral: {
        lip: { name: 'Fenty Gloss Bomb (Fu$$y Soft Pink)', hex: '#D98295' },
        blush: { name: 'Tower 28 BeachPlease (Magic Hour Muted Rosy Nude)', hex: '#DB8F85' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Soft Nude Sheen)', hex: '#DFCBBF' },
      },
      olive: {
        lip: { name: 'Merit Tinted Lip Oil (Au Naturel Warm Ochre)', hex: '#C48168' },
        blush: { name: 'Westman Atelier (Minette Sheer Apricot Gold)', hex: '#D6896E' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Golden Taupe Wash)', hex: '#C9B497' },
      },
    },
    Summer: {
      cool: {
        lip: { name: 'Summer Fridays Lip Butter (Vanilla Beige Pink)', hex: '#D88A96' },
        blush: { name: 'Dior Backstage Rosy Glow (001 Cool Pink)', hex: '#E89EB0' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Pearlescent Lilac)', hex: '#E2D3D8' },
      },
      warm: {
        lip: { name: 'Fenty Gloss Bomb (Fenty Glow - Rose Nude)', hex: '#C97A63' },
        blush: { name: 'Merit Flush Balm (Beverly Hills - Warm Terracotta)', hex: '#D98A72' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Soft Peach Wash)', hex: '#E8D2C2' },
      },
      neutral: {
        lip: { name: 'Rare Beauty Tinted Lip Oil (Hope - Nude Rose)', hex: '#CA7E87' },
        blush: { name: 'Patrick Ta Double-Take (She\'s Sincere Muted Mauve)', hex: '#C9858E' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Dusty Quartz)', hex: '#D6C7CC' },
      },
      olive: {
        lip: { name: 'Tower 28 Milky Lip Jelly (Pistachio Cool Nude)', hex: '#B87A6E' },
        blush: { name: 'Merit Flush Balm (Stockholm Baby Muted Mauve)', hex: '#B87B84' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Soft Sage Gold)', hex: '#C2B8A3' },
      },
    },
    Autumn: {
      warm: {
        lip: { name: 'Fenty Gloss Bomb (Fenty Glow - Spiced Terracotta)', hex: '#C97A63' },
        blush: { name: 'Merit Flush Balm (Beverly Hills - Warm Terracotta)', hex: '#D98A72' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Warm Champagne Wash)', hex: '#DEC09E' },
      },
      cool: {
        lip: { name: 'Clinique Almost Lipstick (Black Honey Sheer Berry)', hex: '#8E3B46' },
        blush: { name: 'Rare Beauty Soft Pinch (Faith - Soft Berry Flush)', hex: '#A84B66' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Cool Slate Sheer)', hex: '#CBC2CA' },
      },
      neutral: {
        lip: { name: 'Summer Fridays Lip Butter (Brown Sugar Caramel)', hex: '#AC6652' },
        blush: { name: 'Tower 28 BeachPlease (Golden Hour Sunlit Amber)', hex: '#D4623B' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Golden Ochre Wash)', hex: '#D1B492' },
      },
      olive: {
        lip: { name: 'Merit Tinted Lip Oil (Falcon Rich Cocoa)', hex: '#9E5B49' },
        blush: { name: 'Westman Atelier (Chouchette Spiced Apricot)', hex: '#C8785E' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Antique Bronze Wash)', hex: '#B89B77' },
      },
    },
    Winter: {
      cool: {
        lip: { name: 'Clinique Almost Lipstick (Black Honey Sheer Berry)', hex: '#8E3B46' },
        blush: { name: 'Rare Beauty Soft Pinch (Faith - Soft Berry Flush)', hex: '#A84B66' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Cool Alabaster Shimmer)', hex: '#DED8E2' },
      },
      warm: {
        lip: { name: 'MAC Lustreglass (Spiced Toffee Sheer)', hex: '#9E4E42' },
        blush: { name: 'Dior Rouge Blush (028 Actrice Warm Rose)', hex: '#B8555E' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Glazed Copper Sheer)', hex: '#CCA890' },
      },
      neutral: {
        lip: { name: 'Fenty Gloss Bomb (Hot Chocolit Sheer Cocoa)', hex: '#7D4744' },
        blush: { name: 'Patrick Ta (She\'s Vibrant Cool Crimson Flush)', hex: '#A13D54' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Platinum Sheer Quartz)', hex: '#D5D0D9' },
      },
      olive: {
        lip: { name: 'Merit Tinted Lip Oil (L\'Avenue Deep Berry Plum)', hex: '#7F3240' },
        blush: { name: 'Rare Beauty (Grace - Matte Muted Mauve)', hex: '#915364' },
        eyeshadow: { name: 'Ilia Liquid Powder (Glaze - Smoldering Olive Bronze)', hex: '#9E947A' },
      },
    },
  },
  classy: {
    Spring: {
      warm: {
        lip: { name: 'Charlotte Tilbury K.I.S.S.I.N.G (Coral Kiss)', hex: '#D96B50' },
        blush: { name: 'NARS Powder Blush (Orgasm - Peachy Coral Gold)', hex: '#E67F6B' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Soft Warm Ochre)', hex: '#C49A68' },
      },
      cool: {
        lip: { name: 'Charlotte Tilbury Matte Revolution (Gracefully Pink)', hex: '#C96275' },
        blush: { name: 'Hourglass Ambient Lighting (Luminous Flush Rose)', hex: '#D47685' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Muted Rose Taupe)', hex: '#BA929C' },
      },
      neutral: {
        lip: { name: 'YSL Rouge Pur Couture (Nude Lavallière)', hex: '#C4747B' },
        blush: { name: 'Patrick Ta (She\'s So LA Bronze Mauve)', hex: '#B9746A' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Balanced Warm Taupe)', hex: '#BA9576' },
      },
      olive: {
        lip: { name: 'MAC Matte (Velvet Teddy Warm Ochre Nude)', hex: '#B57463' },
        blush: { name: 'NARS Blush (Taj Mahal Muted Burnished Terracotta)', hex: '#C76A4D' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Warm Olive Taupe)', hex: '#A88D6F' },
      },
    },
    Summer: {
      cool: {
        lip: { name: 'Charlotte Tilbury Matte Revolution (Pillow Talk)', hex: '#B67375' },
        blush: { name: 'Hourglass Ambient Lighting (Mood Exposure Soft Plum)', hex: '#B87B84' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Cool Muted Taupe)', hex: '#A68D96' },
      },
      warm: {
        lip: { name: 'Charlotte Tilbury (Stoned Rose Warm Amber)', hex: '#BD6454' },
        blush: { name: 'Westman Atelier (Chouchette Nude Peach)', hex: '#D87A65' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Sandy Ochre Taupe)', hex: '#BFA082' },
      },
      neutral: {
        lip: { name: 'MAC Matte (Mehr - Dirty Blue Pink)', hex: '#A85A6A' },
        blush: { name: 'NARS Powder Blush (Dolce Vita Dusty Rose)', hex: '#A65561' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Cashmere Taupe)', hex: '#9E858E' },
      },
      olive: {
        lip: { name: 'Charlotte Tilbury (Very Victoria Muted Taupe)', hex: '#9C6E66' },
        blush: { name: 'Patrick Ta (She\'s Sincere Muted Terracotta)', hex: '#B56B5D' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Earthy Gray Taupe)', hex: '#8F7D74' },
      },
    },
    Autumn: {
      warm: {
        lip: { name: 'Charlotte Tilbury Matte Revolution (Walk of No Shame)', hex: '#B85D43' },
        blush: { name: 'Patrick Ta Double-Take (She\'s Sincere Terracotta)', hex: '#C9735D' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Neutral Taupe & Ochre)', hex: '#BA9576' },
      },
      cool: {
        lip: { name: 'MAC Matte Lipstick (Chili Deep Rust)', hex: '#942F38' },
        blush: { name: 'NARS Powder Blush (Sin - Cool Plum Berry)', hex: '#9E435E' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Slate Espresso & Taupe)', hex: '#85737A' },
      },
      neutral: {
        lip: { name: 'YSL Rouge Pur Couture (The Bold Spiced Rosewood)', hex: '#A84C42' },
        blush: { name: 'Hourglass Ambient (Diffused Heat Warm Poppy)', hex: '#BA5E52' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Rich Cocoa & Camel)', hex: '#9C785B' },
      },
      olive: {
        lip: { name: 'Tom Ford Lip Color (Dark Dahlia Warm Spice)', hex: '#8C3F35' },
        blush: { name: 'Patrick Ta (She\'s Baked Deep Sunkissed Copper)', hex: '#B05943' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Deep Khaki Ochre)', hex: '#80684E' },
      },
    },
    Winter: {
      cool: {
        lip: { name: 'MAC Matte Lipstick (Diva Deep Burgundy)', hex: '#7A1C28' },
        blush: { name: 'NARS Powder Blush (Sin - Cool Plum Berry)', hex: '#9E435E' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Slate Espresso & Taupe)', hex: '#85737A' },
      },
      warm: {
        lip: { name: 'Charlotte Tilbury (Red Carpet Red Warm Crimson)', hex: '#991B24' },
        blush: { name: 'Dior Rouge Blush (999 Iconic Red Flush)', hex: '#A12836' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Smoky Dark Espresso)', hex: '#59443B' },
      },
      neutral: {
        lip: { name: 'YSL The Slim (Velvet Wine Statement)', hex: '#6B1B27' },
        blush: { name: 'Hourglass Ambient (Mood Flush Soft Mulberry)', hex: '#8A3B4E' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Charcoal & Smoldering Taupe)', hex: '#635359' },
      },
      olive: {
        lip: { name: 'MAC Retro Matte (Carnivorous Deep Blood Plum)', hex: '#5E1B26' },
        blush: { name: 'Fenty Cheeks Out (Drama Cla$$ Rich Berry)', hex: '#7E2C48' },
        eyeshadow: { name: 'Makeup by Mario Master Mattes (Deep Forest Smoke & Onyx)', hex: '#474039' },
      },
    },
  },
  bold: {
    Spring: {
      warm: {
        lip: { name: 'MAC Powder Kiss (Devoted to Chili - Vivid Rust)', hex: '#BF3B2B' },
        blush: { name: 'Rare Beauty Soft Pinch (Love - Terracotta Sienna)', hex: '#C45943' },
        eyeshadow: { name: 'Tom Ford Quad (Smoldering Bronze Chrome)', hex: '#633B1E' },
      },
      cool: {
        lip: { name: 'YSL Rouge Pur Couture (Le Rouge 01 Vivid Poppy)', hex: '#C71C2E' },
        blush: { name: 'Dior Rouge Blush (080 Red Smile Bold)', hex: '#B8283E' },
        eyeshadow: { name: 'Tom Ford Quad (Smoky Quartz & Shimmer)', hex: '#634454' },
      },
      neutral: {
        lip: { name: 'NARS Powermatte (Dragon Girl Vivid Siren)', hex: '#BA1628' },
        blush: { name: 'Patrick Ta (She\'s Vibrant Fiery Coral Red)', hex: '#BD383B' },
        eyeshadow: { name: 'Tom Ford Quad (Gilded Copper Chrome)', hex: '#663B23' },
      },
      olive: {
        lip: { name: 'MAC Retro Matte (Marrakesh Rich Warm Amber)', hex: '#A33E2B' },
        blush: { name: 'Tower 28 BeachPlease (Golden Hour Rich Amber)', hex: '#B84E2E' },
        eyeshadow: { name: 'Tom Ford Quad (Smoldering Khaki Gold)', hex: '#54462B' },
      },
    },
    Summer: {
      cool: {
        lip: { name: 'YSL Rouge Pur Couture (Fuchsia Velvet Statement)', hex: '#A82255' },
        blush: { name: 'Fenty Cheeks Out (Drama Cla$$ Vivid Berry)', hex: '#944273' },
        eyeshadow: { name: 'Tom Ford Quad (Midnight Plum & Cool Bronze)', hex: '#542E47' },
      },
      warm: {
        lip: { name: 'Charlotte Tilbury (Tell Laura - Warm Electric Geranium)', hex: '#B8302A' },
        blush: { name: 'Rare Beauty (Joy - Deep Warm Tangerine Peach)', hex: '#B8553B' },
        eyeshadow: { name: 'Tom Ford Quad (Warm Bronze & Sunset Foil)', hex: '#6E3A20' },
      },
      neutral: {
        lip: { name: 'MAC Retro Matte (Ruby Woo - Iconic Deep Crimson)', hex: '#960018' },
        blush: { name: 'Dior Rouge Blush (999 Iconic Red Statement)', hex: '#991B2B' },
        eyeshadow: { name: 'Tom Ford Quad (Smoky Amethyst Chrome)', hex: '#4A2A3E' },
      },
      olive: {
        lip: { name: 'Tom Ford Lip Color (Bruised Plum / Scarlet)', hex: '#851C24' },
        blush: { name: 'Patrick Ta (She\'s Sincere Burnished Terracotta)', hex: '#9C4334' },
        eyeshadow: { name: 'Tom Ford Quad (Smoldering Bronze Olive Chrome)', hex: '#4A3B24' },
      },
    },
    Autumn: {
      warm: {
        lip: { name: 'Tom Ford Lip Color (Bruised Plum / Scarlet)', hex: '#851C24' },
        blush: { name: 'Tower 28 BeachPlease (Golden Hour Sunlit Amber)', hex: '#D4623B' },
        eyeshadow: { name: 'Tom Ford Quad (Smoldering Espresso & Antique Bronze)', hex: '#4A2E1B' },
      },
      cool: {
        lip: { name: 'MAC Matte Lipstick (Sin Deep Cool Oxblood)', hex: '#631422' },
        blush: { name: 'NARS Powder Blush (Sin - Cool Plum Berry)', hex: '#852A42' },
        eyeshadow: { name: 'Tom Ford Quad (Midnight Espresso & Slate)', hex: '#3B2A33' },
      },
      neutral: {
        lip: { name: 'Charlotte Tilbury (Night Crimson Rich Wine)', hex: '#731E2A' },
        blush: { name: 'Hourglass Ambient (At Night Deep Brick Rose)', hex: '#8F3841' },
        eyeshadow: { name: 'Tom Ford Quad (Deep Mahogany & Copper Foil)', hex: '#4D2B20' },
      },
      olive: {
        lip: { name: 'MAC Matte (Antique Velvet Deep Earthy Brown)', hex: '#592B23' },
        blush: { name: 'Patrick Ta (She\'s Baked Burnished Russet)', hex: '#8A3E2D' },
        eyeshadow: { name: 'Tom Ford Quad (Earthy Bronze Chrome & Olive)', hex: '#403423' },
      },
    },
    Winter: {
      cool: {
        lip: { name: 'MAC Retro Matte (Ruby Woo - Iconic Deep Crimson)', hex: '#960018' },
        blush: { name: 'Dior Rouge Blush (999 Iconic Red Statement)', hex: '#991B2B' },
        eyeshadow: { name: 'Tom Ford Quad (Deep Onyx & Smoldering Silver)', hex: '#2A252B' },
      },
      warm: {
        lip: { name: 'YSL Rouge Pur Couture (Blood Red Statement)', hex: '#8A151D' },
        blush: { name: 'NARS (Exhibit A - Vivid Burnished Red)', hex: '#9E2421' },
        eyeshadow: { name: 'Tom Ford Quad (Smoldering Obsidian Gold)', hex: '#3B291A' },
      },
      neutral: {
        lip: { name: 'YSL The Slim (Rouge Extravagant Velvet Wine)', hex: '#7A1B28' },
        blush: { name: 'Hourglass Ambient (Ethereal Alabaster Rose)', hex: '#8A3A4D' },
        eyeshadow: { name: 'Tom Ford Quad (Smoky Charcoal & Champagne Quartz)', hex: '#362F38' },
      },
      olive: {
        lip: { name: 'Tom Ford Lip Color (Black Dahlia Midnight Berry)', hex: '#521422' },
        blush: { name: 'Fenty Cheeks Out (Drama Cla$$ Deep Royal Berry)', hex: '#691F38' },
        eyeshadow: { name: 'Tom Ford Quad (Midnight Forest Smoke)', hex: '#2B2B24' },
      },
    },
  },
  elegant: {
    Spring: {
      warm: {
        lip: { name: 'Chanel Rouge Allure (Pirate Warm Vermilion)', hex: '#C2412D' },
        blush: { name: 'Westman Atelier Baby Cheeks (Chouchette Nude Peach)', hex: '#E89680' },
        eyeshadow: { name: 'Natasha Denona Glam (Luminous Antique Gold)', hex: '#B8935C' },
      },
      cool: {
        lip: { name: 'Chanel Rouge Coco (Mademoiselle Luminous Rose)', hex: '#B85E6E' },
        blush: { name: 'Westman Atelier (Petal Soft Rose Quartz)', hex: '#C97585' },
        eyeshadow: { name: 'Natasha Denona Glam (Soft Luminous Quartz)', hex: '#B89AA8' },
      },
      neutral: {
        lip: { name: 'Gucci Rouge à Lèvres (Peggy Taupe Muted Rose)', hex: '#A86372' },
        blush: { name: 'Westman Atelier (Dou Dou Warm Rose)', hex: '#C46D7D' },
        eyeshadow: { name: 'Natasha Denona Glam (Luminous Champagne Ochre)', hex: '#B5987E' },
      },
      olive: {
        lip: { name: 'Victoria Beckham Posh Lipstick (Pout Sheer Honey Bronze)', hex: '#A86E5C' },
        blush: { name: 'Chanel Joues Contraste (Brun Roussi Spiced Amber)', hex: '#BA6852' },
        eyeshadow: { name: 'Natasha Denona Glam (Warm Luminous Khaki Gold)', hex: '#A38B65' },
      },
    },
    Summer: {
      cool: {
        lip: { name: 'Gucci Rouge à Lèvres (Peggy Taupe Muted Rose)', hex: '#A86372' },
        blush: { name: 'Westman Atelier Baby Cheeks (Petal Dusty Rose)', hex: '#C97D8C' },
        eyeshadow: { name: 'Natasha Denona Glam (Cool Shimmer Mauve)', hex: '#9E7E8B' },
      },
      warm: {
        lip: { name: 'Chanel Rouge Coco (Adrienne Warm Nude Caramel)', hex: '#B06E59' },
        blush: { name: 'Westman Atelier (Chouchette Peachy Nude)', hex: '#C97864' },
        eyeshadow: { name: 'Natasha Denona Glam (Soft Golden Sand)', hex: '#A88D74' },
      },
      neutral: {
        lip: { name: 'Victoria Beckham Posh Lipstick (Twist Spiced Rose)', hex: '#9E5B67' },
        blush: { name: 'Hourglass Ambient (Mood Exposure Soft Mulberry)', hex: '#A36875' },
        eyeshadow: { name: 'Natasha Denona Glam (Dusty Cashmere Quartz)', hex: '#947B84' },
      },
      olive: {
        lip: { name: 'Gucci Rouge à Lèvres (Penny Beige Deep Taupe)', hex: '#8F5C53' },
        blush: { name: 'Westman Atelier (Minette Sheer Golden Apricot)', hex: '#A86252' },
        eyeshadow: { name: 'Natasha Denona Glam (Muted Sage Silk)', hex: '#877B6D' },
      },
    },
    Autumn: {
      warm: {
        lip: { name: 'Victoria Beckham Posh Lipstick (Fringe Chestnut)', hex: '#8B4B3E' },
        blush: { name: 'Chanel Joues Contraste (Brun Roussi Spiced Amber)', hex: '#BA6852' },
        eyeshadow: { name: 'Natasha Denona Glam (Antique Gold & Soft Cocoa)', hex: '#9C7752' },
      },
      cool: {
        lip: { name: 'Chanel Rouge Allure (Rouge Vie Deep Cool Rosewood)', hex: '#853B47' },
        blush: { name: 'Westman Atelier (Bichette Rich Berry Flush)', hex: '#914656' },
        eyeshadow: { name: 'Natasha Denona Glam (Cool Charcoal Quartz)', hex: '#7D6A75' },
      },
      neutral: {
        lip: { name: 'Gucci Rouge à Lèvres (Teresina Red Russet)', hex: '#944439' },
        blush: { name: 'Chanel Joues Contraste (Alezane Gilded Brown Rose)', hex: '#A6584C' },
        eyeshadow: { name: 'Natasha Denona Glam (Muted Hazelnut & Gold)', hex: '#8F6F54' },
      },
      olive: {
        lip: { name: 'Victoria Beckham Posh (Sway Deep Cocoa Bronze)', hex: '#783F34' },
        blush: { name: 'Westman Atelier (Chouchette Spiced Saffron)', hex: '#99503E' },
        eyeshadow: { name: 'Natasha Denona Glam (Smoky Olive Shimmer & Bronze)', hex: '#73624A' },
      },
    },
    Winter: {
      cool: {
        lip: { name: 'YSL The Slim (Rouge Extravagant Velvet Wine)', hex: '#7A1B28' },
        blush: { name: 'Hourglass Ambient (Ethereal Alabaster Rose)', hex: '#8A3A4D' },
        eyeshadow: { name: 'Natasha Denona Glam (Champagne Quartz & Cocoa)', hex: '#705763' },
      },
      warm: {
        lip: { name: 'Chanel Rouge Allure Velvet (Rouge Charnel Spiced Crimson)', hex: '#8C2229' },
        blush: { name: 'Dior Rouge Blush (678 Culte Gilded Rose)', hex: '#8F3443' },
        eyeshadow: { name: 'Natasha Denona Glam (Deep Bronze Quartz)', hex: '#6E4E3E' },
      },
      neutral: {
        lip: { name: 'Gucci Rouge à Lèvres (Goldie Red Pure Velvet)', hex: '#781A23' },
        blush: { name: 'Westman Atelier (Bichette Ethereal Crimson)', hex: '#7D2A3B' },
        eyeshadow: { name: 'Natasha Denona Glam (Platinum Smoked Quartz)', hex: '#5E4E58' },
      },
      olive: {
        lip: { name: 'Victoria Beckham Posh (Bitten Deep Black Cherry)', hex: '#611A27' },
        blush: { name: 'Chanel Joues Contraste (Rouge Profond Deep Berry)', hex: '#6E2536' },
        eyeshadow: { name: 'Natasha Denona Glam (Antique Dark Olive & Onyx)', hex: '#4D473B' },
      },
    },
  },
};

/**
 * Score closet outfit items based on Skin Tone, Fitzpatrick Type, Season Palette, Vibe, Weather, and UV.
 */
function scoreOutfitItem(
  item: ClosetItem,
  context: {
    vibe: string;
    undertone: UndertoneKey;
    season: SeasonKey;
    fitzpatrickType: string;
    weatherCategory: string;
    tempC: number;
    uvIndex: number;
  }
): number {
  const meta = (item.metadata || {}) as OutfitMetadata;
  let score = 0;

  // 1. Vibe Formality Match (+30)
  if (meta.formality_tag === context.vibe) {
    score += 30;
  } else if (context.vibe === 'natural' && meta.formality_tag === 'casual') {
    score += 25;
  } else if (context.vibe === 'classy' && meta.formality_tag === 'elegant') {
    score += 20;
  }

  // 2. Weather Condition & Temperature Suitability (+25)
  if (meta.weather_tags && Array.isArray(meta.weather_tags)) {
    if (meta.weather_tags.includes(context.weatherCategory)) {
      score += 25;
    } else if (meta.weather_tags.includes('warm') && (context.weatherCategory === 'hot' || context.weatherCategory === 'cool')) {
      score += 15;
    }
  }

  // Fabric Thermal & Breathability Bonus (+15)
  if (context.tempC >= 28 && meta.fabric && (meta.fabric.toLowerCase().includes('linen') || meta.fabric.toLowerCase().includes('poplin') || meta.fabric.toLowerCase().includes('cotton'))) {
    score += 15;
  } else if (context.tempC <= 16 && meta.fabric && (meta.fabric.toLowerCase().includes('wool') || meta.fabric.toLowerCase().includes('cashmere') || meta.fabric.toLowerCase().includes('velvet') || meta.fabric.toLowerCase().includes('leather'))) {
    score += 15;
  }

  // 3. Skin Undertone Compatibility (+25)
  if (meta.skin_tone_tags && Array.isArray(meta.skin_tone_tags)) {
    if (meta.skin_tone_tags.includes(context.undertone)) {
      score += 25;
    } else if (meta.skin_tone_tags.includes('neutral')) {
      score += 15;
    }
  }

  // 4. Fitzpatrick Range Harmony (+20)
  if (meta.fitzpatrick_range && Array.isArray(meta.fitzpatrick_range)) {
    if (meta.fitzpatrick_range.includes(context.fitzpatrickType)) {
      score += 20;
    }
  }

  // 5. Seasonal Color Palette Harmony (+20)
  if (meta.season_tags && Array.isArray(meta.season_tags)) {
    if (meta.season_tags.includes(context.season)) {
      score += 20;
    }
  }

  // 6. UV Defense Bonus (+15)
  if (context.uvIndex >= 6 && meta.uv_protection_factor && meta.uv_protection_factor >= 30) {
    score += 15;
  }

  return score;
}

/**
 * Generates personalized Skincare, Makeup, and Outfit recommendations.
 * Pure function with zero side effects.
 */
export function generateRecommendation(input: {
  skin: SkinAnalysisResult;
  skinTone?: SkinToneResult | any;
  weather: WeatherResult;
  vibe: 'classy' | 'elegant' | 'bold' | 'natural';
  closet: ClosetItem[];
}): Recommendation {
  const { skin, skinTone, weather, vibe, closet } = input;
  const tone: any = skinTone || {
    skinToneHex: '#DFAC82',
    hexCode: '#DFAC82',
    undertone: 'warm',
    seasonPalette: 'Autumn',
    season: 'Autumn',
    eyebrowColorHex: '#422B1E',
  };
  const ownedCloset = closet.filter((item) => item.is_owned);

  const warnings: string[] = [];
  const gapFills: GapFillSuggestion[] = [];

  const rawUndertone = String(tone.undertone || 'warm').toLowerCase();
  const undertoneKey: UndertoneKey =
    rawUndertone.includes('cool') ? 'cool' :
    rawUndertone.includes('olive') ? 'olive' :
    rawUndertone.includes('neutral') ? 'neutral' : 'warm';

  const rawSeason = String(tone.season || tone.seasonPalette || 'Autumn');
  const seasonKey: SeasonKey =
    rawSeason.includes('Spring') ? 'Spring' :
    rawSeason.includes('Summer') ? 'Summer' :
    rawSeason.includes('Winter') ? 'Winter' : 'Autumn';

  const fitzpatrickType = tone.fitzpatrick?.type || 'III';

  // =========================================================================
  // 1. ADVANCED CLINICAL SKINCARE MULTI-CONCERN ROUTING
  // =========================================================================
  const skincareItems = ownedCloset.filter((i) => i.category === 'skincare');
  
  const acneScore = skin.concerns?.acne?.score || 0;
  const hasAcne = acneScore >= 28 || skin.concerns?.acne?.severity === 'high' || skin.concerns?.acne?.severity === 'moderate';

  const rednessScore = skin.concerns?.redness?.score || 0;
  const hasHighRedness = rednessScore >= 32 || (Boolean(skin.concerns?.redness?.severity) && skin.concerns?.redness?.severity !== 'low') || skin.skinType === 'sensitive';

  const oilinessScore = skin.concerns?.oiliness?.score || 0;
  const hasHighOiliness = oilinessScore >= 40 || skin.skinType === 'oily';

  const moistureScore = skin.concerns?.moisture?.score || 100;
  const hasHighDryness = moistureScore < 50 || skin.skinType === 'dry' || (skin.concerns?.dryness?.score || 0) >= 40;

  const darkCirclesScore = skin.concerns?.dark_circles?.score || skin.concerns?.dark_circle?.score || 0;
  const hasDarkCircles = darkCirclesScore >= 35 || skin.concerns?.dark_circles?.severity === 'high' || skin.concerns?.dark_circle?.severity === 'high';

  const firmnessScore = skin.concerns?.firmness?.score || 0;
  const wrinkleScore = skin.concerns?.wrinkles?.score || skin.concerns?.wrinkle?.score || 0;
  const hasFirmnessOrWrinkles = firmnessScore >= 35 || wrinkleScore >= 35;

  const spotsScore = skin.concerns?.spots?.score || skin.concerns?.age_spots?.score || skin.concerns?.age_spot?.score || 0;
  const hasDarkSpotsOrTan = spotsScore >= 30 || weather.uvIndex >= 7;

  const poreScore = skin.concerns?.pores?.score || skin.concerns?.pore?.score || 0;
  const textureScore = skin.concerns?.texture?.score || 0;
  const hasPoresOrTexture = poreScore >= 40 || textureScore >= 45;

  const spf = skincareItems.find((i) => (i.metadata as SkincareMetadata)?.step_category === 'spf');

  // Clinical Warnings & Diagnostics Alerts
  if (hasAcne) {
    warnings.push(
      `Active Blemish Congestion Detected (${acneScore}%): Incorporating 2% BHA Salicylic Acid and 10% Niacinamide + Zinc to dissolve follicular plugs and calm micro-inflammation.`
    );
  }
  if (hasHighRedness) {
    warnings.push(
      `Elevated Barrier Redness & Erythema Detected (${rednessScore}%): Pausing PM harsh exfoliating acids/retinol. Buffering with soothing Centella Asiatica & Cicaplast B5+ Ceramides for rapid lipid repair.`
    );
  }
  if (hasFirmnessOrWrinkles) {
    warnings.push(
      `Skin Elasticity & Firmness Optimization Prescribed: Utilizing Multi-Peptide + Copper Tripeptide-1 complex to reinforce structural collagen architecture and smooth micro-expression lines.`
    );
  }
  if (hasDarkSpotsOrTan) {
    warnings.push(
      `Hyperpigmentation & Sun Mark Correction: Deploying Tranexamic Acid and Alpha Arbutin to inhibit tyrosinase activity and fade UV melanin accumulation.`
    );
  }
  if (weather.uvIndex >= 6) {
    warnings.push(
      `High UV Index (${weather.uvIndex}): Direct photothermal radiation is elevated. Broad-spectrum SPF 40+ reapplication every 2 hours is required to prevent photo-damage.`
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

  // Helper to find skincare item by active ingredient or target concern
  const findProduct = (predicate: (item: ClosetItem, meta: SkincareMetadata) => boolean): ClosetItem | undefined => {
    return skincareItems.find((i) => predicate(i, (i.metadata || {}) as SkincareMetadata));
  };

  // 1. Cleansers
  const cleanser =
    (hasHighOiliness
      ? findProduct((_, m) => m.step_category === 'cleanser' && m.texture === 'foam')
      : findProduct((_, m) => m.step_category === 'cleanser' && (m.texture === 'fluid' || m.texture === 'cream'))) ||
    findProduct((_, m) => m.step_category === 'cleanser');

  // 2. Specialized Treatment Serums
  const niacinamideItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('niacinamide')));
  const centellaItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('centella') || a.includes('madecassoside')));
  const cicaplastItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('panthenol')));
  const bhaItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('salicylic')));
  const tranexamicItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('tranexamic') || a.includes('arbutin')));
  const peptideItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('copper') || a.includes('peptide')));
  const azelaicItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('azelaic')));
  const polyglutamicItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('polyglutamic') || a.includes('hyaluronic')));
  const vitCItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('vitamin_c')));
  const retinolItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('retinol')));
  const caffeineItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('caffeine')));
  const peelingItem = findProduct((_, m) => m.active_ingredients?.some((a) => a.includes('glycolic')));

  // 3. Moisturizers
  const moisturizer =
    (hasHighOiliness || weather.tempC >= 26
      ? findProduct((_, m) => m.step_category === 'moisturizer' && m.texture === 'gel')
      : findProduct((_, m) => m.step_category === 'moisturizer' && m.texture === 'cream')) ||
    findProduct((_, m) => m.step_category === 'moisturizer');

  // ==================== AM ROUTINE ====================
  if (cleanser) {
    amSteps.push({
      stepCategory: 'Cleanser',
      product: cleanser,
      productName: cleanser.name,
      timing: 'AM',
      actionNote: hasHighOiliness
        ? `Foaming clarify cleanse tailored to your ${skin.skinType} skin to dissolve sebum excess without stripping.`
        : `Gentle morning cleanse tailored for ${skin.skinType} skin to refresh and prep the lipid barrier.`,
    });
  }

  // AM Active Serum
  if (hasAcne && niacinamideItem) {
    amSteps.push({
      stepCategory: 'Blemish & Sebum Control Serum',
      product: niacinamideItem,
      productName: niacinamideItem.name,
      timing: 'AM',
      activeIngredients: ['10% Niacinamide', '1% Zinc PCA'],
      actionNote: 'Regulates daytime sebum production, calms blemish redness, and prevents pore micro-congestion.',
    });
  } else if (hasHighRedness && centellaItem) {
    amSteps.push({
      stepCategory: 'Soothing Barrier Ampoule',
      product: centellaItem,
      productName: centellaItem.name,
      timing: 'AM',
      activeIngredients: ['Centella Asiatica', 'Madecassoside'],
      actionNote: 'Calms morning erythema and reinforces micro-vascular resilience against temperature shifts.',
    });
  } else if (hasFirmnessOrWrinkles && peptideItem) {
    amSteps.push({
      stepCategory: 'Collagen Architecture Peptide Serum',
      product: peptideItem,
      productName: peptideItem.name,
      timing: 'AM',
      activeIngredients: ['Copper Tripeptide-1', 'Matrixyl 3000', 'Argireline'],
      actionNote: 'Stimulates fibroblast synthesis to improve skin firmness, contour tension, and elasticity.',
    });
  } else if (hasDarkSpotsOrTan && tranexamicItem) {
    amSteps.push({
      stepCategory: 'Dark Spot & Tan Correction Serum',
      product: tranexamicItem,
      productName: tranexamicItem.name,
      timing: 'AM',
      activeIngredients: ['Tranexamic Acid', 'Alpha Arbutin'],
      actionNote: 'Inhibits UV-induced melanogenesis to fade post-inflammatory marks and sun-induced tan.',
    });
  } else if (hasHighDryness && polyglutamicItem) {
    amSteps.push({
      stepCategory: 'Deep Cellular Hydration Serum',
      product: polyglutamicItem,
      productName: polyglutamicItem.name,
      timing: 'AM',
      activeIngredients: ['Polyglutamic Acid', 'Multi-Molecular HA'],
      actionNote: 'Locks in 4x more moisture than hyaluronic acid alone to eliminate flakiness under makeup.',
    });
  } else if (vitCItem) {
    amSteps.push({
      stepCategory: 'Antioxidant Radiance Serum',
      product: vitCItem,
      productName: vitCItem.name,
      timing: 'AM',
      activeIngredients: ['15% Vitamin C', 'Phytosterols'],
      actionNote: 'Neutralizes free-radicals and provides photoprotective synergy under your sunscreen.',
    });
  }

  // AM Eye Treatment
  if (hasDarkCircles && caffeineItem) {
    amSteps.push({
      stepCategory: 'Eye Contour Micro-Circulation',
      product: caffeineItem,
      productName: caffeineItem.name,
      timing: 'AM',
      activeIngredients: ['5% Caffeine', 'EGCG'],
      actionNote: 'Constricts dilated periorbital micro-capillaries to diminish dark circles and drain morning puffiness.',
    });
  }

  // AM Moisturizer
  if (moisturizer) {
    amSteps.push({
      stepCategory: 'Moisturizer',
      product: moisturizer,
      productName: moisturizer.name,
      timing: 'AM',
      actionNote: weather.tempC >= 26
        ? `Weightless water-gel moisture for warm weather (${weather.tempC}°C) to prevent shine under makeup.`
        : hasHighDryness
        ? 'Deep lipid barrier cream to seal hydration against dry atmospheric air.'
        : 'Balancing emulsion to create a smooth, hydrated canvas for cosmetics.',
    });
  }

  // AM SPF
  if (spf) {
    amSteps.push({
      stepCategory: 'Broad-Spectrum Photoprotection (SPF)',
      product: spf,
      productName: spf.name,
      timing: 'AM',
      actionNote: `Mandatory photoprotection against today's UV index of ${weather.uvIndex} to prevent collagen degradation.`,
    });
  }

  // ==================== PM ROUTINE ====================
  if (cleanser) {
    pmSteps.push({
      stepCategory: 'Double Cleanse',
      product: cleanser,
      productName: cleanser.name,
      timing: 'PM',
      actionNote: 'Thoroughly dissolves long-wear makeup, SPF filters, and urban particulate matter.',
    });
  }

  // PM Targeted Treatment with Safety Conflict Checks
  if (hasHighRedness) {
    const soothingProduct = cicaplastItem || centellaItem;
    pmSteps.push({
      stepCategory: 'Intensive Barrier Recovery (Safety Protocol)',
      product: soothingProduct,
      productName: soothingProduct?.name || 'Cicaplast Baume B5+ Ultra-Repairing Balm',
      timing: 'PM',
      activeIngredients: ['Panthenol B5', 'Madecassoside', 'Zinc-Manganese'],
      actionNote: 'Exfoliating actives paused. Delivers intensive lipid nourishment to seal micro-cracks and extinguish erythema overnight.',
      isModified: true,
    });
  } else if (hasAcne && bhaItem) {
    pmSteps.push({
      stepCategory: 'Follicular Pore Clarifying Treatment',
      product: bhaItem,
      productName: bhaItem.name,
      timing: 'PM',
      activeIngredients: ['2% Salicylic Acid (BHA)', 'Green Tea'],
      actionNote: 'Penetrates lipid sebum within pores to dissolve keratin plugs and prevent inflammatory pustules.',
    });
  } else if (hasPoresOrTexture && azelaicItem) {
    pmSteps.push({
      stepCategory: 'Pore Refinement & Keratolytic Smoothing',
      product: azelaicItem,
      productName: azelaicItem.name,
      timing: 'PM',
      activeIngredients: ['10% Azelaic Acid', 'Salicylic Acid'],
      actionNote: 'Normalizes epidermal shedding to reduce enlarged pore visibility and refine rough surface texture.',
    });
  } else if (hasDarkSpotsOrTan && tranexamicItem) {
    pmSteps.push({
      stepCategory: 'Nocturnal Melanin Clarifying Serum',
      product: tranexamicItem,
      productName: tranexamicItem.name,
      timing: 'PM',
      activeIngredients: ['Tranexamic Acid', 'Alpha Arbutin'],
      actionNote: 'Suppresses inflammatory prostaglandins to clear stubborn sun tan and post-acne dark marks.',
    });
  } else if (retinolItem) {
    pmSteps.push({
      stepCategory: 'Cellular Turnover Retinoid Treatment',
      product: retinolItem,
      productName: retinolItem.name,
      timing: 'PM',
      activeIngredients: ['0.5% Pure Retinol', 'Bisabolol'],
      actionNote: 'Accelerates cellular renewal, refines micro-texture, and boosts overnight collagen remodeling.',
    });
  }

  // PM Barrier Moisturizer
  const pmMoisturizer = findProduct((_, m) => m.step_category === 'moisturizer' && m.texture === 'cream') || moisturizer;
  if (pmMoisturizer) {
    pmSteps.push({
      stepCategory: 'Overnight Barrier Occlusion',
      product: pmMoisturizer,
      productName: pmMoisturizer.name,
      timing: 'PM',
      actionNote: 'Reinforces lipid bilayer integrity and prevents transepidermal water loss (TEWL) during sleep.',
    });
  }

  // =========================================================================
  // 2. 64-FORMULA MAKEUP SHADE MATRIX SYNTHESIS
  // =========================================================================
  const vibeConfig = VIBE_MAKEUP_PROFILES[vibe] || VIBE_MAKEUP_PROFILES.classy;
  const palette = PALETTE_MATRIX[vibe]?.[seasonKey]?.[undertoneKey] || PALETTE_MATRIX.classy.Autumn.warm;

  const makeupSteps: MakeupStep[] = [];

  // Foundation Formulated to User's Exact Skin Tone & Fitzpatrick Depth
  const foundationHex = tone.skinToneHex || tone.hexCode || '#DFAC82';
  makeupSteps.push({
    category: 'foundation',
    colorHex: foundationHex,
    intensity: vibeConfig.foundationIntensity,
    finish: hasHighOiliness ? 'matte' : vibeConfig.preferredFinish,
    productName: `Custom ${undertoneKey.toUpperCase()} Tone Base (Fitzpatrick ${fitzpatrickType})`,
  });

  // Blush
  makeupSteps.push({
    category: 'blush',
    colorHex: palette.blush.hex,
    intensity: hasHighRedness ? Math.max(25, vibeConfig.blushIntensity - 20) : vibeConfig.blushIntensity,
    finish: vibe === 'bold' ? 'satin' : 'dewy',
    productName: palette.blush.name,
  });

  // Lip
  makeupSteps.push({
    category: 'lip',
    colorHex: palette.lip.hex,
    intensity: vibeConfig.lipIntensity,
    finish: vibe === 'bold' ? 'matte' : vibe === 'natural' ? 'glossy' : vibeConfig.preferredFinish,
    productName: palette.lip.name,
  });

  // Eyeshadow
  makeupSteps.push({
    category: 'eyeshadow',
    colorHex: palette.eyeshadow.hex,
    intensity: vibeConfig.eyeIntensity,
    productName: palette.eyeshadow.name,
  });

  // Eyebrow
  makeupSteps.push({
    category: 'eyebrow',
    colorHex: tone.eyebrowColorHex || '#422B1E',
    intensity: vibeConfig.browIntensity,
    productName: 'Brow Wiz Precision Definer',
  });

  // =========================================================================
  // 3. FITZPATRICK & SKIN TONE SCORING OUTFIT SELECTION
  // =========================================================================
  const outfitItems = ownedCloset.filter((i) => i.category.startsWith('outfit_'));
  const weatherCategory = weather.conditionCategory;

  const scoringContext = {
    vibe,
    undertone: undertoneKey,
    season: seasonKey,
    fitzpatrickType,
    weatherCategory,
    tempC: weather.tempC,
    uvIndex: weather.uvIndex,
  };

  // Rank dresses
  const scoredDresses = outfitItems
    .filter((i) => i.category === 'outfit_dress')
    .map((item) => ({ item, score: scoreOutfitItem(item, scoringContext) }))
    .sort((a, b) => b.score - a.score);

  // Rank tops
  const scoredTops = outfitItems
    .filter((i) => i.category === 'outfit_top')
    .map((item) => ({ item, score: scoreOutfitItem(item, scoringContext) }))
    .sort((a, b) => b.score - a.score);

  // Rank bottoms
  const scoredBottoms = outfitItems
    .filter((i) => i.category === 'outfit_bottom')
    .map((item) => ({ item, score: scoreOutfitItem(item, scoringContext) }))
    .sort((a, b) => b.score - a.score);

  // Rank outerwear
  const scoredOuterwear = outfitItems
    .filter((i) => i.category === 'outfit_outer')
    .map((item) => ({ item, score: scoreOutfitItem(item, scoringContext) }))
    .sort((a, b) => b.score - a.score);

  let topOrDress: ClosetItem | undefined;
  let bottom: ClosetItem | undefined;
  let outerwear: ClosetItem | undefined;
  let stylingRationale = '';
  let colorHarmonyRationale = '';

  // Decision Logic: If dress score is exceptional and vibe is elegant/bold/classy, pick dress
  const bestDress = scoredDresses[0];
  const bestTop = scoredTops[0];
  const bestBottom = scoredBottoms[0];

  if (bestDress && bestDress.score >= 70 && (vibe === 'elegant' || vibe === 'bold' || weather.tempC >= 25)) {
    topOrDress = bestDress.item;
    const dressMeta = (topOrDress.metadata || {}) as OutfitMetadata;
    stylingRationale = `Selected the ${topOrDress.name} (${dressMeta.color}) formulated in high-harmony with your ${undertoneKey.toUpperCase()} undertones and Fitzpatrick ${fitzpatrickType} phototype for a striking ${vibe} aesthetic.`;
    colorHarmonyRationale = `${dressMeta.color} delivers maximum chromatic contrast against your ${tone.seasonPalette} palette while staying thermally optimized for ${weather.tempC}°C.`;
  } else if (bestTop) {
    topOrDress = bestTop.item;
    bottom = bestBottom?.item || outfitItems.find((i) => i.category === 'outfit_bottom');
    const topMeta = (topOrDress.metadata || {}) as OutfitMetadata;
    const bottomMeta = (bottom?.metadata || {}) as OutfitMetadata;
    stylingRationale = `Paired the ${topOrDress.name} (${topMeta.color}) with ${bottom?.name || 'tailored trousers'} (${bottomMeta.color || 'neutral'}) to accentuate your ${undertoneKey} undertone and provide balanced ${vibe} styling.`;
    colorHarmonyRationale = `The ${topMeta.color} upper harmony illuminates your complexion without clashing with your natural melanin index (${tone.fitzpatrick?.melaninIndex || 45}%).`;
  } else {
    topOrDress = outfitItems.find((i) => i.category === 'outfit_top' || i.category === 'outfit_dress');
    bottom = outfitItems.find((i) => i.category === 'outfit_bottom');
    stylingRationale = `Selected versatile closet essentials (${topOrDress?.name}) tailored for ${weather.tempC}°C.`;
  }

  // Outerwear logic for cold, rain, or cool breeze
  if (weatherCategory === 'rain' || weatherCategory === 'cold' || weatherCategory === 'cool' || weather.tempC <= 19) {
    if (scoredOuterwear.length > 0) {
      outerwear = scoredOuterwear[0].item;
      stylingRationale += ` Layered with ${outerwear.name} for thermal comfort and weather defense.`;
    } else if (weatherCategory === 'rain') {
      gapFills.push({
        category: 'Outerwear',
        suggestedProduct: 'Water-Repellent Minimalist Trench',
        reason: `Precipitation (${weather.precipitationMm}mm) is expected today. A tailored water-resistant trench ensures style without weather damage.`,
        urgency: 'medium',
      });
    }
  }

  // Gap-Fill Suggestions for Missing Wardrobe Elements
  const makeupItems = ownedCloset.filter((i) => i.category === 'makeup');
  if (vibe === 'bold') {
    const hasBoldLip = makeupItems.some((i) => {
      const meta = i.metadata as MakeupMetadata;
      return meta.product_category === 'lip' && (meta.shade_hex === '#960018' || meta.shade_hex === '#851C24' || meta.shade_hex === '#BF3B2B');
    });
    if (!hasBoldLip) {
      gapFills.push({
        category: 'Makeup (Lipstick)',
        suggestedProduct: 'Retro Matte Lipstick (Ruby Woo Crimson)',
        reason: `Your chosen vibe is "${vibe.toUpperCase()}" with ${undertoneKey} undertones. A high-pigment statement crimson lip elevates facial contrast.`,
        urgency: 'recommended',
      });
    }
  }

  // =========================================================================
  // 4. HUMAN-READABLE EXPLANATION
  // =========================================================================
  const explanation = [
    `✨ **Mirror Check Daily Analysis (${weather.city || 'Your Location'})**:`,
    `- **Skin & Undertone**: Overall vitality is rated **${skin.overallScore}/100** with **${undertoneKey.toUpperCase()}** undertones (${tone.seasonPalette} season, Fitzpatrick ${fitzpatrickType}). ${hasHighRedness ? '⚠️ Mild barrier reactivity/redness detected — soothing protocol active.' : 'Lipid barrier is in prime equilibrium.'}`,
    `- **Atmospheric Defense**: Currently **${weather.tempC}°C / ${weather.tempF}°F** with **${weather.condition}** and **UV Index ${weather.uvIndex}** (${weather.uvIndex >= 6 ? 'High UV alert' : 'Moderate UV'}).`,
    `- **Clinical Skincare**: ${hasHighRedness ? 'Swapped active Retinol out of tonight\'s routine in favor of Centella & Cicaplast B5+ barrier recovery.' : hasAcne ? 'BHA Salicylic Acid + Niacinamide pore clarification active.' : 'Balanced daytime antioxidant defense and evening cellular renewal routine active.'}`,
    `- **Look & Wardrobe**: Curated a **${vibe.toUpperCase()}** aesthetic with ${vibeConfig.styleDesc}. ${stylingRationale}`,
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
      colorHarmonyRationale,
    },
    gapFillSuggestions: gapFills,
    explanation,
  };
}
