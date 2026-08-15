import { FaceAttributesResult, ColorTonesResult, FaceShape } from '@/types/beauty-profile';

export interface MakeupPlacementAdvice {
  faceShape: FaceShape;
  blushTechnique: {
    patternName: string;
    placementArea: string;
    techniqueName: string;
    instructions: string;
  };
  contourTechnique: {
    patternName: string;
    sculptAreas: string[];
    instructions: string;
  };
  eyeTechnique: {
    eyeshadowPattern: string;
    eyelinerStyle: string;
    instructions: string;
  };
  lipTechnique: {
    shapeName: string;
    morphologyFullness: number;
    instructions: string;
  };
  browTechnique: {
    archStyle: string;
    instructions: string;
  };
  keyStylingTips: string[];
}

export function generateMakeupAdvice(
  faceAttr: FaceAttributesResult,
  colorTones: ColorTonesResult
): MakeupPlacementAdvice {
  const { faceShape, eyeShape, eyelidType, eyeDistance, cheekbones, lipShape, eyebrowShape } = faceAttr;
  const { undertone, skinColor } = colorTones;

  // 1. Blush Technique based on Face Shape & Cheekbones
  let blushPattern = '2colors6';
  let blushArea = 'Upper Cheekbone to Temple';
  let blushTechName = 'Lifting Sculpt Drape';
  let blushInstructions = 'Sweep blush diagonally upward along the high cheekbone line into the hairline to elongate and lift.';

  if (faceShape === 'Round' || cheekbones === 'Round Cheeks') {
    blushPattern = '2colors3';
    blushArea = 'Angle sweep beneath the cheek crest';
    blushTechName = 'Angular Slant Sculpt';
    blushInstructions = 'Apply blush starting two finger-widths from the nose, blending diagonally upwards toward the ear to create cheekbone definition.';
  } else if (faceShape === 'Square' || faceShape === 'Triangle') {
    blushPattern = '2colors4';
    blushArea = 'Apples of the cheeks with soft circular diffusion';
    blushTechName = 'Softening Halo Flush';
    blushInstructions = 'Focus the color onto the apples of the cheeks in gentle circular motions to soften angular jaw lines.';
  } else if (faceShape === 'Heart' || faceShape === 'InvTriangle') {
    blushPattern = '2colors5';
    blushArea = 'Mid-cheek sweeping outward horizontally';
    blushTechName = 'Horizontal Balancing Sweep';
    blushInstructions = 'Apply across the center of cheeks to visually balance the wider forehead and slender jawline.';
  }

  // 2. Contour Technique
  let contourPattern = 'Oval';
  let sculptAreas = ['Hollows of cheeks', 'Temples', 'Jawline'];
  let contourInstructions = 'Follow the natural hollow below the zygomatic arch to enhance bone structure.';

  if (faceShape === 'Round') {
    contourPattern = 'Round';
    sculptAreas = ['Sides of jawline', 'Lower cheek hollows', 'Temples'];
    contourInstructions = 'Contour the outer perimeter of the face and under the jawline to create structured vertical dimensions.';
  } else if (faceShape === 'Square') {
    contourPattern = 'Square';
    sculptAreas = ['Jaw angles', 'Hairline corners'];
    contourInstructions = 'Shade the sharp lower corners of the jawbone and forehead hairline corners to soften the square perimeter.';
  } else if (faceShape === 'Heart') {
    contourPattern = 'Heart';
    sculptAreas = ['Temples', 'Upper forehead edges', 'Tip of the chin'];
    contourInstructions = 'Buff contour along the upper temple curves and lightly dust the chin tip to soften lower face contrast.';
  }

  // 3. Eye Technique
  let eyePattern = '1color1';
  let eyeLiner = 'Classic Subtle Wing';
  let eyeInstructions = 'Blend neutral transition shade across the orbital socket; flick an eyeliner wing upward.';

  if (eyelidType === 'Hooded-lid' || eyelidType === 'Single-lid') {
    eyePattern = '2colors2';
    eyeLiner = 'Batwing / Floating Crease Liner';
    eyeInstructions = 'Apply transition shade slightly ABOVE the hooded fold so depth is visible with eyes open. Use a batwing liner flick.';
  } else if (eyeDistance === 'Close-set') {
    eyePattern = '3colors1';
    eyeLiner = 'Outer Half Wing';
    eyeInstructions = 'Keep the inner eye corners bright with champagne highlight; concentrate deep eyeshadow pigments on the outer third.';
  } else if (eyeShape === 'Almond') {
    eyePattern = '3colors3';
    eyeLiner = 'Sleek Cat-Eye Flick';
    eyeInstructions = 'Accompany natural almond symmetry with a smoke-out outer v and elongated cat-eye liner.';
  }

  // 4. Lip Technique
  let lipShapeName = 'original';
  let lipFullness = 45;
  let lipInstructions = 'Follow natural vermillion border with crisp definition.';

  if (lipShape === 'Thin') {
    lipShapeName = 'plump';
    lipFullness = 75;
    lipInstructions = 'Overline subtly at the cupid’s bow and center lower lip with lip liner, topping with high-shine gloss for dimensional volume.';
  } else if (lipShape === 'Bow') {
    lipShapeName = 'heart-shaped';
    lipFullness = 55;
    lipInstructions = 'Emphasize the sharp cupid’s bow apex with a precise satin matte lip pencil.';
  }

  // 5. Brow Technique
  let browArch = 'Soft Arch';
  let browInstructions = 'Fill sparse gaps with fine hair-like strokes adhering to natural brow bone.';
  if (faceShape === 'Round') {
    browArch = 'High Structured Arch';
    browInstructions = 'Define a higher, sharper arch to add vertical balance and lift to the face.';
  } else if (faceShape === 'Square') {
    browArch = 'Soft Curved Brow';
    browInstructions = 'Gently round the brow curve to counterbalance sharp jawline angles.';
  }

  const keyStylingTips = [
    `Facial Shape [${faceShape}]: ${blushTechName} technique selected to optimize cheekbone elevation.`,
    `Eye Architecture [${eyelidType}, ${eyeShape}]: ${eyeLiner} applied with shadow placement tailored for crease depth.`,
    `Lip Morphology [${lipShape}]: Structured for ${lipShapeName === 'plump' ? 'dimensional volume & optical plumping' : 'clean architectural definition'}.`,
    `Harmonized Undertone [${undertone.toUpperCase()}]: Formulated to complement ${skinColor} skin tone.`,
  ];

  return {
    faceShape,
    blushTechnique: {
      patternName: blushPattern,
      placementArea: blushArea,
      techniqueName: blushTechName,
      instructions: blushInstructions,
    },
    contourTechnique: {
      patternName: contourPattern,
      sculptAreas,
      instructions: contourInstructions,
    },
    eyeTechnique: {
      eyeshadowPattern: eyePattern,
      eyelinerStyle: eyeLiner,
      instructions: eyeInstructions,
    },
    lipTechnique: {
      shapeName: lipShapeName,
      morphologyFullness: lipFullness,
      instructions: lipInstructions,
    },
    browTechnique: {
      archStyle: browArch,
      instructions: browInstructions,
    },
    keyStylingTips,
  };
}
