import { UserBeautyProfile } from '@/types/beauty-profile';
import { analyzeSkin } from './skin-analysis';
import { analyzeFitzpatrickScale } from './fitzpatrick-analyzer';
import { analyzeColorTones } from './color-tones-analyzer';
import { analyzeFaceAttributes } from './face-attr-analyzer';

export async function analyzeParallelBeautyProfile(
  imageInput: Buffer | string
): Promise<UserBeautyProfile> {
  const buf = Buffer.isBuffer(imageInput)
    ? imageInput
    : Buffer.from(String(imageInput).replace(/^data:image\/\w+;base64,/, ''), 'base64');

  const [skin, fitzpatrick, colorTones, faceAttributes] = await Promise.all([
    analyzeSkin(buf, 'image/jpeg'),
    analyzeFitzpatrickScale(imageInput),
    analyzeColorTones(imageInput),
    analyzeFaceAttributes(imageInput),
  ]);

  return {
    skin,
    fitzpatrick,
    colorTones,
    faceAttributes,
  };
}
