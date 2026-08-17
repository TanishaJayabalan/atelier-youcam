import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { getSupabaseServerClient, ClosetItem } from '../lib/supabase';

export function stringToUuid(str: string): string {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-4${hash.substring(13, 16)}-8${hash.substring(17, 20)}-${hash.substring(20, 32)}`;
}

export async function seedDatabase(): Promise<{ count: number; items: ClosetItem[] }> {
  console.log('--- Seeding Mirror Check Demo Closet ---');

  const jsonPath = path.resolve(process.cwd(), 'data/demo-closet.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Seed data file not found at: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const items: ClosetItem[] = JSON.parse(rawData);

  console.log(`Read ${items.length} items from demo-closet.json`);
  console.log(`- Dresses: ${items.filter((i) => i.category === 'outfit_dress').length}`);
  console.log(`- Tops: ${items.filter((i) => i.category === 'outfit_top').length}`);
  console.log(`- Bottoms: ${items.filter((i) => i.category === 'outfit_bottom').length}`);
  console.log(`- Outerwear: ${items.filter((i) => i.category === 'outfit_outer').length}`);
  console.log(`- Makeup: ${items.filter((i) => i.category === 'makeup').length}`);
  console.log(`- Skincare: ${items.filter((i) => i.category === 'skincare').length}`);

  const cleaned = items.map((item) => ({
    id: stringToUuid(item.id),
    category: item.category,
    name: item.name,
    brand: item.brand,
    image_url: item.image_url,
    is_owned: item.is_owned !== undefined ? item.is_owned : true,
    metadata: item.metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('closet_items').upsert(cleaned, { onConflict: 'id' });

  if (error) {
    console.error('Supabase seeding error:', error.message);
    throw error;
  }

  console.log(`✓ Successfully seeded ${cleaned.length} items into Supabase closet_items table!`);
  return { count: cleaned.length, items: cleaned as any };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith('seed.ts')) {
  seedDatabase()
    .then((res) => {
      console.log(`Seed complete: ${res.count} items seeded.`);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
