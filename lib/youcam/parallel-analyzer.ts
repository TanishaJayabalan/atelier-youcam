import {
  UserBeautyProfile,
  FitzpatrickResult,
  ColorTonesResult,
  FaceAttributesResult,
} from '@/types/beauty-profile';
import { analyzeSkin, SkinAnalysisResult } from './skin-analysis';
import { analyzeFitzpatrickScale } from './fitzpatrick-analyzer';
import { analyzeColorTones } from './color-tones-analyzer';
import { analyzeFaceAttributes } from './face-attr-analyzer';

const DEFAULT_FITZPATRICK: FitzpatrickResult = {
  type: 'III',
  label: 'Type III: Medium Beige / Olive',
  sunReaction: 'Sometimes mild burn, gradually tans to olive',
  melaninIndex: 45,
  description: 'Balanced olive to medium skin tone with moderate natural photoprotection.',
};

const DEFAULT_COLOR_TONES: ColorTonesResult = {
  skinColor: '#DFAC82',
  eyeColor: '#3A2E2B',
  eyeColorName: 'Brown',
  lipColor: '#C86267',
  eyebrowColor: '#4A3B32',
  hairColor: '#2B211D',
  hairColorName: 'Brown',
  undertone: 'neutral',
};

const DEFAULT_FACE_ATTRIBUTES: FaceAttributesResult = {
  faceShape: 'Oval',
  age: 26,
  gender: 'female',
  eyeShape: 'Almond',
  eyeSize: 'Average',
  eyeAngle: 'Average',
  eyeDistance: 'Average',
  eyelidType: 'Double-lid',
  eyebrowShape: 'Soft Angled',
  eyebrowThickness: 'Average',
  eyebrowDistance: 'Average',
  lipShape: 'Full',
  noseWidth: 'Average',
  noseLength: 'Average',
  cheekbones: 'High Cheekbone',
  ratios: {
    faceAspectRatio: 1.44,
    horizontalThird: '33% : 34% : 33% (Balanced)',
    verticalFifth: '20% : 20% : 20% : 20% : 20% (Balanced)',
    eyeAspectRatio: 3.0,
    noseToLipToChin: 'Balanced lower-third ratio (1:1.618)',
    upperLipToLowerLip: 'Balanced (1:1.618 golden proportion)',
  },
};

export async function analyzeParallelBeautyProfile(
  imageInput: Buffer | string
): Promise<UserBeautyProfile> {
  const buf = Buffer.isBuffer(imageInput)
    ? imageInput
    : Buffer.from(String(imageInput).replace(/^data:image\/\w+;base64,/, ''), 'base64');

  const [skinRes, fitzpatrickRes, colorTonesRes, faceAttributesRes] = await Promise.allSettled([
    analyzeSkin(buf, 'image/jpeg'),
    analyzeFitzpatrickScale(imageInput),
    analyzeColorTones(imageInput),
    analyzeFaceAttributes(imageInput),
  ]);

  let skin: SkinAnalysisResult;
  if (skinRes.status === 'fulfilled') {
    skin = skinRes.value;
  } else {
    console.error('[Skin Analysis Error]:', skinRes.reason);
    throw new Error(skinRes.reason?.message || 'Skin analysis failed');
  }

  const fitzpatrick: FitzpatrickResult =
    fitzpatrickRes.status === 'fulfilled'
      ? fitzpatrickRes.value
      : (console.warn('[Fitzpatrick Scaled Warning]:', fitzpatrickRes.reason?.message), DEFAULT_FITZPATRICK);

  const colorTones: ColorTonesResult =
    colorTonesRes.status === 'fulfilled'
      ? colorTonesRes.value
      : (console.warn('[Color Tones Warning]:', colorTonesRes.reason?.message), DEFAULT_COLOR_TONES);

  const faceAttributes: FaceAttributesResult =
    faceAttributesRes.status === 'fulfilled'
      ? faceAttributesRes.value
      : (console.warn('[Face Attributes Warning]:', faceAttributesRes.reason?.message), DEFAULT_FACE_ATTRIBUTES);

  return {
    skin,
    fitzpatrick,
    colorTones,
    faceAttributes,
  };
}
