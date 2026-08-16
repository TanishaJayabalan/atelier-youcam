import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { analyzeParallelBeautyProfile } from '../lib/youcam/parallel-analyzer';
import { analyzeSkinTone } from '../lib/youcam/skin-tone';

async function main() {
  const res = await fetch('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&h=600&q=80');
  const buf = Buffer.from(await res.arrayBuffer());

  console.log('Testing live analyzeParallelBeautyProfile and analyzeSkinTone on makeupar.com...');
  const [bp, st] = await Promise.all([
    analyzeParallelBeautyProfile(buf),
    analyzeSkinTone(buf, 'image/jpeg')
  ]);

  console.log('=== SUCCESSFUL LIVE BEAUTY PROFILE ===');
  console.log('Overall vitality score:', bp.skin.overallScore);
  console.log('Skin type:', bp.skin.skinType);
  console.log('Concerns count:', Object.keys(bp.skin.concerns).length);
  for (const [k, v] of Object.entries(bp.skin.concerns)) {
    console.log(` - ${k}: ${v.score}% (${v.severity})`);
  }
  console.log('Skin Tone Hex:', st.hexCode);
  console.log('Undertone:', st.undertone);
  console.log('Season:', st.season);
  console.log('Fitzpatrick:', bp.fitzpatrick.type);
  console.log('Face Shape:', bp.faceAttributes.faceShape);
}

main().catch(err => {
  console.error('FAILED:', err);
  process.exit(1);
});
