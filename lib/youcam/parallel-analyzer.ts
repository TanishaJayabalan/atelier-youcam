import { UserBeautyProfile } from '@/types/beauty-profile';
import { analyzeSkin, SkinAnalysisResult, generateMockSkinAnalysis } from './skin-analysis';
import { analyzeFitzpatrickScale, computeCalibratedFitzpatrick } from './fitzpatrick-analyzer';
import { analyzeColorTones, computeCalibratedColorTones } from './color-tones-analyzer';
import { analyzeFaceAttributes, computeCalibratedFaceAttributes } from './face-attr-analyzer';
import { extractBufferTelemetry, OpticalTelemetry } from '../image-analysis';

export async function analyzeParallelBeautyProfile(
  imageInput: Buffer | string,
  telemetry?: OpticalTelemetry
): Promise<UserBeautyProfile> {
  const isBuffer = Buffer.isBuffer(imageInput);
  const activeTelemetry = telemetry || (isBuffer ? extractBufferTelemetry(imageInput) : undefined);

  // Execute all 4 YouCam analyzers in parallel
  const [skinPromise, fitzpatrickPromise, colorTonesPromise, faceAttrPromise] = await Promise.allSettled([
    analyzeSkin(imageInput, activeTelemetry),
    analyzeFitzpatrickScale(imageInput, activeTelemetry),
    analyzeColorTones(imageInput, activeTelemetry),
    analyzeFaceAttributes(imageInput, activeTelemetry),
  ]);

  // Extract resolved values with calibrated fallbacks
  const skin: SkinAnalysisResult =
    skinPromise.status === 'fulfilled'
      ? skinPromise.value
      : (activeTelemetry ? generateMockSkinAnalysis(undefined, activeTelemetry) : generateMockSkinAnalysis());

  const fitzpatrick =
    fitzpatrickPromise.status === 'fulfilled'
      ? fitzpatrickPromise.value
      : (activeTelemetry ? computeCalibratedFitzpatrick(activeTelemetry) : computeCalibratedFitzpatrick({ avgR: 210, avgG: 170, avgB: 145, rednessRatio: 0.2, specularRatio: 0.14, roughnessVariance: 14, underEyeContrast: 0.1, luminance: 180 }));

  const colorTones =
    colorTonesPromise.status === 'fulfilled'
      ? colorTonesPromise.value
      : (activeTelemetry ? computeCalibratedColorTones(activeTelemetry) : computeCalibratedColorTones({ avgR: 210, avgG: 170, avgB: 145, rednessRatio: 0.2, specularRatio: 0.14, roughnessVariance: 14, underEyeContrast: 0.1, luminance: 180 }));

  const faceAttributes =
    faceAttrPromise.status === 'fulfilled'
      ? faceAttrPromise.value
      : computeCalibratedFaceAttributes(activeTelemetry);

  return {
    skin,
    fitzpatrick,
    colorTones,
    faceAttributes,
  };
}
