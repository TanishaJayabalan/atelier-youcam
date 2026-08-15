import { UserBeautyProfile } from '@/types/beauty-profile';
import { generateMakeupAdvice, MakeupPlacementAdvice } from './makeup-advisor';

export interface ClosetItem {
  id: string;
  name: string;
  category: string;
  brand?: string;
  image_url?: string;
  color_hex?: string;
  metadata?: Record<string, any>;
}

export interface OwnedLookStep {
  categoryName: string;
  status: 'covered' | 'missing';
  itemUsed?: ClosetItem;
  effectType: string;
  techniqueNote: string;
  suggestedGapFill?: string;
}

export interface GeneratedOwnedLook {
  lookName: string;
  completenessScore: number; // e.g. 80%
  steps: OwnedLookStep[];
  coveredCount: number;
  totalCategoriesCount: number;
  vtoPayloadEffects: any[];
  summaryMessage: string;
}

export function generateLookFromOwnedProducts(
  ownedItems: ClosetItem[],
  beautyProfile?: UserBeautyProfile,
  customAdvice?: MakeupPlacementAdvice
): GeneratedOwnedLook {
  const profile = beautyProfile;
  const faceAttr = profile?.faceAttributes;
  const colorTones = profile?.colorTones;

  const advice =
    customAdvice ||
    (faceAttr && colorTones
      ? generateMakeupAdvice(faceAttr, colorTones)
      : {
          faceShape: 'Oval' as const,
          blushTechnique: {
            patternName: '2colors6',
            placementArea: 'High Cheekbone',
            techniqueName: 'Lifting Sculpt',
            instructions: 'Sweep along cheekbone',
          },
          contourTechnique: {
            patternName: 'Oval',
            sculptAreas: ['Hollows of cheeks'],
            instructions: 'Define hollows',
          },
          eyeTechnique: {
            eyeshadowPattern: '1color1',
            eyelinerStyle: 'Classic Wing',
            instructions: 'Soft wash of neutral bronze',
          },
          lipTechnique: {
            shapeName: 'original',
            morphologyFullness: 45,
            instructions: 'Define natural border',
          },
          browTechnique: {
            archStyle: 'Soft Arch',
            instructions: 'Hair-like strokes',
          },
          keyStylingTips: [],
        });

  // Filter makeup & skincare items from closet
  const makeupItems = ownedItems.filter(
    (i) => i.category === 'makeup' || (i.metadata as any)?.category === 'makeup'
  );

  const steps: OwnedLookStep[] = [];
  const vtoEffects: any[] = [];

  // Category 1: Lip Color
  const ownedLip = makeupItems.find(
    (i) =>
      (i.metadata as any)?.step_category === 'lip' ||
      i.name.toLowerCase().includes('lip') ||
      (i.metadata as any)?.type === 'lipstick'
  );
  if (ownedLip) {
    const lipHex = ownedLip.color_hex || (ownedLip.metadata as any)?.hex || '#B85D43';
    steps.push({
      categoryName: 'Lip Perfection',
      status: 'covered',
      itemUsed: ownedLip,
      effectType: 'lip_color',
      techniqueNote: `${advice.lipTechnique.instructions} Using your owned ${ownedLip.name}.`,
    });
    vtoEffects.push({
      category: 'lip_color',
      shape: { name: advice.lipTechnique.shapeName },
      morphology: { fullness: advice.lipTechnique.morphologyFullness, wrinkless: 70 },
      palettes: [
        {
          color: lipHex,
          texture: (ownedLip.metadata as any)?.finish || 'matte',
          colorIntensity: 80,
        },
      ],
    });
  } else {
    steps.push({
      categoryName: 'Lip Perfection',
      status: 'missing',
      effectType: 'lip_color',
      techniqueNote: 'No owned lip color in closet.',
      suggestedGapFill: 'Walk of No Shame Spiced Rose Satin Lipstick',
    });
  }

  // Category 2: Blush & Cheeks
  const ownedBlush = makeupItems.find(
    (i) =>
      (i.metadata as any)?.step_category === 'blush' ||
      i.name.toLowerCase().includes('blush') ||
      (i.metadata as any)?.type === 'blush'
  );
  if (ownedBlush) {
    const blushHex = ownedBlush.color_hex || (ownedBlush.metadata as any)?.hex || '#E89078';
    steps.push({
      categoryName: 'Cheek Flush & Lift',
      status: 'covered',
      itemUsed: ownedBlush,
      effectType: 'blush',
      techniqueNote: `${advice.blushTechnique.techniqueName}: ${advice.blushTechnique.instructions}`,
    });
    vtoEffects.push({
      category: 'blush',
      pattern: { name: advice.blushTechnique.patternName },
      palettes: [
        {
          color: blushHex,
          texture: 'matte',
          colorIntensity: 65,
        },
      ],
    });
  } else {
    steps.push({
      categoryName: 'Cheek Flush & Lift',
      status: 'missing',
      effectType: 'blush',
      techniqueNote: `Recommended ${advice.blushTechnique.techniqueName} blush placement.`,
      suggestedGapFill: 'Orgasm Radiant Peach-Pink Liquid Blush',
    });
  }

  // Category 3: Complexion / Foundation
  const ownedFoundation = makeupItems.find(
    (i) =>
      (i.metadata as any)?.step_category === 'foundation' ||
      i.name.toLowerCase().includes('foundation') ||
      i.name.toLowerCase().includes('tint')
  );
  if (ownedFoundation) {
    const foundHex =
      ownedFoundation.color_hex || (ownedFoundation.metadata as any)?.hex || colorTones?.skinColor || '#DFAC82';
    steps.push({
      categoryName: 'Base Complexion',
      status: 'covered',
      itemUsed: ownedFoundation,
      effectType: 'foundation',
      techniqueNote: `Even out skin barrier tone with your owned ${ownedFoundation.name}.`,
    });
    vtoEffects.push({
      category: 'foundation',
      palettes: [
        {
          color: foundHex,
          colorIntensity: 55,
          glowIntensity: 30,
          coverageIntensity: 50,
        },
      ],
    });
  } else {
    steps.push({
      categoryName: 'Base Complexion',
      status: 'missing',
      effectType: 'foundation',
      techniqueNote: 'No base foundation product registered in wardrobe.',
      suggestedGapFill: 'Luminous Silk Hydrating Foundation Shade 4.5',
    });
  }

  // Category 4: Eyeshadow & Eye Framing
  const ownedEye = makeupItems.find(
    (i) =>
      (i.metadata as any)?.step_category === 'eyeshadow' ||
      i.name.toLowerCase().includes('eyeshadow') ||
      i.name.toLowerCase().includes('shadow')
  );
  if (ownedEye) {
    const eyeHex = ownedEye.color_hex || (ownedEye.metadata as any)?.hex || '#8C6239';
    steps.push({
      categoryName: 'Eye Architecture',
      status: 'covered',
      itemUsed: ownedEye,
      effectType: 'eye_shadow',
      techniqueNote: `${advice.eyeTechnique.instructions}`,
    });
    vtoEffects.push({
      category: 'eye_shadow',
      pattern: { name: advice.eyeTechnique.eyeshadowPattern },
      palettes: [{ color: eyeHex, texture: 'shimmer', colorIntensity: 60 }],
    });
  } else {
    steps.push({
      categoryName: 'Eye Architecture',
      status: 'missing',
      effectType: 'eye_shadow',
      techniqueNote: `Custom shadow sculpting for ${faceAttr?.eyelidType || 'Double-lid'} eyes.`,
      suggestedGapFill: 'Biba Neutral Warm Eyeshadow Palette',
    });
  }

  // Category 5: Brows
  const ownedBrow = makeupItems.find(
    (i) =>
      (i.metadata as any)?.step_category === 'eyebrow' ||
      i.name.toLowerCase().includes('brow')
  );
  if (ownedBrow) {
    const browHex = ownedBrow.color_hex || colorTones?.eyebrowColor || '#4A3B32';
    steps.push({
      categoryName: 'Brow Framing',
      status: 'covered',
      itemUsed: ownedBrow,
      effectType: 'eyebrows',
      techniqueNote: `${advice.browTechnique.instructions}`,
    });
    vtoEffects.push({
      category: 'eyebrows',
      pattern: { type: 'color' },
      palettes: [{ color: browHex, texture: 'matte', colorIntensity: 70 }],
    });
  } else {
    steps.push({
      categoryName: 'Brow Framing',
      status: 'missing',
      effectType: 'eyebrows',
      techniqueNote: `Define ${advice.browTechnique.archStyle} brow structure.`,
      suggestedGapFill: 'Brow Wiz Ultra-Slim Micro Pencil',
    });
  }

  const coveredCount = steps.filter((s) => s.status === 'covered').length;
  const totalCategoriesCount = steps.length;
  const completenessScore = Math.round((coveredCount / totalCategoriesCount) * 100);

  let summaryMessage = `${coveredCount} of ${totalCategoriesCount} makeup categories are fully powered by items in your closet.`;
  if (completenessScore === 100) {
    summaryMessage = '100% Complete Look! All makeup categories are ready to render using your existing wardrobe.';
  } else if (completenessScore >= 60) {
    summaryMessage = `Strong wardrobe coverage (${completenessScore}%). You have the core items for this look!`;
  }

  return {
    lookName: `${faceAttr?.faceShape || 'Personalized'} Signature Closet Edit`,
    completenessScore,
    steps,
    coveredCount,
    totalCategoriesCount,
    vtoPayloadEffects: vtoEffects,
    summaryMessage,
  };
}
