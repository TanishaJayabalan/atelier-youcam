import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getSupabaseServerClient, ClosetItem } from '../lib/supabase';

function stringToUuid(str: string): string {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-8${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

async function seedDatabase() {
  console.log('--- Seeding Mirror Check Demo Closet ---');

  const jsonPath = path.resolve(process.cwd(), 'data/demo-closet.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Seed data file not found at: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const items: ClosetItem[] = JSON.parse(rawData);

  console.log(`Read ${items.length} items from demo-closet.json`);
  console.log(`- Outfits: ${items.filter((i) => i.category.startsWith('outfit_')).length}`);
  console.log(`- Makeup: ${items.filter((i) => i.category === 'makeup').length}`);
  console.log(`- Skincare: ${items.filter((i) => i.category === 'skincare').length}`);

  const cleaned = items.map((item) => ({
    id: stringToUuid(item.id),
    category: item.category,
    name: item.name,
    brand: item.brand,
    image_url: item.image_url,
    is_owned: item.is_owned,
    metadata: item.metadata,
  }));

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('closet_items').upsert(cleaned, { onConflict: 'id' });

  if (error) {
    console.error('Supabase seeding error:', error.message);
    throw error;
  }

  console.log('✓ Successfully seeded all items into Supabase `closet_items` table!');
  console.log('\n=========================================');
  console.log('Component 9 (Demo Closet) seeding COMPLETE!');
  console.log('=========================================\n');
}

seedDatabase().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
