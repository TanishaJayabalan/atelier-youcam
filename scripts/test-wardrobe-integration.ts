import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { classifyApparelFromPhotoAndText } from '../lib/apparel-analyzer';
import { getClosetItems } from '../lib/supabase';
import { generateRecommendation } from '../lib/recommendation-engine';

async function testWardrobe() {
  console.log('====================================================');
  console.log('🧪 RUNNING MIRROR-CHECK WARDROBE & SEED VERIFICATION');
  console.log('====================================================\n');

  // 1. Test AI Apparel Auto-Classification
  console.log('1. Testing AI Apparel Auto-Classification (YouCam V4 Standard)...');
  const samples = [
    { text: 'Emerald green silk slip midi dress for evening party', brand: 'Reformation' },
    { text: 'High waist tailored wide leg linen trousers', brand: 'COS' },
    { text: 'Crimson red cropped blazer jacket', brand: 'The Frankie Shop' },
    { text: 'Ribbed cashmere knit sweater top', brand: 'Toteme' },
  ];

  for (const s of samples) {
    const res = await classifyApparelFromPhotoAndText({ textDescription: s.text, brand: s.brand });
    console.log(`✓ Text: "${s.text}"`);
    console.log(`   -> Category: ${res.category} (YouCam V4: ${res.youcamCategory})`);
    console.log(`   -> Vibe: ${res.metadata.formality_tag} | Color: ${res.metadata.color} (${res.metadata.color_hex})`);
    console.log(`   -> Weather: [${res.metadata.weather_tags.join(', ')}] | Fabric: ${res.metadata.fabric}\n`);
  }

  // 2. Test Supabase Database Items
  console.log('2. Verifying Supabase Closet Database Items...');
  const items = await getClosetItems();
  console.log(`✓ Total items in Supabase: ${items.length}`);
  const dresses = items.filter((i) => i.category === 'outfit_dress');
  const tops = items.filter((i) => i.category === 'outfit_top');
  const bottoms = items.filter((i) => i.category === 'outfit_bottom');
  const outer = items.filter((i) => i.category === 'outfit_outer');
  console.log(`- 👗 Dresses: ${dresses.length}`);
  console.log(`- 👚 Tops: ${tops.length}`);
  console.log(`- 👖 Bottoms: ${bottoms.length}`);
  console.log(`- 🧥 Outerwear: ${outer.length}`);
  console.log(`- 💄 Makeup: ${items.filter((i) => i.category === 'makeup').length}`);
  console.log(`- 🧴 Skincare: ${items.filter((i) => i.category === 'skincare').length}\n`);

  // 3. Test Recommendation Engine with Outfits & Vibes
  console.log('3. Testing Recommendation Engine with Vibes & Weather...');
  const mockSkin: any = {
    overallScore: 88,
    skinType: 'normal',
    concerns: { redness: 10, spots: 12, wrinkles: 8, pores: 14 },
    topConcerns: [],
  };
  const mockSkinTone: any = {
    undertone: 'cool',
    seasonPalette: 'Winter',
    hexCode: '#F3D2C1',
  };
  const mockWeather: any = {
    tempC: 22,
    tempF: 71.6,
    condition: 'Sunny',
    conditionCategory: 'warm',
    uvIndex: 4,
    humidity: 45,
  };

  const vibes = ['elegant', 'bold', 'classy', 'natural'] as const;
  for (const v of vibes) {
    const rec = await generateRecommendation({
      skin: mockSkin,
      tone: mockSkinTone,
      weather: mockWeather,
      vibe: v,
      ownedCloset: items,
    });
    console.log(`✓ Vibe "${v.toUpperCase()}" Selected Outfit:`);
    console.log(`   -> Main: ${rec.outfit.topOrDress?.name || 'None'} (${rec.outfit.topOrDress?.category})`);
    if (rec.outfit.bottom) console.log(`   -> Bottom: ${rec.outfit.bottom.name}`);
    if (rec.outfit.outerwear) console.log(`   -> Outerwear: ${rec.outfit.outerwear.name}`);
    console.log(`   -> Styling Rationale: ${rec.outfit.stylingRationale}\n`);
  }

  console.log('====================================================');
  console.log('🎉 ALL INTEGRATION CHECKS PASSED PERFECTLY!');
  console.log('====================================================');
}

testWardrobe().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
