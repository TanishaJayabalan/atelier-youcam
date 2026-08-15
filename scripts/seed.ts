import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { getSupabaseServerClient, isSupabaseConfigured, inMemoryStore, ClosetItem } from '../lib/supabase';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedDatabase() {
  console.log('--- Seeding Mirror Check Demo Closet ---');

  const jsonPath = path.resolve(process.cwd(), 'data/demo-closet.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Seed data file not found at: ${jsonPath}`);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const items: ClosetItem[] = JSON.parse(rawData);

  console.log(`Read ${items.length} items from demo-closet.json`);
  console.log(`- Outfits: ${items.filter(i => i.category.startsWith('outfit_')).length}`);
  console.log(`- Makeup: ${items.filter(i => i.category === 'makeup').length}`);
  console.log(`- Skincare: ${items.filter(i => i.category === 'skincare').length}`);

  // Seed in-memory store
  inMemoryStore.setItems(items);
  console.log('✓ In-memory store successfully initialized with seed data.');

  // If Supabase is connected, seed into Supabase Postgres
  if (isSupabaseConfigured()) {
    console.log('Detected active Supabase configuration. Upserting into PostgreSQL...');
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      console.warn('Could not initialize Supabase server client.');
      return;
    }

    const { error } = await supabase.from('closet_items').upsert(items, { onConflict: 'id' });

    if (error) {
      console.error('Supabase seeding error:', error.message);
      throw error;
    }

    console.log('✓ Successfully seeded all items into Supabase `closet_items` table!');
  } else {
    console.log('ℹ Supabase not configured in .env.local — items loaded in local in-memory store.');
  }

  console.log('\n=========================================');
  console.log('Component 9 (Demo Closet) seeding COMPLETE!');
  console.log('=========================================\n');
}

seedDatabase().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
