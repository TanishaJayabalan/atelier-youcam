import { analyzeImageOptically } from '../lib/optical-analyzer';

async function testOptical() {
  console.log('--- Testing Optical Pixel Analyzer across diverse complexions ---');

  // Sample 1: Fair / Cool
  console.log('\n[Image 1: Fair Alabaster Portrait]');
  const res1 = await fetch('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&h=600&q=80');
  const buf1 = Buffer.from(await res1.arrayBuffer());
  const out1 = await analyzeImageOptically(buf1);
  console.log('Hex:', out1.skinTone.hexCode);
  console.log('Undertone:', out1.skinTone.undertone);
  console.log('Season:', out1.skinTone.season);
  console.log('Fitzpatrick:', out1.beautyProfile.fitzpatrick.label);
  console.log('Overall Vitality:', out1.skinAnalysis.overallScore);
  console.log('Concerns:', Object.entries(out1.skinAnalysis.concerns).map(([k, v]) => `${k}: ${v.score}%`).join(', '));

  // Sample 2: Deep Ebony Portrait
  console.log('\n[Image 2: Deep Ebony Portrait]');
  const res2 = await fetch('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=600&q=80');
  const buf2 = Buffer.from(await res2.arrayBuffer());
  const out2 = await analyzeImageOptically(buf2);
  console.log('Hex:', out2.skinTone.hexCode);
  console.log('Undertone:', out2.skinTone.undertone);
  console.log('Season:', out2.skinTone.season);
  console.log('Fitzpatrick:', out2.beautyProfile.fitzpatrick.label);
  console.log('Overall Vitality:', out2.skinAnalysis.overallScore);
  console.log('Concerns:', Object.entries(out2.skinAnalysis.concerns).map(([k, v]) => `${k}: ${v.score}%`).join(', '));

  // Sample 3: Golden Olive Portrait
  console.log('\n[Image 3: Warm Olive Portrait]');
  const res3 = await fetch('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&h=600&q=80');
  const buf3 = Buffer.from(await res3.arrayBuffer());
  const out3 = await analyzeImageOptically(buf3);
  console.log('Hex:', out3.skinTone.hexCode);
  console.log('Undertone:', out3.skinTone.undertone);
  console.log('Season:', out3.skinTone.season);
  console.log('Fitzpatrick:', out3.beautyProfile.fitzpatrick.label);
  console.log('Overall Vitality:', out3.skinAnalysis.overallScore);
  console.log('Concerns:', Object.entries(out3.skinAnalysis.concerns).map(([k, v]) => `${k}: ${v.score}%`).join(', '));
}

testOptical();
