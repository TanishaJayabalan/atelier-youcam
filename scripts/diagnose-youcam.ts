import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getAccessToken } from '../lib/youcam/auth';
import { analyzeSkin } from '../lib/youcam/skin-analysis';
import { analyzeSkinTone } from '../lib/youcam/skin-tone';
import { analyzeFitzpatrickScale } from '../lib/youcam/fitzpatrick-analyzer';
import { analyzeColorTones } from '../lib/youcam/color-tones-analyzer';
import { analyzeFaceAttributes } from '../lib/youcam/face-attr-analyzer';

async function diagnose() {
  console.log('=== Step 1: Testing YouCam Auth ===');
  try {
    const token = await getAccessToken(true);
    console.log('✓ Token obtained successfully! (Length:', token.length, ')');
  } catch (err: any) {
    console.error('✗ Auth Failed:', err.message);
    return;
  }

  console.log('\n=== Step 2: Fetching Portrait Selfie ===');
  const selfieRes = await fetch('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=600&q=80');
  const selfieBuf = Buffer.from(await selfieRes.arrayBuffer());
  console.log('✓ Image fetched. Size:', selfieBuf.length, 'bytes');

  console.log('\n=== Step 3: Running analyzeSkin ===');
  try {
    const skinRes = await analyzeSkin(selfieBuf, 'image/jpeg');
    console.log('✓ analyzeSkin Output:');
    console.log('  overallScore:', skinRes.overallScore);
    console.log('  skinType:', skinRes.skinType);
    console.log('  skinAge:', skinRes.skinAge);
    console.log('  concerns count:', Object.keys(skinRes.concerns).length);
    console.log('  concerns:', skinRes.concerns);
    console.log('  rawResponse:', JSON.stringify(skinRes.rawResponse, null, 2));
  } catch (err: any) {
    console.error('✗ analyzeSkin Failed:', err.message);
  }

  console.log('\n=== Step 4: Running analyzeSkinTone ===');
  try {
    const toneRes = await analyzeSkinTone(selfieBuf, 'image/jpeg');
    console.log('✓ analyzeSkinTone Output:');
    console.log('  hexCode:', toneRes.hexCode);
    console.log('  undertone:', toneRes.undertone);
    console.log('  season:', toneRes.season);
    console.log('  palette description:', toneRes.colorHarmonyDescription);
    console.log('  rawResponse:', JSON.stringify(toneRes.rawResponse, null, 2));
  } catch (err: any) {
    console.error('✗ analyzeSkinTone Failed:', err.message);
  }

  console.log('\n=== Step 5: Running analyzeFitzpatrickScale ===');
  try {
    const fitzRes = await analyzeFitzpatrickScale(selfieBuf);
    console.log('✓ analyzeFitzpatrickScale Output:', fitzRes);
  } catch (err: any) {
    console.error('✗ analyzeFitzpatrickScale Failed:', err.message);
  }

  console.log('\n=== Step 6: Running analyzeColorTones ===');
  try {
    const ctRes = await analyzeColorTones(selfieBuf);
    console.log('✓ analyzeColorTones Output:', ctRes);
  } catch (err: any) {
    console.error('✗ analyzeColorTones Failed:', err.message);
  }

  console.log('\n=== Step 7: Running analyzeFaceAttributes ===');
  try {
    const faceRes = await analyzeFaceAttributes(selfieBuf);
    console.log('✓ analyzeFaceAttributes Output:', faceRes);
  } catch (err: any) {
    console.error('✗ analyzeFaceAttributes Failed:', err.message);
  }
}

diagnose();
