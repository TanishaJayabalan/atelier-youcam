import { SkinAnalysisResult } from '@/lib/youcam/skin-analysis';

export type FitzpatrickType = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export interface FitzpatrickResult {
  type: FitzpatrickType;
  label: string;
  sunReaction: string;
  melaninIndex: number;
  description: string;
}

export interface ColorTonesResult {
  skinColor: string;
  eyeColor: string;
  eyeColorName: 'Amber' | 'Brown' | 'Green' | 'Blue' | 'Gray' | 'Hazel' | 'Other';
  lipColor: string;
  eyebrowColor: string;
  hairColor: string;
  hairColorName: 'Auburn' | 'Black' | 'Blonde' | 'Brown' | 'Grey/White' | 'Red' | 'Other';
  undertone: 'warm' | 'cool' | 'neutral' | 'olive';
}

export type FaceShape =
  | 'Oval'
  | 'Round'
  | 'Heart'
  | 'Square'
  | 'Diamond'
  | 'Oblong'
  | 'Triangle'
  | 'InvTriangle';

export interface FaceAttributesResult {
  faceShape: FaceShape;
  age?: number;
  gender?: 'female' | 'male' | 'unknown';
  eyeShape: 'Almond' | 'Round' | 'Narrow';
  eyeSize: 'Big' | 'Small' | 'Average';
  eyeAngle: 'Upturned' | 'Downturned' | 'Average';
  eyeDistance: 'Close-set' | 'Wide-Set' | 'Average';
  eyelidType: 'Double-lid' | 'Single-lid' | 'Hooded-lid' | 'Deep-Set';
  eyebrowShape: 'Soft Angled' | 'Hard Angled' | 'Straight' | 'Rounded' | 'Arched';
  eyebrowThickness: 'Dense' | 'Sparse' | 'Average';
  eyebrowDistance: 'Close' | 'Far-Apart' | 'Average';
  lipShape: 'Full' | 'Thin' | 'Bow' | 'Downturned' | 'Round' | 'Wide' | 'Average';
  noseWidth: 'Narrow' | 'Broad' | 'Average';
  noseLength: 'Long' | 'Short' | 'Average';
  cheekbones: 'High Cheekbone' | 'Low Cheekbone' | 'Round Cheeks' | 'Flat Cheekbone';
  ratios: {
    faceAspectRatio?: number;
    horizontalThird?: string;
    verticalFifth?: string;
    eyeAspectRatio?: number;
    noseToLipToChin?: string;
    upperLipToLowerLip?: string;
  };
}

export interface UserBeautyProfile {
  skin: SkinAnalysisResult;
  fitzpatrick: FitzpatrickResult;
  colorTones: ColorTonesResult;
  faceAttributes: FaceAttributesResult;
}

export interface HairProfile {
  curlType: string; // e.g. "2b to 2c"
  curlTerm: string; // e.g. "Medium Wavy"
  curlCategory: 'straight' | 'wavy' | 'curly' | 'coily';
  length: 'above the ears' | 'ear length' | 'short hair' | 'above chest' | 'long hair';
  lengthTerm: string;
  frizziness: 0 | 1 | 2 | 3;
  frizzTerm: 'Not Frizzy' | 'Slightly Frizzy' | 'Frizzy' | 'Extreme Frizzy';
  naturalColorHex?: string;
  naturalColorName?: string;
  engineSource?: 'youcam_ai' | 'optical_fallback';
  engineNotice?: string;
}
